import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function CTASection() {
  const animation = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-28 bg-muted/30">
      <div 
        ref={animation.ref}
        className={`container mx-auto px-6 transition-opacity duration-700 ${
          animation.isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className={`max-w-2xl mx-auto text-center ${animation.isVisible ? 'animate-slide-up' : ''}`}>
          <div className="w-12 h-px bg-gold mx-auto mb-6" />
          <span className="text-gold/80 text-xs font-medium tracking-[0.25em] uppercase">
            Kontakt
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-3 mb-4">
            Lassen Sie uns sprechen
          </h2>
          <p className="text-muted-foreground text-base font-normal mb-10 max-w-lg mx-auto">
            Vereinbaren Sie einen Termin für eine unverbindliche Erstberatung.
            Wir nehmen uns Zeit für Sie.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="gold" size="lg" asChild className="group">
              <a href="mailto:info@kanzlei-kley.com">
                <Mail className="w-4 h-4 mr-2" />
                E-Mail schreiben
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild className="group">
              <Link to="/kontakt">
                Kontaktformular
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
