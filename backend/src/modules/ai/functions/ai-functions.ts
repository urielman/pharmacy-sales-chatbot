export const AI_FUNCTIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'collect_pharmacy_info',
      description: 'Collect information from new pharmacy lead during the conversation',
      parameters: {
        type: 'object',
        properties: {
          pharmacy_name: {
            type: 'string',
            description: 'The name of the pharmacy',
          },
          contact_person: {
            type: 'string',
            description: 'Name of the person we are speaking with',
          },
          email: {
            type: 'string',
            description: 'Email address for follow-up',
          },
          estimated_rx_volume: {
            type: 'number',
            description: 'Estimated monthly prescription volume',
          },
          address: {
            type: 'string',
            description: 'Pharmacy physical address',
          },
          city: {
            type: 'string',
            description: 'City where pharmacy is located',
          },
          state: {
            type: 'string',
            description: 'State where pharmacy is located',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'schedule_callback',
      description: 'Schedule a callback for the pharmacy at their preferred time',
      parameters: {
        type: 'object',
        properties: {
          preferred_time: {
            type: 'string',
            description: 'When they would like to be called back (e.g., "tomorrow afternoon", "Friday at 2pm")',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the callback request',
          },
        },
        required: ['preferred_time'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_followup_email',
      description: 'Send a follow-up email with information about Pharmesol services',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Email address to send information to',
          },
          include_pricing: {
            type: 'boolean',
            description: 'Whether to include pricing information in the email',
          },
        },
        required: ['email'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'highlight_rx_benefits',
      description: 'Explain Pharmesol benefits based on the pharmacy\'s Rx volume tier',
      parameters: {
        type: 'object',
        properties: {
          volume_tier: {
            type: 'string',
            enum: ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
            description: 'The pharmacy\'s prescription volume tier',
          },
        },
        required: ['volume_tier'],
      },
    },
  },
];

export interface CollectPharmacyInfoArgs {
  pharmacy_name?: string;
  contact_person?: string;
  email?: string;
  estimated_rx_volume?: number;
  address?: string;
  city?: string;
  state?: string;
}

export interface ScheduleCallbackArgs {
  preferred_time: string;
  notes?: string;
}

export interface SendFollowupEmailArgs {
  email: string;
  include_pricing?: boolean;
}

export interface HighlightRxBenefitsArgs {
  volume_tier: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
}
