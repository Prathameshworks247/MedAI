import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, MessageSquare, Plus, ArrowLeft, History, Trash2, Upload, FileText, Loader, Eye } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import PDFViewer from './PDFViewer';
import ReactMarkdown from "react-markdown";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ChatModal = ({ isOpen, onClose, appointmentId, patientId, patientName, readOnly = false }) => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [chatHistories, setChatHistories] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pdfDocumentId, setPdfDocumentId] = useState(null);
    const [uploadedPdf, setUploadedPdf] = useState(null);
    const [uploadedPdfFile, setUploadedPdfFile] = useState(null); // Store the actual file object for viewing
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [loadingPdfId, setLoadingPdfId] = useState(null); // Track which PDF is being loaded
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [viewerPage, setViewerPage] = useState(1);
    const [viewerCoordinates, setViewerCoordinates] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Load chat histories from backend on mount
    useEffect(() => {
        if (isOpen && appointmentId) {
            loadChatHistories();
        }
    }, [isOpen, appointmentId]);

    const loadChatHistories = async () => {
        try {
            const response = await apiRequest(`/doctors/chat/history/${appointmentId}`, {
                method: 'GET'
            });

            if (response.success && Array.isArray(response.data)) {
                const histories = response.data.map(chat => ({
                    id: chat.chat_id,
                    title: chat.title,
                    messages: (chat.messages || []).map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        citations: Array.isArray(msg.citations) ? msg.citations : [],
                        timestamp: chat.updated_at
                    })),
                    pdf_file_path: chat.pdf_file_path,
                    pdf_file_name: chat.pdf_file_name,
                    createdAt: chat.created_at,
                    updatedAt: chat.updated_at
                }));
                setChatHistories(histories);
                console.log(`✅ Loaded ${histories.length} chat histories from backend`);
            }
        } catch (error) {
            console.error('Error loading chat histories:', error);
            // Fallback to empty array on error
            setChatHistories([]);
        }
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        console.log('💬 Current messages state:', messages.map(m => ({
            role: m.role,
            hasCitations: !!m.citations?.length,
            citationCount: m.citations?.length || 0
        })));
    }, [messages]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && !isHistoryOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isHistoryOpen]);

    // Debug: Log when PDF file changes
    useEffect(() => {
        if (uploadedPdfFile) {
            console.log('📄 PDF file state updated:', {
                fileName: uploadedPdfFile.name,
                fileSize: uploadedPdfFile.size,
                fileType: uploadedPdfFile.type,
                hasFile: !!uploadedPdfFile
            });
        } else {
            console.log('📄 PDF file state cleared');
        }
    }, [uploadedPdfFile]);

    // Save chat history to backend
    const saveChatHistory = async (chatId, chatMessages, title) => {
        try {
            const history = {
                chat_id: chatId,
                appointment_id: appointmentId,
                patient_id: patientId,
                title: title || `Chat ${new Date().toLocaleString()}`,
                messages: chatMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    citations: msg.citations || []
                })),
                pdf_file_path: uploadedPdf?.file_path || null,
                pdf_file_name: uploadedPdf?.file_name || null
            };

            console.log('📄 Saving chat history with PDF metadata:', {
                pdf_file_path: history.pdf_file_path,
                pdf_file_name: history.pdf_file_name
            });

            const response = await apiRequest('/doctors/chat/history', {
                method: 'POST',
                body: JSON.stringify(history)
            });

            if (response.success) {
                // Update local state
                const savedHistory = {
                    id: response.data.chat_id,
                    title: response.data.title,
                    messages: (response.data.messages || []).map(msg => ({
                        role: msg.role,
                        content: msg.content,
                        citations: Array.isArray(msg.citations) ? msg.citations : [],
                        timestamp: response.data.updated_at
                    })),
                    pdf_file_path: response.data.pdf_file_path,
                    pdf_file_name: response.data.pdf_file_name,
                    createdAt: response.data.created_at,
                    updatedAt: response.data.updated_at
                };

                const updated = [...chatHistories];
                const existingIndex = updated.findIndex(h => h.id === chatId);

                if (existingIndex >= 0) {
                    updated[existingIndex] = savedHistory;
                } else {
                    updated.unshift(savedHistory);
                }

                // Keep only last 50 chats (backend already limits to 50)
                const limited = updated.slice(0, 50);
                setChatHistories(limited);
                console.log(`✅ Chat history saved to backend: ${chatId}`);
            }
        } catch (error) {
            console.error('Error saving chat history to backend:', error);
            // Don't fail silently - could show a toast notification
        }
    };

    // Start new chat
    const handleNewChat = async () => {
        // Save current chat if it has messages (backend already saved messages, but we update title if needed)
        if (currentChatId && messages.length > 1) { // More than just welcome message
            const title = messages.find(m => m.role === 'user')?.content?.substring(0, 50) || 'New Chat';
            await saveChatHistory(currentChatId, messages, title);
        }

        const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentChatId(newChatId);
        setMessages([
            {
                role: 'assistant',
                content: `Hello! I'm your AI assistant for ${patientName || 'this patient'}'s appointment. I have access to patient consultation recordings, clinical notes, reports, appointment history, and test results. How can I help you today?`,
                timestamp: new Date().toISOString(),
            }
        ]);
        setPdfDocumentId(null);
        setUploadedPdf(null);
        setUploadedPdfFile(null);
        setInput('');
        setIsHistoryOpen(false);
    };

    // Load a chat from history
    const handleLoadChat = async (chatId) => {
        // Save current chat if it has messages (backend already saved, but update title)
        if (currentChatId && messages.length > 1) { // More than just welcome message
            const title = messages.find(m => m.role === 'user')?.content?.substring(0, 50) || 'New Chat';
            await saveChatHistory(currentChatId, messages, title);
        }

        // Clear current PDF state first
        setUploadedPdfFile(null);
        setUploadedPdf(null);
        setPdfDocumentId(null);

        const chat = chatHistories.find(h => h.id === chatId);
        if (chat) {
            setCurrentChatId(chat.id);
            // Convert messages to format expected by component, including citations
            const formattedMessages = (chat.messages || []).map(msg => ({
                role: msg.role,
                content: msg.content,
                citations: Array.isArray(msg.citations) ? msg.citations : [],
                timestamp: msg.timestamp || chat.updatedAt
            }));
            setMessages(formattedMessages);

            // Load PDF file path from chat history if available
            if (chat.pdf_file_path) {
                console.log(`📄 Loading PDF for chat history: ${chat.pdf_file_path}`);
                // Extract document_id from file path (format: storage/pdfs/{document_id}.pdf)
                const docIdMatch = chat.pdf_file_path.match(/pdfs\/([^\/]+)\.pdf/);
                if (docIdMatch) {
                    const docId = docIdMatch[1];
                    console.log(`📄 Extracted document ID: ${docId}`);
                    setPdfDocumentId(docId);
                    const pdfMetadata = {
                        document_id: docId,
                        file_name: chat.pdf_file_name || docId + '.pdf',
                        file_path: chat.pdf_file_path,
                        total_chunks: 0,
                        total_pages: 0
                    };
                    setUploadedPdf(pdfMetadata);
                    // Load PDF file from backend so citations can work - MUST complete before continuing
                    try {
                        await loadPdfFromBackend(docId, pdfMetadata.file_name);
                        console.log(`✅ PDF loaded and ready for citations`);
                    } catch (error) {
                        console.error(`❌ Failed to load PDF:`, error);
                    }
                } else {
                    console.warn(`⚠️ Could not extract document ID from path: ${chat.pdf_file_path}`);
                }
            } else {
                console.log(`ℹ️ No PDF file path in chat history`);
            }

            setIsHistoryOpen(false);
        } else {
            // Chat not in local state, reload from backend
            await loadChatHistories();
            const refreshedChat = chatHistories.find(h => h.id === chatId);
            if (refreshedChat) {
                setCurrentChatId(refreshedChat.id);
                const formattedMessages = (refreshedChat.messages || []).map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    citations: Array.isArray(msg.citations) ? msg.citations : [],
                    timestamp: msg.timestamp || refreshedChat.updatedAt
                }));
                setMessages(formattedMessages);

                // Load PDF file path from chat history if available
                if (refreshedChat.pdf_file_path) {
                    // Extract document_id from file path (format: storage/pdfs/{document_id}.pdf)
                    const docIdMatch = refreshedChat.pdf_file_path.match(/pdfs\/([^\/]+)\.pdf/);
                    if (docIdMatch) {
                        const docId = docIdMatch[1];
                        setPdfDocumentId(docId);
                        const pdfMetadata = {
                            document_id: docId,
                            file_name: refreshedChat.pdf_file_name || docId + '.pdf',
                            file_path: refreshedChat.pdf_file_path,
                            total_chunks: 0,
                            total_pages: 0
                        };
                        setUploadedPdf(pdfMetadata);
                        // Load PDF file from backend so citations can work
                        await loadPdfFromBackend(docId, pdfMetadata.file_name);
                    }
                }

                setIsHistoryOpen(false);
            }
        }
    };

    // Load PDF file from backend
    const loadPdfFromBackend = async (documentId, fileName = null) => {
        if (loadingPdfId === documentId) return;

        try {
            setLoadingPdfId(documentId);
            console.log(`📄 Loading PDF from backend: ${documentId}, filename: ${fileName}`);
            const token = localStorage.getItem('access_token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/doctors/pdf/${documentId}`, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const blob = await response.blob();
                const file = new File([blob], fileName || `${documentId}.pdf`, { type: 'application/pdf' });
                setUploadedPdfFile(file);
                console.log(`✅ PDF loaded from backend: ${fileName || documentId}.pdf, size: ${blob.size} bytes`);
                return file;
            } else {
                const errorText = await response.text();
                console.error('Failed to load PDF from backend:', response.status, errorText);
                return null;
            }
        } catch (error) {
            console.error('Error loading PDF from backend:', error);
            return null;
        } finally {
            setLoadingPdfId(null);
        }
    };

    // Handle PDF upload for chatbot
    const handlePdfUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.pdf')) {
            alert('Please upload a PDF file');
            e.target.value = '';
            return;
        }

        setUploadingPdf(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('access_token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/doctors/upload-pdf`, {
                method: 'POST',
                body: formData,
                headers: headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to upload PDF');
            }

            const pdfMetadata = {
                document_id: data.document_id,
                file_name: data.file_name,
                file_path: data.file_path,
                total_chunks: data.total_chunks,
                total_pages: data.total_pages
            };

            setPdfDocumentId(data.document_id);
            setUploadedPdf(pdfMetadata);
            // Keep the file object for immediate viewing, but backend stores the path
            setUploadedPdfFile(file);

            alert(`PDF uploaded successfully! ${data.total_chunks} chunks from ${data.total_pages} pages. You can now ask questions about this document.`);
        } catch (error) {
            console.error('Error uploading PDF:', error);
            alert(`Error uploading PDF: ${error.message}`);
        } finally {
            setUploadingPdf(false);
            e.target.value = '';
        }
    };

    // Delete a chat from history
    const handleDeleteChat = async (chatId, e) => {
        e.stopPropagation();

        try {
            const response = await apiRequest(`/doctors/chat/history/${chatId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                const updated = chatHistories.filter(h => h.id !== chatId);
                setChatHistories(updated);
                console.log(`✅ Chat history deleted: ${chatId}`);

                if (currentChatId === chatId) {
                    handleNewChat();
                }
            } else {
                throw new Error(response.error || 'Failed to delete chat');
            }
        } catch (error) {
            console.error('Error deleting chat history:', error);
            alert(`Failed to delete chat: ${error.message}`);
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
        let chatIdToUse = currentChatId;
        if (!chatIdToUse) {
            chatIdToUse = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setCurrentChatId(chatIdToUse);
            // Add welcome message if this is a new chat
            if (messages.length === 0) {
                setMessages([
                    {
                        role: 'assistant',
                        content: `Hello! I'm your AI assistant for ${patientName || 'this patient'}'s appointment. I have access to patient consultation recordings, clinical notes, reports, appointment history, and test results. How can I help you today?`,
                        timestamp: new Date().toISOString(),
                    }
                ]);
            }
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
                    pdf_document_id: pdfDocumentId,
                    pdf_file_path: uploadedPdf?.file_path || null,
                    pdf_file_name: uploadedPdf?.file_name || null,
                    chat_id: chatIdToUse  // Include chat_id so backend can save messages
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
                    // Messages are already saved by backend when chat_id is provided
                    // Only manually save if backend didn't save (shouldn't happen)
                    return updated;
                });

                // Update chat_id if backend returned one (should match what we sent)
                const finalChatId = response.data.chat_id || chatIdToUse;
                if (finalChatId && finalChatId !== currentChatId) {
                    setCurrentChatId(finalChatId);
                }

                // Refresh chat histories to show updated list
                if (isHistoryOpen) {
                    loadChatHistories();
                }
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
            const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col transition-colors duration-200">
                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm">
                    <div className="flex items-center space-x-4">
                        {isHistoryOpen ? (
                            <button
                                onClick={() => setIsHistoryOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center space-x-2 group"
                                title="View chat history"
                            >
                                <History className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 hidden sm:inline transition-colors">History</span>
                            </button>
                        )}
                        <div className="flex items-center space-x-3">
                            {!isHistoryOpen && (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 flex items-center justify-center shadow-md">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                    {isHistoryOpen ? 'Chat History' : (readOnly ? 'Chat Archive' : 'AI Assistant')}
                                </h2>
                                {!isHistoryOpen && patientName && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{patientName}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {!isHistoryOpen && !readOnly && (
                            <button
                                onClick={handleNewChat}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Chat</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                            title="Close"
                        >
                            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Chat History Sidebar */}
                    {isHistoryOpen && (
                        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                {!readOnly && (
                                    <button
                                        onClick={handleNewChat}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>New Chat</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {chatHistories.length === 0 ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                        <p>No chat history</p>
                                        <p className="text-sm">Start a new conversation</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {chatHistories.map((chat) => (
                                            <div
                                                key={chat.id}
                                                onClick={() => handleLoadChat(chat.id)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors group ${currentChatId === chat.id
                                                    ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-600'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {chat.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {new Date(chat.updatedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {!readOnly && (
                                                        <button
                                                            onClick={(e) => handleDeleteChat(chat.id, e)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                        </button>
                                                    )}
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
                                        className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                            }`}
                                    >
                                        <div
                                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.role === 'assistant'
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-blue-100 dark:bg-blue-900/30'
                                                }`}
                                        >
                                            {message.role === 'assistant' ? (
                                                <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                        <div className={`flex-1 ${message.role === 'user' ? 'items-end' : ''}`}>
                                            <div
                                                className={`inline-block max-w-[80%] p-3 rounded-lg ${message.role === 'assistant'
                                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                    : 'bg-blue-600 dark:bg-blue-500 text-white'
                                                    } ${message.error ? 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-200' : ''}`}
                                            >
                                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                                {Array.isArray(message.citations) && message.citations.length > 0 ? (
                                                    <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                                        <p className="text-xs font-semibold mb-1 dark:text-gray-300">Sources:</p>
                                                        <div className="space-y-1">
                                                            {message.citations.map((citation, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    onClick={async () => {
                                                                        const docId = citation.document_id || pdfDocumentId;
                                                                        console.log('Citation clicked:', {
                                                                            docId,
                                                                            hasPdfFile: !!uploadedPdfFile,
                                                                            pageNumber: citation.page_number,
                                                                            citation
                                                                        });

                                                                        if (!docId) {
                                                                            console.warn('No document ID available for citation');
                                                                            return;
                                                                        }

                                                                        let fileToUse = uploadedPdfFile;

                                                                        // If we have a docId but no file, or a different file is loaded, load the correct one
                                                                        if (!fileToUse || (pdfDocumentId && pdfDocumentId !== docId)) {
                                                                            console.log('Loading PDF for citation:', docId);
                                                                            fileToUse = await loadPdfFromBackend(docId);
                                                                            if (fileToUse) {
                                                                                setPdfDocumentId(docId);
                                                                            }
                                                                        }

                                                                        if (fileToUse && citation.page_number) {
                                                                            setViewerPage(citation.page_number);
                                                                            setViewerCoordinates(citation.coordinates || null);
                                                                            setShowPdfViewer(true);
                                                                        }
                                                                    }}
                                                                    className={`text-xs bg-white/50 dark:bg-gray-800/50 rounded p-2 transition-colors border border-transparent ${(citation.document_id || pdfDocumentId) && citation.page_number
                                                                        ? 'hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600'
                                                                        : 'text-gray-600 dark:text-gray-400'
                                                                        }`}
                                                                    title={(citation.document_id || pdfDocumentId) && citation.page_number ? "Click to view in PDF" : "PDF not available"}
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-semibold flex items-center dark:text-gray-200">
                                                                                {loadingPdfId === (citation.document_id || pdfDocumentId) ? (
                                                                                    <Loader className="w-3 h-3 mr-1 animate-spin text-blue-600 dark:text-blue-400" />
                                                                                ) : (
                                                                                    <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                                                                                )}
                                                                                <span className="truncate">
                                                                                    {citation.page_number ? `Page ${citation.page_number}` : 'Citation'}
                                                                                </span>
                                                                            </p>
                                                                            {citation.text_preview && (
                                                                                <p className="text-gray-600 dark:text-gray-400 break-words mt-1 line-clamp-2">
                                                                                    {citation.text_preview}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        {(citation.document_id || pdfDocumentId) && citation.page_number && (
                                                                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : message.role === 'assistant' && message.intent === 'pdf_query' ? (
                                                    <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">No citations found for this answer.</p>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            {!readOnly && (
                                <form onSubmit={handleSend} className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                    {uploadedPdf && (
                                        <div className="mb-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/40 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 shadow-sm">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">{uploadedPdf.file_name}</span>
                                                    <span className="text-xs text-blue-600 dark:text-blue-400">{uploadedPdf.total_pages} pages</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPdfDocumentId(null);
                                                    setUploadedPdf(null);
                                                    setUploadedPdfFile(null);
                                                }}
                                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                                                title="Clear PDF"
                                            >
                                                <X className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-end space-x-3">
                                        <div className="flex-1 relative">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder={uploadedPdf ? "Ask a question about the uploaded PDF..." : "Type your message..."}
                                                className="w-full px-5 py-3.5 pr-16 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={isLoading}
                                            />
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handlePdfUpload}
                                                disabled={uploadingPdf || isLoading}
                                                className="hidden"
                                                id="pdf-upload-chat-modal"
                                            />
                                            <label
                                                htmlFor="pdf-upload-chat-modal"
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center ${uploadingPdf || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                                    } ${uploadedPdf ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                                                title={uploadedPdf ? `PDF: ${uploadedPdf.file_name}` : "Upload PDF for chat context"}
                                            >
                                                {uploadingPdf ? (
                                                    <Loader className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Upload className="w-5 h-5" />
                                                )}
                                            </label>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!input.trim() || isLoading}
                                            className="px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-2xl hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 font-medium"
                                        >
                                            <Send className="w-5 h-5" />
                                            <span className="hidden sm:inline">Send</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* PDF Viewer Modal */}
                {showPdfViewer && uploadedPdfFile && (
                    <PDFViewer
                        pdfFile={uploadedPdfFile}
                        pageNumber={viewerPage}
                        coordinates={viewerCoordinates}
                        onClose={() => {
                            setShowPdfViewer(false);
                            setViewerCoordinates(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default ChatModal;
