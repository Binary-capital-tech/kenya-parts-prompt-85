import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Bot, User, ShoppingCart, Star, Plus, Download, FileText } from 'lucide-react';
import { useCart, Product } from '@/components/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import brakePartsImage from '@/assets/brake-parts.jpg';
import airFilterImage from '@/assets/air-filter.jpg';
import headlightImage from '@/assets/headlight.jpg';
import oilsImage from '@/assets/oils.jpg';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  products?: Product[];
}

interface ChatResponse {
  content: string;
  products?: Product[];
}

const sampleProducts = {
  brake: [
    {
      id: "1",
      name: "Premium Brake Disc Set",
      brand: "Brembo",
      price: "KSh 8,500",
      originalPrice: "KSh 12,000",
      image: brakePartsImage,
      rating: 4.8,
      description: "High-performance brake discs for excellent stopping power and durability.",
      category: "Brake System",
      inStock: true
    },
    {
      id: "9",
      name: "Ceramic Brake Pads",
      brand: "Akebono",
      price: "KSh 4,200",
      image: brakePartsImage,
      rating: 4.6,
      description: "Low-dust ceramic brake pads for smooth, quiet braking.",
      category: "Brake System",
      inStock: true
    }
  ],
  filter: [
    {
      id: "2",
      name: "High-Flow Air Filter",
      brand: "K&N",
      price: "KSh 3,200",
      originalPrice: "KSh 4,500",
      image: airFilterImage,
      rating: 4.7,
      description: "Reusable air filter that increases airflow and improves engine performance.",
      category: "Engine",
      inStock: true
    },
    {
      id: "10",
      name: "Cabin Air Filter",
      brand: "Mann-Filter",
      price: "KSh 1,800",
      image: airFilterImage,
      rating: 4.4,
      description: "High-quality cabin air filter for clean interior air.",
      category: "HVAC",
      inStock: true
    }
  ],
  headlight: [
    {
      id: "3",
      name: "LED Headlight Kit",
      brand: "Philips",
      price: "KSh 5,800",
      image: headlightImage,
      rating: 4.9,
      description: "Ultra-bright LED headlights with 6000K color temperature for enhanced visibility.",
      category: "Lighting",
      inStock: true
    }
  ],
  oil: [
    {
      id: "4",
      name: "Synthetic Engine Oil 5W-30",
      brand: "Mobil 1",
      price: "KSh 2,800",
      image: oilsImage,
      rating: 4.8,
      description: "Advanced full synthetic motor oil for superior engine protection.",
      category: "Fluids",
      inStock: true
    },
    {
      id: "11",
      name: "Transmission Fluid ATF",
      brand: "Valvoline",
      price: "KSh 3,200",
      originalPrice: "KSh 4,000",
      image: oilsImage,
      rating: 4.5,
      description: "Premium automatic transmission fluid for smooth shifting.",
      category: "Fluids",
      inStock: true
    }
  ]
};

const ChatInterface: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AutoSpares assistant. I can help you find the perfect auto parts for your vehicle. What can I help you with today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToCart, getTotalItems } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateChatResponse = async (message: string): Promise<ChatResponse> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMessage = message.toLowerCase();
    
    // Handle invoice request
    if (lowerMessage.includes('invoice') || lowerMessage.includes('receipt') || lowerMessage.includes('sample order')) {
      // Generate sample order data for invoice
      const sampleOrderData = {
        orderNumber: `ORD-${Date.now()}`,
        orderItems: [
          { id: "1", name: "Premium Brake Disc Set", quantity: 2, price: 8500 },
          { id: "3", name: "LED Headlight Kit", quantity: 1, price: 5800 }
        ],
        subtotal: 22800,
        shipping: 500,
        tax: 3648,
        total: 26948,
        customerInfo: {
          fullName: "John Doe",
          email: "kalphaxide@gmail.com",
          phone: "+254 700 000 000",
          address: "123 Moi Avenue",
          city: "Nairobi",
          postalCode: "00100"
        },
        paymentStatus: 'paid' as const
      };

      // Navigate to invoice page
      setTimeout(() => {
        navigate('/invoice', { state: sampleOrderData });
      }, 2000);

      return {
        content: "I'll generate a sample invoice for you! This shows how your order confirmation and invoice will look. Redirecting you to the invoice page..."
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
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await generateChatResponse(inputMessage);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        products: response.products
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="w-64 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="relative mb-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-32 object-cover rounded-lg"
          />
          {product.originalPrice && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
              Save {Math.round(((parseInt(product.originalPrice.replace(/[^\d]/g, '')) - parseInt(product.price.replace(/[^\d]/g, ''))) / parseInt(product.originalPrice.replace(/[^\d]/g, ''))) * 100)}%
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">{product.brand}</Badge>
          </div>
          
          <h4 className="font-medium text-sm leading-tight">{product.name}</h4>
          
          {product.rating && (
            <div className="flex items-center gap-1">
              {renderStars(product.rating)}
              <span className="text-xs text-muted-foreground">({product.rating})</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-primary">{product.price}</span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through ml-1">
                  {product.originalPrice}
                </span>
              )}
            </div>
          </div>
          
          <Button
            onClick={() => handleAddToCart(product)}
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const handleGoToCart = () => {
    navigate('/cart');
    setIsOpen(false);
  };

  const handleDownloadInvoice = () => {
    // Generate sample order data for invoice download
    const sampleOrderData = {
      orderNumber: `ORD-${Date.now()}`,
      orderItems: [
        { id: "1", name: "Premium Brake Disc Set", quantity: 2, price: 8500 },
        { id: "3", name: "LED Headlight Kit", quantity: 1, price: 5800 }
      ],
      subtotal: 22800,
      shipping: 500,
      tax: 3648,
      total: 26948,
      customerInfo: {
        fullName: "John Doe",
        email: "kalphaxide@gmail.com",
        phone: "+254 700 000 000",
        address: "123 Moi Avenue",
        city: "Nairobi",
        postalCode: "00100"
      },
      paymentStatus: 'paid' as const
    };

    navigate('/invoice', { state: sampleOrderData });
    setIsOpen(false);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg z-40"
        size="sm"
      >
        <MessageCircle className="h-6 w-6" />
        {getTotalItems() > 0 && (
          <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {getTotalItems()}
          </Badge>
        )}
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end p-4">
          <Card className="w-full max-w-md h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h3 className="font-semibold">AutoSpares Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-primary/80"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={`flex gap-2 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary text-white ml-4'
                          : 'bg-muted text-foreground mr-4'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.type === 'bot' ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>

                  {/* Product Cards */}
                  {message.products && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {message.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t">
              <div className="flex gap-2 mb-3">
                <Button
                  onClick={handleGoToCart}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Go to Cart ({getTotalItems()})
                </Button>
                <Button
                  onClick={handleDownloadInvoice}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about auto parts..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-primary hover:bg-primary/90 text-white"
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatInterface;