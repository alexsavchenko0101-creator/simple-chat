const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = {}; // socket.id → username

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  // Клиент отправил имя
  socket.on('set username', (username) => {
    users[socket.id] = username || 'Аноним';
    // Системное сообщение о входе
    io.emit('chat message', {
      username: 'Система',
      text: `${users[socket.id]} присоединился к чату`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('chat message', (msg) => {
    const username = users[socket.id] || 'Аноним';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    io.emit('chat message', { username, text: msg, time });
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      io.emit('chat message', {
        username: 'Система',
        text: `${users[socket.id]} покинул чат`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      delete users[socket.id];
    }
    console.log('Пользователь отключился:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен → http://localhost:${PORT}`);
});
