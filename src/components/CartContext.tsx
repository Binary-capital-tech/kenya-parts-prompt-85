import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlgjxxsscuyrauopinoz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZ2p4eHNzY3V5cmF1b3Bpbm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDk1NzQsImV4cCI6MjA3MzY4NTU3NH0.d3V1ZdSUronzivRV5MlJSU0dFkfHzFKhk-Qgtfikgd0'
);

export interface Product {
  id: string;
  name: string;
  brand?: string;
  price: string;
  priceValue?: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  description?: string;
  category?: string;
  inStock?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  clearCart: () => void;
  syncWithBackend: () => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'autospares_cart';
const SUPER_ENDPOINT_URL = 'https://tlgjxxsscuyrauopinoz.supabase.co/functions/v1/super-endpoint';
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZ2p4eHNzY3V5cmF1b3Bpbm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDk1NzQsImV4cCI6MjA3MzY4NTU3NH0.d3V1ZdSUronzivRV5MlJSU0dFkfHzFKhk-Qgtfikgd0';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Convert backend cart format to frontend format
  const convertBackendToFrontend = (backendItems: any[]): CartItem[] => {
    return backendItems.map(item => ({
      id: item.product_id,
      name: item.product_name,
      brand: item.brand || '',
      price: `KSh ${item.unit_price.toLocaleString()}`,
      priceValue: item.unit_price,
      image: item.image_url || '/src/assets/hero-parts.jpg',
      quantity: item.quantity,
      inStock: true
    }));
  };

  // Load cart from backend
  const loadCartFromBackend = useCallback(async () => {
    try {
      const sessionToken = sessionStorage.getItem('sessionToken');
      const sessionId = sessionStorage.getItem('currentSessionId');

      if (!sessionToken || !sessionId) {
        // No session yet, load from sessionStorage
        const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
        return;
      }

      // Fetch cart from backend via super-endpoint
      const response = await fetch(SUPER_ENDPOINT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN
        },
        body: JSON.stringify({
          message: 'GET_CART',
          sessionId,
          sessionToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cart?.items) {
          const frontendCart = convertBackendToFrontend(data.cart.items);
          setCart(frontendCart);
          sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(frontendCart));
        }
      }
    } catch (error) {
      console.error('Error loading cart from backend:', error);
      // Fallback to sessionStorage
      const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await loadCartFromBackend();
      setIsLoading(false);
      setHasInitialLoad(true);
    };

    initialize();
  }, [loadCartFromBackend]);

  // Setup Supabase Realtime subscription for cart changes
  useEffect(() => {
    const sessionId = sessionStorage.getItem('currentSessionId');
    
    if (!sessionId || !hasInitialLoad) return;

    // Subscribe to cart changes
    const channel = supabase
      .channel('cart-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'session_cart_items',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          console.log('Cart changed detected:', payload);
          // Reload cart from backend when any change is detected
          await loadCartFromBackend();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [hasInitialLoad, loadCartFromBackend]);

  // Sync cart to backend (debounced)
  const syncWithBackend = useCallback(async () => {
    try {
      setIsSyncing(true);
      const sessionToken = sessionStorage.getItem('sessionToken');
      const sessionId = sessionStorage.getItem('currentSessionId');

      if (!sessionToken || !sessionId) {
        console.log('No session, skipping backend sync');
        return;
      }

      const cartItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        brand: item.brand || '',
        quantity: item.quantity,
        unit_price: item.priceValue || parseFloat(item.price.replace(/[^\d.]/g, '')) || 0,
        image_url: item.image
      }));

      const response = await fetch(SUPER_ENDPOINT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN
        },
        body: JSON.stringify({
          message: 'SYNC_CART',
          sessionId,
          sessionToken,
          cartItems
        })
      });

      if (response.ok) {
        console.log('Cart synced with backend');
      }
    } catch (error) {
      console.error('Error syncing cart with backend:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [cart]);

  // Debounced sync on cart changes
  useEffect(() => {
    if (!hasInitialLoad) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Save to sessionStorage immediately
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));

    // Schedule backend sync with debounce (2 seconds)
    syncTimeoutRef.current = setTimeout(() => {
      syncWithBackend();
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [cart, hasInitialLoad, syncWithBackend]);

  // Sync on page visibility change (user switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncWithBackend();
      } else if (document.visibilityState === 'visible') {
        // Reload cart when user comes back to the tab
        loadCartFromBackend();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncWithBackend, loadCartFromBackend]);

  // Sync before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force immediate sync (no debounce)
      const sessionToken = sessionStorage.getItem('sessionToken');
      const sessionId = sessionStorage.getItem('currentSessionId');

      if (sessionToken && sessionId) {
        navigator.sendBeacon(
          SUPER_ENDPOINT_URL,
          JSON.stringify({
            message: 'SYNC_CART',
            sessionId,
            sessionToken,
            cartItems: cart.map(item => ({
              product_id: item.id,
              product_name: item.name,
              brand: item.brand || '',
              quantity: item.quantity,
              unit_price: item.priceValue || parseFloat(item.price.replace(/[^\d.]/g, '')) || 0,
              image_url: item.image
            }))
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const priceValue = product.priceValue || parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
        return [...prevCart, { ...product, priceValue, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const itemPrice = item.priceValue || parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    setCart([]);
    sessionStorage.removeItem(CART_STORAGE_KEY);
    syncWithBackend(); // Sync empty cart to backend
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      getTotalPrice,
      getTotalItems,
      clearCart,
      syncWithBackend,
      isLoading,
      isSyncing
    }}>
      {children}
    </CartContext.Provider>
  );
};