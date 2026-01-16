import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import UeberUns from "./pages/UeberUns";
import Leistungen from "./pages/Leistungen";
import Kontakt from "./pages/Kontakt";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import NotFound from "./pages/NotFound";
import Auth from "./pages/portal/Auth";
import Portal from "./pages/portal/Portal";
import Warenkorb from "./pages/portal/Warenkorb";
import Anfragen from "./pages/portal/Anfragen";
import Profil from "./pages/portal/Profil";
import ProduktDetail from "./pages/portal/ProduktDetail";
import Admin from "./pages/admin/Admin";
import AnfrageDetail from "./pages/admin/AnfrageDetail";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ueber-uns" element={<UeberUns />} />
                <Route path="/leistungen" element={<Leistungen />} />
                <Route path="/kontakt" element={<Kontakt />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/portal" element={<Portal />} />
                <Route path="/portal/auth" element={<Auth />} />
                <Route path="/portal/warenkorb" element={<Warenkorb />} />
                <Route path="/portal/anfragen" element={<Anfragen />} />
                <Route path="/portal/profil" element={<Profil />} />
                <Route path="/portal/produkt/:id" element={<ProduktDetail />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/anfrage/:id" element={<AnfrageDetail />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
