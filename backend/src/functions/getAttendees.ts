import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getEventAttendeesWithWaitlist } from '../tableStorage';

export async function getAttendees(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a request for getAttendees');

  try {
    const eventId = request.params.eventId;

    if (!eventId) {
      return {
        status: 400,
        jsonBody: { error: 'Missing eventId parameter' },
      };
    }

    const { attendees, waitlist } = await getEventAttendeesWithWaitlist(eventId);

    // Map attendees to attendee format
    const attendeeList = attendees.map(reg => ({
      userId: reg.userId,
      userEmail: reg.userEmail,
      userName: reg.userEmail.split('@')[0],
      signupDate: reg.timestamp,
      status: 'signup' as const,
    }));

    // Map waitlist
    const waitlistList = waitlist.map(reg => ({
      userId: reg.userId,
      userEmail: reg.userEmail,
      userName: reg.userEmail.split('@')[0],
      signupDate: reg.timestamp,
      status: 'waitlist' as const,
    }));

    return {
      status: 200,
      jsonBody: {
        attendees: attendeeList,
        waitlist: waitlistList,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching attendees:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch attendees' },
    };
  }
}

app.http('getAttendees', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'attendees/{eventId}',
  handler: getAttendees,
});
