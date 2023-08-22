const axios = require("axios");
const express = require("express");
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

const port = process.env.PORT || 5000;

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

    console.log(authUrl)
    res.writeHead(302, { Location: authUrl }); // Use 302 for temporary redirection
    res.end();
});

app.get("/callback", async (req, res) => {
  const authorizationCode = req.query.code;
  // console.log(req.query);

  console.log(authorizationCode);

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
  console.log(tokenResponse.data);

  const accessToken = tokenResponse.data.access_token;
  const refreshToken = tokenResponse.data.refresh_token;

  const id_token = tokenResponse.data.id_token;
  const info = jwt.decode(tokenResponse.data.id_token);
  // console.log(info);

  const dbclient = new DynamoDBClient({
    region: process.env.AWS_REGION,
  });

  const queryCommand = {
    TableName: "InboxPlus_Users",
    IndexName: "email-index",
    KeyConditionExpression: `email = :value`,
    ExpressionAttributeValues: {
      ":value": { S: info.email },
    },
  };

  try {
    const command = new QueryCommand(queryCommand);

    const data = await dbclient.send(command);
    console.log("data", data);

    if (data.Items && data.Items.length > 0) {
      console.log("Item exists in the table.");
    } else {
      const params = {
        TableName: "InboxPlus_Users",
        Item: {
          _id: { S: uuidv4() },
          name: { S: info.name },
          email: { S: info.email },
          sub: { S: info.sub },
          access_token: { S: tokenResponse.data.access_token },
          refresh_token: { S: tokenResponse.data.refresh_token },
          created_date: { S: Date.now().toString() },
          org_id: { S: info.name },
          status: { S: "1" },
          picture: { S: info.picture },
        },
      };
      try {
        const data = dbclient.send(new PutItemCommand(params));
        console.log("PutItem succeeded:", data);
      } catch (err) {
        console.error("Error putting item:", err);
      }
    }
  } catch (error) {
    console.log('error from querying the table', error)
  }

  // .catch((err) => {
  //   console.error("Error querying the table:", err);
  // });

  // const params = {
  //   TableName: "InboxPlus_Users",
  //   Item: {
  //     _id: { S: uuidv4() },
  //     name: { S: info.name },
  //     email: { S: info.email },
  //     sub: { S: info.sub },
  //     access_token: { S: tokenResponse.data.access_token },
  //     refresh_token: { S: tokenResponse.data.refresh_token },
  //     created_date: { S: Date.now().toString() },
  //     org_id: { S: info.name },
  //     status: { S: "1" },
  //     picture: { S: info.picture },
  //   },
  // };
  // try {
  //   const data = await dbclient.send(new PutItemCommand(params));
  //   console.log("PutItem succeeded:", data);
  // } catch (err) {
  //   console.error("Error putting item:", err);
  // }

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
          "ya29.a0AfB_byBTawFVJXRwsAsVnmv_lBdCf2t_e_Z7QhUO874TYk2tX1EZw1DMNGM8MT8nxOuStkhAA_2-7L6OF639cTaoTXMZ4QTlJOo0SQ8RWSqFdkyjhsZmv2QV_tHIseeUeR-wOuEyj-dXl33PSV-ZYtp4-1bcpt4GUrvZpgaCgYKATESARMSFQHsvYlscBl176S12LC1p_r5Sl91bg0173", // The user's access token
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
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
