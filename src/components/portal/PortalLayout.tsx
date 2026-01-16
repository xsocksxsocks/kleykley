import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, FileText, User, Home } from 'lucide-react';
import { PortalFooter } from './PortalFooter';
import { CartDropdown } from './CartDropdown';
import logoImage from '@/assets/logo-kley.png';

interface PortalLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ children, showNav = true }) => {
  const { user, isAdmin, isApproved, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/portal/auth');
  };

  // Show cart and orders only for approved users or admins
  const canAccessShop = isApproved || isAdmin;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showNav && user && (
        <header className="bg-navy-dark text-cream sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/portal" className="flex items-center gap-3">
              <img src={logoImage} alt="Kley" className="h-10 w-auto" />
              <span className="font-serif text-lg font-bold text-gold hidden sm:inline">
                Kundenportal
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="border-gold/30 bg-transparent text-cream hover:bg-gold/10 hover:text-gold">
                  <Link to="/admin">
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild className="border-gold/30 bg-transparent text-cream hover:bg-gold/10 hover:text-gold">
                <Link to="/portal">
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Portal</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="border-gold/30 bg-transparent text-cream hover:bg-gold/10 hover:text-gold">
                <Link to="/portal/profil">
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profil</span>
                </Link>
              </Button>
              {canAccessShop && (
                <>
                  <Button variant="outline" size="sm" asChild className="border-gold/30 bg-transparent text-cream hover:bg-gold/10 hover:text-gold">
                    <Link to="/portal/anfragen">
                      <FileText className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Meine Angebote</span>
                    </Link>
                  </Button>
                  <CartDropdown />
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-cream hover:bg-gold/10 hover:text-gold">
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
