import axios from 'axios';
import { StartChatResponse, SendMessageResponse, Conversation } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatbotAPI = {
  startChat: async (phoneNumber: string): Promise<StartChatResponse> => {
    const response = await api.post('/api/chatbot/start', { phoneNumber });
    return response.data;
  },

  sendMessage: async (
    conversationId: number,
    message: string,
  ): Promise<SendMessageResponse> => {
    const response = await api.post('/api/chatbot/message', {
      conversationId,
      message,
    });
    return response.data;
  },

  scheduleCallback: async (
    conversationId: number,
    preferredTime: string,
    notes?: string,
  ) => {
    const response = await api.post('/api/chatbot/schedule-callback', {
      conversationId,
      preferredTime,
      notes,
    });
    return response.data;
  },

  sendEmail: async (
    conversationId: number,
    email: string,
    includePricing: boolean = false,
  ) => {
    const response = await api.post('/api/chatbot/send-email', {
      conversationId,
      email,
      includePricing,
    });
    return response.data;
  },

  getConversation: async (conversationId: number): Promise<Conversation> => {
    const response = await api.get(`/api/chatbot/conversation/${conversationId}`);
    return response.data;
  },
};
