import { Layout } from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Users, Clock, Shield } from "lucide-react";
import handshakeImage from "@/assets/business-handshake.jpg";

const values = [
  {
    icon: Shield,
    title: "Vertrauen",
    description: "Diskretion und Verschwiegenheit sind die Grundlage unserer Arbeit.",
  },
  {
    icon: Award,
    title: "Kompetenz",
    description: "Fundiertes Fachwissen und stetige Weiterbildung garantieren beste Beratung.",
  },
  {
    icon: Users,
    title: "Persönlich",
    description: "Jeder Mandant erhält individuelle Betreuung und maßgeschneiderte Lösungen.",
  },
  {
    icon: Clock,
    title: "Zuverlässig",
    description: "Termintreue und schnelle Reaktionszeiten zeichnen uns aus.",
  },
];

const UeberUns = () => {
  return (
    <Layout>
      <SEOHead 
        title="Über uns" 
        description="Lernen Sie die Kley Rechtsanwalt GmbH kennen. Ihre Rechtsanwaltskanzlei in Bordesholm für kompetente und persönliche Rechtsberatung."
        canonical="/ueber-uns"
      />
      {/* Hero Section */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <span className="text-gold text-sm tracking-[0.2em] uppercase">Über uns</span>
            <h1 className="text-4xl md:text-5xl font-serif text-cream mt-4 mb-6 line-decoration">
              Kley Rechtsanwalt GmbH
            </h1>
            <p className="text-cream/70 text-lg leading-relaxed">
              Seit Jahren stehen wir für kompetente und persönliche Rechtsberatung 
              in Bordesholm und Umgebung. Lernen Sie uns kennen.
            </p>
          </div>
        </div>
      </section>

      {/* About Content */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-serif text-foreground mb-6">
                Ihre Rechtsanwaltskanzlei in Bordesholm
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Die Kley Rechtsanwalt GmbH ist Ihre Anlaufstelle für kompetente 
                  Rechtsberatung in Schleswig-Holstein. Wir vereinen fundiertes 
                  juristisches Fachwissen mit einem persönlichen, mandantenorientierten 
                  Ansatz.
                </p>
                <p>
                  Unser Schwerpunkt liegt in den Bereichen Firmengründungen, 
                  Insolvenzrecht, Erbrecht und Familienrecht. In diesen Rechtsgebieten 
                  verfügen wir über umfangreiche Erfahrung und begleiten Sie von der 
                  ersten Beratung bis zur erfolgreichen Lösung Ihres Anliegens.
                </p>
                <p>
                  Wir legen großen Wert auf eine vertrauensvolle Zusammenarbeit und 
                  transparente Kommunikation. Bei uns erhalten Sie keine 
                  Standardlösungen, sondern eine auf Ihre individuelle Situation 
                  zugeschnittene Beratung.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src={handshakeImage}
                alt="Unser Team"
                className="rounded-lg shadow-elegant w-full"
              />
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-gold rounded-lg -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-gold text-sm tracking-[0.2em] uppercase">Unsere Werte</span>
            <h2 className="text-3xl md:text-4xl font-serif text-foreground mt-4 mb-6">
              Wofür wir stehen
            </h2>
            <div className="w-16 h-0.5 bg-gradient-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="text-center p-8"
              >
                <div className="w-16 h-16 rounded-full bg-navy mx-auto mb-6 flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-serif text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-navy">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-cream mb-6">
            Bereit für eine Beratung?
          </h2>
          <p className="text-cream/70 text-lg mb-8 max-w-2xl mx-auto">
            Kontaktieren Sie uns für ein unverbindliches Erstgespräch. 
            Wir freuen uns, Sie kennenzulernen.
          </p>
          <Button variant="gold" size="xl" asChild>
            <Link to="/kontakt">
              Kontakt aufnehmen
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default UeberUns;
