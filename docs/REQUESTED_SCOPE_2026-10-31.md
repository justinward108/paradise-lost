# Nirvana Sales — Complete Requested Changes

## Matching and clearing

- Allow three consecutive matching sale items diagonally, in both diagonal directions.
- Allow three matching sale items in a small L-shaped configuration, in all four orientations.
- Retain horizontal and vertical matches.
- Diagonal and L-shaped matches should clear their pieces and award money.
- Count overlapping matched pieces once.
- Add a special, limited-use way to destroy selected troublesome squares. The number of uses and how they are obtained remain balance decisions; the current local implementation starts with three uses per game.

## Single-player battle mode

- Add a single-player mode against an AI opponent.
- Clearing a qualifying match sends random regular-price items to random locations in the opponent’s stack.
- Increase attack strength for consecutive clearing placements:

| Consecutive clearing placements | Regular-price items sent |
|---|---:|
| 1 | 1 |
| 2 | 3 |
| 3 | 5 |
| 4 | 7 |
| 5 | 9 |
| 6 | 11 |
| 7 | 13 |
| 8 | 15 |
| 9 | 17 |
| 10 | 19 |
| 11 | 21 |

- Continue increasing the attack by two for each additional clearing placement: **attack strength = 2 × streak − 1**.
- A placement without a clear ends the streak.
- Define how simultaneous matches and automatic cascades count before implementing competitive scoring; do not silently substitute the existing cascade counter for this placement streak.

## Online two-player battle

- Add online two-player battles.
- Provide a looking-for-group entry and matchmaking.
- Match players with the closest historical skill level possible.
- Display the player’s board alongside the opponent’s board.
- Update the opponent’s board over the network, accepting the resulting network delay.
- Apply the same attack-strength and streak-reset rules.
- Local shared-device split-screen is not the requested feature.

## Battle royale

- Provide separate looking-for-group/matchmaking options for three-, five-, and ten-player battles.
- In three-player mode, each clear attacks **one random opponent**.
- In five-player mode, each clear attacks **two random opponents**.
- In ten-player mode, each clear attacks **five random opponents**.
- Select distinct surviving opponents, limited to however many opponents remain.
- Apply the same increasing attack strength to each selected target.
- Support the board views, elimination handling, and synchronized game state needed for these modes.

---

# Paradise Lost — Complete Requested Changes

## 1. Existing playtest problems and pacing

- Fix the inability to water the existing neighborhood plants, including the two plants reported in the playtest.
- Make seeds easy to discover and obtain so players can actually plant crops.
- Investigate and fix the buggy box that appears after harvesting a tree.
- Rebalance resource collection: it previously felt too scarce and now feels too generous.
- Give accumulated materials useful purposes. The reported inventory of 137 boards, 51 roofing, and 56 stone illustrates the imbalance between supply and available activities.
- Prevent long stretches with nothing useful to do while waiting for more quests.
- Add more activities, progression goals, construction opportunities, and economic interactions.
- Explain the holes/craters visible in the screenshots and give them meaningful interactions.
- Add a button that saves and returns the player to poor.camp.

## 2. Personal plots and construction

- Start players on a plot isolated from other players.
- Provide larger plots with enough space for many different buildings and activities.
- Support construction of buildings other than houses.
- Expand construction parts and organize them by the type of building they serve.
- Use shovels for excavation and foundations.
- Require digging for appropriate building types.
- Allow a developed personal plot to become attached to a town.
- Preserve the player’s developed plot when changing towns.
- Remove that plot from the old town and attach it to the new town without losing the player’s work.

## 3. Furniture, decoration, clothing, and recreation

- Let players buy furniture and decorations from their home.
- Include paintings and other interior decorations.
- Include yard furniture, outdoor tables, and outdoor chairs.
- Include usable outdoor recreation such as a slip-and-slide and croquet set.
- Sell clothes, hats, shoes, bags, instruments, and other usable items.
- Provide tennis rackets and tennis balls and let players play tennis.
- Make recreational objects usable rather than purely decorative.

## 4. Music

- Let players acquire a radio that plays music.
- Let players buy musical instruments.
- Provide a button or interaction to play an instrument.
- Instruments must produce music when played.

## 5. Neighbors, relationships, and NPC residents

- Expand neighbor interactions beyond giving fruit.
- Support buying, selling, and bartering with neighbors.
- Let players acquire additional NPC residents on their island.
- Let players permit NPCs to construct buildings on their plot.
- Support NPC businesses, including stores, travel agencies, and post offices.
- Support friendships and less friendly relationships with people on the plot.
- Provide clickable conversation choices with people in the area.
- Include child NPCs.
- Let players earn resources or money by babysitting children.
- Let NPCs offer recipes, skills, and teaching.
- Let towns advertise for particular kinds of NPC residents.
- Make NPC recruitment depend on the rewards offered and the NPC’s requirements.

## 6. Gathering, farming, and resource variety

- Add more types of crops and farm products.
- Give the new products useful purposes in crafting, cooking, trade, and other activities.
- Support different resources from rocky areas, trees, bushes, wells, water, and beaches.
- Provide mining picks and underground mineral gathering.
- Support fishing.
- Let players discover useful objects in waters around the island.
- Let players dig or construct a local water source.
- Connect gathered resources to recipes and production chains.

## 7. Terrain and environmental activities

- Include rivers.
- Let players build bridges across rivers.
- Include different land elevations.
- Let players build and use ladders between elevations.
- Make excavation useful for appropriate structures and activities.
- Add quick reaction events with rewards, such as grabbing an object that appears briefly or hitting an airborne target.
- Let players sleep to advance time. Resolve how this works with other players before changing shared world time.

## 8. Town formation and layout

- Let groups of friends form towns through poor.camp.
- Let players found and name an initially unbuilt town.
- Arrange residents’ personal plots around a shared central town area.
- Let residents develop that central area together.
- Let people build stores and businesses in town.
- Support multiple towns.
- Support visiting towns formed by other groups.
- Establish town capacity through balance testing rather than assuming an unlimited population.

## 9. Town recruitment and membership

- Let players invite people to their town.
- Provide a directory of towns looking for residents.
- Provide a directory of players looking for towns.
- Let town recruiters inspect a prospective resident’s Unity profile.
- Let prospective residents inspect the town and its existing residents.
- Let towns advertise for particular skills, trades, repair specialists, and teachers.
- Let towns attract residents from other towns.
- Support recruitment incentives such as cash bonuses, free teaching, plot improvements, and other perks.
- Let players leave one town and join another, with the requested departure/moving fee.
- Transfer the developed personal plot with the resident.

## 10. Government and public finances

- Make the founder the initial mayor.
- Let the mayor appoint a successor.
- Support changes of mayor over time.
- Support elections, including the requested rule against voting for oneself.
- Include a treasurer and other useful public roles.
- Give officials distinct responsibilities, jobs, and skills.
- Let residents help officials and receive help from them.
- Let residents agree to form a government and fund shared improvements through taxes.
- Once a town is formed, collect taxes to fund its operations.
- Use town funds for libraries, travel agencies, banks, parks, playgrounds, and other public institutions.
- Pay the mayor and people working in government institutions.
- Handle leadership succession when a mayor leaves town.

## 11. Town buildings and long-term projects

Provide the following requested building types and facilities:

- General stores.
- Food stores and food-buying businesses.
- Recipe stores.
- Travel agencies.
- Post offices.
- Auction houses for buying and selling items.
- Libraries.
- Schools.
- City halls.
- Banks.
- Swimming pools.
- Different kinds of parks.
- Playgrounds.
- Community centers.
- Gyms.
- Tennis courts.
- Baseball fields.
- Soccer fields.
- Old mills.
- Factories.
- Breweries.
- Bars.
- Clubs.
- Nondenominational churches.
- Towers.
- Lighthouses.

Provide a limited number of substantial construction projects that can serve as long-term town goals, including:

- Stadiums.
- Museums.
- Large parks.
- Bandshells.
- Gazebos.
- Ferris wheels.
- Fairgrounds.

## 12. Travel, boats, and quick return home

- Treat towns/cities as island communities connected by boat travel.
- Build travel alongside the multiple-town system.
- Provide travel agencies and a destination map.
- Show destination names and who is present.
- Let players visit other plots and towns.
- Let visitors interact with residents, stores, and services at their destination.
- Charge resources for ordinary travel.
- Let boat owners travel without the ordinary fare.
- Let players construct and own boats.
- Support boat captain jobs.
- Support travel agency jobs.
- Distinguish visiting a town from moving residency there.
- Provide a **quick-travel option directly back to the player’s own plot** from a visited town.
- Make quick return available without requiring a travel agency or boat.
- The implementation plan makes this return trip free.
- Preserve home construction, crops, belongings, and progress while visiting elsewhere.

## 13. Trade, classifieds, and player businesses

- Support trading between towns.
- Make local trade easier and less costly because it avoids intertown travel.
- Let players offer services as well as sell items.
- Support providing services on other people’s plots, both locally and in other towns.
- Provide Craigslist-style categorized listings for:
  - Items wanted.
  - Items offered.
  - Skills/services wanted.
  - Skills/services offered.
  - Town recruitment.
  - Requests for particular professionals.
  - NPC recruitment.
- Put classifieds on the regular poor.camp site.
- Let players create websites for stores, services, and goods.
- Provide a searchable directory of those websites.
- Make these services accessible from in-game phones and computers too.

## 14. Professions and multiple jobs

- Let players learn and hold more than one profession.
- Require time and relevant skill development rather than an exclusive class choice.
- Include gardeners who are particularly good at planting and tending plants for others.
- Include carpenters who are more capable at construction.
- Include contractors for difficult building work.
- Include plumbers who fix actual water problems in houses.
- Include electricians.
- Include crafters.
- Include cooks.
- Include bartenders as a separate profession from cooks.
- Include teachers.
- Include repair specialists.
- Include babysitters.
- Include boat builders and boat captains.
- Include travel agency workers.
- Include nondenominational ministers/pastors.
- Include computer-based jobs beyond repairing computers.
- Provide expensive specialist tools needed for appropriate professional work.

## 15. Materials, components, and manufacturing

- Create professions that produce materials, not just finished items.
- Include cloth production.
- Include cutting wood into planks/lumber.
- Include computer-part production.
- Include phone-part production.
- Include manufacturing finished phones.
- Include manufacturing finished computers.
- Include boat-part production.
- Include building finished boats.
- Connect producers through useful supply chains.
- Make gathered and manufactured materials the inputs for recipes.
- Require rarer or more expensive inputs for higher-quality products.
- Give accumulated resources meaningful uses through these systems.

## 16. Skills, recipes, and education

- Track skills separately from learned recipes.
- Provide many skills and recipes.
- Let crafters learn item recipes.
- Let cooks learn different food recipes.
- Let bartenders learn different drink recipes.
- Let pastors learn pastoral skills.
- Let other trained professionals learn their own relevant knowledge.
- Provide a recipe store automatically available in the starting area.
- Let towns build a recipe store with a wider selection.
- Let players purchase books to learn skills.
- Make book-based learning cost resources.
- Let players learn online through a phone or computer.
- Make online learning cost resources.
- Let schools teach skills and recipes.
- Make school instruction more effective than books or online study.
- Make teaching economically worthwhile for players who choose that profession.
- Provide an outside route into becoming a teacher, avoiding an endless requirement for teachers who teach teachers.
- The current implementation uses an outside subject-knowledge qualification and teaching examination; paid instruction and schools still need their full implementation.
- Let players qualify for additional professions through this learning system.

## 17. Food, water, and character wellbeing

- Give eating food meaningful benefits.
- Give not eating meaningful drawbacks.
- Give drinking water meaningful benefits.
- Give not drinking meaningful drawbacks.
- Create situations where players must balance drinking water against watering crops.
- Let different cooked foods and drinks provide different bonuses.
- Track happiness and provide multiple ways for it to rise and fall.
- Track skill levels and learned recipes.
- Add charisma that improves through successful interactions.
- Add kindness that improves when players give goods or provide services for free.
- Reward kindness with happiness and other useful benefits.
- Give church attendance happiness or other benefits.
- Give community centers distinct benefits.
- Let phone games improve happiness.

## 18. Pets and farm animals

- Let players acquire pets.
- Let players acquire farm animals.
- Require care for both.
- Let pets improve happiness.
- Make farm animals consume resources and produce useful resources.

## 19. Wear, maintenance, and repair

- Let appropriate items degrade over time.
- Make repair work useful.
- Provide repair professions differentiated by item category.
- Connect professional tools and learned skills to those repairs.

## 20. Sports, competitions, and town rivalries

- Provide individual sports and activities.
- Provide team sports and activities.
- Support competitions between players.
- Support competitions between towns.
- Use these activities to create friendly intertown rivalries.
- Work out the actual playable competition mechanics rather than treating the facilities as decoration.

## 21. Communication on poor.camp

- Make the regular poor.camp site the main hub for communication and town organizing.
- Support private conversations.
- Support user-created group conversations.
- Support live instant chat for both private and group conversations.
- Support durable asynchronous messages for both private and group conversations.
- Support town invitations and recruitment from the site.
- Provide a town-wide channel residents can use.
- Support communication between towns.
- Support blocking other players.
- Keep site and in-game conversations connected rather than creating unrelated message histories.

## 22. Phones, computers, and postal communication

- Make phones expensive in-game items.
- Let phones send instant messages from anywhere.
- Support private and group conversations through phones.
- Let phones access classifieds, maps, business websites, and their searchable directory.
- Let phones provide games that increase happiness.
- Let players acquire computers.
- Let computers access the same internet services and messaging.
- Let computers run more complicated games.
- Support paid online learning through both devices.
- Support computer-based employment.
- Retain post offices and mailboxes as a distinct delayed-delivery communication option.
- Let players type messages while interacting in the world.
- Display spoken messages above characters if feasible.

## 23. Expanded artwork, animation, and audio

Produce the visual assets needed for the expanded game, including:

- Buildings, modular construction pieces, and construction stages.
- Furniture, paintings, decorations, and outdoor objects.
- Clothes, hats, shoes, and bags.
- Adult and child NPCs and professional work appearances.
- Crops, planting material, growth stages, and harvest states.
- Pets, farm animals, and their care/production interactions.
- Resources, gathering tools, and professional equipment.
- Raw materials, intermediate components, and finished products.
- Workstations and manufacturing equipment.
- Phones, computers, boats, and boat parts.
- Sports facilities, equipment, and activity objects.
- Civic buildings and large town landmarks.
- Terrain transitions, rivers, bridges, ladders, excavation, and crater interactions.
- Food and drink items.
- Radios and musical instruments.
- Interface icons for skills, professions, recipes, travel, recruitment, classifieds, and communication.
- Appropriate rotations, animation frames, and usable/active/depleted/worn states.
- Music and sound needed for radios, instruments, and activities.

Keep assets consistent with the game’s scale, perspective, placement anchors, interaction targets, and supported visual styles. Implement the image-loading/atlas support required to use final artwork. Do not treat generated candidates as approved references or invent missing character/entity links.

## Delivery scope

The scope is **both complete original playtest reviews plus all subsequent additions and corrections**, including quick travel home. Small fixes and early production systems do not replace the larger town, economy, social, education, travel, recreation, animal, and artwork work.