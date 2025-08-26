import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { 
  Send, 
  Brain, 
  LogOut, 
  Settings, 
  Plus, 
  MessageCircle,
  Loader2,
  Mic,
  Image as ImageIcon,
  Code,
  Sparkles
} from "lucide-react";
import aiLogo from "@/assets/bwengye-ai-logo.png";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  model_used?: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        } else {
          // Load conversations when user is authenticated
          setTimeout(() => {
            loadConversations();
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      })));
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const createNewConversation = async () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
    loadMessages(conversationId);
  };

  const sendMessage = async () => {
    if (!message.trim() || loading || !user) return;

    const userMessage = message;
    setMessage("");
    setLoading(true);

    try {
      // Add user message to UI immediately
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        content: userMessage,
        role: 'user',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // Call AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          conversationId: currentConversation,
          modelName: 'gpt-5-mini-2025-08-07'
        }
      });

      if (error) throw error;

      // Update conversation ID if this is a new conversation
      if (!currentConversation && data.conversationId) {
        setCurrentConversation(data.conversationId);
        loadConversations(); // Refresh conversations list
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: data.message,
        role: 'assistant',
        created_at: new Date().toISOString(),
        model_used: data.model
      };

      setMessages(prev => {
        // Remove temp message and add both real messages
        const withoutTemp = prev.filter(msg => !msg.id.startsWith('temp-'));
        return [...withoutTemp, {
          ...tempUserMessage,
          id: `user-${Date.now()}`
        }, aiMessage];
      });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error('Error signing out:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-card/50 backdrop-blur-sm border-r border-primary/20 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <img src={aiLogo} alt="Bwengye AI" className="w-10 h-10" />
              <div>
                <h1 className="font-bold text-lg text-foreground">Bwengye AI</h1>
                <p className="text-xs text-muted-foreground">Next-Gen Assistant</p>
              </div>
            </div>
            
            <Button 
              onClick={createNewConversation}
              className="w-full justify-start"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`p-3 cursor-pointer hover:bg-primary/10 transition-colors ${
                    currentConversation === conv.id ? 'bg-primary/20 border-primary/40' : 'border-primary/20'
                  }`}
                  onClick={() => selectConversation(conv.id)}
                >
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(conv.updated_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              
              {conversations.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Start a new chat to begin
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* User menu */}
          <div className="p-4 border-t border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.user_metadata?.display_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b border-primary/20 bg-card/30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">
                  {currentConversation ? "Bwengye AI Chat" : "New Conversation"}
                </span>
              </div>
            </div>
            
            {sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to Bwengye AI
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Your advanced AI assistant is ready to help with research, coding, 
                  translations, and more. What would you like to explore today?
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => setMessage("Hello, can you introduce yourself?")}>
                    <Brain className="w-3 h-3 mr-1" />
                    Introduction
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMessage("Help me write some Python code")}>
                    <Code className="w-3 h-3 mr-1" />
                    Code Help
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMessage("Translate this to Luganda: Hello, how are you?")}>
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Translation
                  </Button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-primary/20"
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>{formatTime(msg.created_at)}</span>
                    {msg.model_used && (
                      <span className="text-xs">{msg.model_used}</span>
                    )}
                  </div>
                </div>
                
                {msg.role === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-card border border-primary/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t border-primary/20 bg-card/30 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Mic className="w-3 h-3 mr-1" />
                    Voice
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Image
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Code className="w-3 h-3 mr-1" />
                    Code
                  </Button>
                </div>
                
                <div className="flex gap-3">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message Bwengye AI..."
                    className="flex-1 bg-background/50 border-primary/30"
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={loading || !message.trim()}
                    variant="default"
                    size="icon"
                    className="shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Bwengye AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;