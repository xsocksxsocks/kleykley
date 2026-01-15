import { Link } from "react-router-dom";
import { Scale, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-dark text-cream/80">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-gradient-gold flex items-center justify-center">
                <Scale className="w-5 h-5 text-navy-dark" />
              </div>
              <div className="flex flex-col">
                <span className="text-cream font-serif text-lg font-semibold tracking-wide">
                  KLEY
                </span>
                <span className="text-gold/80 text-xs tracking-widest uppercase">
                  Rechtsanwalt
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-cream/60">
              Kompetente Rechtsberatung mit persönlicher Betreuung seit Jahren.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold font-serif text-lg mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm hover:text-gold transition-colors">
                  Startseite
                </Link>
              </li>
              <li>
                <Link to="/leistungen" className="text-sm hover:text-gold transition-colors">
                  Leistungen
                </Link>
              </li>
              <li>
                <Link to="/ueber-uns" className="text-sm hover:text-gold transition-colors">
                  Über uns
                </Link>
              </li>
              <li>
                <Link to="/kontakt" className="text-sm hover:text-gold transition-colors">
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
                <Link to="/impressum" className="text-sm hover:text-gold transition-colors">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-sm hover:text-gold transition-colors">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gold font-serif text-lg mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold mt-1 shrink-0" />
                <span className="text-sm">
                  Eiderkamp 13<br />
                  24582 Bordesholm
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a 
                  href="mailto:info@kanzlei-kley.com" 
                  className="text-sm hover:text-gold transition-colors"
                >
                  info@kanzlei-kley.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gold/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-cream/50">
              © {new Date().getFullYear()} Kley Rechtsanwalt GmbH. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-cream/40">
              Amtsgericht Kiel HRB 25081 KI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
