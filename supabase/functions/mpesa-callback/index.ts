import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const callbackData = await req.json();
    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    const { Body } = callbackData;
    
    if (!Body || !Body.stkCallback) {
      return new Response('Invalid callback data', { status: 400 });
    }

    const { stkCallback } = Body;
    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = stkCallback;

    let mpesaReceiptNumber = null;
    let transactionDate = null;
    let phoneNumber = null;
    let amount = null;

    // Extract transaction details from callback metadata
    if (CallbackMetadata && CallbackMetadata.Item) {
      for (const item of CallbackMetadata.Item) {
        switch (item.Name) {
          case 'MpesaReceiptNumber':
            mpesaReceiptNumber = item.Value;
            break;
          case 'TransactionDate':
            transactionDate = new Date(item.Value.toString());
            break;
          case 'PhoneNumber':
            phoneNumber = item.Value;
            break;
          case 'Amount':
            amount = item.Value;
            break;
        }
      }
    }

    // Determine payment status
    const status = ResultCode === 0 ? 'completed' : 'failed';

    // Update payment record in database
    const { data: updatedPayment, error: updateError } = await supabase
      .from('mpesa_payments')
      .update({
        merchant_request_id: MerchantRequestID,
        checkout_request_id: CheckoutRequestID,
        result_code: ResultCode,
        result_desc: ResultDesc,
        mpesa_receipt_number: mpesaReceiptNumber,
        transaction_date: transactionDate,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_request_id', CheckoutRequestID)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment record:', updateError);
    } else {
      console.log('Payment record updated:', updatedPayment);
      
      // If payment was successful and linked to an order, update order status
      if (status === 'completed' && updatedPayment.order_id) {
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            status: 'confirmed'
          })
          .eq('id', updatedPayment.order_id);

        if (orderError) {
          console.error('Error updating order status:', orderError);
        }

        // Create payment record in payments table
        const { error: paymentsError } = await supabase
          .from('payments')
          .insert({
            order_id: updatedPayment.order_id,
            amount: amount || updatedPayment.amount,
            payment_method: 'mpesa',
            transaction_id: mpesaReceiptNumber,
            status: 'completed',
            processed_at: transactionDate || new Date().toISOString(),
            gateway_response: callbackData
          });

        if (paymentsError) {
          console.error('Error creating payment record:', paymentsError);
        }
      }
    }

    // Send acknowledgment to M-Pesa
    return new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: 'Accepted'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    
    // Still send acknowledgment to prevent retries
    return new Response(
      JSON.stringify({
        ResultCode: 0,
        ResultDesc: 'Accepted'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});