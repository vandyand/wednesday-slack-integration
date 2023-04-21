require("dotenv").config();
const { WebClient } = require("@slack/web-api");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
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

app.get("/", () => {
  console.log("root dir gotten!");
});

app.post("/wednesday", (req, res) => {
  if (req.body.command === "/wednesday") {
    handleWednesdayCommand(req.body.channel_id);
    res.status(200).send("Processing your request, please wait...");
  } else {
    res.status(500).send("Invalid command");
  }
});

const port = process.env.PORT || 3050;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
