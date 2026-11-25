import { ChapterDefinition, KizFormData, StaffMember } from '../types/anamnese';

export const CHAPTERS: ChapterDefinition[] = [
  {
    id: 0,
    slug: 'stammdaten',
    title: 'Stammdaten & Falldaten',
    shortTitle: 'Stammdaten',
    badge: '0',
    subtitle: 'Chiffre, Datum, Kostenträger, Geschlecht und Rahmenbedingungen des Gesprächs',
  },
  {
    id: 1,
    slug: 'rechtlicher-status',
    title: '1. Rechtlicher Status',
    shortTitle: '1. Rechtl. Status',
    badge: '1',
    subtitle: 'Sorgerecht und Gesundheitsfürsorge / Vertretungsberechtigte',
  },
  {
    id: 2,
    slug: 'vorangegangene-hilfen',
    title: '2. Vorangegangene Hilfen',
    shortTitle: '2. Vorangeg. Hilfen',
    badge: '2',
    subtitle: 'Hilfen zur Erziehung (SGB VIII), Rehabilitation (SGB IX) & Therapiemaßnahmen',
    sections: [
      {
        id: '2.1',
        title: '2.1 Hilfen zur Erziehung & Eingliederungshilfen (§§ 27 ff. SGB VIII)',
        items: [
          { code: '2.1.1', label: '§28 Erziehungsberatung', hasDauer: true, hasBeschreibung: true },
          { code: '2.1.2', label: '§29 Soziale Gruppenarbeit', hasDauer: true, hasBeschreibung: true },
          { code: '2.1.3', label: '§30 Erziehungsbeistand, Betreuungshelfer', hasDauer: true, hasBeschreibung: true },
          { code: '2.1.4', label: '§31 Sozialpädagogische Familienhilfe (SPFH)', hasDauer: true, hasBeschreibung: true },
          { code: '2.1.5', label: '§32 Erziehung in einer Tagesgruppe', hasDauer: true, hasBeschreibung: true },
          { code: '2.1.6', label: '§33 Vollzeitpflege', hasDauer: true, hasBeschreibung: true },
          { code: '2.1.7', label: '§34 Heimerziehung, sonstige betreute Wohnform', hasDauer: true, hasBeschreibung: true },
          { code: '2.1.8', label: '§35 Intensive sozialpädagogische Einzelbetreuung', hasDauer: true, hasBeschreibung: true },
          { code: '2.1.9', label: '§35a Eingliederungshilfe für seelisch behinderte Kinder und Jugendliche', hasDauer: true, hasBeschreibung: true },
        ],
      },
      {
        id: '2.2',
        title: '2.2 Rehabilitation und Teilhabe von Menschen mit Behinderungen (SGB IX)',
        items: [
          { code: '2.2.1', label: 'Leistungen zur Sozialen Teilhabe (§§ 76 ff. SGB IX)', hasDauer: true, hasBeschreibung: true },
          { code: '2.2.2', label: 'Leistungen zur Teilhabe an Bildung (§ 75 SGB IX / Schulbegleitung)', hasDauer: true, hasBeschreibung: true },
          { code: '2.2.3', label: 'Medizinische Rehabilitation / Frühförderung (§ 46 / §§ 79 ff. SGB IX)', hasDauer: true, hasBeschreibung: true },
        ],
      },
      {
        id: '2.3',
        title: '2.3 Therapeutisch-Pädagogische Eingliederungshilfe & Fachleistungen',
        items: [
          { code: '2.3.1', label: 'Therapeutisch-Pädagogische Eingliederungshilfe (ambulant, z. B. Autismus-Zentrum / Lerntherapie)', hasDauer: true, hasBeschreibung: true },
          { code: '2.3.2', label: 'Kinder- und Jugendpsychiatrischer Aufenthalt (KJP) – akut', hasDauer: true, hasBeschreibung: true },
          { code: '2.3.3', label: 'Kinder- und Jugendpsychiatrischer Aufenthalt (KJP) – ambulant', hasDauer: true, hasBeschreibung: true },
          { code: '2.3.4', label: 'Kinder- und Jugendpsychiatrischer Aufenthalt (KJP) – stationär', hasDauer: true, hasBeschreibung: true },
          { code: '2.3.5', label: 'Kinder- und Jugendpsychiatrischer Aufenthalt (KJP) – geschlossen', hasDauer: true, hasBeschreibung: true },
          { code: '2.3.6', label: 'Ambulante Psychotherapie (VT / TP / Systemisch) / Soziotherapie', hasDauer: true, hasBeschreibung: true },
        ],
      },
    ],
  },
  {
    id: 3,
    slug: 'schulsituation',
    title: '3. Schulsituation & Verlauf',
    shortTitle: '3. Schulsituation & Verlauf',
    badge: '3',
    subtitle: 'Aktuelle Präsenz, Funktion des Wegbleibens und schulischer Verlauf',
    sections: [
      {
        id: '3.1',
        title: '3.1 Aktuelle Schulsituation (Schweregrad & Präsenz)',
        description: 'Bezugszeitraum: letzte 4 Wochen. Bitte genau eine zutreffende Einschätzung auswählen. „Kein regulärer Schulbesuch“ bezeichnet ein anderes oder ruhendes Beschulungssetting, nicht automatisch höhere Fehlzeiten.',
        selectionType: 'single',
        items: [
          { code: '3.1.1', label: 'Regulärer Schulbesuch', description: 'Kaum oder keine relevanten Fehlzeiten, Teilnahme weitgehend gegeben', selectionType: 'single' },
          { code: '3.1.2', label: 'Leichte Beeinträchtigung / unregelmäßiger Besuch', description: 'Einzelne versäumte Stunden oder Tage, insgesamt noch tragfähig', selectionType: 'single' },
          { code: '3.1.3', label: 'Ausgeprägte Fehlzeiten / deutliche Beeinträchtigung', description: 'Wiederholte Ausfälle, zusammenhängende Phasen oder spürbare Einschränkung der Teilhabe', selectionType: 'single' },
          { code: '3.1.4', label: 'Massiver / weitgehender Schulabsentismus', description: 'Überwiegendes bis vollständiges Fernbleiben vom vorgesehenen Unterricht', selectionType: 'single' },
          { code: '3.1.5', label: 'Aktuell kein regulärer Schulbesuch / Sonder- oder Ersatzsetting', description: 'Schulabbruch oder Ruhen der Beschulung, Klinik-/Einrichtungsbeschulung oder stark reduziertes Setting', selectionType: 'single' },
        ],
      },
      {
        id: '3.2',
        title: '3.2 Art & Funktion des Wegbleibens',
        items: [
          { code: '3.2.1', label: 'Schulschwänzen / eigeninitiatives Fernbleiben', description: 'Eher Unlust, Langeweile, Vermeidung von Konsequenzen oder Peer-/Freizeitbezug ohne primäre Angstdominanz', hasBeschreibung: true, placeholder: 'Beobachtungen, Beispiele oder Kontext...' },
          { code: '3.2.2', label: 'Angst-, stress- oder überforderungsbedingte Schulverweigerung', description: 'Leistungs-/Prüfungsangst, Trennungsangst, soziale Überforderung/Mobbing oder somatische Beschwerden', hasBeschreibung: true, placeholder: 'Beobachtungen, Auslöser oder Kontext...' },
          { code: '3.2.3', label: 'Zurückhalten durch Eltern / häusliches System', description: 'Nicht-Schicken, Zulassen, Überforderung/eigene Belastung oder häusliche Gründe', hasBeschreibung: true, placeholder: 'Beobachtungen oder häusliche Gründe...' },
          { code: '3.2.4', label: 'Ausstieg / Rückzug trotz Anwesenheit', description: 'Sanitätsraum, Sekretariat, Verlassen des Raums oder starke innere/äußere Verweigerung im Schulsetting', hasBeschreibung: true, placeholder: 'Beobachtungen oder Beispiele...' },
        ],
      },
      {
        id: '3.3',
        title: '3.3 Schullaufbahn & Verlauf',
        items: [
          { code: '3.3.1', label: 'Bisheriger Verlauf / Brüche in der Schullaufbahn', description: 'Schulwechsel, Klassenwiederholung, Schulformwechsel, Rückstellungen oder bisherige Auffälligkeiten', hasBeschreibung: true, placeholder: 'Schulwechsel, Wiederholungen, Rückstellungen...' },
          { code: '3.3.2', label: 'Zeitlicher Verlauf / Eskalationsdynamik des Absentismus', description: 'Beginn (seit wann), schleichend vs. akut nach Ereignis/Krise, bekannte Auslöser', hasBeschreibung: true, placeholder: 'Beginn, Verlauf, Auslöser oder Krisen...' },
          { code: '3.3.3', label: 'Schulische Perspektive / Schulabschluss', description: 'Einschätzung zur Erreichbarkeit von Schulabschluss und Anschluss (realistisch / gefährdet / kaum erreichbar)', hasBeschreibung: true, placeholder: 'Einschätzung: realistisch, gefährdet oder kaum erreichbar; Begründung...' },
        ],
      },
    ],
  },
  {
    id: 4,
    slug: 'psychosozial',
    title: '4. Psychosoziale Umstände & Umfeld',
    shortTitle: '4. Psychosozial',
    badge: '4',
    subtitle: 'Familiäre Belastungen, Erziehungsbedingungen und Lebensereignisse',
    sections: [
      {
        id: '4.1',
        title: '4.1 Abnorme intrafamiliäre Beziehungen',
        items: [
          { code: '4.1.1', label: 'Mangel an Wärme in der Eltern-Kind-Beziehung', hasBeschreibung: true },
          { code: '4.1.2', label: 'Disharmonie in der Familie zwischen Erwachsenen', hasBeschreibung: true },
          { code: '4.1.3', label: 'Feindliche Ablehnung oder Sündenbockzuweisung gegenüber dem Kind', hasBeschreibung: true },
          { code: '4.1.4', label: 'Körperliche Kindesmisshandlung', hasBeschreibung: true },
          { code: '4.1.5', label: 'Sexueller Missbrauch (innerhalb der Familie)', hasBeschreibung: true },
          { code: '4.1.6', label: 'Andere abnorme intrafamiliäre Beziehungen', hasBeschreibung: true },
        ],
      },
      {
        id: '4.2',
        title: '4.2 Psychische Störung, abweichendes Verhalten oder Behinderung in der Familie',
        items: [
          { code: '4.2.1', label: 'Psychische Störung / abweichendes Verhalten eines Elternteils', hasBeschreibung: true },
          { code: '4.2.2', label: 'Behinderung eines Elternteils', hasBeschreibung: true },
          { code: '4.2.3', label: 'Behinderung der Geschwister', hasBeschreibung: true },
          { code: '4.2.4', label: 'Andere Störungen/Behinderungen in der Familie', hasBeschreibung: true },
        ],
      },
      {
        id: '4.3',
        title: '4.3 Inadäquate oder verzerrte intrafamiliäre Kommunikation',
        items: [
          { code: '4.3.1', label: 'Inadäquate oder verzerrte intrafamiliäre Kommunikation', hasBeschreibung: true },
        ],
      },
      {
        id: '4.4',
        title: '4.4 Abnorme Erziehungsbedingungen',
        items: [
          { code: '4.4.1', label: 'Elterliche Überfürsorge', hasBeschreibung: true },
          { code: '4.4.2', label: 'Unzureichende elterliche Aufsicht und Steuerung', hasBeschreibung: true },
          { code: '4.4.3', label: 'Erziehung, die eine unzureichende Erfahrung vermittelt', hasBeschreibung: true },
          { code: '4.4.4', label: 'Unangemessene Anforderungen und Nötigungen durch die Eltern', hasBeschreibung: true },
          { code: '4.4.5', label: 'Andere abnorme Erziehungsbedingungen', hasBeschreibung: true },
        ],
      },
      {
        id: '4.5',
        title: '4.5 Abnorme unmittelbare Umgebung',
        items: [
          { code: '4.5.1', label: 'Erziehung in einer Institution', hasBeschreibung: true },
          { code: '4.5.2', label: 'Abweichende Elternsituation', hasBeschreibung: true },
          { code: '4.5.3', label: 'Isolierte Familie', hasBeschreibung: true },
          { code: '4.5.4', label: 'Lebensbedingungen mit möglicher psychosozialer Gefährdung', hasBeschreibung: true },
          { code: '4.5.5', label: 'Andere Faktoren der unmittelbaren Umgebung', hasBeschreibung: true },
        ],
      },
      {
        id: '4.6',
        title: '4.6 Akute, belastende Lebensereignisse',
        items: [
          { code: '4.6.1', label: 'Verlust einer liebevollen Beziehung', hasBeschreibung: true },
          { code: '4.6.2', label: 'Bedrohliche Umstände infolge von Fremdunterbringung', hasBeschreibung: true },
          { code: '4.6.3', label: 'Negativ veränderte familiäre Beziehungen durch neue Familienmitglieder', hasBeschreibung: true },
          { code: '4.6.4', label: 'Ereignisse, die zur Herabsetzung der Selbstachtung führen', hasBeschreibung: true },
          { code: '4.6.5', label: 'Sexueller Missbrauch (außerhalb der Familie)', hasBeschreibung: true },
          { code: '4.6.6', label: 'Unmittelbare, beängstigende Erlebnisse', hasBeschreibung: true },
          { code: '4.6.7', label: 'Andere akute, belastende Lebensereignisse', hasBeschreibung: true },
        ],
      },
      {
        id: '4.7',
        title: '4.7 Gesellschaftliche Belastungsfaktoren',
        items: [
          { code: '4.7.1', label: 'Verfolgung oder Diskriminierung', hasBeschreibung: true },
          { code: '4.7.2', label: 'Migration oder soziale Verpflanzung', hasBeschreibung: true },
          { code: '4.7.3', label: 'Andere gesellschaftliche Belastungsfaktoren', hasBeschreibung: true },
        ],
      },
      {
        id: '4.8',
        title: '4.8 Chronische zwischenmenschliche Belastung im Zusammenhang mit Schule und Arbeit',
        items: [
          { code: '4.8.1', label: 'Streitbeziehungen mit Schülern / Mitarbeitern', hasBeschreibung: true },
          { code: '4.8.2', label: 'Sündenbockzuweisung durch Lehrer / Ausbilder', hasBeschreibung: true },
          { code: '4.8.3', label: 'Allgemeine Unruhe in der Schule bzw. Arbeitssituation', hasBeschreibung: true },
          { code: '4.8.4', label: 'Andere chronische zwischenmenschliche Belastungen (Schule/Arbeit)', hasBeschreibung: true },
        ],
      },
      {
        id: '4.9',
        title: '4.9 Belastende Lebensereignisse / Situationen infolge von Verhaltensstörungen / Behinderungen des Kindes',
        items: [
          { code: '4.9.1', label: 'Institutionelle Erziehung', hasBeschreibung: true },
          { code: '4.9.2', label: 'Bedrohliche Umstände infolge von Fremdunterbringung', hasBeschreibung: true },
          { code: '4.9.3', label: 'Abhängige Ereignisse, die zur Herabsetzung der Selbstachtung führen', hasBeschreibung: true },
          { code: '4.9.4', label: 'Andere belastende Ereignisse infolge von Störungen/Behinderungen des Kindes', hasBeschreibung: true },
        ],
      },
    ],
  },
  {
    id: 5,
    slug: 'entwicklungsstand',
    title: '5. Entwicklungsstand & Neurodivergenz',
    shortTitle: '5. Entwicklung & IQ',
    badge: '5',
    subtitle: '5.1 Tiefgreifende & Umschriebene Entwicklungsstörungen | 5.2 Intelligenzniveau (IQ)',
    sections: [
      {
        id: '5.1',
        title: '5.1 Tiefgreifende & Umschriebene Entwicklungsstörungen',
        items: [
          { 
            code: '5.1.1', 
            label: 'Umschriebene Entwicklungsrückstände (F80 Sprechen/Sprache, Mutismus, non-verbal, Gebärdensprache)', 
            dropdownOptions: [
              'Mutismus',
              'Gebärden',
              'Artikulationsstörung',
              'expressive/rezeptive Sprachstörung',
              'Auditive Verarbeitungs- und Wahrnehmungsstörung'
            ]
          },
          { code: '5.1.2', label: 'Autismus / (Tiefgreifende) Entwicklungsstörungen' },
          { code: '5.1.3', label: 'Rett-Syndrom' },
          { code: '5.1.4', label: 'Überaktive Störung mit Intelligenzminderung und Bewegungsstereotypien' },
          { code: '5.1.5', label: 'Einschränkung motorischer Funktionen nach ICF (Körperfunktionen, Aktivität, Teilhabe)' },
        ],
      },
    ],
  },
  {
    id: 6,
    slug: 'symptomatik',
    title: '6. Klinisch-Psychiatrische Symptomatik',
    shortTitle: '6. Symptomatik',
    badge: '6',
    subtitle: 'Psychiatrische Diagnosen, Substanzkonsum (F10–F19), Sozialverhalten (F91) & weiteres Verhalten',
    sections: [
      {
        id: '6.1',
        title: '6.1 Psychiatrische Diagnosen',
        items: [
          { 
            code: '6.1.1', 
            label: 'Schizophrenie, schizotype oder wahnhafte Störungen', 
            dropdownOptions: [
              'Schizophrenie',
              'anhaltende wahnhafte Störungen',
              'psychotische Störungen'
            ]
          },
          { 
            code: '6.1.2', 
            label: 'Affektive Störungen (z. B. Depressionen, Manien)', 
            dropdownOptions: [
              'manische Episode',
              'bipolare affektive Störung',
              'depressive Episode'
            ]
          },
          { 
            code: '6.1.3', 
            label: 'Angst-, Belastungs- oder somatoforme Störungen', 
            dropdownOptions: [
              'soziale Phobie',
              'spezifische Ängste',
              'Panikstörung',
              'Zwangsstörung',
              'Posttraumatische Belastungsstörung',
              'dissoziative Störungen',
              'somatoforme Störungen'
            ]
          },
          { 
            code: '6.1.4', 
            label: 'Ess- oder Schlafstörungen', 
            dropdownOptions: [
              'Anorexia nervosa',
              'Bulimia nervosa',
              'Schlafstörungen'
            ]
          },
          { 
            code: '6.1.5', 
            label: 'Persönlichkeitsstörungen', 
            dropdownOptions: [
              'emotional instabile Persönlichkeitsstörung (Impulsiver-Typ)',
              'emotional instabile Persönlichkeitsstörung (Borderline-Typ)',
              'histrionische Persönlichkeitsstörung',
              'andere Persönlichkeitsstörungen'
            ]
          },
          {
            code: '6.1.6',
            label: 'Bindungsstörung',
            dropdownOptions: [
              'Reaktive Bindungsstörung des Kindesalters',
              'Bindungsstörung des Kindesalters mit Enthemmung'
            ],
            dropdownSelectionMode: 'single'
          },
          {
            code: '6.1.7',
            label: 'Enuresis',
            dropdownOptions: [
              'Einnässen tagsüber',
              'Einnässen nachts'
            ]
          },
          { code: '6.1.8', label: 'Enkopresis' },
        ],
      },
      {
        id: '6.2',
        title: '6.2 Spezifizierung: Substanzkonsum & Psychotrope Substanzen (F10–F19)',
        items: [
          { code: '6.2.1', label: 'Akute Intoxikation(en) in der Vorgeschichte bekannt', hasBeschreibung: true },
          { code: '6.2.2', label: 'Missbräuchlicher Konsum psychotroper Substanzen', hasBeschreibung: true },
          { code: '6.2.3', label: 'Schädlicher Gebrauch (körperliche oder psychische Folgeschäden)', hasBeschreibung: true },
          { code: '6.2.4', label: 'Abhängigkeitssyndrom (Toleranzentwicklung, Kontrollverlust, Craving, Entzugssymptome)', hasBeschreibung: true },
          { code: '6.2.5', label: 'Psychische / Verhaltensstörung durch psychotrope Substanzen (z. B. substanzinduzierte Psychose, Delir, amnestisches Syndrom)', hasBeschreibung: true },
        ],
      },
      {
        id: '6.3',
        title: '6.3 Spezifizierung: Störung des Sozialverhaltens (F91)',
        items: [
          { code: '6.3.1', label: 'Ungewöhnlich häufige und schwere Wutausbrüche', hasBeschreibung: true },
          { code: '6.3.2', label: 'Aktive Verweigerung von Forderungen Erwachsener und Hinwegsetzen über Regeln', hasBeschreibung: true },
          { code: '6.3.3', label: 'Häufiges Beginnen von körperlichen Auseinandersetzungen (außer Geschwisterauseinandersetzungen)', hasBeschreibung: true },
          { code: '6.3.4', label: 'Gebrauch von möglicherweise gefährlichen Waffen (z. B. Schlagholz, Ziegelstein, zerbrochene Flasche, Messer, Schusswaffen)', hasBeschreibung: true },
          { code: '6.3.5', label: 'Körperliche Grausamkeit gegenüber anderen Menschen (z. B. Fesseln, ein Opfer mit einem Messer oder Feuer verletzen)', hasBeschreibung: true },
          { code: '6.3.6', label: 'Tierquälerei', hasBeschreibung: true },
          { code: '6.3.7', label: 'Absichtliche Zerstörung des Eigentums anderer (außer Brandstiftung)', hasBeschreibung: true },
          { code: '6.3.8', label: 'Absichtliches Feuerlegen mit dem Risiko oder dem Ziel, ernsthaften Schaden anzurichten', hasBeschreibung: true },
          { code: '6.3.9', label: 'Stehlen von Wertgegenständen ohne Konfrontation mit dem Opfer, entweder Zuhause oder außerhalb (z. B. Ladendiebstahl, Einbruch, Unterschriftenfälschung)', hasBeschreibung: true },
          { code: '6.3.10', label: 'Eine kriminelle Handlung, bei der das Opfer direkt angegriffen wird (einschließlich Handtaschenraub, Erpressung, Straßenraub)', hasBeschreibung: true },
          { code: '6.3.11', label: 'Weglaufen von den Eltern oder elterlichen Ersatzpersonen, mindestens zweimal oder einmal länger als eine Nacht (außer zur Vermeidung von Missbrauch)', hasBeschreibung: true },
          { code: '6.3.12', label: 'Zwingen einer anderen Person zu sexuellen Aktivitäten', hasBeschreibung: true },
          { code: '6.3.13', label: 'Häufiges Tyrannisieren anderer (z. B. absichtliches Zufügen von Schmerzen/Verletzungen, andauernde Einschüchterung, Quälen, Belästigung)', hasBeschreibung: true },
          { code: '6.3.14', label: 'Einbruch in Häuser, Gebäude oder Autos', hasBeschreibung: true },
        ],
      },
      {
        id: '6.4',
        title: '6.4 Weiteres spezifisches Verhalten',
        items: [
          { code: '6.4.1', label: 'Herausforderndes Verhalten', hasBeschreibung: true },
          { code: '6.4.2', label: 'Stereotypien', hasBeschreibung: true },
          { code: '6.4.3', label: 'Autoaggressives Verhalten', hasBeschreibung: true },
          { code: '6.4.4', label: 'Fremdaggressives Verhalten', hasBeschreibung: true },
          { code: '6.4.5', label: 'Weglauftendenz', hasBeschreibung: true },
          { code: '6.4.6', label: 'Weitere besondere Verhaltensweisen', hasBeschreibung: true },
        ],
      },
    ],
  },
  {
    id: 7,
    slug: 'somatisch',
    title: '7. Somatische, Neurologische & Organische Ursachen',
    shortTitle: '7. Somatisch & Org.',
    badge: '7',
    subtitle: 'Körperliche, neurologische und endokrine Einflussfaktoren',
    sections: [
      {
        id: '7.1',
        title: '7.1 Neurologische Erkrankungen & Syndrome',
        items: [
          { code: '7.1.1', label: 'Epilepsie, Cerebralparese, Autoimmunenzephalitiden, Neurodegenerative Erkrankungen', hasBeschreibung: true },
        ],
      },
      {
        id: '7.2',
        title: '7.2 Endokrine & Metabolische Störungen',
        items: [
          { code: '7.2.1', label: 'Schilddrüsenerkrankungen (Hyperthyreose: imitiert Unruhe/Panik; Hypothyreose: imitiert Depression/Antriebslosigkeit)', hasBeschreibung: true },
          { code: '7.2.2', label: 'M. Cushing / Hyperkortisolismus (Hoher Cortisolspiegel → Depression/Manie/Labilität)', hasBeschreibung: true },
          { code: '7.2.3', label: 'Diabetes mellitus (Hypoglykämien → Verwirrtheit, Aggressivität, Delir-Zustände)', hasBeschreibung: true },
          { code: '7.2.4', label: 'Angeborene Stoffwechselerkrankungen', hasBeschreibung: true },
        ],
      },
      {
        id: '7.3',
        title: '7.3 Syndromale, Genetische & Infektiöse Erkrankungen',
        items: [
          { code: '7.3.1', label: 'Trisomie 21, Fetales Alkoholsyndrom (FAS), Prader-Willi-Syndrom (Hyperphagie, Adipositas, Wutanfälle)', hasBeschreibung: true },
          { code: '7.3.2', label: 'Infektiöse & Entzündliche Erkrankungen (z. B. HIV)', hasBeschreibung: true },
        ],
      },
    ],
  },
  {
    id: 8,
    slug: 'ergaenzungen',
    title: '8. Ergänzungen & Evaluation des Angebotes',
    shortTitle: '8. Ergänzungen',
    badge: '8',
    subtitle: 'Zusammenfassende Beobachtungen, Passgenauigkeit des Angebots und pädagogische Empfehlungen',
  },
  {
    id: 9,
    slug: 'auswertung-versand',
    title: 'Übersicht & Mitarbeiter-Versand',
    shortTitle: 'Versand & Export',
    badge: '✓',
    subtitle: 'Gesamtprotokoll einsehen, Auffälligkeiten filtern, E-Mail an Team senden oder PDF drucken',
  },
];

export const IQ_LEVELS = [
  { code: '5.2.1', label: 'Hochbegabt (IQ > 129)' },
  { code: '5.2.2', label: 'Überdurchschnittlich (IQ 115–129)' },
  { code: '5.2.3', label: 'Durchschnittlich (IQ 85–115)' },
  { code: '5.2.4', label: 'Unterdurchschnittlich (IQ 70–85)' },
  { code: '5.2.5', label: 'Leicht intelligenzgemindert (IQ 50–69)' },
  { code: '5.2.6', label: 'Mittel- bis schwer intelligenzgemindert (IQ 20–49)' },
];

export const SORGERECHT_OPTIONS = [
  { id: 'gemeinsam', label: 'Gemeinsam (Eltern)' },
  { id: 'alleinig_mutter', label: 'Alleinig Mutter' },
  { id: 'alleinig_vater', label: 'Alleinig Vater' },
  { id: 'vormundschaft', label: 'Vormundschaft / Pflegschaft (Jugendamt / Amtspflege)' },
  { id: 'einzelvormund', label: 'Einzelvormund' },
];

export const GESUNDHEITSFUERSORGE_OPTIONS = [
  { id: 'sorgeberechtigte', label: 'Bei Sorgeberechtigten' },
  { id: 'teilentzug', label: 'Teilentzug / Ergänzungspflegschaft' },
  { id: 'vormund', label: 'Vormund / Pfleger' },
  { id: 'anordnung', label: 'Gerichtliche einstweilige Anordnung vorhanden' },
];

export const KOSTENTRAEGER_OPTIONS = [
  'Jugendamt (§§ 27 ff. SGB VIII)',
  'Eingliederungshilfe (§ 35a SGB VIII)',
  'Rehabilitation & Teilhabe (SGB IX)',
  'Sozialhilfeträger (SGB XII)',
  'Gesetzliche Krankenversicherung (SGB V)',
  'Selbstzahler / Familie',
  'Sonstiger öffentlicher Kostenträger',
];

export const FACHKRAFT_ROLLEN_OPTIONS = [
  'Pädagogischer Fachdienst',
  'Gruppenleitung / Bezugsbetreuung',
  'Bereichsleitung / Einrichtungsleitung',
  'Psychologischer Fachdienst',
  'Heilpädagogischer Fachdienst',
  'Allgemeiner Sozialer Dienst (ASD)',
  'Schulbegleitung / Peter-Koch-Schule',
];

export const EINRICHTUNG_OPTIONS = [
  'Haus im Feld',
  'Haus im Feld – Gruppe Blau',
  'Haus im Feld – Gruppe Gelb',
  'Haus im Feld – Gruppe Grün',
  'Haus im Feld – Kurzzeitbetreuung',
  'Pilgerhaus Weinheim – KIZ Tagesgruppe',
  'Pilgerhaus Weinheim – Wohngruppe Stammhaus',
  'Pilgerhaus Weinheim – Wohngruppe Außenbereich',
  'Peter-Koch-Schule (SBBZ)',
  'Pilgerhaus Weinheim – Ambulante Hilfen',
  'Kooperierende Einrichtung / Extern',
];

export const DAUER_OPTIONS = [
  '< 6 Monate',
  '6–12 Monate',
  '1–2 Jahre',
  '2–3 Jahre',
  '> 3 Jahre',
  'Laufende Maßnahme',
];

export const IQ_TEST_VERFAHREN_OPTIONS = [
  'Kein Testverfahren dokumentiert',
  'WISC-V / HAWIK-IV (Standardisiertes Testverfahren)',
  'K-ABC II (Kaufman Assessment Battery for Children)',
  'SON-R (Nonverbaler Intelligenztest)',
  'Pädagogisch-fachliche Schätzung',
  'Fachärztliche Diagnostik veranlasst / ausstehend',
];

export const FOERDERSCHWERPUNKTE_OPTIONS = [
  'Reizreduktion & strukturierte Umgebung',
  'Soziale Kompetenzen & Gruppenfähigkeit',
  'Emotionale Selbstregulation & Deeskalationsstrategien',
  'Schulische Reintegration & Lernförderung',
  'Krisenintervention & Beziehungsaufbau',
  'Alltagsstrukturierung & lebenspraktische Förderung',
  'Traumapädagogische Stabilisierung',
  'Autismusspezifische Förderung & TEACCH',
];

export const ANGEBOTS_PASSGENAUIGKEIT_OPTIONS = [
  'Optimal geeignet (Vollumfängliche Passung zum Förderkonzept KIZ)',
  'Geeignet mit spezifischen Förderbausteinen (z. B. Kleingruppensetting)',
  'Bedingt geeignet (Ergänzende Schutzbedürfnisse & Rahmenbedingungen nötig)',
  'Aktuell nicht geeignet (Anderer Hilfebedarf, z. B. Akutklinik/intensiv-therapeutisch)',
];

export const ZIELVEREINBARUNG_OPTIONS = [
  'Stabilisierung des Schulbesuchs & Vermeidung von Schulabsentismus',
  'Abbau von Verweigerungs- und Rückzugshaltungen',
  'Aufbau von Frustrationstoleranz und Konfliktlösungsstrategien',
  'Stärkung der Eigen- und Fremdwahrnehmung',
  'Entlastung und Stabilisierung des Familiensystems',
  'Förderung der Teilhabe an der Gemeinschaft und Peergroup',
];

export const NAECHSTE_SCHRITTE_OPTIONS = [
  'Vorlage und Abstimmung mit dem Jugendamt (ASD)',
  'Einberufung einer Hilfeplankonferenz (§ 36 SGB VIII)',
  'Fachlicher Austausch und Kooperation mit Schule / SBBZ',
  'Abstimmung mit Fachärzten bzw. KJP-Therapeuten',
  'Vorbereitung der Aufnahme in das pädagogische Angebot',
];

export const VERANTWORTLICH_OPTIONS = [
  'Pilgerhaus Weinheim – KIZ Fachdienst',
  'Pilgerhaus Weinheim – Bezugsbetreuung',
  'Allgemeiner Sozialer Dienst (ASD)',
  'Gemeinsame Fallverantwortung (Pilgerhaus & ASD)',
];

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  { id: '1', name: 'Pädagogische Leitung', role: 'Pilgerhaus Weinheim (Bereichsleitung)', email: 'leitung@pilgerhaus-weinheim.de' },
  { id: '2', name: 'Bezugsperson / Gruppenleitung', role: 'Pilgerhaus Weinheim (Gruppe)', email: 'bezug@pilgerhaus-weinheim.de' },
  { id: '3', name: 'Psychologischer / Heilpädagogischer Fachdienst', role: 'Pilgerhaus Weinheim (Fachdienst)', email: 'fachdienst@pilgerhaus-weinheim.de' },
  { id: '4', name: 'Zuständige/r Jugendamts-Mitarbeiter/in', role: 'Allgemeiner Sozialer Dienst (ASD)', email: 'jugendamt@kreis-kommune.de' },
];

export const QUICK_TAGS = [
  'Akut',
  'Chronisch',
  'Verdacht',
  'Gesichert / Diagnostiziert',
  'Vergangenheit / Abgeklungen',
  'Hoher Betreuungsbedarf',
  'Stabilisiert',
];

export function generateRandomChiffre(existingCases?: KizFormData[]): string {
  // 8 characters: numbers and capital letters, excluding ambiguous chars 0, O, 1, I
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const existingSet = new Set(
    existingCases
      ?.map((c) => c.stammdaten?.chiffre?.trim().toUpperCase())
      .filter(Boolean) || []
  );

  let chiffre = '';
  let attempts = 0;
  do {
    chiffre = '';
    // Use cryptographically secure randomness if available (browser/Node), with fallback to Math.random
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const buffer = new Uint8Array(8);
      window.crypto.getRandomValues(buffer);
      for (let i = 0; i < 8; i++) {
        chiffre += chars.charAt(buffer[i] % chars.length);
      }
    } else {
      for (let i = 0; i < 8; i++) {
        chiffre += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    attempts++;
  } while (existingSet.has(chiffre) && attempts < 100);

  return chiffre;
}

export function createEmptyFormData(existingCases?: KizFormData[]): KizFormData {
  const today = new Date().toISOString().split('T')[0];
  const formattedChiffre = generateRandomChiffre(existingCases);
  return {
    id: 'case_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    lastChapterId: 0,
    stammdaten: {
      chiffre: formattedChiffre,
      datum: today,
      kostentraeger: KOSTENTRAEGER_OPTIONS[0],
      geschlecht: 'männlich',
      alterInJahren: '',
      fachkraft: FACHKRAFT_ROLLEN_OPTIONS[0],
      einrichtung: EINRICHTUNG_OPTIONS[0],
    },
    rechtlicherStatus: {
      sorgerecht: ['gemeinsam'],
      sorgerechtNotiz: '',
      gesundheitsfuersorge: ['sorgeberechtigte'],
      gesundheitsfuersorgeNotiz: '',
    },
    vorangegangeneHilfen: {},
    schulsituation: {},
    psychosozial: {},
    entwicklungsstand: {},
    iqSelectedCode: '',
    iqNotiz: '',
    symptomatik: {},
    somatisch: {},
    ergaenzungen: {
      freitext: '',
      paedagogischeEinschaetzung: '',
      angebotsEvaluation: '',
      zielvereinbarung: '',
      naechsteSchritte: '',
      verantwortlich: VERANTWORTLICH_OPTIONS[0],
    },
  };
}

export function createDemoFormData(): KizFormData {
  return {
    id: 'demo_case_001',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    lastChapterId: 3,
    stammdaten: {
      chiffre: 'K8M4X2A9',
      datum: new Date().toISOString().split('T')[0],
      kostentraeger: KOSTENTRAEGER_OPTIONS[1], // Eingliederungshilfe (§ 35a SGB VIII)
      geschlecht: 'männlich',
      alterInJahren: '11',
      geburtsdatum: '2015-05-14',
      fachkraft: FACHKRAFT_ROLLEN_OPTIONS[0],
      einrichtung: EINRICHTUNG_OPTIONS[0],
    },
    rechtlicherStatus: {
      sorgerecht: ['gemeinsam'],
      sorgerechtNotiz: '',
      gesundheitsfuersorge: ['sorgeberechtigte'],
      gesundheitsfuersorgeNotiz: '',
    },
    vorangegangeneHilfen: {
      '2.1.1': { selected: true, dauer: '6–12 Monate' },
      '2.1.4': { selected: true, dauer: '6–12 Monate' },
      '2.2.2': { selected: true, dauer: '1–2 Jahre' },
      '2.3.1': { selected: true, dauer: '< 6 Monate' },
    },
    schulsituation: {
      '3.1.3': { selected: true },
      '3.1.5': { selected: true },
    },
    psychosozial: {
      '4.1.2': { selected: true, tags: ['Chronisch'] },
      '4.4.2': { selected: true, tags: ['Akut'] },
      '4.6.1': { selected: true, tags: ['Gesichert / Diagnostiziert'] },
      '4.8.1': { selected: true, tags: ['Akut'] },
    },
    entwicklungsstand: {
      '5.1.1': {
        selected: true,
        selectedOptions: ['Mutismus', 'Artikulationsstörung'],
        beschreibung: 'Mutismus, Artikulationsstörung'
      },
      '5.1.2': { selected: true, tags: ['Gesichert / Diagnostiziert'] },
    },
    iqSelectedCode: '5.2.3',
    iqNotiz: 'WISC-V / HAWIK-IV (Standardisiertes Testverfahren)',
    symptomatik: {
      '6.1.2': {
        selected: true,
        selectedOptions: ['depressive Episode', 'bipolare affektive Störung'],
        beschreibung: 'depressive Episode, bipolare affektive Störung'
      },
      '6.1.3': {
        selected: true,
        selectedOptions: ['soziale Phobie', 'Panikstörung'],
        beschreibung: 'soziale Phobie, Panikstörung',
        tags: ['Akut']
      },
      '6.3.1': { selected: true },
      '6.4.1': { selected: true },
    },
    somatisch: {
      '7.1.1': { selected: false },
    },
    ergaenzungen: {
      freitext: '',
      paedagogischeEinschaetzung: 'Reizreduktion & strukturierte Umgebung, Autismusspezifische Förderung & TEACCH',
      angebotsEvaluation: 'Optimal geeignet (Vollumfängliche Passung zum Förderkonzept KIZ)',
      zielvereinbarung: 'Stabilisierung des Schulbesuchs & Vermeidung von Schulabsentismus, Aufbau von Frustrationstoleranz und Konfliktlösungsstrategien',
      naechsteSchritte: 'Vorlage und Abstimmung mit dem Jugendamt (ASD), Vorbereitung der Aufnahme in das pädagogische Angebot',
      verantwortlich: VERANTWORTLICH_OPTIONS[0],
    },
  };
}
