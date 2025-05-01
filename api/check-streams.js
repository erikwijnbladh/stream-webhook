const axios = require("axios");

// Discord webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Twitch API configuration
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_USERNAMES = process.env.TWITCH_USERNAMES.split(",").map(
  (username) => username.trim()
);

let accessToken = null;

// Function to get Twitch access token
async function getTwitchAccessToken() {
  try {
    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
    );
    accessToken = response.data.access_token;
  } catch (error) {
    console.error("Error getting Twitch access token:", error.message);
    throw error;
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
    throw error;
  }
}

// Main handler function
export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Get access token
    await getTwitchAccessToken();

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

    // Send notifications for all live streams
    for (const streamData of liveStreams) {
      await sendDiscordNotification(streamData);
    }

    return res.status(200).json({
      message: "Stream check completed",
      liveStreams: liveStreams.map((stream) => ({
        username: stream.user_name,
        title: stream.title,
        game: stream.game_name,
        viewers: stream.viewer_count,
      })),
    });
  } catch (error) {
    console.error("Error in stream check:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
