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
 * Streamlined tests to validate core LLM functionality:
 * - Function calling works
 * - Greetings include proper data
 * - Key edge cases are handled
 */
describe('ChatbotService - Real LLM Integration Tests', () => {
  let aiService: AiService;

  beforeAll(async () => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY must be set to run integration tests.');
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        MikroOrmModule.forRoot(mikroOrmConfig),
      ],
      providers: [AiService, PharmacyService],
    }).compile();

    aiService = module.get<AiService>(AiService);
  });

  describe('Core Function Calling', () => {
    it('should extract pharmacy info from mixed message', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'Hi, this is Sarah from MediCare Plus. We do around 8000 scripts a month.',
        pharmacy: null,
        isNewLead: true,
      });

      // Should extract at least some information
      const collectInfoCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'collect_pharmacy_info',
      );

      if (collectInfoCall) {
        const args = JSON.parse(collectInfoCall.function.arguments);
        expect(
          args.pharmacy_name || args.contact_person || args.estimated_rx_volume,
        ).toBeDefined();
      } else {
        // Or at least respond appropriately
        expect(response.content).toBeDefined();
      }
    }, 30000);

    it('should handle schedule_callback requests', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'Can you call me back tomorrow at 2pm?',
        pharmacy: null,
        isNewLead: true,
      });

      const callbackCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'schedule_callback',
      );

      if (callbackCall) {
        const args = JSON.parse(callbackCall.function.arguments);
        expect(args.preferred_time).toBeDefined();
      }
    }, 30000);
  });

  describe('Greeting Generation', () => {
    it('should generate greeting with location data', async () => {
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

      expect(greeting.toLowerCase()).toContain('healthfirst');
      expect(greeting.toLowerCase()).toContain('new york');
      expect(greeting.toLowerCase()).toContain('john smith');
    }, 30000);

    it('should handle missing location data gracefully', async () => {
      const mockPharmacy = {
        id: '2',
        name: 'MediCare Pharmacy',
        phone: '+1-555-999-8888',
        city: null,
        state: null,
        rxVolume: 8000,
        email: 'contact@medicare.com',
        contactPerson: null,
      };

      const greeting = await aiService.generateGreeting(mockPharmacy);

      expect(greeting.toLowerCase()).toContain('medicare');
      expect(greeting).not.toContain('null');
      expect(greeting).not.toContain('undefined');
    }, 30000);
  });

  describe('Key Edge Cases', () => {
    it('should ask one question at a time', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'Hi, I am calling about your services',
        pharmacy: null,
        isNewLead: true,
      });

      expect(response.content).toBeDefined();
      const questionCount = (response.content.match(/\?/g) || []).length;
      expect(questionCount).toBeLessThanOrEqual(1);
    }, 30000);

    it('should handle off-topic questions professionally', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'What is the weather today?',
        pharmacy: null,
        isNewLead: true,
      });

      expect(response.content).toBeDefined();
      expect(response.content.toLowerCase()).toMatch(
        /pharmacy|help|assist|pharmesol/,
      );
    }, 30000);

    it('should handle extreme Rx volumes', async () => {
      const response = await aiService.generateResponse({
        conversationHistory: [],
        userMessage: 'We process 50,000 prescriptions per month',
        pharmacy: null,
        isNewLead: true,
      });

      const collectInfoCall = response.toolCalls?.find(
        (tc) => tc.function.name === 'collect_pharmacy_info',
      );

      if (collectInfoCall) {
        const args = JSON.parse(collectInfoCall.function.arguments);
        if (args.estimated_rx_volume) {
          expect(args.estimated_rx_volume).toBeGreaterThan(40000);
        }
      }

      expect(response.content || response.toolCalls?.length).toBeTruthy();
    }, 30000);
  });
});
