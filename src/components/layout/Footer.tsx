import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import logoImage from "@/assets/logo-kley.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/">
              <img 
                src={logoImage} 
                alt="Kanzlei Kley" 
                className="h-14 w-auto"
              />
            </Link>
            <p className="text-base leading-relaxed text-muted-foreground font-medium">
              Kompetente Rechtsberatung mit persönlicher Betreuung seit Jahren.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-accent font-serif text-xl font-bold mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-base font-semibold text-foreground hover:text-accent transition-colors">
                  Startseite
                </Link>
              </li>
              <li>
                <Link to="/leistungen" className="text-base font-semibold text-foreground hover:text-accent transition-colors">
                  Leistungen
                </Link>
              </li>
              <li>
                <Link to="/ueber-uns" className="text-base font-semibold text-foreground hover:text-accent transition-colors">
                  Über uns
                </Link>
              </li>
              <li>
                <Link to="/kontakt" className="text-base font-semibold text-foreground hover:text-accent transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-accent font-serif text-xl font-bold mb-4">Rechtliches</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/impressum" className="text-base font-semibold text-foreground hover:text-accent transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-base font-semibold text-foreground hover:text-accent transition-colors">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-accent font-serif text-xl font-bold mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="text-base font-bold text-foreground">
                Kley Rechtsanwalt GmbH
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent mt-1 shrink-0" />
                <span className="text-base font-semibold text-foreground">
                  Eiderkamp 13<br />
                  24582 Bordesholm
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent shrink-0" />
                <a 
                  href="tel:+4943226874699" 
                  className="text-base font-semibold text-foreground hover:text-accent transition-colors"
                >
                  +49 4322 6874699
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent shrink-0" />
                <a 
                  href="mailto:info@kanzlei-kley.com" 
                  className="text-base font-semibold text-foreground hover:text-accent transition-colors"
                >
                  info@kanzlei-kley.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-base text-muted-foreground text-center font-semibold">
            © {new Date().getFullYear()} Kley Rechtsanwalt GmbH. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}
