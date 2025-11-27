import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { mockEvents } from '../mockData';

export async function getEvents(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a request for getEvents');

  try {
    // TODO: Replace with real Graph API call when available
    // const accessToken = request.headers.get('authorization')?.replace('Bearer ', '');
    // const events = await fetchEventsFromGraph(accessToken);

    return {
      status: 200,
      jsonBody: mockEvents,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    context.error('Error fetching events:', error);
    return {
      status: 500,
      jsonBody: { error: 'Failed to fetch events' },
    };
  }
}

app.http('getEvents', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'events',
  handler: getEvents,
});
