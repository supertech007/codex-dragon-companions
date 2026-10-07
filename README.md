# Dragon Pets and Live Usage Companion

This project contains the animated pet artwork, sprite-production and QA artifacts, and a small local web companion for the three elemental dragons.

## Contents

- `work/Cinder-run/` — fire dragon source, animation rows, look-direction poses, previews, and validation artifacts. The final atlas is the installed pet **Sol**.
- `work/Tempest-run/` — thunder dragon artifacts. The final atlas is the installed pet **Astra**.
- `work/Rime-run/` — ice dragon artifacts. The final atlas is the installed pet **Luna**.
- `work/moki-run/` — Moki companion creation and QA artifacts.
- `live-dragon/` — local browser companion with animated dragon previews and five-hour/weekly remaining-usage rails.

The generated sprite strips, atlases, contact sheets, and animation previews are included so the creative source and review trail travel with the project.

## Run the live companion

Requires macOS with the Codex desktop app installed and Node.js. From `live-dragon/`, run:

```sh
node server.mjs
```

Open <http://127.0.0.1:4173>. The server reads the dragon atlases from this repository, polls the local Codex app-server for five-hour and weekly rate limits every 15 minutes, and offers manual refresh. It binds to localhost only. Stop it with Ctrl-C.

The Codex app-server interface is experimental and may change. This personal-use companion is separate from the built-in pet renderer, which accepts static sprite atlases and cannot display the live rails.

## Rights and publishing status

This repository is exported privately. No open-source license is included, so do not assume the contents are licensed for reuse. Before publishing or selling, review rights for every input/reference image and any third-party material, choose separate licenses for code and artwork, and avoid suggesting OpenAI/Codex endorsement. OpenAI's consumer terms say that, between you and OpenAI and to the extent permitted by law, you own generated Output; they also warn that similar output may be generated for others. This is not a guarantee of exclusivity or freedom from third-party claims.
