import type { SharePointEvent, EventAttendee } from './types';
import { API_BASE_URL, USE_MOCK_DATA } from './authConfig';
import mockData from './mockEvents.json';

export const getEvents = async (accessToken?: string): Promise<SharePointEvent[]> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockData.value as SharePointEvent[];
  }

  const response = await fetch(`${API_BASE_URL}/events`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  const data = await response.json();
  return data.value || data;
};

export const signUpForEvent = async (
  eventId: string,
  userId: string,
  userEmail: string,
  eventTitle: string,
  accessToken: string
): Promise<{ message: string; status?: 'signup' | 'waitlist' }> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Mock signup:', { eventId, userId, userEmail, eventTitle });
    return { message: 'Successfully signed up', status: 'signup' };
  }

  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ eventId, userId, userEmail, eventTitle }),
  });

  if (!response.ok) {
    throw new Error('Failed to sign up for event');
  }

  return response.json();
};

export const dropOutFromEvent = async (
  eventId: string,
  userId: string,
  accessToken: string
): Promise<{ message: string; promoted?: { userId: string; userEmail: string } | null }> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Mock dropout:', { eventId, userId });
    return { message: 'Successfully dropped out', promoted: null };
  }

  const response = await fetch(`${API_BASE_URL}/dropout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ eventId, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to drop out from event');
  }

  return response.json();
};

export const getUserRegistrations = async (
  userId: string,
  accessToken: string
): Promise<string[]> => {
  if (USE_MOCK_DATA) {
    // Return mock registered event IDs from localStorage
    const stored = localStorage.getItem(`registrations_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }

  const response = await fetch(`${API_BASE_URL}/registrations/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user registrations');
  }

  const registrations = await response.json();
  return registrations.map((r: any) => r.eventId);
};

export const getEventAttendees = async (
  eventId: string,
  accessToken: string
): Promise<{ attendees: EventAttendee[]; waitlist: EventAttendee[] }> => {
  if (USE_MOCK_DATA) {
    // Return mock attendees and waitlist from localStorage
    const attendeesStored = localStorage.getItem(`event_attendees_${eventId}`);
    const waitlistStored = localStorage.getItem(`event_waitlist_${eventId}`);
    return {
      attendees: attendeesStored ? JSON.parse(attendeesStored) : [],
      waitlist: waitlistStored ? JSON.parse(waitlistStored) : [],
    };
  }

  const response = await fetch(`${API_BASE_URL}/attendees/${eventId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch event attendees');
  }

  return response.json();
};
