import deepEqual from "fast-deep-equal";
import { createWithEqualityFn } from "zustand/traditional";

import type { LinkedGamePlayset } from "lib/effectivePlayset";
import {
  type WorldOracleCatalog,
  getBindingPackageIds,
  loadWorldOracleCatalog,
} from "lib/worldOracleCatalog";

import { WorldPlaysetsRepository } from "repositories/worldPlaysets.repository";

import { WorldConfigurationReadService } from "services/worldConfigurationRead.service";
import type { OracleBinding } from "services/worldFieldDefinitions.service";
import type { IWorld } from "services/worlds.service";

import { useWorldCategoriesStore } from "./worldCategories.store";

interface WorldResourcesState {
  worldId: string;
  catalog: WorldOracleCatalog | null;
  loading: boolean;
  error?: string;
  allPackages: boolean;
}
interface WorldResourcesActions {
  observeWorld: (worldId: string) => {
    receiveWorld: (world: IWorld) => void;
    stop: () => void;
  };
  refresh: (worldId: string) => void;
  setAllPackages: (worldId: string, value: boolean) => void;
}

const initialState: WorldResourcesState = {
  worldId: "",
  catalog: null,
  loading: true,
  allPackages: false,
};

/** Owns one world's configuration and oracle catalog for its world subscription. */
export const useWorldResourcesStore = createWithEqualityFn<
  WorldResourcesState & WorldResourcesActions
>()((set, get) => {
  type Session = {
    worldId: string;
    world?: IWorld;
    request?: object;
    refreshing: boolean;
    linkedGames?: LinkedGamePlayset[];
    packageIds: string[];
    stopCategories: () => void;
    stopChanges: () => void;
  };
  let current: Session | undefined;
  const categories = () => useWorldCategoriesStore.getState();
  const bindings = (session: Session): OracleBinding[] => {
    const configuration = categories();
    return Object.values(
      configuration.configurationCustomized
        ? configuration.fieldDefinitions
        : configuration.sourceFieldDefinitions,
    )
      .filter((field) => field.worldId === session.worldId)
      .flatMap((field) => [
        field.binding,
        ...field.configuration.rules.map((rule) => rule.binding),
      ])
      .filter((binding): binding is OracleBinding => !!binding);
  };
  const bindingPackages = (session: Session) =>
    getBindingPackageIds(bindings(session)).sort();
  const isCurrent = (session: Session, request: object) =>
    current === session && session.request === request;
  const beginRequest = (session: Session) => {
    const request = {};
    session.request = request;
    session.refreshing = true;
    categories().invalidateDefaultBindings(session.worldId);
    set({ loading: true, error: undefined });
    return request;
  };
  const fail = (session: Session, request: object, cause: unknown) => {
    if (!isCurrent(session, request)) return;
    session.linkedGames = undefined;
    const error =
      cause instanceof Error
        ? cause.message
        : "Could not load world configuration and oracles. Please retry.";
    categories().setConfigurationError(session.worldId, error);
    set({ catalog: null, loading: false, error });
    session.refreshing = false;
  };
  const loadCatalog = async (session: Session, request: object) => {
    // Changes made while package loading is in flight use the same request;
    // repeat only the package load when its inputs have actually changed.
    while (
      isCurrent(session, request) &&
      session.world &&
      session.linkedGames
    ) {
      const packageIds = bindingPackages(session);
      const allPackages = get().allPackages;
      const catalog = await loadWorldOracleCatalog({
        settingKey: session.world.settingKey,
        linkedGames: session.linkedGames,
        bindings: bindings(session),
        allPackages,
      });
      if (!isCurrent(session, request)) return;
      if (
        allPackages !== get().allPackages ||
        !deepEqual(packageIds, bindingPackages(session))
      )
        continue;
      session.packageIds = packageIds;
      categories().applyDefaultReplacementMap(
        session.worldId,
        catalog.replacementMap,
      );
      session.refreshing = false;
      set({ catalog, loading: false, error: undefined });
      return;
    }
  };
  const rebuildCatalog = (session: Session) => {
    if (session.refreshing || !session.linkedGames || !session.world) return;
    const request = beginRequest(session);
    void loadCatalog(session, request).catch((cause) =>
      fail(session, request, cause),
    );
  };
  const customize = (session: Session) => {
    if (categories().configurationCustomized) return;
    session.stopCategories();
    session.stopCategories = categories().listenToWorldCategories({
      id: session.worldId,
      settingKey: session.world?.settingKey ?? null,
      configurationCustomized: true,
    });
  };
  const refresh = (session: Session) => {
    if (!session.world) return;
    // Cached playsets are reusable only with a successfully refreshed snapshot.
    // A failed authoritative refresh must keep the first edit blocked.
    session.linkedGames = undefined;
    const request = beginRequest(session);
    void Promise.all([
      WorldConfigurationReadService.getWorldConfiguration(session.worldId),
      WorldPlaysetsRepository.getLinkedGamePlaysets(session.worldId),
    ])
      .then(async ([snapshot, linkedGames]) => {
        if (!isCurrent(session, request)) return;
        // A fresh configuration snapshot can precede the world row's first-edit
        // event. Once customized, a delayed inherited row cannot undo it.
        if (snapshot.configurationCustomized) customize(session);
        else
          categories().acceptConfigurationSnapshot(session.worldId, snapshot);
        session.linkedGames = linkedGames;
        await loadCatalog(session, request);
      })
      .catch((cause) => fail(session, request, cause));
  };
  return {
    ...initialState,
    observeWorld: (worldId) => {
      current?.stopChanges();
      current?.stopCategories();
      const session: Session = {
        worldId,
        refreshing: false,
        packageIds: [],
        stopCategories: categories().listenToWorldCategories({
          id: worldId,
          settingKey: null,
          configurationCustomized: false,
        }),
        stopChanges: () => {},
      };
      current = session;
      set({ ...initialState, worldId });
      session.stopChanges = useWorldCategoriesStore.subscribe(() => {
        if (
          current === session &&
          categories().worldId === worldId &&
          categories().configurationLoaded &&
          !deepEqual(session.packageIds, bindingPackages(session))
        )
          rebuildCatalog(session);
      });
      return {
        receiveWorld: (world) => {
          if (current !== session || world.id !== worldId) return;
          session.world = world;
          if (world.configurationCustomized) customize(session);
          // Called for every accepted initial/realtime/reconnect delivery,
          // including a reconnect snapshot identical to the prior world row.
          refresh(session);
        },
        stop: () => {
          if (current !== session) return;
          current = undefined;
          session.stopChanges();
          session.stopCategories();
          categories().reset();
          set(initialState);
        },
      };
    },
    refresh: (worldId) => {
      if (current?.worldId === worldId) refresh(current);
    },
    setAllPackages: (worldId, allPackages) => {
      if (current?.worldId !== worldId || get().allPackages === allPackages)
        return;
      set({ allPackages });
      rebuildCatalog(current);
    },
  };
}, deepEqual);
