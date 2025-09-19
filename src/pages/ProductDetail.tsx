import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Plus, Minus, ShoppingCart, Heart, Shield, Truck } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/components/CartContext';
import brakePartsImage from '@/assets/brake-parts.jpg';
import airFilterImage from '@/assets/air-filter.jpg';
import headlightImage from '@/assets/headlight.jpg';
import oilsImage from '@/assets/oils.jpg';

const sampleProducts: { [key: string]: Product } = {
  "1": {
    id: "1",
    name: "Premium Brake Disc & Pads Set",
    brand: "Brembo",
    price: "KSh 8,500",
    originalPrice: "KSh 12,000",
    image: brakePartsImage,
    rating: 4.8,
    description: "High-performance brake discs and pads for excellent stopping power and durability. Engineered for European vehicles with superior ceramic compound technology.",
    category: "Brake System",
    inStock: true
  },
  "2": {
    id: "2",
    name: "High-Flow Air Filter",
    brand: "K&N",
    price: "KSh 3,200",
    originalPrice: "KSh 4,500",
    image: airFilterImage,
    rating: 4.7,
    description: "Reusable air filter that increases airflow and improves engine performance. Made with premium cotton gauze media for superior filtration.",
    category: "Engine",
    inStock: true
  },
  "3": {
    id: "3",
    name: "LED Headlight Kit",
    brand: "Philips",
    price: "KSh 5,800",
    image: headlightImage,
    rating: 4.9,
    description: "Ultra-bright LED headlights with 6000K color temperature for enhanced visibility and modern styling.",
    category: "Lighting",
    inStock: true
  },
  "4": {
    id: "4",
    name: "Synthetic Engine Oil 5W-30",
    brand: "Mobil 1",
    price: "KSh 2,800",
    image: oilsImage,
    rating: 4.8,
    description: "Advanced full synthetic motor oil for superior engine protection and performance in all conditions.",
    category: "Fluids",
    inStock: true
  },
  "5": {
    id: "5",
    name: "Shock Absorber Set",
    brand: "Monroe",
    price: "KSh 12,500",
    image: brakePartsImage,
    rating: 4.6,
    description: "Premium shock absorbers for improved ride comfort and vehicle stability.",
    category: "Suspension",
    inStock: true
  },
  "6": {
    id: "6",
    name: "Battery 12V 70Ah",
    brand: "Bosch",
    price: "KSh 9,200",
    image: airFilterImage,
    rating: 4.7,
    description: "Long-lasting automotive battery with excellent cold-cranking performance.",
    category: "Electrical",
    inStock: true
  },
  "7": {
    id: "7",
    name: "Timing Belt Kit",
    brand: "Gates",
    price: "KSh 4,200",
    image: headlightImage,
    rating: 4.5,
    description: "Complete timing belt kit with tensioner and idler pulleys for reliable engine timing.",
    category: "Engine",
    inStock: true
  },
  "8": {
    id: "8",
    name: "Spark Plugs Set of 4",
    brand: "NGK",
    price: "KSh 3,600",
    image: oilsImage,
    rating: 4.8,
    description: "High-performance spark plugs for optimal ignition and fuel efficiency.",
    category: "Engine",
    inStock: true
  }
};

const ProductDetail = () => {
  const { productId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = React.useState(1);

  const product = productId ? sampleProducts[productId] : null;

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    
    toast({
      title: "Added to cart!",
      description: `${quantity} x ${product.name} added to your cart.`,
    });
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
              />
              {product.originalPrice && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                  Save {Math.round(((parseInt(product.originalPrice.replace(/[^\d]/g, '')) - parseInt(product.price.replace(/[^\d]/g, ''))) / parseInt(product.originalPrice.replace(/[^\d]/g, ''))) * 100)}%
                </Badge>
              )}
              {product.inStock ? (
                <Badge className="absolute top-4 right-4 bg-green-500 text-white">
                  In Stock
                </Badge>
              ) : (
                <Badge className="absolute top-4 right-4 bg-red-500 text-white">
                  Out of Stock
                </Badge>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {product.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {product.brand}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-4">{product.name}</h1>
              
              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">{renderStars(product.rating)}</div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} out of 5 stars
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl font-bold text-primary">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {product.originalPrice}
                    </span>
                  )}
                </div>
                {product.originalPrice && (
                  <p className="text-sm text-green-600 font-medium">
                    You save KSh {(parseInt(product.originalPrice.replace(/[^\d]/g, '')) - parseInt(product.price.replace(/[^\d]/g, ''))).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Product Description</h3>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementQuantity}
                    className="h-10 w-10 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-16 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementQuantity}
                    className="h-10 w-10 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart & Wishlist */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg" className="px-6">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">Warranty</p>
                  <p className="text-sm text-muted-foreground">2 years manufacturer warranty</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
                <Truck className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">Free Delivery</p>
                  <p className="text-sm text-muted-foreground">Within Nairobi in 24-48 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;