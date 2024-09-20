let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const socket = io(); // Conectar al servidor de Socket.IO
const talkButton = document.getElementById("talkButton");
const statusText = document.getElementById("status");
const audioPlayback = document.getElementById("audioPlayback");

// Solicitar permiso para usar el micrófono
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];

            // Convertir el Blob a ArrayBuffer para transmitirlo a través de Socket.IO
            const reader = new FileReader();
            reader.onloadend = () => {
                const arrayBuffer = reader.result;
                socket.emit('audio-message', arrayBuffer); // Enviar audio al servidor
            };
            reader.readAsArrayBuffer(audioBlob);

            statusText.textContent = "Estado: Grabación enviada";
        };

        // Iniciar grabación cuando se presiona el botón
        talkButton.addEventListener("mousedown", () => {
            audioChunks = [];
            mediaRecorder.start();
            statusText.textContent = "Estado: Grabando...";
            isRecording = true;
        });

        // Detener grabación cuando se suelta el botón
        talkButton.addEventListener("mouseup", () => {
            if (isRecording) {
                mediaRecorder.stop();
                statusText.textContent = "Estado: Procesando grabación...";
                isRecording = false;
            }
        });

    })
    .catch(error => {
        console.error("Error al acceder al micrófono:", error);
        statusText.textContent = "Estado: Error al acceder al micrófono";
    });

// Escuchar cuando el servidor envía audio desde otros usuarios
socket.on('audio-message', (audioBuffer) => {
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(blob);
    audioPlayback.src = audioUrl;
    audioPlayback.play();
    statusText.textContent = "Estado: Reproduciendo audio recibido";
});
