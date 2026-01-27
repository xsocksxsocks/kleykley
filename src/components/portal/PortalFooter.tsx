import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import logoImage from "@/assets/logo-kley.png";

export function PortalFooter() {
  return (
    <footer className="bg-navy-dark text-cream/80 mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/">
              <img 
                src={logoImage} 
                alt="Kanzlei Kley" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm leading-relaxed text-cream/70">
              Ihr zuverlässiger Partner für Insolvenzwaren und Warenbestände.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gold font-serif text-lg font-bold mb-4">Portal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/portal" className="text-sm hover:text-gold transition-colors">
                  Produktkatalog
                </Link>
              </li>
              <li>
                <Link to="/portal/anfragen" className="text-sm hover:text-gold transition-colors">
                  Meine Angebote
                </Link>
              </li>
              <li>
                <Link to="/portal/profil" className="text-sm hover:text-gold transition-colors">
                  Mein Profil
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm hover:text-gold transition-colors">
                  Zur Hauptseite
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gold font-serif text-lg font-bold mb-4">Kontakt</h4>
            <ul className="space-y-2">
              <li className="text-sm font-bold text-cream">
                Kley Rechtsanwalt GmbH
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span className="text-sm">
                  Eiderkamp 13, 24582 Bordesholm
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a 
                  href="tel:+4943226874699" 
                  className="text-sm hover:text-gold transition-colors"
                >
                  +49 4322 6874699
                </a>
              </li>
              <li className="flex items-center gap-2">
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
        <div className="mt-8 pt-6 border-t border-gold/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-cream/60">
              © {new Date().getFullYear()} Kley Rechtsanwalt GmbH. Alle Rechte vorbehalten.
            </p>
            <div className="flex gap-4 text-sm">
              <Link to="/impressum" className="hover:text-gold transition-colors">
                Impressum
              </Link>
              <Link to="/datenschutz" className="hover:text-gold transition-colors">
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
