export interface SharePointEvent {
  '@odata.etag'?: string;
  id: string;
  webUrl: string;
  fields: {
    Title: string;
    Location: string;
    EventDate: string;
    EndDate: string;
    Description: string;
    Category: string;
    BannerUrl?: {
      Url: string;
    };
    MaxSeats?: number; // Optional for now, can be unlimited
  };
}

export interface SharePointEventResponse {
  value: SharePointEvent[];
}

export interface EventRegistration {
  eventId: string;
  userId: string;
  userEmail: string;
  eventTitle: string;
  action: 'signup' | 'dropout';
  timestamp: string;
}

export interface EventAttendee {
  userId: string;
  userEmail: string;
  userName?: string;
  signupDate: string;
  status: 'signup' | 'waitlist';
}
