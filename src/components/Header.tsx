import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/components/CartContext";

const Header = () => {
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50 supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">AS</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-primary hidden xs:block">autospares</h1>
          </Link>

          {/* Search Bar - Hide on small screens, show in mobile menu */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="search"
                placeholder="Search for auto parts, brands, or ask AI..."
                className="pl-10 pr-20 py-2 w-full bg-muted/50 border-muted focus:bg-card transition-colors"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90 text-xs px-3"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Right Menu */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-medium">
                  {getTotalItems() > 99 ? '99+' : getTotalItems()}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="md:hidden mt-3 pt-3 border-t border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search auto parts..."
              className="pl-10 pr-16 py-2 w-full bg-muted/50 border-muted focus:bg-card transition-colors text-sm"
            />
            <Button
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90 text-xs px-2"
            >
              Go
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;