import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/components/CartContext";
import { useEffect, useState } from "react";

const CartBottomActions = () => {
  const { getTotalItems, cart } = useCart(); // Subscribe to cart changes
  const navigate = useNavigate();
  const location = useLocation();
  const [itemCount, setItemCount] = useState(0);

  // Update item count whenever cart changes
  useEffect(() => {
    setItemCount(getTotalItems());
  }, [cart, getTotalItems]);

  // Don't show on cart or checkout pages
  const isCartOrCheckout = location.pathname === '/cart' || location.pathname === '/checkout';
  
  if (itemCount === 0 || isCartOrCheckout) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t shadow-lg z-40 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="container mx-auto max-w-screen-lg">
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => navigate('/cart')}
            className="flex-1 max-w-xs btn-premium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Cart ({itemCount})
          </Button>
          <Button
            onClick={() => navigate('/checkout')}
            className="flex-1 max-w-xs btn-premium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartBottomActions;