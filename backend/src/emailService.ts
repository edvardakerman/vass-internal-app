import { Client } from '@microsoft/microsoft-graph-client';

interface EmailOptions {
  accessToken: string;
  subject: string;
  htmlContent: string;
}

async function sendEmailToSelf(options: EmailOptions): Promise<void> {
  try {
    const client = Client.init({
      authProvider: (done) => {
        done(null, options.accessToken);
      },
    });
    
    const message = {
      message: {
        subject: options.subject,
        body: {
          contentType: 'HTML',
          content: options.htmlContent,
        },
        toRecipients: [
          {
            emailAddress: {
              address: 'me', // Sends to the authenticated user
            },
          },
        ],
      },
    };

    await client.api('/me/sendMail').post(message);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - we don't want email failures to break the main flow
  }
}

function formatEventDate(dateTime: string): string {
  const date = new Date(dateTime);
  return date.toLocaleString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function sendSignUpConfirmation(
  accessToken: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string
): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0078d4 0%, #005a9e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0078d4; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #0078d4; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .success-badge { background: #4caf50; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Registration Confirmed</h1>
        </div>
        <div class="content">
          <div class="success-badge">You're registered!</div>
          <p>Great news! You have successfully registered for the following event:</p>
          
          <div class="event-details">
            <div class="detail-row">
              <span class="label">Event:</span> ${eventTitle}
            </div>
            <div class="detail-row">
              <span class="label">Date:</span> ${formatEventDate(eventDate)}
            </div>
            <div class="detail-row">
              <span class="label">Location:</span> ${eventLocation}
            </div>
          </div>
          
          <p>We look forward to seeing you there!</p>
          <p>If you need to cancel your registration, you can do so through the event page.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Internal Activities System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToSelf({
    accessToken,
    subject: `Registration Confirmed: ${eventTitle}`,
    htmlContent,
  });
}

export async function sendWaitlistConfirmation(
  accessToken: string,
  eventTitle: string,
  eventDate: string,
  waitlistPosition: number
): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #ff9800; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .waitlist-badge { background: #ffc107; color: #333; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; font-weight: bold; }
        .position { font-size: 24px; color: #ff9800; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏳ Added to Waitlist</h1>
        </div>
        <div class="content">
          <div class="waitlist-badge">You're on the waitlist</div>
          <p>The event is currently full, but you've been added to the waitlist.</p>
          
          <div class="event-details">
            <div class="detail-row">
              <span class="label">Event:</span> ${eventTitle}
            </div>
            <div class="detail-row">
              <span class="label">Date:</span> ${formatEventDate(eventDate)}
            </div>
            <div class="detail-row">
              <span class="label">Your Position:</span> <span class="position">#${waitlistPosition}</span>
            </div>
          </div>
          
          <p><strong>What happens next?</strong></p>
          <p>If a spot becomes available, you'll be automatically registered and notified via email. We'll process waitlist positions in order.</p>
          <p>You can remove yourself from the waitlist at any time through the event page.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Internal Activities System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToSelf({
    accessToken,
    subject: `Waitlist Confirmation: ${eventTitle}`,
    htmlContent,
  });
}

export async function sendDropOutConfirmation(
  accessToken: string,
  eventTitle: string
): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #757575 0%, #424242 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #757575; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Registration Cancelled</h1>
        </div>
        <div class="content">
          <p>Your registration has been cancelled for:</p>
          
          <div class="event-details">
            <strong>${eventTitle}</strong>
          </div>
          
          <p>You can sign up again at any time if you change your mind.</p>
          <p>We hope to see you at future events!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Internal Activities System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToSelf({
    accessToken,
    subject: `Registration Cancelled: ${eventTitle}`,
    htmlContent,
  });
}

export async function sendPromotionNotification(
  accessToken: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string
): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4caf50; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #4caf50; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .success-badge { background: #4caf50; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; font-weight: bold; }
        .highlight { background: #fffde7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You Got a Spot!</h1>
        </div>
        <div class="content">
          <div class="success-badge">Promoted from Waitlist</div>
          
          <div class="highlight">
            <strong>Great news!</strong> A spot has opened up and you've been automatically registered for the event.
          </div>
          
          <div class="event-details">
            <div class="detail-row">
              <span class="label">Event:</span> ${eventTitle}
            </div>
            <div class="detail-row">
              <span class="label">Date:</span> ${formatEventDate(eventDate)}
            </div>
            <div class="detail-row">
              <span class="label">Location:</span> ${eventLocation}
            </div>
          </div>
          
          <p>You're now confirmed as an attendee. We look forward to seeing you there!</p>
          <p>If you can no longer attend, please cancel your registration so someone else from the waitlist can take your spot.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Internal Activities System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmailToSelf({
    accessToken,
    subject: `🎉 You Got a Spot: ${eventTitle}`,
    htmlContent,
  });
}
