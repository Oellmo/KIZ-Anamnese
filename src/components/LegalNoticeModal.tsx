import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Building2, 
  Mail, 
  Phone, 
  Printer,
  MapPin, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Server
} from 'lucide-react';

export type LegalTab = 'datenschutz' | 'impressum' | 'toms';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'datenschutz',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-tight">
                Rechtliche Hinweise & Datenschutz
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Offizielle Angaben • Pilgerhaus Weinheim (www.pilgerhaus.de)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Responsive 3-Column Segmented Control - 100% visible on all screens) */}
        <div className="px-3 sm:px-6 pt-3 pb-1.5 bg-white border-b border-slate-100">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('impressum')}
              className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'impressum'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span className="truncate">
                <span className="sm:hidden">Impressum</span>
                <span className="hidden sm:inline">Impressum (§ 5 DDG)</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('datenschutz')}
              className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'datenschutz'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0 text-emerald-700" />
              <span className="truncate">
                <span className="sm:hidden">Datenschutz</span>
                <span className="hidden sm:inline">Datenschutzerklärung</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('toms')}
              className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'toms'
                  ? 'bg-white text-emerald-900 shadow-xs border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Server className="w-4 h-4 shrink-0 text-emerald-700" />
              <span className="truncate">
                <span className="sm:hidden">Sicherheit</span>
                <span className="hidden sm:inline">Sicherheitsmaßnahmen</span>
              </span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: IMPRESSUM (§ 5 DDG) */}
          {activeTab === 'impressum' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 leading-normal">
                  Diensteanbieter und Betreiber dieser internen Fachanwendung ist das <strong>Pilgerhaus Weinheim</strong> 
                  (gemäß § 5 Digitale-Dienste-Gesetz – DDG sowie § 18 Abs. 2 MStV).
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Diensteanbieter & Einrichtung
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-medium text-slate-800">
                  <div className="font-extrabold text-slate-900 text-base">
                    Pilgerhaus Weinheim
                  </div>
                  <div className="text-xs text-slate-600 font-normal">
                    Evangelische Jugend- und Behindertenhilfe, Peter-Koch-Schule (SBBZ)
                  </div>
                  <div className="pt-1 space-y-1.5 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Am Pilgerhaus 8, 69469 Weinheim, Deutschland</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Telefon: 06201 5005-0</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Telefax: 06201 5005-13</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>E-Mail: infomail@pilgerhaus.de</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Internet: <a href="https://www.pilgerhaus.de" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">www.pilgerhaus.de</a></span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Vertretungsberechtigte Organe
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li><strong>Vorstand:</strong> Uwe Gerbich-Demmer</li>
                  <li><strong>Vorsitzender des Verwaltungsrats:</strong> Prof. Holger Meyer</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Rechtsform & Gemeinnützigkeit
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Rechtsform:</strong> Verein mit Körperschaftsrechten nach altbadischem Recht</li>
                  <li><strong>Gemeinnützigkeit:</strong> Als gemeinnützig anerkannt gemäß §§ 51 ff. Abgabenordnung (AO)</li>
                  <li><strong>Verbandszugehörigkeit:</strong> Mitglied im Diakonischen Werk der Evangelischen Landeskirche in Baden e. V.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Zweckbestimmung & Fachlicher Hinweis
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Diese Web-Applikation wird als digitales Arbeitsmittel und Dokumentationsinstrument für Mitarbeiterinnen 
                  und Mitarbeiter des Pilgerhauses Weinheim (KIZ – Kleinkind- und Jugendhilfe / pädagogische Teams) betrieben. 
                  Die erhobenen Anamnesen, Profile und Auswertungen dienen der standardisierten heil- und sozialpädagogischen 
                  Fallstrukturierung und Förderplanung. Sie ersetzen keine eigenständige fachärztliche Diagnostik.
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: DATENSCHUTZERKLÄRUNG (DSGVO / DSG-EKD) */}
          {activeTab === 'datenschutz' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 leading-normal">
                  <strong>Datenschutzkonformität:</strong> Die Verarbeitung personenbezogener Daten durch das Pilgerhaus Weinheim 
                  erfolgt unter strenger Beachtung des <strong>Kirchengesetzes über den Datenschutz der Evangelischen Kirche in Deutschland (DSG-EKD)</strong>,
                  der <strong>Datenschutz-Grundverordnung (DSGVO)</strong> sowie des <strong>Bundesdatenschutzgesetzes (BDSG)</strong>.
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  1. Name und Kontaktdaten des Verantwortlichen
                </h3>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium text-slate-800 space-y-1 text-xs sm:text-sm">
                  <div className="font-bold text-slate-900">Pilgerhaus Weinheim</div>
                  <div>Evangelische Jugend- und Behindertenhilfe, Peter-Koch-Schule (SBBZ)</div>
                  <div>Am Pilgerhaus 8, 69469 Weinheim</div>
                  <div>Telefon: 06201 5005-0 • Fax: 06201 5005-13</div>
                  <div>E-Mail: <span className="font-mono text-emerald-700">infomail@pilgerhaus.de</span></div>
                  <div>Internet: <span className="font-mono text-emerald-700">www.pilgerhaus.de</span></div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  2. Grundsatz der Pseudonymisierung & Anonymisierungsgebot
                </h3>
                <p>
                  Gemäß dem Gebot der Datenvermeidung und Datenminimierung (Art. 5 Abs. 1 lit. c DSGVO, § 5 Abs. 1 lit. c DSG-EKD)
                  wurde die Anwendung nach dem Prinzip <em>„Privacy by Design“</em> konzipiert:
                </p>
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-950 text-xs space-y-1">
                  <p className="font-bold">Striktes Klarnamenverbot im Fachbetrieb:</p>
                  <p>
                    In den Fragebögen und Freitextfeldern dürfen zu keinem Zeitpunkt Klarnamen, Wohnorte oder Adressdaten 
                    von Kindern, Jugendlichen, Eltern oder Lehrkräften hinterlegt werden. Jeder Fall wird ausschließlich 
                    über eine zufällig generierte 8-stellige Chiffre (z. B. <span className="font-mono font-bold">AB12CD34</span>) geführt.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  3. Zwecke und Rechtsgrundlagen der Verarbeitung
                </h3>
                <p>
                  Die Erfassung dient der heil- und sozialpädagogischen Bedarfsermittlung, Fallanamnese und internen Qualitätssicherung 
                  gemäß SGB VIII (Kinder- und Jugendhilfe):
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong>§ 6 Nr. 4 & Nr. 8 DSG-EKD / Art. 6 Abs. 1 lit. f DSGVO:</strong> Wahrnehmung der satzungsgemäßen Aufgaben der diakonischen Einrichtung sowie berechtigtes Interesse an strukturierter pädagogischer Förderplanung.
                  </li>
                  <li>
                    <strong>§ 13 Abs. 2 Nr. 7 DSG-EKD / Art. 9 Abs. 2 lit. h DSGVO:</strong> Verarbeitung besonderer Kategorien von Daten (z. B. gesundheitliche und Entwicklungs-Befunde) ausschließlich zu Zwecken der Gesundheits- und Sozialversorgung durch zur beruflichen Verschwiegenheit verpflichtetes Fachpersonal (§ 203 StGB).
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  4. Hosting, Serverstandort & Auftragsverarbeitung
                </h3>
                <p>
                  Die Fallakten werden verschlüsselt in einer dedizierten Cloud Firestore-Datenbank 
                  innerhalb von <strong>europäischen Rechenzentren (Region EU, europe-west)</strong> verarbeitet:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Dienstleister:</strong> Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.</li>
                  <li><strong>Auftragsverarbeitungsvertrag (AVV):</strong> Die Datenverarbeitung erfolgt auf Grundlage eines DSGVO-konformen Auftragsverarbeitungsvertrags gem. Art. 28 DSGVO unter Einbindung der EU-Standardvertragsklauseln.</li>
                  <li><strong>Verschlüsselung:</strong> Datenübertragungen erfolgen ausnahmslos mit moderner TLS-1.3-Transportverschlüsselung (HTTPS). Ruhende Daten werden mit AES-256 (Encryption-at-Rest) verschlüsselt.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  5. Verzicht auf Werbe- und Tracking-Tools
                </h3>
                <p>
                  In dieser Fachanwendung werden <strong>keine Analyse-Tools, Werbecookies oder Trackingdienste</strong> eingesetzt. 
                  Es werden ausschließlich technisch zwingend notwendige Session-Tokens für die Administrator-Authentifizierung 
                  und den PWA-Service-Worker verwendet.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  6. Löschung von Akten (Recht auf Vergessenwerden)
                </h3>
                <p>
                  Fallakten verbleiben nur solange im System, wie dies für die Dokumentation erforderlich ist. 
                  Autorisierte Administratoren der Einrichtung können jede Fallakte jederzeit mit sofortiger und unwiderruflicher 
                  Wirkung aus der Cloud-Datenbank löschen.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  7. Rechte der Betroffenen & Aufsichtsbehörde
                </h3>
                <p>
                  Betroffene Personen haben nach Maßgabe der gesetzlichen Bestimmungen (§§ 19–25 DSG-EKD / Art. 15–21 DSGVO) 
                  das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Datenübertragbarkeit.
                </p>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900">Zuständige kirchliche Datenschutzaufsichtsbehörde:</div>
                  <div className="font-semibold text-slate-800">
                    Der Beauftragte für den Datenschutz der Evangelischen Kirche in Deutschland (BfD EKD)
                  </div>
                  <div>Regionale Außenstelle Süd, Böttlinbrunnenstraße 10, 89073 Ulm</div>
                  <div>Telefon: 0731 140593-0 • E-Mail: sued@datenschutz.ekd.de</div>
                  <div>Website: <a href="https://www.datenschutz.ekd.de" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">www.datenschutz.ekd.de</a></div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: TECHNISCH-ORGANISATORISCHE MASSNAHMEN (TOM) */}
          {activeTab === 'toms' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Dokumentation der technischen und organisatorischen Maßnahmen gemäß Art. 32 DSGVO / § 27 DSG-EKD 
                zur Gewährleistung der Sicherheit der Verarbeitung im Pilgerhaus Weinheim:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Zufallschiffre statt Klarnamen</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Systematische Pseudonymisierung: Keine Erfassung von Vor- oder Nachnamen, Straßen oder Kontaktdaten.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kein unverschlüsselter Browsercache</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Unverschlüsselte LocalStorage-Ablagen wurden vollständig entfernt. Die Datenspeicherung erfolgt sicher im autorisierten Firestore.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>TLS 1.3 & AES-256 Verschlüsselung</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Sichere Transportverschlüsselung (HTTPS) sowie hardwareseitige Verschlüsselung ruhender Daten auf den Servern.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Rollenbasierte Zugriffsverwaltung</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Verwaltung, Löschung und Gesamtexporte sind geschützt und an autorisierte Administratorenkonten gekoppelt.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Unwiderrufliche Löschung</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Erfüllung des Rechts auf Vergessenwerden: Akten können zu jedem Zeitpunkt restlos aus der Datenbank gelöscht werden.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PWA-Offline-Sicherheit</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Keine Datenweitergabe an Drittanbieter-Werbenetzwerke, Analyseplattformen oder externe Tracker.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Betreiber: Pilgerhaus Weinheim • www.pilgerhaus.de</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
