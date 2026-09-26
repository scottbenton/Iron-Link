import {
  type TemplateField,
  binding,
  equals,
  field,
  locationField,
  notes,
  pronouns,
  ranks,
  regionCondition,
} from "./shared";

const planetClasses = [
  "Desert",
  "Furnace",
  "Grave",
  "Ice",
  "Jovian",
  "Jungle",
  "Ocean",
  "Rocky",
  "Shattered",
  "Tainted",
  "Vital",
];
const regions = ["Terminus", "Outlands", "Expanse"];
const settlementTypes = ["Planetside Settlement", "Orbital Settlement"];
export function forgeLocations(): TemplateField[] {
  const fields = [
    field("locationType", "Location Type", {
      suggestions: [
        "Sector",
        "Planet",
        ...settlementTypes,
        "Star",
        "Derelict",
        "Vault",
      ],
    }),
    field("region", "Region", {
      suggestions: [...regions, "Void"],
      visible: false,
      rules: [
        { conditions: [equals("locationType", "Sector")], visible: true },
      ],
    }),
    locationField(
      "sectorTrouble",
      "Sector Trouble",
      ["Sector"],
      "starforged/launching_your_campaign/starting_sector/trouble",
    ),
    field("planetClass", "Planet Class", {
      suggestions: planetClasses.map((name) => `${name} World`),
      visible: false,
      rules: [
        { conditions: [equals("locationType", "Planet")], visible: true },
      ],
    }),
    field("planetDescription", "Description", {
      visible: false,
      rules: [
        { conditions: [equals("locationType", "Planet")], visible: true },
      ],
    }),
  ];
  for (const [key, label, path] of [
    ["planetFeature", "Feature", "feature"],
    ["planetAtmosphere", "Atmosphere", "atmosphere"],
    ["planetLife", "Life", "life"],
    ["planetObservedFromSpace", "Observed From Space", "observed_from_space"],
  ]) {
    const definition = locationField(key, label, ["Planet"]);
    definition.configuration.rules.unshift(
      ...planetClasses.map((name) => ({
        conditions: [
          equals("locationType", "Planet"),
          equals("planetClass", `${name} World`),
        ],
        visible: true,
        binding: binding(`starforged/planet/${name.toLowerCase()}/${path}`),
      })),
    );
    fields.push(definition);
  }
  const settlements = locationField("planetSettlements", "Settlements", [
    "Planet",
  ]);
  settlements.configuration.rules.unshift(
    ...planetClasses.flatMap((name) =>
      regions.map((region) => ({
        conditions: [
          equals("locationType", "Planet"),
          equals("planetClass", `${name} World`),
          regionCondition("Sector", region),
        ],
        visible: true,
        binding: binding(
          `starforged/planet/${name.toLowerCase()}/settlements/${region.toLowerCase()}`,
        ),
      })),
    ),
  );
  fields.push(settlements);
  for (const [key, label, path] of [
    ["settlementLocation", "Location", "location"],
    ["settlementFirstLook", "First Look", "first_look"],
    ["settlementInitialContact", "Initial Contact", "initial_contact"],
    ["settlementAuthority", "Authority", "authority"],
    ["settlementProjects", "Projects", "projects"],
    ["settlementTrouble", "Trouble", "trouble"],
  ])
    fields.push(
      locationField(
        key,
        label,
        settlementTypes,
        `starforged/settlement/${path}`,
      ),
    );
  const population = locationField(
    "settlementPopulation",
    "Population",
    settlementTypes,
  );
  population.configuration.rules.unshift(
    ...settlementTypes.flatMap((type) =>
      regions.map((region) => ({
        conditions: [
          equals("locationType", type),
          regionCondition("Sector", region),
        ],
        visible: true,
        binding: binding(
          `starforged/settlement/population/${region.toLowerCase()}`,
        ),
      })),
    ),
  );
  fields.push(population);
  const star = locationField(
    "starDescription",
    "Description",
    ["Star"],
    "starforged/space/stellar_object",
  );
  star.gm_only = false;
  fields.push(star);
  const derelictLocation = locationField(
    "derelictLocation",
    "Location",
    ["Derelict"],
    "starforged/derelict/location",
  );
  // This value drives Type: store plain text so conditions can inspect it.
  derelictLocation.type = "text" as TemplateField["type"];
  derelictLocation.configuration.suggestions = [
    "Planetside",
    "Orbital",
    "Deep Space",
  ];
  fields.push(derelictLocation);
  const derelictType = locationField("derelictType", "Type", ["Derelict"]);
  derelictType.configuration.rules.unshift(
    ...["Planetside", "Orbital", "Deep Space"].map((location) => ({
      conditions: [
        equals("locationType", "Derelict"),
        equals("derelictLocation", location),
      ],
      visible: true,
      binding: binding(
        `starforged/derelict/type/${location.toLowerCase().replace(/ /g, "_")}`,
      ),
    })),
  );
  fields.push(derelictType);
  for (const [key, label, path] of [
    ["derelictCondition", "Condition", "condition"],
    ["derelictOuterFirstLook", "Outer First Look", "outer_first_look"],
    ["derelictInnerFirstLook", "Inner First Look", "inner_first_look"],
  ])
    fields.push(
      locationField(key, label, ["Derelict"], `starforged/derelict/${path}`),
    );
  for (const [key, label, path] of [
    ["vaultLocation", "Location", "location"],
    ["vaultScale", "Scale", "scale"],
    ["vaultForm", "Form", "form"],
    ["vaultShape", "Shape", "shape"],
    ["vaultMaterial", "Material", "material"],
    ["vaultOuterFirstLook", "Outer First Look", "outer_first_look"],
    ["vaultInnerFirstLook", "Interior First Look", "interior/first_look"],
    ["vaultInnerFeature", "Interior Feature", "interior/feature"],
    ["vaultInnerPeril", "Interior Peril", "interior/peril"],
    ["vaultInnerOpportunity", "Interior Opportunity", "interior/opportunity"],
    ["vaultSanctumPurpose", "Sanctum Purpose", "sanctum/purpose"],
    ["vaultSanctumFeature", "Sanctum Feature", "sanctum/feature"],
    ["vaultSanctumPeril", "Sanctum Peril", "sanctum/peril"],
    ["vaultSanctumOpportunity", "Sanctum Opportunity", "sanctum/opportunity"],
  ])
    fields.push(
      locationField(
        key,
        label,
        ["Vault"],
        `starforged/precursor_vault/${path}`,
      ),
    );
  return [...fields, notes()];
}
export function forgeNpcs(): TemplateField[] {
  return [
    pronouns(),
    field("callsign", "Callsign", {
      oracle: "starforged/character/name/callsign",
    }),
    field("difficulty", "Difficulty", { suggestions: ranks }),
    ...[
      ["firstLook", "First Look", "first_look"],
      ["role", "Role", "role"],
      ["disposition", "Disposition", "initial_disposition"],
      ["goal", "Goal", "goal"],
      ["revealedAspect", "Revealed Aspect", "revealed_aspect"],
    ].map(([key, label, path]) =>
      field(key, label, {
        oracle: `starforged/character/${path}`,
        gmOnly: true,
      }),
    ),
    notes(),
  ];
}
