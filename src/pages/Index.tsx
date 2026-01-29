import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Building2, Scale, Users, Heart, ArrowRight, ShoppingBag, Package, Tag, Truck } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import heroImage from "@/assets/hero-office.jpg";
import handshakeImage from "@/assets/business-handshake.jpg";
import justiceImage from "@/assets/justice-scales.jpg";
const services = [
  {
    icon: Building2,
    title: "Firmengründungen",
    description: "Professionelle Begleitung bei der Gründung Ihres Unternehmens – von der Rechtsformwahl bis zur Eintragung.",
  },
  {
    icon: Scale,
    title: "Insolvenzrecht",
    description: "Kompetente Beratung und Vertretung in allen Fragen des Insolvenzrechts für Unternehmen und Privatpersonen.",
  },
  {
    icon: Users,
    title: "Erbrecht",
    description: "Vorsorge und Nachlassplanung, Testamentsgestaltung sowie Vertretung bei Erbstreitigkeiten.",
  },
  {
    icon: Heart,
    title: "Familienrecht",
    description: "Einfühlsame und sachkundige Beratung in Scheidungs-, Unterhalts- und Sorgerechtsfragen.",
  },
];

const Index = () => {
  const servicesAnimation = useScrollAnimation<HTMLDivElement>();
  const aboutAnimation = useScrollAnimation<HTMLDivElement>();
  const ctaAnimation = useScrollAnimation<HTMLDivElement>();
  const portalAnimation = useScrollAnimation<HTMLDivElement>();
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-block text-gold text-sm font-semibold tracking-[0.3em] uppercase mb-4">
              Kley Rechtsanwalt GmbH
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-cream leading-tight mb-8">
              Ihr Recht ist unser
              <span className="text-gradient-gold block mt-2 pb-2">Anliegen</span>
            </h1>
            <p className="text-cream/70 text-lg md:text-xl font-medium leading-relaxed mb-10 max-w-xl">
              Kompetente und persönliche Rechtsberatung in Bordesholm. 
              Wir stehen Ihnen mit Erfahrung und Engagement zur Seite.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Button variant="gold" size="xl" asChild>
                <Link to="/kontakt">
                  Erstberatung vereinbaren
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="hero" size="xl" asChild>
                <Link to="/leistungen">Unsere Leistungen</Link>
              </Button>
              <Button variant="hero" size="xl" asChild>
                <Link to="/portal">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Kundenportal durchsuchen
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Services Section */}
      <section className="py-24 bg-background">
        <div 
          ref={servicesAnimation.ref}
          className={`container mx-auto px-6 transition-opacity duration-700 ${
            servicesAnimation.isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`text-center mb-16 ${servicesAnimation.isVisible ? 'animate-slide-up' : ''}`}>
            <span className="text-gold text-sm font-semibold tracking-[0.2em] uppercase">Unsere Expertise</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mt-4 mb-6">
              Rechtsgebiete
            </h2>
            <div className="w-16 h-0.5 bg-gradient-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={service.title}
                className={`group p-8 bg-card rounded-lg border border-border hover:border-gold/50 transition-all duration-500 hover:shadow-elegant ${
                  servicesAnimation.isVisible ? 'animate-slide-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-lg bg-navy flex items-center justify-center mb-6 group-hover:bg-gradient-gold transition-all duration-300">
                  <service.icon className="w-7 h-7 text-gold group-hover:text-navy-dark transition-colors" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-base font-medium leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal Section */}
      <section className="py-24 bg-background">
        <div 
          ref={portalAnimation.ref}
          className={`container mx-auto px-6 transition-opacity duration-700 ${
            portalAnimation.isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`text-center mb-16 ${portalAnimation.isVisible ? 'animate-slide-up' : ''}`}>
            <span className="text-gold text-sm font-semibold tracking-[0.2em] uppercase">Kundenportal</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mt-4 mb-6">
              Exklusive Angebote für Geschäftskunden
            </h2>
            <div className="w-16 h-0.5 bg-gradient-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: Package, title: "Insolvenzwaren", description: "Hochwertige Produkte aus Insolvenzmassen zu attraktiven Preisen." },
              { icon: Tag, title: "Sonderposten", description: "Lagerbestände und Restposten mit erheblichen Preisnachlässen." },
              { icon: Truck, title: "Schnelle Lieferung", description: "Zuverlässige Abwicklung und zeitnahe Zustellung Ihrer Bestellung." },
            ].map((item, index) => (
              <div
                key={item.title}
                className={`group p-8 bg-card rounded-lg border border-border hover:border-gold/50 transition-all duration-500 hover:shadow-elegant ${
                  portalAnimation.isVisible ? 'animate-slide-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-lg bg-navy flex items-center justify-center mb-6 group-hover:bg-gradient-gold transition-all duration-300">
                  <item.icon className="w-7 h-7 text-gold group-hover:text-navy-dark transition-colors" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-base font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="gold" size="lg" asChild>
              <Link to="/portal">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Kundenportal durchsuchen
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-24 bg-background">
        <div 
          ref={aboutAnimation.ref}
          className={`container mx-auto px-6 transition-opacity duration-700 ${
            aboutAnimation.isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={`order-2 lg:order-1 ${aboutAnimation.isVisible ? 'animate-slide-left' : ''}`}>
              <span className="text-gold text-sm font-semibold tracking-[0.2em] uppercase">Über uns</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-cream mt-4 mb-6 line-decoration">
                Vertrauen durch Kompetenz
              </h2>
              <p className="text-cream/80 text-base font-medium leading-relaxed mb-6">
                Die Kley Rechtsanwalt GmbH steht für persönliche, kompetente und zuverlässige 
                Rechtsberatung. Unser Ziel ist es, für unsere Mandanten die bestmöglichen 
                Lösungen zu finden – mit Engagement, Erfahrung und einem offenen Ohr für 
                Ihre Anliegen.
              </p>
              <p className="text-cream/80 text-base font-medium leading-relaxed mb-8">
                Von unserem Standort in Bordesholm aus betreuen wir Mandanten in ganz 
                Schleswig-Holstein und darüber hinaus.
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/ueber-uns">
                  Mehr erfahren
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className={`order-1 lg:order-2 relative ${aboutAnimation.isVisible ? 'animate-slide-right' : ''}`}>
              <div className="relative">
                <img
                  src={justiceImage}
                  alt="Waage der Gerechtigkeit"
                  className="rounded-lg shadow-elegant w-full"
                />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 border-2 border-gold/30 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <img
            src={justiceImage}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div 
          ref={ctaAnimation.ref}
          className={`container mx-auto px-6 relative z-10 transition-opacity duration-700 ${
            ctaAnimation.isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`max-w-2xl ${ctaAnimation.isVisible ? 'animate-slide-up' : ''}`}>
            <span className="text-gold text-sm font-semibold tracking-[0.2em] uppercase">Kontakt</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mt-4 mb-6">
              Lassen Sie uns über Ihr Anliegen sprechen
            </h2>
            <p className="text-muted-foreground text-base font-medium mb-8">
              Vereinbaren Sie noch heute einen Termin für eine unverbindliche Erstberatung.
              Wir nehmen uns Zeit für Sie.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="gold" size="lg" asChild>
                <a href="mailto:info@kanzlei-kley.com">
                  E-Mail schreiben
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/kontakt">Kontaktformular</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
