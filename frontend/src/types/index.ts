export interface Message {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp: Date;
}

export interface Pharmacy {
  id: string;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  rxVolume: number;
  contactPerson?: string;
  email: string | null;
}

export interface Conversation {
  id: number;
  phoneNumber: string;
  status: string;
  state: string;
  pharmacy: Pharmacy | null;
  messages: Message[];
}

export interface StartChatResponse {
  conversationId: number;
  isNewConversation: boolean;
  message: string;
  pharmacy: Pharmacy | null;
  state: string;
}

export interface SendMessageResponse {
  message: string;
  state: string;
  pharmacy: Pharmacy | null;
}
