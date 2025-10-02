import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, ShoppingCart, Star, Minus, Plus, X, ArrowLeft, History, Trash2, MessageSquare, Zap, Wrench, Droplets, Lightbulb, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCart, Product } from "@/components/CartContext";
import { useLocation } from "react-router-dom";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  products?: Product[];
  invoiceData?: any;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
  sessionToken?: string;
}

const ChatInterface = () => {
  const location = useLocation();  
  const [bottomOffset, setBottomOffset] = useState(0);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.visualViewport) {
      const onResize = () => {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const offset = windowHeight - viewportHeight;
        
        const keyboardVisible = offset > 100;
        setIsKeyboardVisible(keyboardVisible);
        
        // Position input above keyboard on mobile
        if (keyboardVisible && inputContainerRef.current) {
          const inputRect = inputContainerRef.current.getBoundingClientRect();
          const distanceFromBottom = windowHeight - inputRect.bottom;
          
          if (distanceFromBottom < offset) {
            inputContainerRef.current.style.transform = `translateY(-${offset}px)`;
          }
        } else if (inputContainerRef.current) {
          inputContainerRef.current.style.transform = 'translateY(0)';
        }
      };
      
      window.visualViewport.addEventListener("resize", onResize);
      window.visualViewport.addEventListener("scroll", onResize);
      
      return () => {
        window.visualViewport.removeEventListener("resize", onResize);
        window.visualViewport.removeEventListener("scroll", onResize);
      };
    }
  }, []);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  
  const [sessionToken, setSessionToken] = useState<string>(() => {
    return sessionStorage.getItem('sessionToken') || '';
  });
  
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const saved = sessionStorage.getItem('currentSessionId');
    return saved || 'initial_loading';
  });
  
  const [showQuickActions, setShowQuickActions] = useState(() => {
    const saved = sessionStorage.getItem('showQuickActions');
    return saved !== 'false';
  });
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = sessionStorage.getItem('chatSessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        lastActivity: new Date(session.lastActivity),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
    return [];
  });
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    if (sessionToken) {
      sessionStorage.setItem('sessionToken', sessionToken);
    }
  }, [sessionToken]);

  useEffect(() => {
    sessionStorage.setItem('currentSessionId', currentSessionId);
  }, [currentSessionId]);

  useEffect(() => {
    sessionStorage.setItem('showQuickActions', showQuickActions.toString());
  }, [showQuickActions]);

  useEffect(() => {
    sessionStorage.setItem('chatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentSession = chatSessions.find(session => session.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 128);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    const initializeSession = async () => {
      const initialSession = chatSessions.find(s => s.id === currentSessionId);
      
      const needsInitialization = 
        chatSessions.length === 0 ||
        currentSessionId === 'initial_loading' ||
        initialSession?.id === 'temp_initial' || 
        !initialSession?.sessionToken ||
        !sessionToken;
      
      if (needsInitialization) {
        try {
          setIsLoading(true);
          
          const response = await fetch('https://tlgjxxsscuyrauopinoz.supabase.co/functions/v1/dynamic-api', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZ2p4eHNzY3V5cmF1b3Bpbm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDk1NzQsImV4cCI6MjA3MzY4NTU3NH0.d3V1ZdSUronzivRV5MlJSU0dFkfHzFKhk-Qgtfikgd0'
            },
            body: JSON.stringify({
              message: 'GET_INITIAL_RECOMMENDATIONS',
              sessionId: null,
              sessionToken: null,
              isInitialLoad: true
            })
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.sessionId && data.sessionToken) {
              setCurrentSessionId(data.sessionId);
              setSessionToken(data.sessionToken);
              
              const welcomeMessage: Message = {
                id: Date.now().toString(),
                type: 'assistant',
                content: data.response || 'Welcome to AutoSpares Kenya! Here are some popular auto parts to get you started:',
                products: data.toolResults?.[0]?.result || [],
                timestamp: new Date()
              };

              setChatSessions([{
                id: data.sessionId,
                title: 'Welcome Chat',
                createdAt: new Date(),
                lastActivity: new Date(),
                sessionToken: data.sessionToken,
                messages: [welcomeMessage]
              }]);
              
              toast({
                title: "Session started",
                description: "AI assistant ready with product recommendations!",
              });
            }
          } else {
            throw new Error('Failed to initialize session');
          }
        } catch (error) {
          console.error('Error initializing session:', error);
          
          const fallbackSession: ChatSession = {
            id: `temp_${Date.now()}`,
            title: 'Welcome Chat',
            createdAt: new Date(),
            lastActivity: new Date(),
            sessionToken: '',
            messages: [
              {
                id: Date.now().toString(),
                type: 'assistant',
                content: "Hello! I'm your AI auto parts assistant. What auto parts are you looking for today?",
                timestamp: new Date()
              }
            ]
          };
          
          setChatSessions([fallbackSession]);
          setCurrentSessionId(fallbackSession.id);
          
          toast({
            title: "Connection issue",
            description: "Please try sending a message to reconnect.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeSession();
  }, []);

  const generateSessionTitle = (firstUserMessage: string): string => {
    const words = firstUserMessage.split(' ').slice(0, 6).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

  const startNewSession = async () => {
    const tempSessionId = `temp_${Date.now()}`;
    
    setCurrentSessionId(tempSessionId);
    setSessionToken('');
    setActiveTab("chat");
    setShowQuickActions(true);
    setIsLoading(true);
    
    try {
      const response = await fetch('https://tlgjxxsscuyrauopinoz.supabase.co/functions/v1/dynamic-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZ2p4eHNzY3V5cmF1b3Bpbm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDk1NzQsImV4cCI6MjA3MzY4NTU3NH0.d3V1ZdSUronzivRV5MlJSU0dFkfHzFKhk-Qgtfikgd0'
        },
        body: JSON.stringify({
          message: 'GET_INITIAL_RECOMMENDATIONS',
          sessionId: null,
          sessionToken: null,
          isInitialLoad: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.sessionId && data.sessionToken) {
          setSessionToken(data.sessionToken);
          setCurrentSessionId(data.sessionId);
          
          const newSession: ChatSession = {
            id: data.sessionId,
            title: 'New Chat',
            createdAt: new Date(),
            lastActivity: new Date(),
            sessionToken: data.sessionToken,
            messages: [
              {
                id: Date.now().toString(),
                type: 'assistant',
                content: data.response || 'Welcome to AutoSpares Kenya! Here are some popular auto parts:',
                products: data.toolResults?.[0]?.result || [],
                timestamp: new Date()
              }
            ]
          };
          
          setChatSessions(prev => [newSession, ...prev]);
          
          toast({
            title: "New chat started",
            description: "Fresh session with product recommendations!",
          });
        }
      }
    } catch (error) {
      console.error('Error creating new session:', error);
      
      const newSession: ChatSession = {
        id: tempSessionId,
        title: 'New Chat',
        createdAt: new Date(),
        lastActivity: new Date(),
        sessionToken: '',
        messages: [
          {
            id: Date.now().toString(),
            type: 'assistant',
            content: "Hello! I'm your AI auto parts assistant. What auto parts are you looking for today?",
            timestamp: new Date()
          }
        ]
      };
      
      setChatSessions(prev => [newSession, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (sessionId: string) => {
    if (chatSessions.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one chat session.",
        variant: "destructive"
      });
      return;
    }
    
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    
    if (sessionId === currentSessionId) {
      const remainingSessions = chatSessions.filter(session => session.id !== sessionId);
      setCurrentSessionId(remainingSessions[0]?.id || '');
    }
    
    toast({
      title: "Session deleted",
      description: "Chat session has been removed from history.",
    });
  };

  const switchToSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session?.sessionToken) {
      setSessionToken(session.sessionToken);
    } else {
      setSessionToken('');
    }
    setCurrentSessionId(sessionId);
    setActiveTab("chat");
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleAIResponse = async (userMessage: string): Promise<{ content: string; products?: Product[] }> => {
    const message = userMessage.toLowerCase();
    
    try {
      const email = sessionStorage.getItem('userEmail');
      const phone = sessionStorage.getItem('userPhone');
      
      const response = await fetch('https://tlgjxxsscuyrauopinoz.supabase.co/functions/v1/dynamic-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZ2p4eHNzY3V5cmF1b3Bpbm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMDk1NzQsImV4cCI6MjA3MzY4NTU3NH0.d3V1ZdSUronzivRV5MlJSU0dFkfHzFKhk-Qgtfikgd0'
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
          sessionToken: sessionToken || undefined,
          email: email || undefined,
          phone: phone || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.sessionId && data.sessionId !== currentSessionId) {
        const oldSessionId = currentSessionId;
        setCurrentSessionId(data.sessionId);
        
        setChatSessions(prev => prev.map(session => {
          if (session.id === oldSessionId) {
            return {
              ...session,
              id: data.sessionId
            };
          }
          return session;
        }));
      }
      
      if (data.sessionToken && data.sessionToken !== sessionToken) {
        setSessionToken(data.sessionToken);
        
        setChatSessions(prev => prev.map(session => {
          if (session.id === currentSessionId || session.id === data.sessionId) {
            return {
              ...session,
              sessionToken: data.sessionToken
            };
          }
          return session;
        }));
      }
      
      if (data.toolResults && data.toolResults.length > 0) {
        const productResults = data.toolResults.find((result: any) => 
          result.tool === 'search_products' || result.tool === 'get_products'
        );
        
        if (productResults && Array.isArray(productResults.result)) {
          const products = productResults.result.map((product: any) => ({
            id: product.id.toString(),
            name: product.name,
            brand: product.brand,
            price: `KSh ${product.price.toLocaleString()}`,
            image: product.image_url || '/src/assets/hero-parts.jpg',
            rating: product.rating || 4.5,
            description: product.description,
            category: product.category,
            inStock: product.in_stock !== false
          }));
          
          return {
            content: data.response,
            products: products
          };
        }
      }
      
      return {
        content: data.response || "I'm here to help you find auto parts! What specific parts are you looking for?"
      };
      
    } catch (error) {
      console.error('AI Response error:', error);
      
      if (message.includes('go to cart') || message.includes('navigate to cart') || message.includes('take me to cart') || message.includes('open cart')) {
        navigate('/cart');
        return {
          content: "Taking you to your cart now!"
        };
      }
      
      if (message.includes('go to checkout') || message.includes('navigate to checkout') || message.includes('take me to checkout') || message.includes('proceed to checkout') || message.includes('checkout now')) {
        navigate('/checkout');
        return {
          content: "Redirecting you to checkout!"
        };
      }
      
      if (message.includes('cart') || message.includes('shopping cart') || message.includes('my cart')) {
        if (cart.length === 0) {
          return {
            content: "Your cart is currently empty!\n\nStart shopping by asking me about auto parts you need. For example:\n• 'Show me brake pads for Toyota Corolla'\n• 'I need headlights for Honda Civic'\n• 'Find engine oil for BMW'\n\nI'll help you find the perfect parts for your vehicle!"
          };
        } else {
          const cartItems = cart.map(item => `• ${item.name} - ${item.price} (Qty: ${item.quantity})`).join('\n');
          const totalPrice = getTotalPrice();
          
          return {
            content: `Here's what's in your cart:\n\n${cartItems}\n\n**Total: KSh ${totalPrice.toLocaleString()}**\n\nReady to checkout or need to add more items?`
          };
        }
      }
      
      return {
        content: "I'm here to help you find auto parts! What specific parts are you looking for your vehicle? I can help you find brake pads, air filters, headlights, engine oil, and more."
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setChatSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        const updatedMessages = [...session.messages, userMessage];
        const title = session.title === 'New Chat' || session.title === 'Welcome Chat' 
          ? generateSessionTitle(inputValue)
          : session.title;
        
        return {
          ...session,
          title,
          messages: updatedMessages,
          lastActivity: new Date()
        };
      }
      return session;
    }));

    setInputValue("");
    setIsLoading(true);
    
    if (showQuickActions) {
      setShowQuickActions(false);
    }

    try {
      const aiResponse = await handleAIResponse(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse.content,
        products: aiResponse.products,
        timestamp: new Date()
      };

      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, assistantMessage],
            lastActivity: new Date()
          };
        }
        return session;
      }));
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      
      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, errorMessage],
            lastActivity: new Date()
          };
        }
        return session;
      }));
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue("");
    setShowQuickActions(false);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: suggestion,
      timestamp: new Date()
    };

    setChatSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        const updatedMessages = [...session.messages, userMessage];
        const title = session.title === 'New Chat' || session.title === 'Welcome Chat' 
          ? generateSessionTitle(suggestion)
          : session.title;
        
        return {
          ...session,
          title,
          messages: updatedMessages,
          lastActivity: new Date()
        };
      }
      return session;
    }));

    setIsLoading(true);

    try {
      const aiResponse = await handleAIResponse(suggestion);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse.content,
        products: aiResponse.products,
        timestamp: new Date()
      };

      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, assistantMessage],
            lastActivity: new Date()
          };
        }
        return session;
      }));
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      
      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, errorMessage],
            lastActivity: new Date()
          };
        }
        return session;
      }));
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-primary">autospares</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Find auto parts with AI-powered search</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {sessionToken && (
              <Badge variant="secondary" className="text-xs hidden md:flex">
                Session Active
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startNewSession}
              className="hidden sm:flex"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            
            <Button 
              variant={activeTab === "history" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveTab(activeTab === "history" ? "chat" : "history")}
            >
              <History className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">History</span>
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative text-xs sm:text-sm">
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Cart</span>
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-kenya-red text-white text-xs min-w-[18px] h-4 flex items-center justify-center rounded-full">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-96">
                <SheetHeader>
                  <SheetTitle>Shopping Cart ({getTotalItems()} items)</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto py-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Your cart is empty</p>
                        <p className="text-sm text-muted-foreground">Start chatting to find auto parts!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <Card key={item.id} className="p-4">
                            <div className="flex gap-3">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">{item.brand}</p>
                                <p className="font-semibold text-sm mt-1">{item.price}</p>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="text-sm min-w-[2ch] text-center">{item.quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-6 w-6 p-0 ml-auto text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {cart.length > 0 && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total:</span>
                        <span>KSh {getTotalPrice().toLocaleString()}</span>
                      </div>
                      <Button 
                        className="flex-1 max-w-xs btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => navigate('/checkout', { state: { cart, totalPrice: getTotalPrice() } })}
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      {activeTab === "chat" && showQuickActions && (
        <div className="border-b bg-muted/20 px-3 sm:px-6 py-3 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickActions(false)}
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-muted/50"
          >
            <X className="w-3 h-3" />
          </Button>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-14 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/10 border-primary/20 text-primary/80 hover:text-primary transition-all hover:scale-105 group"
                onClick={() => handleSuggestionClick("Show me brake pads")}
                disabled={isLoading}
              >
                <Wrench className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium">Brake Pads</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-14 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/10 border-primary/20 text-primary/80 hover:text-primary transition-all hover:scale-105 group"
                onClick={() => handleSuggestionClick("Engine oil options")}
                disabled={isLoading}
              >
                <Droplets className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium">Engine Oil</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-14 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/10 border-primary/20 text-primary/80 hover:text-primary transition-all hover:scale-105 group"
                onClick={() => handleSuggestionClick("LED headlights")}
                disabled={isLoading}
              >
                <Lightbulb className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium">Headlights</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-14 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/10 border-primary/20 text-primary/80 hover:text-primary transition-all hover:scale-105 group"
                onClick={() => handleSuggestionClick("Air filters")}
                disabled={isLoading}
              >
                <Wind className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium">Air Filters</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsContent value="chat" className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-28 m-0">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'assistant' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-hero rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[85%] sm:max-w-2xl ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    
                    {/* Product Cards */}
                    {message.products && message.products.length > 0 && (
                      <div className="grid gap-3 sm:gap-4 mt-3 sm:mt-4 w-full">
                        {message.products.map((product) => (
                          <Card 
                            key={product.id} 
                            className="bg-card border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex gap-3 sm:gap-4">
                                <div className="relative">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg group-hover:scale-105 transition-transform duration-200"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1 gap-2">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base truncate">{product.name}</h3>
                                      <p className="text-xs sm:text-sm text-premium-green font-medium">{product.brand}</p>
                                    </div>
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs whitespace-nowrap transition-all ${product.inStock ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                                    >
                                      {product.inStock ? "In Stock" : "Out of Stock"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 text-warning fill-current transition-colors" />
                                      <span className="text-sm font-medium">{product.rating}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">{product.category}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold text-primary">{product.price}</span>
                                    </div>
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                      <Button 
                                        size="sm" 
                                        className="btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => handleAddToCart(product)}
                                        disabled={!product.inStock}
                                      >
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        {product.inStock ? "Add to Cart" : "Out of Stock"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-premium rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-button transition-all hover:scale-110">
                      <User className="w-3 h-3 sm:w-5 sm:h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start animate-fade-in">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-button">
                    <Bot className="w-3 h-3 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <div className="bg-card rounded-lg px-4 py-3 shadow-card border border-border">
                    <div className="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-hidden m-0">
            <div className="h-full flex flex-col">
              <div className="border-b px-3 sm:px-6 py-3 sm:py-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Chat History</h2>
                  <Button variant="outline" size="sm" onClick={startNewSession}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-3 sm:p-6">
                <div className="space-y-3">
                  {chatSessions
                    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
                    .map((session) => (
                      <Card 
                        key={session.id} 
                        className={`cursor-pointer card-interactive animate-fade-in ${
                          session.id === currentSessionId ? 'ring-2 ring-primary bg-gradient-card shadow-button' : 'hover:shadow-card'
                        }`}
                        onClick={() => switchToSession(session.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-primary truncate mb-1">
                                {session.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {session.messages.length} messages
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Last activity: {new Date(session.lastActivity).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{new Date(session.lastActivity).toLocaleTimeString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {session.id === currentSessionId && (
                                <Badge variant="secondary" className="text-xs">
                                  Active
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive transition-all hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Input Area - Fixed/Sticky */}
      {/* Clean Input Area - ChatGPT Style */}
      <div 
        className="sticky bottom-0 left-0 right-0 bg-background px-3 sm:px-4 py-3 sm:py-4 z-50" 
        style={{ marginBottom: `${bottomOffset}px` }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-background border border-input rounded-3xl shadow-sm hover:shadow-md transition-shadow focus-within:border-primary focus-within:shadow-md">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message autospares..."
              className="w-full resize-none border-0 bg-transparent px-4 py-3 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed min-h-[52px] max-h-32 overflow-y-auto placeholder:text-muted-foreground/60"
              disabled={isLoading || activeTab !== "chat"}
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={
                !inputValue.trim() ||
                isLoading ||
                inputValue.length > 500 ||
                activeTab !== "chat"
              }
              className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all"
              size="sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center mt-2">
            ask for brakes, batteries and tires
          </p>
        </div>
      </div>
       </div>
  );
};

export default ChatInterface;