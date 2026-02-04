import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Tag, Truck, ArrowRight, ShieldCheck, Clock, Star } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import warehouseImage from "@/assets/warehouse-background.jpg";

const features = [
  { 
    icon: Package, 
    title: "Insolvenzwaren", 
    description: "Hochwertige Produkte aus Insolvenzmassen zu attraktiven Preisen" 
  },
  { 
    icon: Tag, 
    title: "Sonderposten", 
    description: "Lagerbestände und Restposten mit erheblichen Preisnachlässen" 
  },
  { 
    icon: Truck, 
    title: "Schnelle Lieferung", 
    description: "Zuverlässige Abwicklung und zeitnahe Zustellung" 
  },
];

const benefits = [
  { icon: ShieldCheck, text: "Geprüfte Qualität" },
  { icon: Clock, text: "Schnelle Abwicklung" },
  { icon: Star, text: "Attraktive Preise" },
];

export function PortalSection() {
  const animation = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${warehouseImage})` }}
      >
        <div className="absolute inset-0 bg-navy-dark/92" />
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      
      <div 
        ref={animation.ref}
        className={`container mx-auto px-6 relative z-10 transition-opacity duration-700 ${
          animation.isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className={`${animation.isVisible ? 'animate-slide-left' : ''}`}>
            <div className="w-12 h-px bg-gold/60 mb-6" />
            <span className="text-gold/70 text-xs font-medium tracking-[0.25em] uppercase">
              Kundenportal
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-cream mt-3 mb-5">
              Entdecken Sie unser Sortiment
            </h2>
            <p className="text-cream/60 text-base leading-relaxed mb-8 max-w-lg">
              Profitieren Sie von hochwertigen Produkten aus Insolvenzmassen und Sonderposten 
              zu besonders attraktiven Konditionen. Registrieren Sie sich jetzt für exklusiven Zugang.
            </p>
            
            {/* Benefits row */}
            <div className="flex flex-wrap gap-6 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.text} className="flex items-center gap-2">
                  <benefit.icon className="w-4 h-4 text-gold" />
                  <span className="text-cream/80 text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="gold" size="lg" asChild className="group">
                <Link to="/portal">
                  Zum Kundenportal
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                asChild
                className="bg-transparent border border-cream/30 text-cream hover:bg-cream/10 hover:border-cream/50"
              >
                <Link to="/portal/auth?mode=register">
                  Jetzt registrieren
                </Link>
              </Button>
            </div>
          </div>

          {/* Right side - Feature cards */}
          <div className={`space-y-4 ${animation.isVisible ? 'animate-slide-right' : ''}`}>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-cream/5 backdrop-blur-sm rounded-lg p-5 border border-gold/10 hover:border-gold/30 hover:bg-cream/10 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-cream font-semibold mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-cream/50 text-sm font-normal leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
