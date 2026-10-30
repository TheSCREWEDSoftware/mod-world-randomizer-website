# mod-world-randomizer-website

The web pages of [mod-world-randomizer](https://github.com/TheSCREWEDSoftware/mod-world-randomizer), an AzerothCore
(WotLK 3.3.5) module that shuffles the world. Plain HTML and JavaScript, no build step: open `index.html`, or use
them online at <https://thescrewedsoftware.github.io/mod-world-randomizer-website/>.

- `index.html`: character roller and picker, for one player or a party. Rules, bans, drafts, trades, codes that fit
  in the game's chat (`.randomizer roll <code> <player>` or the addon's "My roll"), start zones, links and files to
  share a party.
- `map.html`: the world map coloured by bracket, original or shuffled, for a seed, with the config lines for the
  server. The map pictures come from aowow (`../../static/images/wow/maps/enus/normal/` when the pages sit in
  `aowow/Stuff/randomizer/`); without them it shows the zone outlines on a plain background.
- `config.html`: drop an old `.conf` of mod-world-randomizer or mod-dynamic-scaling and get it back in the newest
  layout (your values kept, new settings added), plus the old file as a backup.

`randomizer.js` is the same shuffle as the module's `WorldRandomizer.cpp`, so a seed shows exactly the world the
server builds. Defaults for the roller are in `roller-config.js`.

## In the module

This repository is the module's `web/` folder, as a git submodule:

```sh
git clone --recursive https://github.com/TheSCREWEDSoftware/mod-world-randomizer.git
# or, in a clone made without --recursive:
git submodule update --init
```

Generated files come from the module's tools: `zones.js` from `tools/generate_from_aowow.py` and
`conf-templates.js` from `tools/make_conf_templates.py` (both write into `web/`). Commit them here, then commit the
new submodule commit in the module.

## Online

GitHub Pages serves this repository as it is: Settings > Pages > "Deploy from a branch", `main`, `/ (root)`.
`.nojekyll` makes it serve the files untouched.
