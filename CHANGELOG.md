![Changelog](./readme_assets/banner-changelog.png)

## Beta 0.3.0

## Beta 0.2.0 - The Playsets Update

### Features

- Added playsets, a new way to customize your game's rules. Hide moves, oracles, or assets you don't want to use.
- Added default playsets for Starforged + Sundered Isles for automatically showing & hiding the assets that are relevant to each.
- Added an option to automatically roll the cursed die to the playset settings.
- Added cursed die roll to oracle roll notifications and note embeds. 

### Changes

- Oracles with a cursed version now easily allow you to switch between them.

### Bug Fixes

- Fixed an issue where replacement moves (like `Repair` from Sundered Isles) were not properly overwriting their base moves.
- Fixed the Exploration Move Category appearing twice.
- Fixed a bug that prevented oracles added by assets and moves from being rolled.
- Fixed a bug that prevented moves added by assets from being added to the reference sidebar.

### Known Issues

- Found an issue where move enhancements (from assets, mainly) cannot be properly applied to the underlying move if it has been replaced by another [issue](https://github.com/scottbenton/Iron-Link/issues/117)