import { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Global geometric decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top right circle */}
        <div className="absolute top-32 right-10 w-64 h-64 border border-gold/5 rounded-full hidden lg:block" />
        {/* Bottom left square */}
        <div className="absolute bottom-40 left-10 w-32 h-32 border border-border/50 rotate-12 hidden lg:block" />
        {/* Vertical line accent */}
        <div className="absolute top-1/3 right-20 w-px h-40 bg-gradient-to-b from-transparent via-gold/10 to-transparent hidden lg:block" />
        {/* Small circle left */}
        <div className="absolute top-1/2 left-20 w-16 h-16 border border-gold/5 rounded-full hidden lg:block" />
      </div>
      
      <Navigation />
      <main className="flex-1 pt-20 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
