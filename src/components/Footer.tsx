import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Phone, 
  Mail, 
  MapPin,
  Truck,
  Shield,
  Clock
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Features Bar */}
      <div className="border-b border-primary-foreground/20">
        <div className="container mx-auto px-4 py-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <Truck className="w-6 h-6 text-kenya-gold" />
              <div>
                <div className="font-semibold">Free Delivery</div>
                <div className="text-sm text-primary-foreground/80">On orders over KSh 5,000</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-6 h-6 text-kenya-gold" />
              <div>
                <div className="font-semibold">Quality Guarantee</div>
                <div className="text-sm text-primary-foreground/80">Genuine parts only</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Clock className="w-6 h-6 text-kenya-gold" />
              <div>
                <div className="font-semibold">24/7 Support</div>
                <div className="text-sm text-primary-foreground/80">Expert assistance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-kenya-gold rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-sm">KP</span>
              </div>
              <h3 className="text-xl font-bold">Kenya Parts</h3>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Kenya's trusted platform for genuine motor vehicle spares with AI-powered search and expert support.
            </p>
            <div className="flex gap-3">
              <Button size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Instagram className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-kenya-gold">Quick Links</h4>
            <div className="space-y-2">
              {["About Us", "Contact", "FAQs", "Shipping Info", "Returns", "Privacy Policy"].map((link) => (
                <a 
                  key={link} 
                  href="#" 
                  className="block text-primary-foreground/80 hover:text-kenya-gold transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4 text-kenya-gold">Categories</h4>
            <div className="space-y-2">
              {["Engine Parts", "Brake System", "Electrical", "Suspension", "Transmission", "Tools"].map((category) => (
                <a 
                  key={category} 
                  href="#" 
                  className="block text-primary-foreground/80 hover:text-kenya-gold transition-colors"
                >
                  {category}
                </a>
              ))}
            </div>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-4 text-kenya-gold">Contact Us</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-kenya-gold" />
                  <span className="text-primary-foreground/80">+254 700 123 456</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-kenya-gold" />
                  <span className="text-primary-foreground/80">support@kenyaparts.co.ke</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-kenya-gold" />
                  <span className="text-primary-foreground/80">Nairobi, Kenya</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-kenya-gold">Newsletter</h4>
              <div className="space-y-2">
                <Input 
                  type="email" 
                  placeholder="Your email address"
                  className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60"
                />
                <Button 
                  className="w-full bg-kenya-gold text-primary hover:bg-kenya-gold/90"
                  size="sm"
                >
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/80 text-sm">
              © 2024 Kenya Parts. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-primary-foreground/80 hover:text-kenya-gold transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-primary-foreground/80 hover:text-kenya-gold transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;