import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag } from "lucide-react";
import heroImage from "@/assets/hero-office.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center">
      {/* Background with refined overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-navy-dark/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-dark/60 via-transparent to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl">
          {/* Minimal accent line */}
          <div className="w-12 h-px bg-gold mb-8" />
          
          <span className="inline-block text-gold/80 text-xs font-medium tracking-[0.25em] uppercase mb-6">
            Kley Rechtsanwalt GmbH
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-cream leading-[1.1] mb-6">
            Ihr Recht ist
            <br />
            unser Anliegen
          </h1>
          
          <p className="text-cream/60 text-base sm:text-lg font-normal leading-relaxed mb-10 max-w-lg">
            Kompetente und persönliche Rechtsberatung in Bordesholm. 
            Wir stehen Ihnen mit Erfahrung und Engagement zur Seite.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="gold" 
              size="lg" 
              asChild
              className="group"
            >
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
              <Link to="/leistungen">
                Unsere Leistungen
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Minimal bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
