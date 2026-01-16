import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, FileText, User, Home, Heart, FolderOpen, ChevronDown } from 'lucide-react';
import { PortalFooter } from './PortalFooter';
import { CartDropdown } from './CartDropdown';
import { PortalBreadcrumb } from './PortalBreadcrumb';
import { ThemeToggle } from './ThemeToggle';
import logoImage from '@/assets/logo-kley.png';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PortalLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ children, showNav = true }) => {
  const { user, isAdmin, isApproved, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isOnPortalHome = location.pathname === '/portal';
  const isOnProfil = location.pathname === '/portal/profil';
  const isOnAnfragen = location.pathname === '/portal/anfragen';
  const isOnWarenkorb = location.pathname === '/portal/warenkorb';
  const isOnFavoriten = location.pathname === '/portal/favoriten';
  const isOnDokumente = location.pathname === '/portal/dokumente';
  const isOnUserMenu = isOnProfil || isOnFavoriten || isOnDokumente || isOnAnfragen;

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
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className={cn(
                  "border-gold/30 bg-transparent text-cream hover:bg-gold/10 hover:text-gold",
                  isOnPortalHome && "bg-gold/20 text-gold border-gold/50"
                )}
              >
                <Link to="/portal">
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Portal</span>
                </Link>
              </Button>
              
              {canAccessShop && (
                <CartDropdown isActive={isOnWarenkorb} />
              )}

              {/* User Menu Dropdown - far right */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "border-gold/30 bg-transparent text-cream hover:bg-gold/10 hover:text-gold",
                      isOnUserMenu && "bg-gold/20 text-gold border-gold/50"
                    )}
                  >
                    <User className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Mein Konto</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg">
                  <DropdownMenuItem asChild>
                    <Link to="/portal/profil" className={cn("flex items-center gap-2 cursor-pointer", isOnProfil && "bg-muted")}>
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  {canAccessShop && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/portal/anfragen" className={cn("flex items-center gap-2 cursor-pointer", isOnAnfragen && "bg-muted")}>
                          <FileText className="h-4 w-4" />
                          Meine Angebote
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/portal/favoriten" className={cn("flex items-center gap-2 cursor-pointer", isOnFavoriten && "bg-muted")}>
                          <Heart className="h-4 w-4" />
                          Favoriten
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/portal/dokumente" className={cn("flex items-center gap-2 cursor-pointer", isOnDokumente && "bg-muted")}>
                          <FolderOpen className="h-4 w-4" />
                          Dokumente
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <div className="flex items-center justify-between w-full cursor-pointer">
                      <span className="flex items-center gap-2">
                        Design
                      </span>
                      <ThemeToggle />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      {showNav && user && <PortalBreadcrumb />}

      <main className="flex-1">
        {children}
      </main>

      {showNav && <PortalFooter />}
    </div>
  );
};
