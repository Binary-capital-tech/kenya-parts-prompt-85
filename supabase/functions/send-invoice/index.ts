import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendInvoiceRequest {
  to: string;
  orderNumber: string;
  customerName: string;
  orderTotal: number;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, orderNumber, customerName, orderTotal, orderItems }: SendInvoiceRequest = await req.json();

    const itemsHtml = orderItems.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${item.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">KSh ${item.price.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right;">KSh ${(item.quantity * item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${orderNumber}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <header style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 2.5rem;">AutoSpares Kenya</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280;">Your Trusted Auto Parts Partner</p>
        </header>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #16a34a; margin: 0 0 10px 0;">✓ Order Confirmed!</h2>
          <p style="margin: 0; font-size: 1.1rem;">Thank you for your order, ${customerName}!</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 1.2rem;">Invoice Details</h3>
            <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Payment Method:</strong> M-Pesa</p>
          </div>
          <div>
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 1.2rem;">Customer Information</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${to}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; margin: 0 0 20px 0; font-size: 1.2rem;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 15px; text-align: left; font-weight: 600; color: #374151;">Product</th>
                <th style="padding: 15px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                <th style="padding: 15px; text-align: right; font-weight: 600; color: #374151;">Unit Price</th>
                <th style="padding: 15px; text-align: right; font-weight: 600; color: #374151;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        
        <div style="background: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: right; margin-bottom: 30px;">
          <h3 style="margin: 0; font-size: 1.5rem;">Total: KSh ${orderTotal.toLocaleString()}</h3>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h4 style="color: #374151; margin: 0 0 15px 0;">Payment Information</h4>
          <p style="margin: 5px 0;">Payment will be processed via M-Pesa. You will receive a payment prompt shortly.</p>
          <p style="margin: 5px 0;">Please ensure you have sufficient funds in your M-Pesa account.</p>
        </div>
        
        <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
          <p style="margin: 5px 0;">AutoSpares Kenya</p>
          <p style="margin: 5px 0;">Email: support@autospareskenya.com | Phone: +254 700 000 000</p>
          <p style="margin: 5px 0; font-size: 0.9rem;">Thank you for choosing AutoSpares Kenya for your automotive needs!</p>
        </footer>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AutoSpares Kenya <noreply@autospareskenya.com>",
      to: [to],
      subject: `Invoice ${orderNumber} - AutoSpares Kenya`,
      html: emailHtml,
    });

    console.log('Invoice email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);