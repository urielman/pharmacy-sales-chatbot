import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AI_FUNCTIONS } from './functions/ai-functions';
import { Pharmacy } from '../pharmacy/pharmacy.interface';
import { Message, MessageRole } from '../../database/entities';

interface GenerateResponseOptions {
  conversationHistory: Message[];
  userMessage: string;
  pharmacy?: Pharmacy;
  isNewLead: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async generateResponse(options: GenerateResponseOptions) {
    const { conversationHistory, userMessage, pharmacy, isNewLead } = options;

    const messages = this.buildMessages(conversationHistory, userMessage, pharmacy, isNewLead);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        tools: AI_FUNCTIONS,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 500,
      });

      const choice = response.choices[0];
      const assistantMessage = choice.message;

      // Check if there are function calls
      const toolCalls = assistantMessage.tool_calls;

      return {
        content: assistantMessage.content || '',
        toolCalls: toolCalls || [],
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      throw error;
    }
  }

  async generateGreeting(pharmacy: Pharmacy | null, phoneNumber: string): Promise<string> {
    if (pharmacy) {
      // Returning pharmacy greeting with fixed presentation
      let greeting = `Hello! This is Pharmesol calling for ${pharmacy.name}.`;

      if (pharmacy.contactPerson) {
        greeting += ` I see we're speaking with ${pharmacy.contactPerson}.`;
      }

      greeting += ` How can I help you today?`;

      // Add volume-specific context
      const volumeMessage = this.getVolumeMessage(this.getVolumeTier(pharmacy.rxVolume));
      greeting += ` ${volumeMessage}`;

      return greeting;
    } else {
      // New lead greeting with fixed presentation
      return `Hello! Thank you for calling Pharmesol. We specialize in supporting high prescription volume pharmacies. ` +
        `May I get your pharmacy's name to better assist you?`;
    }
  }

  private buildMessages(
    conversationHistory: Message[],
    userMessage: string,
    pharmacy: Pharmacy | undefined,
    isNewLead: boolean,
  ): ChatCompletionMessageParam[] {
    const systemPrompt = this.buildSystemPrompt(pharmacy, isNewLead);

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add conversation history
    for (const msg of conversationHistory) {
      if (msg.role === MessageRole.SYSTEM) continue;

      messages.push({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    return messages;
  }

  private buildSystemPrompt(pharmacy: Pharmacy | undefined, isNewLead: boolean): string {
    let prompt = `You are a professional sales assistant for Pharmesol, a company that provides comprehensive solutions for pharmacies.

Your role:
- Be professional, friendly, and helpful
- Listen carefully and respond naturally
- Use function calls to take actions when appropriate
- Keep responses concise and conversational (2-3 sentences max)
- Focus on understanding their needs and how Pharmesol can help

Pharmesol Services:
- Automated dispensing systems
- Inventory management and optimization
- Prescription workflow automation
- Compliance and regulatory support
- Pharmacist support services
- Analytics and reporting tools
`;

    if (pharmacy) {
      // Returning pharmacy
      const volumeTier = this.getVolumeTier(pharmacy.rxVolume);
      prompt += `\n
Current Pharmacy Information:
- Name: ${pharmacy.name}
- Contact: ${pharmacy.contactPerson || 'Not specified'}
- Address: ${pharmacy.address ? `${pharmacy.address}, ${pharmacy.city}, ${pharmacy.state}` : 'Not specified'}
- Monthly Rx Volume: ~${pharmacy.rxVolume.toLocaleString()} prescriptions
- Volume Tier: ${volumeTier}
- Email: ${pharmacy.email || 'Not provided'}

Talking Points:
${this.getVolumeMessage(volumeTier)}

Reference their pharmacy details naturally in conversation to show familiarity.
`;
    } else if (isNewLead) {
      // New lead
      prompt += `\n
This is a new lead. Your goal is to:
1. Collect basic information about their pharmacy (name, contact person, location)
2. Understand their prescription volume
3. Get their email for follow-up
4. Explain how Pharmesol can help based on their volume
5. Offer to schedule a callback or send more information

Use the collect_pharmacy_info function as you learn details about their pharmacy.
Don't ask all questions at once - make it conversational and natural.
`;
    }

    return prompt;
  }

  private getVolumeTier(rxVolume: number): string {
    if (rxVolume >= 10000) return 'HIGH';
    if (rxVolume >= 5000) return 'MEDIUM';
    if (rxVolume >= 1000) return 'LOW';
    return 'UNKNOWN';
  }

  private getVolumeMessage(tier: string): string {
    switch (tier) {
      case 'HIGH':
        return 'With your high prescription volume, our automated dispensing and inventory management systems could significantly improve workflow efficiency and reduce errors.';
      case 'MEDIUM':
        return 'Your pharmacy is in an excellent position to benefit from our prescription management tools and pharmacist support services.';
      case 'LOW':
        return 'We can help streamline your processes and position your pharmacy for growth with our scalable solutions.';
      default:
        return 'Pharmesol offers comprehensive solutions to support pharmacies of all sizes with prescription management, inventory control, and compliance tools.';
    }
  }
}
