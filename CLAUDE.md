# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Vite dev server
- `npm run build` - Type check, run tests, and build for production
- `npm run tsc` - Type check only
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Run ESLint fix and Prettier

### Supabase Local Development
- `npm run supabase:start` - Start local Supabase instance
- `npm run supabase:stop` - Stop local Supabase instance
- `npm run supabase:reset-db` - Reset local database
- `npm run supabase:gen-types` - Generate TypeScript types from database schema
- `npm run supabase:create-db-script` - Create database migration script
- `npm run supabase:serve-functions` - Serve edge functions locally

Local Supabase runs on:
- API: http://127.0.0.1:54321
- Studio: http://127.0.0.1:54323
- Database: localhost:54322

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **UI Framework**: Material-UI v7 with Pigment CSS
- **State Management**: Zustand with Immer middleware
- **Rich Text Editing**: Tiptap with collaborative editing (Yjs + WebRTC)
- **Routing**: React Router v7
- **Testing**: Vitest + Testing Library
- **Game Data**: Datasworn packages for Ironsworn/Starforged RPG content

### Core Application Structure

This is a tabletop RPG companion app for Ironsworn and Starforged games, featuring:

#### **Game Session Management**
- Multi-character campaigns with shared assets and tracks
- Real-time collaboration through Supabase realtime subscriptions
- Cloud sync across devices with offline support

#### **Character Sheets**
- Dynamic character sheets that adapt to different rulesets (Ironsworn, Starforged, Delve, Sundered Isles)
- Asset management with customizable fields and abilities
- Progress tracking for bonds, quests, and other narrative elements

#### **Datasworn Integration**
- Lazy-loaded game content packages from `@datasworn/*` libraries
- Configurable rulesets and expansions via `src/data/datasworn.packages.ts`
- Oracle tables and move references for gameplay assistance

### Key Directories

- `src/pages/games/` - Game session pages (overview, character sheets, creation)
- `src/components/datasworn/` - Reusable components for game content (moves, oracles, assets)
- `src/stores/` - Zustand stores for state management, organized by domain
- `src/services/` - API layer for Supabase interactions
- `src/repositories/` - Data access layer
- `supabase/` - Database schema, migrations, and edge functions

### State Management Patterns

Uses Zustand with Immer for immutable updates. Key stores:
- `auth.store.ts` - Authentication and user session
- `game.store.ts` - Current game session data
- `character.store.ts` - Character sheet data
- `dataswornTree.store.ts` - Game content and rulesets
- `gameLog.store.ts` - Session activity log

### Real-time Collaboration

Built on Supabase realtime for:
- Shared game sessions with multiple players
- Live character sheet updates
- Collaborative rich text editing in notes
- Activity logging and dice roll sharing

### Content Loading Strategy

Datasworn packages are loaded asynchronously via `DataswornLoader` component to avoid blocking initial app load. Game content is loaded on-demand based on active rulesets.
