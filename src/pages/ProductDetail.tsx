import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCart, Product } from "@/components/CartContext";
import { ArrowLeft, Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw } from "lucide-react";
import brakePartsImage from "@/assets/brake-parts.jpg";
import headlightImage from "@/assets/headlight.jpg";
import airFilterImage from "@/assets/air-filter.jpg";
import oilsImage from "@/assets/oils.jpg";

// Sample product data that matches the chat interface
const sampleProducts: { [key: string]: Product } = {
  "1": {
    id: 1,
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
    id: 2,
    name: "High Performance Air Filter",
    brand: "K&N",
    price: "KSh 2,800",
    originalPrice: "KSh 3,500",
    image: airFilterImage,
    rating: 4.7,
    description: "Reusable high-flow air filter for improved performance and engine protection. Washable and designed to last up to 50,000 miles.",
    category: "Engine",
    inStock: true
  },
  "3": {
    id: 3,
    name: "LED Headlight Assembly",
    brand: "Philips",
    price: "KSh 15,500",
    image: headlightImage,
    rating: 4.9,
    description: "Premium LED headlight with excellent brightness and longevity. 6000K color temperature for clear white light.",
    category: "Lighting",
    inStock: true
  },
  "4": {
    id: 4,
    name: "Full Synthetic Engine Oil",
    brand: "Mobil 1",
    price: "KSh 6,200",
    image: oilsImage,
    rating: 4.8,
    description: "Premium full synthetic motor oil for maximum protection and performance in all driving conditions.",
    category: "Fluids",
    inStock: true
  },
  "11": {
    id: 11,
    name: "Ceramic Brake Pads",
    brand: "Akebono",
    price: "KSh 4,200",
    image: brakePartsImage,
    rating: 4.6,
    description: "Low-dust ceramic brake pads for quiet operation and excellent stopping power.",
    category: "Brake System",
    inStock: true
  },
  "21": {
    id: 21,
    name: "OEM Air Filter",
    brand: "Mann Filter",
    price: "KSh 1,500",
    image: airFilterImage,
    rating: 4.5,
    description: "Original equipment quality air filter for optimal engine protection.",
    category: "Engine",
    inStock: true
  },
  "31": {
    id: 31,
    name: "Halogen Headlight Bulbs",
    brand: "Osram",
    price: "KSh 2,400",
    image: headlightImage,
    rating: 4.4,
    description: "High-quality halogen bulbs for standard headlights with enhanced brightness.",
    category: "Lighting",
    inStock: true
  },
  "41": {
    id: 41,
    name: "Conventional Motor Oil",
    brand: "Castrol",
    price: "KSh 3,800",
    image: oilsImage,
    rating: 4.5,
    description: "High-quality conventional motor oil for everyday driving protection.",
    category: "Fluids",
    inStock: true
  }
};

const ProductDetail = () => {
  const { productId } = useParams();
  const { toast } = useToast();
  const { addToCart, getTotalItems } = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const product = sampleProducts[productId as string];

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < selectedQuantity; i++) {
      addToCart(product);
    }
    toast({
      title: "Added to cart",
      description: `${selectedQuantity}x ${product.name} added to your cart.`,
    });
  };

  const features = [
    "High-quality materials and construction",
    "OEM equivalent or better performance",
    "Easy installation with detailed instructions",
    "Comprehensive warranty coverage",
    "Tested for durability and reliability"
  ];

  const specifications = {
    "Part Number": `AS${product.id.toString().padStart(4, '0')}`,
    "Brand": product.brand,
    "Category": product.category,
    "Compatibility": "Universal fit (check vehicle manual)",
    "Warranty": "2 years or 24,000 miles"
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Chat</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-xl font-bold text-primary">autospares</h1>
          {getTotalItems() > 0 && (
            <>
              <div className="h-6 w-px bg-border" />
              <Badge variant="secondary">{getTotalItems()} items in cart</Badge>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-card shadow-sm border">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Product Features */}
            <Card className="lg:hidden">
              <CardHeader>
                <CardTitle className="text-lg">Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Info */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="text-sm">{product.category}</Badge>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">by {product.brand}</p>
              
              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {product.rating} rating
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-primary">{product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {product.originalPrice}
                  </span>
                )}
                {product.originalPrice && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    Save {Math.round(((parseInt(product.originalPrice.replace(/[^\d]/g, '')) - parseInt(product.price.replace(/[^\d]/g, ''))) / parseInt(product.originalPrice.replace(/[^\d]/g, ''))) * 100)}%
                  </Badge>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-6">
                {product.inStock ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">In Stock</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <label htmlFor="quantity" className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    className="h-10 w-10"
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 min-w-[3ch] text-center">{selectedQuantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    className="h-10 w-10"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.inStock ? `Add ${selectedQuantity} to Cart` : "Out of Stock"}
                </Button>
                <Button variant="outline" size="lg" className="px-6">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="font-medium">Fast Delivery</span>
                  <span className="text-xs text-muted-foreground">2-3 days</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-medium">Warranty</span>
                  <span className="text-xs text-muted-foreground">2 years</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                  <RotateCcw className="w-5 h-5 text-primary" />
                  <span className="font-medium">Returns</span>
                  <span className="text-xs text-muted-foreground">30 days</span>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>

            {/* Key Features - Desktop */}
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-lg">Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="font-medium text-sm">{key}:</span>
                      <span className="text-muted-foreground text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;