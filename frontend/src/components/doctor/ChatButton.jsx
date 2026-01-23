import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatModal from './ChatModal';

const ChatButton = ({ appointmentId, patientId, patientName }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!appointmentId || !patientId) return null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-110 flex items-center justify-center z-40"
                aria-label={isModalOpen ? "Close chat" : "Open chat"}
            >
                {isModalOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-6 h-6" />
                )}
            </button>
            <ChatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                appointmentId={appointmentId}
                patientId={patientId}
                patientName={patientName}
            />
        </>
    );
};

export default ChatButton;
