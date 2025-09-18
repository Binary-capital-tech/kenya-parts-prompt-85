-- Insert sample vehicle brands
INSERT INTO public.vehicle_brands (name, logo_url) VALUES
('Toyota', '/assets/brands/toyota.png'),
('Honda', '/assets/brands/honda.png'),
('Mercedes-Benz', '/assets/brands/mercedes.png'),
('BMW', '/assets/brands/bmw.png'),
('Nissan', '/assets/brands/nissan.png'),
('Hyundai', '/assets/brands/hyundai.png')
ON CONFLICT (name) DO NOTHING;

-- Insert sample vehicle models (using correct fuel_type values)
INSERT INTO public.vehicle_models (name, brand_id, fuel_type, year_from, year_to) 
SELECT 'Corolla', vb.id, 'petrol', 2010, 2024 FROM vehicle_brands vb WHERE vb.name = 'Toyota'
UNION ALL
SELECT 'Camry', vb.id, 'petrol', 2012, 2024 FROM vehicle_brands vb WHERE vb.name = 'Toyota'
UNION ALL
SELECT 'Civic', vb.id, 'petrol', 2011, 2024 FROM vehicle_brands vb WHERE vb.name = 'Honda'
UNION ALL
SELECT 'Accord', vb.id, 'petrol', 2013, 2024 FROM vehicle_brands vb WHERE vb.name = 'Honda'
UNION ALL
SELECT 'C-Class', vb.id, 'petrol', 2014, 2024 FROM vehicle_brands vb WHERE vb.name = 'Mercedes-Benz'
UNION ALL
SELECT '3 Series', vb.id, 'petrol', 2012, 2024 FROM vehicle_brands vb WHERE vb.name = 'BMW'
ON CONFLICT DO NOTHING;

-- Insert sample categories
INSERT INTO public.categories (name, description, image_url) VALUES
('Engine Parts', 'Engine components and accessories', '/assets/engine-parts.jpg'),
('Brake System', 'Brake pads, discs, and brake components', '/assets/brake-parts.jpg'),
('Electrical', 'Headlights, bulbs, and electrical components', '/assets/headlight.jpg'),
('Filters', 'Air filters, oil filters, and fuel filters', '/assets/air-filter.jpg'),
('Fluids & Oils', 'Engine oils, transmission fluids, and lubricants', '/assets/oils.jpg'),
('Suspension', 'Shock absorbers, springs, and suspension parts', '/assets/hero-parts.jpg')
ON CONFLICT (name) DO NOTHING;

-- Create a default store
INSERT INTO public.stores (store_name, description, is_active, is_verified) VALUES
('AutoSpares Kenya', 'Your trusted source for quality auto parts in Kenya', true, true)
ON CONFLICT DO NOTHING;

-- Insert sample products with Kenya Shilling pricing
INSERT INTO public.products (
    name, description, sku, brand, price, sale_price, category_id, store_id, 
    stock_quantity, is_active, is_featured, rating, total_reviews, 
    part_number, warranty_period, tags
) 
SELECT 
    'Premium Brake Pads Set',
    'High-quality ceramic brake pads for enhanced stopping power and durability. Fits most Toyota and Honda models.',
    'BP-001-PREM',
    'Akebono',
    8500.00,
    7500.00,
    c.id,
    s.id,
    50,
    true,
    true,
    4.5,
    23,
    'AK-BP-001',
    '12 months',
    ARRAY['brake', 'ceramic', 'premium']
FROM categories c, stores s 
WHERE c.name = 'Brake System' AND s.store_name = 'AutoSpares Kenya'
UNION ALL
SELECT 
    'LED Headlight Bulbs H4',
    'Bright LED headlight bulbs with 6000K white light. Easy installation and long-lasting performance.',
    'HL-002-LED',
    'Philips',
    4200.00,
    3800.00,
    c.id,
    s.id,
    75,
    true,
    true,
    4.7,
    156,
    'PH-LED-H4',
    '24 months',
    ARRAY['led', 'headlight', 'bulb']
FROM categories c, stores s 
WHERE c.name = 'Electrical' AND s.store_name = 'AutoSpares Kenya'
UNION ALL
SELECT 
    'Engine Air Filter',
    'High-flow air filter for improved engine performance and fuel efficiency. Universal fit for most vehicles.',
    'AF-003-UNI',
    'K&N',
    3500.00,
    NULL,
    c.id,
    s.id,
    30,
    true,
    false,
    4.3,
    89,
    'KN-AF-003',
    '6 months',
    ARRAY['filter', 'air', 'performance']
FROM categories c, stores s 
WHERE c.name = 'Filters' AND s.store_name = 'AutoSpares Kenya'
UNION ALL
SELECT 
    'Synthetic Engine Oil 5W-30',
    'Premium synthetic engine oil for optimal engine protection and performance. 4-liter container.',
    'OIL-004-SYN',
    'Mobil 1',
    6800.00,
    6200.00,
    c.id,
    s.id,
    120,
    true,
    true,
    4.8,
    234,
    'MB1-5W30-4L',
    '12 months',
    ARRAY['oil', 'synthetic', 'engine']
FROM categories c, stores s 
WHERE c.name = 'Fluids & Oils' AND s.store_name = 'AutoSpares Kenya'
UNION ALL
SELECT 
    'Shock Absorber Set - Front',
    'Heavy-duty shock absorbers for smooth ride and improved handling. Fits most sedans and SUVs.',
    'SA-005-HD',
    'Monroe',
    15800.00,
    14500.00,
    c.id,
    s.id,
    25,
    true,
    false,
    4.4,
    67,
    'MR-SA-005',
    '18 months',
    ARRAY['shock', 'absorber', 'suspension']
FROM categories c, stores s 
WHERE c.name = 'Suspension' AND s.store_name = 'AutoSpares Kenya'
UNION ALL
SELECT 
    'Timing Belt Kit',
    'Complete timing belt kit with tensioner and pulleys. Essential for engine maintenance.',
    'TB-006-KIT',
    'Gates',
    12500.00,
    11200.00,
    c.id,
    s.id,
    40,
    true,
    true,
    4.6,
    145,
    'GT-TB-006',
    '24 months',
    ARRAY['timing', 'belt', 'kit', 'engine']
FROM categories c, stores s 
WHERE c.name = 'Engine Parts' AND s.store_name = 'AutoSpares Kenya'
ON CONFLICT DO NOTHING;