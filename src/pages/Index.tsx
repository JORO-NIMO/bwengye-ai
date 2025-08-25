import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AIDemo from "@/components/AIDemo";
import CallToAction from "@/components/CallToAction";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <HeroSection />
      <FeaturesSection />
      <AIDemo />
      <CallToAction />
    </div>
  );
};

export default Index;
