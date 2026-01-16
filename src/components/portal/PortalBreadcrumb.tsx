import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  '/portal': 'Portal',
  '/portal/profil': 'Profil',
  '/portal/anfragen': 'Meine Angebote',
  '/portal/warenkorb': 'Warenkorb',
  '/portal/produkt': 'Produkt',
  '/portal/fahrzeug': 'Fahrzeug',
};

export function PortalBreadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Build breadcrumb items
  const breadcrumbs: { path: string; label: string; isLast: boolean }[] = [];
  
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Get label from route labels or capitalize the segment
    let label = routeLabels[currentPath];
    if (!label) {
      // Check if it's a dynamic segment (like product/vehicle ID)
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
      if (routeLabels[parentPath]) {
        label = 'Details';
      } else {
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }
    }
    
    breadcrumbs.push({ path: currentPath, label, isLast });
  });

  // Don't show breadcrumb on the main portal page
  if (location.pathname === '/portal') {
    return null;
  }

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
            
            {breadcrumbs.slice(1).map((crumb, index) => (
              <span key={crumb.path} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
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
