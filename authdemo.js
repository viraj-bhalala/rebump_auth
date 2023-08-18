const axios = require("axios");
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const { OAuth2Client } = require("google-auth-library");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 4000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/callback";

app.get("/login", (req, res) => {
  ``;
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
  // console.log(req.query);

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

  // console.log('accessToken', accessToken)
  // console.log('refreshToken', refreshToken)

  // console.log(tokenResponse);

  // Here, you'd typically store the tokens securely in a database
  // and associate them with the user.

  const id_token = tokenResponse.data.id_token;
  const info = jwt.decode(tokenResponse.data.id_token);
  console.log(info);
  // console.log(Date.now().toString());
  // console.log(typeof(Date.now().toString()))
  // console.log(typeof(1));

  const dbclient = new DynamoDBClient({
    region: process.env.AWS_REGION,
  });

  const params = {
    TableName: "InboxPlus_Users",
    Item: {
      _id: {S: uuidv4()},
      name: {S: info.name},
      email: {S: info.email},
      sub: {S: info.sub},
      access_token: {S: tokenResponse.data.access_token},
      refresh_token: {S: tokenResponse.data.refresh_token}, 
      created_date: {S: Date.now().toString()},
      org_id: {S: info.name},
      status: {S: '1'},
      picture: {S: info.picture}
    },
  }
  try {
    const data = await dbclient.send(new PutItemCommand(params));
    console.log("PutItem succeeded:", data);
  } catch (err) {
    console.error("Error putting item:", err);
  }
  

  res.send(JSON.stringify(info));

  // const externalRedirectUrl = "https://www.youtube.com";
  // res.redirect(externalRedirectUrl);
});

app.get("/signout", async (req, res) => {
  const revokeResponse = await axios.post(
    "https://oauth2.googleapis.com/revoke",
    null,
    {
      params: {
        token:
          "ya29.a0AfB_byCV1kCtyPO_I5TCt-3Wv0v5RY5jSskHhYUkBjl3HE-kNtBj3M1p8V97Quz59wwZTN88-ZzbtbY_WSJXn4GZn7Pqtv2rPSJlt_zZOe95S0LcPChOCH9lEmeHQHv7Y8npv9CjV7UuzbB_2_qnQyCCQZ_VaCgYKAaYSARMSFQHsvYls16_BpfmGvHVfj0b6rGmbDg0163", // The user's access token
      },
    }
  );

  if (revokeResponse.status === 200) {
    // Access token revoked successfully
    // localStorage.removeItem('accessToken');
    // localStorage.removeItem('refreshToken');
    res.send("Tokens revoked successfully....");
  }
});

async function checkTokenExpiration(accessToken) {
  try {
    // Initialize the OAuth2Client with your client ID
    const client = new OAuth2Client(CLIENT_ID);
    const tokenInfo = await client.getTokenInfo(accessToken);
    console.log(tokenInfo);

    const currentTimeInSeconds = Math.floor(Date.now() / 1000); // Current time in seconds
    const tokenExpirationTime = parseInt(tokenInfo.exp); // Expiration time from the token info

    if (tokenExpirationTime > currentTimeInSeconds) {
      console.log("tokenExpirationTime", tokenExpirationTime);
      console.log("currentTimeInSeconds", currentTimeInSeconds);
      console.log("Access token is valid.");
      return true;
    } else {
      console.log("tokenExpirationTime", tokenExpirationTime);
      console.log("currentTimeInSeconds", currentTimeInSeconds);
      console.log("Access token has expired.");
      return false;
    }
  } catch (error) {
    console.error("Error checking token:", error.message);
    return false;
  }
}

async function generateNewAccessToken() {
  const refreshToken =
    "1//0glAT-FRm9wPmCgYIARAAGBASNwF-L9Irr0Spg9dkQtE97iKp4ZBAuFBAxsHmM5YR---HWKZFTYFpoOfaJZTDsBsKyyjaH5jNGiw";
  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  try {
    const tokenResponse = await oauth2Client.refreshToken(refreshToken);
    const accessToken = tokenResponse.tokens.access_token;
    console.log("New access token:", accessToken);
  } catch (error) {
    console.error("Error refreshing access token:", error.message);
  }
}

app.get("/validate_user", async (req, res) => {
  const accessToken =
    "ya29.a0AfB_byDz1F6vh0Yrbca9mvad1M6CRhX-kpK8cvVOumLzJIEiV-3AF_st157luqQwDXexdqso_GdDAPSds5oXzgQUAqtDMxCCclVSlx7LCLq5vnPOrqL3Togs771ss_6xEZLKFN8xIj3j014QFXP9VUP2SQi0npQaCgYKAUYSARMSFQHsvYls2ILDo_jBwSmvx5qrGkINAg0166";
  const status = await checkTokenExpiration(accessToken);
  console.log(status);

  if (status == true) {
    res.send("Access token is valid");
  } else {
    generateNewAccessToken();
    res.send("Access token is invalid or expired");
  }

  // try {
  //   // Verify the ID token
  //   const tokenPayload = jwt.verify(accessToken, null, {
  //     algorithms: ["RS256"],
  //     issuer: "https://accounts.google.com",
  //   });

  //   // Check if the token has expired
  //   if (tokenPayload.exp >= Math.floor(Date.now() / 1000)) {
  //     console.log("Token is valid and not expired.");
  //   } else {
  //     console.log("Token has expired.");
  //   }
  //   console.log(tokenPayload);

  //   res.send(JSON.stringify(tokenPayload));
  // } catch (error) {
  //   console.error("Token verification failed:", error.message);
  //   res.status(400).send("Token verification failed");
  // }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
