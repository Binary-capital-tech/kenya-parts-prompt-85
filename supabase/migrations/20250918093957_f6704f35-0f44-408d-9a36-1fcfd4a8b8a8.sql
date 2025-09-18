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
WHERE c.name = 'Engine Parts' AND s.store_name = 'AutoSpares Kenya';

-- Insert product images
INSERT INTO public.product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, '/assets/brake-parts.jpg', 'Premium Brake Pads Set', true, 1
FROM products p WHERE p.sku = 'BP-001-PREM'
UNION ALL
SELECT p.id, '/assets/headlight.jpg', 'LED Headlight Bulbs H4', true, 1
FROM products p WHERE p.sku = 'HL-002-LED'
UNION ALL
SELECT p.id, '/assets/air-filter.jpg', 'Engine Air Filter', true, 1
FROM products p WHERE p.sku = 'AF-003-UNI'
UNION ALL
SELECT p.id, '/assets/oils.jpg', 'Synthetic Engine Oil 5W-30', true, 1
FROM products p WHERE p.sku = 'OIL-004-SYN'
UNION ALL
SELECT p.id, '/assets/hero-parts.jpg', 'Shock Absorber Set - Front', true, 1
FROM products p WHERE p.sku = 'SA-005-HD'
UNION ALL
SELECT p.id, '/assets/hero-parts.jpg', 'Timing Belt Kit', true, 1
FROM products p WHERE p.sku = 'TB-006-KIT';