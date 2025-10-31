import { ConversationStateMachine, ConversationEvent } from '../src/modules/chatbot/state-machine/conversation-state-machine';
import { ConversationState } from '../src/database/entities/conversation.entity';

describe('ConversationStateMachine', () => {
  let stateMachine: ConversationStateMachine;

  beforeEach(() => {
    stateMachine = new ConversationStateMachine();
  });

  describe('transition', () => {
    it('should transition from INITIAL_GREETING to PHARMACY_IDENTIFIED when pharmacy found', () => {
      const newState = stateMachine.transition(
        ConversationState.INITIAL_GREETING,
        ConversationEvent.PHARMACY_FOUND,
      );
      expect(newState).toBe(ConversationState.PHARMACY_IDENTIFIED);
    });

    it('should transition from INITIAL_GREETING to COLLECTING_LEAD_INFO when pharmacy not found', () => {
      const newState = stateMachine.transition(
        ConversationState.INITIAL_GREETING,
        ConversationEvent.PHARMACY_NOT_FOUND,
      );
      expect(newState).toBe(ConversationState.COLLECTING_LEAD_INFO);
    });

    it('should transition from COLLECTING_LEAD_INFO to DISCUSSING_SERVICES when info collected', () => {
      const newState = stateMachine.transition(
        ConversationState.COLLECTING_LEAD_INFO,
        ConversationEvent.INFO_COLLECTED,
      );
      expect(newState).toBe(ConversationState.DISCUSSING_SERVICES);
    });

    it('should transition from DISCUSSING_SERVICES to SCHEDULING_FOLLOWUP when followup requested', () => {
      const newState = stateMachine.transition(
        ConversationState.DISCUSSING_SERVICES,
        ConversationEvent.FOLLOWUP_REQUESTED,
      );
      expect(newState).toBe(ConversationState.SCHEDULING_FOLLOWUP);
    });

    it('should transition from SCHEDULING_FOLLOWUP to COMPLETED when conversation ended', () => {
      const newState = stateMachine.transition(
        ConversationState.SCHEDULING_FOLLOWUP,
        ConversationEvent.CONVERSATION_ENDED,
      );
      expect(newState).toBe(ConversationState.COMPLETED);
    });

    it('should stay in current state when invalid transition attempted', () => {
      const newState = stateMachine.transition(
        ConversationState.COMPLETED,
        ConversationEvent.PHARMACY_FOUND, // Invalid transition
      );
      expect(newState).toBe(ConversationState.COMPLETED);
    });
  });

  describe('canTransition', () => {
    it('should return true for valid transitions', () => {
      expect(
        stateMachine.canTransition(
          ConversationState.INITIAL_GREETING,
          ConversationEvent.PHARMACY_FOUND,
        ),
      ).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(
        stateMachine.canTransition(
          ConversationState.COMPLETED,
          ConversationEvent.PHARMACY_FOUND,
        ),
      ).toBe(false);
    });
  });

  describe('getAvailableEvents', () => {
    it('should return all available events for a given state', () => {
      const events = stateMachine.getAvailableEvents(ConversationState.INITIAL_GREETING);
      expect(events).toContain(ConversationEvent.PHARMACY_FOUND);
      expect(events).toContain(ConversationEvent.PHARMACY_NOT_FOUND);
      expect(events.length).toBe(2);
    });

    it('should return empty array for COMPLETED state', () => {
      const events = stateMachine.getAvailableEvents(ConversationState.COMPLETED);
      expect(events.length).toBe(0);
    });
  });
});
