# Live Dragon Usage Companion

A local companion renderer for Sol, Astra, and Luna. It uses the v2 sprite atlases included in this repository and the authenticated local Codex app-server to display five-hour and weekly remaining usage.

## Run

```sh
node server.mjs
```

Open `http://127.0.0.1:4173`. The first account reading is requested at startup; subsequent readings are requested every 15 minutes. The page polls the local server for changes and offers a manual refresh button. Stop the companion with Ctrl-C.

This is separate from Codex's built-in pet picker. The installed pet format accepts only a static atlas and manifest, so this companion does not modify those packages. It uses `codex app-server`, which is experimental; run it locally for personal use and expect the integration to need adjustment if the app-server protocol changes.
