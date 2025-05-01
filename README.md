# Twitch Stream Discord Notifier

This Node.js application monitors multiple Twitch streams and sends Discord webhook notifications when any of them go live.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
# Discord webhook URL (from Discord channel settings)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url

# Twitch API credentials
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
# Comma-separated list of Twitch usernames to monitor
TWITCH_USERNAMES=username1,username2,username3
```

### Getting Discord Webhook URL

1. In Discord, go to your server settings
2. Select "Integrations"
3. Click "Create Webhook"
4. Give it a name and select the channel
5. Copy the Webhook URL and paste it in your `.env` file

### Getting Twitch Credentials

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console)
2. Log in with your Twitch account
3. Click "Register Your Application"
4. Fill in the application details:
   - Name: Your app name
   - OAuth Redirect URLs: http://localhost
   - Category: Choose "Chat Bot" or "Other"
5. Click "Create"
6. Click "Manage" on your application
7. Click "New Secret" to generate your client secret
8. Copy the Client ID and Client Secret to your `.env` file

## Usage

Run the application:

```bash
node index.js
```

The application will:

- Monitor multiple Twitch streams simultaneously
- Check stream status every 60 seconds
- Send a Discord notification when any monitored stream goes live
- Include stream title, game, viewer count, and thumbnail in the notification

## Features

- Multiple stream monitoring
- Automatic stream status monitoring
- Rich Discord embed notifications
- Error handling and logging
- Twitch API authentication
