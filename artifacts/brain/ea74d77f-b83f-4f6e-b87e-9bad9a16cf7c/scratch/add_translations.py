import os

translations = {
    'en.js': {
        'nav_codex': 'Codex',
        'title_codex': 'System Codex',
        'ui_unlocked': 'UNLOCKED',
        'ui_locked': 'LOCKED',
        'ui_requirements': 'Requirements to Unlock',
        'ui_codex_intro': 'Select a game system on the left to learn how it works and view its status.',
        'codex_feature_gambits': 'Gambit System',
        'codex_feature_shop': 'Village Shop',
        'codex_feature_forge': 'Equipment Forge',
        'codex_feature_skills': 'Physical Skills',
        'codex_feature_magic_circle': 'Magic Circle',
        'codex_feature_witch_hut': "Witch's Hut",
        'codex_feature_hybrid': 'Hybrid Inscription',
        'codex_feature_infirmary': 'Infirmary',
        'codex_feature_tavern': 'Tavern',
        'codex_feature_explorer': 'Explorer Guild',
        'codex_feature_gambits_unlock': 'Always unlocked.',
        'codex_feature_shop_unlock': 'Complete the Tutorial Cave expedition.',
        'codex_feature_forge_unlock': 'Construct a Blacksmith building in the village.',
        'codex_feature_skills_unlock': 'Construct a Training Grounds building in the village.',
        'codex_feature_magic_circle_unlock': 'Construct an Arcane Sanctum building in the village.',
        'codex_feature_witch_hut_unlock': "Construct a Witch's Hut building in the village.",
        'codex_feature_hybrid_unlock': 'A hero must reach Magic Tier 7 and have at least 12 physical Skill Tier points.',
        'codex_feature_infirmary_unlock': 'Construct an Infirmary building in the village.',
        'codex_feature_tavern_unlock': 'Construct a Tavern building in the village.',
        'codex_feature_explorer_unlock': 'Construct an Explorer Guild building in the village.',
        'codex_feature_gambits_desc': 'The Gambit system allows you to program tactical AI rules for each hero. Each rule consists of a Target, a Condition (e.g. self HP < 50%), and an Action (e.g. use small_heal). During auto-combat, heroes will execute the first valid rule from top to bottom. You can arrange, add, or toggle rules in the Hero details page.',
        'codex_feature_shop_desc': 'The Village Shop allows you to trade gold for consumables (such as HP and MP potions) and equipment tiers suitable for your heroes. You can also sell excess equipment, consumables, or raw resources (wood, stone, grain) to accumulate gold for town expansion.',
        'codex_feature_forge_desc': 'The Equipment Forge is used to refine your weapons and armor. Refinement increases the item\'s level (up to +10), which scales its base stats. Refinement costs gold and raw materials (wood or stone). You can refine items that are currently in your inventory or equipped by heroes.',
        'codex_feature_skills_desc': 'The Physical Skill system grants martial techniques to your heroes. Heroes accumulate skill points upon leveling up, which can be spent to unlock and upgrade family-specific physical techniques (like Swords, Axes, or Daggers). Unlike spells, physical techniques consume Stamina rather than MP.',
        'codex_feature_magic_circle_desc': 'The Magic Circle is a spellcrafting system. Magic-attuned heroes learn Glyphs and weave them onto expanding magic circles. Arranging glyphs in different circle slots creates custom spells with unique effects and MP costs. The power of these spells is influenced by elements and glyph masteries.',
        'codex_feature_witch_hut_desc': 'The Witch\'s Hut offers mystical divination. You can send a hero to the Witch to request a reading. Because progress bars and numbers for Magic Insight and Glyph Mastery are completely hidden, the Witch\'s poetic hints are your only guide to knowing how close a hero is to the next magic tier.',
        'codex_feature_hybrid_desc': 'Hybrid Inscription allows you to weave magic directly into a hero\'s body. By inscribing a composed magic circle onto a physical fighter\'s body slots, their physical techniques will automatically trigger spells under specific conditions, creating powerful hybrid combat styles.',
        'codex_feature_infirmary_desc': 'The Infirmary provides medical care for resting heroes. Idle heroes in the village will passively recover HP and Stamina every day. Upgrading the Infirmary increases both the daily health regeneration rate and the maximum number of heroes that can be treated simultaneously.',
        'codex_feature_tavern_desc': 'The Tavern is the social hub of the village. It periodically attracts new heroes looking to join your cause. Once built, the Tavern automatically recruits a random new hero after a cooldown period, expanding your roster without requiring manual recruiting costs.',
        'codex_feature_explorer_desc': 'The Explorer Guild is the operations headquarters for adventure campaigns. It coordinates map nodes, unlockable regions, and expeditions. Upgrading the Explorer Guild increases your guild capacity, allowing you to run multiple concurrent expeditions.'
    },
    'es.js': {
        'nav_codex': 'Códice',
        'title_codex': 'Códice del Sistema',
        'ui_unlocked': 'DESBLOQUEADO',
        'ui_locked': 'BLOQUEADO',
        'ui_requirements': 'Requisitos para desbloquear',
        'ui_codex_intro': 'Selecciona un sistema de juego a la izquierda para aprender cómo funciona y ver su estado.',
        'codex_feature_gambits': 'Sistema de Gambitos',
        'codex_feature_shop': 'Tienda de la Aldea',
        'codex_feature_forge': 'Forja de Equipo',
        'codex_feature_skills': 'Habilidades Físicas',
        'codex_feature_magic_circle': 'Círculo Mágico',
        'codex_feature_witch_hut': 'Cabaña de la Bruja',
        'codex_feature_hybrid': 'Inscripción Híbrida',
        'codex_feature_infirmary': 'Enfermería',
        'codex_feature_tavern': 'Taberna',
        'codex_feature_explorer': 'Gremio de Exploradores',
        'codex_feature_gambits_unlock': 'Siempre desbloqueado.',
        'codex_feature_shop_unlock': 'Completa la expedición de la Cueva de Tutorial.',
        'codex_feature_forge_unlock': 'Construye la Herrería en la aldea.',
        'codex_feature_skills_unlock': 'Construye la Zona de Entrenamiento en la aldea.',
        'codex_feature_magic_circle_unlock': 'Construye el Santuario Arcano en la aldea.',
        'codex_feature_witch_hut_unlock': 'Construye la Cabaña de la Bruja en la aldea.',
        'codex_feature_hybrid_unlock': 'Un héroe debe alcanzar el Nivel de Magia 7 y tener al menos 12 puntos de Nivel de Habilidad física.',
        'codex_feature_infirmary_unlock': 'Construye la Enfermería en la aldea.',
        'codex_feature_tavern_unlock': 'Construye la Taberna en la aldea.',
        'codex_feature_explorer_unlock': 'Construye el Gremio de Exploradores en la aldea.',
        'codex_feature_gambits_desc': 'El sistema de Gambitos te permite programar reglas de IA táctica para cada héroe. Cada regla consta de un Objetivo, una Condición (ej. PS propios < 50%) y una Acción (ej. usar cura_menor). Durante el combate automático, los héroes ejecutarán la primera regla válida de arriba a abajo. Puedes organizar, añadir o desactivar reglas en la página de detalles del héroe.',
        'codex_feature_shop_desc': 'La Tienda de la Aldea te permite cambiar oro por consumibles (como pociones de PS y PM) y niveles de equipo adecuados para tus héroes. También puedes vender el equipo sobrante, consumibles o recursos básicos (madera, piedra, grano) para acumular oro para la expansión de la aldea.',
        'codex_feature_forge_desc': 'La Forja de Equipo se utiliza para refinar tus armas y armaduras. El refinamiento aumenta el nivel del objeto (hasta +10), lo que escala sus atributos base. El refinamiento cuesta oro y materias primas (madera o piedra). Puedes refinar objetos que estén en tu inventario o equipados por héroes.',
        'codex_feature_skills_desc': 'El sistema de Habilidades Físicas otorga técnicas de combate a tus héroes. Los héroes acumulan puntos de habilidad al subir de nivel, que pueden gastarse para desbloquear y mejorar técnicas específicas de cada arma (como Espadas, Hachas o Dagas). A diferencia de los hechizos, las técnicas físicas consumen Estamina en lugar de PM.',
        'codex_feature_magic_circle_desc': 'El Círculo Mágico es un sistema de creación de hechizos. Los héroes con afinidad mágica aprenden Glifos y los tejen en círculos mágicos en expansión. Disponer glifos en diferentes ranuras del círculo crea hechizos personalizados con efectos y costes de PM únicos. El poder de estos hechizos está influenciado por los elementos y el dominio del glifo.',
        'codex_feature_witch_hut_desc': 'La Cabaña de la Bruja ofrece adivinación mística. Puedes enviar a un héroe a la Bruja para solicitar una lectura. Dado que las barras de progreso y los números de Intuición Mágica y Dominio de Glifos están ocultos, las pistas poéticas de la Bruja son tu única guía para saber qué tan cerca está un héroe del siguiente nivel mágico.',
        'codex_feature_hybrid_desc': 'La Inscripción Híbrida te permite tejer magia directamente en el cuerpo de un héroe. Al inscribir un círculo mágico compuesto en las ranuras corporales de un luchador físico, sus técnicas físicas activarán automáticamente hechizos bajo condiciones específicas, creando poderosos estilos de combate híbridos.',
        'codex_feature_infirmary_desc': 'La Enfermería proporciona atención médica a los héroes que descansan. Los héroes inactivos en la aldea recuperarán PS y Estamina de forma pasiva cada día. Mejorar la Enfermería aumenta tanto la tasa de regeneración diaria de salud como el número máximo de héroes que pueden ser tratados simultáneamente.',
        'codex_feature_tavern_desc': 'La Taberna es el centro social de la aldea. Atrae periódicamente a nuevos héroes que buscan unirse a tu causa. Una vez construida, la Taberna recluta automáticamente a un nuevo héroe aleatorio tras un periodo de enfriamiento, expandiendo tu grupo sin requerir costes de reclutamiento manual.',
        'codex_feature_explorer_desc': 'El Gremio de Exploradores es la sede de operaciones de las campañas de aventura. Coordina los nodos del mapa, las regiones desbloqueables y las expediciones. Mejorar el Gremio de Exploradores aumenta tu capacidad de expedición, lo que te permite realizar múltiples expediciones concurrentes.'
    },
    'ca.js': {
        'nav_codex': 'Còdex',
        'title_codex': 'Còdex del Sistema',
        'ui_unlocked': 'DESBLOQUEJAT',
        'ui_locked': 'BLOCAT',
        'ui_requirements': 'Requisits per desbloquejar',
        'ui_codex_intro': 'Selecciona un sistema de joc a l\'esquerra per aprendre com funciona i veure el seu estat.',
        'codex_feature_gambits': 'Sistema de Gàmbits',
        'codex_feature_shop': 'Botiga del Poble',
        'codex_feature_forge': 'Forja d\'Equipament',
        'codex_feature_skills': 'Habilitats Físiques',
        'codex_feature_magic_circle': 'Cercle Màgic',
        'codex_feature_witch_hut': 'Cabana de la Bruixa',
        'codex_feature_hybrid': 'Inscripció Híbrida',
        'codex_feature_infirmary': 'Infermeria',
        'codex_feature_tavern': 'Taberna',
        'codex_feature_explorer': 'Gremi d\'Exploradors',
        'codex_feature_gambits_unlock': 'Sempre desbloquejat.',
        'codex_feature_shop_unlock': 'Completa l\'expedició de la Cova de Tutorial.',
        'codex_feature_forge_unlock': 'Construeix la Farga al poble.',
        'codex_feature_skills_unlock': 'Construeix la Zona d\'Entrenament al poble.',
        'codex_feature_magic_circle_unlock': 'Construeix el Santuari Arcà al poble.',
        'codex_feature_witch_hut_unlock': 'Construeix la Cabana de la Bruixa al poble.',
        'codex_feature_hybrid_unlock': 'Un heroi ha d\'assolir el Nivell de Màgia 7 i tenir almenys 12 punts de Nivell d\'Habilitat física.',
        'codex_feature_infirmary_unlock': 'Construeix l\'Infermeria al poble.',
        'codex_feature_tavern_unlock': 'Construeix la Taberna al poble.',
        'codex_feature_explorer_unlock': 'Construeix el Gremi d\'Exploradors al poble.',
        'codex_feature_gambits_desc': 'El sistema de Gàmbits et permet programar regles d\'IA tàctica per a cada heroi. Cada regla consta d\'un Objectiu, una Condició (ex. PS propis < 50%) i una Acció (ex. usar cura_menor). Durant el combat automàtic, els herois executaran la primera regla vàlida de dalt a baix. Pots organitzar, afegir o desactivar regles a la pàgina de detalls de l\'heroi.',
        'codex_feature_shop_desc': 'La Botiga del Poble et permet canviar or per consumibles (com pocions de PS i PM) i nivells d\'equipament adequats per als teus herois. També pots vendre l\'equipament sobrant, consumibles o recursos bàsics (fusta, pedra, gra) per acumular or per a l\'expansió del poble.',
        'codex_feature_forge_desc': 'La Forja d\'Equipament s\'utilitza per refinar les teves armes i armadures. El refinament augmenta el nivell de l\'objecte (fins a +10), cosa que escala els seus atributs base. El refinament costa or i matèries primeres (fusta o pedra). Pots refinar objectes que estiguin al teu inventari o equipats per herois.',
        'codex_feature_skills_desc': 'El sistema d\'Habilitats Físiques atorga tècniques de combat als teus herois. Els herois acumulen punts d\'habilitat en pujar de nivell, que es poden gastar per desbloquejar i millorar tècniques específiques de cada arma (com Espases, Destrals o Dagues). A diferència dels encanteris, les tècniques físiques consumeixen Estamina en lloc de PM.',
        'codex_feature_magic_circle_desc': 'El Cercle Màgic és un sistema de creació d\'encanteris. Els herois amb afinitat màgica aprenen Glifs i els teixeixen en cercles màgics en expansió. Disposar glifs en diferents ranures del cercle crea encanteris personalitzats amb efectes i costos de PM únics. El poder d\'aquests encanteris està influenciat pels elements i el domini del glif.',
        'codex_feature_witch_hut_desc': 'La Cabana de la Bruixa ofereix endevinació mística. Pots enviar un heroi a la Bruixa per demanar una lectura. Com que les barres de progrés i els números d\'Intuïció Màgica i Domini de Glifs estan ocults, les pistes poètiques de la Bruixa són la teva única guia per saber com de prop està un heroi del següent nivell màgic.',
        'codex_feature_hybrid_desc': 'La Inscripció Híbrida et permet teixir màgia directament al cos d\'un heroi. En inscriure un cercle màgic compost a les ranures corporals d\'un lluitador físic, les seves tècniques físiques activaran automàticament encanteris sota condicions específiques, creant potents estils de combat híbrids.',
        'codex_feature_infirmary_desc': 'L\'Infermeria proporciona atenció mèdica als herois que descansen. Els herois inactius al poble recuperaran PS i Estamina de manera pasiva cada dia. Millorar l\'Infermeria augmenta tant la taxa de regeneració diària de salut com el nombre màxim d\'herois que poden ser tractats simultàniament.',
        'codex_feature_tavern_desc': 'La Taberna és el centre social del poble. Atrau periòdicament nous herois que busquen unir-se a la teva causa. Un cop construïda, la Taberna recluta automàticament un nou heroi aleatori després d\'un període de refredament, expandint el teu grup sense requerir costos de reclutament manual.',
        'codex_feature_explorer_desc': 'El Gremi d\'Exploradors és la seu d\'operacions de les campanyes d\'aventura. Coordina els nodes del mapa, les regions desbloquejables i les expedicions. Millorar el Gremi d\'Exploradors augmenta la teva capacitat d\'expedició, cosa que et permet realitzar múltiples expedicions concurrents.'
    },
    'eu.js': {
        'nav_codex': 'Kodex',
        'title_codex': 'Sistemaren Kodexa',
        'ui_unlocked': 'DESBLOKEATUTA',
        'ui_locked': 'BLOKEATUTA',
        'ui_requirements': 'Desblokeatzeko baldintzak',
        'ui_codex_intro': 'Hautatu ezkerreko joko-sistema bat nola funtzionatzen duen ikasteko eta haren egoera ikusteko.',
        'codex_feature_gambits': 'Gambit Sistema',
        'codex_feature_shop': 'Herriko Denda',
        'codex_feature_forge': 'Ekipamendu Forja',
        'codex_feature_skills': 'Trebetasun Fisikoak',
        'codex_feature_magic_circle': 'Zirkulu Magikoa',
        'codex_feature_witch_hut': 'Sorginaren Kabina',
        'codex_feature_hybrid': 'Txertaketa Hibridoa',
        'codex_feature_infirmary': 'Infermintegia',
        'codex_feature_tavern': 'Taberna',
        'codex_feature_explorer': 'Esploratzaileen Gremioa',
        'codex_feature_gambits_unlock': 'Beti desblokeatuta.',
        'codex_feature_shop_unlock': 'Osatu Ikastaro Kobazuloko espedizioa.',
        'codex_feature_forge_unlock': 'Eraiki Burdinola herrian.',
        'codex_feature_skills_unlock': 'Eraiki Entrenamendu Eremua herrian.',
        'codex_feature_magic_circle_unlock': 'Eraiki Santutegi Arkanoa herrian.',
        'codex_feature_witch_hut_unlock': 'Eraiki Sorginaren Kabina herrian.',
        'codex_feature_hybrid_unlock': 'Heroi batek Magia Maila 7 lortu behar du eta gutxienez 12 Trebetasun Fisiko puntu eduki.',
        'codex_feature_infirmary_unlock': 'Eraiki Infermintegia herrian.',
        'codex_feature_tavern_unlock': 'Eraiki Taberna herrian.',
        'codex_feature_explorer_unlock': 'Eraiki Esploratzaileen Gremioa herrian.',
        'codex_feature_gambits_desc': 'Gambit sistemak heroi bakoitzarentzat adimen artifizialeko arau taktikoak programatzeko aukera ematen dizu. Arau bakoitzak Helburu bat, Baldintza bat (adibidez, norberaren HP < %50) eta Ekintza bat (adibidez, sendatze_txikia erabili) ditu. Borroka automatikoan, heroiek goitik behera betetzen den lehen arau baliogarria exekutatuko dute. Arauak antolatu, gehitu edo desgaitu ditzakezu heroiaren xehetasunen orrian.',
        'codex_feature_shop_desc': 'Herriko Dendak urrea kontsumigarrien (hala nola HP eta MP edabeak) eta zure heroientzako ekipamendu maila egokien truke aldatzeko aukera ematen dizu. Zure ekipamendu soberakinak, kontsumigarriak edo oinarrizko baliabideak (egurra, harria, alea) sal ditzakezu urrea metatzeko eta herria zabaltzeko.',
        'codex_feature_forge_desc': 'Ekipamendu Forja zure armak eta armadurak fintzeko erabiltzen da. Fintzeak objektuaren maila igotzen du (+10era arte), eta horrek oinarrizko atributuak eskalatzen ditu. Fintzeak urrea eta lehengaiak (egurra edo harria) kostatzen ditu. Inbentarioan dituzun edo heroiek hornituta dituzten objektuak fin ditzakezu.',
        'codex_feature_skills_desc': 'Trebetasun Fisikoen sistemak borroka teknikak ematen dizkie zure heroiei. Heroiek trebetasun puntuak pilatzen dituzte mailaz igotzean, eta puntu horiek erabil ditzakete arma bakoitzari lotutako teknikak desblokeatzeko eta hobetzeko (hala nola Ezpatak, Aizkorak edo Dagarrak). Sorginkeriak ez bezala, teknika fisikoek Estamina kontsumitzen dute MP ordez.',
        'codex_feature_magic_circle_desc': 'Zirkulu Magikoa sorginkeriak sortzeko sistema bat da. Magiarekiko kidetasuna duten heroiek Glifoak ikasten dituzte eta hedatzen ari diren zirkulu magikoetan ehuntzen dituzte. Glifoak zirkuluko zirrikitu desberdinetan jartzeak sorginkeria pertsonalizatuak sortzen ditu, efektu eta MP kostu bereziekin. Sorginkeria hauen indarra elementuek eta glifoaren menderatze mailak baldintzatzen dute.',
        'codex_feature_witch_hut_desc': 'Sorginaren Kabinak dibinazio mistikoa eskaintzen du. Heroi bat bidal diezaiokezu Sorginari irakurketa bat eskatzeko. Magiaren Intuizioa eta Glifoen Menderatzea neurtzeko barra eta zenbakiak ezkutuan daudenez, Sorginaren aholku poetikoak dira heroi bat hurrengo magia mailatik gertu dagoen jakiteko gida bakarra.',
        'codex_feature_hybrid_desc': 'Txertaketa Hibridoak magia zuzenean heroiaren gorputzean txertatzeko aukera ematen dizu. Zirkulu magiko konposatu bat fisikoki borrokatzen duen heroi baten gorputzeko zirrikituetan txertatzean, bere teknika fisikoek automatikoki abiaraziko dituzte sorginkeriak baldintza zehatzetan, borroka estilo hibrido indartsuak sortuz.',
        'codex_feature_infirmary_desc': 'Infermintegiak laguntza medikoa eskaintzen die herrian atseden hartzen ari diren heroiei. Herrian geldirik dauden heroiek HP eta Estamina berreskuratuko dituzte modu pasiboan egunero. Infermintegia hobetzeak eguneroko osasun leheneratzea eta aldi berean trata daitezkeen heroien kopurua handitzen ditu.',
        'codex_feature_tavern_desc': 'Taberna herriko topagune soziala da. Zure kausarekin bat egin nahi duten heroi berriak erakartzen ditu aldizka. Behin eraikita, Tabernak automatikoki kontratatzen du heroi berri bat ausaz hozte-aldi baten ondoren, zure taldea zabalduz eskuzko kontratazio kosturik gabe.',
        'codex_feature_explorer_desc': 'Esploratzaileen Gremioa abentura-kanpainetako operazioen egoitza da. Mapako nodoak, eskualde desblokeagarriak eta espedizioak koordinatzen ditu. Esploratzaileen Gremioa hobetzeak espedizio gaitasuna handitzen du, eta horrek aldi berean espedizio bat baino gehiago egiteko aukera ematen dizu.'
    },
    'gl.js': {
        'nav_codex': 'Códice',
        'title_codex': 'Códice do Sistema',
        'ui_unlocked': 'DESBLOQUEADO',
        'ui_locked': 'BLOQUEADO',
        'ui_requirements': 'Requisitos para desbloquear',
        'ui_codex_intro': 'Selecciona un sistema de xogo á esquerda para aprender como funciona e ver o seu estado.',
        'codex_feature_gambits': 'Sistema de Gámbites',
        'codex_feature_shop': 'Tenda da Aldea',
        'codex_feature_forge': 'Forxa de Equipamento',
        'codex_feature_skills': 'Habilidades Físicas',
        'codex_feature_magic_circle': 'Círculo Máxico',
        'codex_feature_witch_hut': 'Cabana da Bruxa',
        'codex_feature_hybrid': 'Inscrición Híbrida',
        'codex_feature_infirmary': 'Enfermaría',
        'codex_feature_tavern': 'Taberna',
        'codex_feature_explorer': 'Gremio de Exploradores',
        'codex_feature_gambits_unlock': 'Sempre desbloqueado.',
        'codex_feature_shop_unlock': 'Completa a expedición da Cova de Titorial.',
        'codex_feature_forge_unlock': 'Constrúe a Forxa na aldea.',
        'codex_feature_skills_unlock': 'Constrúe a Zona de Adestramento na aldea.',
        'codex_feature_magic_circle_unlock': 'Constrúe o Santuario Arcano na aldea.',
        'codex_feature_witch_hut_unlock': 'Constrúe la Cabana da Bruxa na aldea.',
        'codex_feature_hybrid_unlock': 'Un heroe debe acadar o Nivel de Maxia 7 e ter polo menos 12 puntos de Nivel de Habilidade física.',
        'codex_feature_infirmary_unlock': 'Constrúe a Enfermaría na aldea.',
        'codex_feature_tavern_unlock': 'Constrúe a Taberna na aldea.',
        'codex_feature_explorer_unlock': 'Constrúe o Gremio de Exploradores na aldea.',
        'codex_feature_gambits_desc': 'O sistema de Gámbites permíteche programar regras de IA táctica para cada heroe. Cada regra consta dun Obxectivo, unha Condición (ex. PS propios < 50%) e unha Acción (ex. usar cura_menor). Durante o combate automático, os heroes executarán a primeira regra válida de arriba a abaixo. Podes organizar, engadir o desactivar regras na páxina de detalles do heroe.',
        'codex_feature_shop_desc': 'A Tenda da Aldea permíteche cambiar ouro por consumibles (como pocións de PS e PM) e niveis de equipamento adecuados para os teus heroes. Tamén podes vender o equipamento sobrante, consumibles ou recursos básicos (madeira, pedra, gran) para acumular ouro para a expansión da aldea.',
        'codex_feature_forge_desc': 'A Forxa de Equipamento utilízase para refinar as túas armas e armaduras. O refinamento aumenta o nivel do obxecto (ata +10), o que escala os seus atributos base. O refinamento custa ouro e materias primas (madeira ou pedra). Podes refinar obxectos que estean no teu inventario ou equipados por heroes.',
        'codex_feature_skills_desc': 'O sistema de Habilidades Físicas outorga técnicas de combate aos teus heroes. Os heroes acumulan puntos de habilidade ao subir de nivel, que poden gastarse para desbloquear e mellorar técnicas específicas de cada arma (como Espadas, Machadas ou Dagas). A diferenza dos conxuros, as técnicas físicas consomen Estamina en lugar de PM.',
        'codex_feature_magic_circle_desc': 'O Círculo Máxico é un sistema de creación de conxuros. Os heroes con afinidade máxica aprenden Glifos e técense en círculos máxicos en expansión. Dispoñer glifos en diferentes ranuras do círculo crea conxuros personalizados con efectos e custos de PM únicos. O poder destes conxuros está influenciado polos elementos e o dominio do glifo.',
        'codex_feature_witch_hut_desc': 'La Cabana da Bruxa ofrece adiviñación mística. Podes enviar a un heroe á Bruxa para solicitar unha lectura. Dado que as barras de progreso e os números de Intuición Máxica e Dominio de Glifos están ocultos, as pistas poéticas da Bruxa son a túa única guía para saber que tan preto está un heroe do seguinte nivel máxico.',
        'codex_feature_hybrid_desc': 'A Inscrición Híbrida permíteche tecer maxia directamente no corpo dun heroe. Ao inscribir un círculo máxico composto nas ranuras corporais dun loitador físico, as súas técnicas físicas activarán automaticamente conxuros baixo condicións específicas, creando poderosos estilos de combate híbridos.',
        'codex_feature_infirmary_desc': 'A Enfermaría proporciona atención médica aos heroes que descansan. Os heroes inactivos na aldea recuperarán PS e Estamina de forma pasiva cada día. Mellorar a Enfermaría aumenta tanto a taxa de rexeneración diaria de saúde como o número máximo de heroes que poden ser tratados simultaneamente.',
        'codex_feature_tavern_desc': 'A Taberna é o centro social da aldea. Atrae periodicamente a novos heroes que buscan unirse á túa causa. Unha vez construída, a Taberna recruta automaticamente a un novo heroe aleatorio tras un período de arrefriamento, expandindo o teu grupo sen requirir custos de recrutamento manual.',
        'codex_feature_explorer_desc': 'O Gremio de Exploradores é a sede de operacións das campañas de aventura. Coordina os nodos do mapa, as rexións desbloqueables e as expedicións. Mellorar o Gremio de Exploradores aumenta a túa capacidade de expedición, o que che permite realizar múltiples expedicións concurrentes.'
    }
}

base_path = '/home/dsibars/development/rpg-village-project/js/engine/shared/core/i18n/translations'

for filename, trans_dict in translations.items():
    file_path = os.path.join(base_path, filename)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We find the closing };
        # Let's strip whitespace at the end
        content_stripped = content.rstrip()
        if content_stripped.endswith('};'):
            # Remove the };
            base_content = content_stripped[:-2]
            
            # Format our keys
            lines_to_add = []
            for key, val in trans_dict.items():
                # Escape single quotes and newlines in values
                escaped_val = val.replace("'", "\\'").replace("\n", "\\n")
                lines_to_add.append(f"    {key}: '{escaped_val}',")
            
            new_lines = "\n" + "\n".join(lines_to_add) + "\n};"
            new_content = base_content + new_lines
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully added translations to {filename}")
        else:
            print(f"File {filename} does not end with '}};'")
    else:
        print(f"File {file_path} not found")
