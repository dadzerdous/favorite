# Spike Trolley RPG — Ideas

## Build

Current prototype: **v0.17.3**

## Current Direction

**v0.4 returns to classic direct trolley control.**

The independent runner-control experiment from v0.3 is not discarded. It is parked as a possible future **character/class, trolley type, or alternate control mode**. We are not tuning it now because the core Arkanoid RPG loop is the priority.

## Status Key

- **NEXT** — actively testing/building.
- **LATER** — direction we like, intentionally parked.
- **MAYBE** — interesting but unproven.

## Core Vision

Fantasy Arkanoid / Breakout combat with roguelite dungeon structure and RPG progression.

- Trolley/paddle = character platform.
- Ball = weapon.
- Bricks/formations = enemies, defenses, hazards, and objects.
- Room clear = guaranteed actionable upgrade choice.
- Branching dungeon structure later.
- Permanent XP/stat progression later.
- Major dungeon victories unlock substantial permanent content.
- Pets are a planned major system.

## NEXT

- Keep classic direct trolley movement.
- Keep fixed 9:14 gameplay geometry on PC and mobile.
- Make sure the entire game fits on phones in portrait and landscape.
- Continue testing room → upgrade → next room.
- Prefer guaranteed/actionable upgrades over chance-based upgrades.
- Improve combat feel before expanding meta systems.

## Current Run Upgrades

- Heavy Shot — ball damage +1.
- Wider Trolley — trolley width +15%.
- Faster Runner / Trolley — movement speed +15%.

## LATER — Alternate Runner-Control Class / Mode

v0.3 tested controlling the person on top of the trolley. His position accelerated the trolley and created momentum.

Potential future use:

- A special character/class.
- A unique trolley type.
- An alternate advanced control mode.
- Stats such as Agility, Balance, and Trolley Weight could modify it.

Do not tune this yet.

## LATER — Trajectory Prediction

Control-related progression could show where the ball is likely to travel.

Possible levels:

- Short dotted trajectory.
- Longer trajectory.
- Predict first wall bounce.
- Predict multiple bounces.

This makes Control a meaningful gameplay stat instead of only a numerical bonus.

## LATER — Balls / Weapons

- Physical / Iron Ball
- Fire Ball
- Frost Ball
- Lightning Ball
- Poison Ball
- Explosive Ball
- Heavy / Piercing Ball

Elemental matchups should provide advantages, not hard locks.

## LATER — Enemies

- Goblin — basic.
- Slime — splits.
- Skeleton — rebuilds.
- Spider — creates webs.
- Mage — fires projectiles.
- Knight — armor.
- Bomber — explosions.

## LATER — Status Interactions

- Burn
- Freeze
- Shock
- Poison
- Explosive
- Fracture / armor break

Example: Freeze → Heavy Ball → SHATTER → neighboring damage.

## LATER — Dungeon

Potential nodes:

- Battle
- Elite
- Shop
- Event
- Treasure
- Rest
- Forge
- Pet event
- Boss

Loop:

Hub → Dungeon → Branching Rooms → Boss → Permanent Reward → Hub

## LATER — Bosses

Bosses can be giant creatures built from destructible pieces.

- Break armor.
- Destroy limbs to disable attacks.
- Expose weak points.
- Phase changes.
- Destroy core to win.

## LATER — Pets

Permanent companions with possible run-specific development.

- Bat — catches loot.
- Turtle — blocks projectiles.
- Emberling — attacks.
- Sprite — assists ball control.
- Wisp — helps recover dangerous balls.

## LATER — Permanent Progression

Playing should provide progress without requiring grinding.

Three layers:

1. XP — small gradual permanent progression.
2. Discoveries — balls, relics, pets, classes, events, NPCs.
3. Victories/challenges — major permanent unlocks.

Failure can still provide some progress. Winning provides the substantial rewards.

## LATER — Replayability

Replay completed dungeons for:

- Alternate paths.
- Events.
- Secrets.
- Boss variants.
- Builds.
- Pet development.
- Higher difficulty.
- Completion tracking.

## LATER — Hub

Functional hub that visually grows with progress.

- Dungeon selection.
- Character/trolley selection.
- Starting ball.
- Pet selection.
- Permanent progression.
- Rescued NPCs.
- Visible trophies/unlocks.


## Equipment Architecture — Direction

Equipment is distinct from run upgrades and shop consumables.

### Character Equipment Slots

- **Boots / Feet** — primarily movement speed, acceleration, braking, agility.
- **Hat / Helmet** — primarily defense and hazard resistance.
- **Chest** — primarily max HP / survivability.
- **Ring** — special effects, elemental synergies, utility.
- **Amulet** — special effects, status interactions, control.
- **Ball** — weapon: damage, element, piercing, explosive behavior, etc.
- **Trolley** — paddle/platform: width, handling, bounce properties, defense.
- **Pet** — companion support.

Prefer deliberately designed equipment identities over endless +1/+2/+3 copies.

Examples:

- Goblin Runners — fast movement.
- Lead Boots — slower but stronger braking/control.
- Winged Boots — faster direction changes.
- Guard Helmet — defense.
- Leather Armor — max HP.
- Ember Ring — improves fire interactions.
- Lodestone Amulet — improves Ball Glue.

### Discovery / Collection Philosophy

- Equipment can be found during runs.
- First discovery permanently adds the item to the player's collection.
- Previously discovered duplicate equipment can convert to gold.
- Before future runs, the player can choose starting equipment from the permanent collection.
- Starting loadout should be limited so run discovery remains meaningful.
- Avoid randomized Diablo-style stat rolls for now.

## Board Philosophy

**Everything on the board can have properties, but not everything on the board is an objective.**

- Mobs must be defeated to clear combat rooms.
- Environmental bricks can remain when the room ends.
- Bricks may still have HP, armor, elements, resistances, statuses, and interactions.
- Optional brick destruction can expose treasure, secrets, healing, or tactical paths.
- Future ice walls can be weak to fire.
- Future fire/explosive interactions can damage neighboring bricks and mobs.

## Shop Philosophy

Shop purchases are distinct from earned run upgrades and equipment.

Current first shop concepts:

- **Overshield** — blocks one damage each room and visually shatters.
- **Ball Glue** — activate a charge; the next paddle catch sticks the ball for up to a few seconds.
- Healing.

Later shops may sell equipment, enchants, utility, or other tactical resources.


## v0.6 Art Integration

Added approved first-pass game art:

- `assets/bg1.png` — Goblin Outpost dungeon background.
- `assets/trolley1.png` — adventurer + trolley sprite.

The art is now drawn by the game code while gameplay collision remains separate.

### Progression Note

Overall XP / permanent growth is still planned, especially so failed runs do not feel completely wasted, but **no XP system is implemented in v0.6**. We are deliberately waiting until the immediate combat/run structure is a little clearer.


## v0.7 Progression Foundation

Implemented:

- `assets/gob1.png` as the first reusable mob block.
- Goblin variants can initially be created with hue changes.
- Mobs award **XP, not gold**.
- Room clears award bonus XP.
- XP and Adventurer Level persist through failed runs and browser refreshes.
- Each level grants one freely reallocatable permanent stat point.
- Current prototype stats:
  - Vitality — max HP.
  - Defense — milestone defensive ward.
  - Agility — trolley speed.
  - Power — milestone ball damage.
  - Control — trolley width for now; trajectory functionality remains planned.
  - Fortune — increases treasure gold.
- Visible yellow treasure blocks contain gold.
- Treasure blocks are optional; killing all mobs still clears the room.

### Gold Philosophy

Normal mobs should **not** be a predictable fixed gold faucet. Gold should primarily come from optional treasure, rooms, events, shops, challenges, and other run decisions so the run economy can vary.

### Hidden Treasure

Some future ordinary-looking blocks can conceal permanent equipment discoveries.

A dungeon/world may contain a limited hand-placed hidden equipment treasure, potentially one major secret per world.

Late-game equipment such as a special ring may reveal or highlight hidden treasure blocks.

### Boss "Killed By" Rewards

Every boss should have special rewards tied to **how the boss was defeated**, not only whether it was defeated.

Examples can include:
- Killed by Fire.
- Killed by Ice/Shatter.
- Killed with an extremely small trolley.
- Killed without taking damage.
- Killed with a particular equipment setup.
- Killed by a pet or environmental interaction.

These rewards can feed quests/challenges, equipment discoveries, cosmetics, runes, pets, or other unlocks.

### Quests / Challenges

Plan for a broad challenge system that rewards unusual ways of playing rather than only repetitive kill counts.

Examples:
- Clear a room with a tiny trolley.
- Beat a stage fully equipped.
- Destroy all environmental blocks before the final mob.
- Beat a boss without taking damage.
- Complete elemental or equipment-specific challenges.

### Runes

Planned as temporary run-build pieces, potentially chosen between rooms and socketed into equipment.

Runes are **not permanent equipment**.

They may become the primary source of elemental effects:

- Ember Rune — Fire.
- Frost Rune — Ice.
- Impact Rune — damage.
- Expansion Rune — trolley width.
- Ward Rune — defense.

Equipment can determine socket capacity and interact with particular rune types.

This may replace the need for a traditional permanent skill tree. Do not implement a skill tree until the other systems prove one is needed.


## v0.8 Flow / Stat Revision

- Permanent stats are now managed **between runs**, not during an active run.
- Added an actual run lobby/splash screen.
- XP remains permanent and continues to provide a path forward for struggling players.
- Every stat point now gives an immediate benefit; removed 3-point milestone gating.

Current direct effects:

- Vitality: +1 max HP per point.
- Defense: +1 armor HP refreshed each room per point.
- Agility: +3% trolley speed per point.
- Power: +10% ball damage per point.
- Control: +3% trolley width per point for now.
- Fortune: +5% gold from treasure per point.

Stats remain freely reallocatable between runs.

## Brick Damage Art

- `assets/brick1.png` — full/healthy environmental brick.
- `assets/brick2.png` — damaged environmental brick.
- Brick art switches to `brick2.png` at half HP.

Future elements can reuse this state-driven art approach for ice, fire, armor, cracked walls, etc.

## Presentation

- Improved code-drawn trolley rail into an actual track with sleepers, metal rails, and bolts.
- Enemy shooter projectile is now a visible fiery bolt with trail instead of a simple circle.
- Between-run splash/lobby is now the natural home for future loadout, equipment, pet, dungeon choice, quests, and stat allocation.


## v0.9 — First Rune / Element Prototype

Run upgrades are now presented as temporary **Runes**:

- Ember Rune — gives the ball Fire.
- Impact Rune — +1 ball damage.
- Expansion Rune — +15% trolley width.
- Haste Rune — +15% trolley speed.
- Ward Rune — +1 armor refreshed each room.

Added the first elemental environment test:

- Ice bricks have 4 HP.
- Fire deals double damage to Ice.
- Hitting Ice with Fire creates an explosion that damages nearby bricks and mobs.
- Additional Ember Runes increase the explosion.

This is intentionally a prototype of runes before the equipment/socket system exists.

### Rune Direction — Hades-like Equipment Context

Long-term, a rune's effect can depend on **which equipment slot receives it** rather than every rune having only one universal effect.

Example Fire possibilities:

- Fire + Ball → fire damage / ignition / explosions.
- Fire + Boots → speed, flame trail, or movement effect.
- Fire + Helmet → offensive effect such as fiery/laser eyes.
- Fire + Chest → retaliation or burning defense.
- Fire + Ring/Amulet → elemental synergy/modifier.

Do not lock these exact effects yet. The important design direction is:

**Rune + Equipment Slot = specialized effect.**

The current v0.9 rune choices are a temporary bridge until equipment exists.


## v0.10 — Equipment Foundation

- Added a between-run Loadout screen.
- Gloves: Adventurer, Heavy (slower/+damage), Quick (faster/-damage).
- Balls: Iron, Piercing, Cinder.
- Piercing begins testing damage carry-through instead of immediate rebound when excess damage remains.
- Cinder makes Fire splash adjacent targets on every hit.
- Removed Ice bricks. Ice Goblins are now the first elemental enemy and are weak to Fire.
- Treasure blocks now reuse normal brick art with a yellow/gold hue.
- Shop now displays current gold.
- Patch Up is intended to be limited to one purchase per shop visit.
- Next major system: physical room exits/path decisions controlled by the adventurer.


## v0.10.1 — HP / Balls + Ice Attack + Hit Sound

- `assets/click.wav` is now referenced for ball impacts with the trolley and bricks/mobs.
- HP and ball lives are separate systems.
- Runs begin with 3 balls.
- Missing the ball removes one ball, not HP.
- The run ends if HP reaches 0 OR the player loses the final ball.
- Enemy damaging attacks continue to target HP.
- Ice Goblins now fire a distinct ice projectile.
- Ice projectile does no HP damage; it slows trolley movement by 30% for 3 seconds.
- Added visible slow feedback.
- Shop can restore one lost ball for 10 gold.
- Patch Up is limited to one purchase per shop visit.
- Fixed Cinder Ball Fire Splash so Fire splashes on every hit while Cinder is equipped.


## v0.11 — Split Hero/Trolley + Physical Path Choice

Implemented:

- `assets/hero1.png` and `assets/trolley_body.png` are now rendered independently.
- During combat the hero is drawn standing on the trolley.
- Clearing the final mob no longer jumps straight to the rune screen.
- The ball disappears, combat stops, and the hero hops off the trolley.
- Player controls the hero left/right using the same keyboard/touch input.
- Two physical doors appear:
  - Battle — standard next room.
  - Treasure — next room contains additional treasure blocks.
- Walking through a door selects the route.
- Rune choice appears after the physical route choice.
- The selected room type is then entered.

### Equipment Ideas — Parked

- Helmets can grant a **percentage chance to block incoming damage**.
- Some future weapons can use **ammo + cooldown** rather than behaving like the always-active ball.
- These should be class/weapon/equipment identity systems, not added to v0.11 yet.

### Class / Weapon Direction

Classes may ultimately be defined partly by their weapon system:

- Some use the traditional returning ball.
- Some weapons may have ammo.
- Some may recharge on cooldown.
- Some may create secondary attacks alongside the ball.

Keep this open until physical dungeon navigation and equipment feel solid.


## v0.11.1 — Hit Combo XP + Mounted Art Polish

- Consecutive target hits now build a hit combo.
- Combo counts brick, treasure, and mob damage.
- Combo resets when:
  - Ball returns to the trolley.
  - Ball is lost.
  - Room ends.
- Combo hits award small permanent XP:
  - x1–4: +1 XP/hit
  - x5–9: +2 XP/hit
  - x10–19: +3 XP/hit
  - x20+: +4 XP/hit
- Mob kills and room-clear XP remain separate.
- Mounted hero was lowered so he stands on the trolley instead of floating.
- Hero + trolley now mirror together based on the trolley's movement direction.


## v0.12 — Room Clear Flow + Shooter Telegraphs

Flow is now:

**Kill last mob → ROOM CLEARED → Rune reward → physical door decision → next room**

Combat additions:

- Ranged enemies visibly flash before firing.
- Basic shooters have a longer warning.
- Dark-red shooters are an upgraded ranged grunt:
  - More HP.
  - Shorter warning.
  - Fire a three-way projectile spread.
- Ice Goblins retain their slowing projectile.
- Enemy projectiles now support horizontal velocity for spread attacks.

### Enemy Taxonomy Direction

Color is an **element/variant layer across enemy families**, not a Raider-only naming scheme.

Enemy families can include:
- Grunt
- Raider
- Mystic
- Barbarian
- future families

Then colors/elements can modify any family:
- Red / Fire
- Blue / Ice
- Green / Poison
- Purple / future element/status
- neutral/armored variants

Example:
- Fire Grunt
- Ice Grunt
- Fire Raider
- Ice Raider
- Poison Mystic
- Fire Barbarian

### Mini-boss Plan

Do NOT introduce ordinary moving Raiders yet.

First moving enemy:
**Armored Raider mini-boss**

The boss introduces movement through spaces opened by destroyed bricks.
Defeating it unlocks normal Raider-family enemies in later encounters.
Those Raiders can then receive the same elemental/color variants as other enemy families.


## v0.13 — First Authored Section + Armored Raider

### Battles 1–4
Each uses a deliberately authored 4x5 formation (~20 board positions) instead of recycling the same layout.

- Battle 1: 2 Grey Grunts + 1 Fire Grunt.
- Battle 2: 2 Ice Grunts + 2 Green Grunts.
- Battle 3: 2 Ice + 2 Grey + 1 Dark-Red Fire Grunt.
- Battle 4: Grey-grunt endurance room.

Basic blocks continue filling the board around the enemies.

### Battle 5 — Armored Raider Mini-Boss
- Unique 5x8 boss arena.
- Middle row forms an open horizontal Raider lane.
- Raider begins centered.
- Other grunts remain in the arena.
- Raider patrols horizontally.
- Raider has an armor layer that absorbs damage before HP.
- Breaking armor enrages the Raider and increases movement speed.
- Clearing Battle 5 permanently records the Raider archetype as unlocked.
- Later rooms will add normal Raider enemies to encounter mixes.

### Survival Rule
- Enemy damage reduces HP.
- Reaching 0 HP costs one Ball/Life.
- HP then refills and the player continues the same run.
- Missing the ball also costs one Ball/Life.
- The run ends only when the final Ball/Life is lost.

### Audio
- `assets/bgmusic-bq.mp3` is dungeon background music.
- Loops during play.
- Starts after first user interaction for browser/mobile compatibility.

### Reward Flow
No separate ROOM CLEARED splash.
The rune/reward screen itself communicates **ROOM CLEARED**.

### Future Class / Weapon Concepts
- Mystic: gravity/magnet weapon. Finger/touch creates gravitational pull on ball trajectory; trolley may also generate an aura. Overlapping finger + trolley gravity amplifies the effect.
- Ranger: bow/target-lock direct attack; likely cooldown and/or limited ammo.
- Paladin: hold-to-block regenerative shield with its own shield HP.
- Class defines active weapon/ability.
- Equipment modifies the class/build rather than replacing class identity.
- Some weapons can use cooldowns, ammo-per-run, or both.


## v0.14 — Full Splash / Profiles / Options

The between-run lobby is now the game's full front door.

Main splash actions:
- Start Run
- Allocate Stats
- Loadout
- Profiles / New Game
- Options

### Profiles
Added 3 independent local save profiles.

Each profile has separate:
- XP / level
- Stat allocation
- Equipment / unlocks
- Best-room progress
- Future permanent progression

Existing legacy progress automatically migrates into **Adventurer 1 / Slot 1** so current progress is not intentionally discarded.

"New Game" now lives inside the profile system:
- Empty slot → Create
- Existing slot → New Game / Reset with confirmation
- Player can switch saves without erasing another adventurer

### Options
Added persistent global audio settings:
- Music volume
- SFX volume
- Mute/unmute music
- Mute/unmute SFX

Audio preferences are global rather than tied to a character profile.


## v0.14.1 — Room/Boss Repair + Reward Transition

Fixed:
- Standard rooms correctly spawn authored enemy types instead of auto-clearing.
- Neutral Grunts now visibly render grey.
- Fire, Ice, Green, Dark-Red, and Raider identifiers are correctly built from the room layout.
- Room 5 Raider is restored as the `R` enemy type.
- 8-column boss arena now dynamically shrinks its cells and centers itself instead of using 5-column placement math.
- Armored Raider is visually larger than a normal grunt.
- Raider movement lane is centered inside the open middle corridor.

Reward flow:
1. Final mob dies.
2. Trolley/hero re-center.
3. ROOM CLEARED rune panel rises onto the screen.
4. Player chooses rune.
5. Mounted hero/trolley shakes briefly.
6. Hero hops off.
7. Player physically chooses the next door.

### Standard vs Hard Route Direction

Do not define Hard as blindly "double every enemy."

Use a **threat-budget multiplier**:
- Standard: roughly 1.0x encounter modifier budget.
- Hard: roughly 1.7–2.0x modifier budget.

Example if the base encounter modifier is:
- +1 Grey Grunt
- +1 Fire Grunt
- +1 Ice Grunt

A Hard version may use:
- +2 Grey
- +1 Dark-Red Fire instead of simply +2 Fire
- +2 Ice

This keeps Hard more dangerous without overcrowding every board or creating unreadable projectile spam.

Hard routes should eventually offer visibly better rewards.


## v0.15 — Raider Archetype Retry

Enemy identity is now explicitly split into two layers:

### Archetype = what the enemy DOES
- **Grunt:** current `gob1.png` prison-block enemy. Stationary.
- **Raider:** `mob-skel-arch.png`. Mobile archer. Moves horizontally and aims arrows directly at the trolley/player instead of firing straight down.
- Mystic / Barbarian remain future archetypes.

### Hue = elemental / special power
The artwork itself does **not** define the element.
Any archetype can later receive a hue/power modifier.

Examples:
- Blue Grunt = Ice Grunt.
- Blue Raider = Ice Raider.
- Dark-red Raider = Fire/spread variant if designed that way.
- Purple can later represent the Black Hole power regardless of whether the base enemy is a Grunt, Raider, Mystic, etc.

### Planned Purple / Black Hole Power
Future concept, not implemented yet:
- Purple caster fires/creates a black hole.
- If the player's ball enters the black hole, that ball is trapped.
- If the caster survives / effect completes, player loses the trapped ball/life.
- If the player kills the caster while the ball is trapped, the ball is freed.
- Successful rescue rewards a multiball.
- Needs strong telegraphing and a fair escape/rescue window.

### Room 5 Mini-Boss
- Uses `assets/mob-skel-arch.png`.
- Raider moves horizontally through the center lane.
- Raider telegraphs bow shots.
- Arrow aims directly at the player's current position when fired.
- Armor absorbs damage before HP.
- Armor break enrages Raider: faster movement and faster arrows.
- Support Grey Grunts remain in the boss room.
- Wider board remains dynamically fitted/centered.


## v0.15.1 — Stabilization / Claude Audit Cleanup

Fixed from external code audit:

- Rooms 6+ no longer repeat the Room 5 mini-boss arena.
  - Temporary fallback is the authored Room 4 formation until Rooms 6–10 are designed.
  - Treasure routes continue working after Room 5.
- Removed duplicate top-level function definitions left by iterative patching.
- Heavy / Quick Gloves now actually affect ball speed.
- Piercing Ball now uses a damage pool:
  - excess damage carries through destroyed targets,
  - ball continues until remaining damage is exhausted,
  - then the normal bounce occurs.
- Profile/localStorage JSON loading is protected against malformed save data.
- Shop gold display restored.
- Cinder Ball now grants Fire Splash by itself and counts as Fire against Ice enemies.
- Removed a few dead upgrade/stat remnants from older builds.
- Post-reward shake has the same anticipation duration but fewer oscillations.

### Mob Art Sizing
Source PNG dimensions no longer matter.

All enemy art is fit into code-defined gameplay rectangles while preserving image aspect ratio:
- Grunt uses the same block/collision footprint regardless of PNG resolution.
- Raider can be rendered larger than its collision cell intentionally.
- Future Mystic, Barbarian, etc. can each have unique source dimensions without requiring manual image resizing.

### Temporary Content Rule
Room 5 remains the only Armored Raider mini-boss.
Rooms 6+ temporarily reuse Room 4 rather than accidentally respawning a broken boss.
The next content pass should author Rooms 6–10.


## v0.15.2 — Portal Freeze Hotfix

Fixed a regression introduced during the v0.15.1 cleanup:

- `updateUpgradeText()` was removed as dead legacy code.
- `startRoom()` still called the removed function.
- Entering a dungeon portal eventually calls `startRoom()`, causing a runtime ReferenceError and making the transition appear frozen.
- `startRoom()` now correctly calls `updateRuneText()`.

No gameplay/balance changes in this hotfix.


## v0.16 — Ranger Weapon + Route Pass

### Ranger
- First active class prototype is Ranger.
- Tap/click a living mob to fire the Bow.
- Bow arrow physically travels from the hero to the selected target.
- 3 damage, 2-second cooldown, unlimited ammo for this prototype.
- Enemy taps are consumed by the weapon so the same tap does not also steer/launch.
- This is intentionally one class first; Mystic gravity and Paladin shield remain later tests.

### Enemy Placement
- Normal-room board geometry remains authored.
- Existing mob positions act as enemy sockets.
- Mob identities are shuffled among those sockets each run.
- Room 5 boss placement remains fully hard-coded.

### Route Choices
- Shop is no longer an automatic every-third-room interruption.
- Physical route doors can now offer Standard, Hard, Treasure, or Shop.
- Shop does not increment the combat room by itself; leaving it advances to the next combat room.
- Shop is excluded from the first route choice.
- Hard currently adds +2 HP to alternating mobs as an initial threat-budget prototype.
- Treasure retains the extra yellow-hued treasure-brick behavior.

### v0.16 Compatibility Fix
- Preserves/restores the Raider Archer aimed-arrow behavior: the Room 5 Raider aims at the trolley at release time instead of firing straight down.


## v0.16.1 — Freeze / Damage Sources / Raider Visuals

### Freeze Stacking
- Ice slow stacks up to 3 times.
- Each Ice hit refreshes the 3-second duration.
- 1 stack = 75% movement speed.
- 2 stacks = 58% movement speed.
- 3 stacks = 40% movement speed.
- Hero + trolley are tinted increasingly blue while frozen.
- Freeze is capped so the player can never be slowed below 40%.

### Separate Damage Sources
Ball damage and class-weapon damage are now separate systems.

**Ball damage can:**
- use ball damage stats/equipment,
- trigger Ember/Cinder,
- exploit Ball elemental weaknesses,
- trigger Fire splash,
- build Ball combo XP,
- use Ball piercing.

**Ranger Bow weapon damage:**
- deals its own direct weapon damage,
- does not inherit ball Fire,
- does not trigger Cinder/Ember splash,
- does not use Ball piercing,
- does not add Ball combo XP.

Raider armor remains universal defense and can be damaged by either source.

### Raider Visuals
- Raider image is forced into the exact same gameplay cell dimensions as Grunt enemy blocks, regardless of source PNG dimensions or padding.
- While Raider armor remains, a pulsing grey shield outline surrounds the block.
- Shield disappears immediately when armor breaks.


## v0.16.2 — Door Routing / Baseline Treasure / Grunt Art Width

### Door Routing Fix
- Left/right movement no longer implies Standard/Treasure.
- Each physical doorway owns an explicit route type.
- Crossing the left threshold commits `exitChoice.leftType`.
- Crossing the right threshold commits `exitChoice.rightType`.
- Legacy `battle` naming is normalized to `standard`.
- Console now prints the actual selected route and room for easier testing.

### Treasure Distribution
Standard rooms now have baseline loot potential:
- ~45% chance for 1 treasure brick.
- Small additional chance for a second.

Hard rooms:
- ~30% chance for 1 treasure brick.

Treasure routes:
- 5–7 treasure bricks where enough normal environmental bricks exist.

Treasure route is therefore a strong loot choice, not the only way treasure can ever appear.

### Enemy Art Sizing
- Grunt collision/gameplay cell is unchanged.
- Grunt artwork is rendered about 16% wider inside the same cell so its visible prison-block frame better matches the Raider and environmental brick width.
- Raider dimensions remain unchanged from v0.16.1 because its height/overall footprint looked correct.


## v0.16.3 — Reusable Route Door Asset

- Added `assets/door.png`.
- All physical route doors use the same single image.
- Standard keeps the original blue portal.
- Hard, Treasure, and Shop are created with canvas hue/filter changes.
- Route icon, label, and detail stay code-driven.
- Door destination still comes from the doorway's assigned route type.


## v0.16.4 — Generic Element Splash FX
- Wired `assets/bg-ball.png` as the reusable impact/splash visual.
- Fire splash now has a visible expanding effect at its origin.
- Visual FX are separate from damage logic.
- Same asset is ready to tint for Fire, Ice, Poison, and Arcane effects later.


## v0.16.5 — Portal Visibility / Collision Face / Stun Grunt

### Portal
- Cropped `assets/door.png` down to its visible portal content so the actual doorway fills the draw rectangle.
- Added a route-colored glow behind every portal, so doors remain visible even if the image is still loading.
- Standard blue, Hard red, Treasure gold, Shop purple.

### Block Collision Readability
- Brick/mob collision faces are inset slightly from their full canvas cell.
- This compensates for transparent art padding and lets the visible Ball reach the visible square before bouncing.
- Piercing now only continues through a target when that target was actually destroyed and excess damage remains.

### Stun Grunt
- Added the first Stun enemy power.
- Stun Grunt is a yellow/electric stationary Grunt.
- Telegraphs before firing.
- Stun projectile does not deal HP damage.
- On hit, trolley control is disabled for 1.15 seconds while the Ball continues moving.
- Player/trolley receive a bright electric/stunned tint during the effect.
- Hard Room 4 now guarantees at least one active Stun threat instead of only adding Grey-Grunt HP.


## v0.17 — Skill / Equipment / Rune Rules

### Core Rule
**Skill = active player action.**
**Equipment = changes gameplay rules.**
**Runes = temporary numeric/stat boosts during a run.**

### Ranger Skill — Bow Shot
- Bow Shot is a class skill, not a weapon/equipment item.
- Tap/click a living enemy to use it.
- 1 direct skill damage.
- 5 second base cooldown.
- Unlimited uses, gated by cooldown.
- Does not inherit Ball Fire, Cinder, piercing, Ball combo XP, or other Ball effects.
- Cooldown Runes can reduce the cooldown, capped at 45% reduction.

### Equipment
Equipment remains permanent and chosen between runs.
It can create mechanics rather than only numbers.

Examples:
- Cinder Ball = Ball gains Fire/splash behavior.
- Piercing Ball = excess Ball damage carries through destroyed targets.
- Future shield gear = grants shield behavior.
- Future boots = movement handling.
- Future helmet/chest/ring/amulet/trolley = defensive, elemental, or utility mechanics.

### Runes
Runes are now run-only stat modifiers.

Current Rune pool:
- Power: +10% Ball damage.
- Tempo: +8% Ball speed.
- Drag: -8% Ball speed.
- Agility: +10% trolley speed.
- Expansion: +10% trolley width.
- Vitality: +10% max HP.
- Focus: -8% class-skill cooldown.
- Mass: +8% Ball size.
- Element: +12% elemental-effect strength.

### Caps
Physical/stat caps prevent runaway builds from breaking the game:
- Ball damage multiplier: 2.5x.
- Ball speed: 55% to 175% of base.
- Trolley speed: max 175%.
- Trolley width: max 160%.
- Max HP from runes: max +100%.
- Class-skill cooldown reduction: max 45%.
- Ball size: max +50%.
- Elemental-effect strength: max 2x.

Some future runes can be equipment- or skill-specific instead of universal.


## v0.17.1 — Startup Hotfix
- Fixed Ranger Skill HUD DOM IDs after the Weapon → Skill rename.
- The old JS selectors were returning `null`, causing the first animation frame to throw and making the game appear not to load.
- Removed the leftover `runes.ward` reference from room-start armor.
- Removed the leftover `runes.ember` reference from Ball rendering; Cinder Ball now owns the Fire Ball visual as intended.
- No balance changes from v0.17.


## v0.17.2 — Game Loop Scope Hotfix
- Fixed malformed Stun movement patch that accidentally inserted player-stun logic inside `updateExitChoice()`.
- The missing block closure caused `updatePlayer()` and subsequent declarations to be scoped inside the door function.
- `gameLoop()` therefore threw `ReferenceError: updatePlayer is not defined`.
- Rebuilt `updateExitChoice()`, `commitExitDoor()`, `chooseDungeonExit()`, and `updatePlayer()` as clean top-level functions.
- Stun still disables trolley control while active.
- Door movement remains independent of combat stun.
- `favicon.ico` 404 is unrelated and harmless.


## v0.17.3 — Fine-Tuning Pass
- Freeze now tests 30% / 60% / 90% slow at stacks 1/2/3.
- Freeze tint gets much stronger at each stack.
- Rune rewards now roll exactly 3 random choices from the current pool.
- Shop is removed from active route rolls for now; only Standard / Hard / Treasure appear.
- After hopping off the trolley, route choice uses full 2D movement.
- PC: WASD or arrows. Mobile: drag toward your destination.
- Entering the actual portal area selects that route.
- This movement is groundwork for a future interactive shopkeeper and walk-up items.
