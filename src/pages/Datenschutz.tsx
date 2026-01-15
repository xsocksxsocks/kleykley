import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";

const Datenschutz = () => {
  return (
    <Layout>
      <SEOHead 
        title="Datenschutz" 
        description="Datenschutzerklärung der Kley Rechtsanwalt GmbH. Informationen zur Verarbeitung Ihrer personenbezogenen Daten."
        canonical="/datenschutz"
      />
      {/* Hero Section */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif text-cream line-decoration">
              Datenschutzerklärung
            </h1>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-serif text-foreground mb-4">
                  1. Datenschutz auf einen Blick
                </h2>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Allgemeine Hinweise
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit 
                  Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. 
                  Personenbezogene Daten sind alle Daten, mit denen Sie persönlich 
                  identifiziert werden können.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-serif text-foreground mb-4">
                  2. Verantwortliche Stelle
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
                </p>
                <p className="text-muted-foreground mt-4">
                  Kley Rechtsanwalt GmbH<br />
                  Eiderkamp 13<br />
                  24582 Bordesholm<br /><br />
                  E-Mail: info@kanzlei-kley.com
                </p>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  Verantwortliche Stelle ist die natürliche oder juristische Person, die 
                  allein oder gemeinsam mit anderen über die Zwecke und Mittel der 
                  Verarbeitung von personenbezogenen Daten entscheidet.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-serif text-foreground mb-4">
                  3. Datenerfassung auf dieser Website
                </h2>
                
                <h3 className="text-lg font-medium text-foreground mb-2 mt-6">
                  Wer ist verantwortlich für die Datenerfassung?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Die Datenverarbeitung auf dieser Website erfolgt durch den 
                  Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum 
                  dieser Website entnehmen.
                </p>

                <h3 className="text-lg font-medium text-foreground mb-2 mt-6">
                  Wie erfassen wir Ihre Daten?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese 
                  mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in 
                  ein Kontaktformular eingeben. Andere Daten werden automatisch oder 
                  nach Ihrer Einwilligung beim Besuch der Website durch unsere 
                  IT-Systeme erfasst. Das sind vor allem technische Daten 
                  (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
                </p>

                <h3 className="text-lg font-medium text-foreground mb-2 mt-6">
                  Wofür nutzen wir Ihre Daten?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung 
                  der Website zu gewährleisten. Andere Daten können zur Analyse Ihres 
                  Nutzerverhaltens verwendet werden.
                </p>

                <h3 className="text-lg font-medium text-foreground mb-2 mt-6">
                  Welche Rechte haben Sie bezüglich Ihrer Daten?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, 
                  Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu 
                  erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung 
                  dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur 
                  Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit 
                  für die Zukunft widerrufen. Hierzu sowie zu weiteren Fragen zum Thema 
                  Datenschutz können Sie sich jederzeit an uns wenden.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-serif text-foreground mb-4">
                  4. Hosting
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Wir hosten die Inhalte unserer Website bei einem externen 
                  Dienstleister. Personenbezogene Daten, die auf dieser Website 
                  erfasst werden, werden auf den Servern des Hosters gespeichert. 
                  Hierbei kann es sich v.a. um IP-Adressen, Kontaktanfragen, 
                  Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, 
                  Namen, Websitezugriffe und sonstige Daten, die über eine 
                  Website generiert werden, handeln.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-serif text-foreground mb-4">
                  5. Kontaktformular
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden 
                  Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort 
                  angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für 
                  den Fall von Anschlussfragen bei uns gespeichert. Diese Daten 
                  geben wir nicht ohne Ihre Einwilligung weiter.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Die Verarbeitung dieser Daten erfolgt auf Grundlage von 
                  Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der 
                  Erfüllung eines Vertrags zusammenhängt oder zur Durchführung 
                  vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen 
                  Fällen beruht die Verarbeitung auf unserem berechtigten Interesse 
                  an der effektiven Bearbeitung der an uns gerichteten Anfragen 
                  (Art. 6 Abs. 1 lit. f DSGVO) oder auf Ihrer Einwilligung 
                  (Art. 6 Abs. 1 lit. a DSGVO) sofern diese abgefragt wurde.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-serif text-foreground mb-4">
                  6. SSL- bzw. TLS-Verschlüsselung
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der 
                  Übertragung vertraulicher Inhalte, wie zum Beispiel Anfragen, 
                  die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. 
                  TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen 
                  Sie daran, dass die Adresszeile des Browsers von "http://" 
                  auf "https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-serif text-foreground mb-4">
                  7. Ihre Rechte
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie 
                  betreffenden personenbezogenen Daten:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mt-4 space-y-2">
                  <li>Recht auf Auskunft</li>
                  <li>Recht auf Berichtigung oder Löschung</li>
                  <li>Recht auf Einschränkung der Verarbeitung</li>
                  <li>Recht auf Widerspruch gegen die Verarbeitung</li>
                  <li>Recht auf Datenübertragbarkeit</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde 
                  über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.
                </p>
              </div>

              <div className="pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Stand: Januar 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Datenschutz;
