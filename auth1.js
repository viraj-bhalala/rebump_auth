const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require('cors')
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 5000;

const corsOptions = {
  origin: "http://localhost:5000/",
  methods: ["POST"], // Specify the allowed HTTP methods
};

// Use the CORS middleware with the specified options
app.use(cors(corsOptions));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/callback";

app.post("/getToken", async (req, res) => {
  const authorizationCode = req.body.code;

  try {
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

    response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: {
        access_token: tokenResponse.data.access_token,
        refresh_token: tokenResponse.data.refresh_token,
      },
    };

    res.send(response);
  } catch (error) {
    console.error("Error exchanging authorization code:", error.message);
    res.status(500).send("Error exchanging authorization code");
  }
});

app.post("/signout", async (req, res) => {
  const revokeResponse = await axios.post(
    "https://oauth2.googleapis.com/revoke",
    null,
    {
      params: {
        token: req.body.access_token, // The user's access token
      },
    }
  );

  if (revokeResponse.status === 200) {
    // Access token revoked successfully
    // localStorage.removeItem('accessToken');
    // localStorage.removeItem('refreshToken');

    const response = {
      "statusCode": 200,
      "headers": {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
      },
      "body": "Tokens revoked successfully...."
    }
    res.send(response);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
