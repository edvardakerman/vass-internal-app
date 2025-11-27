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
  action: 'signup' | 'dropout';
  timestamp: string;
}

export interface SignUpRequest {
  eventId: string;
  userId: string;
  userEmail: string;
  eventTitle: string;
}

export interface DropOutRequest {
  eventId: string;
  userId: string;
}
