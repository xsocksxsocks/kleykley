import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";

const Impressum = () => {
  return (
    <Layout>
      <SEOHead 
        title="Impressum" 
        description="Impressum der Kley Rechtsanwalt GmbH in Bordesholm. Angaben gemäß § 5 TMG."
        canonical="/impressum"
      />
      {/* Hero Section */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif text-cream line-decoration">
              Impressum
            </h1>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl prose prose-lg">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Angaben gemäß § 5 TMG
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  Kley Rechtsanwalt GmbH<br />
                  Eiderkamp 13<br />
                  24582 Bordesholm
                </p>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Handelsregister
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  Amtsgericht Kiel<br />
                  HRB 25081 KI
                </p>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Kontakt
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  E-Mail: info@kanzlei-kley.com
                </p>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Berufsbezeichnung und berufsrechtliche Regelungen
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  Berufsbezeichnung: Rechtsanwalt<br />
                  Zuständige Kammer: Schleswig-Holsteinische Rechtsanwaltskammer<br />
                  Verliehen in: Bundesrepublik Deutschland
                </p>
                <p className="text-muted-foreground text-base font-medium mt-4">
                  Es gelten folgende berufsrechtliche Regelungen:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground text-base font-medium mt-2 space-y-1">
                  <li>Bundesrechtsanwaltsordnung (BRAO)</li>
                  <li>Berufsordnung für Rechtsanwälte (BORA)</li>
                  <li>Fachanwaltsordnung (FAO)</li>
                  <li>Rechtsanwaltsvergütungsgesetz (RVG)</li>
                  <li>Berufsregeln der Rechtsanwälte der Europäischen Union (CCBE)</li>
                </ul>
                <p className="text-muted-foreground text-base font-medium mt-4">
                  Die berufsrechtlichen Regelungen können über die Bundesrechtsanwaltskammer 
                  unter{" "}
                  <a 
                    href="https://www.brak.de" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    www.brak.de
                  </a>
                  {" "}eingesehen werden.
                </p>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Berufshaftpflichtversicherung
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  Es besteht eine Berufshaftpflichtversicherung bei einem in der 
                  Europäischen Union zugelassenen Versicherungsunternehmen.
                </p>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Streitschlichtung
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung 
                  (OS) bereit:{" "}
                  <a 
                    href="https://ec.europa.eu/consumers/odr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gold hover:underline"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                </p>
                <p className="text-muted-foreground text-base font-medium mt-4">
                  Bei Streitigkeiten zwischen Rechtsanwälten und ihren Auftraggebern 
                  besteht die Möglichkeit zur Streitbeilegung bei der zuständigen 
                  Rechtsanwaltskammer.
                </p>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Haftung für Inhalte
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte 
                  auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. 
                  Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
                  verpflichtet, übermittelte oder gespeicherte fremde Informationen 
                  zu überwachen oder nach Umständen zu forschen, die auf eine 
                  rechtswidrige Tätigkeit hinweisen.
                </p>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Haftung für Links
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren 
                  Inhalte wir keinen Einfluss haben. Deshalb können wir für diese 
                  fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
                  verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber 
                  der Seiten verantwortlich.
                </p>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground mb-4">
                  Urheberrecht
                </h2>
                <p className="text-muted-foreground text-base font-medium">
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf 
                  diesen Seiten unterliegen dem deutschen Urheberrecht. Die 
                  Vervielfältigung, Bearbeitung, Verbreitung und jede Art der 
                  Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen 
                  der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Impressum;
