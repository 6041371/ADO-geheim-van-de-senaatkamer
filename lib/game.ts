export const GAME_MINUTES = 60;

export const PEOPLE = [
  { name: "Marcel de Vries", role: "Voorzitter" },
  { name: "Karin Bos", role: "Financiën" },
  { name: "Tom Albers", role: "Technisch adviseur" },
  { name: "Sophie van Rijn", role: "Communicatie" },
] as const;

export type LevelId = 1 | 2 | 3 | 4 | 5;

export type Choice = {
  id: string;
  label: string;
};

type QuestionBase = {
  id: string;
  level: LevelId;
  levelName: string;
  kicker: string;
  story: string[];
  prompt: string;
  wrong: string;
  reveal: string;
  hint?: string;
};

export type ChoiceQuestion = QuestionBase & {
  kind: "choice";
  choices: Choice[];
  correctId: string;
};

export type OrderQuestion = QuestionBase & {
  kind: "order";
  items: Choice[];
  correctOrder: string[];
};

export type SheetStep = {
  id: "onderzoeksblad";
  kind: "sheet";
  level: 5;
  levelName: string;
};

export type DaderStep = {
  id: "dader";
  kind: "dader";
  level: 5;
  levelName: string;
};

export type FinaleStep = {
  id: "finale";
  kind: "finale";
  level: 5;
  levelName: string;
};

export type Step = ChoiceQuestion | OrderQuestion | SheetStep | DaderStep | FinaleStep;

export const LEVELS: { id: LevelId; name: string; minutes: number }[] = [
  { id: 1, name: "De Vergadering Begint", minutes: 8 },
  { id: 2, name: "Het Geheime Dossier", minutes: 10 },
  { id: 3, name: "Het Embargo", minutes: 10 },
  { id: 4, name: "Het Lek", minutes: 12 },
  { id: 5, name: "De Waarheid", minutes: 12 },
];

const orderItems: Choice[] = [
  { id: "besproken", label: "Het bestuur bespreekt de vertrouwelijke stadionplannen." },
  { id: "afspraken", label: "Er worden afspraken gemaakt over de communicatie." },
  { id: "toegang", label: "Tom krijgt toegang tot de vertrouwelijke informatie." },
  { id: "verstuurd", label: "Het document wordt via het gedeelde communicatieaccount verstuurd." },
  { id: "media", label: "De informatie verschijnt voortijdig in de media." },
  { id: "werkstation", label: "De digitale registraties leiden naar Toms werkstation." },
];

export const STEPS: Step[] = [
  {
    id: "q1",
    kind: "choice",
    level: 1,
    levelName: "De Vergadering Begint",
    kicker: "Opdracht 1 · Wie was aanwezig?",
    story: [
      "Jullie zitten in de Senaatskamer. Jaren geleden, toen hier nog sigaren werden gerookt, vond een vertrouwelijke bestuursvergadering plaats over de toekomst van het stadion.",
      "Vijf mensen hoorden bij die avond: Marcel de Vries, Karin Bos, Tom Albers, Sophie van Rijn en Erik Meijer.",
      "Toen de vergadering begon, zaten Erik Meijer, Karin Bos en Tom Albers al aan tafel. Twee stoelen waren nog leeg.",
    ],
    prompt: "Wie waren bij aanvang van de vergadering nog niet aanwezig?",
    choices: [
      { id: "marcel-sophie", label: "Marcel de Vries en Sophie van Rijn" },
      { id: "sophie", label: "Alleen Sophie van Rijn" },
      { id: "erik-marcel", label: "Erik Meijer en Marcel de Vries" },
      { id: "karin-tom", label: "Karin Bos en Tom Albers" },
    ],
    correctId: "marcel-sophie",
    wrong: "Kijk wie er bij de start ontbrak. Erik, Karin en Tom zaten er wel.",
    reveal: "Marcel de Vries en Sophie van Rijn waren nog niet aanwezig toen de vergadering begon.",
    hint: "Pak de notulen.",
  },
  {
    id: "q2",
    kind: "choice",
    level: 1,
    levelName: "De Vergadering Begint",
    kicker: "Opdracht 2 · De ontbrekende notulen",
    story: [
      "Het verslag van de vergadering is gedeeltelijk beschadigd. Juist bij het Stadiondossier, de communicatieafspraken en de informatie voor de pers ontbreken zinnen.",
      "De belangrijkste afspraken waren al vastgelegd voordat de informatie naar buiten kwam. Dit was geen onduidelijke communicatie.",
    ],
    prompt: "Wat hadden de bestuursleden afgesproken over de stadionplannen?",
    choices: [
      {
        id: "geheim",
        label: "De plannen waren vertrouwelijk en mochten niet zonder toestemming gedeeld worden.",
      },
      {
        id: "geen",
        label: "Er waren geen afspraken over geheimhouding.",
      },
      {
        id: "alles",
        label: "Alle financiële en technische details mochten direct naar de pers.",
      },
    ],
    correctId: "geheim",
    wrong: "De ontbrekende passages gaan juist over wat geheim moest blijven.",
    reveal: "De stadionplannen waren vertrouwelijk en mochten niet zonder toestemming gedeeld worden.",
    hint: "Pak de transcriptie.",
  },
  {
    id: "q3",
    kind: "choice",
    level: 1,
    levelName: "De Vergadering Begint",
    kicker: "Opdracht 3 · Het tijdstip",
    story: [
      "Op tafel lagen een agenda, documenten, een conceptbesluit en een vertrouwelijk stadiondossier.",
      "Om 20:24 uur werd het belangrijkste agendapunt geopend: het Stadiondossier. Alleen de algemene toekomstplannen mochten worden gecommuniceerd. Financiële en technische details bleven vertrouwelijk.",
    ],
    prompt: "Hoe laat opende het bestuur het agendapunt Stadiondossier?",
    choices: [
      { id: "2024", label: "20:24 uur" },
      { id: "1945", label: "19:45 uur" },
      { id: "2100", label: "21:00 uur" },
      { id: "1830", label: "18:30 uur" },
    ],
    correctId: "2024",
    wrong: "Zoek het moment waarop het Stadiondossier werd geopend, niet een ander tijdstip op de papieren.",
    reveal:
      "De code is 2024. Jullie hebben de eerste gebeurtenissen gereconstrueerd. De vergadering begon volgens de officiële agenda, maar de documenten wijzen op vertrouwelijke informatie die niet openbaar mocht worden. Open dossier 2: Het Geheime Dossier.",
    hint: "Pak het stadiondossier.",
  },
  {
    id: "q4",
    kind: "choice",
    level: 2,
    levelName: "Het Geheime Dossier",
    kicker: "Opdracht 4 · De verschillende documenten",
    story: [
      "Binnen het bestuur bestonden verschillende versies van de plannen. Niet iedereen beschikte over dezelfde informatie.",
      "Sommige documenten waren algemeen genoeg voor publicatie. Andere bevatten vertrouwelijke financiële of technische gegevens.",
    ],
    prompt: "Welke versie was uitsluitend voor intern gebruik bedoeld?",
    choices: [
      { id: "intern", label: "Het vertrouwelijke stadiondossier." },
      { id: "pers", label: "De goedgekeurde persverklaring." },
      { id: "fans", label: "De supportersreacties." },
    ],
    correctId: "intern",
    wrong: "Niet elk document mocht de kamer uit. Zoek de versie met de financiële en technische gegevens.",
    reveal: "Het vertrouwelijke stadiondossier was alleen voor intern gebruik bedoeld.",
    hint: "Pak de locatiekaarten.",
  },
  {
    id: "q5",
    kind: "choice",
    level: 2,
    levelName: "Het Geheime Dossier",
    kicker: "Opdracht 5 · Wie had toegang?",
    story: [
      "Niet iedere betrokkene had dezelfde verantwoordelijkheid.",
      "Eén persoon was als technisch adviseur rechtstreeks betrokken bij de technische stadionplannen. Dat maakt die persoon interessant voor het onderzoek. Het bewijst nog geen schuld.",
    ],
    prompt: "Wie had toegang tot de technische informatie?",
    choices: PEOPLE.map((person) => ({ id: person.name, label: `${person.name} — ${person.role}` })),
    correctId: "Tom Albers",
    wrong: "Kijk wie de technische plannen uitwerkte. Toegang is nog geen bewijs.",
    reveal: "Tom Albers had toegang tot de technische informatie. Dat bewijst nog niet dat hij het lek veroorzaakte.",
    hint: "Pak de interne memo.",
  },
  {
    id: "q6",
    kind: "choice",
    level: 2,
    levelName: "Het Geheime Dossier",
    kicker: "Opdracht 6 · Het ontbrekende document",
    story: [
      "Een belangrijk onderdeel van het dossier ontbreekt. De interne versie en de versie voor de pers zijn niet hetzelfde.",
    ],
    prompt: "Welke informatie mocht niet openbaar worden gemaakt?",
    choices: [
      {
        id: "details",
        label: "De financiële en technische details. Alleen de algemene toekomstplannen mochten naar buiten.",
      },
      {
        id: "niets",
        label: "Niets. De interne versie en de persversie waren gelijk.",
      },
      {
        id: "alles",
        label: "Ook de algemene toekomstplannen moesten geheim blijven.",
      },
    ],
    correctId: "details",
    wrong: "Leg de interne versie naast wat voor de pers bedoeld was.",
    reveal:
      "Jullie hebben ontdekt dat er meerdere versies van het stadiondossier bestonden. De vertrouwelijke versie bevatte informatie die nooit buiten de Senaatskamer mocht komen. Open dossier 3: Het Embargo.",
    hint: "Pak de conceptpersverklaring.",
  },
  {
    id: "q7",
    kind: "choice",
    level: 3,
    levelName: "Het Embargo",
    kicker: "Opdracht 7 · De officiële persverklaring",
    story: [
      "Het bestuur had een communicatiestrategie. De stadionplannen mochten pas na goedkeuring naar buiten.",
      "In de conceptpersverklaring staat wat ADO Den Haag officieel wilde communiceren. Financiële en technische details waren daar bewust uit weggelaten.",
    ],
    prompt: "Wat mocht volgens de afspraken openbaar worden gemaakt?",
    choices: [
      { id: "algemeen", label: "Alleen de algemene toekomstplannen." },
      { id: "financieel", label: "De financiële ramingen." },
      { id: "technisch", label: "De technische details van het stadiondossier." },
    ],
    correctId: "algemeen",
    wrong: "Vergelijk de persverklaring met wat in het vertrouwelijke dossier bleef staan.",
    reveal: "Alleen de algemene toekomstplannen mochten openbaar worden gemaakt.",
    hint: "Pak de supportersreacties.",
  },
  {
    id: "q8",
    kind: "choice",
    level: 3,
    levelName: "Het Embargo",
    kicker: "Opdracht 8 · Het embargo",
    story: [
      "Een embargo betekent dat informatie niet vóór een afgesproken tijdstip openbaar gemaakt mag worden.",
      "Uit oude supportersreacties blijkt dat bepaalde informatie al rondging voordat de officiële communicatie had plaatsgevonden.",
    ],
    prompt: "Welke regel is overtreden?",
    choices: [
      { id: "te-vroeg", label: "De informatie is vóór de officiële vrijgave naar buiten gebracht." },
      { id: "geen", label: "Er was geen embargo." },
      { id: "op-tijd", label: "De informatie verscheen pas na de officiële vrijgave." },
    ],
    correctId: "te-vroeg",
    wrong: "Kijk of de supporters de informatie al kenden vóór het afgesproken moment.",
    reveal: "Het embargo is geschonden. De informatie was al buiten voordat zij vrijgegeven mocht worden.",
    hint: "Pak het Haags Dagblad.",
  },
  {
    id: "q9",
    kind: "choice",
    level: 3,
    levelName: "Het Embargo",
    kicker: "Opdracht 9 · Wat werd er gelekt?",
    story: [
      "De volgende ochtend stond er een nieuwsartikel met specifieke informatie over de stadionontwikkeling.",
      "Die details stonden niet in de goedgekeurde persverklaring. Ze kwamen uit een uitgebreidere, vertrouwelijke versie van het stadiondossier.",
    ],
    prompt: "Waar kwam de gelekte informatie vandaan?",
    choices: [
      { id: "dossier", label: "Uit het vertrouwelijke stadiondossier." },
      { id: "pers", label: "Uit de goedgekeurde persverklaring." },
      { id: "fans", label: "Uit een supportersbericht." },
    ],
    correctId: "dossier",
    wrong: "Het nieuws bevatte details die niet in de goedgekeurde verklaring stonden.",
    reveal:
      "Het is bevestigd. De vertrouwelijke stadioninformatie is vóór het afgesproken moment in de media verschenen. Iemand heeft bewust de communicatieafspraken geschonden. Open dossier 4: Het Lek.",
    hint: "Pak de telefoonmeldingen.",
  },
  {
    id: "q10",
    kind: "choice",
    level: 4,
    levelName: "Het Lek",
    kicker: "Opdracht 10 · Het verzonden bericht",
    story: [
      "Er is een digitale registratie van een bericht van die avond. De bijlage bevatte vertrouwelijke stadioninformatie.",
      "De eerste verdenking viel op Sophie, omdat zij het contact met de media deed. Het bericht kwam echter niet van één persoonlijk account.",
    ],
    prompt: "Via welk account is de vertrouwelijke informatie verzonden?",
    choices: [
      {
        id: "gedeeld",
        label: "Een gedeeld communicatieaccount, dat door meerdere betrokkenen gebruikt kon worden.",
      },
      { id: "sophie", label: "Een account dat alleen Sophie van Rijn kon gebruiken." },
      { id: "marcel", label: "Een account dat alleen Marcel de Vries kon gebruiken." },
    ],
    correctId: "gedeeld",
    wrong: "De naam van het account wijst niet naar één persoon.",
    reveal: "De informatie is verstuurd via een gedeeld communicatieaccount.",
    hint: "Pak de cameralogboeken.",
  },
  {
    id: "q11",
    kind: "choice",
    level: 4,
    levelName: "Het Lek",
    kicker: "Opdracht 11 · De toegangsregistratie",
    story: [
      "De beveiligingsgegevens laten zien wie op bepaalde momenten toegang had tot ruimtes en systemen.",
      "Alleen de naam van het verzendaccount is niet genoeg. Meerdere betrokkenen konden dat account gebruiken.",
    ],
    prompt: "Waarom wijst het account nog niet naar één afzender?",
    choices: [
      { id: "meerdere", label: "Omdat meerdere betrokkenen dat account konden gebruiken." },
      { id: "niet", label: "Omdat het bericht nooit is verzonden." },
      { id: "pers", label: "Omdat de journalist het account zelf heeft aangemaakt." },
    ],
    correctId: "meerdere",
    wrong: "Het account was gedeeld. Daarom moet de groep verdachten kleiner worden gemaakt.",
    reveal: "De groep mogelijke verdachten moet kleiner worden gemaakt. Het account alleen is geen bewijs.",
    hint: "Pak de laatste uitspraken.",
  },
  {
    id: "q12",
    kind: "choice",
    level: 4,
    levelName: "Het Lek",
    kicker: "Opdracht 12 · Het digitale spoor",
    story: [
      "De technische registratie van het verzonden document noemt ook het werkstation.",
      "Dat werkstation was gekoppeld aan één persoon, ook al ging het bericht via het gedeelde account.",
    ],
    prompt: "Aan wie was het werkstation gekoppeld?",
    choices: PEOPLE.map((person) => ({ id: person.name, label: person.name })),
    correctId: "Tom Albers",
    wrong: "Het gedeelde account verbergt de werkplek niet. Kijk naar wie bij dat werkstation hoort.",
    reveal: "Het bericht is verstuurd vanaf het werkstation van Tom Albers.",
    hint: "Pak het beveiligd einddossier.",
  },
  {
    id: "q13",
    kind: "choice",
    level: 4,
    levelName: "Het Lek",
    kicker: "Opdracht 13 · De tegenstrijdige verklaring",
    story: [
      "Tom verklaarde dat hij zich met de technische voorbereiding bezighield en niet verantwoordelijk was voor de communicatie naar de pers.",
      "Dat klopte op zichzelf. De digitale registratie laat echter iets anders zien.",
    ],
    prompt: "Wat spreekt Toms verklaring tegen?",
    choices: [
      {
        id: "werkstation",
        label: "Vanaf zijn werkstation is vertrouwelijke informatie verstuurd.",
      },
      {
        id: "gelijk",
        label: "Niets. Zijn verklaring en de registratie zeggen hetzelfde.",
      },
      {
        id: "sophie",
        label: "Het werkstation hoorde bij Sophie van Rijn.",
      },
    ],
    correctId: "werkstation",
    wrong: "Zijn woorden gaan over communicatie. De registratie gaat over zijn werkstation.",
    reveal:
      "De digitale sporen wijzen naar Tom Albers. Zijn werkstation is gekoppeld aan het verzonden document. Waarom hij de informatie naar buiten bracht, is nog open. Open dossier 5: De Waarheid.",
    hint: "Pak het tijdlijnoverzicht.",
  },
  {
    id: "q14",
    kind: "choice",
    level: 5,
    levelName: "De Waarheid",
    kicker: "Opdracht 14 · Het verborgen motief",
    story: [
      "In interne notities spreekt Tom zijn onvrede uit. Belangrijke technische onderdelen kregen volgens hem te weinig aandacht.",
      "Hij was het niet eens met hoeveel het bestuur wilde delen. Hij besloot zelf in te grijpen, via het gedeelde account, zodat het bericht niet direct naar hem leek te wijzen.",
      "Zijn bedoeling was niet om de club schade toe te brengen. Toen het in de media stond, verloor hij de controle.",
    ],
    prompt: "Waarom heeft Tom de vertrouwelijke informatie gedeeld?",
    choices: [
      {
        id: "druk",
        label: "Hij wilde druk uitoefenen op de besluitvorming over de stadionplannen.",
      },
      {
        id: "schade",
        label: "Hij wilde de club bewust schade toebrengen.",
      },
      {
        id: "ongeluk",
        label: "Het bericht vertrok per ongeluk.",
      },
    ],
    correctId: "druk",
    wrong: "Het was een bewuste keuze, en niet bedoeld om de club te beschadigen.",
    reveal: "Tom wilde druk uitoefenen op de besluitvorming, omdat technische keuzes buiten de discussie dreigden te vallen.",
    hint: "Leg daarna de gebeurtenissen op volgorde.",
  },
  {
    id: "q15",
    kind: "order",
    level: 5,
    levelName: "De Waarheid",
    kicker: "Opdracht 15 · De reconstructie",
    story: [
      "Alle vijf de dossiers zijn open. De vergaderdocumenten, de beschadigde notulen, de communicatieafspraken, de verklaringen en de digitale bewijzen liggen op tafel.",
      "Zet de gebeurtenissen in de volgorde waarin het lek is ontstaan.",
    ],
    prompt: "Tik de gebeurtenissen in de juiste volgorde.",
    items: [orderItems[3], orderItems[0], orderItems[5], orderItems[1], orderItems[4], orderItems[2]],
    correctOrder: ["besproken", "afspraken", "toegang", "verstuurd", "media", "werkstation"],
    wrong: "Begin bij de vergadering zelf, niet bij het moment waarop het nieuws al buiten stond.",
    reveal: "De reconstructie klopt. Het eindrapport kan worden opgesteld.",
    hint: "Pak het eindrapport en vul het onderzoeksblad in.",
  },
  {
    id: "onderzoeksblad",
    kind: "sheet",
    level: 5,
    levelName: "De Waarheid",
  },
  {
    id: "dader",
    kind: "dader",
    level: 5,
    levelName: "De Waarheid",
  },
  {
    id: "finale",
    kind: "finale",
    level: 5,
    levelName: "De Waarheid",
  },
];

export function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("nl")
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

export function isDader(value: string) {
  const answer = normalizeAnswer(value);
  return answer === "tom albers" || answer === "t albers";
}
