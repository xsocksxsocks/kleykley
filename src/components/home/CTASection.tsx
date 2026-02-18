import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function CTASection() {
  const animation = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-28 bg-background relative overflow-hidden">
      {/* Top border accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Geometric decorations */}
      <div className="absolute top-20 right-10 w-48 h-48 border border-gold/10 rounded-full hidden lg:block" />
      <div className="absolute bottom-10 left-20 w-20 h-20 border border-border rotate-12 hidden lg:block" />
      <div className="absolute top-1/2 right-1/3 w-px h-16 bg-gradient-to-b from-transparent via-gold/15 to-transparent hidden lg:block" />
      
      <div 
        ref={animation.ref}
        className={`container mx-auto px-6 transition-opacity duration-700 ${
          animation.isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${animation.isVisible ? 'animate-slide-up' : ''}`}>
          {/* Left - Contact info */}
          <div>
            <div className="w-12 h-px bg-gold mb-6" />
            <span className="text-gold/80 text-xs font-medium tracking-[0.25em] uppercase">
              Kontakt
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-3 mb-6">
              Vereinbaren Sie einen Termin
            </h2>
            <p className="text-muted-foreground text-base font-normal leading-relaxed mb-8 max-w-md">
              Wir freuen uns auf Ihre Kontaktaufnahme und nehmen uns gerne Zeit für eine unverbindliche Erstberatung.
            </p>
            
            {/* Contact details */}
            <div className="space-y-4 mb-8">
              <a 
                href="tel:+4943226843102" 
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <Phone className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Telefon</p>
                  <p className="text-foreground font-medium group-hover:text-gold transition-colors">+49 4322 6843102</p>
                </div>
              </a>
              
              <a 
                href="mailto:info@kanzlei-kley.com" 
                className="flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <Mail className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">E-Mail</p>
                  <p className="text-foreground font-medium group-hover:text-gold transition-colors">info@kanzlei-kley.com</p>
                </div>
              </a>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Adresse</p>
                  <p className="text-foreground font-medium">Eiderkamp 13, 24582 Bordesholm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - CTA Card */}
          <div className="bg-card border border-border rounded-xl p-8 md:p-10">
            <h3 className="text-xl font-serif font-bold text-foreground mb-3">
              Erstberatung anfragen
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Nutzen Sie unser Kontaktformular für eine schnelle und unkomplizierte Terminanfrage.
            </p>
            
            <div className="space-y-4">
              <Button variant="gold" size="lg" asChild className="w-full group">
                <Link to="/kontakt">
                  Zum Kontaktformular
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" asChild className="w-full">
                <a href="mailto:info@kanzlei-kley.com">
                  <Mail className="w-4 h-4 mr-2" />
                  Direkt per E-Mail
                </a>
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-6 text-center">
              Wir antworten in der Regel innerhalb von 24 Stunden.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
