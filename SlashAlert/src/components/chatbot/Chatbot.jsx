
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Sparkles, User } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

const chatbotPrompt = `
You are a friendly and helpful customer support chatbot for an application called "SlashAlert".
Your goal is to assist users by answering their questions about the app's features and functionality.

Here is a summary of the SlashAlert app:
- **Core Function**: Users can track the prices of products from various online retailers (Amazon, Walmart, Target, etc.).
- **How it Works**: Users add a product by providing its name and URL. The app then monitors the price.
- **Key Features**:
  - **Dashboard**: Shows all tracked products and key stats.
  - **Price Alerts**: Users can set a target price and get notified via email when the price drops to that level.
  - **Price Comparison**: Users can compare prices for a product across multiple retailers to find the best deal.
  - **Voice Commands**: Users can add a new product by simply speaking its name.
  - **Receipt Import**: Users can upload a photo of a receipt to automatically add products.
  - **Reviews Page**: Users can read and write reviews about the SlashAlert service.
- **Subscription Plans**:
  - **Free Plan**: Track up to 5 products, daily price checks.
  - **Premium Plan**: Unlimited product tracking, hourly price checks, instant "Check Price Now" feature, and SMS alerts.
- **Common Questions**:
  - How do I add a product? (Answer: Go to 'Add Product', enter the details, or use voice/receipt import).
  - How do alerts work? (Answer: Set a target price, and we'll email you when it's met).
  - Can I check the price instantly? (Answer: Yes, with the Premium plan's 'Check Price Now' feature).
  - How do I upgrade? (Answer: Go to the 'Account' page).

Keep your answers concise, friendly, and helpful. Always refer to the app as "SlashAlert".
`;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm the SlashAlert support assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a simplified history for the prompt
      const history = messages.map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n');
      
      const response = await InvokeLLM({
        prompt: `${chatbotPrompt}\n\nHere is the conversation so far:\n${history}\n\nUser: ${userMessage.text}\nAssistant:`,
        add_context_from_internet: false
      });

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Sorry, I seem to be having trouble connecting. Please try again in a moment.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full w-16 h-16 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 border-4 border-white"
          >
            {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
          </Button>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-xs">💬</span>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed bottom-24 right-6 z-40 w-full max-w-sm"
          >
            <Card className="shadow-2xl bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50 backdrop-blur-xl border-2 border-purple-200 overflow-hidden rounded-3xl">
              <CardHeader className="p-4 border-b-2 border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100">
                <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  Support Chat 🤖✨
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 items-end ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-xs">🤖</span>
                        </div>
                      )}
                      <div
                        className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-3 text-sm shadow-lg ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-br-sm'
                            : 'bg-gradient-to-br from-gray-100 to-purple-100 text-gray-800 rounded-bl-sm border-2 border-purple-200'
                        }`}
                      >
                        {message.text}
                      </div>
                      {message.sender === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-xs">😊</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 items-end justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">🤖</span>
                      </div>
                      <div className="max-w-xs md:max-w-sm rounded-2xl px-4 py-3 text-sm bg-gradient-to-br from-gray-100 to-purple-100 text-gray-800 rounded-bl-sm border-2 border-purple-200">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                          <span>Thinking... 🤔</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="border-t-2 border-purple-200 p-4 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message... ✨"
                    className="flex-1 rounded-2xl border-2 border-purple-200 focus:border-pink-300"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !input.trim()}
                    className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
