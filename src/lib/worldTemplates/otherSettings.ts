import {
  type TemplateField,
  binding,
  equals,
  field,
  locationField,
  mergeLocationFields,
  pronouns,
  regionCondition,
  tags,
} from "./shared";

export function ironlandsLocations(): TemplateField[] {
  return [
    field("locationType", "Location Type", {
      suggestions: ["Settlement", "Tower", "Ruin", "Camp"],
    }),
    field("description", "Description", {
      oracle: "classic/place/descriptor",
      gmOnly: true,
    }),
    field("trouble", "Trouble", {
      oracle: "classic/settlement/trouble",
      gmOnly: true,
    }),
    field("locationFeatures", "Location Features", {
      oracle: "classic/place/location",
      gmOnly: true,
    }),
  ];
}
export function ironlandsNpcs(): TemplateField[] {
  return [
    pronouns(),
    field("species", "Species", {
      suggestions: ["Human", "Elf", "Giant", "Varou", "Troll"],
    }),
    ...[
      ["descriptor", "Descriptor"],
      ["role", "Role"],
      ["goal", "Goal"],
    ].map(([key, label]) =>
      field(key, label, { oracle: `classic/character/${key}`, gmOnly: true }),
    ),
  ];
}
export function islesLocations(): TemplateField[] {
  const fields = [
    field("locationType", "Location Type", {
      suggestions: [
        "Area",
        "Island",
        "Settlement",
        "Shipwreck",
        "Cave",
        "Ruin",
      ],
    }),
    field("region", "Region", {
      suggestions: ["Myriads", "Margins", "Reaches"],
      visible: false,
      helpText:
        "Myriads (Central Seas), Margins (Outer Seas), Reaches (Remote Seas). Descendants use their nearest Area's Region.",
      rules: [{ conditions: [equals("locationType", "Area")], visible: true }],
    }),
  ];
  for (const [key, label, type, path] of [
    ["islandSize", "Size", "Island", "island/landscape/size"],
    ["islandTerrain", "Terrain", "Island", "island/landscape/terrain"],
    [
      "islandOffshoreObservations",
      "Offshore Observations",
      "Island",
      "island/offshore_observations",
    ],
    ["settlementLocation", "Location", "Settlement", "settlement/location"],
    [
      "settlementFirstLook",
      "First Look",
      "Settlement",
      "settlement/first_look",
    ],
    ["settlementDetails", "Details", "Settlement", "settlement/details"],
    ["shipwreckLocation", "Location", "Shipwreck", "shipwreck/location"],
    ["shipwreckFirstLook", "First Look", "Shipwreck", "shipwreck/first_look"],
    ["shipwreckDetails", "Details", "Shipwreck", "shipwreck/details"],
    ["caveType", "Cave Type", "Cave", "cave/type"],
    ["caveThreshold", "Threshold", "Cave", "cave/threshold"],
    ["caveLurkingThreat", "Lurking Threat", "Cave", "cave/lurking_threat"],
    ["ruinLocation", "Location", "Ruin", "ruin/location"],
    ["ruinFirstLook", "First Look", "Ruin", "ruin/first_look"],
    ["ruinCondition", "Condition", "Ruin", "ruin/condition"],
  ])
    fields.push(locationField(key, label, [type], `sundered_isles/${path}`));
  for (const [key, label, type, path] of [
    ["islandVitality", "Vitality", "Island", "island/landscape/vitality"],
    ["settlementSize", "Size", "Settlement", "settlement/size"],
  ]) {
    const definition = locationField(key, label, [type]);
    definition.configuration.rules.unshift(
      ...["Myriads", "Margins", "Reaches"].map((region) => ({
        conditions: [
          equals("locationType", type),
          regionCondition("Area", region),
        ],
        visible: true,
        binding: binding(`sundered_isles/${path}/${region.toLowerCase()}`),
      })),
    );
    fields.push(definition);
  }
  return mergeLocationFields(fields, [
    ["settlementLocation", "shipwreckLocation", "ruinLocation"],
    ["settlementFirstLook", "shipwreckFirstLook", "ruinFirstLook"],
    ["settlementDetails", "shipwreckDetails"],
    ["islandSize", "settlementSize"],
  ]);
}
export function islesNpcs(): TemplateField[] {
  return [
    pronouns(),
    ...[
      ["firstLook", "First Look", "first_look"],
      ["role", "Role", "roles"],
      ["disposition", "Disposition", "disposition"],
      ["goal", "Goal", "goals"],
    ].map(([key, label, path]) =>
      field(key, label, {
        oracle: `sundered_isles/character/${path}`,
        gmOnly: true,
      }),
    ),
  ];
}
export function elegyLocations(): TemplateField[] {
  return [
    field("locationType", "Location Type"),
    tags(),
    field("description", "Description", {
      oracle: "elegy/text/generic",
      gmOnly: true,
    }),
  ];
}
export function elegyNpcs(): TemplateField[] {
  return [
    pronouns(),
    tags(),
    ...[
      ["traits", "Traits"],
      ["occupation", "Occupation"],
      ["goal", "Goal"],
      ["disposition", "Disposition"],
    ].map(([key, label]) =>
      field(key, label, { oracle: `elegy/character/${key}`, gmOnly: true }),
    ),
  ];
}
