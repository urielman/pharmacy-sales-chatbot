import React, { useState } from 'react';
import './ActionButtons.css';

interface ActionButtonsProps {
  onScheduleCallback: (time: string, notes?: string) => void;
  onSendEmail: (email: string, includePricing: boolean) => void;
  disabled: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onScheduleCallback,
  onSendEmail,
  disabled,
}) => {
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const [callbackTime, setCallbackTime] = useState('');
  const [callbackNotes, setCallbackNotes] = useState('');

  const [email, setEmail] = useState('');
  const [includePricing, setIncludePricing] = useState(false);

  const handleScheduleCallback = () => {
    if (callbackTime.trim()) {
      onScheduleCallback(callbackTime, callbackNotes || undefined);
      setCallbackTime('');
      setCallbackNotes('');
      setShowCallbackModal(false);
    }
  };

  const handleSendEmail = () => {
    if (email.trim()) {
      onSendEmail(email, includePricing);
      setEmail('');
      setIncludePricing(false);
      setShowEmailModal(false);
    }
  };

  return (
    <div className="action-buttons">
      <button
        className="action-button callback"
        onClick={() => setShowCallbackModal(true)}
        disabled={disabled}
      >
        📞 Schedule Callback
      </button>

      <button
        className="action-button email"
        onClick={() => setShowEmailModal(true)}
        disabled={disabled}
      >
        📧 Send Email
      </button>

      {showCallbackModal && (
        <div className="modal-overlay" onClick={() => setShowCallbackModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Schedule Callback</h3>
            <div className="form-group">
              <label>Preferred Time</label>
              <input
                type="text"
                value={callbackTime}
                onChange={(e) => setCallbackTime(e.target.value)}
                placeholder="e.g., Tomorrow at 2pm, Friday morning"
              />
            </div>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={callbackNotes}
                onChange={(e) => setCallbackNotes(e.target.value)}
                placeholder="Any specific topics to discuss?"
                rows={3}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowCallbackModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleScheduleCallback}
                className="btn-confirm"
                disabled={!callbackTime.trim()}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send Follow-up Email</h3>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pharmacy@example.com"
              />
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={includePricing}
                  onChange={(e) => setIncludePricing(e.target.checked)}
                />
                Include pricing information
              </label>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowEmailModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="btn-confirm"
                disabled={!email.trim()}
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
