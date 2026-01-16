import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Routes that actually exist as pages (with optional tab param for portal)
const validRoutes = new Set([
  '/portal',
  '/portal/profil',
  '/portal/anfragen',
  '/portal/warenkorb',
  '/portal/favoriten',
  '/portal/dokumente',
]);

const routeLabels: Record<string, string> = {
  '/portal': 'Portal',
  '/portal/profil': 'Profil',
  '/portal/anfragen': 'Meine Angebote',
  '/portal/warenkorb': 'Warenkorb',
  '/portal/favoriten': 'Favoriten',
  '/portal/dokumente': 'Dokumente',
  '/portal/produkt': 'Produkte',
  '/portal/fahrzeug': 'Fahrzeuge',
};

// Routes that should link to portal with a specific tab
const tabRoutes: Record<string, string> = {
  '/portal/produkt': 'products',
  '/portal/fahrzeug': 'vehicles',
};

export function PortalBreadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const [itemName, setItemName] = useState<string | null>(null);
  
  // Extract the ID if we're on a detail page
  const isProductDetail = location.pathname.startsWith('/portal/produkt/');
  const isVehicleDetail = location.pathname.startsWith('/portal/fahrzeug/');
  const itemId = isProductDetail || isVehicleDetail ? pathSegments[2] : null;

  useEffect(() => {
    const fetchItemName = async () => {
      if (!itemId) {
        setItemName(null);
        return;
      }

      if (isProductDetail) {
        const { data } = await supabase
          .from('products')
          .select('name')
          .eq('id', itemId)
          .maybeSingle();
        setItemName(data?.name || 'Produkt');
      } else if (isVehicleDetail) {
        const { data } = await supabase
          .from('cars_for_sale')
          .select('brand, model')
          .eq('id', itemId)
          .maybeSingle();
        setItemName(data ? `${data.brand} ${data.model}` : 'Fahrzeug');
      }
    };

    fetchItemName();
  }, [itemId, isProductDetail, isVehicleDetail]);

  // Don't show breadcrumb on the main portal page
  if (location.pathname === '/portal') {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbs: { 
    path: string; 
    label: string; 
    isLast: boolean; 
    isValidRoute: boolean;
    tabParam?: string;
  }[] = [];
  
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    const isValidRoute = validRoutes.has(currentPath);
    const tabParam = tabRoutes[currentPath];
    
    // Get label from route labels or use item name for detail pages
    let label = routeLabels[currentPath];
    if (!label) {
      // Check if it's a dynamic segment (like product/vehicle ID)
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
      if (routeLabels[parentPath]) {
        label = itemName || 'Details';
      } else {
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }
    }
    
    breadcrumbs.push({ path: currentPath, label, isLast, isValidRoute, tabParam });
  });

  return (
    <div className="bg-muted/50 border-b">
      <div className="container mx-auto px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/portal" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <Home className="h-4 w-4" />
                  <span>Portal</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {breadcrumbs.slice(1).map((crumb) => (
              <span key={crumb.path} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : crumb.tabParam ? (
                    <BreadcrumbLink asChild>
                      <Link to={`/portal?tab=${crumb.tabParam}`}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : crumb.isValidRoute ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
