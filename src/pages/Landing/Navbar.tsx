import { ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";

interface NavbarProps {
  onGetStarted: () => void;
}

const Navbar = ({ onGetStarted }: NavbarProps) => {
  const navLinks = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "About us", href: "#about" },
    
  ];
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 px-6">
      {/* Card container */}
      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-md rounded-3xl border border-gray-200/50 shadow-lg px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-black">ClearSky</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
              <ShoppingCart className="w-4 h-4 text-gray-700" />
            </button>
            <button className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
              <User className="w-4 h-4 text-gray-700" />
            </button>
            {!isAuthenticated && <Button
              variant="outline"
              className="hidden sm:flex border-2 border-black text-black  px-6 font-semibold rounded-full h-11"
              onClick={onGetStarted}
            >
              Get started
            </Button>}
            {isAuthenticated && <Button
              className="hidden sm:flex bg-black text-white  px-6 font-semibold rounded-full h-11"
              onClick={() => { navigate(ROUTES.DASHBOARD); }}
            >
              Dashboard
            </Button>}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
