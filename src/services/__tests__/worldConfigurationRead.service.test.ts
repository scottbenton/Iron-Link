import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorldConfigurationReadRepository } from "repositories/worldConfigurationRead.repository";

import { WorldConfigurationReadService } from "../worldConfigurationRead.service";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

beforeEach(() => vi.restoreAllMocks());

describe("WorldConfigurationReadService", () => {
  it("maps one database snapshot into categories and linked fields", async () => {
    vi.spyOn(
      WorldConfigurationReadRepository,
      "getWorldConfiguration",
    ).mockResolvedValue({
      configuration_customized: false,
      categories: [
        {
          id: "locations",
          world_id: "world",
          name: "Locations",
          icon: { key: "GiWorld", color: "green" },
          sort_order: 0,
          supports_hierarchy: true,
          supports_map: true,
          supports_bonds: true,
          subtitle_field_definition_id: null,
        },
      ],
      field_definitions: [
        {
          id: "location",
          world_id: "world",
          category_id: "locations",
          key: "location",
          label: "Location",
          type: "categorySelect",
          binding: null,
          configuration: {
            version: 1,
            suggestions: [],
            targetCategoryId: "09c0d230-3f90-4acb-a407-c8b99e074a2c",
            helpText: "",
            visible: true,
            rules: [],
          },
          gm_only: false,
          sort_order: 0,
        },
      ],
    });
    const result =
      await WorldConfigurationReadService.getWorldConfiguration("world");
    expect(result).toMatchObject({
      configurationCustomized: false,
      categories: {
        locations: { worldId: "world", icon: { key: "GiWorld" } },
      },
      fieldDefinitions: {
        location: {
          categoryId: "locations",
          type: "categorySelect",
          configuration: {
            targetCategoryId: "09c0d230-3f90-4acb-a407-c8b99e074a2c",
          },
        },
      },
    });
  });
});
