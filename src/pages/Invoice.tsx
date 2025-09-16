import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Mail, Printer, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

const Invoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No Order Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
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
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Company Header
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('Autospares', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text('Motor Vehicle Spares & Accessories', margin, yPosition);
      yPosition += 5;
      pdf.text('Nairobi, Kenya', margin, yPosition);
      yPosition += 5;
      pdf.text('info@autospares.co.ke | +254 123 456 789', margin, yPosition);

      // Invoice Header
      yPosition += 20;
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('INVOICE', pageWidth - margin - 40, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Invoice #: ${order.id}`, pageWidth - margin - 80, yPosition);
      yPosition += 5;
      pdf.text(`Date: ${new Date(order.date).toLocaleDateString()}`, pageWidth - margin - 80, yPosition);
      yPosition += 5;
      pdf.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, pageWidth - margin - 80, yPosition);

      // Customer Information
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Bill To:', margin, yPosition);
      
      yPosition += 8;
      pdf.setFont(undefined, 'normal');
      pdf.text(`${order.customer.firstName} ${order.customer.lastName}`, margin, yPosition);
      yPosition += 5;
      pdf.text(order.customer.address, margin, yPosition);
      yPosition += 5;
      pdf.text(`${order.customer.city}, ${order.customer.postalCode}`, margin, yPosition);
      yPosition += 5;
      pdf.text(order.customer.phone, margin, yPosition);
      yPosition += 5;
      pdf.text(order.customer.email, margin, yPosition);

      // Order Details Table Header
      yPosition += 20;
      pdf.setFont(undefined, 'bold');
      pdf.text('Product', margin, yPosition);
      pdf.text('Brand', margin + 80, yPosition);
      pdf.text('Category', margin + 120, yPosition);
      pdf.text('Price', pageWidth - margin - 30, yPosition);

      // Line under header
      yPosition += 3;
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);

      // Product Details
      yPosition += 10;
      pdf.setFont(undefined, 'normal');
      pdf.text(order.product.name, margin, yPosition);
      pdf.text(order.product.brand, margin + 80, yPosition);
      pdf.text(order.product.category, margin + 120, yPosition);
      pdf.text(`$${order.product.price.toFixed(2)}`, pageWidth - margin - 30, yPosition);

      // Summary
      yPosition += 20;
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      pdf.text('Subtotal:', pageWidth - margin - 60, yPosition);
      pdf.text(`$${order.product.price.toFixed(2)}`, pageWidth - margin - 20, yPosition);
      yPosition += 5;
      
      pdf.text('Shipping:', pageWidth - margin - 60, yPosition);
      pdf.text('$10.00', pageWidth - margin - 20, yPosition);
      yPosition += 5;
      
      pdf.text('Tax:', pageWidth - margin - 60, yPosition);
      pdf.text('$0.00', pageWidth - margin - 20, yPosition);
      
      yPosition += 8;
      pdf.line(pageWidth - margin - 70, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      pdf.setFont(undefined, 'bold');
      pdf.text('Total:', pageWidth - margin - 60, yPosition);
      pdf.text(`$${order.total.toFixed(2)}`, pageWidth - margin - 20, yPosition);

      // Footer
      yPosition += 30;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Payment Terms: Payment is due upon receipt', margin, yPosition);
      yPosition += 5;
      pdf.text('Warranty: All parts come with manufacturer warranty', margin, yPosition);
      yPosition += 5;
      pdf.text('Returns: 30-day return policy on all items', margin, yPosition);
      
      yPosition += 15;
      pdf.text('Thank you for choosing Autospares for your automotive needs!', margin, yPosition);

      // Save the PDF
      pdf.save(`Invoice-${order.id}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Invoice has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF.",
        variant: "destructive"
      });
    }
  };

  const handleEmailInvoice = () => {
    toast({
      title: "Email Feature",
      description: "Email functionality would be implemented with a backend service.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-accent-green" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8 no-print">
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleEmailInvoice} variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Email Invoice
          </Button>
        </div>

        {/* Invoice */}
        <Card className="print:shadow-none print:border-0">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-primary mb-2">Autospares</h1>
                <p className="text-muted-foreground">
                  Motor Vehicle Spares & Accessories<br />
                  Nairobi, Kenya<br />
                  info@autospares.co.ke<br />
                  +254 123 456 789
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-foreground mb-2">INVOICE</h2>
                <div className="space-y-1 text-sm">
                  <p><strong>Invoice #:</strong> {order.id}</p>
                  <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> 
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-lg mb-3">Bill To:</h3>
                <div className="space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p>{order.customer.address}</p>
                  <p>{order.customer.city}, {order.customer.postalCode}</p>
                  <p>{order.customer.phone}</p>
                  <p>{order.customer.email}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">Ship To:</h3>
                <div className="space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p>{order.customer.address}</p>
                  <p>{order.customer.city}, {order.customer.postalCode}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-4">Order Details:</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted p-4 grid grid-cols-12 gap-4 font-semibold text-sm">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Unit Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <div className="p-4 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-6">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <div className="text-xs font-medium text-muted-foreground">IMG</div>
                      </div>
                      <div>
                        <p className="font-medium">{order.product.name}</p>
                        <p className="text-sm text-muted-foreground">{order.product.brand}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {order.product.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">1</div>
                  <div className="col-span-2 text-center">${order.product.price.toFixed(2)}</div>
                  <div className="col-span-2 text-right font-medium">${order.product.price.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${order.product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>$10.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Footer */}
            <div className="text-center space-y-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Payment Terms</h4>
                  <p>Payment is due upon receipt</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Warranty</h4>
                  <p>All parts come with manufacturer warranty</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Returns</h4>
                  <p>30-day return policy on all items</p>
                </div>
              </div>
              <p className="pt-4 border-t border-border">
                Thank you for choosing Autospares for your automotive needs!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;