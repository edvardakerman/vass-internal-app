import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { addRegistration, promoteFromWaitlist, getEventAttendeesWithWaitlist } from '../tableStorage';
import type { DropOutRequest } from '../types';
import { mockEvents } from '../mockData';

export async function dropOut(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a request for dropOut');

  try {
    const body = await request.json() as DropOutRequest;
    const { eventId, userId } = body;

    if (!eventId || !userId) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields' },
      };
    }

    // Check user's current status
    const { attendees, waitlist } = await getEventAttendeesWithWaitlist(eventId);
    const userRegistration = [...attendees, ...waitlist].find(r => r.userId === userId);
    
    if (!userRegistration) {
      return {
        status: 404,
        jsonBody: { error: 'No registration found for this user' },
      };
    }

    const wasAttendee = userRegistration.action === 'signup';

    // Add a dropout record
    await addRegistration(eventId, userId, '', '', 'dropout');

    let promotedUser = null;

    // If user was an attendee (not waitlist), try to promote someone from waitlist
    if (wasAttendee) {
      const event = mockEvents.value.find(e => e.id === eventId);
      const eventTitle = event?.fields?.Title || '';
      promotedUser = await promoteFromWaitlist(eventId, eventTitle);
    }

    return {
      status: 200,
      jsonBody: { 
        message: 'Successfully dropped out from event',
        promoted: promotedUser ? {
          userId: promotedUser.userId,
          userEmail: promotedUser.userEmail
        } : null
      },
    };
  } catch (error) {
    context.error('Error dropping out from event:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to drop out from event' },
    };
  }
}

app.http('dropOut', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'dropout',
  handler: dropOut,
});
