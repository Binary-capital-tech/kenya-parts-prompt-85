import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Wrench, Truck, Star } from "lucide-react";
import heroImage from "@/assets/hero-parts.jpg";

const HeroSection = () => {
  return (
    <section className="bg-gradient-hero text-white py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Find Auto Parts with
                <span className="text-kenya-gold block">AI-Powered Search</span>
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Kenya's premier platform for motor vehicle spares. Chat with our AI to find exactly what you need for your car.
              </p>
            </div>

            {/* AI Chat Input */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-kenya-gold" />
                <span className="font-semibold">Ask our AI Assistant</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 'I need brake pads for Toyota Corolla 2018'"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
                <Button variant="secondary" className="bg-kenya-gold text-primary hover:bg-kenya-gold/90">
                  Ask AI
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Wrench className="w-6 h-6 text-kenya-gold" />
                </div>
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm text-white/80">Parts Available</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Truck className="w-6 h-6 text-kenya-gold" />
                </div>
                <div className="text-2xl font-bold">Fast</div>
                <div className="text-sm text-white/80">Delivery</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-6 h-6 text-kenya-gold" />
                </div>
                <div className="text-2xl font-bold">4.9</div>
                <div className="text-sm text-white/80">Rating</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="Auto parts collection"
              className="rounded-lg shadow-elegant w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;