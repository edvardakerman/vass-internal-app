import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { addRegistration, getEventAttendeesWithWaitlist } from '../tableStorage';
import type { SignUpRequest } from '../types';
import { mockEvents } from '../mockData';
import { sendSignUpConfirmation, sendWaitlistConfirmation } from '../emailService';

export async function signUp(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a request for signUp');

  try {
    const body = await request.json() as SignUpRequest;
    const { eventId, userId, userEmail, eventTitle } = body;

    if (!eventId || !userId || !userEmail || !eventTitle) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields' },
      };
    }

    // Find event to check capacity
    const event = mockEvents.value.find(e => e.id === eventId);
    const maxSeats = event?.fields?.MaxSeats;

    let action: 'signup' | 'waitlist' = 'signup';
    let message = 'Successfully signed up for event';

    // Check if event is full
    if (maxSeats) {
      const { attendees, waitlist } = await getEventAttendeesWithWaitlist(eventId);
      if (attendees.length >= maxSeats) {
        action = 'waitlist';
        message = 'Event is full. Added to waitlist';
        
        // Send waitlist confirmation email
        if (event) {
          await sendWaitlistConfirmation(
            userEmail,
            event.fields.Title,
            event.fields.EventDate,
            waitlist.length + 1 // Position in waitlist
          );
        }
      } else {
        // Send signup confirmation email
        if (event) {
          await sendSignUpConfirmation(
            userEmail,
            event.fields.Title,
            event.fields.EventDate,
            event.fields.Location
          );
        }
      }
    }

    await addRegistration(eventId, userId, userEmail, eventTitle, action);

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
