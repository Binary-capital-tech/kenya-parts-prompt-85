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
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  clearCart: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  isConnected: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'autospares_cart';
const WS_URL = 'wss://tlgjxxsscuyrauopinoz.supabase.co/functions/v1/super-endpoint';
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
  const [isConnected, setIsConnected] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const realtimeChannelRef = useRef<any>(null);
  const isSelfUpdateRef = useRef(false);

  // Get session info
  const getSessionInfo = () => {
    return {
      sessionToken: sessionStorage.getItem('sessionToken'),
      sessionId: sessionStorage.getItem('currentSessionId')
    };
  };

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

  // Load cart from backend via HTTP
  const loadCartFromBackend = useCallback(async () => {
    try {
      const { sessionToken, sessionId } = getSessionInfo();

      if (!sessionToken || !sessionId) {
        const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
        return;
      }

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
      const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    }
  }, []);

  // WebSocket connection setup
  const connectWebSocket = useCallback(() => {
    const { sessionToken, sessionId } = getSessionInfo();

    if (!sessionToken || !sessionId) {
      console.log('No session, skipping WebSocket connection');
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(`${WS_URL}?sessionId=${sessionId}&sessionToken=${sessionToken}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Send initial handshake
        ws.send(JSON.stringify({
          type: 'HANDSHAKE',
          sessionId,
          sessionToken
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          switch (message.type) {
            case 'CART_UPDATED':
              // Cart was updated by another client or AI
              if (message.cart?.items) {
                const frontendCart = convertBackendToFrontend(message.cart.items);
                setCart(frontendCart);
                sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(frontendCart));
              }
              break;

            case 'ITEM_ADDED':
            case 'ITEM_UPDATED':
            case 'ITEM_REMOVED':
            case 'CART_CLEARED':
              // Reload cart on any cart operation
              loadCartFromBackend();
              break;

            case 'PONG':
              // Keep-alive response
              break;

            case 'ERROR':
              console.error('WebSocket error message:', message.error);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
    }
  }, [loadCartFromBackend]);

  // Send message via WebSocket with fallback to HTTP
  const sendWebSocketMessage = useCallback(async (message: any) => {
    const { sessionToken, sessionId } = getSessionInfo();

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Send via WebSocket
      wsRef.current.send(JSON.stringify({
        ...message,
        sessionId,
        sessionToken
      }));
      return true;
    } else {
      // Fallback to HTTP
      console.log('WebSocket not available, using HTTP fallback');
      return false;
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

  // Setup WebSocket connection after initial load
  useEffect(() => {
    if (hasInitialLoad) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [hasInitialLoad, connectWebSocket]);

  // Setup Supabase Realtime as backup
  useEffect(() => {
    const { sessionId } = getSessionInfo();
    
    if (!sessionId || !hasInitialLoad) return;

    const channel = supabase
      .channel('cart-realtime-backup')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_cart_items',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          console.log('Supabase realtime change (backup):', payload);
          
          if (isSelfUpdateRef.current) {
            isSelfUpdateRef.current = false;
            return;
          }
          
          // Only reload if WebSocket is not connected
          if (!isConnected) {
            await loadCartFromBackend();
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [hasInitialLoad, isConnected, loadCartFromBackend]);

  // Save to sessionStorage whenever cart changes
  useEffect(() => {
    if (hasInitialLoad) {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, hasInitialLoad]);

  // WebSocket keep-alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Add to cart
  const addToCart = async (product: Product) => {
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

    try {
      const { sessionToken, sessionId } = getSessionInfo();

      if (!sessionToken || !sessionId) {
        return;
      }

      setIsSyncing(true);
      isSelfUpdateRef.current = true;

      const priceValue = product.priceValue || parseFloat(product.price.replace(/[^\d.]/g, '')) || 0;
      
      const item = {
        product_id: product.id,
        product_name: product.name,
        brand: product.brand || '',
        quantity: 1,
        unit_price: priceValue,
        image_url: product.image
      };

      // Try WebSocket first
      const sentViaWS = await sendWebSocketMessage({
        type: 'ADD_TO_CART',
        item
      });

      // Fallback to HTTP if WebSocket failed
      if (!sentViaWS) {
        const response = await fetch(SUPER_ENDPOINT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_TOKEN
          },
          body: JSON.stringify({
            message: 'ADD_TO_CART',
            sessionId,
            sessionToken,
            item
          })
        });

        if (!response.ok) {
          throw new Error('Failed to add item');
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      isSelfUpdateRef.current = false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Remove from cart
  const removeFromCart = async (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));

    try {
      const { sessionToken, sessionId } = getSessionInfo();

      if (!sessionToken || !sessionId) return;

      setIsSyncing(true);
      isSelfUpdateRef.current = true;

      const sentViaWS = await sendWebSocketMessage({
        type: 'REMOVE_FROM_CART',
        product_id: productId
      });

      if (!sentViaWS) {
        await fetch(SUPER_ENDPOINT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_TOKEN
          },
          body: JSON.stringify({
            message: 'REMOVE_FROM_CART',
            sessionId,
            sessionToken,
            product_id: productId
          })
        });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      isSelfUpdateRef.current = false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Update quantity
  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );

    try {
      const { sessionToken, sessionId } = getSessionInfo();

      if (!sessionToken || !sessionId) return;

      setIsSyncing(true);
      isSelfUpdateRef.current = true;

      const sentViaWS = await sendWebSocketMessage({
        type: 'UPDATE_QUANTITY',
        product_id: productId,
        quantity: newQuantity
      });

      if (!sentViaWS) {
        await fetch(SUPER_ENDPOINT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_TOKEN
          },
          body: JSON.stringify({
            message: 'UPDATE_QUANTITY',
            sessionId,
            sessionToken,
            product_id: productId,
            quantity: newQuantity
          })
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      isSelfUpdateRef.current = false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    setCart([]);
    sessionStorage.removeItem(CART_STORAGE_KEY);

    try {
      const { sessionToken, sessionId } = getSessionInfo();

      if (!sessionToken || !sessionId) return;

      setIsSyncing(true);
      isSelfUpdateRef.current = true;

      const sentViaWS = await sendWebSocketMessage({
        type: 'CLEAR_CART'
      });

      if (!sentViaWS) {
        await fetch(SUPER_ENDPOINT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_TOKEN
          },
          body: JSON.stringify({
            message: 'CLEAR_CART',
            sessionId,
            sessionToken
          })
        });
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      isSelfUpdateRef.current = false;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncWithBackend = async () => {
    await loadCartFromBackend();
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
      isSyncing,
      isConnected
    }}>
      {children}
    </CartContext.Provider>
  );
};