import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import justiceImage from "@/assets/justice-scales.jpg";

export function AboutSection() {
  const animation = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-28 bg-background relative overflow-hidden">
      {/* Geometric decorations */}
      <div className="absolute top-10 right-20 w-24 h-24 border border-gold/10 rounded-full hidden lg:block" />
      <div className="absolute bottom-20 left-10 w-40 h-40 border border-border hidden lg:block" />
      <div className="absolute top-1/3 left-20 w-px h-20 bg-gradient-to-b from-gold/20 to-transparent hidden lg:block" />
      
      <div
        ref={animation.ref}
        className={`container mx-auto px-6 relative z-10 transition-opacity duration-700 ${
          animation.isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text content */}
          <div className={`order-2 lg:order-1 ${animation.isVisible ? 'animate-slide-left' : ''}`}>
            <div className="w-12 h-px bg-gold mb-6" />
            <span className="text-gold/80 text-xs font-medium tracking-[0.25em] uppercase">
              Über uns
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mt-3 mb-6">
              Vertrauen durch Kompetenz
            </h2>
            <div className="space-y-4 mb-8">
              <p className="text-muted-foreground text-base font-normal leading-relaxed">
                Die Kley Rechtsanwalt GmbH steht für persönliche, kompetente und zuverlässige 
                Rechtsberatung. Unser Ziel ist es, für unsere Mandanten die bestmöglichen 
                Lösungen zu finden.
              </p>
              <p className="text-muted-foreground text-base font-normal leading-relaxed">
                Von unserem Standort in Bordesholm aus betreuen wir Mandanten in ganz 
                Schleswig-Holstein und darüber hinaus.
              </p>
            </div>
            <Button variant="outline" size="lg" asChild className="group">
              <Link to="/ueber-uns">
                Mehr erfahren
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Image */}
          <div className={`order-1 lg:order-2 ${animation.isVisible ? 'animate-slide-right' : ''}`}>
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-sm">
                <img
                  src={justiceImage}
                  alt="Waage der Gerechtigkeit"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Subtle accent */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-gold/20 rounded-sm -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
