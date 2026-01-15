import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Scale, Users, Heart, ArrowRight, CheckCircle } from "lucide-react";
const services = [
  {
    icon: Building2,
    title: "Firmengründungen",
    description: "Wir begleiten Sie bei der Gründung Ihres Unternehmens und beraten Sie umfassend zu allen rechtlichen Aspekten.",
    features: [
      "Wahl der optimalen Rechtsform",
      "Erstellung von Gesellschaftsverträgen",
      "Begleitung bei Handelsregisteranmeldungen",
      "Beratung zu Haftungsfragen",
      "Unterstützung bei Genehmigungen",
    ],
  },
  {
    icon: Scale,
    title: "Insolvenzrecht",
    description: "Kompetente Beratung und Vertretung in allen Fragen des Insolvenzrechts für Unternehmen und Privatpersonen.",
    features: [
      "Beratung zur Insolvenzantragspflicht",
      "Begleitung im Insolvenzverfahren",
      "Restschuldbefreiung für Privatpersonen",
      "Sanierungsberatung",
      "Gläubigervertretung",
    ],
  },
  {
    icon: Users,
    title: "Erbrecht",
    description: "Vorausschauende Nachlasspplanung und kompetente Vertretung bei erbrechtlichen Auseinandersetzungen.",
    features: [
      "Testamentsgestaltung",
      "Erbverträge und Vermächtnisse",
      "Pflichtteilsrecht",
      "Erbauseinandersetzung",
      "Nachlassverwaltung",
    ],
  },
  {
    icon: Heart,
    title: "Familienrecht",
    description: "Einfühlsame und sachkundige Beratung in allen familienrechtlichen Angelegenheiten.",
    features: [
      "Scheidung und Trennung",
      "Unterhaltsrecht",
      "Sorge- und Umgangsrecht",
      "Eheverträge",
      "Vermögensauseinandersetzung",
    ],
  },
];

const Leistungen = () => {
  return (
    <Layout>
      <SEOHead 
        title="Leistungen" 
        description="Unsere Rechtsgebiete: Firmengründungen, Insolvenzrecht, Erbrecht und Familienrecht. Kompetente Rechtsberatung in Bordesholm."
        canonical="/leistungen"
      />
      {/* Hero Section */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <span className="text-gold text-base font-semibold tracking-[0.2em] uppercase">Rechtsgebiete</span>
            <h1 className="text-4xl md:text-5xl font-serif text-cream mt-4 mb-6 line-decoration">
              Unsere Leistungen
            </h1>
            <p className="text-cream/70 text-xl leading-relaxed font-medium">
              Wir bieten Ihnen kompetente Rechtsberatung in unseren Schwerpunktgebieten. 
              Jeder Fall wird individuell betrachtet und optimal betreut.
            </p>
          </div>
        </div>
      </section>

      {/* Services Detail Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="space-y-24">
            {services.map((service, index) => (
              <div
                key={service.title}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="w-16 h-16 rounded-lg bg-navy flex items-center justify-center mb-6">
                    <service.icon className="w-8 h-8 text-gold" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
                    {service.title}
                  </h2>
                  <p className="text-muted-foreground text-lg mb-6 leading-relaxed font-medium">
                    {service.description}
                  </p>
                  <Button variant="gold" asChild>
                    <Link to="/kontakt">
                      Beratung anfragen
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className={`bg-card rounded-lg border border-border p-8 ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  <h3 className="text-xl font-semibold text-foreground mb-6">
                    Unsere Leistungen umfassen:
                  </h3>
                  <ul className="space-y-4">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-base font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-cream mb-6">
            Haben Sie Fragen?
          </h2>
          <p className="text-cream/70 text-xl mb-8 max-w-2xl mx-auto font-medium">
            Kontaktieren Sie uns für ein unverbindliches Erstgespräch. 
            Wir beraten Sie gerne zu Ihrem individuellen Anliegen.
          </p>
          <Button variant="gold" size="xl" asChild>
            <Link to="/kontakt">
              Jetzt Kontakt aufnehmen
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Leistungen;
