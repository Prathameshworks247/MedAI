import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, MessageSquare, Plus, ArrowLeft, History, Trash2 } from 'lucide-react';
import { apiRequest } from '../../utils/api';

const ChatModal = ({ isOpen, onClose, appointmentId, patientId, patientName }) => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [chatHistories, setChatHistories] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pdfDocumentId, setPdfDocumentId] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Load chat histories from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(`chatHistories_${appointmentId}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setChatHistories(parsed);
            } catch (e) {
                console.error('Error loading chat histories:', e);
            }
        }
    }, [appointmentId]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && !isHistoryOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isHistoryOpen]);

    // Save chat history to localStorage
    const saveChatHistory = (chatId, chatMessages, title) => {
        const history = {
            id: chatId,
            title: title || `Chat ${new Date().toLocaleString()}`,
            messages: chatMessages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updated = [...chatHistories];
        const existingIndex = updated.findIndex(h => h.id === chatId);
        
        if (existingIndex >= 0) {
            updated[existingIndex] = history;
        } else {
            updated.unshift(history);
        }

        // Keep only last 20 chats
        const limited = updated.slice(0, 20);
        setChatHistories(limited);
        localStorage.setItem(`chatHistories_${appointmentId}`, JSON.stringify(limited));
    };

    // Start new chat
    const handleNewChat = () => {
        // Save current chat if it has messages
        if (currentChatId && messages.length > 0) {
            const title = messages.find(m => m.role === 'user')?.content?.substring(0, 50) || 'New Chat';
            saveChatHistory(currentChatId, messages, title);
        }

        const newChatId = `chat_${Date.now()}`;
        setCurrentChatId(newChatId);
        setMessages([
            {
                role: 'assistant',
                content: `Hello! I'm your AI assistant for ${patientName || 'this patient'}'s appointment. I have access to patient consultation recordings, clinical notes, reports, appointment history, and test results. How can I help you today?`,
                timestamp: new Date().toISOString(),
            }
        ]);
        setInput('');
        setIsHistoryOpen(false);
    };

    // Load a chat from history
    const handleLoadChat = (chatId) => {
        // Save current chat if it has messages
        if (currentChatId && messages.length > 0) {
            const title = messages.find(m => m.role === 'user')?.content?.substring(0, 50) || 'New Chat';
            saveChatHistory(currentChatId, messages, title);
        }

        const chat = chatHistories.find(h => h.id === chatId);
        if (chat) {
            setCurrentChatId(chat.id);
            setMessages(chat.messages);
            setIsHistoryOpen(false);
        }
    };

    // Delete a chat from history
    const handleDeleteChat = (chatId, e) => {
        e.stopPropagation();
        const updated = chatHistories.filter(h => h.id !== chatId);
        setChatHistories(updated);
        localStorage.setItem(`chatHistories_${appointmentId}`, JSON.stringify(updated));
        
        if (currentChatId === chatId) {
            handleNewChat();
        }
    };

    // Send message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !patientId) return;

        const question = input.trim();
        const userMessage = {
            role: 'user',
            content: question,
            timestamp: new Date().toISOString(),
        };

        // Initialize chat if needed
        if (!currentChatId) {
            const newChatId = `chat_${Date.now()}`;
            setCurrentChatId(newChatId);
            setMessages([
                {
                    role: 'assistant',
                    content: `Hello! I'm your AI assistant for ${patientName || 'this patient'}'s appointment. How can I help you today?`,
                    timestamp: new Date().toISOString(),
                }
            ]);
        }

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const recentHistory = messages.slice(-5).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await apiRequest('/doctors/chat', {
                method: 'POST',
                body: JSON.stringify({
                    question: question,
                    patient_id: patientId,
                    appointment_id: appointmentId,
                    conversation_history: recentHistory,
                    pdf_document_id: pdfDocumentId
                })
            });

            if (response.success) {
                const assistantMessage = {
                    role: 'assistant',
                    content: response.data.answer,
                    intent: response.data.intent,
                    confidence: response.data.confidence,
                    citations: response.data.citations || [],
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => {
                    const updated = [...prev, assistantMessage];
                    // Auto-save after assistant response
                    const title = question.substring(0, 50);
                    saveChatHistory(currentChatId, updated, title);
                    return updated;
                });
            } else {
                throw new Error(response.error || 'Chat request failed');
            }
        } catch (error) {
            console.error('Error sending chat message:', error);
            const errorMessage = {
                role: 'assistant',
                content: `Error: ${error.message || 'Failed to get response from AI assistant'}`,
                error: true,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    // Initialize with new chat if no current chat
    useEffect(() => {
        if (isOpen && !currentChatId && messages.length === 0) {
            const newChatId = `chat_${Date.now()}`;
            setCurrentChatId(newChatId);
            setMessages([
                {
                    role: 'assistant',
                    content: `Hello! I'm your AI assistant for ${patientName || 'this patient'}'s appointment. I have access to patient consultation recordings, clinical notes, reports, appointment history, and test results. How can I help you today?`,
                    timestamp: new Date().toISOString(),
                }
            ]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        {isHistoryOpen ? (
                            <button
                                onClick={() => setIsHistoryOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
                                title="View chat history"
                            >
                                <History className="w-5 h-5 text-gray-600" />
                                <span className="text-sm text-gray-600 hidden sm:inline">History</span>
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isHistoryOpen ? 'Chat History' : 'AI Assistant'}
                            </h2>
                            {!isHistoryOpen && patientName && (
                                <p className="text-sm text-gray-500">{patientName}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isHistoryOpen && (
                            <button
                                onClick={handleNewChat}
                                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Chat</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Chat History Sidebar */}
                    {isHistoryOpen && (
                        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                            <div className="p-4 border-b border-gray-200">
                                <button
                                    onClick={handleNewChat}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>New Chat</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {chatHistories.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No chat history</p>
                                        <p className="text-sm">Start a new conversation</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {chatHistories.map((chat) => (
                                            <div
                                                key={chat.id}
                                                onClick={() => handleLoadChat(chat.id)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                                                    currentChatId === chat.id
                                                        ? 'bg-primary-100 border border-primary-300'
                                                        : 'hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {chat.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(chat.updatedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDeleteChat(chat.id, e)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chat Messages Area */}
                    {!isHistoryOpen && (
                        <div className="flex-1 flex flex-col">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start space-x-3 ${
                                            message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                        }`}
                                    >
                                        <div
                                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                message.role === 'assistant'
                                                    ? 'bg-green-100'
                                                    : 'bg-blue-100'
                                            }`}
                                        >
                                            {message.role === 'assistant' ? (
                                                <Bot className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <User className="w-5 h-5 text-blue-600" />
                                            )}
                                        </div>
                                        <div className={`flex-1 ${message.role === 'user' ? 'items-end' : ''}`}>
                                            <div
                                                className={`inline-block max-w-[80%] p-3 rounded-lg ${
                                                    message.role === 'assistant'
                                                        ? 'bg-gray-100 text-gray-900'
                                                        : 'bg-blue-600 text-white'
                                                } ${message.error ? 'bg-red-100 text-red-900' : ''}`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                {message.citations && message.citations.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-gray-300">
                                                        <p className="text-xs font-semibold mb-1">Sources:</p>
                                                        {message.citations.map((citation, idx) => (
                                                            <p key={idx} className="text-xs text-gray-600">
                                                                • {citation.page_number && `Page ${citation.page_number}`}
                                                                {citation.text_preview && `: ${citation.text_preview.substring(0, 100)}...`}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {message.timestamp
                                                    ? new Date(message.timestamp).toLocaleTimeString([], {
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="bg-gray-100 p-3 rounded-lg">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatModal;
