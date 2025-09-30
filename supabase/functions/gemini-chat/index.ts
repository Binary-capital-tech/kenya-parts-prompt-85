import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MCPRequest {
  method: string;
  params: {
    name?: string;
    arguments?: any;
  };
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Model Context Protocol - Define available tools
const MCP_TOOLS = [
  {
    name: "get_products",
    description: "Get list of available auto parts products",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Product category filter" },
        search: { type: "string", description: "Search term" },
        limit: { type: "number", description: "Number of products to return" }
      }
    }
  },
  {
    name: "search_products", 
    description: "Search for specific auto parts",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" }
      },
      required: ["query"]
    }
  },
  {
    name: "create_order",
    description: "Create a new order for the customer", 
    parameters: {
      type: "object",
      properties: {
        items: { type: "array", description: "Order items" },
        customer_info: { type: "object", description: "Customer information" },
        total_amount: { type: "number", description: "Total order amount" }
      },
      required: ["items", "customer_info", "total_amount"]
    }
  },
  {
    name: "initiate_mpesa_payment",
    description: "Initiate M-Pesa payment for an order",
    parameters: {
      type: "object", 
      properties: {
        phone_number: { type: "string", description: "M-Pesa phone number" },
        amount: { type: "number", description: "Payment amount" },
        order_id: { type: "string", description: "Order ID" }
      },
      required: ["phone_number", "amount"]
    }
  }
];

// MCP Tool execution
async function executeMCPTool(toolName: string, args: any): Promise<any> {
  console.log(`Executing MCP tool: ${toolName} with args:`, args);
  
  try {
    switch (toolName) {
      case "get_products":
        const { data: productsData, error: productsError } = await supabase
          .rpc('execute_controlled_query', {
            query_type: 'get_products',
            query_params: args || {}
          });
        
        if (productsError) throw productsError;
        return productsData || [];

      case "search_products":
        const { data: searchData, error: searchError } = await supabase
          .rpc('execute_controlled_query', {
            query_type: 'search_products', 
            query_params: { search: args.query }
          });
        
        if (searchError) throw searchError;
        return searchData || [];

      case "create_order":
        // Create customer first
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .insert({
            full_name: `${args.customer_info.firstName} ${args.customer_info.lastName}`,
            email: args.customer_info.email,
            phone: args.customer_info.phone
          })
          .select()
          .single();

        if (customerError) throw customerError;

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .rpc('execute_controlled_query', {
            query_type: 'create_order',
            query_params: {
              customer_id: customer.id,
              subtotal: args.total_amount,
              total_amount: args.total_amount,
              shipping_address: args.customer_info,
              billing_address: args.customer_info
            }
          });

        if (orderError) throw orderError;
        return orderData;

      case "initiate_mpesa_payment":
        // Store M-Pesa payment record
        const { data: paymentData, error: paymentError } = await supabase
          .from('mpesa_payments')
          .insert({
            phone_number: args.phone_number,
            amount: args.amount,
            order_id: args.order_id || null,
            status: 'pending'
          })
          .select()
          .single();

        if (paymentError) throw paymentError;
        
        return {
          payment_id: paymentData.id,
          status: 'initiated',
          message: `M-Pesa payment of KSh ${args.amount.toLocaleString()} initiated to ${args.phone_number}. Please check your phone for the payment prompt.`
        };

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    throw error;
  }
}

// Enhanced system prompt with MCP integration
const SYSTEM_PROMPT = `You are an intelligent AI assistant for AutoSpares Kenya, a premium auto parts store. You help customers find the right auto parts for their vehicles using advanced tools and database integration.

CORE CAPABILITIES:
- Search and recommend auto parts using real product database
- Process orders and handle M-Pesa payments
- Provide technical specifications and compatibility information
- Guide customers through installation and maintenance

AVAILABLE TOOLS (Model Context Protocol):
1. get_products - Get list of available products
2. search_products - Search for specific auto parts  
3. create_order - Create customer orders
4. initiate_mpesa_payment - Process M-Pesa payments

RESPONSE GUIDELINES:
- Always search the database when customers ask about specific parts
- Provide detailed product information including compatibility
- Format product suggestions clearly with prices in KSh
- Guide customers through the purchase process
- Only suggest M-Pesa payment (no other payment methods)
- Be helpful, professional, and knowledgeable about automotive parts

When customers ask about products, use the search_products tool to find relevant items from the database.
When customers want to make a purchase, guide them through creating an order and M-Pesa payment.

Remember: You have access to real product data - always use it to provide accurate, up-to-date information.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userToken, email, phone } = await req.json();
    
    console.log('Received chat request:', { message, sessionId, userToken, email, phone });

    // Store or update chat session
    if (sessionId && (email || phone)) {
      const { error: sessionError } = await supabase
        .from('chat_sessions')
        .upsert({
          id: sessionId,
          title: message.substring(0, 50),
          user_token: userToken,
          email: email,
          phone: phone,
          updated_at: new Date().toISOString()
        });
      
      if (sessionError) console.error('Session error:', sessionError);
    }

    // Prepare conversation history
    const conversationHistory: ChatMessage[] = [
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    // Make request to Gemini API with function calling
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT }]
          },
          ...conversationHistory
        ],
        tools: [{
          functionDeclarations: MCP_TOOLS
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData, null, 2));

    let responseText = '';
    let toolResults: any[] = [];

    // Process Gemini response
    if (geminiData.candidates && geminiData.candidates[0]) {
      const candidate = geminiData.candidates[0];
      
      // Check for function calls
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.functionCall) {
            // Execute the function call using MCP
            const toolName = part.functionCall.name;
            const args = part.functionCall.args || {};
            
            try {
              const toolResult = await executeMCPTool(toolName, args);
              toolResults.push({
                tool: toolName,
                result: toolResult
              });
              
              // Format tool results for response
              if (toolName === 'search_products' || toolName === 'get_products') {
                if (Array.isArray(toolResult) && toolResult.length > 0) {
                  responseText += `I found ${toolResult.length} relevant auto parts for you:\n\n`;
                  toolResult.forEach((product: any, index: number) => {
                    responseText += `${index + 1}. **${product.name}** by ${product.brand}\n`;
                    responseText += `   - Price: KSh ${product.price.toLocaleString()}\n`;
                    responseText += `   - ${product.description}\n`;
                    responseText += `   - ${product.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n\n`;
                  });
                } else {
                  responseText += "I couldn't find any products matching your request. Could you please provide more details about the specific auto part you're looking for?\n\n";
                }
              } else if (toolName === 'initiate_mpesa_payment') {
                responseText += `${toolResult.message}\n\n`;
              }
              
            } catch (error) {
              console.error(`Error executing tool ${toolName}:`, error);
              responseText += `I encountered an error while searching for products. Please try again.\n\n`;
            }
          } else if (part.text) {
            responseText += part.text;
          }
        }
      }
    }

    // If no function calls were made, provide default response
    if (!responseText && !toolResults.length) {
      responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I'm here to help you find auto parts! What specific parts are you looking for your vehicle?";
    }

    // Store chat message
    if (sessionId) {
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([
          {
            session_id: sessionId,
            message_type: 'user',
            content: message
          },
          {
            session_id: sessionId, 
            message_type: 'assistant',
            content: responseText,
            metadata: { toolResults }
          }
        ]);
      
      if (messageError) console.error('Message storage error:', messageError);
    }

    return new Response(
      JSON.stringify({ 
        response: responseText,
        toolResults,
        sessionId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
