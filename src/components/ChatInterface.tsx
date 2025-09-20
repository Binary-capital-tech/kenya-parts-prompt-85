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
import brakePartsImage from "@/assets/brake-parts.jpg";
import headlightImage from "@/assets/headlight.jpg";
import airFilterImage from "@/assets/air-filter.jpg";
import oilsImage from "@/assets/oils.jpg";

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
}

const sampleProducts = {
  brake: [
    {
      id: "1",
      name: "Premium Brake Disc & Pads Set",
      brand: "Brembo",
      price: 8500,
      originalPrice: 12000,
      image: brakePartsImage,
      rating: 4.8,
      description: "High-performance brake discs and pads for excellent stopping power",
      category: "Brake System",
      inStock: true
    },
    {
      id: "11",
      name: "Ceramic Brake Pads",
      brand: "Akebono",
      price: 4200,
      image: brakePartsImage,
      rating: 4.6,
      description: "Low-dust ceramic brake pads for quiet operation",
      category: "Brake System",
      inStock: true
    },
    {
      id: "12",
      name: "Sports Brake Discs",
      brand: "EBC",
      price: 6800,
      originalPrice: 8500,
      image: brakePartsImage,
      rating: 4.9,
      description: "Slotted and drilled brake discs for enhanced cooling",
      category: "Brake System",
      inStock: false
    }
  ],
  filter: [
    {
      id: "2",
      name: "High Performance Air Filter",
      brand: "K&N",
      price: 2800,
      originalPrice: 3500,
      image: airFilterImage,
      rating: 4.7,
      description: "Reusable high-flow air filter for improved performance",
      category: "Engine",
      inStock: true
    },
    {
      id: "21",
      name: "OEM Air Filter",
      brand: "Mann Filter",
      price: 1500,
      image: airFilterImage,
      rating: 4.5,
      description: "Original equipment quality air filter",
      category: "Engine",
      inStock: true
    },
    {
      id: "22",
      name: "Carbon Cabin Filter",
      brand: "Bosch",
      price: 3200,
      image: airFilterImage,
      rating: 4.8,
      description: "Activated carbon cabin air filter for clean air",
      category: "Interior",
      inStock: true
    }
  ],
  headlight: [
    {
      id: "3",
      name: "LED Headlight Assembly",
      brand: "Philips",
      price: 15500,
      image: headlightImage,
      rating: 4.9,
      description: "Premium LED headlight with excellent brightness and longevity",
      category: "Lighting",
      inStock: true
    },
    {
      id: "31",
      name: "Halogen Headlight Bulbs",
      brand: "Osram",
      price: 2400,
      image: headlightImage,
      rating: 4.4,
      description: "High-quality halogen bulbs for standard headlights",
      category: "Lighting",
      inStock: true
    },
    {
      id: "32",
      name: "HID Xenon Kit",
      brand: "Hella",
      price: 8900,
      originalPrice: 11500,
      image: headlightImage,
      rating: 4.7,
      description: "Complete HID conversion kit for brighter lighting",
      category: "Lighting",
      inStock: true
    }
  ],
  oil: [
    {
      id: "4",
      name: "Full Synthetic Engine Oil",
      brand: "Mobil 1",
      price: 6200,
      image: oilsImage,
      rating: 4.8,
      description: "Premium full synthetic motor oil for maximum protection",
      category: "Fluids",
      inStock: true
    },
    {
      id: "41",
      name: "Conventional Motor Oil",
      brand: "Castrol",
      price: 3800,
      image: oilsImage,
      rating: 4.5,
      description: "High-quality conventional motor oil for everyday driving",
      category: "Fluids",
      inStock: true
    },
    {
      id: "42",
      name: "Transmission Fluid",
      brand: "Valvoline",
      price: 4500,
      image: oilsImage,
      rating: 4.6,
      description: "Premium automatic transmission fluid for smooth shifting",
      category: "Fluids",
      inStock: true
    }
  ]
};

const ChatInterface = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessionStorage.getItem('currentSessionId') || '1';
  });
  const [showQuickActions, setShowQuickActions] = useState(() => {
    return sessionStorage.getItem('showQuickActions') !== 'false';
  });
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const saved = sessionStorage.getItem('chatSessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert timestamp and lastActivity back to Date objects
      return parsed.map((session: any) => ({
        ...session,
        lastActivity: new Date(session.lastActivity),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
    return [
    {
      id: '1',
      title: 'Welcome Chat',
      createdAt: new Date(),
      lastActivity: new Date(),
      messages: [
        {
          id: '1',
          type: 'assistant',
          content: "Browse our top auto parts categories:",
          products: [
            sampleProducts.brake[0],
            sampleProducts.headlight[0], 
            sampleProducts.oil[0],
            sampleProducts.filter[0]
          ],
          timestamp: new Date()
        }
      ]
    },
    {
      id: '2',
      title: 'Toyota Corolla Brake Pads',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      lastActivity: new Date(Date.now() - 86400000),
      messages: [
        {
          id: '2-1',
          type: 'assistant',
          content: "Hello! I'm your AI auto parts assistant. What auto parts are you looking for today?",
          timestamp: new Date(Date.now() - 86400000)
        },
        {
          id: '2-2',
          type: 'user',
          content: 'I need brake pads for my Toyota Corolla 2018',
          timestamp: new Date(Date.now() - 86400000 + 30000)
        },
        {
          id: '2-3',
          type: 'assistant',
          content: 'I found excellent brake pad options for your 2018 Toyota Corolla. Here are the top recommendations:',
          timestamp: new Date(Date.now() - 86400000 + 60000),
          products: [sampleProducts.brake[0], sampleProducts.brake[1]]
        }
      ]
    },
    {
      id: '3',
      title: 'Honda Civic Headlights',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      lastActivity: new Date(Date.now() - 172800000),
      messages: [
        {
          id: '3-1',
          type: 'assistant',
          content: "Hello! I'm your AI auto parts assistant. What auto parts are you looking for today?",
          timestamp: new Date(Date.now() - 172800000)
        },
        {
          id: '3-2',
          type: 'user',
          content: 'Show me headlights for Honda Civic 2020',
          timestamp: new Date(Date.now() - 172800000 + 45000)
        },
        {
          id: '3-3',
          type: 'assistant',
          content: 'Perfect! Here are premium headlight options for your 2020 Honda Civic:',
          timestamp: new Date(Date.now() - 172800000 + 90000),
          products: [sampleProducts.headlight[0], sampleProducts.headlight[1]]
        }
      ]
    },
    {
      id: '4',
      title: 'BMW Engine Oil Change',
      createdAt: new Date(Date.now() - 259200000), // 3 days ago
      lastActivity: new Date(Date.now() - 259200000),
      messages: [
        {
          id: '4-1',
          type: 'assistant',
          content: "Hello! I'm your AI auto parts assistant. What auto parts are you looking for today?",
          timestamp: new Date(Date.now() - 259200000)
        },
        {
          id: '4-2',
          type: 'user',
          content: 'I need engine oil for BMW X3 2019, full synthetic',
          timestamp: new Date(Date.now() - 259200000 + 60000)
        },
        {
          id: '4-3',
          type: 'assistant',
          content: 'Excellent choice! Here are premium full synthetic oils perfect for your 2019 BMW X3:',
          timestamp: new Date(Date.now() - 259200000 + 120000),
          products: [sampleProducts.oil[0], sampleProducts.oil[1]]
        },
        {
          id: '4-4',
          type: 'user',
          content: 'Generate invoice for the Mobil 1 oil',
          timestamp: new Date(Date.now() - 259200000 + 180000)
        },
        {
          id: '4-5',
          type: 'assistant',
          content: 'Perfect! I\'ve generated your invoice. Click the button below to view and download it.',
          timestamp: new Date(Date.now() - 259200000 + 240000),
          invoiceData: {
            id: 'INV-2024-001',
            date: new Date(Date.now() - 259200000 + 240000),
            status: 'paid',
            total: 89.99,
            product: sampleProducts.oil[0],
            customer: {
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@email.com',
              phone: '+254 722 123 456',
              address: '123 Westlands Avenue',
              city: 'Nairobi',
              postalCode: '00100'
            }
          }
        }
      ]
    },
    {
      id: '5',
      title: 'Air Filter Replacement',
      createdAt: new Date(Date.now() - 432000000), // 5 days ago
      lastActivity: new Date(Date.now() - 432000000),
      messages: [
        {
          id: '5-1',
          type: 'assistant',
          content: "Hello! I'm your AI auto parts assistant. What auto parts are you looking for today?",
          timestamp: new Date(Date.now() - 432000000)
        },
        {
          id: '5-2',
          type: 'user',
          content: 'My car needs an air filter replacement, it\'s a Nissan Altima 2017',
          timestamp: new Date(Date.now() - 432000000 + 90000)
        },
        {
          id: '5-3',
          type: 'assistant',
          content: 'Great! Here are high-quality air filters that will fit your 2017 Nissan Altima perfectly:',
          timestamp: new Date(Date.now() - 432000000 + 150000),
          products: [sampleProducts.filter[0], sampleProducts.filter[1]]
        }
      ]
    }
  ]});
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  // Save state to sessionStorage to persist across navigation
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

  const generateSessionTitle = (firstUserMessage: string): string => {
    const words = firstUserMessage.split(' ').slice(0, 6).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

  const startNewSession = () => {
    const newSessionId = Date.now().toString();
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      createdAt: new Date(),
      lastActivity: new Date(),
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
    setCurrentSessionId(newSessionId);
    setActiveTab("chat");
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

  const simulateAIResponse = async (userMessage: string): Promise<{ content: string; products?: Product[] }> => {
    const message = userMessage.toLowerCase();
    
    try {
      // Call Gemini AI backend with MCP
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSessionId,
          userToken: `token_${Date.now()}`,
          email: 'kalphaxide@gmail.com',
          phone: '+254722000000'
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // If we have tool results with products, format them
      if (data.toolResults && data.toolResults.length > 0) {
        const productResults = data.toolResults.find((result: any) => 
          result.tool === 'search_products' || result.tool === 'get_products'
        );
        
        if (productResults && Array.isArray(productResults.result)) {
          const products = productResults.result.map((product: any) => ({
            id: product.id.toString(),
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: brakePartsImage, // Default image for now
            rating: product.rating,
            description: product.description,
            category: product.category,
            inStock: product.inStock
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
      
      // Fallback to local logic
      // Handle navigation requests
      if (message.includes('go to cart') || message.includes('navigate to cart') || message.includes('take me to cart') || message.includes('open cart')) {
        navigate('/cart');
        return {
          content: "Taking you to your cart now! 🛒"
        };
      }
      
      if (message.includes('go to checkout') || message.includes('navigate to checkout') || message.includes('take me to checkout') || message.includes('proceed to checkout') || message.includes('checkout now')) {
        navigate('/checkout');
        return {
          content: "Redirecting you to checkout! 💳"
        };
      }
      
      // Handle cart request
      if (message.includes('cart') || message.includes('shopping cart') || message.includes('my cart')) {
        if (cart.length === 0) {
          return {
            content: "Your cart is currently empty! 🛒\n\nStart shopping by asking me about auto parts you need. For example:\n• 'Show me brake pads for Toyota Corolla'\n• 'I need headlights for Honda Civic'\n• 'Find engine oil for BMW'\n\nI'll help you find the perfect parts for your vehicle!\n\n💡 **Quick Commands:**\n• Say 'go to cart' to view your cart\n• Say 'go to checkout' to proceed to checkout"
          };
        } else {
          const cartItems = cart.map(item => `• ${item.name} - KSh ${item.price.toLocaleString()} (Qty: ${item.quantity})`).join('\n');
          const totalPrice = getTotalPrice();
          
          return {
            content: `Here's what's in your cart: 🛒\n\n${cartItems}\n\n**Total: KSh ${totalPrice.toLocaleString()}**\n\nReady to checkout or need to add more items?\n\n💡 **Quick Commands:**\n• Say 'go to cart' to view your cart\n• Say 'go to checkout' to proceed to checkout`
          };
        }
      }
      
      // Handle product search with fallback
      if (message.includes('brake')) {
        return {
          content: "I found some excellent brake parts for you:",
          products: sampleProducts.brake
        };
      }
      
      if (message.includes('filter') || message.includes('air')) {
        return {
          content: "Here are some great air filter options:",
          products: sampleProducts.filter
        };
      }
      
      if (message.includes('headlight') || message.includes('light')) {
        return {
          content: "Check out these headlight options:",
          products: sampleProducts.headlight
        };
      }
      
      if (message.includes('oil') || message.includes('engine')) {
        return {
          content: "Here are premium oil options for your vehicle:",
          products: sampleProducts.oil
        };
      }
      
      // Default response
      return {
        content: "I'm here to help you find auto parts! What specific parts are you looking for your vehicle? I can help you find brake pads, air filters, headlights, engine oil, and more."
      };
    }
    
    // Handle invoice request with example
    if (message.includes('invoice')) {
      const exampleOrder = {
        id: "INV-2024-001",
        date: new Date().toISOString(),
        status: "paid",
        customer: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "+254 700 123 456",
          address: "123 Kenyatta Avenue",
          city: "Nairobi",
          postalCode: "00100"
        },
        product: {
          id: "1",
          name: "Premium Brake Disc & Pads Set",
          brand: "Brembo",
          price: 8500,
          image: brakePartsImage,
          category: "Brake System"
        },
        total: 9000
      };
      
      // Navigate to invoice page with example data
      setTimeout(() => {
        navigate('/invoice', { state: { order: exampleOrder } });
      }, 1000);
      
      return {
        content: "Here's an example invoice for your reference. I'm generating a sample invoice now to show you the format and details we provide for all orders."
      };
    }
    
    // Handle multiple keywords and broader search terms
    if (message.includes('brake') || message.includes('pad') || message.includes('disc') || message.includes('stop')) {
      return {
        content: "I found several brake options from different brands! Here are some premium brake components that would be perfect for your vehicle:",
        products: sampleProducts.brake
      };
    } else if (message.includes('filter') || message.includes('air') || message.includes('cabin') || message.includes('engine')) {
      return {
        content: "Great choice! Here are different types of air filters from various brands. Each offers different benefits for your engine:",
        products: sampleProducts.filter
      };
    } else if (message.includes('headlight') || message.includes('light') || message.includes('led') || message.includes('bulb') || message.includes('lamp')) {
      return {
        content: "I have several lighting options from top brands. From LED to HID, here are some excellent headlight solutions:",
        products: sampleProducts.headlight
      };
    } else if (message.includes('oil') || message.includes('fluid') || message.includes('synthetic') || message.includes('motor') || message.includes('transmission')) {
      return {
        content: "Here are different types of oils and fluids from trusted brands to keep your engine running smoothly:",
        products: sampleProducts.oil
      };
    } else if (message.includes('spark') || message.includes('plug')) {
      return {
        content: "Here are some quality spark plugs and ignition components:",
        products: sampleProducts.filter // Using filter as placeholder for spark plugs
      };
    } else if (message.includes('battery') || message.includes('power')) {
      return {
        content: "Here are reliable battery options for your vehicle:",
        products: sampleProducts.brake // Using brake as placeholder for batteries
      };
    } else {
      return {
        content: "I can help you find auto parts! Please specify what you're looking for. For example:\n\n• Brake pads or discs\n• Air filters\n• Engine oil\n• Headlights\n• Spark plugs\n• Battery\n• Invoice (to see an example)\n\nJust tell me your vehicle make, model, and year if you know it, and what part you need!"
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

    // Update current session with new message
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
    
    // Hide quick actions after first user message
    if (showQuickActions) {
      setShowQuickActions(false);
    }

    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse = simulateAIResponse(inputValue);
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
      
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getDynamicSuggestions = () => {
    const suggestions = [];
    
    // Always available suggestions
    suggestions.push({ text: "Show me brake pads", icon: "🔧" });
    suggestions.push({ text: "Engine oil options", icon: "🛢️" });
    
    // Context-based suggestions
    if (cart.length > 0) {
      suggestions.push({ text: "Generate invoice", icon: "📄" });
      suggestions.push({ text: "View my cart", icon: "🛒" });
    }
    
    // Recent chat context suggestions
    const recentMessages = messages.slice(-3);
    const hasDiscussedBrakes = recentMessages.some(m => m.content.toLowerCase().includes('brake'));
    const hasDiscussedLights = recentMessages.some(m => m.content.toLowerCase().includes('light'));
    
    if (hasDiscussedBrakes) {
      suggestions.push({ text: "Show brake discs", icon: "⚙️" });
    }
    if (hasDiscussedLights) {
      suggestions.push({ text: "LED headlights", icon: "💡" });
    }
    
    // Add more suggestions based on popular parts
    if (suggestions.length < 6) {
      suggestions.push({ text: "Air filters", icon: "🌪️" });
      suggestions.push({ text: "Spark plugs", icon: "⚡" });
    }
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowQuickActions(false); // Hide quick actions after first use
    handleSendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/95 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4">
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
            {/* New Chat Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={startNewSession}
              className="hidden sm:flex"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            
            {/* History Tab Toggle */}
            <Button 
              variant={activeTab === "history" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveTab(activeTab === "history" ? "chat" : "history")}
            >
              <History className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">History</span>
            </Button>
            
            {/* Cart */}
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
                        className="w-full bg-primary hover:bg-primary/90"
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

      {/* Quick Action Buttons - 2x2 Grid */}
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

      {/* Main Content */}
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
                                    {product.originalPrice && (
                                      <Badge className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-kenya-red text-white text-xs">
                                        Sale
                                      </Badge>
                                    )}
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
                                        {product.originalPrice && (
                                          <span className="text-sm text-muted-foreground line-through">
                                            {product.originalPrice}
                                          </span>
                                        )}
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
                    
                    {/* Enhanced Cart Quick Action Button - positioned at bottom of response */}
                    {message.content.toLowerCase().includes('cart') && cart.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/50 animate-fade-in">
                        <Button
                          onClick={() => navigate('/cart')}
                          className="btn-premium flex items-center gap-2"
                          size="sm"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Go to Cart
                        </Button>
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
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md px-3 sm:px-4 py-3 sm:py-4 shadow-floating">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask for auto parts... Try 'brake pads', 'headlights', or 'invoice'"
                className="w-full min-h-[44px] max-h-32 resize-none pr-16 bg-background border-border focus:border-primary transition-colors text-sm leading-relaxed"
                disabled={isLoading || activeTab !== "chat"}
                rows={1}
                style={{ 
                  height: '44px',
                  overflowY: inputValue.split('\n').length > 2 ? 'auto' : 'hidden'
                }}
              />
              {/* Character count for UX */}
              {inputValue.length > 100 && (
                <div className="absolute bottom-2 right-16 text-xs text-muted-foreground bg-background/80 px-1 rounded">
                  {inputValue.length}/500
                </div>
              )}
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isLoading || inputValue.length > 500 || activeTab !== "chat"}
              className="btn-premium self-end shrink-0 h-11 px-3 sm:px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              size="sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {activeTab === "chat" 
                ? "Type auto parts, ask questions, or say \"invoice\" for an example"
                : "Switch to Chat tab to send messages"
              }
            </p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <kbd className="bg-muted px-1.5 py-0.5 rounded border">↵</kbd>
              <span>to send</span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded border">Shift</kbd>
              <span>+</span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded border">↵</kbd>
              <span className="hidden sm:inline">new line</span>
            </div>
          </div>
        </div>
        
        {/* Chat Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            onClick={() => navigate('/cart')}
            className="flex-1 bg-primary hover:bg-primary/90"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Go to Cart {getTotalItems() > 0 && `(${getTotalItems()})`}
          </Button>
          <Button
            onClick={() => navigate('/invoice')}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            Download Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;