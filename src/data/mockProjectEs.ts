import { FoliantProject } from '../types/project';

/**
 * DEFAULT_PROJECT_ES: Versión en español del proyecto épico de fantasía oscura
 * Título: "La Corona Sumergida: Crónicas del Velo de Obsidiana"
 */
export const DEFAULT_PROJECT_ES: FoliantProject = {
  id: 'project-sunken-crown-epic',
  title: 'La Corona Sumergida: Crónicas del Velo de Obsidiana',
  lastModified: Date.now(),
  targetWords: 120000,

  chapters: [
    // ACTO I
    {
      id: 'act-1',
      title: 'Acto I: El Eclipse Quebrantado',
      content: '',
      synopsis: 'El repentino regicidio del Gran Rey Voron sume a Oakhaven en la paranoia mientras runas prohibidas se encienden en las criptas inferiores.',
      type: 'folder',
      parentId: null,
      targetWords: 25000,
      status: 'Completed',
    },
    {
      id: 'scene-1-1',
      title: 'Capítulo 1: Ceniza sobre el trono',
      content:
        '<p>La corona no cayó con un tintineo; se fundió en sebo negro antes de tocar la tarima de mármol. Valerius Sterling permaneció inmóvil ante el trono calcinado, con los guanteletes goteando cera rúnica que congelaba su piel en lugar de quemarla.</p><p>A sus espaldas, los grandes portones de bronce crujían bajo los arietes de la Guardia de la Ciudad. El monarca había muerto sin pronunciar una sola plegaria, susurrando únicamente una coordenada que conducía a las criptas inundadas del valle de Whisperwood. Valerius cerró el puño con fuerza, sintiendo el sello real fracturado clavarse en su palma.</p><p>Los faroles oscilaron frenéticamente cuando Vespera emergió de entre los tapices; su capucha de seda desprendía un sutil aroma a acónito y azufre. «Culparán a la Legión de Hierro, Lord Comandante», murmuró con una sonrisa serena. «A menos, por supuesto, de que me entregues el libro de claves antes de que llegue el Inquisidor».</p>',
      synopsis: 'Valerius descubre al rey asesinado por fuego rúnico y es acorralado por Vespera.',
      type: 'scene',
      parentId: 'act-1',
      targetWords: 4500,
      status: 'Completed',
      attachedCharacterIds: ['char-1', 'char-2'],
    },
    {
      id: 'scene-1-2',
      title: 'Capítulo 2: El farol del Inquisidor',
      content:
        '<p>El Gran Inquisidor Morvath no entraba a las salas; las purificaba. Su farol de hierro se mecía con un compás deliberado y nauseabundo, proyectando sombras semejantes a barrotes de jaula sobre las arcadas de la catedral. Sus alabarderos formaron un muro de acero alrededor de los cortesanos abatidos.</p><p>«Dígame, Lord Comandante», la voz de Morvath rasgó el aire como esquisto seco, «¿por qué la única hoja que no se ha manchado de sangre en el santuario soberano lleva el blasón de su propia vanguardia? ¿Acaso el aliento del Rey se apagó por mandato divino, o por su propia impaciencia?».</p><p>Valerius sostuvo la mirada gélida del Inquisidor. En el patio de armas, la lluvia caía en cortinas densas con olor a brea, ahogando los gritos de los mozos de cuadra reales.</p>',
      synopsis: 'El Inquisidor Morvath interroga a Valerius en la sala del trono.',
      type: 'scene',
      parentId: 'act-1',
      targetWords: 4000,
      status: 'Completed',
      attachedCharacterIds: ['char-1', 'char-4'],
    },
    {
      id: 'scene-1-3',
      title: 'Capítulo 3: Callejones de humo y seda',
      content:
        '<p>En los Bajos Muelles de Oakhaven, la niebla era cómplice de asesinato. Caelen mantenía el equilibrio sobre el alero grasiento del tejado de una destilería, observando cómo tres correos encapuchados se colaban en el sótano de la taberna del Cuervo Ciego.</p><p>Bajo él, la princesa Aurelia se ajustó la tosca capucha de lana gris sobre su melena plateada, un rasgo que la marcaba para una muerte segura. Había cambiado su colgante de diamantes por una daga bota de filo dentado que mordía su tobillo a cada paso.</p><p>«Aparta las manos de las empuñaduras», siseó Caelen desde las sombras superiores. «El Sindicato de la Seda no vende salvoconductos fuera de la capital por caridad. Buscan la cifra de tu linaje, muchacha, no tus promesas».</p>',
      synopsis: 'Caelen escolta a Aurelia a través de los suburbios para reunirse con los contactos de Vespera.',
      type: 'scene',
      parentId: 'act-1',
      targetWords: 3800,
      status: 'Revised',
      attachedCharacterIds: ['char-3', 'char-5'],
    },
    {
      id: 'scene-1-4',
      title: 'Capítulo 4: La advertencia del alquimista',
      content:
        '<p>El taller del maestro Balthazar era una catedral de serpentines de condensación de latón, resinas esmeralda burbujeantes y pergaminos en conserva. Sostuvo un vial de vidrio que contenía la ceniza recogida del cráneo del Rey.</p><p>«Esto no es azufre, Sterling», jadeó el anciano, con sus ojos lechosos entornándose tras lentes triples. «Este residuo fue forjado en el Abismo Sin Sol. El sello no se rompió desde fuera. Alguien abrió la compuerta e invitó a entrar a la marea».</p><p>Una detonación imprevista sacudió la terraza inferior, haciendo añicos hileras enteras de cristalería de ámbar en una mortífera granizada reluciente.</p>',
      synopsis: 'Balthazar analiza el residuo del regicidio y confirma la fractura del sello abisal.',
      type: 'scene',
      parentId: 'act-1',
      targetWords: 3200,
      status: 'First Draft',
      attachedCharacterIds: ['char-1', 'char-6'],
    },

    // ACTO II
    {
      id: 'act-2',
      title: 'Acto II: Susurros en la fosa profunda',
      content: '',
      synopsis: 'Expedición a las catacumbas sumergidas bajo Oakhaven para localizar la Matriz Rúnica Primordial.',
      type: 'folder',
      parentId: null,
      targetWords: 35000,
      status: 'In Progress',
    },
    {
      id: 'scene-2-1',
      title: 'Capítulo 5: Bajo las terrazas amuralladas',
      content:
        '<p>El agua goteaba a través de la sillería antigua, y cada gota resonaba como un metrónomo en las criptas inundadas. Seraphina Drake comprobaba la tensión de los cables de sus balistas mientras sus mercenarios entonaban cánticos supersticiosos de protección.</p><p>«El contrato se pagó en lingotes de oro, Sterling, no en leyendas de aparecidos», dijo Seraphina, encendiendo una tea con pedernal. La llamarada iluminó frescos de gigantescas deidades serpentinas devorando el sol. «Si estas ruinas despiertan, o doblas el jornal de mi compañía o sellamos el rastrillo de hierro a vuestras espaldas».</p><p>Valerius asintió escuetamente. A su lado, Aurelia rozó los glifos de piedra húmeda, con las yemas de sus dedos resplandeciendo en una tenue fosforescencia azul.</p>',
      synopsis: 'La expedición desciende a las catacumbas inundadas con los mercenarios de Seraphina.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 5200,
      status: 'In Progress',
      attachedCharacterIds: ['char-1', 'char-5', 'char-7'],
    },
    {
      id: 'scene-2-2',
      title: 'Capítulo 6: El yunque de los perdidos',
      content:
        '<p>En lo más hondo de la forja cavernosa, Ignis trabajaba iluminado por vetas de magma subterráneo. Su martillo caía sobre metal celeste ennegrecido con golpes atronadores que hacían vibrar sus costillas.</p><p>«¿Traes sangre de la corona a la forja profunda?», gruñó Ignis sin detener el vaivén del mazo. «El último príncipe que estuvo donde estás cambió media alma por una hoja que atravesara escamas de dragón. Murió ahogado en su propio tuétano tres lunas después».</p><p>Aurelia dio un paso al frente, con voz firme e inquebrantable: «No he venido por una espada, herrero. He venido a reforjar la corona que se hizo pedazos».</p>',
      synopsis: 'Aurelia y Valerius negocian con el maestro rúnico de las profundidades Ignis.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 4200,
      status: 'First Draft',
      attachedCharacterIds: ['char-5', 'char-8'],
    },
    {
      id: 'scene-2-3',
      title: 'Capítulo 7: El oráculo de la profetisa ciega',
      content:
        '<p>Lyanna permanecía sentada sobre un trono de costillas de ballena petrificadas, con las cuencas vendadas dirigidas hacia el agua que se filtraba entre las estalactitas. Olía a salmuera y romero seco.</p><p>«Tres coronas», susurró; su voz vibraba con armónicos que parecían brotar del suelo oceánico más recóndito. «Una de hierro, forjada en el duelo. Una de seda, tejida con veneno. Y una de ceniza, ceñida por un espectro que aún cree que su corazón late».</p><p>Caelen retrocedió hacia la penumbra, aferrando instintivamente la empuñadura de su espada corta al notar cómo el agua en torno a sus botas comenzaba a agitarse con anguilas pálidas y fosforescentes.</p>',
      synopsis: 'La oráculo Lyanna revela la profecía tripartita de las tres coronas.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 3900,
      status: 'In Progress',
      attachedCharacterIds: ['char-3', 'char-9'],
    },
    {
      id: 'scene-2-4',
      title: 'Capítulo 8: Emboscada en la esclusa de Blackford',
      content:
        '<p>Virotes de ballesta brotaron de las aspilleras del antiguo acueducto antes de que los exploradores lograran dar la voz de alarma. Los purificadores de Morvath los habían flanqueado por los conductos de alcantarillado subterráneo.</p><p>Doran alzó su escudo pavés justo a tiempo para repeler una andanada de púas aceradas. «¡Sterling!», rugió Doran, con la barba salpicada de fango. «¡El Inquisidor trae aceite inflamable! ¡Si prenden fuego a la galería, el humo nos asfixiará a todos!».</p><p>Valerius desenvainó su espada larga; los glifos rúnicos refulgieron con un destello violeta en la hoja mientras cargaba hacia el estrecho cuello de botella.</p>',
      synopsis: 'La vanguardia inquisitorial de Morvath embosca al grupo en el acueducto anegado.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 4800,
      status: 'First Draft',
      attachedCharacterIds: ['char-1', 'char-4', 'char-10'],
    },
    {
      id: 'scene-2-5',
      title: 'Capítulo 9: El pacto del emisario',
      content:
        '<p>En una sala seca y neutral entre compuertas subterráneas, el emisario de claves Nolan los aguardaba, escoltado por dos guardias extranjeros de armadura lacada. Sobre la mesa de pizarra descansaba un estuche de terciopelo lacrado.</p><p>«La Coalición Oriental no tiene ambiciones sobre vuestro trono, Sterling», ronroneó Nolan, sirviendo vino especiado en copas de estaño. «Solo deseamos el tránsito marítimo por el Golfo del Kraken. Firme el tratado naval, y doce mil dragones veteranos desembarcarán en vuestra bahía antes del próximo cuarto creciente».</p><p>Vespera, surgiendo sigilosa de la galería tras ellos, ladeó la cabeza: «No lo firmes, Valerius. Su flota zarpó hace tres días... y no fue en vuestro auxilio».</p>',
      synopsis: 'Tensión diplomática con el emisario Nolan que revela las maniobras secretas de la flota aliada.',
      type: 'scene',
      parentId: 'act-2',
      targetWords: 4100,
      status: 'First Draft',
      attachedCharacterIds: ['char-1', 'char-2', 'char-11'],
    },

    // ACTO III
    {
      id: 'act-3',
      title: 'Acto III: El asedio del Alto Bastión',
      content: '',
      synopsis: 'Estalla una guerra civil abierta mientras Morvath declara la capital bajo estado de inquisición marcial.',
      type: 'folder',
      parentId: null,
      targetWords: 35000,
      status: 'Not Started',
    },
    {
      id: 'scene-3-1',
      title: 'Capítulo 10: Dobla la campana roja',
      content:
        '<p>La campana de hierro del Alto Bastión dobló dieciocho veces: la antigua señal de un mandato ilegítimo. Densas columnas de humo se alzaban desde el distrito mercantil mientras los graneros ardían recortados contra el cielo nocturno.</p><p>Desde las almenas, Seraphina contemplaba el despliegue del parque de asedio inquisitorial. «Han traído fundíbulos cargados con fuego valyrio», constató con fría parsimonia profesional. «Podemos sostener la barbacana exterior cuatro horas. Tras eso, lucharemos estancia por estancia».</p><p>Valerius ajustó las correas de su coraza: «Cuatro horas es todo lo que Aurelia necesita para alcanzar la aguja superior».</p>',
      synopsis: 'Morvath cerca el Alto Bastión mientras Seraphina organiza las defensas.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 4600,
      status: 'Not Started',
      attachedCharacterIds: ['char-1', 'char-7'],
    },
    {
      id: 'scene-3-2',
      title: 'Capítulo 11: La cámara del rey loco',
      content:
        '<p>En la cúspide de la Aguja Negra, Sylas yacía atado a cadenas de hierro colgadas de las bóvedas. Su barba estaba llena de jirones de pergamino y sebo reseco; sus pupilas reflejaban la luz quebrada de las vidrieras.</p><p>«Te pareces tanto a tu abuelo, niña», rió entre dientes Sylas, tosiendo flema negruzca. «Él también creyó que podía enjaular al Leviatán. Creyó que el tratado se escribió con tinta. ¡Se escribió con la salmuera de las lágrimas de nuestros hijos!».</p><p>Aurelia se aproximó al soberano encadenado, portando el pergamino rúnico hallado en los archivos de Balthazar.</p>',
      synopsis: 'Aurelia encara al encarcelado exrey Sylas para desentrañar el último glifo de contención.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 3900,
      status: 'Not Started',
      attachedCharacterIds: ['char-5', 'char-12'],
    },
    {
      id: 'scene-3-3',
      title: 'Capítulo 12: La brecha del portón de hierro',
      content:
        '<p>Los macizos portones de roble y herraje volaron hacia el interior con un estampido que arrojó a una treintena de defensores contra el empedrado. Morvath cruzó las vigas astilladas; sus hábitos permanecían inmaculados, sin una mancha de hollín ni sangre.</p><p>Doran le salió al paso en el umbral, descargando su martillo de guerra en un arco demoledor que agrietó el broquel ceremonial del Inquisidor. Mas el lugarteniente de Morvath disparó a quemarropa en la juntura del gorguera del veterano.</p><p>Doran cayó de rodillas, tosiendo sangre sobre el estandarte de Oakhaven.</p>',
      synopsis: 'Se rompe el acceso al bastión y Doran protagoniza una heroica última resistencia.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 4300,
      status: 'Not Started',
      attachedCharacterIds: ['char-4', 'char-10'],
    },
    {
      id: 'scene-3-4',
      title: 'Capítulo 13: Sombras sobre el parapeto',
      content:
        '<p>Caelen esprintaba por los parapetos estrechos y resbaladizos por la lluvia, esquivando saetas y arrojando bombas de humo a las troneras atestadas. Abajo, Vespera guiaba a los arqueros heridos hacia los canales subterráneos secretos.</p><p>«¡Caelen!», gritó ella por encima del estruendo del combate. «¡La armada está desembarcando en la rada! ¡Nolan nos ha traicionado a ambos bandos!».</p><p>Una cañonada proveniente de la bocana confirmó sus palabras, destrozando los torreones de la guardia costera y tiñendo las nubes bajas de un carmesí abrasador.</p>',
      synopsis: 'Caelen y Vespera coordinan el repliegue táctico mientras buques extranjeros bombardean la bahía.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 4000,
      status: 'Not Started',
      attachedCharacterIds: ['char-2', 'char-3', 'char-11'],
    },
    {
      id: 'scene-3-5',
      title: 'Capítulo 14: Duelo en el atrio solar',
      content:
        '<p>Valerius y Morvath se enfrentaron en el centro del patio devastado, cercados por tapices en llamas y una lluvia que siseaba sobre losas ardientes. El acero chocó contra el hierro bendecido en un estallido de chispas que cegó a los escasos guardias con vida.</p><p>«¡No puedes gobernar un reino edificado sobre podredumbre, Sterling!», bramó Morvath, rozando con su maza el pómulo de Valerius. «¡Solo el fuego sagrado puede purificar este suelo!».</p><p>«Yo no pretendo gobernar», replicó Valerius, mientras su espada cercenaba de un tajo certero la cadena del farol inquisitorial.</p>',
      synopsis: 'El duelo culminante entre Valerius y el Inquisidor Morvath.',
      type: 'scene',
      parentId: 'act-3',
      targetWords: 5100,
      status: 'Not Started',
      attachedCharacterIds: ['char-1', 'char-4'],
    },

    // ACTO IV
    {
      id: 'act-4',
      title: 'Acto IV: La aurora de obsidiana',
      content: '',
      synopsis: 'Las secuelas del asedio, la coronación y el despertar definitivo de las fosas abisales.',
      type: 'folder',
      parentId: null,
      targetWords: 25000,
      status: 'Not Started',
    },
    {
      id: 'scene-4-1',
      title: 'Capítulo 15: Las cenizas de Oakhaven',
      content:
        '<p>El amanecer no trajo calor alguno, solo una claridad grisácea que reveló la magnitud del estrago. La mitad de la capital no era más que maderos humeantes y silenciosas ruinas. Los supervivientes se amontonaban alrededor de braseros en la plaza mayor.</p><p>Seraphina revistó a sus tropas restantes, contando apenas doscientos piqueros en pie de lucha. «El asedio ha cedido, pero el invierno está a las puertas. Sin grano de las vegas meridionales, la ciudad perecerá de hambre antes de la primera nevada».</p><p>Valerius permanecía junto a ella, con el hombro vendado en lienzos empapados en el ungüento de Balthazar.</p>',
      synopsis: 'Balance del coste de la victoria y frente a la amenaza de una hambruna invernal.',
      type: 'scene',
      parentId: 'act-4',
      targetWords: 3700,
      status: 'Not Started',
      attachedCharacterIds: ['char-1', 'char-6', 'char-7'],
    },
    {
      id: 'scene-4-2',
      title: 'Capítulo 16: La coronación de plata',
      content:
        '<p>Aurelia se arrodilló ante el trono reconstruido. En lugar de la diadema de oro fundido, Ignis posó sobre su frente un aro forjado en hierro meteórico y cristal oceánico gélido.</p><p>«No reclamo ningún derecho divino», proclamó Aurelia, y su voz reverberó ante los millares congregados en el atrio. «Solo asumo la carga del baluarte y del escudo. Hasta que el mar reclame esta tierra, Oakhaven permanecerá en libertad».</p><p>Vespera inclinó la cabeza desde el banco consistorial, con una sonrisa enigmática y calculadora.</p>',
      synopsis: 'Aurelia es coronada Reina de Oakhaven con la nueva corona de cristal marino.',
      type: 'scene',
      parentId: 'act-4',
      targetWords: 4400,
      status: 'Not Started',
      attachedCharacterIds: ['char-2', 'char-5', 'char-8'],
    },
    {
      id: 'scene-4-3',
      title: 'Capítulo 17: Sombras en el horizonte',
      content:
        '<p>En los altos acantilados del promontorio de Whisperwood, Caelen observaba los restos de la escuadra de Nolan retirarse entre la bruma. A su vera, la vidente Lyanna señaló hacia alta mar con su dedo pálido.</p><p>«No están huyendo», susurró Lyanna mientras el vendaval agitaba sus ropajes blanqueados por el salitre. «Están despejando las aguas para lo que se alza desde el abismo».</p><p>Mar adentro, una ola negra de cuarenta brazas de altura creció sin necesidad de viento, palpitando en una intensa bioluminiscencia violeta.</p>',
      synopsis: 'El mar se agita mientras la verdadera amenaza primordial despierta en el lecho oceánico.',
      type: 'scene',
      parentId: 'act-4',
      targetWords: 4100,
      status: 'Not Started',
      attachedCharacterIds: ['char-3', 'char-9'],
    },
    {
      id: 'scene-4-4',
      title: 'Capítulo 18: Epílogo: El libro de claves del abismo',
      content:
        '<p>En su despacho privado, Valerius abrió el libro de claves reales que había desencadenado la guerra. Las páginas, antaño pobladas de cifras ininteligibles, se habían reescrito solas en una caligrafía oceánica fosforescente.</p><p>En la última página, trazada en tinta fresca que no terminaba de secar, figuraba una única orden: <i>La corona ha sido ceñida; ahora convoca a la Marea.</i></p><p>Valerius cerró la pesada cubierta de cuero y apagó la vela de un soplido.</p>',
      synopsis: 'El misterio postrero desvela la auténtica naturaleza del pacto real.',
      type: 'scene',
      parentId: 'act-4',
      targetWords: 2800,
      status: 'Not Started',
      attachedCharacterIds: ['char-1'],
    },
  ],

  // PERSONAJES
  characters: [
    {
      id: 'char-1',
      name: 'Lord Valerius Sterling',
      role: 'Protagonist',
      summary:
        'Lord Comandante de la Guardia Real. Un veterano curtido en batalla cargado con el misterio del regicidio y lealtades encontradas.',
      tags: [
        { id: 'tag-1', label: 'Comandante', color: 'emerald' },
        { id: 'tag-2', label: 'Espadachín', color: 'blue' },
        { id: 'tag-3', label: 'Estoico', color: 'zinc' },
      ],
      fields: [
        { id: 'cf-1', label: 'Motivación', value: 'Esclarecer el regicidio de Voron y evitar la guerra civil' },
        { id: 'cf-2', label: 'Defecto trágico', value: 'Apego estricto a los juramentos aun cuando las instituciones se corrompen' },
        { id: 'cf-3', label: 'Arma predilecta', value: 'Espada bastarda rúnica «Fiel al Voto»' },
      ],
    },
    {
      id: 'char-2',
      name: 'Lady Vespera Thorne',
      role: 'Supporting',
      summary:
        'Matrona del Sindicato de la Seda. Dirige la red secreta de espionaje que va desde los muelles hasta el consejo noble.',
      tags: [
        { id: 'tag-4', label: 'Maestra de espías', color: 'purple' },
        { id: 'tag-5', label: 'Nobleza', color: 'rose' },
        { id: 'tag-6', label: 'Envenenadora', color: 'amber' },
      ],
      fields: [
        { id: 'cf-4', label: 'Motivación', value: 'Quebrar monopolios reales e instaurar un consejo mercantil afín' },
        { id: 'cf-5', label: 'Secreto', value: 'Financió los ensayos alquímicos que provocaron accidentalmente la muerte del rey' },
      ],
    },
    {
      id: 'char-3',
      name: 'Caelen el Silencioso',
      role: 'Supporting',
      summary:
        'Batidor y explorador desterrado. Conoce las rutas inundadas bajo Oakhaven mejor que nadie con vida.',
      tags: [
        { id: 'tag-7', label: 'Explorador', color: 'cyan' },
        { id: 'tag-8', label: 'Proscrito', color: 'amber' },
      ],
      fields: [
        { id: 'cf-6', label: 'Motivación', value: 'Rehabilitar el honor familiar tras ser falsamente inculpado de la masacre fronteriza' },
        { id: 'cf-7', label: 'Habilidad singular', value: 'Visión nocturna y oído sobrehumano en laberintos subterráneos' },
      ],
    },
    {
      id: 'char-4',
      name: 'Gran Inquisidor Morvath',
      role: 'Antagonist',
      summary:
        'Líder fanático de la Orden de la Llama Sin Sol. Cree que solo la purga de hierro librará a la humanidad de la corrupción abisal.',
      tags: [
        { id: 'tag-9', label: 'Fanático', color: 'rose' },
        { id: 'tag-10', label: 'Inquisidor', color: 'purple' },
      ],
      fields: [
        { id: 'cf-8', label: 'Motivación', value: 'Erradicar la herejía en Oakhaven y calcinar todo vestigio de magia rúnica' },
        { id: 'cf-9', label: 'Psicología', value: 'Considera los daños colaterales de inocentes como un martirio bienaventurado' },
      ],
    },
    {
      id: 'char-5',
      name: 'Princesa Aurelia Voron',
      role: 'Protagonist',
      summary:
        'Única heredera legítima al Trono Alto. Posee un talento rúnico latente que conecta con la matriz oceánica.',
      tags: [
        { id: 'tag-11', label: 'Realeza', color: 'blue' },
        { id: 'tag-12', label: 'Tejedora rúnica', color: 'cyan' },
      ],
      fields: [
        { id: 'cf-10', label: 'Motivación', value: 'Reconstruir Oakhaven como un reino ilustrado libre de fanatismos religiosos' },
        { id: 'cf-11', label: 'Carga mágica', value: 'Cada conjuro rúnico consume parte de su vitalidad física' },
      ],
    },
    {
      id: 'char-6',
      name: 'Maestro Alquimista Balthazar',
      role: 'Supporting',
      summary:
        'Principal erudito del Gremio Arcano. Descifró la composición química de la ceniza con la que fue ejecutado el monarca.',
      tags: [
        { id: 'tag-13', label: 'Erudito', color: 'emerald' },
        { id: 'tag-14', label: 'Alquimista', color: 'amber' },
      ],
      fields: [
        { id: 'cf-12', label: 'Motivación', value: 'Preservar los archivos imperiales antes de que Morvath los reduzca a cenizas' },
      ],
    },
    {
      id: 'char-7',
      name: 'Capitana Seraphina Drake',
      role: 'Supporting',
      summary:
        'Comandante de la compañía mercenaria Legión de Hierro. Pragmática, implacable y devota de sus soldados.',
      tags: [
        { id: 'tag-15', label: 'Mercenaria', color: 'zinc' },
        { id: 'tag-16', label: 'Guerrera', color: 'rose' },
      ],
      fields: [
        { id: 'cf-13', label: 'Código marcial', value: 'Un contrato sellado con oro es inviolable hasta la muerte' },
      ],
    },
    {
      id: 'char-8',
      name: 'Ignis el Forjador Rúnico',
      role: 'Supporting',
      summary:
        'Herrero de las profundidades que moldea metal celeste y calor volcánico. El único artesano capaz de tallar cristal oceánico.',
      tags: [
        { id: 'tag-17', label: 'Artesano', color: 'amber' },
        { id: 'tag-18', label: 'Subterráneo', color: 'purple' },
      ],
    },
    {
      id: 'char-9',
      name: 'Vidente Lyanna',
      role: 'Supporting',
      summary:
        'Oráculo invidente sintonizada con las corrientes abisales. Sus augurios anuncian la marea creciente y la triple corona.',
      tags: [
        { id: 'tag-19', label: 'Profetisa', color: 'cyan' },
        { id: 'tag-20', label: 'Mística', color: 'blue' },
      ],
    },
    {
      id: 'char-10',
      name: 'Doran el Acorazado',
      role: 'Supporting',
      summary:
        'Veterano guardaespaldas real y antiguo mentor de Valerius. Su firmeza constituye el baluarte de la guardia leal.',
      tags: [
        { id: 'tag-21', label: 'Veterano', color: 'zinc' },
        { id: 'tag-22', label: 'Guardián', color: 'emerald' },
      ],
    },
    {
      id: 'char-11',
      name: 'Emisario Nolan',
      role: 'Rival',
      summary:
        'Diplomático de la Coalición Oriental. Negocia hábilmente mediante crisis provocadas y advertencias de asedio naval.',
      tags: [
        { id: 'tag-23', label: 'Diplomático', color: 'purple' },
        { id: 'tag-24', label: 'Intrigante', color: 'rose' },
      ],
    },
    {
      id: 'char-12',
      name: 'Sylas el Rey Desterrado',
      role: 'Supporting',
      summary:
        'Antiguo monarca cautivo en la Aguja Negra. Desvaría en acertijos sobre el pacto primordial del Leviatán.',
      tags: [
        { id: 'tag-25', label: 'Demente', color: 'zinc' },
        { id: 'tag-26', label: 'Rey Caído', color: 'rose' },
      ],
    },
  ],

  // TRAMAS
  storylines: [
    {
      id: 'story-1',
      title: 'La conspiración del regicidio',
      color: 'purple',
      description: 'Descubrir quién orquestó el asesinato arcano del rey Voron y con qué fin.',
      linkedChapterIds: ['scene-1-1', 'scene-1-2', 'scene-1-4', 'scene-2-5', 'scene-4-4'],
      fields: [
        { id: 'sf-1', label: 'Interés principal', value: 'Legitimidad del Trono y supervivencia del Imperio' },
        { id: 'sf-2', label: 'Pista clave', value: 'El libro de claves en llamas hallado junto al cadáver del rey' },
      ],
    },
    {
      id: 'story-2',
      title: 'El despertar rúnico',
      color: 'cyan',
      description: 'El camino de Aurelia para dominar los glifos abisales sin sucumbir a la demencia oceánica.',
      linkedChapterIds: ['scene-1-3', 'scene-2-1', 'scene-2-2', 'scene-3-2', 'scene-4-2'],
      fields: [
        { id: 'sf-3', label: 'Coste del poder', value: 'Merma la vitalidad corporal en cada invocación' },
      ],
    },
    {
      id: 'story-3',
      title: 'Alianza de la Legión de Hierro',
      color: 'amber',
      description: 'Asegurar el compromiso militar de Seraphina contra los purificadores de Morvath.',
      linkedChapterIds: ['scene-2-1', 'scene-3-1', 'scene-3-3', 'scene-4-1'],
    },
    {
      id: 'story-4',
      title: 'Sombras de la Llama Sin Sol',
      color: 'rose',
      description: 'La cruzada inquisitorial para imponer la ley marcial y teocrática sobre Oakhaven.',
      linkedChapterIds: ['scene-1-2', 'scene-2-4', 'scene-3-1', 'scene-3-3', 'scene-3-5'],
    },
    {
      id: 'story-5',
      title: 'Las criptas sumergidas de Voron',
      color: 'emerald',
      description: 'Travesía por los lechos subterráneos para forjar la corona sustituta de cristal oceánico.',
      linkedChapterIds: ['scene-2-1', 'scene-2-2', 'scene-2-3', 'scene-4-2'],
    },
    {
      id: 'story-6',
      title: 'La flota extranjera',
      color: 'blue',
      description: 'Las maquinaciones navales del emisario Nolan y el riesgo inminente de bombardeo en la rada.',
      linkedChapterIds: ['scene-2-5', 'scene-3-4', 'scene-4-3'],
    },
  ],

  // NODOS DE UNIÓN
  junctions: [
    {
      id: 'junc-1',
      label: 'Consejo del Sindicato de la Seda',
      x: 380,
      y: 280,
      storylineId: 'story-1',
    },
    {
      id: 'junc-2',
      label: 'Mando de la Legión de Hierro',
      x: 720,
      y: 350,
      storylineId: 'story-3',
    },
    {
      id: 'junc-3',
      label: 'Tribunal Inquisitorial',
      x: 520,
      y: 620,
      storylineId: 'story-4',
    },
  ],

  // RELACIONES
  relationships: [
    {
      id: 'rel-1',
      sourceId: 'char-1',
      targetId: 'char-2',
      type: 'Alliance',
      label: 'Pacto de conveniencia',
      style: 'dashed',
      color: 'purple',
      direction: 'bidirectional',
      notes: 'Valerius ofrece salvoconductos a cambio de los informes de inteligencia de Vespera.',
    },
    {
      id: 'rel-2',
      sourceId: 'char-1',
      targetId: 'char-4',
      type: 'Enmity',
      label: 'Enemistad a muerte',
      style: 'solid',
      color: 'rose',
      direction: 'bidirectional',
      notes: 'Morvath acusa a Valerius de regicidio; Valerius considera a Morvath un déspota intolerante.',
    },
    {
      id: 'rel-3',
      sourceId: 'char-1',
      targetId: 'char-5',
      type: 'Mentor',
      label: 'Protector y pupila',
      style: 'solid',
      color: 'blue',
      direction: 'directed',
      notes: 'Valerius juró defender la vida de la princesa Aurelia frente a las garras de la inquisición.',
    },
    {
      id: 'rel-4',
      sourceId: 'char-2',
      targetId: 'char-3',
      type: 'Debt',
      label: 'Deuda de lealtad',
      style: 'dotted',
      color: 'amber',
      direction: 'directed',
      notes: 'Caelen debe favores a Vespera por tramitar documentos falsos con los que ocultarse de la guardia.',
    },
    {
      id: 'rel-5',
      sourceId: 'char-3',
      targetId: 'char-5',
      type: 'Alliance',
      label: 'Guía y batidor',
      style: 'solid',
      color: 'cyan',
      direction: 'bidirectional',
      notes: 'Caelen conduce a Aurelia a través de las peligrosas galerías inundadas.',
    },
    {
      id: 'rel-6',
      sourceId: 'char-1',
      targetId: 'char-7',
      type: 'Alliance',
      label: 'Contrato de defensa',
      style: 'solid',
      color: 'zinc',
      direction: 'directed',
      notes: 'Valerius contrató a la tropa de Seraphina para reforzar las murallas del Alto Bastión.',
    },
    {
      id: 'rel-7',
      sourceId: 'char-1',
      targetId: 'char-10',
      type: 'Family',
      label: 'Hermanos de armas',
      style: 'solid',
      color: 'emerald',
      direction: 'bidirectional',
      notes: 'Doran instruyó a Valerius hace veinte años en los frentes de la frontera.',
    },
    {
      id: 'rel-8',
      sourceId: 'char-4',
      targetId: 'char-6',
      type: 'Enmity',
      label: 'Objetivo herético',
      style: 'dashed',
      color: 'rose',
      direction: 'directed',
      notes: 'Morvath posee una orden firmada para requisar e incinerar el laboratorio de Balthazar.',
    },
    {
      id: 'rel-9',
      sourceId: 'char-6',
      targetId: 'char-8',
      type: 'Alliance',
      label: 'Colaboración arcana',
      style: 'dashed',
      color: 'emerald',
      direction: 'bidirectional',
      notes: 'Balthazar suministra catalizadores refinados para la forja de metal celeste de Ignis.',
    },
    {
      id: 'rel-10',
      sourceId: 'char-5',
      targetId: 'char-8',
      type: 'Debt',
      label: 'Deuda de la corona',
      style: 'solid',
      color: 'amber',
      direction: 'reverse',
      notes: 'Ignis forja la diadema de cristal a cambio de garantías reales para los gremios subterráneos.',
    },
    {
      id: 'rel-11',
      sourceId: 'char-9',
      targetId: 'char-5',
      type: 'Mentor',
      label: 'Guía mística',
      style: 'dotted',
      color: 'cyan',
      direction: 'directed',
      notes: 'Lyanna enseña a Aurelia a descifrar visiones oceánicas sin perder la cordura.',
    },
    {
      id: 'rel-12',
      sourceId: 'char-2',
      targetId: 'char-11',
      type: 'Rival',
      label: 'Ajedrez de sombras',
      style: 'dashed',
      color: 'purple',
      direction: 'bidirectional',
      notes: 'Vespera y Nolan libran una guerra silenciosa de contraespionaje y presiones políticas.',
    },
    {
      id: 'rel-13',
      sourceId: 'char-5',
      targetId: 'char-12',
      type: 'Family',
      label: 'Tío apartado',
      style: 'dotted',
      color: 'rose',
      direction: 'none',
      notes: 'Sylas fue encerrado en la torre por el progenitor de Aurelia hace tres lustros.',
    },
    {
      id: 'rel-14',
      sourceId: 'char-4',
      targetId: 'char-10',
      type: 'Enmity',
      label: 'Rivalidad de asedio',
      style: 'solid',
      color: 'rose',
      direction: 'directed',
      notes: 'Morvath se propone personalmente quebrar la legendaria resistencia del anciano Doran en las puertas.',
    },
    {
      id: 'rel-15',
      sourceId: 'char-7',
      targetId: 'char-11',
      type: 'Enmity',
      label: 'Conflicto costero',
      style: 'dashed',
      color: 'zinc',
      direction: 'bidirectional',
      notes: 'La artillería de Seraphina frena los corsarios enviados por Nolan en la bocana.',
    },
    {
      id: 'rel-16',
      sourceId: 'char-2',
      targetId: 'junc-1',
      type: 'Custom',
      label: 'Líder del Sindicato',
      style: 'solid',
      color: 'purple',
      direction: 'directed',
    },
    {
      id: 'rel-17',
      sourceId: 'char-7',
      targetId: 'junc-2',
      type: 'Custom',
      label: 'Mando militar',
      style: 'solid',
      color: 'amber',
      direction: 'directed',
    },
    {
      id: 'rel-18',
      sourceId: 'char-4',
      targetId: 'junc-3',
      type: 'Custom',
      label: 'Juez supremo',
      style: 'solid',
      color: 'rose',
      direction: 'directed',
    },
  ],

  // LORE Y MUNDO
  worldItems: [
    {
      id: 'world-1',
      title: 'Ciudadela de Oakhaven',
      category: 'Location',
      summary: 'Fortaleza medieval escalonada erigida sobre catacumbas abisales milenarias.',
      description:
        'Construida en tres terrazas pétreas: el Alto Bastión (palacio y aguja), el Círculo Mercantil (bazares y gremios) y los Bajos Muelles (canales y cloacas que descienden a las ruinas sumergidas).',
      tags: ['Capital', 'Fortaleza', 'Terrazas'],
    },
    {
      id: 'world-2',
      title: 'La Fosa del Cristal Quebrado',
      category: 'Location',
      summary: 'Abismo inundado poblado de vegetación marina bioluminiscente.',
      description:
        'Vestigios antiguos anegados durante el despertar primordial del Leviatán. Accesibles solo por las compuertas inferiores en noches de luna menguante.',
      tags: ['Subterráneo', 'Ruinas', 'Abismo'],
    },
    {
      id: 'world-3',
      title: 'El Sindicato de la Seda',
      category: 'Faction',
      summary: 'Cártel mercantil y red de espionaje clandestina encabezada por Lady Vespera.',
      description:
        'Domina el contrabando portuario, el tráfico de informes reservados y el comercio de reactivos alquímicos en las cuatro provincias.',
      tags: ['Cártel', 'Espionaje', 'Sombras'],
    },
    {
      id: 'world-4',
      title: 'Orden de la Llama Sin Sol',
      category: 'Faction',
      summary: 'Hueste de fanáticos consagrados a erradicar todo vestigio de hechicería rúnica.',
      description:
        'Bajo el mando del Gran Inquisidor Morvath. Sus tropas portan corazas oscurecidas y faroles de hierro alimentados con nafta sagrada.',
      tags: ['Teocracia', 'Inquisición', 'Purificadores'],
    },
    {
      id: 'world-5',
      title: 'La Corona Sumergida',
      category: 'Artifact',
      summary: 'Aro de hierro meteórico y cristal marino que vincula las líneas de poder abisales.',
      description:
        'Reforjada por Ignis a partir de los restos de la corona calcinada del rey Voron. Liga la voluntad del monarca con el flujo de las mareas.',
      tags: ['Insignia', 'Metal celeste', 'Rúnico'],
    },
    {
      id: 'world-6',
      title: 'Fiel al Voto',
      category: 'Artifact',
      summary: 'Espada larga rúnica heredada por Valerius Sterling.',
      description:
        'Forjada con runas de contención que refulgen en tonos violeta ante la cercanía de ponzoña alquímica o magia hostil.',
      tags: ['Arma', 'Hoja', 'Linaje'],
    },
    {
      id: 'world-7',
      title: 'El Velo de Obsidiana',
      category: 'Lore',
      summary: 'Frontera cósmica que aísla la superficie del dominio de los leviatánidos marinos.',
      description:
        'Según la tradición oral, el velo pierde firmeza cuando se derrama sangre real sin justicia. Su debilitamiento se manifiesta en aguas negras y borrascas fosforescentes.',
      tags: ['Cosmología', 'Mitos', 'Leviatán'],
    },
  ],

  // BLOQUES DE CONTEXTO
  contextBlocks: [
    {
      id: 'block-1',
      title: 'Tono y temáticas esenciales',
      type: 'list',
      content:
        'Ambigüedad moral: ninguna facción es enteramente pura ni totalmente perversa\nAtmósfera de piedra mojada, brasas humeantes y salitre marino\nRitmo: intriga palaciega que desemboca en asedio bélico total\nEl precio de la magia: cada conjuro cobra un tributo físico o anímico',
    },
    {
      id: 'block-2',
      title: 'Objetivos editoriales actuales',
      type: 'list',
      content:
        'Pulir el intercambio verbal en la expedición del capítulo 5 entre Seraphina y Valerius\nAhondar en el pasado de Morvath en el capítulo 8 para subrayar su trágica determinación\nVigilar la coherencia de las leyes mágicas a lo largo del Acto II y III\nRevisar los objetivos de palabras para la secuencia del asedio en el Acto III',
    },
    {
      id: 'block-3',
      title: 'Principios y léxico de las runas',
      type: 'text',
      content:
        'La hechicería rúnica emana del fondo abisal. Se conocen tres ramas primarias: Vor (vínculos y defensas), Kael (combustión y catalizadores) y Ly (resonancia premonitoria). Canalizar sin focos de metal celeste calcina las terminaciones nerviosas del hechicero.',
    },
    {
      id: 'block-4',
      title: 'Sinopsis de facciones geopolíticas',
      type: 'text',
      content:
        'La Corona de Oakhaven tutela la franja litoral. La Coalición Oriental rige las rutas comerciales marítimas. Los Gremios Subterráneos dominan la extracción y manufactura del metal celeste. La Llama Sin Sol ejerce como tribunal religioso militar con plena autonomía.',
    },
  ],
};

