import { ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onGetStarted: () => void;
}

const Navbar = ({ onGetStarted }: NavbarProps) => {
  const navLinks = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "About us", href: "#about" },
    
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container-main flex items-center justify-between h-20">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-electric-blue rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-foreground">ClearSky</span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-nav text-slate-medium hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
            <ShoppingCart className="w-4 h-4 text-foreground" />
          </button>
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
            <User className="w-4 h-4 text-foreground" />
          </button>
          <Button variant="heroOutline" className="hidden sm:flex" onClick={onGetStarted}>
            Get started
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
