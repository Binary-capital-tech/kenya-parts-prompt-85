import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  orderNumber: string;
  orderItems: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
  };
  paymentStatus: 'paid' | 'unpaid';
}

const NewInvoice: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const orderData = location.state as OrderData;

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">No Order Found</h2>
          <p className="text-muted-foreground mb-6">
            It looks like there's no order data available.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('AutoSpares Kenya', 20, 30);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Your Trusted Auto Parts Partner', 20, 40);
      
      // Invoice details
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 150, 30);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice #: ${orderData.orderNumber}`, 150, 45);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 55);
      doc.text(`Status: ${orderData.paymentStatus.toUpperCase()}`, 150, 65);
      
      // Customer info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, 80);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(orderData.customerInfo.fullName, 20, 95);
      doc.text(orderData.customerInfo.email, 20, 105);
      doc.text(orderData.customerInfo.phone, 20, 115);
      doc.text(orderData.customerInfo.address, 20, 125);
      doc.text(`${orderData.customerInfo.city}, ${orderData.customerInfo.postalCode}`, 20, 135);
      
      // Items header
      let yPos = 160;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Product', 20, yPos);
      doc.text('Qty', 100, yPos);
      doc.text('Unit Price', 130, yPos);
      doc.text('Total', 170, yPos);
      
      // Line
      doc.line(20, yPos + 5, 190, yPos + 5);
      yPos += 15;
      
      // Items
      doc.setFont('helvetica', 'normal');
      orderData.orderItems.forEach((item) => {
        doc.text(item.name, 20, yPos);
        doc.text(item.quantity.toString(), 100, yPos);
        doc.text(`KSh ${item.price.toLocaleString()}`, 130, yPos);
        doc.text(`KSh ${(item.quantity * item.price).toLocaleString()}`, 170, yPos);
        yPos += 10;
      });
      
      // Totals
      yPos += 10;
      doc.line(130, yPos, 190, yPos);
      yPos += 10;
      
      doc.text('Subtotal:', 130, yPos);
      doc.text(`KSh ${orderData.subtotal.toLocaleString()}`, 170, yPos);
      yPos += 10;
      
      doc.text('Shipping:', 130, yPos);
      doc.text(`KSh ${orderData.shipping.toLocaleString()}`, 170, yPos);
      yPos += 10;
      
      doc.text('Tax:', 130, yPos);
      doc.text(`KSh ${orderData.tax.toLocaleString()}`, 170, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', 130, yPos);
      doc.text(`KSh ${orderData.total.toLocaleString()}`, 170, yPos);
      
      doc.save(`invoice-${orderData.orderNumber}.pdf`);
      
      toast({
        title: "Success!",
        description: "Invoice PDF downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEmailInvoice = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-invoice', {
        body: {
          to: orderData.customerInfo.email,
          orderNumber: orderData.orderNumber,
          customerName: orderData.customerInfo.fullName,
          orderTotal: orderData.total,
          orderItems: orderData.orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: `Invoice has been sent to ${orderData.customerInfo.email}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send invoice email. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Success Message */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. Here's your invoice:
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleEmailInvoice} className="bg-primary">
            <Mail className="w-4 h-4 mr-2" />
            Email Invoice
          </Button>
        </div>

        {/* Invoice */}
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl text-primary mb-2">
                  AutoSpares Kenya
                </CardTitle>
                <p className="text-muted-foreground">Your Trusted Auto Parts Partner</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Email: support@autospareskenya.com | Phone: +254 700 000 000
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold mb-2">INVOICE</h2>
                <div className="space-y-1 text-sm">
                  <p><strong>Invoice #:</strong> {orderData.orderNumber}</p>
                  <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Payment Method:</strong> M-Pesa</p>
                  <Badge 
                    variant={orderData.paymentStatus === 'paid' ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {orderData.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Customer Information */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-lg mb-3">Bill To:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{orderData.customerInfo.fullName}</p>
                  <p>{orderData.customerInfo.email}</p>
                  <p>{orderData.customerInfo.phone}</p>
                  <p>{orderData.customerInfo.address}</p>
                  <p>{orderData.customerInfo.city}, {orderData.customerInfo.postalCode}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Ship To:</h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{orderData.customerInfo.fullName}</p>
                  <p>{orderData.customerInfo.address}</p>
                  <p>{orderData.customerInfo.city}, {orderData.customerInfo.postalCode}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Order Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left py-3 px-2">Product</th>
                      <th className="text-center py-3 px-2">Qty</th>
                      <th className="text-right py-3 px-2">Unit Price</th>
                      <th className="text-right py-3 px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.orderItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-2">{item.name}</td>
                        <td className="text-center py-3 px-2">{item.quantity}</td>
                        <td className="text-right py-3 px-2">KSh {item.price.toLocaleString()}</td>
                        <td className="text-right py-3 px-2 font-medium">
                          KSh {(item.quantity * item.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-6">
              <div className="max-w-md ml-auto space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>KSh {orderData.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>KSh {orderData.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>KSh {orderData.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>KSh {orderData.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Payment Terms</h4>
                  <p>Payment via M-Pesa. Please ensure sufficient funds.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Warranty</h4>
                  <p>All products come with manufacturer warranty as specified.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Returns</h4>
                  <p>30-day return policy on unused items in original packaging.</p>
                </div>
              </div>
              <div className="text-center mt-6 pt-4 border-t">
                <p>Thank you for choosing AutoSpares Kenya!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Styles */}
        <style>{`
          @media print {
            body { margin: 0; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:border-none { border: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default NewInvoice;