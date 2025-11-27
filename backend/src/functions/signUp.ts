import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { addRegistration } from '../tableStorage';
import type { SignUpRequest } from '../types';

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

    await addRegistration(eventId, userId, userEmail, eventTitle, 'signup');

    return {
      status: 200,
      jsonBody: { message: 'Successfully signed up for event' },
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
