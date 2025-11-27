import type { SharePointEvent } from './types';
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
): Promise<void> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Mock signup:', { eventId, userId, userEmail, eventTitle });
    return;
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
};

export const dropOutFromEvent = async (
  eventId: string,
  userId: string,
  accessToken: string
): Promise<void> => {
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('Mock dropout:', { eventId, userId });
    return;
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
