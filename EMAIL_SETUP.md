# Email Notifications Setup Guide

This guide walks you through setting up Microsoft Graph API for sending email notifications from the Internal Activities app.

## Overview

Email notifications are sent for:
- ✅ **Sign Up Confirmation** - When a user registers for an event
- ⏳ **Waitlist Confirmation** - When a user joins the waitlist (event is full)
- ❌ **Dropout Confirmation** - When a user cancels their registration
- 🎉 **Promotion Notification** - When a waitlist user gets a spot

## Prerequisites

- Azure AD admin access (to create App Registration and grant permissions)
- A shared mailbox or service account email address for sending (e.g., `noreply@vass.se`)

## Step 1: Create Azure AD App Registration

1. Go to **Azure Portal** → **Azure Active Directory** → **App registrations**
2. Click **+ New registration**
3. Fill in the details:
   - **Name**: `Internal Activities Email Service`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank (not needed for server-to-server)
4. Click **Register**
5. **Copy the following values** (you'll need them later):
   - **Application (client) ID**
   - **Directory (tenant) ID**

## Step 2: Create Client Secret

1. In your new App Registration, go to **Certificates & secrets**
2. Click **+ New client secret**
3. Add description: `Email service secret`
4. Set expiration (recommend 24 months)
5. Click **Add**
6. **⚠️ IMPORTANT:** Copy the **Value** immediately (it won't be shown again)

## Step 3: Grant API Permissions

1. Go to **API permissions** in your App Registration
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (not Delegated)
5. Search for and select:
   - `Mail.Send` - Send mail as any user
6. Click **Add permissions**
7. **⚠️ CRITICAL:** Click **Grant admin consent for [Your Org]** button
8. Confirm by clicking **Yes**

You should see a green checkmark ✓ next to the permission indicating admin consent is granted.

## Step 4: Configure Sender Email

You have two options:

### Option A: Use a Shared Mailbox (Recommended)
1. Create a shared mailbox in Exchange Admin Center
2. Name it something like: `Internal Activities Notifications`
3. Email: `noreply@vass.se` or `activities@vass.se`
4. No license required for shared mailboxes

### Option B: Use a Service Account
1. Create a regular user account
2. Assign it a license (required for sending email)
3. Set a strong password

## Step 5: Update Local Environment Variables

Update your `backend/.env.local` file:

```env
# Storage (already configured)
AZURE_STORAGE_CONNECTION_STRING=...
TABLE_NAME=EventRegistrations

# Microsoft Graph Email Configuration
GRAPH_TENANT_ID=c588e981-bfd9-4519-b213-f1b62219f28a
GRAPH_CLIENT_ID=<your-app-client-id-from-step-1>
GRAPH_CLIENT_SECRET=<your-client-secret-from-step-2>
SENDER_EMAIL=noreply@vass.se
```

## Step 6: Update Azure Function App Settings

Add the same environment variables to your Azure Function App:

1. Go to **Azure Portal** → **Function App** → `vass-internal-func`
2. Go to **Configuration** under Settings
3. Click **+ New application setting** for each:

| Name | Value |
|------|-------|
| `GRAPH_TENANT_ID` | `c588e981-bfd9-4519-b213-f1b62219f28a` |
| `GRAPH_CLIENT_ID` | Your App Registration Client ID |
| `GRAPH_CLIENT_SECRET` | Your Client Secret |
| `SENDER_EMAIL` | `noreply@vass.se` |

4. Click **Save** (top left)
5. Click **Continue** to restart the function app

## Step 7: Test Locally

1. Make sure your `.env.local` is configured
2. Start the backend locally:
   ```bash
   cd backend
   npm start
   ```
3. Use the frontend to sign up for an event
4. Check your email inbox for the confirmation

## Step 8: Deploy to Azure

```bash
cd backend
npm run build
func azure functionapp publish vass-internal-func
```

## Troubleshooting

### Emails not sending?

1. **Check Function App logs**:
   - Go to Azure Portal → Function App → Log stream
   - Look for email-related errors

2. **Verify permissions**:
   - App Registration → API permissions
   - Ensure `Mail.Send` has a green checkmark (admin consent granted)

3. **Test Graph API permissions**:
   - Use Graph Explorer (https://developer.microsoft.com/graph/graph-explorer)
   - Sign in with app-only auth
   - Try: `POST /users/{sender}/sendMail`

4. **Check sender mailbox**:
   - Ensure the sender email address exists
   - For shared mailboxes, no license needed
   - For user accounts, ensure they have a license

### Error: "Insufficient privileges"

- Admin consent was not granted
- Go to App Registration → API permissions
- Click "Grant admin consent"

### Error: "Mailbox not found"

- The `SENDER_EMAIL` doesn't exist
- Create the mailbox or use an existing one
- Update the environment variable

## Email Templates

Email templates are in `backend/src/emailService.ts`. You can customize:
- HTML styling
- Email content
- Subject lines
- Company branding

## Security Notes

- ✅ Client secret is stored securely in Azure Key Vault (via Function App settings)
- ✅ Uses application permissions (no user context needed)
- ✅ Emails are sent server-side only
- ✅ No email credentials exposed to frontend
- ✅ Audit trail in Exchange Online sent items

## Next Steps

- Customize email templates with your branding
- Add calendar invites (.ics files) to emails
- Set up monitoring/alerts for email failures
- Consider using Azure Key Vault for secrets
