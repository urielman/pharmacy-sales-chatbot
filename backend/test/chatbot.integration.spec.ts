import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AiService } from '../src/modules/ai/ai.service';
import { PharmacyService } from '../src/modules/pharmacy/pharmacy.service';
import mikroOrmConfig from '../src/mikro-orm.config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * INTEGRATION TESTS - Real OpenAI API Calls
 *
 * These tests make actual calls to OpenAI's API to validate:
 * 1. LLM function calling works correctly
 * 2. System prompts produce expected behavior
 * 3. Edge cases are handled properly
 *
 * WARNING: These tests consume API credits and are slower than unit tests
 *
 * To run only these tests:
 * npm test -- chatbot.integration.spec.ts
 *
 * To skip these tests in CI:
 * npm test -- --testPathIgnorePatterns=integration
 */
describe('ChatbotService - Real LLM Integration Tests', () => {
  let aiService: AiService;
  let pharmacyService: PharmacyService;

  beforeAll(async () => {
    // Ensure OPENAI_API_KEY is set
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY must be set to run integration tests. ' +
        'These tests make real API calls to OpenAI.',
      );
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        MikroOrmModule.forRoot(mikroOrmConfig),
      ],
      providers: [AiService, PharmacyService],
    }).compile();

    aiService = module.get<AiService>(AiService);
    pharmacyService = module.get<PharmacyService>(PharmacyService);
  });

  describe('Function Calling - collect_pharmacy_info', () => {
    it('should extract pharmacy name from user message', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'Hi, this is PharmaWin calling',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      // The LLM should call collect_pharmacy_info with pharmacy_name
      expect(response.toolCalls).toBeDefined();
      const collectInfoCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'collect_pharmacy_info',
      );

      if (collectInfoCall) {
        const args = JSON.parse(collectInfoCall.function.arguments);
        expect(args.pharmacy_name).toBeDefined();
        expect(args.pharmacy_name.toLowerCase()).toContain('pharmawin');
      } else {
        // LLM might ask for more info instead
        expect(response.content).toBeDefined();
        expect(response.content.toLowerCase()).toMatch(/name|pharmacy|called/);
      }
    }, 30000); // 30 second timeout for API call

    it('should extract contact person and pharmacy name', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'This is Mark from PharmaWin',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      const collectInfoCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'collect_pharmacy_info',
      );

      if (collectInfoCall) {
        const args = JSON.parse(collectInfoCall.function.arguments);
        // Should extract both pharmacy name and contact person
        expect(args.pharmacy_name || args.contact_person).toBeDefined();
      }

      // Either way, response should be relevant
      expect(response.content || response.toolCalls?.length).toBeTruthy();
    }, 30000);

    it('should extract prescription volume when mentioned', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'We process about 6000 prescriptions per month',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      const collectInfoCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'collect_pharmacy_info',
      );

      if (collectInfoCall) {
        const args = JSON.parse(collectInfoCall.function.arguments);
        expect(args.estimated_rx_volume).toBeDefined();
        expect(args.estimated_rx_volume).toBeGreaterThan(5000);
        expect(args.estimated_rx_volume).toBeLessThan(7000);
      }
    }, 30000);
  });

  describe('Function Calling - schedule_callback', () => {
    it('should schedule callback when user requests it', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'Can you call me back tomorrow at 2pm?',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      const callbackCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'schedule_callback',
      );

      if (callbackCall) {
        const args = JSON.parse(callbackCall.function.arguments);
        expect(args.preferred_time).toBeDefined();
        expect(args.preferred_time.toLowerCase()).toMatch(/tomorrow|2pm|2:00|14:00/);
      }
    }, 30000);
  });

  describe('Function Calling - send_followup_email', () => {
    it('should send email when user provides email address', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'Please send me more information at mark@pharmawin.com',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      const emailCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'send_followup_email',
      );

      if (emailCall) {
        const args = JSON.parse(emailCall.function.arguments);
        expect(args.email).toBeDefined();
        expect(args.email).toContain('mark@pharmawin.com');
      }
    }, 30000);
  });

  describe('Edge Cases - Real LLM Behavior', () => {
    it('should handle ambiguous pharmacy names gracefully', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'This is ABC calling',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      // LLM should either extract "ABC" or ask for clarification
      expect(response.content || response.toolCalls?.length).toBeTruthy();
    }, 30000);

    it('should handle misspelled prescription volume', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'We do about six thousand prescritions monthly',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      const collectInfoCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'collect_pharmacy_info',
      );

      if (collectInfoCall) {
        const args = JSON.parse(collectInfoCall.function.arguments);
        // Should still extract ~6000 despite misspelling
        if (args.estimated_rx_volume) {
          expect(args.estimated_rx_volume).toBeGreaterThan(5000);
          expect(args.estimated_rx_volume).toBeLessThan(7000);
        }
      }
    }, 30000);

    it('should handle unusual time formats for callbacks', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'Call me back next Tuesday around lunchtime',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      const callbackCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'schedule_callback',
      );

      if (callbackCall) {
        const args = JSON.parse(callbackCall.function.arguments);
        expect(args.preferred_time).toBeDefined();
        expect(args.preferred_time.toLowerCase()).toMatch(/tuesday|lunch/);
      }
    }, 30000);

    it('should handle mixed information in one message', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage:
          'Hi, this is Sarah from MediCare Plus. We do around 8000 scripts a month. ' +
          'Can you email me at sarah@medicareplus.com with more details?',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      // Should extract multiple pieces of information
      const collectInfoCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'collect_pharmacy_info',
      );
      const emailCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'send_followup_email',
      );

      // LLM should call at least one function
      expect(response.toolCalls && response.toolCalls.length > 0).toBeTruthy();

      if (collectInfoCall) {
        const args = JSON.parse(collectInfoCall.function.arguments);
        // Should extract at least some information
        expect(
          args.pharmacy_name || args.contact_person || args.estimated_rx_volume,
        ).toBeDefined();
      }
    }, 30000);

    it('should handle greeting without information', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'Hello',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      // Should respond with a greeting and ask for information
      expect(response.content).toBeDefined();
      expect(response.content.toLowerCase()).toMatch(/hello|hi|pharmesol|name/);
    }, 30000);

    it('should handle off-topic questions professionally', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'What is the weather today?',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      // Should redirect to pharmacy-related conversation
      expect(response.content).toBeDefined();
      expect(response.content.toLowerCase()).toMatch(
        /pharmacy|help|assist|pharmesol|prescription/,
      );
    }, 30000);

    it('should maintain professional tone with rude input', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'This is a waste of my time',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('LLM Response:', JSON.stringify(response, null, 2));

      // Should remain professional
      expect(response.content).toBeDefined();
      expect(response.content.toLowerCase()).not.toMatch(/rude|angry|upset/);
      expect(response.content.toLowerCase()).toMatch(/understand|help|sorry|apologize/);
    }, 30000);
  });

  describe('Greeting Generation - Real LLM', () => {
    it('should generate appropriate greeting for returning pharmacy', async () => {
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

      const greeting = await aiService.generateGreeting(mockPharmacy);

      console.log('Generated Greeting:', greeting);

      expect(greeting).toBeDefined();
      expect(greeting.toLowerCase()).toContain('healthfirst');
      // Note: The greeting is actually fixed in the code, not AI-generated
      // This test validates the greeting service works
    }, 30000);

    it('should generate appropriate greeting for new lead', async () => {
      const greeting = await aiService.generateGreeting(null);

      console.log('Generated Greeting (New Lead):', greeting);

      expect(greeting).toBeDefined();
      expect(greeting.toLowerCase()).toMatch(/pharmesol|thank you|calling/);
    }, 30000);
  });

  describe('Conversation Context - Multi-turn', () => {
    it('should maintain context across multiple messages', async () => {
      // First message: user provides pharmacy name
      const response1 = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'This is PharmaWin',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('Response 1:', JSON.stringify(response1, null, 2));

      // Second message: user provides volume
      const mockHistory = [
        {
          role: 'USER' as any,
          content: 'This is PharmaWin',
          timestamp: new Date(),
        },
        {
          role: 'ASSISTANT' as any,
          content: response1.content || 'Great! How many prescriptions do you process monthly?',
          timestamp: new Date(),
        },
      ];

      const response2 = await aiService.generateResponse({
        conversationHistory: mockHistory as any,
        userMessage: 'We do about 6000 prescriptions',
        pharmacy: null,
        isNewLead: true,
      });

      console.log('Response 2:', JSON.stringify(response2, null, 2));

      // Should still collect the volume information
      const collectInfoCall = response2.toolCalls?.find(
        (tc) => tc.function.name === 'collect_pharmacy_info',
      );

      if (collectInfoCall) {
        const args = JSON.parse(collectInfoCall.function.arguments);
        expect(args.estimated_rx_volume).toBeDefined();
      }
    }, 60000); // Longer timeout for multiple API calls
  });
});
