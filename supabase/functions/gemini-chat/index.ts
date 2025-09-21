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

// Enhanced Model Context Protocol - Define available tools for complex queries
const MCP_TOOLS = [
  {
    name: "get_products",
    description: "Get comprehensive list of auto parts products with detailed filtering",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string", description: "Product category filter (brake, engine, lighting, etc.)" },
        brand: { type: "string", description: "Brand filter" },
        search: { type: "string", description: "Search term" },
        min_price: { type: "number", description: "Minimum price filter" },
        max_price: { type: "number", description: "Maximum price filter" },
        in_stock: { type: "boolean", description: "Filter by stock availability" },
        limit: { type: "number", description: "Number of products to return (default: 10)" }
      }
    }
  },
  {
    name: "search_products", 
    description: "Advanced search for auto parts with intelligent matching",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language search query" },
        vehicle_make: { type: "string", description: "Vehicle manufacturer (Toyota, Honda, etc.)" },
        vehicle_model: { type: "string", description: "Vehicle model" },
        vehicle_year: { type: "string", description: "Vehicle year" },
        part_type: { type: "string", description: "Specific part type" },
        price_range: { type: "string", description: "Price range preference (budget, mid-range, premium)" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_vehicle_compatibility",
    description: "Check part compatibility with specific vehicles",
    parameters: {
      type: "object",
      properties: {
        product_id: { type: "string", description: "Product ID to check compatibility" },
        vehicle_make: { type: "string", description: "Vehicle make" },
        vehicle_model: { type: "string", description: "Vehicle model" },
        vehicle_year: { type: "string", description: "Vehicle year" }
      },
      required: ["vehicle_make", "vehicle_model", "vehicle_year"]
    }
  },
  {
    name: "get_product_recommendations",
    description: "Get intelligent product recommendations based on user needs",
    parameters: {
      type: "object",
      properties: {
        base_product_id: { type: "string", description: "Base product to get recommendations for" },
        vehicle_info: { type: "object", description: "Vehicle information" },
        budget_range: { type: "string", description: "Budget preference" },
        use_case: { type: "string", description: "Intended use (daily driving, performance, racing, etc.)" }
      }
    }
  },
  {
    name: "create_order",
    description: "Create a comprehensive order with validation", 
    parameters: {
      type: "object",
      properties: {
        items: { type: "array", description: "Array of order items with product_id, quantity, price" },
        customer_info: { 
          type: "object", 
          description: "Complete customer information",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
            postalCode: { type: "string" }
          }
        },
        subtotal: { type: "number", description: "Subtotal amount" },
        tax_amount: { type: "number", description: "Tax amount" },
        shipping_amount: { type: "number", description: "Shipping cost" },
        total_amount: { type: "number", description: "Total order amount" },
        special_instructions: { type: "string", description: "Special delivery instructions" }
      },
      required: ["items", "customer_info", "total_amount"]
    }
  },
  {
    name: "initiate_mpesa_payment",
    description: "Initiate M-Pesa STK push payment with validation",
    parameters: {
      type: "object", 
      properties: {
        phone_number: { type: "string", description: "M-Pesa phone number (254xxxxxxxxx format)" },
        amount: { type: "number", description: "Payment amount in KES" },
        order_id: { type: "string", description: "Associated order ID" },
        account_reference: { type: "string", description: "Account reference for the payment" },
        transaction_desc: { type: "string", description: "Transaction description" }
      },
      required: ["phone_number", "amount"]
    }
  },
  {
    name: "check_inventory",
    description: "Check real-time inventory status for products",
    parameters: {
      type: "object",
      properties: {
        product_ids: { type: "array", description: "Array of product IDs to check" },
        quantity_required: { type: "number", description: "Required quantity" }
      },
      required: ["product_ids"]
    }
  },
  {
    name: "get_shipping_estimate",
    description: "Calculate shipping costs and delivery time estimates",
    parameters: {
      type: "object",
      properties: {
        destination_city: { type: "string", description: "Delivery city" },
        items: { type: "array", description: "Items for shipping calculation" },
        shipping_method: { type: "string", description: "Preferred shipping method" }
      },
      required: ["destination_city", "items"]
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

// Enhanced system prompt with advanced MCP integration
const SYSTEM_PROMPT = `You are an advanced AI assistant for AutoSpares Kenya, a premium automotive parts specialist. You have sophisticated tools to help customers find the perfect auto parts for their vehicles.

ENHANCED CAPABILITIES:
- Intelligent product search with vehicle compatibility checking
- Real-time inventory management and availability
- Advanced product recommendations based on vehicle specifications
- Complete order processing with M-Pesa integration
- Shipping cost calculation and delivery estimates
- Technical specifications and installation guidance

AVAILABLE ADVANCED TOOLS:
1. get_products - Comprehensive product listings with advanced filtering
2. search_products - Natural language search with vehicle-specific matching
3. get_vehicle_compatibility - Check part compatibility with specific vehicles
4. get_product_recommendations - AI-powered product suggestions
5. create_order - Complete order creation with validation
6. initiate_mpesa_payment - Secure M-Pesa payment processing
7. check_inventory - Real-time stock availability
8. get_shipping_estimate - Delivery cost and time calculations

ADVANCED RESPONSE GUIDELINES:
- Always use vehicle compatibility checking for part recommendations
- Provide multiple options at different price points when possible
- Include installation difficulty and requirements in recommendations
- Suggest complementary parts when relevant (brake pads + discs, etc.)
- Offer performance upgrades when appropriate
- Calculate total costs including shipping
- Only process M-Pesa payments (no other payment methods)
- Provide detailed technical specifications
- Consider seasonal factors (rainy season tires, etc.)

INTELLIGENT QUERY HANDLING:
- Parse complex multi-part queries (e.g., "I need brake pads and oil for my 2018 Toyota Corolla, budget under 10k")
- Understand vehicle-specific terminology and abbreviations
- Recognize performance vs. standard part requirements
- Handle warranty and return policy questions
- Provide maintenance schedules and replacement intervals

Remember: Use the advanced tools to provide comprehensive, accurate, and personalized automotive solutions.`;

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
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`, {
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