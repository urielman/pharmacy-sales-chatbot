import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { ChatWindow } from '../components/chat/ChatWindow';
import { PharmacyInfo } from '../components/chat/PharmacyInfo';
import { ActionButtons } from '../components/actions/ActionButtons';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Phone, ArrowLeft } from 'lucide-react';
import '../App.css';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState(searchParams.get('phone') || '');
  const [hasStarted, setHasStarted] = useState(false);

  const {
    conversationId,
    messages,
    pharmacy,
    loading,
    error,
    startChat,
    sendMessage,
    scheduleCallback,
    sendEmail,
  } = useChat();

  useEffect(() => {
    // Auto-fill phone number from URL params if present
    const phoneFromUrl = searchParams.get('phone');
    if (phoneFromUrl) {
      setPhoneNumber(phoneFromUrl);
    }
  }, [searchParams]);

  const handleCall = async () => {
    if (!phoneNumber.trim()) return;

    try {
      await startChat(phoneNumber);
      setHasStarted(true);
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 h-full flex flex-col">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-[#fb923c] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>

        {/* Phone Number Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-[#fb923c]" />
            </div>
            <div className="flex-1">
              <Input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number (e.g., +1-555-123-4567)"
                disabled={hasStarted}
                className="text-lg"
              />
            </div>
            <Button
              onClick={handleCall}
              disabled={!phoneNumber.trim() || hasStarted || loading}
              className="bg-[#fb923c] hover:bg-[#f97316] text-white px-8 flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {hasStarted ? 'In Call...' : 'Call'}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Chat Interface - Shows after clicking Call */}
        {hasStarted && conversationId && (
          <div className="chat-screen">
            <div className="sidebar">
              <PharmacyInfo pharmacy={pharmacy} />
              <ActionButtons
                onScheduleCallback={scheduleCallback}
                onSendEmail={sendEmail}
                disabled={loading}
              />
              <div className="conversation-info">
                <div className="info-item">
                  <strong>Conversation ID:</strong> {conversationId}
                </div>
                <div className="info-item">
                  <strong>Phone:</strong> {phoneNumber}
                </div>
              </div>
            </div>

            <div className="main-chat">
              <ChatWindow
                messages={messages}
                onSendMessage={sendMessage}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Before Call Message */}
        {!hasStarted && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Start
            </h3>
            <p className="text-gray-600">
              Enter a phone number above and click "Call" to begin the conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
