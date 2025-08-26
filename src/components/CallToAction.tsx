import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Github, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CallToAction = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-12 bg-gradient-to-br from-primary/10 via-accent/5 to-primary-glow/10 border-primary/20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Experience the Future?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users already experiencing the power of Bwengye AI. 
            Start your journey with the most advanced AI assistant built for Africa.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => navigate("/auth")}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Using Bwengye AI
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="glow" 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => navigate("/auth")}
            >
              <Github className="w-5 h-5 mr-2" />
              Try It Free
            </Button>
          </div>
          
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-center mb-4">What You Get With Bwengye AI:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Advanced multi-modal AI capabilities</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Support for African languages</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Offline-first functionality</span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Privacy-focused architecture</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Educational and business tools</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Cultural context awareness</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CallToAction;