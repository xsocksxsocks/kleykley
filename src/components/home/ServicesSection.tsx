import { Building2, Scale, Users, Heart } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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

export function ServicesSection() {
  const animation = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-28 bg-background">
      <div 
        ref={animation.ref}
        className={`container mx-auto px-6 transition-opacity duration-700 ${
          animation.isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Section header - minimal */}
        <div className={`max-w-xl mb-16 ${animation.isVisible ? 'animate-slide-up' : ''}`}>
          <div className="w-12 h-px bg-gold mb-6" />
          <span className="text-gold/80 text-xs font-medium tracking-[0.25em] uppercase">
            Expertise
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-3">
            Unsere Rechtsgebiete
          </h2>
        </div>

        {/* Services grid - cleaner cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={`group bg-background p-8 md:p-10 transition-colors duration-300 hover:bg-muted/30 ${
                animation.isVisible ? 'animate-slide-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0 transition-colors duration-300 group-hover:bg-gold/20">
                  <service.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-foreground mb-2">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm font-normal leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
