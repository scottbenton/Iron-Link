// Generates a transaction-scoped SQL integration test from the actual client
// manifests. Pipe stdout into psql against a migrated development/test database.
// Example: node supabase/tests/generate-template-manifest-test.mjs > /tmp/w4.sql
import { build } from "esbuild";
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
select plan(10);
insert into auth.users(id) values ('f1000000-0000-0000-0000-000000000001');
set local role authenticated;
select set_config('request.jwt.claim.sub','f1000000-0000-0000-0000-000000000001',true);
create temporary table manifest_world(id uuid);`);
  for (const setting of settings) {
    const manifest = buildWorldTemplate(setting);
    const sql = `insert into manifest_world values (public.create_world_with_template('Manifest test',null,${setting ? quote(setting) : "null"},${quote(JSON.stringify(manifest))}::jsonb))`;
    console.log(`truncate manifest_world;
select lives_ok(${quote(sql)}, ${quote(`${setting ?? "blank"} client manifest seeds`)});
select is((select count(*) from public.world_field_definitions where world_id=(select id from manifest_world)),${manifest.categories.reduce((count, category) => count + category.fields.length, 0)}::bigint,${quote(`${setting ?? "blank"} preserves every field`)});`);
  }
  console.log("select * from finish(); rollback;");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
