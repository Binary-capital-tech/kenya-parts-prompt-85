import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Eye } from "lucide-react";
import brakePartsImage from "@/assets/brake-parts.jpg";
import headlightImage from "@/assets/headlight.jpg";
import airFilterImage from "@/assets/air-filter.jpg";
import oilsImage from "@/assets/oils.jpg";

const products = [
  {
    id: 1,
    name: "Premium Brake Disc & Pads Set",
    price: "KSh 8,500",
    originalPrice: "KSh 12,000",
    image: brakePartsImage,
    rating: 4.8,
    reviews: 124,
    badge: "Best Seller"
  },
  {
    id: 2,
    name: "LED Headlight Assembly",
    price: "KSh 15,500",
    originalPrice: null,
    image: headlightImage,
    rating: 4.9,
    reviews: 89,
    badge: "New"
  },
  {
    id: 3,
    name: "High Performance Air Filter",
    price: "KSh 2,800",
    originalPrice: "KSh 3,500",
    image: airFilterImage,
    rating: 4.7,
    reviews: 156,
    badge: "Sale"
  },
  {
    id: 4,
    name: "Engine Oil & Fluids Kit",
    price: "KSh 6,200",
    originalPrice: null,
    image: oilsImage,
    rating: 4.8,
    reviews: 203,
    badge: "Popular"
  }
];

const ProductGrid = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hand-picked quality parts from trusted suppliers
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="group hover:shadow-card transition-all duration-300 bg-gradient-card border-border/50"
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge 
                  className="absolute top-3 left-3 bg-kenya-red text-white"
                  variant="secondary"
                >
                  {product.badge}
                </Badge>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-primary mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating)
                          ? "text-kenya-gold fill-current"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({product.reviews})
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-primary">
                    {product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.originalPrice}
                    </span>
                  )}
                </div>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;