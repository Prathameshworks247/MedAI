import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Mic, MicOff, Keyboard, Volume2, Globe, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const SUPPORTED_LANGUAGES = {
    'hi-IN': 'Hindi (हिंदी)',
    'ta-IN': 'Tamil (தமிழ்)',
    'te-IN': 'Telugu (తెలుగు)',
    'bn-IN': 'Bengali (বাংলা)',
    'gu-IN': 'Gujarati (ગુજરાતી)',
    'kn-IN': 'Kannada (ಕನ್ನಡ)',
    'ml-IN': 'Malayalam (മലയാളം)',
    'mr-IN': 'Marathi (मराठी)',
    'or-IN': 'Odia (ଓଡ଼ିଆ)',
    'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
    'en-IN': 'English'
};

const Chatbot = () => {
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: "Hello! I'm your health assistant. I can help you with questions about your medications, diet, and appointments.",
            language: 'en-IN',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
    const [inputMode, setInputMode] = useState('text'); // 'text' or 'mic'
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null); // Track which message is being spoken

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const messagesEndRef = useRef(null);
    const currentAudioRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, isProcessingAudio]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = {
            type: 'user',
            text: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsTyping(true);

        try {
            // Call backend API for text chat
            const response = await fetch('http://localhost:8000/chatbot/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: currentInput,
                    target_language: selectedLanguage,
                    conversation_history: messages.slice(-10).map(msg => ({
                        role: msg.type === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    })),
                    generate_audio: false  // Don't auto-generate audio
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from chatbot');
            }

            const data = await response.json();

            const botMessage = {
                type: 'bot',
                text: data.response_text,
                language: selectedLanguage,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                type: 'bot',
                text: "I'm sorry, I encountered an error processing your request. Please try again.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                await processVoiceInput(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Failed to access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const processVoiceInput = async (audioBlob) => {
        setIsProcessingAudio(true);

        try {
            const formData = new FormData();
            formData.append('audio_file', audioBlob, 'recording.wav');
            formData.append('source_language', selectedLanguage);
            formData.append('target_language', selectedLanguage);
            formData.append('generate_audio', 'false');

            const response = await fetch('http://localhost:8000/chatbot/voice', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to process voice input');
            }

            const data = await response.json();

            // Add user message (translated to English for display)
            if (data.translated_input) {
                const userMessage = {
                    type: 'user',
                    text: data.translated_input,
                    originalLanguage: selectedLanguage,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, userMessage]);
            }

            // Add bot response
            const botMessage = {
                type: 'bot',
                text: data.response_text,
                language: selectedLanguage,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Error processing voice input:', error);
            const errorMessage = {
                type: 'bot',
                text: "I'm sorry, I couldn't process your voice message. Please try again.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsProcessingAudio(false);
        }
    };

    const playAudio = (base64Audio) => {
        try {
            // Stop any currently playing audio
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }

            const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
            currentAudioRef.current = audio;
            audio.play().catch(err => {
                console.error('Error playing audio:', err);
            });

            // Add ended event listener to reset state
            audio.addEventListener('ended', () => {
                setSpeakingMessageIndex(null);
            });
        } catch (error) {
            console.error('Error creating audio:', error);
            setSpeakingMessageIndex(null);
        }
    };

    const speakText = async (text, language, messageIndex) => {
        try {
            if (speakingMessageIndex === messageIndex) {
                // If currently speaking this message, stop it
                if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current = null;
                }
                setSpeakingMessageIndex(null);
                return;
            }

            setSpeakingMessageIndex(messageIndex);

            // Stop any currently playing audio
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }

            // Use backend endpoint for TTS
            const response = await fetch('http://localhost:8000/chatbot/speak', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    target_language: language
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate speech');
            }

            const data = await response.json();

            if (data.audio) {
                playAudio(data.audio);
            } else {
                setSpeakingMessageIndex(null);
            }

        } catch (error) {
            console.error('Error in speakText:', error);
            setSpeakingMessageIndex(null);
        }
    };


    const toggleInputMode = () => {
        if (isRecording) {
            stopRecording();
        }
        setInputMode(prev => prev === 'text' ? 'mic' : 'text');
        setInput('');
    };

    const handleVoiceButtonClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                    Health Assistant
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                    Your multilingual AI companion for medication queries, diet plans, and health advice.
                </p>
            </motion.div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start h-[calc(100vh-250px)] min-h-[600px]">
                {/* Main Chat Interface */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 relative"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center shadow-lg">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white leading-tight">Assistant</h3>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> {SUPPORTED_LANGUAGES[selectedLanguage]}
                                </p>
                            </div>
                        </div>

                        {/* Language Selector in Header */}
                        <div className="relative group">
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="appearance-none bg-gray-50 dark:bg-gray-700 border-0 text-gray-700 dark:text-gray-200 text-sm rounded-full py-2 pl-4 pr-8 focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                                    <option key={code} value={code}>{name}</option>
                                ))}
                            </select>
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-24 pb-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        <AnimatePresence initial={false}>
                            {messages.map((message, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className={`flex items-end space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                                >
                                    {message.type === 'bot' && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-1">
                                            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    )}

                                    <div className={`relative max-w-[85%] sm:max-w-[75%] group`}>
                                        <div
                                            className={`px-5 py-3.5 shadow-sm text-[15px] leading-relaxed ${message.type === 'bot'
                                                ? 'bg-gray-100 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-none'
                                                : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none'
                                                }`}
                                        >
                                            {message.type === 'bot' ? (
                                                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                                    <ReactMarkdown>{message.text}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap">{message.text}</p>
                                            )}
                                        </div>

                                        {/* Metadata & Actions */}
                                        <div className={`flex items-center gap-2 mt-1.5 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">
                                                {message.time}
                                            </span>

                                            {message.type === 'bot' && message.language && (
                                                <button
                                                    onClick={() => speakText(message.text, message.language, index)}
                                                    className={`p-1 rounded-full transition-all duration-200 ${speakingMessageIndex === index
                                                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 animate-pulse'
                                                        : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}
                                                    title="Read Aloud"
                                                >
                                                    {speakingMessageIndex === index ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Volume2 className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-2"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-700/80 px-4 py-3 rounded-2xl rounded-tl-none">
                                    <div className="flex space-x-1.5">
                                        <div className="w-1.5 h-1.5 bg-gray-400/70 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {isProcessingAudio && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-center my-4"
                            >
                                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
                                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Processing voice...</span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <div className="relative flex items-center gap-2">
                            <button
                                onClick={toggleInputMode}
                                className={`p-2.5 rounded-xl transition-all duration-200 ${inputMode === 'mic'
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                title={inputMode === 'mic' ? 'Switch to Text' : 'Switch to Voice'}
                            >
                                {inputMode === 'mic' ? <Keyboard className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>

                            {inputMode === 'text' ? (
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder={`Type your question...`}
                                        className="w-full bg-gray-100 dark:bg-gray-700/50 border-0 rounded-xl px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-inner"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isTyping}
                                        className="absolute right-1.5 top-1.5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:shadow-none transition-all duration-200"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center py-1">
                                    <button
                                        onClick={handleVoiceButtonClick}
                                        disabled={isProcessingAudio}
                                        className={`relative group flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isRecording
                                            ? 'bg-red-500 shadow-lg shadow-red-500/40 ring-4 ring-red-500/20 scale-105'
                                            : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105'
                                            }`}
                                    >
                                        {isRecording ? (
                                            <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping"></div>
                                        ) : null}
                                        {isRecording ? <MicOff className="w-6 h-6 text-white relative z-10" /> : <Mic className="w-6 h-6 text-white relative z-10" />}
                                    </button>
                                    <div className="ml-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {isRecording ? (
                                            <span className="text-red-500 dark:text-red-400 animate-pulse">Recording...</span>
                                        ) : (
                                            "Tap to speak"
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Sidebar / Info Panel (Desktop Only) */}
                <div className="hidden lg:flex flex-col gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-900 dark:text-white">Quick Tips</h4>
                            <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Language Support</h5>
                                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                    I clearly understand 11 Indian languages. Change the language anytime from the top menu.
                                </p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                                <h5 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1">Voice First</h5>
                                <p className="text-xs text-purple-600 dark:text-purple-400 leading-relaxed">
                                    Tap the Mic button to speak. I'll listen and reply with audio in your chosen language.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
