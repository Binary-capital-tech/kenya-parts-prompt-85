import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MpesaPaymentProps {
  amount: number;
  orderId?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
}

const MpesaPayment = ({ 
  amount, 
  orderId, 
  onPaymentSuccess, 
  onPaymentError 
}: MpesaPaymentProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const { toast } = useToast();

  // Load saved phone number
  useEffect(() => {
    const savedPhone = sessionStorage.getItem('userPhone');
    if (savedPhone) {
      setPhoneNumber(savedPhone);
    }
  }, []);

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Format with + prefix for Paystack
    if (cleaned.startsWith('254')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.slice(1)}`;
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return `+254${cleaned}`;
    }
    
    return `+254${cleaned}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Kenyan phone numbers should be 9-12 digits
    return cleaned.length >= 9 && cleaned.length <= 12;
  };

  const verifyPaymentWithPaystack = async (ref: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-verify', {
        body: { reference: ref }
      });

      if (error) throw error;

      if (data.paid) {
        setPaymentStatus('success');
        setStatusMessage(`Payment successful! Receipt: ${data.data.reference}`);
        onPaymentSuccess?.({
          reference: ref,
          mpesa_receipt_number: data.data.reference,
          amount: data.data.amount,
          ...data.data
        });
        
        toast({
          title: "Payment Successful",
          description: `Your payment has been processed. Receipt: ${data.data.reference}`,
        });
        return true;
      } else if (data.data?.status === 'failed') {
        setPaymentStatus('error');
        setStatusMessage("Payment failed or was cancelled");
        onPaymentError?.("Payment failed or was cancelled");
        toast({
          title: "Payment Failed",
          description: "Payment was cancelled or failed",
          variant: "destructive"
        });
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Verification error:', error);
      return false;
    }
  };

  const pollPaymentStatus = async (ref: string) => {
    let attempts = 0;
    const maxAttempts = 20; // Poll for 60 seconds (3s intervals)

    const checkStatus = async () => {
      attempts++;
      
      const isComplete = await verifyPaymentWithPaystack(ref);
      
      if (isComplete) {
        setIsLoading(false);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 3000); // Check every 3 seconds
      } else {
        setIsLoading(false);
        setPaymentStatus('error');
        setStatusMessage("Payment verification timed out. Please check your M-Pesa messages.");
        toast({
          title: "Verification Timeout",
          description: "Unable to verify payment. Check your M-Pesa messages.",
          variant: "destructive"
        });
      }
    };

    // Start polling after a short delay
    setTimeout(checkStatus, 3000);
  };

  const handlePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (e.g., 0722123456)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setPaymentStatus('pending');
    setStatusMessage("Initiating M-Pesa payment...");

    try {
      // Get customer info from sessionStorage
      const customerInfoStr = sessionStorage.getItem('customerInfo');
      const customerInfo = customerInfoStr ? JSON.parse(customerInfoStr) : {};
      
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phoneNumber: formattedPhone,
          amount: amount,
          orderId: orderId || `ORDER-${Date.now()}`,
          customerInfo: {
            email: customerInfo.email || 'customer@example.com',
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success && data.reference) {
        setReference(data.reference);
        setStatusMessage("Check your phone for M-Pesa prompt and enter your PIN");
        
        toast({
          title: "Payment Initiated",
          description: "Check your phone for the M-Pesa payment prompt",
        });

        // Start polling for payment status
        pollPaymentStatus(data.reference);
      } else {
        throw new Error(data.message || "Failed to initiate payment");
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      setIsLoading(false);
      setPaymentStatus('error');
      setStatusMessage(error.message || "Payment failed. Please try again.");
      onPaymentError?.(error.message);
      
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to process payment",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'pending':
        return <Loader2 className="w-5 h-5 animate-spin text-warning" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Smartphone className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <div className="bg-primary/10 p-3 rounded-full">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold">M-Pesa Payment</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pay KSh {amount.toLocaleString()} securely with M-Pesa
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0722 123 456"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading || paymentStatus === 'success'}
            className="text-center"
          />
          <p className="text-xs text-muted-foreground">
            Enter your M-Pesa registered phone number
          </p>
        </div>

        {paymentStatus !== 'idle' && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="text-sm">{statusMessage}</p>
              {reference && (
                <p className="text-xs text-muted-foreground mt-1">
                  Reference: {reference}
                </p>
              )}
            </div>
          </div>
        )}

        {paymentStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
            <p className="font-medium text-yellow-900 text-sm">Complete Payment on Your Phone:</p>
            <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Check your phone for M-Pesa prompt</li>
              <li>Enter your M-Pesa PIN</li>
              <li>Confirm the payment</li>
              <li>Wait for confirmation</li>
            </ol>
          </div>
        )}

        <Button
          onClick={handlePayment}
          disabled={!phoneNumber || isLoading || paymentStatus === 'success'}
          className="w-full btn-premium disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Payment Complete
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 mr-2" />
              Pay KSh {amount.toLocaleString()}
            </>
          )}
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Secure payment powered by Paystack
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MpesaPayment;
