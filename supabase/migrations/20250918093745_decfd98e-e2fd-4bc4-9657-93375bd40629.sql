-- Insert sample vehicle brands
INSERT INTO public.vehicle_brands (name, logo_url) VALUES
('Toyota', '/assets/brands/toyota.png'),
('Honda', '/assets/brands/honda.png'),
('Mercedes-Benz', '/assets/brands/mercedes.png'),
('BMW', '/assets/brands/bmw.png'),
('Nissan', '/assets/brands/nissan.png'),
('Hyundai', '/assets/brands/hyundai.png');

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
SELECT '3 Series', vb.id, 'petrol', 2012, 2024 FROM vehicle_brands vb WHERE vb.name = 'BMW';

-- Insert sample categories
INSERT INTO public.categories (name, description, image_url) VALUES
('Engine Parts', 'Engine components and accessories', '/assets/engine-parts.jpg'),
('Brake System', 'Brake pads, discs, and brake components', '/assets/brake-parts.jpg'),
('Electrical', 'Headlights, bulbs, and electrical components', '/assets/headlight.jpg'),
('Filters', 'Air filters, oil filters, and fuel filters', '/assets/air-filter.jpg'),
('Fluids & Oils', 'Engine oils, transmission fluids, and lubricants', '/assets/oils.jpg'),
('Suspension', 'Shock absorbers, springs, and suspension parts', '/assets/hero-parts.jpg');

-- Create a default store
INSERT INTO public.stores (store_name, description, is_active, is_verified) VALUES
('AutoSpares Kenya', 'Your trusted source for quality auto parts in Kenya', true, true);