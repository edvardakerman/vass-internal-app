export interface CalendarEvent {
  id: string;
  subject: string;
  bodyPreview: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location: {
    displayName: string;
  };
  organizer: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
}

export interface EventRegistrationEntity {
  partitionKey: string; // eventId
  rowKey: string; // userId_timestamp
  userId: string;
  userEmail: string;
  eventId: string;
  eventTitle: string;
  action: 'signup' | 'dropout' | 'waitlist';
  timestamp: string;
  priority?: number; // Priority within category (1-n)
}

export interface UserPriorityEntity {
  partitionKey: string; // userId
  rowKey: string; // `${category}_${eventId}`
  userId: string;
  category: string; // 'Health' or 'Social'
  eventId: string;
  eventTitle: string;
  priority: number; // Priority within category
  timestamp: string;
}

export interface SignUpRequest {
  eventId: string;
  userId: string;
  userEmail: string;
  eventTitle: string;
}

export interface SignUpRequestWithPriority extends SignUpRequest {
  priority?: number;
}

export interface DropOutRequest {
  eventId: string;
  userId: string;
}
