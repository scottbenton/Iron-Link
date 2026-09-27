import { type TemplateField, binding, equals, field } from "./shared";

function conditionalFactionField(
  key: string,
  label: string,
  variants: { type: string; oracle: string; label?: string }[],
  helpText?: string,
): TemplateField {
  return field(key, label, {
    type: "oracleText",
    gmOnly: true,
    visible: false,
    helpText,
    rules: variants.map((variant) => ({
      conditions: [equals("factionType", variant.type)],
      visible: true,
      binding: binding(variant.oracle),
      ...(variant.label ? { label: variant.label } : {}),
    })),
  });
}

export function forgeFactions(): TemplateField[] {
  const prefix = "starforged/faction";
  return [
    field("factionType", "Faction Type", {
      type: "text",
      suggestions: ["Dominion", "Guild", "Fringe Group"],
      oracle: `${prefix}/type`,
    }),
    field("influence", "Influence", { oracle: `${prefix}/influence` }),
    conditionalFactionField(
      "focus",
      "Focus",
      [
        { type: "Dominion", oracle: `${prefix}/dominion` },
        { type: "Guild", oracle: `${prefix}/guild`, label: "Specialty" },
        {
          type: "Fringe Group",
          oracle: `${prefix}/fringe_group`,
          label: "Role",
        },
      ],
      "For a Dominion, roll one to three times to describe its focus.",
    ),
    conditionalFactionField("leadership", "Leadership", [
      { type: "Dominion", oracle: `${prefix}/dominion_leadership` },
    ]),
    field("projects", "Projects", {
      oracle: `${prefix}/projects`,
      gmOnly: true,
    }),
    field("relationships", "Relationships", {
      oracle: `${prefix}/relationships`,
      gmOnly: true,
      helpText:
        "Choose another faction before rolling, and record which faction the relationship describes.",
    }),
    field("quirks", "Quirks", { oracle: `${prefix}/quirks`, gmOnly: true }),
    field("rumors", "Rumors", { oracle: `${prefix}/rumors`, gmOnly: true }),
  ];
}

export function islesFactions(): TemplateField[] {
  const prefix = "sundered_isles/faction";
  return [
    field("factionType", "Faction Type", {
      type: "text",
      suggestions: ["Society", "Organization", "Empire", "The Cursed"],
      oracle: `${prefix}/type`,
      helpText:
        "On a cursed result, choose The Cursed or keep the faction's type and set Cursed to Yes.",
    }),
    field("influence", "Influence", { oracle: `${prefix}/influence` }),
    field("relationships", "Relationships", {
      oracle: `${prefix}/relationship`,
      gmOnly: true,
      helpText:
        "Choose another faction or individual before rolling, and record who the relationship describes.",
    }),
    conditionalFactionField("chronicles", "Chronicles", [
      { type: "Society", oracle: `${prefix}/society/chronicles` },
    ]),
    conditionalFactionField("leadership", "Leadership", [
      {
        type: "Society",
        oracle: `${prefix}/society/overseers`,
        label: "Overseers",
      },
      { type: "Empire", oracle: `${prefix}/empire/leadership` },
    ]),
    conditionalFactionField("touchstones", "Touchstones", [
      { type: "Society", oracle: `${prefix}/society/touchstones` },
    ]),
    conditionalFactionField("role", "Role", [
      { type: "Organization", oracle: `${prefix}/organization/type` },
      { type: "The Cursed", oracle: `${prefix}/cursed/role` },
    ]),
    conditionalFactionField("methods", "Methods", [
      { type: "Organization", oracle: `${prefix}/organization/methods` },
    ]),
    conditionalFactionField("secrets", "Secrets", [
      { type: "Organization", oracle: `${prefix}/organization/secrets` },
    ]),
    conditionalFactionField("tactics", "Tactics", [
      { type: "Empire", oracle: `${prefix}/empire/tactics` },
    ]),
    conditionalFactionField("vulnerabilities", "Vulnerabilities", [
      { type: "Empire", oracle: `${prefix}/empire/vulnerabilities` },
    ]),
    field("cursed", "Cursed", {
      suggestions: ["Yes", "No"],
      gmOnly: true,
      helpText:
        "Set Yes to add cursed aspects to any faction type. The Cursed always shows cursed aspects.",
    }),
    field("cursedAspects", "Cursed Aspects", {
      type: "oracleText",
      gmOnly: true,
      visible: false,
      rules: [
        {
          conditions: [equals("factionType", "The Cursed")],
          visible: true,
          binding: binding(`${prefix}/cursed/aspects`),
        },
        {
          conditions: [equals("cursed", "Yes")],
          visible: true,
          binding: binding(`${prefix}/cursed/aspects`),
        },
      ],
    }),
  ];
}
