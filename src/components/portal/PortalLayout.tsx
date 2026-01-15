import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, LogOut, Settings, FileText, User } from 'lucide-react';
import { PortalFooter } from './PortalFooter';
import logoImage from '@/assets/logo-kley.png';

interface PortalLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ children, showNav = true }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/portal/auth');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showNav && user && (
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/portal" className="flex items-center gap-3">
              <img src={logoImage} alt="Kley" className="h-10 w-auto" />
              <span className="font-serif text-lg font-bold text-primary hidden sm:inline">
                Kundenportal
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/profil">
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profil</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/anfragen">
                  <FileText className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Anfragen</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/portal/warenkorb">
                  <ShoppingCart className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Anfrage</span>
                  {totalItems > 0 && (
                    <Badge variant="secondary" className="ml-1 sm:ml-2">
                      {totalItems}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1">
        {children}
      </main>

      {showNav && <PortalFooter />}
    </div>
  );
};
