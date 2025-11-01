import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { ChatbotService } from '../src/modules/chatbot/chatbot.service';
import {
  Conversation,
  ConversationStatus,
  ConversationState,
} from '../src/database/entities/conversation.entity';
import { Message, MessageRole } from '../src/database/entities/message.entity';
import { PharmacyLead } from '../src/database/entities/pharmacy-lead.entity';
import { PharmacyService } from '../src/modules/pharmacy/pharmacy.service';
import { AiService } from '../src/modules/ai/ai.service';
import { EmailService } from '../src/modules/notifications/email.service';
import { CallbackService } from '../src/modules/notifications/callback.service';

describe('ChatbotService - LLM API Integration Tests', () => {
  let service: ChatbotService;
  let conversationRepo: jest.Mocked<EntityRepository<Conversation>>;
  let messageRepo: jest.Mocked<EntityRepository<Message>>;
  let leadRepo: jest.Mocked<EntityRepository<PharmacyLead>>;
  let em: jest.Mocked<EntityManager>;
  let pharmacyService: jest.Mocked<PharmacyService>;
  let aiService: jest.Mocked<AiService>;
  let emailService: jest.Mocked<EmailService>;
  let callbackService: jest.Mocked<CallbackService>;

  const mockPharmacy = {
    id: '1',
    name: 'HealthFirst Pharmacy',
    phone: '+1-555-123-4567',
    city: 'New York',
    state: 'NY',
    rxVolume: 12000,
    email: 'contact@healthfirst.com',
    contactPerson: 'John Smith',
  };

  beforeEach(async () => {
    const mockConversationRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const mockMessageRepo = {
      create: jest.fn(),
    };

    const mockLeadRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const mockEntityManager = {
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      populate: jest.fn(),
    };

    const mockPharmacyService = {
      normalizePhone: jest.fn(),
      findByPhone: jest.fn(),
      getRxVolumeTier: jest.fn(),
      getVolumeMessage: jest.fn(),
    };

    const mockAiService = {
      generateGreeting: jest.fn(),
      generateResponse: jest.fn(),
      generateConversationContinuation: jest.fn(),
      generateResponseAfterFunctionCalls: jest.fn(),
      getVolumeMessage: jest.fn(),
    };

    const mockEmailService = {
      sendFollowupEmail: jest.fn(),
    };

    const mockCallbackService = {
      scheduleCallback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockConversationRepo,
        },
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessageRepo,
        },
        {
          provide: getRepositoryToken(PharmacyLead),
          useValue: mockLeadRepo,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: PharmacyService,
          useValue: mockPharmacyService,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: CallbackService,
          useValue: mockCallbackService,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    conversationRepo = module.get(getRepositoryToken(Conversation));
    messageRepo = module.get(getRepositoryToken(Message));
    leadRepo = module.get(getRepositoryToken(PharmacyLead));
    em = module.get(EntityManager);
    pharmacyService = module.get(PharmacyService);
    aiService = module.get(AiService);
    emailService = module.get(EmailService);
    callbackService = module.get(CallbackService);

    // Mock persistAndFlush to set IDs on entities globally
    em.persistAndFlush.mockImplementation(async (entity: any) => {
      if (!entity.id) entity.id = Math.floor(Math.random() * 1000);
    });
  });

  describe('startChat - Returning Pharmacy (External API)', () => {
    it('should start new conversation with returning pharmacy from external API', async () => {
      const phoneNumber = '+1-555-123-4567';
      const normalized = '15551234567';

      pharmacyService.normalizePhone.mockReturnValue(normalized);
      conversationRepo.findOne.mockResolvedValue(null); // No existing conversation
      pharmacyService.findByPhone.mockResolvedValue(mockPharmacy);
      leadRepo.findOne.mockResolvedValue(null); // No lead for returning pharmacy
      aiService.generateGreeting.mockResolvedValue(
        'Hello! Thank you for calling Pharmesol. I see you\'re calling from HealthFirst Pharmacy in New York, NY. Am I speaking with John Smith?',
      );

      const result = await service.startChat(phoneNumber);

      expect(pharmacyService.normalizePhone).toHaveBeenCalledWith(phoneNumber);
      expect(pharmacyService.findByPhone).toHaveBeenCalledWith(normalized);
      expect(aiService.generateGreeting).toHaveBeenCalledWith(mockPharmacy);
      // leadRepo.findOne should NOT be called when pharmacy is found in external API
      expect(leadRepo.findOne).not.toHaveBeenCalled();
      expect(result.conversationId).toBeDefined();
      expect(result.isNewConversation).toBe(true);
      expect(result.pharmacy).toEqual(mockPharmacy);
      expect(result.lead).toBeNull();
      expect(result.state).toBe(ConversationState.PHARMACY_IDENTIFIED);
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should return existing conversation with pharmacy data', async () => {
      const phoneNumber = '+1-555-123-4567';
      const normalized = '15551234567';

      const mockConversation: Partial<Conversation> = {
        id: 1,
        phoneNumber: normalized,
        status: ConversationStatus.ACTIVE,
        state: ConversationState.PHARMACY_IDENTIFIED,
        isReturningPharmacy: true,
        pharmacyData: mockPharmacy,
        messages: { getItems: () => [] } as any,
      };

      pharmacyService.normalizePhone.mockReturnValue(normalized);
      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);
      leadRepo.findOne.mockResolvedValue(null);
      aiService.generateConversationContinuation.mockResolvedValue(
        'Welcome back! I recall we were discussing your pharmacy needs. How can I continue to help you?',
      );

      const result = await service.startChat(phoneNumber);

      expect(result.conversationId).toBe(1);
      expect(result.isNewConversation).toBe(false);
      expect(result.pharmacy).toEqual(mockPharmacy);
      expect(result.lead).toBeNull();
      expect(result.state).toBe(ConversationState.PHARMACY_IDENTIFIED);
    });
  });

  describe('startChat - New Lead (Not in External API)', () => {
    it('should start new conversation for new lead', async () => {
      const phoneNumber = '1234567';
      const normalized = '1234567';

      pharmacyService.normalizePhone.mockReturnValue(normalized);
      conversationRepo.findOne.mockResolvedValue(null);
      pharmacyService.findByPhone.mockResolvedValue(null); // Not in external API
      leadRepo.findOne.mockResolvedValue(null); // No existing lead
      aiService.generateGreeting.mockResolvedValue(
        'Hello! Thank you for calling Pharmesol. May I get your pharmacy name?',
      );

      const result = await service.startChat(phoneNumber);

      expect(result.isNewConversation).toBe(true);
      expect(result.pharmacy).toBeNull();
      expect(result.lead).toBeNull();
      expect(result.state).toBe(ConversationState.COLLECTING_LEAD_INFO);
    });

    it('should return existing conversation with collected lead data', async () => {
      const phoneNumber = '1234567';
      const normalized = '1234567';

      const mockLead: Partial<PharmacyLead> = {
        id: 1,
        phoneNumber: normalized,
        pharmacyName: 'PharmaWin',
        contactPerson: 'Mark',
        estimatedRxVolume: 6000,
        email: 'mark@pharmawin.com',
      };

      const mockConversation: Partial<Conversation> = {
        id: 2,
        phoneNumber: normalized,
        status: ConversationStatus.ACTIVE,
        state: ConversationState.DISCUSSING_SERVICES,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      pharmacyService.normalizePhone.mockReturnValue(normalized);
      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);
      leadRepo.findOne.mockResolvedValue(mockLead as PharmacyLead);
      aiService.generateConversationContinuation.mockResolvedValue(
        'Welcome back! We were discussing your pharmacy needs. How can I help you further?',
      );

      const result = await service.startChat(phoneNumber);

      expect(result.conversationId).toBe(2);
      expect(result.pharmacy).toBeNull();
      expect(result.lead).toEqual(mockLead);
      expect(result.state).toBe(ConversationState.DISCUSSING_SERVICES);
    });
  });

  describe('sendMessage - AI Function Call Execution', () => {
    it('should execute collect_pharmacy_info function call', async () => {
      const conversationId = 1;
      const userMessage = 'My pharmacy is PharmaWin and I am Mark';

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.COLLECTING_LEAD_INFO,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);

      const mockAiResponse = {
        content: 'Great! And how many prescriptions do you process monthly?',
        toolCalls: [
          {
            id: 'call_123',
            type: 'function' as const,
            function: {
              name: 'collect_pharmacy_info',
              arguments: JSON.stringify({
                pharmacy_name: 'PharmaWin',
                contact_person: 'Mark',
              }),
            },
          },
        ],
        finishReason: 'stop' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      aiService.generateResponseAfterFunctionCalls.mockResolvedValue(
        'Great! And how many prescriptions do you process monthly?',
      );
      leadRepo.findOne.mockResolvedValue(null);

      const result = await service.sendMessage(conversationId, userMessage);

      expect(result.message).toContain('prescriptions');
      expect(em.persistAndFlush).toHaveBeenCalled(); // Lead created/updated
    });

    it('should handle multiple function calls in one response', async () => {
      const conversationId = 1;
      const userMessage = 'My pharmacy is PharmaWin, I am Mark, and we do 6000 prescriptions monthly';

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.COLLECTING_LEAD_INFO,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);

      const mockAiResponse = {
        content: 'Perfect! Let me tell you about our solutions.',
        toolCalls: [
          {
            id: 'call_test',
            type: 'function' as const,
            function: {
              name: 'collect_pharmacy_info',
              arguments: JSON.stringify({
                pharmacy_name: 'PharmaWin',
                contact_person: 'Mark',
                estimated_rx_volume: 6000,
              }),
            },
          },
          {
            id: 'call_test',
            type: 'function' as const,
            function: {
              name: 'highlight_rx_benefits',
              arguments: JSON.stringify({
                volume_tier: 'MEDIUM',
              }),
            },
          },
        ],
        finishReason: 'stop' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      aiService.generateResponseAfterFunctionCalls.mockResolvedValue(
        'Perfect! Let me tell you about our solutions.',
      );
      leadRepo.findOne.mockResolvedValue(null);
      aiService.getVolumeMessage.mockReturnValue(
        'Your volume puts you in an excellent position to benefit from our solutions.',
      );

      const result = await service.sendMessage(conversationId, userMessage);

      expect(result.message).toBeDefined();
      expect(aiService.getVolumeMessage).toHaveBeenCalledWith('MEDIUM');
    });

    it('should execute schedule_callback function call', async () => {
      const conversationId = 1;
      const userMessage = 'Can you call me tomorrow at 2pm?';

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.DISCUSSING_SERVICES,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);

      const mockAiResponse = {
        content: '',
        toolCalls: [
          {
            id: 'call_test',
            type: 'function' as const,
            function: {
              name: 'schedule_callback',
              arguments: JSON.stringify({
                preferred_time: 'Tomorrow at 2pm',
                notes: 'Follow up on pricing discussion',
              }),
            },
          },
        ],
        finishReason: 'tool_calls' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      aiService.generateResponseAfterFunctionCalls.mockResolvedValue(
        'Great! I\'ve scheduled a callback for Tomorrow at 2pm.',
      );
      leadRepo.findOne.mockResolvedValue(null);
      callbackService.scheduleCallback.mockResolvedValue(undefined);

      const result = await service.sendMessage(conversationId, userMessage);

      expect(callbackService.scheduleCallback).toHaveBeenCalledWith(
        '1234567',
        'Tomorrow at 2pm',
        'Follow up on pricing discussion',
      );
      expect(result.message).toContain('callback');
    });

    it('should execute send_followup_email function call', async () => {
      const conversationId = 1;
      const userMessage = 'Send me more info at mark@pharmawin.com';

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.DISCUSSING_SERVICES,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);

      const mockAiResponse = {
        content: '',
        toolCalls: [
          {
            id: 'call_test',
            type: 'function' as const,
            function: {
              name: 'send_followup_email',
              arguments: JSON.stringify({
                email: 'mark@pharmawin.com',
                include_pricing: true,
              }),
            },
          },
        ],
        finishReason: 'tool_calls' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      aiService.generateResponseAfterFunctionCalls.mockResolvedValue(
        'Perfect! I\'ve sent detailed information to mark@pharmawin.com.',
      );
      leadRepo.findOne.mockResolvedValue(null);
      emailService.sendFollowupEmail.mockResolvedValue(undefined);

      const result = await service.sendMessage(conversationId, userMessage);

      expect(emailService.sendFollowupEmail).toHaveBeenCalledWith(
        'mark@pharmawin.com',
        null,
        true,
      );
      expect(result.message).toContain('mark@pharmawin.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial lead information collection', async () => {
      const conversationId = 1;
      const userMessage = 'My pharmacy is PharmaWin';

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.COLLECTING_LEAD_INFO,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);

      const mockAiResponse = {
        content: 'Great! And who am I speaking with?',
        toolCalls: [
          {
            id: 'call_test',
            type: 'function' as const,
            function: {
              name: 'collect_pharmacy_info',
              arguments: JSON.stringify({
                pharmacy_name: 'PharmaWin',
              }),
            },
          },
        ],
        finishReason: 'stop' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      aiService.generateResponseAfterFunctionCalls.mockResolvedValue(
        'Great! And who am I speaking with?',
      );
      leadRepo.findOne.mockResolvedValue(null);

      const result = await service.sendMessage(conversationId, userMessage);

      expect(result.state).toBe(ConversationState.COLLECTING_LEAD_INFO); // Still collecting
      expect(em.persistAndFlush).toHaveBeenCalled(); // Partial data saved
    });

    it('should handle incremental lead data updates', async () => {
      const conversationId = 1;
      const userMessage = 'I am Mark';

      const existingLead: Partial<PharmacyLead> = {
        id: 1,
        phoneNumber: '1234567',
        pharmacyName: 'PharmaWin',
        contactPerson: null,
      };

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.COLLECTING_LEAD_INFO,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);
      leadRepo.findOne.mockResolvedValue(existingLead as PharmacyLead);

      const mockAiResponse = {
        content: 'Nice to meet you, Mark! How many prescriptions do you process monthly?',
        toolCalls: [
          {
            id: 'call_test',
            type: 'function' as const,
            function: {
              name: 'collect_pharmacy_info',
              arguments: JSON.stringify({
                contact_person: 'Mark',
              }),
            },
          },
        ],
        finishReason: 'stop' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      aiService.generateResponseAfterFunctionCalls.mockResolvedValue(
        'Nice to meet you, Mark! How many prescriptions do you process monthly?',
      );

      await service.sendMessage(conversationId, userMessage);

      expect(leadRepo.findOne).toHaveBeenCalledWith({ phoneNumber: '1234567' });
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should handle AI response with no content and no function calls', async () => {
      const conversationId = 1;
      const userMessage = 'Hello';

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.COLLECTING_LEAD_INFO,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);

      const mockAiResponse = {
        content: null,
        toolCalls: [],
        finishReason: 'stop' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      leadRepo.findOne.mockResolvedValue(null);

      const result = await service.sendMessage(conversationId, userMessage);

      expect(result.message).toBe('I understand. How else can I help you?');
    });

    it('should handle different phone number formats', async () => {
      const testCases = [
        '+1-555-123-4567',
        '(555) 123-4567',
        '555.123.4567',
        '+1 555 123 4567',
      ];

      for (const phoneNumber of testCases) {
        pharmacyService.normalizePhone.mockReturnValue('15551234567');
        conversationRepo.findOne.mockResolvedValue(null);
        pharmacyService.findByPhone.mockResolvedValue(mockPharmacy);
        leadRepo.findOne.mockResolvedValue(null);
        aiService.generateGreeting.mockResolvedValue('Hello!');

        await service.startChat(phoneNumber);

        expect(pharmacyService.normalizePhone).toHaveBeenCalledWith(phoneNumber);
      }
    });

    it('should handle state transition when all lead info collected', async () => {
      const conversationId = 1;
      const userMessage = 'We process about 6000 prescriptions monthly';

      const existingLead: Partial<PharmacyLead> = {
        id: 1,
        phoneNumber: '1234567',
        pharmacyName: 'PharmaWin',
        contactPerson: 'Mark',
        estimatedRxVolume: null,
      };

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.COLLECTING_LEAD_INFO,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);
      leadRepo.findOne.mockResolvedValue(existingLead as PharmacyLead);

      const mockAiResponse = {
        content: 'Perfect! Let me tell you about our solutions.',
        toolCalls: [
          {
            id: 'call_test',
            type: 'function' as const,
            function: {
              name: 'collect_pharmacy_info',
              arguments: JSON.stringify({
                estimated_rx_volume: 6000,
              }),
            },
          },
        ],
        finishReason: 'stop' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      aiService.generateResponseAfterFunctionCalls.mockResolvedValue(
        'Perfect! Let me tell you about our solutions.',
      );

      await service.sendMessage(conversationId, userMessage);

      // After collecting all required info (name, contact, volume), state should transition
      expect(mockConversation.state).toBe(ConversationState.DISCUSSING_SERVICES);
    });

    it('should return updated lead data in sendMessage response', async () => {
      const conversationId = 1;
      const userMessage = 'I am Mark';

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.COLLECTING_LEAD_INFO,
        isReturningPharmacy: false,
        pharmacyData: null,
        messages: { getItems: () => [] } as any,
      };

      const updatedLead: Partial<PharmacyLead> = {
        id: 1,
        phoneNumber: '1234567',
        pharmacyName: 'PharmaWin',
        contactPerson: 'Mark',
        estimatedRxVolume: null,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);
      leadRepo.findOne
        .mockResolvedValueOnce(null) // First call during function execution
        .mockResolvedValueOnce(updatedLead as PharmacyLead); // Second call at end of sendMessage

      const mockAiResponse = {
        content: 'Nice to meet you, Mark!',
        toolCalls: [
          {
            id: 'call_test',
            type: 'function' as const,
            function: {
              name: 'collect_pharmacy_info',
              arguments: JSON.stringify({
                contact_person: 'Mark',
              }),
            },
          },
        ],
        finishReason: 'stop' as const,
      };

      aiService.generateResponse.mockResolvedValue(mockAiResponse);
      aiService.generateResponseAfterFunctionCalls.mockResolvedValue(
        'Nice to meet you, Mark!',
      );

      const result = await service.sendMessage(conversationId, userMessage);

      expect(result.lead).toEqual(updatedLead);
      expect(result.pharmacy).toBeNull();
    });

    it('should not create lead for pharmacy found in external API', async () => {
      const phoneNumber = '+1-555-123-4567';
      const normalized = '15551234567';

      pharmacyService.normalizePhone.mockReturnValue(normalized);
      conversationRepo.findOne.mockResolvedValue(null);
      pharmacyService.findByPhone.mockResolvedValue(mockPharmacy);
      leadRepo.findOne.mockResolvedValue(null);
      aiService.generateGreeting.mockResolvedValue('Hello!');

      await service.startChat(phoneNumber);

      // When pharmacy is found in external API, lead repo should NOT be queried
      expect(leadRepo.findOne).not.toHaveBeenCalled();
      expect(leadRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('Conversation State Management', () => {
    it('should properly transition state after callback scheduling', async () => {
      const conversationId = 1;

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.DISCUSSING_SERVICES,
        status: ConversationStatus.ACTIVE,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);
      callbackService.scheduleCallback.mockResolvedValue(undefined);

      const result = await service.scheduleCallback(conversationId, 'Tomorrow at 2pm', 'Pricing');

      expect(result.success).toBe(true);
      expect(mockConversation.status).toBe(ConversationStatus.FOLLOWUP_SCHEDULED);
      expect(em.flush).toHaveBeenCalled();
    });

    it('should handle email sending and state transition', async () => {
      const conversationId = 1;

      const mockConversation: Partial<Conversation> = {
        id: conversationId,
        phoneNumber: '1234567',
        state: ConversationState.DISCUSSING_SERVICES,
        pharmacyData: null,
      };

      conversationRepo.findOne.mockResolvedValue(mockConversation as Conversation);
      emailService.sendFollowupEmail.mockResolvedValue(undefined);

      const result = await service.sendEmail(conversationId, 'test@example.com', true);

      expect(result.success).toBe(true);
      expect(emailService.sendFollowupEmail).toHaveBeenCalledWith('test@example.com', null, true);
      expect(em.flush).toHaveBeenCalled();
    });
  });
});
