import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// M-Pesa Daraja API configuration (sandbox for testing)
const MPESA_CONFIG = {
  consumerKey: Deno.env.get('MPESA_CONSUMER_KEY') || 'your_sandbox_consumer_key',
  consumerSecret: Deno.env.get('MPESA_CONSUMER_SECRET') || 'your_sandbox_consumer_secret',
  businessShortCode: Deno.env.get('MPESA_SHORTCODE') || '174379',
  passkey: Deno.env.get('MPESA_PASSKEY') || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
  environment: Deno.env.get('MPESA_ENVIRONMENT') || 'sandbox' // 'sandbox' or 'production'
};

const MPESA_BASE_URL = MPESA_CONFIG.environment === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

async function getMpesaAccessToken(): Promise<string> {
  const auth = btoa(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`);
  
  const response = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get M-Pesa access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

function generatePassword(): string {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = btoa(`${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`);
  return password;
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
}

async function initiateSTKPush(phoneNumber: string, amount: number, accountReference: string, transactionDesc: string) {
  const accessToken = await getMpesaAccessToken();
  const timestamp = getTimestamp();
  const password = generatePassword();

  // Format phone number (ensure it starts with 254)
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.slice(1);
  } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
    formattedPhone = '254' + formattedPhone;
  }

  const stkPushPayload = {
    BusinessShortCode: MPESA_CONFIG.businessShortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: formattedPhone,
    PartyB: MPESA_CONFIG.businessShortCode,
    PhoneNumber: formattedPhone,
    CallBackURL: MPESA_CONFIG.callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  console.log('STK Push payload:', JSON.stringify(stkPushPayload, null, 2));

  const response = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stkPushPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('M-Pesa STK Push error:', errorText);
    throw new Error(`M-Pesa STK Push failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('STK Push response:', JSON.stringify(result, null, 2));
  
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount, orderId, customerInfo } = await req.json();

    console.log('M-Pesa STK Push request:', { phoneNumber, amount, orderId, customerInfo });

    if (!phoneNumber || !amount) {
      return new Response(
        JSON.stringify({ error: 'Phone number and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or update M-Pesa payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('mpesa_payments')
      .insert({
        order_id: orderId,
        phone_number: phoneNumber,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw new Error('Failed to create payment record');
    }

    // Initiate STK Push
    const accountReference = orderId || `ORDER-${Date.now()}`;
    const transactionDesc = `AutoSpares Payment - ${accountReference}`;

    const stkResult = await initiateSTKPush(
      phoneNumber,
      amount,
      accountReference,
      transactionDesc
    );

    // Update payment record with M-Pesa response
    if (stkResult.CheckoutRequestID) {
      await supabase
        .from('mpesa_payments')
        .update({
          checkout_request_id: stkResult.CheckoutRequestID,
          merchant_request_id: stkResult.MerchantRequestID
        })
        .eq('id', paymentRecord.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'STK Push initiated successfully. Please check your phone for the payment prompt.',
        checkoutRequestId: stkResult.CheckoutRequestID,
        merchantRequestId: stkResult.MerchantRequestID,
        paymentId: paymentRecord.id,
        responseCode: stkResult.ResponseCode,
        responseDescription: stkResult.ResponseDescription
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mpesa-stk-push function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});