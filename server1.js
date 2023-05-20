// const app = require("express")();
// const httpServer = require("http").createServer(app);
// const PORT = process.env.PORT || 3030;
// const io = require("socket.io")(httpServer, {
//     cors: {
//       origin: "https://singhhakshat.github.io",
//       methods: ["GET", "POST"]
//     }
//   });

// io.on("connection", socket => {
//     console.log('a device connected');
// });

// httpServer.listen(PORT);

const app = require("express")();
const httpServer = require("http").createServer(app);
const PORT = process.env.PORT || 3000;
const io = require("socket.io")(httpServer, {
    cors: {
      origin: "https://singhhakshat.github.io",
      methods: ["GET", "POST"]
    }
  });

const players = {};
let round = 1;

io.on("connection", socket => {
  socket.emit('round', round);
  console.log('a device connected');

  const playerId = socket.id;
  players[playerId] = {
    socket,
    move: null,
    score: 0,
    name:"",
  };
  socket.on('user-name', (data)=>{
    players[playerId].name = data;
    socket.broadcast.emit('opponent', data );
  });  

  socket.on('move', (move) => {
    players[playerId].move = move;
    checkRoundResult();
  });
  
    socket.on('disconnect', () =>{
      delete players[playerId];
      console.log('a device disconnected');
    });

function checkRoundResult() {
  const playerIds = Object.keys(players);

  if (playerIds.length >= 2) {
    const player1 = players[playerIds[0]];
    const player2 = players[playerIds[1]];

    if (player1.move && player2.move) {
      const move1 = player1.move;
      const move2 = player2.move;

      let result;
      if (move1 === move2) {
        result = 'Draw';
      } else if (
        (move1 === 'stone' && move2 === 'scissors') ||
        (move1 === 'paper' && move2 === 'stone') ||
        (move1 === 'scissors' && move2 === 'paper')
      ) {
        result = `Player ${player1.name} wins!`;
      } else {
        result = `Player ${player2.name} wins!`;
      }
      // Send the result to both players
      player1.socket.emit('result', result);
      player2.socket.emit('result', result);
      round++;
      player1.socket.emit('round', round);
      player2.socket.emit('round', round);
      // Reset moves for the next round
      player1.move = null;
      player2.move = null;
    }
  }
}
});



httpServer.listen(PORT);