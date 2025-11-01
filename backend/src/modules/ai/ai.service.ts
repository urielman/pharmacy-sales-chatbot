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

  /**
   * Generate a natural language response after function calls have been executed
   * This follows the OpenAI function calling pattern where we send tool results back to get a response
   */
  async generateResponseAfterFunctionCalls(
    conversationHistory: Message[],
    userMessage: string,
    pharmacy: Pharmacy | undefined,
    isNewLead: boolean,
    toolCalls: any[],
    functionResults: { functionName: string; result: string }[],
  ): Promise<string> {
    const messages = this.buildMessages(conversationHistory, userMessage, pharmacy, isNewLead);

    // Add the assistant's message with tool calls
    messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCalls,
    });

    // Add tool results
    for (let i = 0; i < functionResults.length; i++) {
      messages.push({
        role: 'tool',
        tool_call_id: toolCalls[i].id,
        content: functionResults[i].result || 'Function executed successfully',
      });
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        tools: AI_FUNCTIONS,
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content ||
        'Thank you for that information. How else can I help you today?';

      return content;
    } catch (error) {
      this.logger.error(`Error generating response after function calls: ${error.message}`);
      // Return a generic fallback
      return 'Thank you for that information. How can I continue to assist you?';
    }
  }

  /**
   * Get a professional introduction to Pharmesol's services
   * This is a reusable method that can be called anywhere in the conversation
   * when we need to introduce or explain what Pharmesol does
   */
  getPharmesolIntroduction(pharmacy?: Pharmacy): string {
    const baseIntro = `Pharmesol provides Voice AI and Messaging AI solutions specifically designed for pharmacies. Our AI-enabled pharmacy assistant automates frequent conversations and administrative tasks, helping you handle patient inquiries, prescription refills, appointment scheduling, and other routine interactions efficiently. Using advanced LLM technology tailored for pharmaceutical contexts, we help pharmacies reduce staff workload, improve response times, and deliver exceptional patient service 24/7.`;

    if (pharmacy && pharmacy.rxVolume) {
      const monthlyVolume = pharmacy.rxVolume;
      const volumeTier = this.getRxVolumeTier(monthlyVolume);

      let volumeContext = '';

      if (volumeTier === 'HIGH') {
        volumeContext = ` With your impressive volume of approximately ${monthlyVolume.toLocaleString()} prescriptions per month, our AI solutions can significantly reduce the administrative burden on your team, allowing them to focus on high-value patient care while we handle routine inquiries and communications at scale.`;
      } else if (volumeTier === 'MEDIUM') {
        volumeContext = ` Processing around ${monthlyVolume.toLocaleString()} prescriptions monthly, you're in an excellent position to benefit from AI automation. Our solutions can help you manage growing patient communication demands without proportionally increasing staff, positioning your pharmacy for efficient growth.`;
      } else if (volumeTier === 'LOW') {
        volumeContext = ` Even at ${monthlyVolume.toLocaleString()} prescriptions per month, our AI solutions can free up your team's time by handling routine calls and messages, allowing you to deliver more personalized service to your patients while keeping operational costs manageable.`;
      }

      return baseIntro + volumeContext;
    }

    return baseIntro;
  }

  async generateGreeting(pharmacy: Pharmacy | null): Promise<string> {
    if (pharmacy) {
      // Returning pharmacy greeting with professional presentation (inbound call)
      let greeting = `Hello! Thank you for calling Pharmesol. I see you're calling from ${pharmacy.name}.`;

      if (pharmacy.contactPerson) {
        greeting += ` Am I speaking with ${pharmacy.contactPerson}?`;
      }

      greeting += '\n\n';

      // Add professional Pharmesol introduction with volume-specific value proposition
      greeting += this.getPharmesolIntroduction(pharmacy);

      return greeting;
    } else {
      // New lead greeting with professional presentation
      return `Hello! Thank you for calling Pharmesol.\n\n${this.getPharmesolIntroduction()}\n\nMay I get your pharmacy's name to better understand how we can assist you?`;
    }
  }

  async generateConversationContinuation(
    conversationHistory: Message[],
    pharmacy: Pharmacy | null,
    conversationState: string,
  ): Promise<string> {
    // Build a summary of the previous conversation
    const recentMessages = conversationHistory.slice(-6); // Last 3 exchanges

    const systemPrompt = `You are a professional sales assistant for Pharmesol resuming a previous conversation.

Your task: Generate a brief, friendly message that:
1. Acknowledges you're continuing from a previous conversation
2. Provides a 1-sentence summary of what was discussed
3. Smoothly transitions to continue helping them

Guidelines:
- Be warm and professional
- Keep it concise (2-3 sentences total)
- Reference specific details from the conversation if available
- Match the conversation stage: ${conversationState}
- Don't repeat information unnecessarily

${pharmacy ? `Speaking with: ${pharmacy.name}${pharmacy.contactPerson ? ` (${pharmacy.contactPerson})` : ''}` : 'New lead conversation'}`;

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add recent conversation history
    for (const msg of recentMessages) {
      if (msg.role === MessageRole.SYSTEM) continue;

      messages.push({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 150,
      });

      return response.choices[0].message.content ||
        'Welcome back! How can I continue to assist you today?';
    } catch (error) {
      this.logger.error(`Error generating conversation continuation: ${error.message}`);
      // Fallback message
      return 'Welcome back! I recall our previous conversation. How can I help you today?';
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
    let prompt = `You are a professional sales assistant for Pharmesol, a company that provides Voice AI and Messaging AI solutions for pharmacies.

Your role:
- Be professional, friendly, and helpful
- Listen carefully and respond naturally
- Use function calls to take actions when appropriate
- Keep responses concise and conversational (2-3 sentences max)
- Focus on understanding their needs and how Pharmesol's AI solutions can help

Pharmesol Services:
- Voice AI and Messaging AI for pharmacies
- AI-enabled pharmacy assistant that automates conversations
- Patient inquiry automation (prescription refills, appointment scheduling, etc.)
- Administrative task automation
- 24/7 automated patient communication
- LLM technology specifically designed for pharmaceutical contexts
- Reduces staff workload and improves patient service
`;

    if (pharmacy) {
      // Returning pharmacy
      const volumeTier = this.getRxVolumeTier(pharmacy.rxVolume);
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

  private getRxVolumeTier(rxVolume: number): string {
    if (rxVolume >= 10000) return 'HIGH';
    if (rxVolume >= 5000) return 'MEDIUM';
    if (rxVolume >= 1000) return 'LOW';
    return 'UNKNOWN';
  }

  getVolumeMessage(tier: string): string {
    switch (tier) {
      case 'HIGH':
        return 'With your high prescription volume, our AI automation can handle the influx of patient calls and messages, freeing your staff to focus on in-person care and complex pharmaceutical services.';
      case 'MEDIUM':
        return 'Your pharmacy is in an excellent position to benefit from AI-powered communication automation that scales with your growing patient base without increasing administrative overhead.';
      case 'LOW':
        return 'Our AI solutions can help you deliver responsive patient service 24/7 while keeping operational costs manageable as you grow.';
      default:
        return 'Pharmesol offers Voice AI and Messaging AI solutions to help pharmacies of all sizes automate patient communications and administrative tasks.';
    }
  }
}
