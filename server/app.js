const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Sirviendo los archivos estáticos de la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/walkie-talkie/room/:roomNumber', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/walkie-talkie/room/index.html'));
});

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado');

    socket.on('join-room', (roomNumber) => {
        socket.join(roomNumber);
        console.log(`Usuario conectado a la sala ${roomNumber}`);

        socket.on('audio-message', (audioBuffer) => {
            socket.to(roomNumber).emit('audio-message', audioBuffer);
        });

        socket.on('disconnect', () => {
            console.log(`Usuario desconectado de la sala ${roomNumber}`);
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
