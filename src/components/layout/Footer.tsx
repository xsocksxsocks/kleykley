import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import logoImage from "@/assets/logo-kanzlei-kley.png";

export function Footer() {
  return (
    <footer className="bg-navy-dark text-cream/80">
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
            <p className="text-sm leading-relaxed text-cream/70 font-medium">
              Kompetente Rechtsberatung mit persönlicher Betreuung seit Jahren.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold font-serif text-lg mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm font-medium hover:text-gold transition-colors">
                  Startseite
                </Link>
              </li>
              <li>
                <Link to="/leistungen" className="text-sm font-medium hover:text-gold transition-colors">
                  Leistungen
                </Link>
              </li>
              <li>
                <Link to="/ueber-uns" className="text-sm font-medium hover:text-gold transition-colors">
                  Über uns
                </Link>
              </li>
              <li>
                <Link to="/kontakt" className="text-sm font-medium hover:text-gold transition-colors">
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-gold font-serif text-lg mb-4">Rechtliches</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/impressum" className="text-sm font-medium hover:text-gold transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-sm font-medium hover:text-gold transition-colors">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gold font-serif text-lg mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="text-sm font-semibold text-cream">
                Kley Rechtsanwalt GmbH
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold mt-1 shrink-0" />
                <span className="text-sm font-medium">
                  Eiderkamp 13<br />
                  24582 Bordesholm
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a 
                  href="tel:+4943221234567" 
                  className="text-sm font-medium hover:text-gold transition-colors"
                >
                  +49 (0) 4322 123 4567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a 
                  href="mailto:info@kanzlei-kley.com" 
                  className="text-sm font-medium hover:text-gold transition-colors"
                >
                  info@kanzlei-kley.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gold/20">
          <p className="text-sm text-cream/60 text-center font-medium">
            © {new Date().getFullYear()} Kley Rechtsanwalt GmbH. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}
