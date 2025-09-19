import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  sessionToken?: string;
  email?: string;
  phone?: string;
}

interface DatabaseSchema {
  tables: {
    products: {
      id: string;
      name: string;
      price: number;
      sale_price?: number;
      brand?: string;
      category_id?: string;
      description?: string;
      stock_quantity: number;
      is_active: boolean;
    };
    categories: {
      id: string;
      name: string;
      description?: string;
      is_active: boolean;
    };
    orders: {
      id: string;
      order_number: string;
      customer_id?: string;
      status: string;
      total_amount: number;
      created_at: string;
    };
    customers: {
      id: string;
      full_name: string;
      email: string;
      phone: string;
    };
  };
}

const getSystemPrompt = () => {
  return `You are AutoSpares AI, an intelligent assistant for AutoSpares Kenya, a leading auto parts store. You help customers find the right auto parts for their vehicles.

IMPORTANT CONTEXT:
- You have access to a comprehensive product database with real inventory
- You can generate SQL queries to search and retrieve product information
- Always prioritize customer needs and provide helpful, accurate information
- Focus on Kenyan market and pricing in Kenya Shillings (KSh)

DATABASE SCHEMA:
- products: id, name, price, sale_price, brand, category_id, description, stock_quantity, is_active
- categories: id, name, description, is_active  
- orders: id, order_number, customer_id, status, total_amount, created_at
- customers: id, full_name, email, phone

CAPABILITIES:
1. Product Search: Generate SQL queries to find products by name, brand, category, price range
2. Inventory Check: Query stock levels and availability
3. Price Comparison: Compare prices and show discounts
4. Order History: Look up customer orders and status
5. Recommendations: Suggest compatible or alternative parts

RESPONSE FORMAT:
When you need to query the database, respond with:
{
  "type": "query",
  "sql": "SELECT * FROM products WHERE ...",
  "explanation": "I'm searching for brake pads in your budget range"
}

When providing information without needing a query:
{
  "type": "response", 
  "message": "Your response here"
}

Always be helpful, professional, and focused on automotive expertise.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message, sessionToken, email, phone }: ChatRequest = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Store or retrieve chat session
    let chatSession = null;
    if (sessionToken && (email || phone)) {
      // Try to find existing session
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .single();

      if (existingSession) {
        chatSession = existingSession;
      } else if (email || phone) {
        // Create new session
        const { data: newSession } = await supabase
          .from('chat_sessions')
          .insert({
            session_token: sessionToken,
            email: email,
            phone: phone,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        chatSession = newSession;
      }
    }

    // Prepare the prompt for Gemini
    const systemPrompt = getSystemPrompt();
    const fullPrompt = `${systemPrompt}\n\nUser Message: ${message}`;

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 40
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';

    // Parse AI response to check if it contains a SQL query
    let finalResponse = aiResponse;
    let queryResults = null;

    try {
      const parsedResponse = JSON.parse(aiResponse);
      if (parsedResponse.type === 'query' && parsedResponse.sql) {
        // Execute the SQL query
        console.log('Executing query:', parsedResponse.sql);
        
        // For security, only allow SELECT queries
        if (parsedResponse.sql.trim().toLowerCase().startsWith('select')) {
          const { data: results, error } = await supabase.rpc('execute_sql', {
            query: parsedResponse.sql
          });

          if (error) {
            console.error('SQL execution error:', error);
            finalResponse = "I encountered an error while searching our database. Let me help you in another way.";
          } else {
            queryResults = results;
            finalResponse = `${parsedResponse.explanation}\n\nI found ${results?.length || 0} results in our database.`;
          }
        } else {
          finalResponse = "I can only search our product database, not modify it.";
        }
      }
    } catch (e) {
      // If parsing fails, use the original response
      console.log('Response is not JSON, using as plain text');
    }

    // Store chat message
    if (chatSession) {
      await supabase.from('chat_messages').insert({
        session_id: chatSession.id,
        message: message,
        response: finalResponse,
        query_results: queryResults,
        created_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({
      response: finalResponse,
      queryResults: queryResults,
      sessionToken: chatSession?.session_token
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      response: "I'm having trouble processing your request right now. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});