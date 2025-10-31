import { useState, useCallback } from 'react';
import { chatbotAPI } from '../services/api.service';
import { Message, Pharmacy } from '../types';

export const useChat = () => {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startChat = useCallback(async (phoneNumber: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await chatbotAPI.startChat(phoneNumber);

      setConversationId(response.conversationId);
      setPharmacy(response.pharmacy);

      // Add greeting message
      const greetingMessage: Message = {
        role: 'ASSISTANT',
        content: response.message,
        timestamp: new Date(),
      };
      setMessages([greetingMessage]);

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to start chat';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (messageContent: string) => {
      if (!conversationId) {
        throw new Error('No active conversation');
      }

      // Add user message immediately
      const userMessage: Message = {
        role: 'USER',
        content: messageContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setLoading(true);
      setError(null);

      try {
        const response = await chatbotAPI.sendMessage(conversationId, messageContent);

        // Add assistant response
        const assistantMessage: Message = {
          role: 'ASSISTANT',
          content: response.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update pharmacy data if provided
        if (response.pharmacy) {
          setPharmacy(response.pharmacy);
        }

        return response;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to send message';
        setError(errorMessage);

        // Add error message
        const errorMsg: Message = {
          role: 'ASSISTANT',
          content: `Sorry, I encountered an error: ${errorMessage}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [conversationId],
  );

  const scheduleCallback = useCallback(
    async (preferredTime: string, notes?: string) => {
      if (!conversationId) {
        throw new Error('No active conversation');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await chatbotAPI.scheduleCallback(
          conversationId,
          preferredTime,
          notes,
        );

        // Add confirmation message
        const confirmMessage: Message = {
          role: 'ASSISTANT',
          content: response.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmMessage]);

        return response;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || 'Failed to schedule callback';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [conversationId],
  );

  const sendEmail = useCallback(
    async (email: string, includePricing: boolean = false) => {
      if (!conversationId) {
        throw new Error('No active conversation');
      }

      setLoading(true);
      setError(null);

      try {
        const response = await chatbotAPI.sendEmail(
          conversationId,
          email,
          includePricing,
        );

        // Add confirmation message
        const confirmMessage: Message = {
          role: 'ASSISTANT',
          content: response.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmMessage]);

        return response;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to send email';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [conversationId],
  );

  return {
    conversationId,
    messages,
    pharmacy,
    loading,
    error,
    startChat,
    sendMessage,
    scheduleCallback,
    sendEmail,
  };
};
