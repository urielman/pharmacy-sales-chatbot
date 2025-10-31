import React, { useState } from 'react';
import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/chat/ChatWindow';
import { PharmacyInfo } from './components/chat/PharmacyInfo';
import { ActionButtons } from './components/actions/ActionButtons';
import './App.css';

const TEST_PHONE_NUMBERS = [
  { number: '+1-555-123-4567', label: 'HealthFirst Pharmacy (Returning)' },
  { number: '+1-555-987-6543', label: 'New Lead' },
  { number: '+1-555-555-5555', label: 'Custom Number' },
];

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
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

  const handleStartChat = async () => {
    if (!phoneNumber.trim()) return;

    try {
      await startChat(phoneNumber);
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const handleQuickStart = async (number: string) => {
    if (number === '+1-555-555-5555') {
      setShowCustomInput(true);
      return;
    }

    setPhoneNumber(number);
    try {
      await startChat(number);
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>💊 Pharmesol Sales Chatbot</h1>
        <p>Inbound pharmacy sales assistant with AI-powered conversations</p>
      </header>

      <div className="app-container">
        {!conversationId ? (
          <div className="start-screen">
            <div className="start-card">
              <h2>Start a New Conversation</h2>
              <p>Select a test phone number or enter a custom one:</p>

              <div className="quick-start-buttons">
                {TEST_PHONE_NUMBERS.map((item) => (
                  <button
                    key={item.number}
                    className="quick-start-btn"
                    onClick={() => handleQuickStart(item.number)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {showCustomInput && (
                <div className="custom-input-section">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="phone-input"
                  />
                  <button
                    onClick={handleStartChat}
                    disabled={!phoneNumber.trim()}
                    className="start-btn"
                  >
                    Start Chat
                  </button>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
            </div>
          </div>
        ) : (
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
              {error && <div className="error-message">{error}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
