import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import {
  Conversation,
  ConversationStatus,
  ConversationState,
} from '../../database/entities/conversation.entity';
import { Message, MessageRole } from '../../database/entities/message.entity';
import { PharmacyLead } from '../../database/entities/pharmacy-lead.entity';
import { PharmacyService } from '../pharmacy/pharmacy.service';
import { AiService } from '../ai/ai.service';
import { EmailService } from '../notifications/email.service';
import { CallbackService } from '../notifications/callback.service';
import {
  ConversationStateMachine,
  ConversationEvent,
} from './state-machine/conversation-state-machine';
import {
  CollectPharmacyInfoArgs,
  ScheduleCallbackArgs,
  SendFollowupEmailArgs,
  HighlightRxBenefitsArgs,
} from '../ai/functions/ai-functions';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly stateMachine = new ConversationStateMachine();

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: EntityRepository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: EntityRepository<Message>,
    @InjectRepository(PharmacyLead)
    private readonly leadRepo: EntityRepository<PharmacyLead>,
    private readonly em: EntityManager,
    private readonly pharmacyService: PharmacyService,
    private readonly aiService: AiService,
    private readonly emailService: EmailService,
    private readonly callbackService: CallbackService,
  ) {}

  async startChat(phoneNumber: string) {
    // Normalize phone number
    const normalized = this.pharmacyService.normalizePhone(phoneNumber);

    // Check if there's an active conversation
    let conversation = await this.conversationRepo.findOne({
      phoneNumber: normalized,
      status: ConversationStatus.ACTIVE,
    });

    if (conversation) {
      // Return existing conversation
      await this.em.populate(conversation, ['messages']);

      // Fetch lead data if this is a new lead
      const lead = !conversation.isReturningPharmacy
        ? await this.leadRepo.findOne({ phoneNumber: normalized })
        : null;

      return {
        conversationId: conversation.id,
        isNewConversation: false,
        message: 'Continuing previous conversation',
        pharmacy: conversation.pharmacyData || null,
        lead: lead || null,
        state: conversation.state,
      };
    }

    // Look up pharmacy
    const pharmacy = await this.pharmacyService.findByPhone(normalized);

    // Fetch existing lead data if any
    const lead = !pharmacy
      ? await this.leadRepo.findOne({ phoneNumber: normalized })
      : null;

    // Create new conversation
    conversation = new Conversation();
    conversation.phoneNumber = normalized;
    conversation.isReturningPharmacy = !!pharmacy;
    conversation.pharmacyId = pharmacy?.id;
    conversation.pharmacyData = pharmacy;

    // Determine initial state based on pharmacy lookup
    if (pharmacy) {
      conversation.state = ConversationState.PHARMACY_IDENTIFIED;
    } else {
      conversation.state = ConversationState.COLLECTING_LEAD_INFO;
    }

    await this.em.persistAndFlush(conversation);

    // Generate greeting
    const greeting = await this.aiService.generateGreeting(pharmacy, normalized);

    // Save greeting message
    const greetingMessage = new Message();
    greetingMessage.conversation = conversation;
    greetingMessage.role = MessageRole.ASSISTANT;
    greetingMessage.content = greeting;

    await this.em.persistAndFlush(greetingMessage);

    this.logger.log(
      `Started conversation ${conversation.id} for phone ${this.maskPhone(normalized)}`,
    );

    return {
      conversationId: conversation.id,
      isNewConversation: true,
      message: greeting,
      pharmacy: pharmacy || null,
      lead: lead || null,
      state: conversation.state,
    };
  }

  async sendMessage(conversationId: number, userMessage: string) {
    const conversation = await this.conversationRepo.findOne(
      { id: conversationId },
      { populate: ['messages'] },
    );

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    // Save user message
    const userMsg = new Message();
    userMsg.conversation = conversation;
    userMsg.role = MessageRole.USER;
    userMsg.content = userMessage;
    await this.em.persistAndFlush(userMsg);

    // Get pharmacy data
    const pharmacy = conversation.pharmacyData;

    // Generate AI response
    const aiResponse = await this.aiService.generateResponse({
      conversationHistory: conversation.messages.getItems(),
      userMessage,
      pharmacy,
      isNewLead: !conversation.isReturningPharmacy,
    });

    console.log("aiResponse", aiResponse)
    // Process tool calls (function calls)
    let assistantContent = aiResponse.content;
    const functionResults: string[] = [];

    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      for (const toolCall of aiResponse.toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        this.logger.log(`Executing function: ${functionName}`);
        const result = await this.executeFunctionCall(
          functionName,
          functionArgs,
          conversation,
        );
        functionResults.push(result);
      }
    }

    // If there were function calls, append their results to the response
    if (functionResults.length > 0) {
      if (!assistantContent) {
        assistantContent = functionResults.join('\n\n');
      } else {
        assistantContent += '\n\n' + functionResults.join('\n\n');
      }
    }

    // Save assistant message
    const assistantMsg = new Message();
    assistantMsg.conversation = conversation;
    assistantMsg.role = MessageRole.ASSISTANT;
    assistantMsg.content = assistantContent || 'I understand. How else can I help you?';
    assistantMsg.metadata = {
      toolCalls: aiResponse.toolCalls?.map((tc) => ({
        function: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    };

    await this.em.persistAndFlush(assistantMsg);

    // Fetch updated lead data if this is a new lead
    const lead = !conversation.isReturningPharmacy
      ? await this.leadRepo.findOne({ phoneNumber: conversation.phoneNumber })
      : null;

    this.logger.log(`Conversation ${conversationId}: User message processed`);

    return {
      message: assistantMsg.content,
      state: conversation.state,
      pharmacy: conversation.pharmacyData,
      lead: lead || null,
    };
  }

  async scheduleCallback(conversationId: number, preferredTime: string, notes?: string) {
    const conversation = await this.conversationRepo.findOne({ id: conversationId });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    // Schedule callback
    await this.callbackService.scheduleCallback(
      conversation.phoneNumber,
      preferredTime,
      notes,
    );

    // Update conversation state
    conversation.state = this.stateMachine.transition(
      conversation.state,
      ConversationEvent.FOLLOWUP_REQUESTED,
    );
    conversation.status = ConversationStatus.FOLLOWUP_SCHEDULED;

    await this.em.flush();

    return {
      success: true,
      message: `Great! I've scheduled a callback for ${preferredTime}. Someone from our team will reach out to you then.`,
    };
  }

  async sendEmail(conversationId: number, email: string, includePricing = false) {
    const conversation = await this.conversationRepo.findOne({ id: conversationId });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const pharmacy = conversation.pharmacyData;

    // Send email
    await this.emailService.sendFollowupEmail(email, pharmacy, includePricing);

    // Update conversation state
    conversation.state = this.stateMachine.transition(
      conversation.state,
      ConversationEvent.FOLLOWUP_REQUESTED,
    );

    await this.em.flush();

    return {
      success: true,
      message: `Perfect! I've sent detailed information about our solutions to ${email}. You should receive it shortly.`,
    };
  }

  async getConversation(conversationId: number) {
    const conversation = await this.conversationRepo.findOne(
      { id: conversationId },
      { populate: ['messages'] },
    );

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    return {
      id: conversation.id,
      phoneNumber: conversation.phoneNumber,
      status: conversation.status,
      state: conversation.state,
      pharmacy: conversation.pharmacyData,
      messages: conversation.messages.getItems().map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    };
  }

  private async executeFunctionCall(
    functionName: string,
    args: any,
    conversation: Conversation,
  ): Promise<string> {
    switch (functionName) {
      case 'collect_pharmacy_info':
        return await this.handleCollectPharmacyInfo(args, conversation);

      case 'schedule_callback':
        return await this.handleScheduleCallbackFunction(args, conversation);

      case 'send_followup_email':
        return await this.handleSendFollowupEmailFunction(args, conversation);

      case 'highlight_rx_benefits':
        return this.handleHighlightRxBenefits(args);

      default:
        this.logger.warn(`Unknown function: ${functionName}`);
        return '';
    }
  }

  private async handleCollectPharmacyInfo(
    args: CollectPharmacyInfoArgs,
    conversation: Conversation,
  ): Promise<string> {
    // Check if lead already exists
    let lead = await this.leadRepo.findOne({
      phoneNumber: conversation.phoneNumber,
    });

    if (!lead) {
      lead = new PharmacyLead();
      lead.phoneNumber = conversation.phoneNumber;
    }

    // Update lead information
    if (args.pharmacy_name) lead.pharmacyName = args.pharmacy_name;
    if (args.contact_person) lead.contactPerson = args.contact_person;
    if (args.email) lead.email = args.email;
    if (args.estimated_rx_volume) lead.estimatedRxVolume = args.estimated_rx_volume;
    if (args.address) lead.address = args.address;
    if (args.city) lead.city = args.city;
    if (args.state) lead.state = args.state;

    await this.em.persistAndFlush(lead);

    // Check if we have enough info to transition state
    if (lead.pharmacyName && lead.contactPerson && lead.estimatedRxVolume) {
      conversation.state = this.stateMachine.transition(
        conversation.state,
        ConversationEvent.INFO_COLLECTED,
      );
      await this.em.flush();

      this.logger.log(`Lead information collected for ${lead.pharmacyName}`);
      return ''; // Let the AI continue the conversation naturally
    }

    return '';
  }

  private async handleScheduleCallbackFunction(
    args: ScheduleCallbackArgs,
    conversation: Conversation,
  ): Promise<string> {
    await this.callbackService.scheduleCallback(
      conversation.phoneNumber,
      args.preferred_time,
      args.notes,
    );

    conversation.state = this.stateMachine.transition(
      conversation.state,
      ConversationEvent.FOLLOWUP_REQUESTED,
    );
    conversation.status = ConversationStatus.FOLLOWUP_SCHEDULED;
    await this.em.flush();

    return `I've scheduled a callback for ${args.preferred_time}. Our team will reach out to you then.`;
  }

  private async handleSendFollowupEmailFunction(
    args: SendFollowupEmailArgs,
    conversation: Conversation,
  ): Promise<string> {
    await this.emailService.sendFollowupEmail(
      args.email,
      conversation.pharmacyData,
      args.include_pricing || false,
    );

    return `I've sent detailed information to ${args.email}. Check your inbox shortly!`;
  }

  private handleHighlightRxBenefits(args: HighlightRxBenefitsArgs): string {
    const tier = args.volume_tier;

    return this.pharmacyService.getVolumeMessage(tier as any);
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) return '***';
    return `***-${phone.slice(-4)}`;
  }
}
