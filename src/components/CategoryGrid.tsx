import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Wrench, 
  Zap, 
  Gauge, 
  Fuel, 
  Shield, 
  Settings, 
  Truck 
} from "lucide-react";

const categories = [
  { icon: Car, name: "Engine Parts", count: "2,500+ parts", color: "text-kenya-green" },
  { icon: Shield, name: "Brake System", count: "1,200+ parts", color: "text-kenya-red" },
  { icon: Zap, name: "Electrical", count: "800+ parts", color: "text-automotive-blue" },
  { icon: Gauge, name: "Suspension", count: "600+ parts", color: "text-kenya-gold" },
  { icon: Fuel, name: "Fuel System", count: "400+ parts", color: "text-kenya-green" },
  { icon: Settings, name: "Transmission", count: "350+ parts", color: "text-automotive-blue" },
  { icon: Wrench, name: "Tools & Equipment", count: "1,000+ items", color: "text-kenya-red" },
  { icon: Truck, name: "Commercial Vehicle", count: "500+ parts", color: "text-kenya-gold" },
];

const CategoryGrid = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our extensive collection of automotive parts organized by category
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-card transition-all duration-300 cursor-pointer bg-gradient-card border-border/50"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className={`w-6 h-6 ${category.color}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-primary mb-1 group-hover:text-kenya-green transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.count}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            View All Categories
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;