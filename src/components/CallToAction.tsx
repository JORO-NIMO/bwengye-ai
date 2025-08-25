import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Github, Rocket } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-12 bg-gradient-to-br from-primary/10 via-accent/5 to-primary-glow/10 border-primary/20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Build the Future?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Bwengye AI needs backend infrastructure to unlock its full potential. 
            Connect to Supabase to enable real AI capabilities, user authentication, 
            and data storage.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4">
              <Rocket className="w-5 h-5 mr-2" />
              Connect Supabase
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="glow" size="lg" className="text-lg px-8 py-4">
              <Github className="w-5 h-5 mr-2" />
              View Documentation
            </Button>
          </div>
          
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-center mb-4">Next Steps for Full Implementation:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Connect Supabase for backend services</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Integrate AI APIs (OpenAI, Anthropic, etc.)</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Implement user authentication</span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Add conversation memory storage</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Deploy AI model fine-tuning</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Scale to production infrastructure</span>
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