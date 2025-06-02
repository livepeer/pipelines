# Discord Notifications for Clip Approvals

This document explains how to set up Discord notifications for clip approvals in the admin interface.

## Overview

The system sends a notification to a Discord channel whenever an admin approves a clip. This helps the team stay informed about new content being added to the explore page.

## Setup Instructions

### 1. Create a Discord Webhook

1. Open your Discord server
2. Go to Server Settings > Integrations > Webhooks
3. Click "New Webhook"
4. Name it (e.g., "Clip Approvals")
5. Select the channel where notifications should be posted
6. Click "Copy Webhook URL"

### 2. Configure Environment Variables

Add the following environment variable to your deployment:

```
DISCORD_CLIP_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-webhook-token
```

Replace the URL with the webhook URL you copied in step 1.

### 3. Deploy Changes

Deploy the application with the updated environment variable. After deployment, the system will automatically send notifications to Discord when clips are approved.

## Notification Content

Each notification includes:
- Clip title
- Clip ID
- Author name
- Thumbnail (if available)
- Link to the video

## Troubleshooting

If notifications aren't being sent:

1. Check that the `DISCORD_CLIP_WEBHOOK_URL` environment variable is correctly set
2. Look for error messages in your application logs
3. Verify the webhook is still active in your Discord server settings 
