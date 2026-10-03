import {
  type Datasworn,
  IdParser,
  type StringId,
} from "@datasworn-community/core";

import type {
  WorldOracleCatalog,
  WorldOracleChoice,
} from "./worldOracleCatalog";
import { getWorldOracleChoices } from "./worldOracleCatalog";

export interface WorldOracleTreeItem {
  id: string;
  label: string;
  choice?: WorldOracleChoice;
  children?: WorldOracleTreeItem[];
}

type CollectionNode = {
  definition: Datasworn.OracleCollection;
  children: Set<string>;
  choices: Map<string, WorldOracleChoice>;
};

/** A presentation tree only: raw oracle identities and pinned bindings stay intact. */
export function buildWorldOracleTree(
  catalog: WorldOracleCatalog,
  allPackages = false,
  exact = false,
): WorldOracleTreeItem[] {
  const choices = new Map(
    getWorldOracleChoices(catalog, allPackages, exact).map((choice) => [
      choice.id,
      choice,
    ]),
  );
  const collections = new Map<string, CollectionNode>();
  const groups = new Map<string, { label: string; roots: Set<string> }>();
  const visit = (definition: Datasworn.OracleCollection): void => {
    const children =
      "collections" in definition
        ? Object.values(definition.collections ?? {})
        : [];
    collections.set(definition._id, {
      definition,
      children: new Set(children.map((child) => child._id)),
      choices: new Map(
        Object.values(definition.contents ?? {}).flatMap((oracle) => {
          const choice = choices.get(oracle._id);
          return choice ? [[choice.id, choice] as const] : [];
        }),
      ),
    });
    children.forEach(visit);
  };
  Object.entries(catalog.tree).forEach(([packageId, rulesPackage]) => {
    if (
      !allPackages &&
      !catalog.effectivePlayset.packageIds.includes(packageId)
    )
      return;
    const rulesetId =
      rulesPackage.type === "expansion" ? rulesPackage.ruleset : packageId;
    const group = groups.get(rulesetId) ?? {
      label: catalog.tree[rulesetId]?.title ?? rulesPackage.title ?? rulesetId,
      roots: new Set<string>(),
    };
    for (const collection of Object.values(rulesPackage.oracles ?? {})) {
      visit(collection);
      group.roots.add(collection._id);
    }
    groups.set(rulesetId, group);
  });

  const hidden = new Set<string>();
  const incoming = new Map<string, string[]>();
  if (!exact) {
    // Resolve against the explicit world tree. Never assign IdParser.tree or mutate packages.
    const matches = (patterns: string[] | undefined): string[] =>
      (patterns ?? []).flatMap((pattern) => {
        try {
          return [
            ...IdParser.getMatches(
              pattern as StringId.Primary,
              catalog.tree,
            ).values(),
          ]
            .filter((match) => match.type === "oracle_collection")
            .map((match) => match._id);
        } catch {
          return [];
        }
      });
    const enhancements = [...collections].flatMap(([id, node]) =>
      matches(node.definition.enhances)
        .filter((target) => target !== id && collections.has(target))
        .map((target) => ({ id, target })),
    );
    const originalIncoming = new Map<string, string[]>();
    enhancements.forEach(({ id, target }) => {
      originalIncoming.set(target, [
        ...(originalIncoming.get(target) ?? []),
        id,
      ]);
    });
    const hasChoices = (id: string, seen = new Set<string>()): boolean => {
      if (seen.has(id)) return false;
      seen.add(id);
      const node = collections.get(id);
      return (
        !!node &&
        (node.choices.size > 0 ||
          [...node.children, ...(originalIncoming.get(id) ?? [])].some(
            (child) => hasChoices(child, seen),
          ))
      );
    };
    const aliases = new Map<string, string>();
    for (const [id, node] of [...collections].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (!hasChoices(id)) continue;
      matches(node.definition.replaces).forEach((target) => {
        if (target === id || aliases.has(target)) return;
        aliases.set(target, id);
        hidden.add(target);
      });
    }
    const resolveAlias = (id: string): string => {
      const seen = new Set<string>();
      while (aliases.has(id) && !seen.has(id)) {
        seen.add(id);
        id = aliases.get(id)!;
      }
      return id;
    };
    enhancements.forEach(({ id, target }) => {
      const destination = resolveAlias(target);
      const source = resolveAlias(id);
      if (destination === source || !hasChoices(source)) return;
      incoming.set(destination, [...(incoming.get(destination) ?? []), source]);
      hidden.add(source);
    });
  }

  // Gather enhancements recursively, so B -> A -> base works in any package order.
  const aggregate = (
    id: string,
    ancestors = new Set<string>(),
  ): {
    children: Set<string>;
    choices: Map<string, WorldOracleChoice>;
  } => {
    const node = collections.get(id);
    if (!node || ancestors.has(id))
      return { children: new Set(), choices: new Map() };
    const next = new Set(ancestors).add(id);
    const result = {
      children: new Set(node.children),
      choices: new Map(node.choices),
    };
    for (const source of incoming.get(id) ?? []) {
      const enhancement = aggregate(source, next);
      enhancement.children.forEach((child) => result.children.add(child));
      enhancement.choices.forEach((choice, key) =>
        result.choices.set(key, choice),
      );
    }
    return result;
  };

  const emitted = new Set<string>();
  const render = (
    id: string,
    ancestors = new Set<string>(),
  ): WorldOracleTreeItem | null => {
    const node = collections.get(id);
    if (!node || hidden.has(id) || ancestors.has(id)) return null;
    const next = new Set(ancestors).add(id);
    const contents = aggregate(id);
    const children: WorldOracleTreeItem[] = [...contents.children].flatMap(
      (childId) => {
        const child = render(childId, next);
        return child ? [child] : [];
      },
    );
    for (const choice of contents.choices.values()) {
      if (emitted.has(choice.id)) continue;
      emitted.add(choice.id);
      children.push({
        id: choice.id,
        label: choice.oracle.name ?? choice.label,
        choice,
      });
    }
    if (!children.length) return null;
    return {
      id,
      label: node.definition.name ?? id,
      children: children.sort((a, b) => a.label.localeCompare(b.label)),
    };
  };
  return [...groups]
    .flatMap(([id, group]) => {
      const children = [...group.roots].flatMap((rootId) => {
        const item = render(rootId);
        return item ? [item] : [];
      });
      return children.length
        ? [
            {
              id: `ruleset:${id}`,
              label: group.label,
              children: children.sort((a, b) => a.label.localeCompare(b.label)),
            },
          ]
        : [];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function filterWorldOracleTree(
  items: WorldOracleTreeItem[],
  search: string,
): WorldOracleTreeItem[] {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return items;
  return items.flatMap((item) => {
    if (item.label.toLocaleLowerCase().includes(query)) return [item];
    const children = filterWorldOracleTree(item.children ?? [], query);
    return children.length ? [{ ...item, children }] : [];
  });
}
