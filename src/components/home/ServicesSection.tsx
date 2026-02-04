import { Link } from "react-router-dom";
import { Building2, Scale, Users, Heart, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const services = [
  {
    icon: Building2,
    title: "Firmengründungen",
    description: "Professionelle Begleitung bei der Gründung Ihres Unternehmens – von der Rechtsformwahl bis zur Eintragung.",
    link: "/leistungen",
  },
  {
    icon: Scale,
    title: "Insolvenzrecht",
    description: "Kompetente Beratung und Vertretung in allen Fragen des Insolvenzrechts für Unternehmen und Privatpersonen.",
    link: "/leistungen",
  },
  {
    icon: Users,
    title: "Erbrecht",
    description: "Vorsorge und Nachlassplanung, Testamentsgestaltung sowie Vertretung bei Erbstreitigkeiten.",
    link: "/leistungen",
  },
  {
    icon: Heart,
    title: "Familienrecht",
    description: "Einfühlsame und sachkundige Beratung in Scheidungs-, Unterhalts- und Sorgerechtsfragen.",
    link: "/leistungen",
  },
];

export function ServicesSection() {
  const animation = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-28 bg-background relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-muted/50 to-transparent" />
      
      {/* Geometric decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-gold/10 rounded-full hidden lg:block" />
      <div className="absolute bottom-20 right-20 w-48 h-48 border border-border rotate-12 hidden lg:block" />
      <div className="absolute top-1/2 right-10 w-2 h-24 bg-gradient-to-b from-gold/20 to-transparent hidden lg:block" />
      
      <div 
        ref={animation.ref}
        className={`container mx-auto px-6 relative z-10 transition-opacity duration-700 ${
          animation.isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Section header */}
        <div className={`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 ${animation.isVisible ? 'animate-slide-up' : ''}`}>
          <div className="max-w-xl">
            <div className="w-12 h-px bg-gold mb-6" />
            <span className="text-gold/80 text-xs font-medium tracking-[0.25em] uppercase">
              Expertise
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-3">
              Unsere Rechtsgebiete
            </h2>
          </div>
          <Link 
            to="/leistungen" 
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Alle Leistungen ansehen
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Services grid - card style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link
              to={service.link}
              key={service.title}
              className={`group relative bg-card rounded-lg p-6 border border-border hover:border-gold/30 hover:shadow-lg transition-all duration-300 ${
                animation.isVisible ? 'animate-slide-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon with gradient background */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-5 group-hover:from-gold/30 group-hover:to-gold/10 transition-all duration-300">
                <service.icon className="w-6 h-6 text-gold" />
              </div>
              
              <h3 className="text-lg font-serif font-bold text-foreground mb-2 group-hover:text-gold transition-colors">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm font-normal leading-relaxed mb-4">
                {service.description}
              </p>
              
              {/* Arrow indicator */}
              <div className="flex items-center gap-1 text-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Mehr erfahren
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
