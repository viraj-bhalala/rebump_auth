const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 4000;

app.post("/decode_token", (req, res) => {
  const decoded = jwt.decode(req.body["token"]);
  const name = decoded["name"];
  const picture = decoded["picture"];
  console.log(name);
  console.log(picture);
  res.send({ name: name, picture: picture });
});

app.listen(port, () => {
  console.log("Server listening on port 4000");
});

// const token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImZkNDhhNzUxMzhkOWQ0OGYwYWE2MzVlZjU2OWM0ZTE5NmY3YWU4ZDYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzMjk5NDQ1MjQ2NjItMGc1bmlnMHJxaWVwajFtMTZyMG1ya2xyMjFtYjVhcnUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIzMjk5NDQ1MjQ2NjItMGc1bmlnMHJxaWVwajFtMTZyMG1ya2xyMjFtYjVhcnUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTY4MjkzMzUxMDE2MzMyMzE3MjUiLCJoZCI6Iml0ZWNobm90aW9uLmNvbSIsImVtYWlsIjoiaGVldC5tYXZhbmlAaXRlY2hub3Rpb24uY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5iZiI6MTY5MTEzMjQxNiwibmFtZSI6IkhlZXQgTWF2YW5pIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FBY0hUdGZoc2tzQ1B2UmFQVEtIdVk5MGtIU1c3SFNvdUZPUVpxSEVpeGdTOUxPQmRRPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkhlZXQiLCJmYW1pbHlfbmFtZSI6Ik1hdmFuaSIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNjkxMTMyNzE2LCJleHAiOjE2OTExMzYzMTYsImp0aSI6ImRiMmQ5Nzk3YjA4Njk3ZDRmMGJhYTA2MmRiMGVkZTIyM2Y3YzlmYmEifQ.vLE75z8cxykLAdI5Ey9sLytAqvm7LnMvhacOdhTAYoK0fJlkxqyBQUeDZbPOuowcx3AvlLaTAAr3h0E3mJ3Xr7z1DZBX332bJM6nHu8sN71CsK6C5_LwMeDCaIuXx-K4tO-twvgXWWjFgmFQvyLJq10jpUT40IbaB04LqZIfYzXcEvi9Qs4Lw0TKfgfkBMzInTAvZBaLtyxo6j_Q84b9gliZCE8SZyL47kUiFfFeXtbJyQTY04xIiRTzqu3pYXpph1GpqFxJMlxRNgFawJuO62Bz7JnsJrAYFXV5ngsgJL1X95D0VaixAiMQ7zOZCb-j7q2IadfSo_cBw6aKnVQCOA"

// const decoded = jwt.decode(token)

// console.log(decoded)
