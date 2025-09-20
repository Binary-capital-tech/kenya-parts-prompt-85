-- Create chat sessions table for persistent chat history
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  user_token TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create M-Pesa payments table
CREATE TABLE public.mpesa_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  phone_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  checkout_request_id TEXT,
  merchant_request_id TEXT,
  mpesa_receipt_number TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  result_code INTEGER,
  result_desc TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add more products to the database
INSERT INTO public.products (name, description, sku, brand, price, sale_price, category_id, stock_quantity, part_number, is_active, is_featured, rating, warranty_period, tags)
VALUES 
-- Brake System Products
('Premium Brake Disc & Pads Set', 'High-performance brake discs and pads for excellent stopping power and durability. Engineered for European vehicles with superior ceramic compound technology.', 'BRK-001', 'Brembo', 8500, 8500, NULL, 50, 'AS0001', true, true, 4.8, '2 years', ARRAY['brake', 'premium', 'ceramic']),
('Ceramic Brake Pads', 'Low-dust ceramic brake pads for quiet operation and excellent stopping power. Perfect for daily driving with minimal brake dust.', 'BRK-002', 'Akebono', 4200, 4200, NULL, 75, 'AS0002', true, false, 4.6, '2 years', ARRAY['brake', 'ceramic', 'quiet']),
('Sports Brake Discs', 'Slotted and drilled brake discs for enhanced cooling and performance. Ideal for high-performance vehicles and track use.', 'BRK-003', 'EBC', 6800, 6800, NULL, 30, 'AS0003', true, false, 4.9, '2 years', ARRAY['brake', 'sports', 'performance']),
('Brake Caliper Complete', 'Complete brake caliper assembly with piston and seals. Direct OEM replacement for reliable braking performance.', 'BRK-004', 'Bosch', 12500, 11200, NULL, 20, 'AS0004', true, false, 4.7, '3 years', ARRAY['brake', 'caliper', 'complete']),

-- Engine Components
('High Performance Air Filter', 'Reusable high-flow air filter for improved performance and engine protection. Washable and designed to last up to 50,000 miles.', 'ENG-001', 'K&N', 2800, 2800, NULL, 100, 'AS0005', true, true, 4.7, '10 years', ARRAY['engine', 'air filter', 'reusable']),
('OEM Air Filter', 'Original equipment quality air filter for optimal engine protection. Meets all manufacturer specifications.', 'ENG-002', 'Mann Filter', 1500, 1500, NULL, 150, 'AS0006', true, false, 4.5, '1 year', ARRAY['engine', 'air filter', 'oem']),
('Carbon Cabin Filter', 'Activated carbon cabin air filter for clean air inside your vehicle. Removes odors and pollutants effectively.', 'INT-001', 'Bosch', 3200, 3200, NULL, 80, 'AS0007', true, false, 4.8, '1 year', ARRAY['interior', 'cabin filter', 'carbon']),
('Spark Plugs Set', 'High-performance iridium spark plugs for improved ignition and fuel efficiency. Set of 4 plugs.', 'ENG-003', 'NGK', 3600, 3200, NULL, 200, 'AS0008', true, false, 4.9, '3 years', ARRAY['engine', 'spark plugs', 'iridium']),

-- Lighting System
('LED Headlight Assembly', 'Premium LED headlight with excellent brightness and longevity. 6000K color temperature for clear white light.', 'LIG-001', 'Philips', 15500, 15500, NULL, 25, 'AS0009', true, true, 4.9, '5 years', ARRAY['lighting', 'led', 'headlight']),
('Halogen Headlight Bulbs', 'High-quality halogen bulbs for standard headlights with enhanced brightness. Easy to install replacement.', 'LIG-002', 'Osram', 2400, 2400, NULL, 120, 'AS0010', true, false, 4.4, '2 years', ARRAY['lighting', 'halogen', 'bulbs']),
('HID Xenon Kit', 'Complete HID conversion kit for brighter lighting. Includes ballast and all necessary wiring harness.', 'LIG-003', 'Hella', 8900, 8900, NULL, 35, 'AS0011', true, false, 4.7, '3 years', ARRAY['lighting', 'hid', 'xenon']),
('LED Tail Light Set', 'Complete LED tail light assembly for enhanced visibility and style. Direct plug-and-play replacement.', 'LIG-004', 'Valeo', 6800, 6100, NULL, 40, 'AS0012', true, false, 4.6, '3 years', ARRAY['lighting', 'led', 'tail light']),

-- Fluids and Lubricants
('Full Synthetic Engine Oil', 'Premium full synthetic motor oil for maximum protection and performance in all driving conditions. 5W-30 grade.', 'FLU-001', 'Mobil 1', 6200, 6200, NULL, 80, 'AS0013', true, true, 4.8, '1 year', ARRAY['fluids', 'engine oil', 'synthetic']),
('Conventional Motor Oil', 'High-quality conventional motor oil for everyday driving protection. 10W-40 grade for standard engines.', 'FLU-002', 'Castrol', 3800, 3800, NULL, 120, 'AS0014', true, false, 4.5, '1 year', ARRAY['fluids', 'engine oil', 'conventional']),
('Transmission Fluid', 'Premium automatic transmission fluid for smooth shifting and transmission longevity. ATF+4 specification.', 'FLU-003', 'Valvoline', 4500, 4500, NULL, 60, 'AS0015', true, false, 4.6, '1 year', ARRAY['fluids', 'transmission', 'automatic']),
('Coolant Antifreeze', 'Long-life coolant antifreeze for engine temperature control. Protects against freezing and overheating.', 'FLU-004', 'Prestone', 2800, 2500, NULL, 90, 'AS0016', true, false, 4.7, '5 years', ARRAY['fluids', 'coolant', 'antifreeze']),

-- Suspension and Steering
('Shock Absorber Set', 'Gas-filled shock absorbers for improved ride comfort and handling. Set of 4 pieces for complete replacement.', 'SUS-001', 'Monroe', 18500, 16900, NULL, 20, 'AS0017', true, false, 4.8, '5 years', ARRAY['suspension', 'shock absorber', 'comfort']),
('Strut Assembly', 'Complete strut assembly with spring and mount. Ready to install for restored ride quality.', 'SUS-002', 'KYB', 8900, 8900, NULL, 30, 'AS0018', true, false, 4.7, '3 years', ARRAY['suspension', 'strut', 'complete']),
('Power Steering Pump', 'Electric power steering pump for effortless steering control. Direct OEM replacement unit.', 'STE-001', 'ZF', 14500, 13200, NULL, 15, 'AS0019', true, false, 4.6, '2 years', ARRAY['steering', 'power steering', 'pump']),

-- Electrical Components
('Car Battery', 'Maintenance-free car battery with 3-year warranty. 70Ah capacity for reliable starting power.', 'ELE-001', 'Varta', 8500, 7900, NULL, 25, 'AS0020', true, false, 4.8, '3 years', ARRAY['electrical', 'battery', '70ah']),
('Alternator', 'High-output alternator for reliable charging system. 120A capacity with built-in voltage regulator.', 'ELE-002', 'Denso', 12800, 12800, NULL, 18, 'AS0021', true, false, 4.7, '2 years', ARRAY['electrical', 'alternator', '120a']),
('Starter Motor', 'Heavy-duty starter motor for reliable engine starting. Gear reduction design for improved durability.', 'ELE-003', 'Hitachi', 9800, 8900, NULL, 22, 'AS0022', true, false, 4.6, '2 years', ARRAY['electrical', 'starter', 'motor']);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpesa_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can manage chat sessions" 
ON public.chat_sessions 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can manage chat messages" 
ON public.chat_messages 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can manage mpesa payments" 
ON public.mpesa_payments 
FOR ALL 
USING (true);

-- Create function for database queries (controlled SQL execution)
CREATE OR REPLACE FUNCTION public.execute_controlled_query(query_type TEXT, query_params JSONB DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Only allow specific predefined queries for security
    CASE query_type
        WHEN 'get_products' THEN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'name', name,
                    'description', description,
                    'brand', brand,
                    'price', price,
                    'category', 'Auto Parts',
                    'inStock', stock_quantity > 0,
                    'rating', rating
                )
            ) INTO result
            FROM products 
            WHERE is_active = true
            LIMIT 20;
            
        WHEN 'search_products' THEN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'name', name,
                    'description', description,
                    'brand', brand,
                    'price', price,
                    'category', 'Auto Parts',
                    'inStock', stock_quantity > 0,
                    'rating', rating
                )
            ) INTO result
            FROM products 
            WHERE is_active = true 
            AND (
                name ILIKE '%' || (query_params->>'search')::TEXT || '%' 
                OR description ILIKE '%' || (query_params->>'search')::TEXT || '%'
                OR brand ILIKE '%' || (query_params->>'search')::TEXT || '%'
                OR (query_params->>'search')::TEXT = ANY(tags)
            )
            LIMIT 10;
            
        WHEN 'create_order' THEN
            INSERT INTO orders (
                customer_id, 
                subtotal, 
                total_amount, 
                shipping_address, 
                billing_address,
                order_number
            ) VALUES (
                (query_params->>'customer_id')::UUID,
                (query_params->>'subtotal')::NUMERIC,
                (query_params->>'total_amount')::NUMERIC,
                query_params->'shipping_address',
                query_params->'billing_address',
                generate_order_number()
            )
            RETURNING jsonb_build_object('order_id', id, 'order_number', order_number) INTO result;
            
        ELSE
            result := '{"error": "Query type not allowed"}'::JSONB;
    END CASE;
    
    RETURN COALESCE(result, '{}'::JSONB);
END;
$$;