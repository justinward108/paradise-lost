# Paradise Lost expansion art register

Status: production planning, not approved artwork. Linked scope: PLAYTEST_IMPLEMENTATION_2026-10-31.md and both full playtest-source files. No image files have been generated or promoted by this register.

## Existing technical contract

The current game has pixel and storybook styles in packages/content/src/art.ts. World coordinates use a 2:1 isometric projection: 64 × 32 display pixels per ground tile. Pixel placeholders draw at half display resolution; storybook placeholders draw at double resolution. Rotatable furniture uses r0–r3 or r0–r1; wall/door/window pieces use n/w frames. Preserve shared anchors, footprints and interaction targets across styles. Art must never encode prices, names or changing gameplay text; use the interface for those.

The current ArtEntry only supports procedural generators. Its comment describes future atlas support, but that loader is not implemented. Before importing final bitmap art, implement atlas/frame metadata, texture loading and validation. A sheet alone does not make an object playable.

## Required art families

| Family | Explicit requested coverage | States/variants to plan |
|---|---|---|
| Residents | Adult and child NPCs; gardeners, carpenters, crafters, cooks, bartenders, teachers, plumbers, electricians, contractors, repair specialists, captains, travel agents, public officials and nondenominational ministers | Locomotion, facing, idle, conversation, relevant work animations; do not create character identities from filenames |
| Clothing | Clothes, hats, shoes, bags | Equipped views aligned with character direction/animation plus inventory icons |
| Home interiors | Furniture, paintings, wall decorations | Placement rotations, usable/occupied state as appropriate |
| Outdoor living | Tables, chairs, yard furniture, slip-and-slide, croquet | Rotations, activity equipment and active-use states |
| Music | Radio and musical instruments | Inventory icon, placed object, playing/stopped state; audio is a separate deliverable |
| Agriculture | Expanded crop roster, seeds/slips, farm tools | Seed, growth stages, watered/dry indicator, mature, harvest and regrowth; each specific crop must be defined before final art |
| Animals | Pets and productive farm animals | Idle, walk, care interaction, relevant produce; species roster still to be defined |
| Resources | Rocks, trees, bushes, wells, beaches and water gathering | Available, depleted, regrowing, collected-item icons |
| Terrain | Rivers, banks, different elevations, underground excavation and existing craters | Joinable tiles, transitions, bridge/ladder connections and interaction cues |
| Tools | Mining pick, shovel, fishing equipment, repair and specialist professional tools | Inventory icons and held/use frames; work-specific tool roster still to be defined |
| Construction | Non-house building components, foundations, bridges, ladders | Orientation, construction stages, finished state; match actual footprints and collision |
| Materials | Cloth, wood/planks, computer parts, phone parts, boat parts and other recipe inputs | Inventory icons and workshop/storage props; avoid indistinguishable silhouettes |
| Workshops | Material production, parts assembly, phone/computer manufacture, boatbuilding | Workstations, in-use states, tools and output props |
| Electronics | Expensive phones, computers | Inventory/placed/held views, powered/in-use states; screens use live UI |
| Boats | Owned boats, travel vessels and captain equipment | Orientation, docked, boarding, underway; damage/repair only where mechanics need it |
| Shops and commerce | General store, food store, food buyer, recipe store, auction house | Modular facade/interior fixtures, counters, displays and interactions |
| Civic services | City hall, bank, library, school, post office, travel agency | Modular components, distinct entrances/signage areas, workstations, mailboxes |
| Hospitality/community | Brewery, bar, club, church, community center, gym | Building parts, interiors, relevant work/activity props |
| Industry | Old mill and factory | Building parts, machinery, production animation |
| Recreation | Pool, tennis court/rackets/balls, baseball field, soccer field, playgrounds and different parks | Field/ground markings, equipment, use states |
| Town landmarks | Stadium, museum, bandshell, gazebo, ferris wheel, fairgrounds, towers and lighthouse | Large-building modules, construction progress, operational states |
| Food/drinks | Cooked foods, water, bartender recipes, crops and animal products | Distinct inventory/served icons; final recipes first |
| Wear/repair | Degradable item categories and specialist repair work | Readable worn/broken/repaired states where visible; avoid multiplying every asset unnecessarily |
| Events | Fishing finds, reflex-test objects and airborne targets | Spawn, active, collected/missed and reward cues |
| Interface | Classified categories, professions, skills, recipes, town recruitment, maps, private/group/town messaging | Consistent icons; dynamic text stays in UI; keyboard/touch accessibility |

## Per-asset acceptance record

Assign a stable gameplay/content ID before generation. Record category, linked feature requirement, exact dimensions, footprint, anchor, style, required rotations, animation/state list, transparency, source provenance, review status and loader/atlas path. Mark missing references explicitly. Generated candidates remain candidates until reviewed; never treat a generated filename as approved canon.

Use existing object geometry for simple modular surfaces and UI symbols. Reserve bitmap generation for objects/characters that benefit from illustration. Create a small in-game comparison sheet and verify alignment/readability before producing each family at scale. Test selection targets, occlusion, mobile zoom, both styles and atlas memory usage.

## Production ordering

1. Inventory current manifest and loader; establish one validated atlas integration path while retaining procedural fallbacks.
2. Gardening/resource clarity, neighbor trade props, basic furnishings and tools, so the initial play loop becomes readable.
3. Materials, workshops, devices and training objects alongside their playable systems.
4. Residents/animals and interactive recreation alongside animation and behavior support.
5. Civic buildings, travel and large landmarks alongside town/multiplayer systems.

This ordering is dependency-based, not a reduction in requested scope. Exact asset counts are pending the content roster, rotations, growth stages and animation requirements; do not promise a count based only on feature names.

## Prompt catalog

See art-prompts/ALL_IMAGE_PROMPTS.md and art-prompts/catalog.json. They contain current code-defined frames, proposed designs and explicitly gated templates across all requested asset families, with both supported visual styles. The catalog does not approve artwork or supply missing canonical references.
