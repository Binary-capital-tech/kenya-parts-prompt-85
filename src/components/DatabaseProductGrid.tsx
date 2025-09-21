import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useCart, Product } from "./CartContext";
import { useToast } from "@/hooks/use-toast";

interface DatabaseProduct {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  rating: number;
  total_reviews: number;
  brand?: string;
  is_featured: boolean;
  stock_quantity: number;
}

interface ProductImage {
  product_id: string;
  image_url: string;
  is_primary: boolean;
}

const DatabaseProductGrid = () => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .limit(6);

      if (productsError) throw productsError;

      if (productsData) {
        setProducts(productsData);
        
        // Fetch product images
        const { data: imagesData, error: imagesError } = await supabase
          .from('product_images')
          .select('product_id, image_url, is_primary')
          .in('product_id', productsData.map(p => p.id))
          .eq('is_primary', true);

        if (!imagesError && imagesData) {
          const imageMap = imagesData.reduce((acc, img) => {
            acc[img.product_id] = img.image_url;
            return acc;
          }, {} as Record<string, string>);
          setProductImages(imageMap);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: DatabaseProduct) => {
    const cartProduct: Product = {
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: productImages[product.id] || '/src/assets/hero-parts.jpg',
      brand: product.brand,
      inStock: product.stock_quantity > 0
    };

    addToCart(cartProduct);
    
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading products...
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
                  src={productImages[product.id] || '/src/assets/hero-parts.jpg'}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.is_featured && (
                  <Badge 
                    className="absolute top-3 left-3 bg-kenya-red text-white"
                    variant="secondary"
                  >
                    Featured
                  </Badge>
                )}
                {product.sale_price && (
                  <Badge 
                    className="absolute top-3 right-3 bg-primary text-primary-foreground"
                    variant="secondary"
                  >
                    Sale
                  </Badge>
                )}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-primary mb-2 line-clamp-2">
                  {product.name}
                </h3>
                {product.brand && (
                  <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                )}
                
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
                    ({product.total_reviews})
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-primary">
                    KSh {(product.sale_price || product.price).toLocaleString()}
                  </span>
                  {product.sale_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      KSh {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                
                {product.stock_quantity > 0 ? (
                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="w-full"
                    size="sm"
                  >
                    Out of Stock
                  </Button>
                )}
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

export default DatabaseProductGrid;