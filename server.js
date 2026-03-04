const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // для теста на Render — разрешает всем подключаться
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.static('public'));

// Явно отдаём index.html по корневому пути — это решает "Cannot GET /"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const users = {}; // socket.id → username

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  socket.on('set username', (username) => {
    users[socket.id] = username || 'Аноним';
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

// Важно: используем process.env.PORT для Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
