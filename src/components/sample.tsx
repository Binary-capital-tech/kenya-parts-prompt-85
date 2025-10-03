import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
// Model Context Protocol - Define available tools
const MCP_TOOLS = [
  {
    name: "get_products",
    description: "Get list of available auto parts products from the database",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Product category filter"
        },
        search: {
          type: "string",
          description: "Search term"
        },
        limit: {
          type: "number",
          description: "Number of products to return (default 10)"
        }
      }
    }
  },
  {
    name: "search_products",
    description: "Search for specific auto parts by name, brand, or description",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for product name, brand, or description"
        }
      },
      required: [
        "query"
      ]
    }
  },
  {
    name: "get_cart_status",
    description: "Get current cart status for the session - ALWAYS use this when user asks about their cart, checkout, or payment",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "sync_cart",
    description: "Sync cart items from frontend to backend database",
    parameters: {
      type: "object",
      properties: {
        cart_items: {
          type: "array",
          description: "Array of cart items to sync",
          items: {
            type: "object",
            properties: {
              product_id: {
                type: "string"
              },
              product_name: {
                type: "string"
              },
              brand: {
                type: "string"
              },
              quantity: {
                type: "number"
              },
              unit_price: {
                type: "number"
              },
              image_url: {
                type: "string"
              }
            }
          }
        }
      },
      required: [
        "cart_items"
      ]
    }
  },
  {
    name: "create_order",
    description: "Create a new order for the customer",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          description: "Array of order items with product_id and quantity",
          items: {
            type: "object",
            properties: {
              product_id: {
                type: "string"
              },
              quantity: {
                type: "number"
              }
            }
          }
        },
        customer_info: {
          type: "object",
          description: "Customer information including firstName, lastName, email, phone, address"
        },
        total_amount: {        type: "number",
          description: "Total order amount in KSh"
        }
      },
      required: [
        "items",
        "customer_info",
        "total_amount"
      ]
    }
  },
  {
    name: "initiate_mpesa_payment",
    description: "Initiate M-Pesa payment for an order",
    parameters: {
      type: "object",
      properties: {
        phone_number: {
          type: "string",
          description: "M-Pesa phone number (format: 254XXXXXXXXX)"
        },
        amount: {
          type: "number",
          description: "Payment amount in KSh"
        },
        order_id: {
          type: "string",
          description: "Order ID for the payment"
        }
      },
      required: [
        "phone_number",
        "amount"
      ]
    }
  }
];
// MCP Tool execution with direct database queries
async function executeMCPTool(toolName, args, sessionId) {
  console.log(`Executing MCP tool: ${toolName} with args:`, JSON.stringify(args));
  try {
    switch(toolName){
      case "get_products":
        {
          const limit = args.limit || 10;
          let query = supabase.from('products').select('*').limit(limit);
          if (args.category) {
            query = query.eq('category_id', args.category);
          }
          if (args.search) {
            query = query.or(`name.ilike.%${args.search}%,brand.ilike.%${args.search}%,description.ilike.%${args.search}%`);
          }
          const { data, error } = await query;
          if (error) {
            console.error('Error getting products:', error);
            throw error;
          }
          return data || [];
        }
      case "search_products":
        {
          const searchTerm = args.query;
          const { data, error } = await supabase.from('products').select('*').or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`).limit(10);
          if (error) {
            console.error('Error searching products:', error);
            throw error;
          }
          return data || [];
        }
      case "get_cart_status":
        {
          const { data: cartItems, error: cartError } = await supabase.from('session_cart_items').select('*').eq('session_id', sessionId).order('created_at', {
            ascending: true
          });
          if (cartError) {
            console.error('Error fetching cart:', cartError);
            throw cartError;
          }
          const items = cartItems || [];
          const totalItems = items.reduce((sum, item)=>sum + item.quantity, 0);
          const totalValue = items.reduce((sum, item)=>sum + item.unit_price * item.quantity, 0);
          return {
            items: items.map((item)=>({
                product_id: item.product_id,
                product_name: item.product_name,
                brand: item.brand,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.unit_price * item.quantity,
                image_url: item.image_url
              })),
            total_items: totalItems,
            total_value: totalValue,
            has_items: totalItems > 0,
            formatted_total: `KSh ${totalValue.toLocaleString()}`
          };
        }
      case "sync_cart":
        {
          // Delete existing cart items for this session
          const { error: deleteError } = await supabase.from('session_cart_items').delete().eq('session_id', sessionId);
          if (deleteError && deleteError.code !== 'PGRST116') {
            console.error('Error clearing cart:', deleteError);
            throw deleteError;
          }
          // Insert new cart items if any exist
          if (args.cart_items && args.cart_items.length > 0) {
            const cartItems = args.cart_items.map((item)=>({
                session_id: sessionId,
                product_id: item.product_id,
                product_name: item.product_name,
                brand: item.brand || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                image_url: item.image_url || ''
              }));
            const { error: insertError } = await supabase.from('session_cart_items').insert(cartItems);
            if (insertError) {
              console.error('Error inserting cart items:', insertError);
              throw insertError;
            }
          }
          return {
            success: true,
            message: `Cart synced successfully with ${args.cart_items?.length || 0} items`,
            synced_count: args.cart_items?.length || 0
          };
        }
      case "create_order":
        {
          const { data: customer, error: customerError } = await supabase.from('customers').insert({
            full_name: `${args.customer_info.firstName} ${args.customer_info.lastName}`,
            email: args.customer_info.email,
            phone: args.customer_info.phone
          }).select().single();
          if (customerError) {
            console.error('Error creating customer:', customerError);
            throw customerError;
          }
          const orderNumber = `ORD-${Date.now()}`;
          const { data: order, error: orderError } = await supabase.from('orders').insert({
            customer_id: customer.id,
            order_number: orderNumber,
            subtotal: args.total_amount,
            total_amount: args.total_amount,
            status: 'pending',
            shipping_address: args.customer_info.address || args.customer_info,
            billing_address: args.customer_info.address || args.customer_info
          }).select().single();
          if (orderError) {
            console.error('Error creating order:', orderError);
            throw orderError;
          }
          if (args.items && args.items.length > 0) {
            const orderItems = args.items.map((item)=>({
                order_id: order.id,
                product_id: item.product_id,
                product_name: item.name || 'Product',
                product_sku: item.sku || `SKU-${Date.now()}`,
                quantity: item.quantity,
                unit_price: item.price || 0,
                total_price: (item.price || 0) * item.quantity
              }));
            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) {
              console.error('Error creating order items:', itemsError);
              throw itemsError;
            }
          }
          return {
            order_id: order.id,
            order_number: orderNumber,
            customer_id: customer.id,
            total_amount: order.total_amount,
            status: order.status
          };
        }
      case "initiate_mpesa_payment":
        {
          const { data: payment, error: paymentError } = await supabase.from('mpesa_payments').insert({
            phone_number: args.phone_number,
            amount: args.amount,
            order_id: args.order_id || null,
            status: 'pending'
          }).select().single();
          if (paymentError) {
            console.error('Error initiating payment:', paymentError);
            throw paymentError;
          }
          return {
            payment_id: payment.id,
            status: 'initiated',
            message: `M-Pesa payment of KSh ${args.amount.toLocaleString()} initiated to ${args.phone_number}. Please check your phone for the payment prompt.`
          };
        }
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    throw error;
  }
}
// Get chat history for context
async function getChatHistory(sessionId, limit = 10) {
  try {
    const { data, error } = await supabase.from('chat_messages').select('message_type, content, metadata').eq('session_id', sessionId).order('created_at', {
      ascending: true
    }).limit(limit);
    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
    if (!data || data.length === 0) {
      return [];
    }
    const history = [];
    for (const msg of data){
      if (msg.message_type === 'user') {
        history.push({
          role: 'user',
          parts: [
            {
              text: msg.content
            }
          ]
        });
      } else if (msg.message_type === 'assistant') {
        if (msg.metadata && msg.metadata.toolResults && msg.metadata.toolResults.length > 0) {
          const toolParts = [];
          for (const toolResult of msg.metadata.toolResults){
            toolParts.push({
              functionCall: {
                name: toolResult.tool,
                args: toolResult.args || {}
              }
            });
          }
          if (toolParts.length > 0) {
            history.push({
              role: 'model',
              parts: toolParts
            });
            const responseParts = [];
            for (const toolResult of msg.metadata.toolResults){
              responseParts.push({
                functionResponse: {
                  name: toolResult.tool,
                  response: {
                    content: toolResult.result || toolResult.error
                  }
                }
              });
            }
            history.push({
              role: 'user',
              parts: responseParts
            });
          }
        }
        history.push({
          role: 'model',
          parts: [
            {
              text: msg.content
            }
          ]
        });
      }
    }
    console.log(`Loaded ${history.length} messages from chat history`);
    return history;
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    return [];
  }
}
// Generate a unique session token
function generateSessionToken() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${randomStr}`;
}
// Enhanced system prompt with cart awareness
const SYSTEM_PROMPT = `You are an intelligent AI assistant for AutoSpares Kenya, a premium auto parts store. You help customers find the right auto parts for their vehicles using advanced tools and database integration.

CORE CAPABILITIES:
- Search and recommend auto parts using real product database
- Track customer cart items and provide cart-aware responses
- Process orders and handle M-Pesa payments
- Provide technical specifications and compatibility information
- Remember conversation context (vehicle models, previous searches, customer preferences, cart contents)

AVAILABLE TOOLS (Model Context Protocol):
1. get_products - Get list of available products with optional filters
2. search_products - Search for specific auto parts by name, brand, or description
3. get_cart_status - Get current cart status (CRITICAL: ALWAYS use when user asks about cart/checkout)
4. sync_cart - Sync cart items from frontend (automatically called by system)
5. create_order - Create customer orders with items
6. initiate_mpesa_payment - Process M-Pesa payments (Kenyan mobile money)

CART AWARENESS - CRITICAL RULES:
- When users say "what's in my cart", "my cart", "cart contents", "what did I add" → IMMEDIATELY call get_cart_status
- When users mention "checkout", "payment", "buy now", "proceed to checkout" → First call get_cart_status to confirm items
- Proactively mention cart when relevant: "I see you have brake pads in your cart..."
- If cart is empty, guide them: "Your cart is empty. Let me help you find parts!"
- NEVER assume cart contents - ALWAYS check with get_cart_status first

RESPONSE EXAMPLES:
User: "What's in my cart?"
You: [Call get_cart_status] "You have 3 items in your cart:
• Brake Pads - KSh 5,000 (Qty: 2)
• Air Filter - KSh 2,500 (Qty: 1)
Total: KSh 12,500. Ready to proceed to checkout?"

User: "I want to checkout"
You: [Call get_cart_status first] Then guide based on cart contents

User: "Show me oil filters"
You: [Call search_products] Present products, and if they have items in cart: "By the way, you currently have 2 items in your cart worth KSh 8,000"

CONTEXT AWARENESS:
- When a customer mentions a vehicle (e.g., "Toyota Corolla"), remember it for the entire conversation
- If they ask about different parts (brake pads, then headlights), assume it's for the same vehicle unless specified
- Reference previous searches and recommendations in your responses
- Build on previous conversation context naturally

RESPONSE GUIDELINES:
- Always search the database when customers ask about specific parts
- Provide detailed product information including compatibility
- Format product suggestions clearly with prices in KSh
- Guide customers through the purchase process step by step
- Only suggest M-Pesa payment (no other payment methods available)
- Be helpful, professional, and knowledgeable about automotive parts

Remember: You have access to real product data, conversation history, and cart status - always use them to provide accurate, contextual, and personalized responses.`;
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { message, sessionId, sessionToken, email, phone, isInitialLoad, cartItems } = await req.json();
    console.log('Received chat request:', {
      message,
      sessionId,
      sessionToken,
      email,
      phone,
      isInitialLoad,
      hasCartItems: !!cartItems
    });
    let validSessionToken = sessionToken;
    let validSessionId = sessionId;
    // Generate new token if not provided
    if (!validSessionToken) {
      validSessionToken = generateSessionToken();
      console.log('Generated new session token:', validSessionToken);
    }
    // Check if session ID is a valid UUID format
    const isValidUUID = (id)=>{
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };
    // If session ID is not a valid UUID, ignore it
    if (validSessionId && !isValidUUID(validSessionId)) {
      console.log(`Invalid session ID format: ${validSessionId}, will create new session`);
      validSessionId = null;
    }
    // Check if session exists by token
    if (validSessionToken) {
      const { data: existingSession, error: checkError } = await supabase.from('chat_sessions').select('*').eq('user_token', validSessionToken).single();
      if (!checkError && existingSession) {
        validSessionId = existingSession.id;
        console.log('Found existing session by token:', validSessionId);
      }
    }
    // If we have a valid UUID session ID, verify it exists
    if (validSessionId && isValidUUID(validSessionId)) {
      const { data: existingById, error: checkByIdError } = await supabase.from('chat_sessions').select('*').eq('id', validSessionId).single();
      if (checkByIdError || !existingById) {
        console.log(`Session ID ${validSessionId} not found in database, will create new`);
        validSessionId = null;
      }
    }
    // If no valid session ID, create new session
    if (!validSessionId) {
      const sessionData = {
        title: isInitialLoad ? 'Welcome Chat' : message.substring(0, 50),
        user_token: validSessionToken,
        updated_at: new Date().toISOString()
      };
      if (email) sessionData.email = email;
      if (phone) sessionData.phone = phone;
      const { data: newSession, error: createError } = await supabase.from('chat_sessions').insert(sessionData).select().single();
      if (createError) {
        console.error('Session creation error:', createError);
        throw createError;
      }
      validSessionId = newSession.id;
      console.log('Created new session with UUID:', validSessionId);
    } else {
      // Update existing session
      const updateData = {
        title: message.substring(0, 50),
        updated_at: new Date().toISOString()
      };
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      const { error: updateError } = await supabase.from('chat_sessions').update(updateData).eq('id', validSessionId);
      if (updateError) {
        console.error('Session update error:', updateError);
      } else {
        console.log('Updated existing session:', validSessionId);
      }
    }
    // Sync cart if provided
    if (cartItems && Array.isArray(cartItems) && cartItems.length >= 0) {
      try {
        await executeMCPTool('sync_cart', {
          cart_items: cartItems
        }, validSessionId);
        console.log('Cart synced successfully');
      } catch (error) {
        console.error('Cart sync error:', error);
      }
    }
    // Handle initial load request - get product recommendations
    if (isInitialLoad || message === 'GET_INITIAL_RECOMMENDATIONS') {
      console.log('Handling initial load request for product recommendations');
      try {
        const products = await executeMCPTool('get_products', {
          limit: 10
        }, validSessionId);
        const shuffled = products.sort(()=>0.5 - Math.random());
        const selectedProducts = shuffled.slice(0, 3);
        const responseText = "Welcome to AutoSpares Kenya! Here are some popular auto parts to get you started. What are you looking for today?";
        await supabase.from('chat_messages').insert([
          {
            session_id: validSessionId,
            message_type: 'assistant',
            content: responseText,
            metadata: {
              toolResults: [
                {
                  tool: 'get_products',
                  args: {
                    limit: 10
                  },
                  result: selectedProducts
                }
              ]
            },
            created_at: new Date().toISOString()
          }
        ]);
        return new Response(JSON.stringify({
          response: responseText,
          toolResults: [
            {
              tool: 'get_products',
              args: {
                limit: 10
              },
              result: selectedProducts
            }
          ],
          sessionId: validSessionId,
          sessionToken: validSessionToken
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error fetching initial products:', error);
        return new Response(JSON.stringify({
          response: "Welcome to AutoSpares Kenya! I'm here to help you find the perfect auto parts for your vehicle.",
          toolResults: [],
          sessionId: validSessionId,
          sessionToken: validSessionToken
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // Handle special cart operation messages
if (message === 'SYNC_CART' || message === 'GET_CART_STATUS') {
  console.log(`Handling special cart operation: ${message}`);
  
  try {
    let toolResult;
    
    if (message === 'SYNC_CART') {
      // Sync was already done above, just confirm
      return new Response(JSON.stringify({
        response: "Cart synchronized successfully.",
        toolResults: [],
        sessionId: validSessionId,
        sessionToken: validSessionToken
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (message === 'GET_CART_STATUS') {
      // Execute get_cart_status tool
      toolResult = await executeMCPTool('get_cart_status', {}, validSessionId);
      
      let responseText = '';
      if (toolResult.has_items) {
        const itemsList = toolResult.items.map((item: any) => 
          `• ${item.product_name} - KSh ${item.unit_price.toLocaleString()} (Qty: ${item.quantity})`
        ).join('\n');
        
        responseText = `You have ${toolResult.total_items} item(s) in your cart:\n\n${itemsList}\n\nTotal: ${toolResult.formatted_total}`;
      } else {
        responseText = "Your cart is currently empty.";
      }
      
      return new Response(JSON.stringify({
        response: responseText,
        toolResults: [{
          tool: 'get_cart_status',
          args: {},
          result: toolResult
        }],
        sessionId: validSessionId,
        sessionToken: validSessionToken
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error(`Error handling ${message}:`, error);
    return new Response(JSON.stringify({
      response: "Error processing cart operation.",
      toolResults: [],
      sessionId: validSessionId,
      sessionToken: validSessionToken
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
    // Get conversation history for context
    const chatHistory = validSessionId ? await getChatHistory(validSessionId, 10) : [];
    console.log(`Using ${chatHistory.length} previous messages for context`);
    // Build contents array with history + new message
    const contents = [
      ...chatHistory,
      {
        role: 'user',
        parts: [
          {
            text: message
          }
        ]
      }
    ];
    // Make request to Gemini API with function calling
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': Deno.env.get('GEMINI_API_KEY') || ''
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: SYSTEM_PROMPT
            }
          ]
        },
        contents: contents,
        tools: [
          {
            functionDeclarations: MCP_TOOLS
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      })
    });
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }
    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData, null, 2));
    let responseText = '';
    let toolResults = [];
    let needsSecondCall = false;
    // Process Gemini response
    if (geminiData.candidates && geminiData.candidates[0]) {
      const candidate = geminiData.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts){
          if (part.functionCall) {
            const toolName = part.functionCall.name;
            const args = part.functionCall.args || {};
            try {
              const toolResult = await executeMCPTool(toolName, args, validSessionId);
              toolResults.push({
                tool: toolName,
                args: args,
                result: toolResult
              });
              needsSecondCall = true;
            } catch (error) {
              console.error(`Error executing tool ${toolName}:`, error);
              toolResults.push({
                tool: toolName,
                args: args,
                error: error.message
              });
            }
          } else if (part.text) {
            responseText += part.text;
          }
        }
      }
    }
    // If tools were called, make second call to Gemini with results
    if (needsSecondCall && toolResults.length > 0) {
      const functionResponses = toolResults.map((result)=>({
          functionResponse: {
            name: result.tool,
            response: {
              content: result.result || result.error
            }
          }
        }));
      const secondResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': Deno.env.get('GEMINI_API_KEY') || ''
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: SYSTEM_PROMPT
              }
            ]
          },
          contents: [
            ...contents,
            {
              role: 'model',
              parts: geminiData.candidates[0].content.parts
            },
            {
              role: 'user',
              parts: functionResponses
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });
      if (secondResponse.ok) {
        const secondData = await secondResponse.json();
        console.log('Second Gemini response:', JSON.stringify(secondData, null, 2));
        if (secondData.candidates && secondData.candidates[0]) {
          responseText = secondData.candidates[0].content.parts.map((p)=>p.text || '').join('');
        }
      }
    }
    // If no response text, provide default
    if (!responseText) {
      responseText = "I'm here to help you find auto parts! What specific parts are you looking for your vehicle?";
    }
    // Store chat messages in database
    if (validSessionId) {
      const { error: messageError } = await supabase.from('chat_messages').insert([
        {
          session_id: validSessionId,
          message_type: 'user',
          content: message,
          created_at: new Date().toISOString()
        },
        {
          session_id: validSessionId,
          message_type: 'assistant',
          content: responseText,
          metadata: {
            toolResults
          },
          created_at: new Date().toISOString()
        }
      ]);
      if (messageError) console.error('Message insert error:', messageError);
    }
    return new Response(JSON.stringify({
      response: responseText,
      toolResults,
      sessionId: validSessionId,
      sessionToken: validSessionToken
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      response: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists."
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
