require("dotenv").config();
const { WebClient } = require("@slack/web-api");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const web = new WebClient(SLACK_BOT_TOKEN);
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const playlistId = "PLy3-VH7qrUZ5IVq_lISnoccVIYZCMvi-8";
const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;

async function fetchPlaylistVideos() {
  try {
    const response = await axios.get(apiUrl);
    return response.data.items;
  } catch (error) {
    console.error("Error fetching YouTube playlist:", error);
  }
}

async function getRandomVideoUrl() {
  const videos = await fetchPlaylistVideos();
  if (!videos) return;

  const randomIndex = Math.floor(Math.random() * videos.length);
  const video = videos[randomIndex];
  return `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`;
}

async function postVideo(channelId, videoUrl) {
  try {
    await web.chat.postMessage({
      channel: channelId,
      text: `It's Wednesday, my dudes! Enjoy this video:\n${videoUrl}`,
    });
  } catch (error) {
    console.error("Error posting message to Slack:", error);
  }
}

async function handleWednesdayCommand(channelId) {
  try {
    const videoUrl = await getRandomVideoUrl();
    await postVideo(channelId, videoUrl);
  } catch (error) {
    console.error("Error posting video:", error);
  }
}

app.get("/", (req, res) => {
  res.send("root dir gotten!");
});

app.post("/", (req, res) => {
  handleWednesdayCommand(req.body.channel_id);
  res.status(200).send("Processing your request, please wait...");
});

app.get("/success", (req, res) => {
  res.send("OAuth process completed successfully.");
});

app.get("/error", (req, res) => {
  res.send("An error occurred during the OAuth process.");
});

app.get("/auth/slack/callback", (req, res) => {
  const authCode = req.query.code;

  const requestOptions = {
    url: "https://slack.com/api/oauth.v2.access",
    method: "POST",
    form: {
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code: authCode,
    },
    json: true,
  };

  request(requestOptions, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      // Save the access_token (and other relevant information) to your datastore for future use
      const accessToken = body.access_token;

      // Redirect the user to a success page in your application
      res.redirect("/success");
    } else {
      // Handle errors during the OAuth process
      res.redirect("/error");
    }
  });
});

const port = process.env.PORT || 3050;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
