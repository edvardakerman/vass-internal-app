import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { addRegistration } from '../tableStorage';
import type { DropOutRequest } from '../types';

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

    // Add a dropout record (we keep the event history)
    await addRegistration(eventId, userId, '', '', 'dropout');

    return {
      status: 200,
      jsonBody: { message: 'Successfully dropped out from event' },
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
