const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const { OAuth2Client } = require("google-auth-library");
const {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/callback";

app.get("/login", (req, res) => {
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${REDIRECT_URI}` +
    `&response_type=code` +
    `&scope=email%20profile` +
    `&access_type=offline`;

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const authorizationCode = req.query.code;

  const tokenResponse = await axios.post(
    "https://oauth2.googleapis.com/token",
    null,
    {
      params: {
        code: authorizationCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      },
    }
  );

  if (tokenResponse.data.error) {
    console.error("Token Error:", tokenResponse.data.error); // Debugging
  }

  const accessToken = tokenResponse.data.access_token;
  const refreshToken = tokenResponse.data.refresh_token;

  const id_token = tokenResponse.data.id_token;
  const info = jwt.decode(tokenResponse.data.id_token);

  const dbclient = new DynamoDBClient();

  const gsiName = 'emailIndex';
  const attributeName = "email";
  const attributeValue = "DesiredValue";

  const queryCommand = new QueryCommand({
    TableName: "InboxPlus_Users",
    IndexName: 'email-index',
    KeyConditionExpression: `${attributeName} = :value`,
    ExpressionAttributeValues: {
      ":value": { S: info.email },
    },
  });

  dbclient.send(queryCommand)
    .then((data) => {
      if (data.Items && data.Items.length > 0) {
        console.log("Item exists in the table.");
      } else {
        console.log("Item does not exist in the table.");
      }
    })
    .catch((err) => {
      console.error("Error querying the table:", err);
    });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
