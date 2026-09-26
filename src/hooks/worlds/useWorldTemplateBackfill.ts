import { useEffect, useRef, useState } from "react";

import { useWorldOracleContext } from "components/worlds/worldOracleContext";

import { useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { buildWorldTemplate } from "lib/worldTemplates";

import { isGuideEquivalent } from "repositories/shared.types";
import { WorldTemplatesRepository } from "repositories/worldTemplates.repository";

export function useWorldTemplateBackfill(worldId: string) {
  const context = useWorldOracleContext(worldId);
  const world = useWorldStore((store) => store.world);
  const permission = useWorldStore((store) => store.worldPermission);
  const categories = useWorldCategoriesStore((store) => store.categories);
  const loadedWorldId = useWorldCategoriesStore((store) => store.worldId);
  const categoriesLoading = useWorldCategoriesStore((store) => store.loading);
  const categoriesError = useWorldCategoriesStore((store) => store.error);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    loading: boolean;
    error?: string;
  }>();
  const attempted = useRef(new Set<string>());
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const key = `${worldId}:${revision}`;
  const currentKey = useRef(key);
  currentKey.current = key;
  const eligible =
    world?.id === worldId &&
    loadedWorldId === worldId &&
    !categoriesLoading &&
    !categoriesError &&
    !!permission &&
    isGuideEquivalent(permission) &&
    !Object.values(categories).some((category) => category.worldId === worldId);

  useEffect(() => {
    if (
      !eligible ||
      !world ||
      !context.catalog ||
      context.loading ||
      context.error ||
      attempted.current.has(key)
    )
      return;
    attempted.current.add(key);
    setResult({ key, loading: true });
    WorldTemplatesRepository.seedWorld(
      worldId,
      buildWorldTemplate(world.settingKey, context.catalog.replacementMap),
    )
      .then(() => {
        if (alive.current && currentKey.current === key)
          setResult({ key, loading: false });
      })
      .catch((cause) => {
        if (alive.current && currentKey.current === key)
          setResult({
            key,
            loading: false,
            error:
              cause instanceof Error
                ? cause.message
                : "Could not prepare this world's categories. Please retry.",
          });
      });
  }, [
    eligible,
    world,
    context.catalog,
    context.loading,
    context.error,
    key,
    worldId,
  ]);

  return {
    loading:
      (eligible && context.loading) || (result?.key === key && result.loading),
    error:
      eligible && context.error
        ? context.error
        : result?.key === key
          ? result.error
          : undefined,
    retry: () => {
      setRevision((value) => value + 1);
      if (context.error) context.retry();
    },
  };
}
