import { useState } from "react";
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
  const { toast } = useToast();

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as Kenyan phone number
    if (cleaned.startsWith('0')) {
      return `254${cleaned.slice(1)}`;
    } else if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return `254${cleaned}`;
    }
    
    return cleaned;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const formatted = formatPhoneNumber(phone);
    // Kenyan phone numbers should be 12 digits starting with 254
    return /^254[17]\d{8}$/.test(formatted);
  };

  const handlePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number!",
        description: "Please enter a valid Kenyan phone number (e.g., 0722123456)",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setPaymentStatus('pending');
    setStatusMessage("Initiating M-Pesa payment...");

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phoneNumber: formatPhoneNumber(phoneNumber),
          amount: amount,
          orderId: orderId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setStatusMessage("Payment request sent! Please check your phone and enter your M-Pesa PIN.");
        toast({
          title: "Payment Initiated",
          description: "Check your phone for the M-Pesa payment prompt",
        });

        // Poll for payment status
        pollPaymentStatus(data.paymentId);
      } else {
        throw new Error(data.error || "Failed to initiate payment");
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setStatusMessage(error.message || "Payment failed. Please try again.");
      onPaymentError?.(error.message);
      
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to process payment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 2.5 minutes (5s intervals)

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('mpesa_payments')
          .select('status, result_code, result_desc, mpesa_receipt_number')
          .eq('id', paymentId)
          .single();

        if (error) throw error;

        if (data.status === 'completed') {
          setPaymentStatus('success');
          setStatusMessage(`Payment successful! Receipt: ${data.mpesa_receipt_number}`);
          onPaymentSuccess?.(data);
          
          toast({
            title: "Payment Successful",
            description: `Your payment has been processed. Receipt: ${data.mpesa_receipt_number}`,
          });
          return;
        } else if (data.status === 'failed') {
          setPaymentStatus('error');
          setStatusMessage(data.result_desc || "Payment failed");
          onPaymentError?.(data.result_desc || "Payment failed");
          return;
        }

        // Continue polling if payment is still pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          setPaymentStatus('error');
          setStatusMessage("Payment verification timed out. Please contact support if money was deducted.");
        }

      } catch (error: any) {
        console.error('Status check error:', error);
        setPaymentStatus('error');
        setStatusMessage("Unable to verify payment status");
      }
    };

    // Start polling after a short delay
    setTimeout(checkStatus, 3000);
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
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {getStatusIcon()}
            <p className="text-sm">{statusMessage}</p>
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
            You will receive an M-Pesa prompt on your phone
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MpesaPayment;
