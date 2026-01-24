import React, { useState } from 'react';
import { MessageCircle, Send, Bot, User, Sparkles } from 'lucide-react';
import { chatbotFAQs } from '../../data/dummyData';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hello! I'm your health assistant. I can help you with questions about your medications, diet, and appointments. Try asking me something!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      // Find matching FAQ
      const matchingFAQ = chatbotFAQs.find(faq => 
        input.toLowerCase().includes(faq.question.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase()) ||
        faq.question.toLowerCase().includes(input.toLowerCase().split(' ').slice(0, 3).join(' ').toLowerCase())
      );

      const botMessage = {
        type: 'bot',
        text: matchingFAQ ? matchingFAQ.answer : "I'm here to help with questions about your medications, diet, and appointments. Could you please rephrase your question or try one of the suggested questions below?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Health Assistant Chatbot</h2>
        <p className="text-gray-600 dark:text-gray-400">Ask questions about your medications, diet, and care plan</p>
      </div>

      {/* Info Banner */}
      <div className="card mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">AI-Powered Assistant</h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              This chatbot uses AI to answer your health-related questions based on your medical records and prescriptions.
              For emergencies, please call your doctor or emergency services immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="card h-[500px] flex flex-col hover:shadow-xl transition-all duration-200">
        {/* Chat Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Health Assistant</h3>
            <p className="text-xs text-green-600 dark:text-green-400">● Online</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'bot' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
              }`}>
                {message.type === 'bot' ? (
                  <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className={`flex-1 ${message.type === 'user' ? 'items-end' : ''}`}>
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    message.type === 'bot'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{message.time}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question here..."
              className="flex-1 input-field bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="card mt-6 hover:shadow-xl transition-all duration-200">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Questions</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {chatbotFAQs.map((faq, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(faq.question)}
              className="text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{faq.question}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

