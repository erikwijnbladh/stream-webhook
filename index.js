require("dotenv").config();
const axios = require("axios");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Discord webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Twitch API configuration
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
// Array of Twitch usernames to monitor
const TWITCH_USERNAMES = process.env.TWITCH_USERNAMES.split(",").map(
  (username) => username.trim()
);

let accessToken = null;
// Track live status for each stream
let streamStatus = {};

// Function to get Twitch access token
async function getTwitchAccessToken() {
  try {
    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
    );
    accessToken = response.data.access_token;
  } catch (error) {
    console.error("Error getting Twitch access token:", error.message);
  }
}

// Function to check if streams are live
async function checkStreamStatus() {
  try {
    // Get all streams at once using a single API call
    const response = await axios.get(
      `https://api.twitch.tv/helix/streams?${TWITCH_USERNAMES.map(
        (username) => `user_login=${username}`
      ).join("&")}`,
      {
        headers: {
          "Client-ID": TWITCH_CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const liveStreams = response.data.data;

    // Check each username we're monitoring
    for (const username of TWITCH_USERNAMES) {
      const streamData = liveStreams.find(
        (stream) => stream.user_login.toLowerCase() === username.toLowerCase()
      );
      const currentlyLive = !!streamData;

      // If stream status changed from offline to online
      if (currentlyLive && !streamStatus[username]) {
        await sendDiscordNotification(streamData);
      }

      streamStatus[username] = currentlyLive;
    }
  } catch (error) {
    console.error("Error checking stream status:", error.message);
  }
}

// Function to send Discord notification
async function sendDiscordNotification(streamData) {
  try {
    const embed = {
      title: `${streamData.user_name} is now live on Twitch!`,
      description: streamData.title,
      url: `https://twitch.tv/${streamData.user_login}`,
      color: 0x6441a5, // Twitch purple color
      fields: [
        {
          name: "Game",
          value: streamData.game_name || "No game specified",
          inline: true,
        },
        {
          name: "Viewers",
          value: streamData.viewer_count.toString(),
          inline: true,
        },
      ],
      thumbnail: {
        url: streamData.thumbnail_url
          .replace("{width}", "1280")
          .replace("{height}", "720"),
      },
    };

    await axios.post(DISCORD_WEBHOOK_URL, {
      embeds: [embed],
    });

    console.log(
      `Discord notification sent successfully for ${streamData.user_name}!`
    );
  } catch (error) {
    console.error("Error sending Discord notification:", error.message);
  }
}

// Main function to run the application
async function main() {
  await getTwitchAccessToken();

  // Initialize stream status for all usernames
  TWITCH_USERNAMES.forEach((username) => {
    streamStatus[username] = false;
  });

  // Check stream status every 60 seconds
  setInterval(async () => {
    await checkStreamStatus();
  }, 60000);

  // Initial check
  await checkStreamStatus();

  // Start the Express server
  app.get("/", (req, res) => {
    res.send("Twitch Stream Monitor is running!");
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

main().catch(console.error);
