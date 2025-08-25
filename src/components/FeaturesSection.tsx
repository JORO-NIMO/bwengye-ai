import { Card } from "@/components/ui/card";
import { 
  Brain, 
  Zap, 
  Shield, 
  Globe, 
  Languages, 
  Code, 
  GraduationCap,
  Smartphone
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Multi-Modal Intelligence",
    description: "Advanced AI that processes text, voice, vision, and code with contextual understanding surpassing GPT and Gemini.",
    gradient: "from-primary to-primary-glow"
  },
  {
    icon: Zap,
    title: "Lightning Performance",
    description: "Hybrid architecture combining large foundation models with fine-tuned experts for unmatched speed and accuracy.",
    gradient: "from-accent to-primary"
  },
  {
    icon: Globe,
    title: "Offline-First Design",
    description: "Core AI functionality works without internet. Perfect for areas with limited connectivity across Uganda.",
    gradient: "from-primary-glow to-accent"
  },
  {
    icon: Languages,
    title: "Multilingual Mastery",
    description: "Fluent in English, Luganda, Runyankore, Swahili, and Rukiga with cultural context awareness.",
    gradient: "from-primary to-accent"
  },
  {
    icon: Shield,
    title: "Privacy by Design",
    description: "Local device encryption, explainable AI reasoning, and full user control over data and memory.",
    gradient: "from-accent to-primary-glow"
  },
  {
    icon: Code,
    title: "Developer Companion",
    description: "Write, debug, and optimize code across multiple languages with GitHub integration and real-time assistance.",
    gradient: "from-primary-glow to-primary"
  },
  {
    icon: GraduationCap,
    title: "Educational Excellence",
    description: "AI tutoring, research assistance, and career guidance tailored for Ugandan universities and students.",
    gradient: "from-primary to-primary-glow"
  },
  {
    icon: Smartphone,
    title: "Universal Access",
    description: "Progressive Web App with native mobile clients. Integrates with WhatsApp, Telegram, and campus portals.",
    gradient: "from-accent to-primary"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 px-6 bg-secondary/10">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Surpassing Today's AI Leaders
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bwengye AI combines cutting-edge research with African innovation to deliver 
            the world's most capable, accessible, and culturally-aware AI assistant.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={idx}
                className="p-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-card group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
        
        {/* Comparison note */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-primary/5 border-primary/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Why Bwengye AI Leads the Pack
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-primary mb-2">vs. GPT/ChatGPT</h4>
                <p className="text-sm text-muted-foreground">
                  Better offline capabilities, African language support, and local context understanding.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">vs. Grok</h4>
                <p className="text-sm text-muted-foreground">
                  More platforms than just X, superior offline functionality, and educational focus.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-primary-glow mb-2">vs. Gemini</h4>
                <p className="text-sm text-muted-foreground">
                  Enhanced privacy controls, better multilingual support, and community-first approach.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;