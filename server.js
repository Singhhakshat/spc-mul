// const app = require("express")();
// const httpServer = require("http").createServer(app);
// const PORT = process.env.PORT || 3000;
// const io = require("socket.io")(httpServer, {
//     cors: {
//       origin: "https://singhhakshat.github.io",
//       methods: ["GET", "POST"]
//     }
//   });

// const players = {};
// let round = 1;

// io.on("connection", socket => {
//   console.log('a device connected');

//   const playerId = socket.id;
//   players[playerId] = {
//     socket,
//     move: null,
//     score: 0,
//     name:"",
//     room: "",
//   };

//   socket.on('room-name', (data) =>{
//     socket.join(data);
//     console.log(`user ${players[playerId].name} joined room ${data}`);
//     players[playerId].room = data;
//     io.to(players[playerId].room).emit('round', round);
//   })

//   socket.on('user-name', (data)=>{
//     players[playerId].name = data;
//     console.log(players[playerId].room);
//     io.to(players[playerId].room).emit('opponent', data );
//   });  

//   socket.on('move', (move) => {
//     players[playerId].move = move;
//     checkRoundResult();
//   });
  
//     socket.on('disconnect', () =>{
//       round = 1;
//       delete players[playerId];
//       console.log('a device disconnected');
//     });

// function checkRoundResult() {
//   const playerIds = Object.keys(players);

//   if (playerIds.length >= 2) {
//     const player1 = players[playerIds[0]];
//     const player2 = players[playerIds[1]];

//     if (player1.move && player2.move) {
//       const move1 = player1.move;
//       const move2 = player2.move;

//       let result;
//       if (move1 === move2) {
//         result = 'Draw';
//       } else if (
//         (move1 === 'stone' && move2 === 'scissors') ||
//         (move1 === 'paper' && move2 === 'stone') ||
//         (move1 === 'scissors' && move2 === 'paper')
//       ) {
//         io.to(player1.room).to(player1.socket.id).emit('result', true);
//         io.to(player1.room).to(player1.socket.id).emit('result', false);
//       } else {
//         io.to(player1.room).to(player1.socket.id).emit('result', false);
//         io.to(player1.room).to(player1.socket.id).emit('result', true);
//       }
//       // Send the result to both players
//       io.to(players[playerId].room).emit('result', result);
//       round++;
//       io.to(players[playerId].room).emit('round', round);
//       // Reset moves for the next round
//       player1.move = null;
//       player2.move = null;
//     }
//   }
// }
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
const game={};
const round={};

io.on("connection", socket => {
  let room = null;

  console.log('a device connected');

  socket.on('join-room', (roomName) =>{

    if(room){
      socket.leave(room);
    }
    room = roomName;
    if(io.sockets.adapter.rooms.get(room)){
      const players = io.sockets.adapter.rooms.get(room);
      if(players.size < 2){
        socket.join(room);
        game[socket.id] = {
          move: null,
          score: 0,
        };
        console.log(`player ${socket} joined room ${room}`);  
        io.to(room).emit('start', (false));
      }
      else{
        socket.disconnect();
      }
    }
    else{
      socket.join(room);
      round[room]={
        round: 1,
      }
      game[socket.id] = {
        move: null,
        score: 0,
      };
      console.log(`player ${socket} joined room ${room}`);
    }
  });

  socket.on('user-name', (val)=>{
    socket.broadcast.to(room).emit('opponent',val);
    io.to(room).emit('round', round[room].round);
  });

  socket.on('move', (move)=>{
    game[socket.id].move = move;
    if(room){
      const playersInRoom = io.sockets.adapter.rooms.get(room);
      const playersList = Array.from(playersInRoom);
      
      const player1 = playersList[0];
      const player2 = playersList[1];
      console.log(game[player1]);
      console.log(game[player2]);
      console.log(`round is ${round[room].round}`);
      if(round[room].round<3){
        if(game[player1].move!=null && game[player2].move!=null){
          gameResult(player1, player2, room);
          game[player1].move = null; 
          game[player2].move = null;
          io.to(room).emit('round', round[room].round);
        }
      }
      else{
        if(game[player1].move!=null && game[player2].move!=null){
          finalResult(player1, player2, room);
          game[player1].move = null;
          game[player2].move = null;
        }
      }
      // else{
      //   if(game[player1].score>game[player2].score){
      //     io.to(room).emit('complete', );
      //   }
      // }
      
    }
  });

  socket.on('reset', (val)=>{
    round[room].round = 1;
    const playersInRoom = io.sockets.adapter.rooms.get(room);
    const playersList = Array.from(playersInRoom);
    const player1 = playersList[0];
    const player2 = playersList[1];
    game[player1].score = 0;
    game[player2].score = 0;
    io.to(room).emit('round', round[room].round);
  });

  socket.on('disconnect', () =>{
    console.log('a device disconnected');
  });

});

function gameResult(p1, p2, room){
  console.log('calculating result');
  const move1 = game[p1].move;
  const move2 = game[p2].move;

  if (move1 === move2) {
    io.to(room).emit('tie', true);
    console.log('tie');
  } 
  else if ((move1 === 'stone' && move2 === 'scissors') || (move1 === 'paper' && move2 === 'stone') || (move1 === 'scissors' && move2 === 'paper')){
    io.to(p1).emit('round-result', true);
    io.to(p2).emit('round-result', false);
    round[room].round = (round[room].round + 1);
    game[p1].score = (game[p1].score + 1);
    console.log('p1 win');
  } 
  else {
    io.to(p1).emit('round-result', false);
    io.to(p2).emit('round-result', true);
    round[room].round = (round[room].round + 1);
    game[p2].score = (game[p2].score + 1);
    console.log('p2 win');
  }

  // if(round[room].round > 3){
  //   finalResult(p1,p2,room);
  // }
}

function finalResult(p1, p2, room){
  console.log('calculating final result');
  const score1 = game[p1].score;
  const score2 = game[p2].score;
  
  if(score1 > score2){
    io.to(p1).emit('final', true);
    io.to(p2).emit('final', false);
    console.log(`p1 wins the game in ${room}`);
  }
  else{
    io.to(p1).emit('final', false);
    io.to(p2).emit('final', true);
    console.log(`p2 wins the game in ${room}`);
  }
}

httpServer.listen(PORT);