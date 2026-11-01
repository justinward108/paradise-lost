# Remaining requested work — October 31, 2026

This is an open-work inventory, not a claim that the full expansion is finished. Working prototype slices remain partial where listed. All development in this chat is local and not deployed. No production database migration has been applied.

## Just completed locally

Player offers support barter or a whole-number price of 1–1,000,000 Rapture Credits. Goods are reserved when the offer is created. Buying a credit-priced offer locks the two accounts in stable order, verifies the buyer's shared ledger balance, writes an equal debit and seller payout, delivers goods, updates both plot revisions and closes the offer in one transaction. Retry cannot charge or pay twice. Cancellation returns reserved goods once. The interface shows RC prices and the current account balance. This completes item-sale settlement, not wages, taxes or service contracts.

## Nirvana Sales

- [ ] Server-authoritative online game sessions, legal placement/match/attack validation and persistent match results.
- [ ] Two-player online battle; own and opponent boards side by side, delayed network updates, reconnect and disconnect handling.
- [ ] Looking-for-group queues and closest historical-skill matching; persisted skill history and match ratings.
- [ ] Playable 3-, 5- and 10-player battle royale queues and sessions; survivor targeting, elimination, spectator/result views and reconnect.
- [ ] Preserve agreed rules online: attack 2×streak−1; non-clearing placement ends streak; one clearing placement includes its simultaneous matches/cascades; target 1/2/5 distinct surviving opponents in 3/5/10-player games; incoming regular-price pieces never overwrite cells.
- [ ] Network/load testing, AI and remover balance, mobile board layouts, and release verification. Pure battle rules and solo AI are implemented locally; they are not online modes.

## Paradise Lost — shared-world foundation and release

- [ ] Realtime presence, visible player avatars, movement networking, shared clock behavior and disconnect/reconnect reconciliation. Recent-online directory timestamps and snapshot visits exist.
- [ ] Shared town-center maps and persistent construction/projects with concurrent edits and role/visitor permissions. Current shared towns are membership records, not fully playable shared centers.
- [ ] Cross-plot service permissions: authorized gardening, construction and repairs; timed jobs, ownership protection and server validation. Trading is available during visits; building permission is separate.
- [ ] Reconcile every remaining local-only path and internal command with online authority, including notes, developer aids, credit awards and goods delivery. Remove any reliance on browser-reported rewards.
- [ ] Replace the old relief-kiosk local-goods settlement and milestone claims with authoritative server inventory/progress checks. The old client kiosk flow is disabled in online play.
- [ ] Migration of verified legacy buildings, crops, belongings, professions and progress. Server archiving exists, but archives do not grant online assets. Define verification/review and recovery rules.
- [ ] Verify database backups/restoration, retention, session expiry/account switching, cross-device play, simultaneous tabs, race conditions and multiplayer load behavior.
- [ ] Improve online movement beyond the current one-second tile cadence without weakening the existing request limit.
- [ ] Review and commit only the intended changes; apply migrations, deploy platform/game together, and verify live production behavior. Address the site's seven unrelated integrity defects before claiming a clean site release.

## Paradise Lost — towns, government and recruitment

- [ ] Organize personal plots spatially around shared town centers; town capacity and recruitment balance.
- [ ] Town invitations, admission policies, friends forming towns through poor.camp, recruitment listings and players-seeking-town listings.
- [ ] Unity profile inspection, skills-based recruitment and incentives such as credits, teaching and plot improvements.
- [ ] Requested moving/departure fees and complete developed-plot transfer presentation. Membership changes already preserve personal plot assets.
- [ ] Elections with no self-voting; treasurer and other functional public roles. Founder mayor and appointed succession exist.
- [ ] Town treasury, taxes, budgets, wages, public institution operations and government aid.
- [ ] NPC recruitment for residents and every needed staff role: wanted ads, qualification/specialty checks, offers, willingness, schedules, capacity and ongoing wages. Local paid NPC teacher recruitment is only the first slice.
- [ ] Real player hiring and service contracts, with better speed/results/customization/specialties than NPC fallback. Player teaching benefits are defined but not connected to an online teacher economy.

## Paradise Lost — travel and businesses

- [ ] Playable shared town destinations, destination map, who is present and destination services. Cross-town resident browsing, consenting plot visits and free return home exist.
- [ ] Authoritative fares, fare-free owned-boat travel, travel agencies, captains and agency jobs. Local boat manufacturing and travel prototype rules need shared-world integration.
- [ ] Categorized wanted/offered item and service classifieds, town/professional/NPC recruitment, on the main poor.camp site and through devices.
- [ ] Player store/service websites and searchable directory; shop operations, recipe stores and auction houses.
- [ ] Extend RC settlement to work contracts, teacher/NPC wages, institution budgets, town finances and agreed travel charges. Item purchases are settled; generic transfers and currency conversion are not automatically enabled.
- [ ] Local-versus-intertown economic/travel costs, useful production demand, supply-chain pricing and stock balance.

## Paradise Lost — facilities and long-term projects

- [ ] Operational general/food/recipe stores, travel agencies, post offices, auction houses, libraries, schools, city halls and banks.
- [ ] Swimming pools, parks, playgrounds, community centers, gyms, tennis courts, baseball fields and soccer fields with actual activities/benefits.
- [ ] Old mills, factories, breweries, bars, clubs and nondenominational churches with staffed operation.
- [ ] Towers and lighthouses.
- [ ] Substantial shared goals: stadiums, museums, large parks, bandshells, gazebos, Ferris wheels and fairgrounds.
- [ ] Clinics, hospitals, pharmacies, veterinary facilities and pet stores as functioning institutions. Existing building-part definitions are not completed services.

## Paradise Lost — construction, furnishings and recreation

- [ ] Broader modular parts, material tiers, excavation/foundation requirements and professional construction work. Large private plots, several new parts and categories exist.
- [ ] Finish home shopping and the furniture/decor catalog: paintings, more indoor/outdoor furniture, tables/chairs and usable yard objects.
- [ ] Playable slip-and-slide, croquet and other recreation.
- [ ] Expanded garment/outfit catalog, clothing designer work and player orders. Basic recipes, equipped clothing and procedural visual changes exist.
- [ ] Actual interactive video games on consoles, phones and computers; distinct individual games. The current console activity is a timed happiness session.
- [ ] Radios and instruments that play music, with acquisition, controls, sounds and work/recipe paths.

## Paradise Lost — NPCs and day-to-day progression

- [ ] Broader NPC population, varied daily activities, visits/events, dialogue choices, relationships/conflicts and new residents admitted onto plots.
- [ ] NPC-built buildings/businesses with owner permission, stores, travel agencies and post offices.
- [ ] Children and paid babysitting.
- [ ] Varied daily quest chains, visitors and local/intertown errands; guarantee significant daily opportunities while preserving progression pacing. Rotating requests, extra donations and two moving visitors are an initial slice.
- [ ] Complete resource-surplus/economy balancing and a wider set of useful rewards/spending choices.
- [ ] Reproduce and fully resolve the harvest popup defect; verify the originally reported shelter rebuild case in play, beyond diagnostics and regression tests.
- [ ] Explain and give useful interactions to craters/holes; improve seed acquisition/onboarding through playtesting.

## Paradise Lost — gathering, production and professions

- [ ] Additional crops/products and uses; distinct rocky/tree/bush/beach/water resources and production inputs.
- [ ] Actual underground mining/exploration. Timed ore/silica prospecting, picks and refining exist.
- [ ] Shovels/excavation, buildable bridges, rivers, elevations, usable ladders, fishing and discovering objects in water.
- [ ] Visible placeable water-source art and interaction; the current water source is a panel mechanic.
- [ ] Rewarded quick-reaction events and a multiplayer-compatible sleep/time-advance design.
- [ ] Full service roles for gardeners, carpenters, contractors, plumbers, electricians, repair specialists, cooks, bartenders, babysitters, boat builders/captains, agency workers, pastors and computer workers.
- [ ] Broader skill/recipe catalogs, professional quality/specialties, expensive tools and higher-quality inputs; books/online/school instruction and paid player teaching need complete service integration.
- [ ] Starting recipe store and improved town recipe stores; libraries/schools with stronger instruction and paid teachers. Outside teacher qualification, separate skills/recipes and multiple professions exist.
- [ ] Wear/degradation and category-specific maintenance/repair, actual plumbing/electrical faults and useful professional repair jobs.

## Paradise Lost — health, animals and wellbeing

- [ ] Varied fictional human illnesses, diagnosis/treatment progression, general doctors, doctor specialties and distinct specialist requirements.
- [ ] Nurses and nursing specialties with distinct clinical responsibilities.
- [ ] Pharmacists, learned fictional medicine recipes, appropriate production inputs, dispensing and treatment integration.
- [ ] Clinic/hospital administrators: staffing, resources, service capacity, appointments/queues, budgets and wages.
- [ ] Veterinarians and staffed pet stores, diagnosis and animal treatment; integrate sickness with the wider professional economy. Basic animal neglect/sickness and treatment items exist.
- [ ] Animal sprites, movement, housing and care interactions for dogs/cats/chickens/cows. Basic care, toys, eggs/milk, sales and livestock slaughter exist.
- [ ] More prepared foods/drinks, product consumption uses, wellbeing balancing, church/community benefits and service-based charisma/kindness rewards.

## Paradise Lost — communication and competitions

- [ ] Connect existing poor.camp private/group messaging to the game: live and asynchronous conversations, shared history, town/intertown channels and blocking.
- [ ] In-world typed interaction/speech bubbles and device access to communication, classifieds, maps and business sites.
- [ ] Distinct delayed postal delivery, post offices and mailboxes.
- [ ] Computer employment and richer phone/computer games.
- [ ] Playable individual/team sports and player/town competitions, equipment, scoring, rewards and intertown rivalries.

## Paradise Lost — artwork and audio

- [ ] Update the image-prompt package to include every later selected animal, healthcare/staffing role, console item and new construction family.
- [ ] Generate/review approved assets, implement atlas/frame loading, and integrate both supported styles with tested anchors, scale, footprints and interaction targets.
- [ ] Buildings/construction stages, furniture/decor, garments, NPC professions/children, crops, animals/care states, terrain, equipment, manufacturing, devices, boats, sports, institutions, UI states and worn/active/depleted variants.
- [ ] Final animation, music, instrument/radio sounds and activity audio. Existing procedural art and prompt candidates do not establish approved canon.

## Other games requested in this chat — separate follow-up audit

These requests remain tracked, but their current repositories were not re-audited in this credit-settlement pass.

- [ ] DOSA Cases 1 and 2: evidence encounter context on hover/focus/touch; item/person/place associations; access, relationships, chronology and meaningful investigation beyond clicking.
- [ ] KnuckleBomb: clear targeting/passing/attack/shooting/ball-replacement controls and a contested one-player-per-team challenge after scores.
- [ ] Champions: seasonal challenge metrics and one best-prize claim per season, rated matchmaking, close-skill stranger exhibitions and unrestricted friend challenges. Reconcile with current executable season/matchmaking work before treating these as missing.

## Recruitment and interaction-control batch
Implemented locally: mayor-authored recruitment notices (600 characters), open/invitation-only admission, opt-in players-looking-for-town listings (400-character notes and server-earned profession IDs), invitation inbox, acceptance/decline/revocation, seven-day expiry, duplicate-safe acceptance, and a 50-pending-invitation cap per town. Acceptance never removes an existing town membership automatically; succession/leave rules still apply. Personal plot assets are preserved. The game UI exposes these controls in Towns & travel. Portal-side recruitment pages, incentives, Unity profile links and admission/capacity balancing remain open.

Game-specific blocking now suppresses blocked players from resident/recruitment listings and prevents visits, new invitations, and open-offer trade settlement in either direction. Pending invitations between the pair are declined on blocking. Sellers can still recover reserved stock by cancelling offers. Block/unblock controls are provided; integration with poor.camp messaging blocks remains pending. No messages are sent outside the game invitation system.

## Shared account and messaging blocks
Supersedes the earlier game-only block limitation. Migration 20261031167000 makes poor_camp.social_blocks the account-level authority and atomically synchronizes the existing Unity profile and Paradise Lost compatibility tables. Existing blocks are backfilled without removing either source. Block/unblock actions through existing Unity, platform social or game APIs update the other surfaces in the same database transaction. Later-created profiles and plots inherit existing account blocks. Unowned authored/NPC profile blocks retain their original profile-only behavior.

Existing direct-message/private-chat checks now receive game blocks through the synchronized Unity rows. Group creation refuses blocked-player invitations. Group message bodies and previews filter both block directions through the shared account predicate; existing groups are not deleted. Game visit/recruitment/trade checks continue to use the synchronized mirror. Existing pending game invitations are declined for blocked pairs. Shared behavior is explained in the game interface.

Tests cover old Unity blocks becoming game blocks, game blocks appearing in messaging storage, two-way unblocking, platform blocks, future profiles/plots, invitation cancellation, NPC blocks and group-message filtering. Still local: no migration or deployment has been applied in production.

## Production usability batch
Eleven recipes added: roofing sheets from refined metal, building blocks, solar lanterns, refined phone components, refined computer components, bean-based farm feed, egg-based pet food, vegetable stew, garden bean plate, milk-and-egg breakfast and fruit smoothie. Outputs are registered inventory goods and use the existing crafting, batch discount and server trading paths. Existing food ingredients now have more uses.

Milk and the previously crafted egg/chicken/beef meals can now be consumed. Prepared foods have distinct nourishment/hydration/happiness effects and 5–8 minute work bonuses. The food panel shows the actual bonus duration. Workshop recipe search matches recipe names, inputs and outputs; a profession filter narrows the list. Server simulation/content exports have been refreshed. Tests exercise a farm-product-to-drink-to-consumption chain, roofing output and retained tools, rejected unaffordable batches and existing meal consumption. 154 game tests and production build pass. Final art for the new food items remains pending. Changes are local, not deployed.

## Direct gifts and postal deliveries — November 1, 2026
Players can give items or shared Rapture Credits without a reciprocal payment, or send items, credits and letters through delayed mail. The game provides recipient selection, review/confirmation, inbox, sent history and collection. The initial postal delay is ten real minutes, not an accelerated whole-world time change. Amounts are reserved at send time; items leave the sender's server inventory and mailed credits are debited into the recorded pending delivery. Collection credits the recipient once. Instant gifts settle in the same transaction. Stable account/plot locking, durable request keys and ledger receipts protect retries and failures. A recipient cannot read or collect someone else's mail. Existing blocked letters are redacted while previously reserved goods/credits remain recoverable; new gifts are refused between blocked players.

Tests cover instant and mailed items/credits, duplicate send/collection, altered-key reuse, insufficient/private access, delivery timing, blocked letters and rollback after injected receiver failure. This is the game delivery system; staffed post offices, physical mailbox objects, postal jobs and portal-side gift/mail screens remain pending. The requested broader skill/recipe expansion remains open; this steering batch adds gifts and mail without replacing that scope. Changes are local and not deployed.

## Farming support and acquisition guide — November 1, 2026
Added craftable compost and mineral fertilizer. Apply next to a planted bed on your own plot. Compost adds one unit to each harvested produce item, fertilizer adds two. A treatment cannot stack, survives save/reconnect, is consumed after the next harvest and does not accelerate growth or increase seed returns. Perennial regrowth needs another treatment for another bonus. Resource spending is server-validated; remote/empty-bed attempts are refused.

Resources & garden now includes a content-driven item acquisition guide covering mining, crops, recipe inputs/tools, seed and goods barter, animal products, salvage, trees and water. Batch crafting lists exact missing materials. The seed trader now supplies banana keiki and long-bean seeds in addition to the new seed range, fixing their dependency on the old kiosk. Totals: 159 recipes and 159 inventory item types, with 60 skills and 15 crops.

Tests cover treatment persistence, one-harvest consumption, no stacking, proximity, empty-bed refusals and actual acquisition sources. 164 game tests and the production build pass; server exports refreshed. Compost/fertilizer final artwork and on-site professional gardening contracts remain pending. Local only, not deployed.

## Shared centers, paid jobs, town resources and income tax — November 1, 2026

Implemented locally, not deployed. The new center/job and treasury migrations have not been applied in production.

Town centers now persist shared construction, stock, revisions and individual positions. Visitors can walk; residents can construct; only the mayor can demolish. Shared changes refresh every ten seconds. Personal home construction remains separate. The initial center retains the existing 14×14 buildable footprint; live player avatars remain unfinished.

Construction uses town-owned items by default. Residents can explicitly donate their own building materials, contribute items to stock, or give RC to the treasury. Demolition refunds belong to the town. Public wages require mayor authorization; a resident can personally fund a job, including a construction wage as a donation.

Paid jobs currently support goods delivery and placement of a specified building piece. Wages are reserved at posting. Claims expire after 24 hours and can be released. Completion verifies the actual goods transfer or construction, then pays once. Construction uses town materials and requires six construction XP plus residency. Town-funded deliveries stock the town; personal deliveries supply the employer. Cancelling eligible jobs refunds the original funding source. Failed payout rolls back work, materials and payment. Server-generated construction action keys prevent player-crafted receipts from substituting for the contracted work.

Towns choose income tax from 0–100%, initially 5%, through mayor controls. It is charged on resident job wages and RC sales proceeds at settlement; the resident's home town receives it. Gifts, mailed credits, donations and escrow refunds are exempt. Fractional credits persist by account/town to prevent splitting or membership changes from bypassing tax. This supersedes the abandoned flat daily-tax draft: no periodic balance tax or offline assessment is implemented. Rates and gross/tax amounts are retained on taxable receipts.

Centers, treasury assets and job history survive the last resident leaving. Preserved empty towns reopen admission and the next resident fills the vacant mayor role.

166 game tests and production build passed. Targeted real-database tests cover revision conflicts, membership permissions, default shared stock, explicit donations, receipt reuse, wages/refunds, tax percentages, fractional carry, gift exemptions and rollback. No live multiplayer/load verification or production release has occurred.

Remaining work includes live avatars, larger centers and facilities, elections/treasurer roles, project approval and finer permissions, personal-plot service jobs, paid teaching/repair/gardening and other professions, staffed institutions, travel fares and release/balancing.

## Scoped paid gardening services — November 1, 2026
Added gardening to player job contracts: water a crop, weed its bed, or harvest it. The owner selects an existing home crop; the server records its planting identity and only authorizes that task on that crop. No general building/edit permissions are granted. A replaced crop invalidates the contract, and already-completed/unneeded garden work cannot collect a wage.

The worker needs six gardening XP and a thirty-second work period. One active garden assignment occupies the work slot; new study/crafting/prospecting or teacher lessons require completing/releasing it first. Private garden work uses personal wages, not public treasury funding. Workers supply one water for watering. All harvested produce and planting material remain with the owner. Wages use existing reserved funds, once-only settlement and home-town income tax.

Work supports owners who are away in the starter neighborhood: it updates their saved home crop/soil/inventory without moving their avatar or altering the visited location. The current model is a timed service order; it does not yet animate the worker visiting the property.

The job board includes the owner's planted-bed picker, task descriptions, water/produce terms, ready timing and release controls. Existing contracts remain visible for release/refund when a pair is blocked, while new work/settlement is refused.

Full-schema tests cover qualifications, thirty-second timing, activity exclusion, owner-away harvests, retained produce, worker water, weeding, crop replacement, public-funding refusal, tax, payout rollback and blocked-contract recovery. Game tests/build pass. New migration 20261101022000 and synchronized simulation exports are local, not applied/deployed in production.

## Paid player teaching and player-value rule — November 1, 2026
Implemented locally: certified players publish subject-specific lesson offers, learners reserve fees plus one supply voucher, teachers explicitly start lessons when both participants have free work slots, and either participant can settle after thirty seconds. Server checks the outside teaching certificate, teaching qualification, subject level two and enough knowledge to provide a full lesson. Specialty prerequisites still apply.

A full player lesson grants six XP in thirty seconds, compared with four XP in forty-five seconds for NPC instruction. The full player fee is capped at the cheapest NPC wage benchmark using the authoritative voucher bundle price: currently 200 RC, with a default offer fee of 100 RC; both lesson types require one supply voucher. Lessons ending at mastery are prorated, rounded up to whole RC. For example two XP at a 100-RC full fee costs 34 RC. Player tuition cannot rise after reservation; if the student's remaining need shrinks before starting, the excess reserved fee is returned. Teacher knowledge must support a full lesson except at the student's mastery cap.

Fees and supplies are reserved at booking. Either participant can cancel an unfinished lesson for a full remaining refund. Completion awards XP and pays the teacher once, with home-town income tax. Failed payment rolls back XP and settlement. Active lessons exclude study/crafting, garden work and other paid jobs until settled or cancelled. Waiting reservations expire after seven days; active sessions have a twenty-four-hour collection window and remain refundable if expired. Blocking prevents starting/settlement but does not prevent cancellation and recovery.

Player teachers have a dedicated Activities panel, subject browsing, actual learner quotes, pending/recent sessions, timed completion and offer management. Qualified teachers earn limited teaching practice. Staffed school buildings, classroom facilities and live teacher/student avatars remain separate unfinished work.

Verification: 166 game tests, 60 platform suites and game production checks passed; final panel navigation build passed afterward. Full-database tests cover qualifications, fee cap, quote refusal, fixed booked prices through offer changes/withdrawal, stronger XP, prorating/refunds, mutual work locks, tax, cancellation after blocking and rollback after injected payout failure. New migration 20261101023000 and all changes remain local, not applied/deployed in production.

## 2026-11-01: Paid animal-care contracts
Implemented personal-funded contracts for feeding, watering, playing with pets, treating sick animals, and collecting eggs or milk. Contracts target one owned animal and one action, take 30 seconds after claiming, and use existing wage escrow, income tax, expiry, release and refund protections. Workers supply consumed food/water/medicine; matching pet toys remain reusable; collected produce belongs to the owner. Treatment requires veterinary qualification. Care works while the owner is away without moving their avatar. Workers cannot sell/slaughter animals or edit the owner's plot. Replacement animals invalidate stale contracts. This is timed remote care, not live caretaker avatars or a complete veterinary clinic/diagnosis system.
Validation: 166 game tests, 61 platform test suites, and the game production build passed. Website integrity still reports 7 unrelated errors and 334 warnings. Local changes only; migrations and deployment remain pending.

## 2026-11-01: Paid-job discovery and preparation
Added job search across titles, employers, skill names, job types and requested goods. Players can filter available work, work matching their listed qualifications, their claims and their postings, and sort highest wage first. Cards explain missing skill XP, construction residency and veterinary qualifications. Delivery and care contracts show required supplies and exact shortages; reusable pet toys are included as required equipment. Filters do not hide claim-release or cancellation controls by default. Guidance uses the current client snapshot; authoritative server permission, activity, target and settlement checks remain in force. Production build, content validation and type checking passed. Local only, not deployed.
