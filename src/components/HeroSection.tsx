import { Button } from "@/components/ui/button";
import { Brain, Zap, Globe, Shield } from "lucide-react";
import heroImage from "@/assets/ai-empowerment-hero.jpg";
import aiLogo from "@/assets/bwengye-ai-logo.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Hero background image with overlay */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img 
              src={aiLogo} 
              alt="Bwengye AI" 
              className="w-24 h-24 float-animation"
            />
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary-glow">
            Bwengye AI
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 text-muted-foreground">
            Next-Generation AI Assistant
          </p>
          
          <p className="text-lg md:text-xl mb-12 text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Surpassing Grok, GPT, and Gemini with <span className="text-accent font-semibold">intelligence</span>, 
            <span className="text-primary font-semibold"> speed</span>, and 
            <span className="text-primary-glow font-semibold"> African innovation</span>. 
            Built for Uganda's universities, businesses, and communities.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4">
              Experience Bwengye AI
            </Button>
            <Button variant="glow" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
          
          {/* Key features grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20">
              <Brain className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm font-medium">Multi-Modal AI</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-accent/20">
              <Zap className="w-8 h-8 text-accent mb-2" />
              <span className="text-sm font-medium">Lightning Fast</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-primary-glow/20">
              <Globe className="w-8 h-8 text-primary-glow mb-2" />
              <span className="text-sm font-medium">Offline First</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20">
              <Shield className="w-8 h-8 text-primary mb-2" />
              <span className="text-sm font-medium">Privacy by Design</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating elements for visual flair */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-primary/30 rounded-full blur-sm animate-pulse" />
      <div className="absolute bottom-32 right-16 w-6 h-6 bg-accent/40 rounded-full blur-sm animate-pulse delay-1000" />
      <div className="absolute top-1/3 right-8 w-3 h-3 bg-primary-glow/50 rounded-full blur-sm animate-pulse delay-500" />
    </section>
  );
};

export default HeroSection;