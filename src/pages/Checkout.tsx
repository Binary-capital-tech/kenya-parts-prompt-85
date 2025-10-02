import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, MapPin, User } from "lucide-react";
import { useCart } from "@/components/CartContext";
import { useToast } from "@/hooks/use-toast";
import MpesaPayment from "@/components/MpesaPayment";

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getTotalPrice, getTotalItems, clearCart } = useCart();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'info' | 'payment' | 'complete'>('info');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: ""
  });

  // Re-sync cart from sessionStorage on mount/refresh
  useEffect(() => {
    const verifyCart = () => {
      try {
        const savedCart = sessionStorage.getItem('autospares_cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          console.log('Checkout - Cart verified on refresh:', parsedCart.length, 'items');
          
          // If cart is empty in state but exists in storage, trigger a re-render
          if (cart.length === 0 && parsedCart.length > 0) {
            console.log('Cart mismatch detected, reloading...');
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error verifying cart:', error);
      }
    };
    
    verifyCart();
  }, [cart.length]);

  // Load customer info from sessionStorage if available
  useEffect(() => {
    const savedEmail = sessionStorage.getItem('userEmail');
    const savedPhone = sessionStorage.getItem('userPhone');
    
    if (savedEmail || savedPhone) {
      setCustomerInfo(prev => ({
        ...prev,
        email: savedEmail || prev.email,
        phone: savedPhone || prev.phone
      }));
    }
  }, []);

  // Helper function to get numeric price value
  const getNumericPrice = (item: any) => {
    return item.priceValue || parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
  };

  const subtotal = getTotalPrice();
  const shipping = 500;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some items to your cart first</p>
          <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const handleCustomerInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city'];
    const missingFields = requiredFields.filter(field => !customerInfo[field as keyof CustomerInfo]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Save customer info to sessionStorage
    sessionStorage.setItem('userEmail', customerInfo.email);
    sessionStorage.setItem('userPhone', customerInfo.phone);
    sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));

    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (paymentData: any) => {
    toast({
      title: "Order Successful!",
      description: `Your order has been placed successfully. Receipt: ${paymentData.mpesa_receipt_number}`,
    });
    
    // Save order to sessionStorage before clearing cart
    const orderData = {
      orderDate: new Date().toISOString(),
      items: cart,
      customerInfo,
      total,
      paymentData
    };
    sessionStorage.setItem('lastOrder', JSON.stringify(orderData));
    
    clearCart();
    setCurrentStep('complete');
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    });
  };

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl text-success">Order Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your order has been successfully placed and payment confirmed.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate("/")} 
                className="w-full bg-primary hover:bg-primary/90"
              >
                Continue Shopping
              </Button>
              <Button 
                onClick={() => navigate("/invoice")} 
                variant="outline" 
                className="w-full"
              >
                View Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => navigate(-1)} variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} • Total: KSh {total.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Customer Info or Payment */}
          <div className="space-y-6">
            {currentStep === 'info' ? (
              <>
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={customerInfo.firstName}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={customerInfo.lastName}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0722 123 456"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address">Address *</Label>
                          <Input
                            id="address"
                            value={customerInfo.address}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg">
                        Continue to Payment
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Payment */}
                <div className="space-y-4">
                  <Button 
                    onClick={() => setCurrentStep('info')} 
                    variant="outline" 
                    size="sm"
                    className="mb-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Customer Info
                  </Button>
                  
                  <MpesaPayment
                    amount={total}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => {
                    const itemPrice = getNumericPrice(item);
                    
                    return (
                      <div key={item.id} className="flex gap-3 py-2">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.brand}</p>
                          <p className="text-sm">
                            {item.quantity}x KSh {itemPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Order Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>KSh {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>KSh {shipping.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>KSh {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Secure payment with M-Pesa
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;