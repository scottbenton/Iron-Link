# PostHog source maps for Cloudflare Pages

This repo uploads PostHog source maps from the Cloudflare Pages build, not from GitHub Actions.

The build flow is:

1. Vite builds the frontend into `dist/` with source maps enabled.
2. On Cloudflare production builds only (`CF_PAGES_BRANCH=main`), the build script injects PostHog metadata into `dist/`.
3. The same script uploads the source maps to PostHog and deletes the local `.map` files after upload.
4. Cloudflare deploys the injected files from `dist/`.

## What to change and where

1. In PostHog, create or confirm the project you want to receive the source maps.

2. In PostHog, create a personal API key with the error tracking write and organization read scopes.

3. In Cloudflare Pages, add these production-only environment variables:

   - `POSTHOG_CLI_PROJECT_ID`
   - `POSTHOG_CLI_API_KEY`
   - `POSTHOG_CLI_HOST` if you are not using the default PostHog region

4. Set the Cloudflare build command to:

   ```bash
   npm run build:cloudflare
   ```

5. Leave GitHub Actions as-is. The existing workflows remain Supabase-only and do not upload PostHog assets.

## Repository changes that support this

- `vite.config.ts` enables `build.sourcemap: true` so `dist/` includes the maps Cloudflare needs to upload.
- `scripts/build-cloudflare.sh` runs the build, skips PostHog on non-`main` branches, and uploads on `main`.
- `package.json` includes `build:cloudflare` as a local shortcut for the same script.

## Main-only behavior

The script checks `CF_PAGES_BRANCH` after the build finishes:

- if the branch is not `main`, it exits successfully without touching PostHog
- if the branch is `main`, it requires:

  - `CF_PAGES_COMMIT_SHA`
  - `POSTHOG_CLI_PROJECT_ID`
  - `POSTHOG_CLI_API_KEY`

  and then runs:

  ```bash
  ./node_modules/.bin/posthog-cli sourcemap inject --directory dist
  ./node_modules/.bin/posthog-cli sourcemap upload --directory dist --release-name iron-link-web --release-version "$CF_PAGES_COMMIT_SHA" --delete-after
  ```

## Verification

After a production deploy, check two things:

1. In PostHog, confirm the new symbol set/source map upload exists for the release version that matches `CF_PAGES_COMMIT_SHA`.
2. In the deployed JavaScript, confirm the injected `//# chunkId=...` metadata is present.

If those two checks pass, PostHog can match runtime errors back to the uploaded source maps.

## Rollback

If you need to disable source map publishing, the smallest rollback is:

1. remove the Cloudflare production-only `POSTHOG_CLI_*` variables
2. change the Cloudflare build command back to the plain frontend build
3. redeploy

If you want to fully undo the code change, revert the `vite.config.ts`, `package.json`, and `scripts/build-cloudflare.sh` changes together.
