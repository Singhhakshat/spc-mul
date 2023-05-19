const app = require("express")();
const httpServer = require("http").createServer(app);
const PORT = process.env.PORT || 3030;
const io = require("socket.io")(httpServer, {
    cors: {
      origin: "https://singhhakshat.github.io/StonePaperScissorsMultiplayer",
      methods: ["GET", "POST"]
    }
  });

io.on("connection", socket => {
    console.log('a device connected');
});

httpServer.listen(PORT);