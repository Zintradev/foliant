import { FoliantProject } from '../types/project';

/**
 * DEFAULT_PROJECT: Massive High-Stakes Dark Fantasy Epic Manuscript
 * Title: "The Sunken Crown: Chronicles of the Obsidian Veil"
 * Designed for extensive performance, UI stress-testing, and relationship graph benchmarking.
 */
export const DEFAULT_PROJECT: FoliantProject = {
  id: 'project-sunken-crown-epic',
  title: 'The Sunken Crown: Chronicles of the Obsidian Veil',
  lastModified: Date.now(),
  targetWords: 120000,

  // ---------------------------------------------------------------------------
  // 1. CHAPTERS & SCENES (4 Acts, 18 Scenes)
  // ---------------------------------------------------------------------------
  chapters: [
    // ACT I
    {
      id: 'act-1',
      title: 'Act I: The Shattered Eclipse',
      content: '',
      synopsis: 'The sudden assassination of High King Voron plunges Oakhaven into paranoia as forbidden runes ignite in the crypts below.',
      type: 'folder',
      parentId: null,
      targetWords: 25000,
      status: 'Completed',
    },
    {
      id: 'scene-1-1',
      title: 'Chapter 1: The Ash Upon the Throne',
      content:
        '<p>The crown did not fall with a clang; it melted into black tallow before it even touched the marble dais. Valerius Sterling stood motionless before the scorched throne, his gauntlets dripping with runic wax that chilled his skin rather than burning it.</p><p>Behind him, the great brass doors groaned under the battering rams of the City Guard. The king had died without uttering a single prayer, whispering only a coordinate that led deep into the sunken crypts of the Whisperwood valley. Valerius clenched his fist, feeling the fractured royal signet dig deep into his palm.</p><p>Lanterns flickered frantically as Vespera stepped out from the tapestries, her silk cowl smelling faintly of aconite and brimstone. "They will blame the Iron Legion, Lord Commander," she murmured with a serene smile. "Unless, of course, you hand me the ledger before the Inquisitor arrives."</p>',
      synopsis: 'Valerius discovers the king assassinated by runic fire and is cornered by Vespera.',
      type: 'scene',
      parentId: 'act-1',
      targetWords: 4500,
      status: 'Completed',
      attachedCharacterIds: ['char-1', 'char-2'],
    },
    {
      id: 'scene-1-2',
      title: 'Chapter 2: The Inquisitor’s Lantern',
      content:
        '<p>Grand Inquisitor Morvath did not enter rooms; he purged them. His iron lantern swung in a deliberate, sickening rhythm, throwing cage-like shadows across the cathedral arches. His acolythic guards formed a wall of pointed halberds around the dead courtiers.</p><p>"Tell me, Lord Commander," Morvath’s voice scraped like dry shale, "why is it that the only blade left unbloodied in the sovereign’s sanctum bears the standard of your own vanguard? Did the King’s breath falter by God’s will, or by your impatience?"</p><p>Valerius held the Inquisitor’s unblinking gaze. Outside in the courtyard, rain began to fall in heavy, tar-scented sheets, drowning the screams of the royal stable hands.</p>',
      synopsis: 'Inquisitor Morvath interrogates Valerius in the throne room.',
      type: 'scene',
      parentId: 'act-1',
      targetWords: 4000,
      status: 'Completed',
      attachedCharacterIds: ['char-1', 'char-4'],
    },
    {
      id: 'scene-1-3',
      title: 'Chapter 3: Alleys of Smoke and Silk',
      content:
        '<p>In the Low Docks of Oakhaven, the fog was an accomplice to murder. Caelen balanced on the greasy coping of a distillery rooftop, watching three cloaked couriers sprint into the cellar of the Blind Raven tavern.</p><p>Below him, Princess Aurelia pulled her coarse woolen hood tighter over silver hair that marked her for death. She had traded her diamond-encrusted pendant for a serrated boot dagger that bit into her ankle with every step.</p><p>"Keep your hands off the hilts," Caelen hissed from the shadows above. "The Silk Syndicate does not sell tickets out of the capital for charity. They want your bloodline’s cipher, girl, not your promises."</p>',
      synopsis: 'Caelen escorts Aurelia through the lower slums to meet with Vespera’s contacts.',
      type: 'scene',
      parentId: 'act-1',
      targetWords: 3800,
      status: 'Revised',
      attachedCharacterIds: ['char-3', 'char-5'],
    },
    {
      id: 'scene-1-4',
      title: 'Chapter 4: The Alchemist’s Warning',
      content:
        '<p>Master Balthazar’s workshop was a cathedral of brass condensing coils, simmering emerald resins, and pickled parchment. He held up a glass phial containing ash collected from the King’s skull.</p><p>"This is not sulfur, Sterling," the old man wheezed, his cataract-milky eyes narrowing behind triple-lensed spectacles. "This residue was forged in the Sunless Abyss. The seal didn’t break from the outside. Someone invited the tide in."</p><p>A sudden detonation rocked the lower terrace, shattering row upon row of amber glassware into deadly shimmering hail.</p>',
      synopsis: 'Balthazar analyzes the regicide residue and confirms the abyss seal is breached.',
      type: 'scene',
      parentId: 'act-1',
      targetWords: 3200,
      status: 'First Draft',
      attachedCharacterIds: ['char-1', 'char-6'],
    },

    // ACT II
    {
      id: 'act-2',
      title: 'Act II: Whispers in the Deep Trench',
      content: '',
      synopsis: 'Expedition into the submerged catacombs beneath Oakhaven to locate the Primordial Runic Matrix.',
      type: 'folder',
      parentId: null,
      targetWords: 35000,
      status: 'In Progress',
    },
    {
      id: 'scene-2-1',
      title: 'Chapter 5: Beneath the Walled Terraces',
      content:
        '<p>Water dripped through ancient masonry, each droplet echoing like a metronome in the flooded under-crypts. Seraphina Drake tested the tension of her ballista cables while her ironclad mercenaries muttered superstitious warding chants.</p><p>"The contract paid in gold bullion, Sterling, not in ghost stories," Seraphina said, lighting a torch with flint. The flare illuminated murals of gargantuan serpentine deities consuming the sun. "If these ruins awaken, double my company’s wages or we seal the iron gate behind you."</p><p>Valerius nodded curtly. Beside him, Aurelia touched the damp stone glyphs, her fingertips glowing with pale azure luminescence.</p>',
      synopsis: 'The expedition descends into the flooded catacombs with Seraphina’s mercenaries.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 5200,
      status: 'In Progress',
      attachedCharacterIds: ['char-1', 'char-5', 'char-7'],
    },
    {
      id: 'scene-2-2',
      title: 'Chapter 6: The Anvil of the Lost',
      content:
        '<p>Deep in the cavernous forge-hollow, Ignis worked by the light of subterranean magma veins. His hammer fell on blackened skymetal with concussive blows that reverberated in their ribcages.</p><p>"You bring royal blood to the deep furnace?" Ignis growled without halting his hammer. "The last prince who stood where you stand traded half his soul for a blade that could pierce dragonhide. He choked on his own marrow three moons later."</p><p>Aurelia stepped forward, her voice calm and unbroken: "I am not here for a sword, blacksmith. I am here to reforge the crown that shattered."</p>',
      synopsis: 'Aurelia and Valerius negotiate with the subterranean rune-smith Ignis.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 4200,
      status: 'First Draft',
      attachedCharacterIds: ['char-5', 'char-8'],
    },
    {
      id: 'scene-2-3',
      title: 'Chapter 7: The Blind Prophet’s Oracle',
      content:
        '<p>Lyanna sat atop a throne of calcified whalebone, her bandaged eye sockets turned upward toward water seeping through stalactites. She smelled of salt and dried rosemary.</p><p>"Three crowns," she whispered, her voice layered with harmonics that seemed to come from the deep ocean floor. "One of iron, forged in grief. One of silk, woven with poison. One of ash, worn by a ghost who still thinks his heart beats."</p><p>Caelen stepped backward into the gloom, his hand instinctively gripping the hilt of his shortsword as the water around their boots began to churn with pale, phosphorescent eels.</p>',
      synopsis: 'Oracle Lyanna delivers the tripartite prophecy of the three crowns.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 3900,
      status: 'In Progress',
      attachedCharacterIds: ['char-3', 'char-9'],
    },
    {
      id: 'scene-2-4',
      title: 'Chapter 8: The Ambush at Blackford Sluice',
      content:
        '<p>Crossbow bolts erupted from the arrow-slits of the ancient aqueduct before the scouts could shout a warning. Morvath’s purifiers had flanked them through the subterranean sewer conduits.</p><p>Doran swung his tower shield forward just in time to deflect a volleys of barbed iron bolts. "Sterling!" Doran roared, his beard flecked with spit and mud. "The Inquisitor has brought incendiary oil! If they light the chamber, the fumes will asphyxiate us all!"</p><p>Valerius drew his longsword, runic script shimmering violet along the fuller as he charged into the narrowing bottleneck.</p>',
      synopsis: 'Morvath’s inquisitorial vanguard ambushes the party in the flooded aqueduct.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 4800,
      status: 'First Draft',
      attachedCharacterIds: ['char-1', 'char-4', 'char-10'],
    },
    {
      id: 'scene-2-5',
      title: 'Chapter 9: The Envoy’s Bargain',
      content:
        '<p>In a neutral dry chamber between subterranean sluices, Cipher Envoy Nolan awaited them, flanked by two foreign guards in lacquered armor. On the slate table rested a sealed velvet dispatch box.</p><p>"The Eastern Coalition has no interest in your throne, Sterling," Nolan purred, pouring spiced wine into tin goblets. "We merely desire maritime passage through the Kraken Gulf. Sign the naval treaty, and twelve thousand veteran dragoons will land in your bay before the next crescent moon."</p><p>Vespera, emerging unseen from the corridor behind them, tilted her head. "Do not sign it, Valerius. His fleet sailed three days ago—and not to your aid."</p>',
      synopsis: 'Diplomatic standoff with Envoy Nolan revealing hidden coalition fleets.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 4100,
      status: 'First Draft',
      attachedCharacterIds: ['char-1', 'char-2', 'char-11'],
    },

    // ACT III
    {
      id: 'act-3',
      title: 'Act III: The Siege of High Bastion',
      content: '',
      synopsis: 'Open civil war breaks out as Morvath declares the capital under martial inquisition.',
      type: 'folder',
      parentId: null,
      targetWords: 35000,
      status: 'Not Started',
    },
    {
      id: 'scene-3-1',
      title: 'Chapter 10: The Red Bell Tolls',
      content:
        '<p>The iron bell of High Bastion tolled eighteen times—the ancient proclamation of an illegitimate reign. Smoke billowed from the merchant quarter as grain storehouses burned against the night sky.</p><p>From the battlements, Seraphina watched the Inquisitorial war machines assemble. "They have brought siege trebuchets armed with Greek fire," she stated with cold professional detachment. "We can hold the outer curtain wall for four hours. After that, we fight room by room."</p><p>Valerius strapped his breastplate tight. "Four hours is all Aurelia needs to reach the upper spire."</p>',
      synopsis: 'Morvath lays siege to the High Bastion while Seraphina prepares defenses.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 4600,
      status: 'Not Started',
      attachedCharacterIds: ['char-1', 'char-7'],
    },
    {
      id: 'scene-3-2',
      title: 'Chapter 11: The Mad King’s Chamber',
      content:
        '<p>At the apex of the Black Spire, Sylas sat in iron chains that hung from vaulted rafters. His beard was tangled with parchment scraps and dried tallow, his eyes reflecting fractured light from stained glass windows.</p><p>"You look just like your grandfather, girl," Sylas chuckled, coughing up dark phlegm. "He thought he could cage the Leviathan too. He thought the treaty was written in ink. It was written in the salt of our children’s tears!"</p><p>Aurelia approached the chained monarch, holding the runic parchment found in Balthazar’s archives.</p>',
      synopsis: 'Aurelia confronts the imprisoned former King Sylas to unlock the final binding glyph.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 3900,
      status: 'Not Started',
      attachedCharacterIds: ['char-5', 'char-12'],
    },
    {
      id: 'scene-3-3',
      title: 'Chapter 12: Breach of the Iron Gate',
      content:
        '<p>The heavy oak and iron gates shattered inwards with a thunderclap that threw thirty defenders to the flagstones. Morvath strode through the splintered timber, his robes untouched by soot or blood.</p><p>Doran met him at the threshold, swinging his greathammer in a devastating arc that cracked the Inquisitor’s ceremonial shield. But Morvath’s second in command fired point-blank into the gap of Doran’s plate collar.</p><p>The veteran fell to one knee, coughing blood onto the banner of Oakhaven.</p>',
      synopsis: 'The bastion gate is breached and Doran makes a heroic last stand.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 4300,
      status: 'Not Started',
      attachedCharacterIds: ['char-4', 'char-10'],
    },
    {
      id: 'scene-3-4',
      title: 'Chapter 13: Shadows Over the Parapet',
      content:
        '<p>Caelen sprinted along the narrow rain-slick parapets, dodging crossbow bolts and throwing smoke grenades into the crowded embrasures. Below, Vespera guided the wounded archers into the secret subterranean waterways.</p><p>"Caelen!" she called upward over the din of battle. "The fleet is landing in the harbor! Nolan has betrayed both sides!"</p><p>A cannonade from the harbor confirmed her words, tearing through the naval towers and painting the low clouds with fiery crimson.</p>',
      synopsis: 'Caelen and Vespera coordinate the tactical retreat as foreign fleets bombard the bay.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 4000,
      status: 'Not Started',
      attachedCharacterIds: ['char-2', 'char-3', 'char-11'],
    },
    {
      id: 'scene-3-5',
      title: 'Chapter 14: Duel on the Sunlit Dais',
      content:
        '<p>Valerius and Morvath met in the center of the shattered courtyard, surrounded by burning tapestries and rain that hissed on superheated flagstones. Steel met enchanted iron in sparks that blinded the few surviving guards.</p><p>"You cannot rule a kingdom built on rot, Sterling!" Morvath bellowed, his mace grazing Valerius’s cheekbone. "Only through holy fire can the slate be cleaned!"</p><p>"I do not wish to rule," Valerius replied, his blade slicing clean through the inquisitorial lantern’s chain.</p>',
      synopsis: 'The climatic duel between Valerius and Inquisitor Morvath.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 5100,
      status: 'Not Started',
      attachedCharacterIds: ['char-1', 'char-4'],
    },

    // ACT IV
    {
      id: 'act-4',
      title: 'Act IV: The Obsidian Dawn',
      content: '',
      synopsis: 'The aftermath of the siege, the coronation, and the awakening of the oceanic abyss.',
      type: 'folder',
      parentId: null,
      targetWords: 25000,
      status: 'Not Started',
    },
    {
      id: 'scene-4-1',
      title: 'Chapter 15: The Ashes of Oakhaven',
      content:
        '<p>Morning brought no warmth, only a pale gray luminescence that revealed the scope of destruction. Half the capital was smoking timber and silent ruins. Survivors huddled around braziers in the cathedral square.</p><p>Seraphina surveyed her remaining troops, counting barely two hundred able-bodied pikemen. "The siege is broken, but winter is coming. Without food from the southern valleys, the city will starve before the first snow."</p><p>Valerius stood beside her, his wounded shoulder bound in linen soaked in Balthazar’s salve.</p>',
      synopsis: 'Assessing the cost of victory and facing the looming famine.',
      type: 'scene',
      parentId: 'act-4',
      targetWords: 3700,
      status: 'Not Started',
      attachedCharacterIds: ['char-1', 'char-6', 'char-7'],
    },
    {
      id: 'scene-4-2',
      title: 'Chapter 16: The Coronation of Silver',
      content:
        '<p>Aurelia knelt before the reconstructed throne. In place of the melted gold crown, Ignis placed upon her brow a circlet forged from meteoric iron and cold ocean glass.</p><p>"I claim no divine right," Aurelia spoke, her voice carrying across the thousands gathered in the courtyard. "I claim only the burden of the wall and the shield. Until the sea reclaims this soil, Oakhaven stands free."</p><p>Vespera bowed from the council bench, her smile enigmatic and calculating.</p>',
      synopsis: 'Aurelia is crowned Queen of Oakhaven with the newly forged crown.',
      type: 'scene',
      parentId: 'act-4',
      targetWords: 4400,
      status: 'Not Started',
      attachedCharacterIds: ['char-2', 'char-5', 'char-8'],
    },
    {
      id: 'scene-4-3',
      title: 'Chapter 17: Shadows on the Horizon',
      content:
        '<p>On the high cliffs of the Whisperwood promontory, Caelen watched the remnants of Nolan’s fleet retreat into the fog. Beside him, Oracle Lyanna pointed her slender finger toward the open sea.</p><p>"They are not fleeing," Lyanna whispered, the wind whipping her salt-bleached robes. "They are clearing the waters for what rises from the abyss."</p><p>Far out in the deep water, a black wave forty fathoms high crested without wind, pulsing with deep violet bioluminescence.</p>',
      synopsis: 'The sea stirs as the true threat awakens beneath the ocean floor.',
      type: 'scene',
      parentId: 'act-4',
      targetWords: 4100,
      status: 'Not Started',
      attachedCharacterIds: ['char-3', 'char-9'],
    },
    {
      id: 'scene-4-4',
      title: 'Chapter 18: Epilogue: The Ledger of the Deep',
      content:
        '<p>In his private study, Valerius opened the royal cipher ledger that had started the war. The pages, once covered in unyielding code, had rewritten themselves in luminescent oceanic script.</p><p>On the final page, written in fresh black ink that never dried, was a single command: <i>The crown is worn; now summon the Tide.</i></p><p>Valerius closed the heavy leather cover and blew out the candle.</p>',
      synopsis: 'The final mystery reveals the true nature of the royal covenant.',
      type: 'scene',
      parentId: 'act-4',
      targetWords: 2800,
      status: 'Not Started',
      attachedCharacterIds: ['char-1'],
    },
  ],

  // ---------------------------------------------------------------------------
  // 2. CHARACTERS (12 Rich Characters)
  // ---------------------------------------------------------------------------
  characters: [
    {
      id: 'char-1',
      name: 'Archon Valerius Sterling',
      role: 'Protagonist',
      summary:
        'Lord Commander of the Royal Guard. A battle-hardened tactician burdened by the mystery of the king’s regicide and his own conflicting loyalties.',
      tags: [
        { id: 'tag-1', label: 'Commander', color: 'emerald' },
        { id: 'tag-2', label: 'Swordsman', color: 'blue' },
        { id: 'tag-3', label: 'Stoic', color: 'zinc' },
      ],
      fields: [
        { id: 'cf-1', label: 'Motivation', value: 'Uncover the truth behind King Voron’s murder and prevent civil slaughter' },
        { id: 'cf-2', label: 'Fatal Flaw', value: 'Excessive adherence to oaths even when institutions have rotted' },
        { id: 'cf-3', label: 'Weapon of Choice', value: 'Runic Bastard Sword "Oathkeeper"' },
      ],
    },
    {
      id: 'char-2',
      name: 'Lady Vespera Thorne',
      role: 'Supporting',
      summary:
        'Matron of the Silk Syndicate. Operates the underground spy network spanning from the merchant docks to the high council chambers.',
      tags: [
        { id: 'tag-4', label: 'Spymaster', color: 'purple' },
        { id: 'tag-5', label: 'Noble', color: 'rose' },
        { id: 'tag-6', label: 'Poisoner', color: 'amber' },
      ],
      fields: [
        { id: 'cf-4', label: 'Motivation', value: 'Dismantle royal monopolies and install a puppet merchant council' },
        { id: 'cf-5', label: 'Secret', value: 'Financed the alchemical experiments that accidentally caused the king’s death' },
      ],
    },
    {
      id: 'char-3',
      name: 'Caelen the Silent',
      role: 'Supporting',
      summary:
        'Exiled ranger and catacomb scout. Knows the sunken routes beneath Oakhaven better than any living soul.',
      tags: [
        { id: 'tag-7', label: 'Scout', color: 'cyan' },
        { id: 'tag-8', label: 'Outlaw', color: 'amber' },
      ],
      fields: [
        { id: 'cf-6', label: 'Motivation', value: 'Redeem his family name after being falsely blamed for the border massacre' },
        { id: 'cf-7', label: 'Unique Skill', value: 'Night vision and uncanny hearing in subterranean labyrinths' },
      ],
    },
    {
      id: 'char-4',
      name: 'Grand Inquisitor Morvath',
      role: 'Antagonist',
      summary:
        'Fanatical leader of the Order of the Sunless Flame. Believes only an iron purification can save humanity from oceanic corruption.',
      tags: [
        { id: 'tag-9', label: 'Zealot', color: 'rose' },
        { id: 'tag-10', label: 'Inquisitor', color: 'purple' },
      ],
      fields: [
        { id: 'cf-8', label: 'Motivation', value: 'Cleanse Oakhaven of heresy and burn all forbidden runic manuscripts' },
        { id: 'cf-9', label: 'Psychology', value: 'Considers collateral civilian deaths as holy martyrdom' },
      ],
    },
    {
      id: 'char-5',
      name: 'Princess Aurelia Voron',
      role: 'Protagonist',
      summary:
        'Sole surviving heir to the High Throne. Possesses dormant runic talent that resonates with the deep oceanic matrix.',
      tags: [
        { id: 'tag-11', label: 'Royalty', color: 'blue' },
        { id: 'tag-12', label: 'Rune-Weaver', color: 'cyan' },
      ],
      fields: [
        { id: 'cf-10', label: 'Motivation', value: 'Rebuild Oakhaven as an enlightened realm free from religious zealotry' },
        { id: 'cf-11', label: 'Burden', value: 'Every rune cast drains her physical vitality' },
      ],
    },
    {
      id: 'char-6',
      name: 'Master Alchemist Balthazar',
      role: 'Supporting',
      summary:
        'Chief researcher of the Arcane Guild. Half-blind scholar who decoded the chemical composition of the regicidal ash.',
      tags: [
        { id: 'tag-13', label: 'Scholar', color: 'emerald' },
        { id: 'tag-14', label: 'Alchemist', color: 'amber' },
      ],
      fields: [
        { id: 'cf-12', label: 'Motivation', value: 'Preserve the imperial archives before Morvath consigns them to flames' },
      ],
    },
    {
      id: 'char-7',
      name: 'Seraphina Drake',
      role: 'Supporting',
      summary:
        'Captain of the Iron Legion mercenaries. Pragmatic, ruthless in combat, and fiercely protective of her soldiers.',
      tags: [
        { id: 'tag-15', label: 'Mercenary', color: 'zinc' },
        { id: 'tag-16', label: 'Warrior', color: 'rose' },
      ],
      fields: [
        { id: 'cf-13', label: 'Code of Honor', value: 'A contract sealed with gold is inviolable until death' },
      ],
    },
    {
      id: 'char-8',
      name: 'Ignis the Rune-Smith',
      role: 'Supporting',
      summary:
        'Deep-vault blacksmith who works with skymetal and volcanic heat. The only living artisan capable of shaping oceanic glass.',
      tags: [
        { id: 'tag-17', label: 'Artisan', color: 'amber' },
        { id: 'tag-18', label: 'Subterranean', color: 'purple' },
      ],
    },
    {
      id: 'char-9',
      name: 'Oracle Lyanna',
      role: 'Supporting',
      summary:
        'Blind seer connected to the abyssal ley-lines. Her prophetic utterances predict the rising tide and the tripartite crown.',
      tags: [
        { id: 'tag-19', label: 'Prophet', color: 'cyan' },
        { id: 'tag-20', label: 'Mystic', color: 'blue' },
      ],
    },
    {
      id: 'char-10',
      name: 'Doran the Ironclad',
      role: 'Supporting',
      summary:
        'Veteran royal bodyguard. Valerius’s former mentor whose steadfast loyalty provides the backbone of the resistance.',
      tags: [
        { id: 'tag-21', label: 'Veteran', color: 'zinc' },
        { id: 'tag-22', label: 'Guardian', color: 'emerald' },
      ],
    },
    {
      id: 'char-11',
      name: 'Cipher Envoy Nolan',
      role: 'Rival',
      summary:
        'Ambassador of the Eastern Coalition. A charming diplomat who trades in manufactured crises and naval blockades.',
      tags: [
        { id: 'tag-23', label: 'Diplomat', color: 'purple' },
        { id: 'tag-24', label: 'Schemer', color: 'rose' },
      ],
    },
    {
      id: 'char-12',
      name: 'Sylas the Exiled King',
      role: 'Supporting',
      summary:
        'Deposed mad king kept in iron chains atop the Black Spire. Whispers riddles of the ancient leviathan covenant.',
      tags: [
        { id: 'tag-25', label: 'Madman', color: 'zinc' },
        { id: 'tag-26', label: 'Fallen King', color: 'rose' },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // 3. STORYLINES (6 Interwoven Narrative Arcs)
  // ---------------------------------------------------------------------------
  storylines: [
    {
      id: 'story-1',
      title: 'The Regicide Conspiracy',
      color: 'purple',
      description: 'Unraveling who orchestrated the magical murder of High King Voron and why.',
      linkedChapterIds: ['scene-1-1', 'scene-1-2', 'scene-1-4', 'scene-2-5', 'scene-4-4'],
      fields: [
        { id: 'sf-1', label: 'Primary Stakes', value: 'Legitimacy of the Crown & Imperial Survival' },
        { id: 'sf-2', label: 'Key Clue', value: 'The burning cipher ledger found on the royal corpse' },
      ],
    },
    {
      id: 'story-2',
      title: 'The Runic Awakening',
      color: 'cyan',
      description: 'Aurelia learning to control the abyssal glyphs without succumbing to oceanic madness.',
      linkedChapterIds: ['scene-1-3', 'scene-2-1', 'scene-2-2', 'scene-3-2', 'scene-4-2'],
      fields: [
        { id: 'sf-3', label: 'Magic Cost', value: 'Drains physical vitality upon each invocation' },
      ],
    },
    {
      id: 'story-3',
      title: 'The Iron Legion Alliance',
      color: 'amber',
      description: 'Securing the military loyalty of Seraphina’s mercenaries against Morvath’s purifiers.',
      linkedChapterIds: ['scene-2-1', 'scene-3-1', 'scene-3-3', 'scene-4-1'],
    },
    {
      id: 'story-4',
      title: 'Shadows of the Sunless Flame',
      color: 'rose',
      description: 'Morvath’s inquisitorial crusade to establish theocratic martial law over Oakhaven.',
      linkedChapterIds: ['scene-1-2', 'scene-2-4', 'scene-3-1', 'scene-3-3', 'scene-3-5'],
    },
    {
      id: 'story-5',
      title: 'The Sunken Vaults of Voron',
      color: 'emerald',
      description: 'Navigating the subterranean floodplains to forge the replacement crown of ocean glass.',
      linkedChapterIds: ['scene-2-1', 'scene-2-2', 'scene-2-3', 'scene-4-2'],
    },
    {
      id: 'story-6',
      title: 'The Foreign Armada',
      color: 'blue',
      description: 'Envoy Nolan’s deceptive naval diplomacy and the threat of coastal bombardment.',
      linkedChapterIds: ['scene-2-5', 'scene-3-4', 'scene-4-3'],
    },
  ],

  // ---------------------------------------------------------------------------
  // 4. GRAPH JUNCTION NODES (3 Union Hubs)
  // ---------------------------------------------------------------------------
  junctions: [
    {
      id: 'junc-1',
      label: 'The Silk Syndicate Council',
      x: 380,
      y: 280,
      storylineId: 'story-1',
    },
    {
      id: 'junc-2',
      label: 'The Iron Legion Command',
      x: 720,
      y: 350,
      storylineId: 'story-3',
    },
    {
      id: 'junc-3',
      label: 'The Inquisitorial Tribunal',
      x: 520,
      y: 620,
      storylineId: 'story-4',
    },
  ],

  // ---------------------------------------------------------------------------
  // 5. CHARACTER RELATIONSHIPS (18 Diverse Multi-Directional Links)
  // ---------------------------------------------------------------------------
  relationships: [
    {
      id: 'rel-1',
      sourceId: 'char-1',
      targetId: 'char-2',
      type: 'Alliance',
      label: 'Uneasy Pact',
      style: 'dashed',
      color: 'purple',
      direction: 'bidirectional',
      notes: 'Valerius trades security clearance for Vespera’s subterranean surveillance intel.',
    },
    {
      id: 'rel-2',
      sourceId: 'char-1',
      targetId: 'char-4',
      type: 'Enmity',
      label: 'Blood Feud',
      style: 'solid',
      color: 'rose',
      direction: 'bidirectional',
      notes: 'Morvath suspects Valerius of regicide; Valerius sees Morvath as a despotic tyrant.',
    },
    {
      id: 'rel-3',
      sourceId: 'char-1',
      targetId: 'char-5',
      type: 'Mentor',
      label: 'Protector & Ward',
      style: 'solid',
      color: 'blue',
      direction: 'directed',
      notes: 'Valerius swore an unbreakable oath to protect Princess Aurelia from the inquisition.',
    },
    {
      id: 'rel-4',
      sourceId: 'char-2',
      targetId: 'char-3',
      type: 'Debt',
      label: 'Informant Debt',
      style: 'dotted',
      color: 'amber',
      direction: 'directed',
      notes: 'Caelen owes Vespera for forging documentation that hid him from the city guard.',
    },
    {
      id: 'rel-5',
      sourceId: 'char-3',
      targetId: 'char-5',
      type: 'Alliance',
      label: 'Guide & Scout',
      style: 'solid',
      color: 'cyan',
      direction: 'bidirectional',
      notes: 'Caelen guides Aurelia through the perilous subterranean catacombs.',
    },
    {
      id: 'rel-6',
      sourceId: 'char-1',
      targetId: 'char-7',
      type: 'Alliance',
      label: 'Mercenary Contract',
      style: 'solid',
      color: 'zinc',
      direction: 'directed',
      notes: 'Valerius hired Seraphina’s legion to defend the High Bastion.',
    },
    {
      id: 'rel-7',
      sourceId: 'char-1',
      targetId: 'char-10',
      type: 'Family',
      label: 'Sworn Brothers',
      style: 'solid',
      color: 'emerald',
      direction: 'bidirectional',
      notes: 'Doran trained Valerius twenty years ago in the frontier wars.',
    },
    {
      id: 'rel-8',
      sourceId: 'char-4',
      targetId: 'char-6',
      type: 'Enmity',
      label: 'Heresy Target',
      style: 'dashed',
      color: 'rose',
      direction: 'directed',
      notes: 'Morvath has a signed warrant to burn Balthazar’s alchemy laboratory.',
    },
    {
      id: 'rel-9',
      sourceId: 'char-6',
      targetId: 'char-8',
      type: 'Alliance',
      label: 'Craft Collaboration',
      style: 'dashed',
      color: 'emerald',
      direction: 'bidirectional',
      notes: 'Balthazar provides refined catalyst fluxes for Ignis’s skymetal forging.',
    },
    {
      id: 'rel-10',
      sourceId: 'char-5',
      targetId: 'char-8',
      type: 'Debt',
      label: 'Blood Crown Debt',
      style: 'solid',
      color: 'amber',
      direction: 'reverse',
      notes: 'Ignis agrees to forge the ocean crown in exchange for royal protection of the deep guilds.',
    },
    {
      id: 'rel-11',
      sourceId: 'char-9',
      targetId: 'char-5',
      type: 'Mentor',
      label: 'Abyssal Prophet',
      style: 'dotted',
      color: 'cyan',
      direction: 'directed',
      notes: 'Lyanna teaches Aurelia how to interpret oceanic visions without drowning.',
    },
    {
      id: 'rel-12',
      sourceId: 'char-2',
      targetId: 'char-11',
      type: 'Rival',
      label: 'Espionage Chess',
      style: 'dashed',
      color: 'purple',
      direction: 'bidirectional',
      notes: 'Vespera and Nolan wage a covert shadow war of counter-intelligence.',
    },
    {
      id: 'rel-13',
      sourceId: 'char-5',
      targetId: 'char-12',
      type: 'Family',
      label: 'Estranged Uncle',
      style: 'dotted',
      color: 'rose',
      direction: 'none',
      notes: 'Sylas was locked in the tower by Aurelia’s father fifteen years ago.',
    },
    {
      id: 'rel-14',
      sourceId: 'char-4',
      targetId: 'char-10',
      type: 'Enmity',
      label: 'Siege Rivals',
      style: 'solid',
      color: 'rose',
      direction: 'directed',
      notes: 'Morvath personally seeks to break Doran’s legendary defense of the outer gates.',
    },
    {
      id: 'rel-15',
      sourceId: 'char-7',
      targetId: 'char-11',
      type: 'Enmity',
      label: 'Naval Blockade',
      style: 'dashed',
      color: 'zinc',
      direction: 'bidirectional',
      notes: 'Seraphina’s artillery repels Nolan’s foreign privateers from the harbor.',
    },
    {
      id: 'rel-16',
      sourceId: 'char-2',
      targetId: 'junc-1',
      type: 'Custom',
      label: 'Syndicate Head',
      style: 'solid',
      color: 'purple',
      direction: 'directed',
    },
    {
      id: 'rel-17',
      sourceId: 'char-7',
      targetId: 'junc-2',
      type: 'Custom',
      label: 'Legion Leader',
      style: 'solid',
      color: 'amber',
      direction: 'directed',
    },
    {
      id: 'rel-18',
      sourceId: 'char-4',
      targetId: 'junc-3',
      type: 'Custom',
      label: 'High Judge',
      style: 'solid',
      color: 'rose',
      direction: 'directed',
    },
  ],

  // ---------------------------------------------------------------------------
  // 6. WORLD ITEMS & LORE (7 Items)
  // ---------------------------------------------------------------------------
  worldItems: [
    {
      id: 'world-1',
      title: 'Oakhaven Citadel',
      category: 'Location',
      summary: 'Tiered medieval fortress capital built above ancient sunken catacombs.',
      description:
        'Constructed across three massive stone terraces: the High Bastion (palace and spire), the Merchant Ring (markets and guilds), and the Low Docks (canals and sewers that descend into oceanic ruins).',
      tags: ['Capital', 'Fortress', 'Terraces'],
    },
    {
      id: 'world-2',
      title: 'The Trench of Weeping Glass',
      category: 'Location',
      summary: 'A submerged subterranean abyss filled with bioluminescent oceanic flora.',
      description:
        'Ancient ruins flooded centuries ago during the first awakening of the Leviathan. Accessible only through the lower sluice gates when the moon is waning.',
      tags: ['Subterranean', 'Ruins', 'Abyss'],
    },
    {
      id: 'world-3',
      title: 'The Silk Syndicate',
      category: 'Faction',
      summary: 'Underground merchant cartel and espionage ring controlled by Lady Vespera.',
      description:
        'Controls maritime contraband, intelligence brokering, and black-market alchemical reagents throughout the four provinces.',
      tags: ['Cartel', 'Espionage', 'Shadows'],
    },
    {
      id: 'world-4',
      title: 'Order of the Sunless Flame',
      category: 'Faction',
      summary: 'Militant zealots dedicated to cleansing heretical runic knowledge.',
      description:
        'Headed by Grand Inquisitor Morvath. Their purifiers wear blackened plate armor and carry incendiary lanterns fueled by sacred naphtha.',
      tags: ['Theocracy', 'Inquisition', 'Purifiers'],
    },
    {
      id: 'world-5',
      title: 'The Sunken Crown',
      category: 'Artifact',
      summary: 'A circlet of meteoric iron and cold ocean glass that commands the abyssal ley-lines.',
      description:
        'Reforged by Ignis from the molten residue of King Voron’s destroyed crown. It binds the sovereign’s spirit directly to the coastal tides.',
      tags: ['Regalia', 'Skymetal', 'Runic'],
    },
    {
      id: 'world-6',
      title: 'Oathkeeper',
      category: 'Artifact',
      summary: 'Valerius Sterling’s ancestral runic broadsword.',
      description:
        'Forged with ancient defensive runes that glow violet in the presence of unholy alchemical reagents or hostile sorcery.',
      tags: ['Weapon', 'Blade', 'Ancestral'],
    },
    {
      id: 'world-7',
      title: 'The Obsidian Veil',
      category: 'Lore',
      summary: 'The cosmic barrier separating the terrestrial realm from the deep sea Leviathans.',
      description:
        'According to legend, the veil weakens whenever royal blood is spilled unjustly. Its fraying is evidenced by black tides and bioluminescent storms.',
      tags: ['Cosmology', 'Mythos', 'Leviathan'],
    },
  ],

  // ---------------------------------------------------------------------------
  // 7. CONTEXT BLOCKS (4 Modular Blocks)
  // ---------------------------------------------------------------------------
  contextBlocks: [
    {
      id: 'block-1',
      title: 'Core Themes & Tone',
      type: 'list',
      content:
        'Moral ambiguity: No faction is purely heroic or entirely villainous\nAtmosphere of damp stone, smoking embers, and salt tides\nPacing: Political tension escalating into full-scale siege warfare\nThe cost of power: Magic always extracts a physical or moral toll',
    },
    {
      id: 'block-2',
      title: 'Current Editorial Objectives',
      type: 'list',
      content:
        'Flesh out Chapter 5 expedition dialogue between Seraphina and Valerius\nClarify Morvath’s backstory in Chapter 8 to heighten his tragic conviction\nEnsure the runic magic rules remain consistent throughout Act II and III\nCheck word count targets for the Act III siege sequence',
    },
    {
      id: 'block-3',
      title: 'Runic Lexicon & Principles',
      type: 'text',
      content:
        'Runic magic is drawn from the Oceanic Abyss. There are three primary glyph families: Vor (Binding/Shields), Kael (Flame/Catalysts), and Ly (Prophetic Resonance). Casting without skymetal focus conduits burns the caster’s nervous system.',
    },
    {
      id: 'block-4',
      title: 'Geopolitical Factions Summary',
      type: 'text',
      content:
        'The Crown of Oakhaven rules the coast. The Eastern Coalition dominates open sea trade routes. The subterranean Deep Guilds control mining and forging skymetal. The Sunless Flame operates as an autonomous religious inquisitorium.',
    },
  ],
};
