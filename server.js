const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public')); // Sirve los archivos estáticos en la carpeta 'public'

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    // Escucha cuando un emisor envía audio
    socket.on('audio-message', (audioBuffer) => {
        console.log(`Recibido audio de ${socket.id}`);

        // Reenvía el audio a todos los demás usuarios (receptores)
        socket.broadcast.emit('audio-message', audioBuffer);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
