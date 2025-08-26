import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Mic, Image, Code, Brain } from "lucide-react";

const AIDemo = () => {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([
    {
      type: "ai",
      content: "Hello! I'm Bwengye AI. I can help with research, coding, translations, and more. Try asking me something in English, Luganda, or Swahili!"
    }
  ]);

  const demoResponses = [
    "As an advanced AI assistant, I can help you with multi-modal tasks including text analysis, code generation, and contextual reasoning.",
    "Ndi Bwengye AI, omuyambi gw'amagezi ag'enkola. Nsobola okukuyamba mu kutonda, okusoma, n'okuvunaanya ebintu bingi.",
    "I can process complex queries across multiple domains including medicine, law, agriculture, and technology with African context awareness.",
    "My offline capabilities ensure you can access core AI features even with limited internet connectivity.",
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMessage = { type: "user", content: message };
    const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
    const aiResponse = { type: "ai", content: randomResponse };
    
    setConversation(prev => [...prev, newMessage, aiResponse]);
    setMessage("");
  };

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Experience the Future
          </h2>
          <p className="text-xl text-muted-foreground">
            Try Bwengye AI's intelligent conversation capabilities
          </p>
        </div>
        
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20 shadow-card">
          {/* Chat interface */}
          <div className="space-y-4 mb-6 h-80 overflow-y-auto">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    msg.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground border border-primary/20"
                  }`}
                >
                  {msg.type === "ai" && (
                    <Brain className="w-4 h-4 inline mr-2 text-primary" />
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          
          {/* Input area */}
          <div className="flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Bwengye AI anything..."
              className="flex-1 bg-background/50 border-primary/30"
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
            />
            <Button
              onClick={handleSend}
              variant="default"
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="ghost" size="sm" className="text-xs">
              <Mic className="w-3 h-3 mr-1" />
              Voice
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              <Image className="w-3 h-3 mr-1" />
              Vision
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              <Code className="w-3 h-3 mr-1" />
              Code
            </Button>
          </div>
        </Card>
        
        {/* Note about demo */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          This is a demo interface. <strong>Real AI functionality is now available!</strong> 
          <br />Sign up to experience the full power of Bwengye AI.
        </p>
      </div>
    </section>
  );
};

export default AIDemo;