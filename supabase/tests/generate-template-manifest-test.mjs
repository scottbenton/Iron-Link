// Generates a transaction-scoped SQL integration test from the actual client
// manifests. Pipe stdout into psql against a migrated development/test database.
// Example: node supabase/tests/generate-template-manifest-test.mjs > /tmp/w4.sql
import { build } from "esbuild";
import { v5 as uuid } from "uuid";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), "iron-link-w4-manifests-"));
try {
  const outfile = path.join(temporary, "worldTemplates.mjs");
  await build({
    absWorkingDir: root,
    entryPoints: ["src/lib/worldTemplates.ts"],
    tsconfig: "tsconfig.app.json",
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
  });
  const { buildWorldTemplate } = await import(pathToFileURL(outfile));
  const settings = [
    null,
    "world:classic/ironlands",
    "world:starforged/forge",
    "world:sundered_isles/sundered_isles",
    "world:elegy/santa_maria",
  ];
  const quote = (value) => `'${value.replaceAll("'", "''")}'`;
  console.log(`begin;
create extension if not exists pgtap with schema extensions;
set search_path=public,extensions;
select plan(15);
insert into auth.users(id) values ('f1000000-0000-0000-0000-000000000001');`);
  for (const setting of settings) {
    const worldId = uuid(setting ?? "blank", "f1000000-0000-4000-8000-000000000001");
    const manifest = buildWorldTemplate(setting, worldId);
    console.log(`select is(public.w4_static_world_template('${worldId}',${setting ? quote(setting) : "null"}),
 ${quote(JSON.stringify(manifest))}::jsonb,${quote(`${setting ?? "blank"} server defaults exactly match client`)});
insert into public.worlds(id,name,created_by,setting_key) values ('${worldId}','Manifest test','f1000000-0000-0000-0000-000000000001',${setting ? quote(setting) : "null"});
insert into public.world_players(world_id,user_id,role) values ('${worldId}','f1000000-0000-0000-0000-000000000001','owner');
set local role authenticated;
select set_config('request.jwt.claim.sub','f1000000-0000-0000-0000-000000000001',true);`);
    const operation = { type: "update_category", id: manifest.categories[0].id, changes: { name: "Custom locations" } };
    const sql = `select public.mutate_world_configuration('${worldId}',${quote(JSON.stringify(operation))}::jsonb)`;
    console.log(`select lives_ok(${quote(sql)}, ${quote(`${setting ?? "blank"} materializes atomically`)});
select is((select count(*) from public.world_field_definitions where world_id='${worldId}'),${manifest.categories.reduce((count, category) => count + category.fields.length, 0)}::bigint,${quote(`${setting ?? "blank"} preserves every field`)});
reset role;`);
  }
  console.log("select * from finish(); rollback;");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
