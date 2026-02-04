import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Tag, Truck, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  { 
    icon: Package, 
    title: "Insolvenzwaren", 
    description: "Hochwertige Produkte aus Insolvenzmassen" 
  },
  { 
    icon: Tag, 
    title: "Sonderposten", 
    description: "Lagerbestände mit erheblichen Preisnachlässen" 
  },
  { 
    icon: Truck, 
    title: "Schnelle Lieferung", 
    description: "Zuverlässige und zeitnahe Zustellung" 
  },
];

export function PortalSection() {
  const animation = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-28 bg-navy-dark relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gold rounded-full blur-3xl" />
      </div>
      
      <div 
        ref={animation.ref}
        className={`container mx-auto px-6 relative z-10 transition-opacity duration-700 ${
          animation.isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className={`mb-14 ${animation.isVisible ? 'animate-slide-up' : ''}`}>
            <div className="w-12 h-px bg-gold/60 mx-auto mb-6" />
            <span className="text-gold/70 text-xs font-medium tracking-[0.25em] uppercase">
              Kundenportal
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-cream mt-3 mb-4">
              Entdecken Sie unser Sortiment
            </h2>
            <p className="text-cream/50 text-base max-w-lg mx-auto font-normal">
              Hochwertige Produkte zu attraktiven Konditionen – 
              jetzt registrieren und profitieren.
            </p>
          </div>

          {/* Features - horizontal on desktop */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 ${animation.isVisible ? 'animate-slide-up' : ''}`} style={{ animationDelay: '100ms' }}>
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-cream font-medium mb-1">
                  {feature.title}
                </h3>
                <p className="text-cream/40 text-sm font-normal">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className={`${animation.isVisible ? 'animate-slide-up' : ''}`} style={{ animationDelay: '200ms' }}>
            <Button variant="gold" size="lg" asChild className="group">
              <Link to="/portal">
                Zum Kundenportal
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
