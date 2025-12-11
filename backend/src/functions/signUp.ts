import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { addRegistration, getEventAttendeesWithWaitlist, getUserRegistrations } from '../tableStorage';
import type { SignUpRequestWithPriority } from '../types';
import { mockEvents } from '../mockData';

export async function signUp(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a request for signUp');

  try {
    const body = await request.json() as SignUpRequestWithPriority;
    const { eventId, userId, userEmail, eventTitle, priority } = body;

    if (!eventId || !userId || !userEmail || !eventTitle) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields' },
      };
    }

    // Find event to check capacity
    const event = mockEvents.value.find(e => e.id === eventId);
    const maxSeats = event?.fields?.MaxSeats;
    const categoryRaw = event?.fields?.Category || '';
    const category = categoryRaw.toLowerCase().includes('health') ? 'health' : 'social';

    // Enforce unique priority per category for this user
    if (priority !== undefined && priority !== null) {
      const userRegs = await getUserRegistrations(userId);
      for (const r of userRegs) {
        // find event for r.eventId in mock events to determine category
        const ev = mockEvents.value.find(e => e.id === r.eventId);
        const evCategory = ev?.fields?.Category || '';
        const evCatKey = evCategory.toLowerCase().includes('health') ? 'health' : 'social';
        if (evCatKey === category && r.priority === priority && (r.action === 'signup' || r.action === 'waitlist')) {
          return {
            status: 400,
            jsonBody: { error: `You already have priority ${priority} for another ${category} event` },
          };
        }
      }
    }

    let action: 'signup' | 'waitlist' = 'signup';
    let message = 'Successfully signed up for event';

    // Check if event is full
    if (maxSeats) {
      const { attendees, waitlist } = await getEventAttendeesWithWaitlist(eventId);
      if (attendees.length >= maxSeats) {
        action = 'waitlist';
        message = 'Event is full. Added to waitlist';
      }
    }

    await addRegistration(eventId, userId, userEmail, eventTitle, action, priority);

    return {
      status: 200,
      jsonBody: { message, status: action },
    };
  } catch (error) {
    context.error('Error signing up for event:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to sign up for event' },
    };
  }
}

app.http('signUp', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'signup',
  handler: signUp,
});
