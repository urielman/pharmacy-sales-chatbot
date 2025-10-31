import { ConversationState } from '../../../database/entities/conversation.entity';
import { Logger } from '@nestjs/common';

export enum ConversationEvent {
  PHARMACY_FOUND = 'PHARMACY_FOUND',
  PHARMACY_NOT_FOUND = 'PHARMACY_NOT_FOUND',
  INFO_COLLECTED = 'INFO_COLLECTED',
  DISCUSSING = 'DISCUSSING',
  FOLLOWUP_REQUESTED = 'FOLLOWUP_REQUESTED',
  CONVERSATION_ENDED = 'CONVERSATION_ENDED',
}

interface StateTransition {
  from: ConversationState;
  event: ConversationEvent;
  to: ConversationState;
}

export class ConversationStateMachine {
  private readonly logger = new Logger(ConversationStateMachine.name);

  private readonly transitions: StateTransition[] = [
    // Initial greeting transitions
    {
      from: ConversationState.INITIAL_GREETING,
      event: ConversationEvent.PHARMACY_FOUND,
      to: ConversationState.PHARMACY_IDENTIFIED,
    },
    {
      from: ConversationState.INITIAL_GREETING,
      event: ConversationEvent.PHARMACY_NOT_FOUND,
      to: ConversationState.COLLECTING_LEAD_INFO,
    },

    // Pharmacy identified transitions
    {
      from: ConversationState.PHARMACY_IDENTIFIED,
      event: ConversationEvent.DISCUSSING,
      to: ConversationState.DISCUSSING_SERVICES,
    },
    {
      from: ConversationState.PHARMACY_IDENTIFIED,
      event: ConversationEvent.FOLLOWUP_REQUESTED,
      to: ConversationState.SCHEDULING_FOLLOWUP,
    },
    {
      from: ConversationState.PHARMACY_IDENTIFIED,
      event: ConversationEvent.CONVERSATION_ENDED,
      to: ConversationState.COMPLETED,
    },

    // Collecting lead info transitions
    {
      from: ConversationState.COLLECTING_LEAD_INFO,
      event: ConversationEvent.INFO_COLLECTED,
      to: ConversationState.DISCUSSING_SERVICES,
    },
    {
      from: ConversationState.COLLECTING_LEAD_INFO,
      event: ConversationEvent.FOLLOWUP_REQUESTED,
      to: ConversationState.SCHEDULING_FOLLOWUP,
    },

    // Discussing services transitions
    {
      from: ConversationState.DISCUSSING_SERVICES,
      event: ConversationEvent.FOLLOWUP_REQUESTED,
      to: ConversationState.SCHEDULING_FOLLOWUP,
    },
    {
      from: ConversationState.DISCUSSING_SERVICES,
      event: ConversationEvent.CONVERSATION_ENDED,
      to: ConversationState.COMPLETED,
    },

    // Scheduling followup transitions
    {
      from: ConversationState.SCHEDULING_FOLLOWUP,
      event: ConversationEvent.CONVERSATION_ENDED,
      to: ConversationState.COMPLETED,
    },
    {
      from: ConversationState.SCHEDULING_FOLLOWUP,
      event: ConversationEvent.DISCUSSING,
      to: ConversationState.DISCUSSING_SERVICES,
    },
  ];

  transition(
    currentState: ConversationState,
    event: ConversationEvent,
  ): ConversationState {
    const transition = this.transitions.find(
      (t) => t.from === currentState && t.event === event,
    );

    if (transition) {
      this.logger.log(
        `State transition: ${currentState} -> ${transition.to} (event: ${event})`,
      );
      return transition.to;
    }

    // If no valid transition, stay in current state
    this.logger.warn(
      `No valid transition from ${currentState} with event ${event}. Staying in current state.`,
    );
    return currentState;
  }

  canTransition(currentState: ConversationState, event: ConversationEvent): boolean {
    return this.transitions.some(
      (t) => t.from === currentState && t.event === event,
    );
  }

  getAvailableEvents(currentState: ConversationState): ConversationEvent[] {
    return this.transitions
      .filter((t) => t.from === currentState)
      .map((t) => t.event);
  }
}
