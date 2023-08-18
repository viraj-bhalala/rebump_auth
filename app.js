const express = require("express");
const app = express();

app.use(express.json());

const port = process.env.PORT || 4000;

app.get("/status", (request, response) => {
  const status = {
    Status: "Running",
  };

  response.send(status);
});

app.listen(port, () => {
  console.log("Server Listening on PORT:", port);
});
