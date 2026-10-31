# mod-world-randomizer-website

The web pages of [mod-world-randomizer](https://github.com/TheSCREWEDSoftware/mod-world-randomizer), an AzerothCore
(WotLK 3.3.5) module that shuffles the world. Plain HTML and JavaScript, no build step.

## Use it

- **Online**: <https://thescrewedsoftware.github.io/mod-world-randomizer-website/>, nothing to install.
- **Locally, on its own**:

  ```sh
  git clone https://github.com/TheSCREWEDSoftware/mod-world-randomizer-website.git
  ```

  then open `index.html` in your browser.
- **Locally, with the module**: it is the module's `web/` folder (see [In the module](#in-the-module)).

## Pages

- `index.html`: character roller and picker, for one player or a party. Rules, bans, drafts, trades, codes that fit
  in the game's chat (`.randomizer roll <code> <player>` or the addon's "My roll"), start zones, links and files to
  share a party.
- `map.html`: the world map coloured by bracket, original or shuffled, for a seed, with the config lines for the
  server. The map pictures come from aowow (`../../static/images/wow/maps/enus/normal/` when the pages sit in
  `aowow/Stuff/randomizer/`); without them it shows the zone outlines on a plain background.
- `about.html`: what you need (AzerothCore and mod-world-randomizer on the server), what changes with
  [mod-dynamic-scaling](https://github.com/TheSCREWEDSoftware/mod-dynamic-scaling), and what the two addons do.
- `achievements.html`: every achievement the module gives, with its rewards, for Vanilla, TBC or Wrath content.
  `achievements.js` is written by the module's `tools/generate_achievements.py`.
- `config.html`: drop an old `.conf` of mod-world-randomizer or
  [mod-dynamic-scaling](https://github.com/TheSCREWEDSoftware/mod-dynamic-scaling) and get it back in the newest
  layout (your values kept, new settings added), plus the old file as a backup.

`randomizer.js` is the same shuffle as the module's `WorldRandomizer.cpp`, so a seed shows exactly the world the
server builds. Defaults for the roller are in `roller-config.js`.

## In the module

This repository is the module's `web/` folder, as a git submodule:

```sh
# A new clone of the module (in your AzerothCore modules folder):
git clone --recurse-submodules https://github.com/TheSCREWEDSoftware/mod-world-randomizer.git

# A clone you already have (empty web/ folder):
git submodule update --init --recursive

# Later, to get a newer website along with the module:
git pull --recurse-submodules
git submodule update --init --recursive
```

The config update page also serves
[mod-dynamic-scaling](https://github.com/TheSCREWEDSoftware/mod-dynamic-scaling).

Generated files come from the module's tools: `zones.js` from `tools/generate_from_aowow.py`, `achievements.js` from
`tools/generate_achievements.py` and `conf-templates.js` from `tools/make_conf_templates.py` (all write into
`web/`). Commit them here, then commit the new submodule commit in the module.

## Online

GitHub Pages serves this repository as it is: Settings > Pages > "Deploy from a branch", `main`, `/ (root)`.
`.nojekyll` makes it serve the files untouched.

## Credits

Based on [UncleChimpus](https://www.youtube.com/@UncleChimpuss/playlists)'s **HC Randomized WoW** series
([I Randomized All of WoW Classic. Then I Did Hardcore](https://youtu.be/JjyZIukvaHg) for the randomized world and
the achievements, [The World is Being Corrupted](https://www.youtube.com/watch?v=StYmBXcMWY8) for the achievement
rewards), recreated here for AzerothCore.

## Disclaimer

World of Warcraft, Warcraft and Blizzard Entertainment are trademarks or registered trademarks of Blizzard
Entertainment, Inc. The game's names, icons (`img/ach/`, from the game's files), images and map pictures belong to
Blizzard Entertainment; they are not ours and are used only to describe the game. This is a free, non-commercial fan
project, not made, endorsed or supported by Blizzard Entertainment. The license of this repository covers its own code
only, not Blizzard's assets.

## Made with

Made with the help of [Claude](https://claude.ai), Anthropic's AI assistant: written and reviewed together with it, then
tested and published by [Ryan Turner (TheSCREWEDSoftware)](https://github.com/TheSCREWEDSoftware).
