import os

translations = {
    'en.js': {
        'codex_feature_day_cycle': 'Day Cycle & Time',
        'codex_feature_day_cycle_desc': 'RPG Village runs on a turn-based day cycle. Time only progresses when you manually click "Next Day". Each day, your village consumes 1 food per villager. Farms passively generate raw grain based on their level (+4 raw grain per level), which is multiplied by the number of assigned Farmers. Construction projects decrement their remaining days, recovery is processed for resting heroes, and daily objectives are updated.',
        'codex_feature_day_cycle_unlock': 'Always available.',
        'codex_feature_villagers': 'Villagers & Labor',
        'codex_feature_villagers_desc': 'Your total population resides in housing. You can assign idle villagers to specialized jobs (Builders, Farmers, Miners, Scouts). Builder count dictates how many concurrent construction projects you can run, as initiating a project assigns 1 builder to work on it until completion. Villagers consume 1 food daily; food shortages stop population growth and decrease efficiency.',
        'codex_feature_villagers_unlock': 'Always available.',
        'codex_feature_hero_attributes': 'Hero Attributes & Stats',
        'codex_feature_hero_attributes_desc': 'Heroes defend the village and clear expeditions. Their power is governed by attributes:\\n- HP & MP: Resource pools for survival and magic.\\n- STR & DEF: Governs physical damage and mitigation.\\n- MAG & SPD: Determines magic power/healing and turn speed/evasion.\\nLeveling up grants stat points to assign. Deployed heroes are locked and cannot have their stats or gear changed until they return.',
        'codex_feature_hero_attributes_unlock': 'Always available.',
        'codex_feature_physical_skills_combat': 'Skills & Stamina',
        'codex_feature_physical_skills_combat_desc': 'Physical techniques cost Stamina instead of MP. Stamina is calculated based on STR, DEF, and level, and fully regenerates between battles. Heroes learn new physical skill families using Skill Points gained at level milestones (1, 5, 10, etc.). Skills increase in Tier (×2, ×3, etc.) automatically through hidden usage, allowing physical classes to scale infinitely.',
        'codex_feature_physical_skills_combat_unlock': 'Always available.',
        'codex_feature_threats_defense': 'Threats & Defense',
        'codex_feature_threats_defense_desc': 'The village faces periodic seasons (Spring, Summer, Autumn, Winter) and raid events. Upcoming raids are listed on the calendar. You must assign idle heroes to defense positions. Defense power is calculated from defender stats (STR + DEF + MaxHP/10) plus housing and scout bonuses. Victory grants gold; defeat results in material loss and possible building damage.',
        'codex_feature_threats_defense_unlock': 'Always available.'
    },
    'es.js': {
        'codex_feature_day_cycle': 'Ciclo de Días y Tiempo',
        'codex_feature_day_cycle_desc': 'El juego avanza por turnos de un día. El tiempo solo pasa cuando haces clic en "Siguiente Día". Cada día, la aldea consume 1 de comida por aldeano. Las granjas producen grano de forma pasiva según su nivel (+4 por nivel), multiplicado por los agricultores asignados. Los proyectos de construcción avanzan, los héroes heridos recuperan salud y se actualizan los objetivos diarios.',
        'codex_feature_day_cycle_unlock': 'Siempre disponible.',
        'codex_feature_villagers': 'Aldeanos y Trabajo',
        'codex_feature_villagers_desc': 'La población total reside en viviendas. Puedes asignar aldeanos inactivos a trabajos especializados (Constructores, Agricultores, Mineros, Exploradores). El número de constructores limita las obras simultáneas, ya que cada proyecto asigna a 1 constructor hasta que termine. Los aldeanos consumen 1 de comida al día; la escasez detiene el crecimiento y reduce la eficiencia.',
        'codex_feature_villagers_unlock': 'Siempre disponible.',
        'codex_feature_hero_attributes': 'Atributos de Héroe',
        'codex_feature_hero_attributes_desc': 'Los héroes defienden la aldea y completan expediciones. Sus atributos son:\\n- HP y MP: Reservas para sobrevivir y lanzar magia.\\n- STR y DEF: Daño físico y mitigación.\\n- MAG y SPD: Poder mágico/curación y velocidad de turno/evasión.\\nSubir de nivel otorga puntos de atributo a repartir. Los héroes desplegados no pueden cambiar sus estadísticas ni equipo hasta volver.',
        'codex_feature_hero_attributes_unlock': 'Siempre disponible.',
        'codex_feature_physical_skills_combat': 'Habilidades y Estamina',
        'codex_feature_physical_skills_combat_desc': 'Las técnicas físicas consumen estamina en lugar de MP. La estamina máxima se calcula según la fuerza, defensa y nivel, y se regenera por completo entre batallas. Los héroes aprenden familias de habilidades físicas usando Puntos de Habilidad en niveles clave (1, 5, 10, etc.). Las habilidades suben de rango (×2, ×3, etc.) de forma invisible al usarse, escalando de forma infinita.',
        'codex_feature_physical_skills_combat_unlock': 'Siempre disponible.',
        'codex_feature_threats_defense': 'Amenazas y Defensa',
        'codex_feature_threats_defense_desc': 'La aldea experimenta estaciones (Primavera, Verano, Otoño, Invierno) y asaltos periódicos. Puedes ver los próximos asaltos en el calendario. Debes asignar héroes inactivos a la defensa. El poder de defensa se calcula sumando las estadísticas de los defensores (STR + DEF + MaxHP/10) más las bonificaciones de viviendas y exploradores. Vencer otorga oro; la derrota destruye materiales y daña edificios.',
        'codex_feature_threats_defense_unlock': 'Siempre disponible.'
    },
    'ca.js': {
        'codex_feature_day_cycle': 'Cicle de Dies i Temps',
        'codex_feature_day_cycle_desc': 'El joc avança per torns de un dia. El temps només passa quan fas clic a "Següent Dia". Cada dia, el llogaret consumeix 1 de menjar per vilatà. Les granges produeixen gra de forma passiva segons el seu nivell (+4 per nivell), multiplicat pels agricultors assignats. Els projectes de construcció avancen, els herois ferits recuperan salut i s\'actualitzen els objectius diaris.',
        'codex_feature_day_cycle_unlock': 'Sempre disponible.',
        'codex_feature_villagers': 'Vilatans i Treball',
        'codex_feature_villagers_desc': 'La població total resideix en habitatges. Pots assignar vilatans inactius a feines especialitzades (Constructores, Agricultors, Miners, Exploradors). El nombre de constructors limita les obres simultànies, ja que cada projecte assigna 1 constructor fins que acabi. Els vilatans consumeixen 1 de menjar al dia; l\'escassetat atura el creixement i redueix l\'eficiència.',
        'codex_feature_villagers_unlock': 'Sempre disponible.',
        'codex_feature_hero_attributes': 'Atributs d\'Heroi',
        'codex_feature_hero_attributes_desc': 'Els herois defensen el llogaret i completen expedicions. Els seus atributs són:\\n- HP i MP: Reserves per sobreviure i llançar màgia.\\n- STR i DEF: Dany físic i mitigació.\\n- MAG i SPD: Poder màgic/curació i velocitat de torn/evasió.\\nPuixar de nivell atorga punts d\'atribut a repartir. Els herois desplegats no poden modificar les seves estadístiques ni equipament fins a tornar.',
        'codex_feature_hero_attributes_unlock': 'Sempre disponible.',
        'codex_feature_physical_skills_combat': 'Habilitats i Estamina',
        'codex_feature_physical_skills_combat_desc': 'Les tècniques físiques consumeixen estamina en lloc de MP. L\'estamina màxima es calcula segons la força, defensa i nivell, i es regenera per complet entre batalles. Els herois aprenen famílies d\'habilitats físiques usant Punts d\'Habilitat en nivells clau (1, 5, 10, etc.). Les habilitats pugen de rang (×2, ×3, etc.) de forma invisible en usar-se, escalant de manera infinita.',
        'codex_feature_physical_skills_combat_unlock': 'Sempre disponible.',
        'codex_feature_threats_defense': 'Amenaces i Defensa',
        'codex_feature_threats_defense_desc': 'El llogaret experimenta estacions (Primavera, Estiu, Tardor, Hivern) i assalts periòdics. Pots veure els propers assalts al calendari. Cal assignar herois inactius a la defensa. El poder de defensa es calcula sumando les estadístiques dels defensors (STR + DEF + MaxHP/10) més les bonificacions d\'habitatges i exploradors. Vèncer atorga or; la derrota destrueix materials i fa malbé edificis.',
        'codex_feature_threats_defense_unlock': 'Sempre disponible.'
    },
    'eu.js': {
        'codex_feature_day_cycle': 'Eguneko Zikloa eta Denbora',
        'codex_feature_day_cycle_desc': 'RPG Village txandakako egun ziklo batean funtzionatzen du. Denbora soilik "Hurrengo Eguna" sakatzean igarotzen da. Egunero, herrixkak janari 1 kontsumitzen du biztanleko. Baserriek pasiboki aleak sortzen dituzte beren mailaren arabera (+4 ale mailako), eta hori esleitutako nekazari kopuruarekin biderkatzen da. Eraikuntza proiektuek geratzen diren egunak gutxitzen dituzte, zauritutako heroiek osasuna berreskuratzen dute eta eguneko helburuak eguneratzen dira.',
        'codex_feature_day_cycle_unlock': 'Beti eskuragarri.',
        'codex_feature_villagers': 'Herritarrak eta Lana',
        'codex_feature_villagers_desc': 'Biztanleria osoa etxeetan bizi da. Herritar inaktiboak lan espezializatuetan esleitu ditzakezu (Eraikitzaileak, Nekazariak, Meatzariak, Esploratzaileak). Eraikitzaile kopuruak aldi berean egin ditzakezun eraikuntza proiektuak mugatzen ditu, proiektu bakoitzak eraikitzaile 1 behar baitu amaitu arte. Herritarrek janari 1 kontsumitzen dute egunero; janari faltak biztanleriaren hazkundea gelditu eta eraginkortasuna murrizten du.',
        'codex_feature_villagers_unlock': 'Beti eskuragarri.',
        'codex_feature_hero_attributes': 'Heroien Atributuak eta Estatistikak',
        'codex_feature_hero_attributes_desc': 'Heroiek herria defendatzen dute eta espedizioak burutzen dituzte. Euren indarra atributuek zehazten dute:\\n- HP eta MP: Bizirik irauteko eta magia erabiltzeko erreserbak.\\n- STR eta DEF: Eraso fisikoa eta arintzea.\\n- MAG eta SPD: Botere magikoa/sendatzea eta txanda abiadura/saihestea.\\nMailaz igotzean atributu puntuak lortzen dira banatzeko. Espediziotan dauden heroien estatistikak edo ekipamendua ezin dira aldatu itzuli arte.',
        'codex_feature_hero_attributes_unlock': 'Beti eskuragarri.',
        'codex_feature_physical_skills_combat': 'Trebetasunak eta Estamina',
        'codex_feature_physical_skills_combat_desc': 'Teknika fisikoek estamina kontsumitzen dute MPren ordez. Estamina maximoa STR, DEF eta mailaren arabera kalkulatzen da, eta guduen artean erabat leheneratzen da. Heroiek trebetasun fisikoen familiak ikasten dituzte maila mugarrietan (1, 5, 10, etab.) lortutako Trebetasun Puntuekin. Trebetasunak automatikoki igotzen dira mailaz (×2, ×3, etab.) erabileraren bidez, klase fisikoak mugarik gabe eskalatuz.',
        'codex_feature_physical_skills_combat_unlock': 'Beti eskuragarri.',
        'codex_feature_threats_defense': 'Mehatxuak eta Defentsa',
        'codex_feature_threats_defense_desc': 'Herrixkak urtaroak (Udaberria, Uda, Udazkena, Negua) eta aldizkako erasoak jasaten ditu. Hurrengo erasoak egutegian agertzen dira. Heroi inaktiboak defentsan jarri behar dituzu. Defentsa-boterea heroien estatistiketatik (STR + DEF + MaxHP/10) eta etxe eta esploratzaileen hobarietatik kalkulatzen da. Garaipenak urrea ematen du; porrotak materialak galtzea eta eraikinak kaltetzea dakar.',
        'codex_feature_threats_defense_unlock': 'Beti eskuragarri.'
    },
    'gl.js': {
        'codex_feature_day_cycle': 'Ciclo de Días e Tempo',
        'codex_feature_day_cycle_desc': 'O xogo avanza por quendas dun día. O tempo só pasa cando fas clic en "Seguinte Día". Cada día, a aldea consume 1 de comida por aldeán. As granxas producen gran de forma pasiva segundo o seu nivel (+4 por nivel), multiplicado polos agricultores asignados. Os proxectos de construción avanzan, os heroes feridos recuperan saúde e actualízanse os obxectivos diarios.',
        'codex_feature_day_cycle_unlock': 'Sempre dispoñible.',
        'codex_feature_villagers': 'Aldeáns e Traballo',
        'codex_feature_villagers_desc': 'A poboación total reside en vivendas. Podes asignar aldeáns inactivos a traballos especializados (Construtores, Agricultores, Mineiros, Exploradores). O número de construtores limita as obras simultáneas, xa que cada proxecto asigna a 1 construtor ata que remate. Os aldeáns consumen 1 de comida ao día; a escaseza detén o crecemento e reduce a eficiencia.',
        'codex_feature_villagers_unlock': 'Sempre dispoñible.',
        'codex_feature_hero_attributes': 'Atributos de Heroe',
        'codex_feature_hero_attributes_desc': 'Os heroes defenden a aldea e completan expedicións. Os seus atributos son:\\n- HP e MP: Reservas para sobrevivir e lanzar maxia.\\n- STR e DEF: Dano físico e mitigación.\\n- MAG e SPD: Poder máxico/curación e velocidade de quenda/evasión.\\nSubir de nivel outorga puntos de atributo a repartir. Os heroes despregados non poden cambiar as súas estatísticas nin o seu equipo ata volver.',
        'codex_feature_hero_attributes_unlock': 'Sempre dispoñible.',
        'codex_feature_physical_skills_combat': 'Habilidades e Estamina',
        'codex_feature_physical_skills_combat_desc': 'As técnicas físicas consomen estamina en lugar de MP. A estamina máxima calcúlase segundo a forza, defensa e nivel, e rexenérase por completo entre batallas. Os heroes aprenden familias de habilidades físicas usando Puntos de Habilidade en niveis clave (1, 5, 10, etc.). As habilidades suben de rango (×2, ×3, etc.) de forma invisible ao usarse, escalando de xeito infinito.',
        'codex_feature_physical_skills_combat_unlock': 'Sempre dispoñible.',
        'codex_feature_threats_defense': 'Ameazas e Defensa',
        'codex_feature_threats_defense_desc': 'A aldea experimenta estacións (Primavera, Verán, Outono, Inverno) e asaltos periódicos. Podes ver os vindeiros asaltos no calendario. Debes asignar heroes inactivos á defensa. O poder de defensa calcúlase sumando as estatísticas dos defensores (STR + DEF + MaxHP/10) máis as bonificacións de vivendas e exploradores. Vencer outorga ouro; a derrota destrúe materiais e dana edificios.',
        'codex_feature_threats_defense_unlock': 'Sempre dispoñible.'
    }
}

base_path = '/home/dsibars/development/rpg-village-project/js/engine/shared/core/i18n/translations'

for filename, trans_dict in translations.items():
    file_path = os.path.join(base_path, filename)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content_stripped = content.rstrip()
        if content_stripped.endswith('};'):
            base_content = content_stripped[:-2]
            lines_to_add = []
            for key, val in trans_dict.items():
                escaped_val = val.replace("'", "\\'")
                lines_to_add.append(f"    {key}: '{escaped_val}',")
            new_lines = "\n" + "\n".join(lines_to_add) + "\n};"
            new_content = base_content + new_lines
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully added translations to {filename}")
        else:
            print(f"File {filename} does not end with '}};'")
