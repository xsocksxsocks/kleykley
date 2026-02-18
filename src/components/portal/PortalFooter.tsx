import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import logoImage from "@/assets/logo-kley.png";
import { useToast } from "@/hooks/use-toast";

interface PortalFooterProps {
  isLoggedIn?: boolean;
}

export function PortalFooter({ isLoggedIn = true }: PortalFooterProps) {
  const { toast } = useToast();

  const handleRestrictedClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melden Sie sich an, um Zugriff auf diesen Bereich zu erhalten.",
        variant: "destructive",
      });
    }
  };

  return (
    <footer className="bg-card border-t border-border mt-auto">
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
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ihr zuverlässiger Partner für Insolvenzwaren, Lagerbestände und Sonderposten. 
              Wir bieten Ihnen hochwertige Produkte zu attraktiven Konditionen.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-accent font-serif text-lg font-bold mb-4">Portal</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/portal" 
                  className="text-sm text-foreground hover:text-accent transition-colors"
                  onClick={handleRestrictedClick}
                >
                  Produktkatalog
                </Link>
              </li>
              <li>
                <Link 
                  to="/portal/anfragen" 
                  className="text-sm text-foreground hover:text-accent transition-colors"
                  onClick={handleRestrictedClick}
                >
                  Meine Angebote
                </Link>
              </li>
              <li>
                <Link 
                  to="/portal/profil" 
                  className="text-sm text-foreground hover:text-accent transition-colors"
                  onClick={handleRestrictedClick}
                >
                  Mein Profil
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-foreground hover:text-accent transition-colors">
                  Zur Hauptseite
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-accent font-serif text-lg font-bold mb-4">Kontakt</h4>
            <ul className="space-y-2">
              <li className="text-sm font-bold text-foreground">
                Kley Rechtsanwalt GmbH
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">
                  Eiderkamp 13, 24582 Bordesholm
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <a 
                  href="tel:+4943226843102" 
                  className="text-sm text-foreground hover:text-accent transition-colors"
                >
                  +49 4322 6843102
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <a 
                  href="mailto:info@kanzlei-kley.com" 
                  className="text-sm text-foreground hover:text-accent transition-colors"
                >
                  info@kanzlei-kley.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Kley Rechtsanwalt GmbH. Alle Rechte vorbehalten.
            </p>
            <div className="flex gap-4 text-sm">
              <Link to="/impressum" className="text-foreground hover:text-accent transition-colors">
                Impressum
              </Link>
              <Link to="/datenschutz" className="text-foreground hover:text-accent transition-colors">
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
