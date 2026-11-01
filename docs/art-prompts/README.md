# Paradise Lost — complete image prompt catalog

2026-10-31. Prompt specifications only: no images generated, no approved identity/reference links invented, no master bytes changed.

This catalog covers every currently coded art family plus every explicitly requested expansion family. Open-ended requests (more crops, animals, recipes, clothing and instruments) cannot yield a final image count until those rosters are chosen. They have explicit blocked templates here, not invented species or characters. Additional furniture/park/equipment designs are clearly proposed candidates.

## How to use

Every prompt below stands alone and is also available in an individual .txt file and prompts.jsonl. Pick one style and one frame at a time. Both pixel and storybook are included because the current game supports both; this is not a requirement to generate both before reviewing the art direction.

Statuses:
- code-defined-placeholder: object/frame contract exists in game code; it is not an approval of its appearance.
- proposed-design: ready for concept exploration; final footprints, proportions and designs require review.
- needs-content-decision: replace bracketed roster/design variables before generation.
- needs-approved-identity / needs-approved-symbol-reference / needs-approved-base-asset: resolve and verify the actual reference first. Job IDs here are production labels, never canonical entity IDs.
- code-native-spec: UI symbol brief; prefer SVG/CSS over generated raster art.

Use the built-in image generation tool for raster jobs, one asset/state per call, with transparent_background=true for cutouts. No API key or CLI batch execution is requested by these files. A JSONL file here is a neutral prompt catalog, not permission to spend API credits or a claim of CLI compatibility.

Do not submit blocked prompts unchanged. Do not infer missing identities from filenames. Resolve approved reference IDs through the project's reference system and verify the creative registry before attaching named character/symbol references. No references have been selected by this catalog.

Existing frame semantics matter: salvage r0/r1 means fuller/depleted, weeds r0/r1/r2 means coverage, debris frames mean repair stages, crop s0–s3 means growth. These are not all rotations. Future variants are marked proposals rather than existing engine contracts.

Physical assets use the established 2:1 projection and 64×32-display-pixel ground scale. Final pixel canvas dimensions, building footprints, pivots, facing counts, rig rules, autotile topology and atlas packing must be specified before production export. The bitmap atlas loader is still pending. Water, radio music and instruments also need separate animation/audio work; a still image does not implement those systems.

Proposed unrequested subtypes (such as park subtypes, boat propulsion alternatives, furniture examples and workstation layouts) are concept studies, not added canonical requirements. Emblems and readable signs must use approved source graphics/live text rather than invented marks.

## Scope and inventory

332 asset families; 1408 style/frame specifications. These are planning entries, not a final approved image count.

| Category | Families |
|---|---:|
| Existing pieces | 16 |
| Existing terrain | 12 |
| Existing objects | 22 |
| Buildings and public projects | 38 |
| Construction modules and interiors | 28 |
| Home, outdoor living, music and sports | 24 |
| Music active states | 2 |
| Professional tools | 16 |
| Workplaces and production | 14 |
| Inventory goods and learning | 38 |
| Devices and communication | 2 |
| Boats and travel | 6 |
| Travel overlays | 3 |
| Expanded terrain and gathering | 22 |
| Unspecified crops and animals | 3 |
| Resident animation templates | 2 |
| Profession outfit and action templates | 25 |
| Wearable templates | 4 |
| Wear and repair states | 7 |
| Activities and rewards | 4 |
| Interface symbols | 44 |


Files: ALL_IMAGE_PROMPTS.md (readable/copyable), ALL_IMAGE_PROMPTS.txt (plain text), catalog.json (asset families), prompts.jsonl (standalone specs), prompts/pixel and prompts/storybook (one prompt per file).

This package concerns Paradise Lost. Nirvana Sales' new match rules/remover/battle mechanics currently introduce no defined new illustration roster; its future opponent/battle UI should receive a separate art specification when designed.
