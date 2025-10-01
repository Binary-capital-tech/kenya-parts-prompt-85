import { ShoppingCart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/components/CartContext";

const CartBottomActions = () => {
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show on cart or checkout pages
  const isCartOrCheckout = location.pathname === '/cart' || location.pathname === '/checkout';
  
  if (getTotalItems() === 0 || isCartOrCheckout) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t shadow-lg z-40 p-4">
      <div className="container mx-auto max-w-screen-lg">
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => navigate('/cart')}
            className="flex-1 max-w-xs btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Cart ({getTotalItems()})
          </Button>
          <Button
            onClick={() => navigate('/checkout')}
            className="flex-1 max-w-xs btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartBottomActions;