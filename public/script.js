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
            const reader = new FileReader();
            reader.onloadend = () => {
                const arrayBuffer = reader.result;
                socket.emit('audio-message', arrayBuffer);
                statusText.textContent = "Estado: Grabación enviada"; // Cambiar estado aquí
            };
            reader.readAsArrayBuffer(audioBlob);
            statusText.textContent = "Estado: Procesando grabación..."; // Cambiar el estado a "Procesando" inmediatamente
        };

        // Iniciar grabación
        const startRecording = () => {
            audioChunks = [];
            mediaRecorder.start();
            statusText.textContent = "Estado: Grabando...";
            isRecording = true;
        };

        // Detener grabación
        const stopRecording = () => {
            if (isRecording) {
                mediaRecorder.stop();
                isRecording = false;
            }
        };

        // Eventos para dispositivos de escritorio y móviles
        talkButton.addEventListener("mousedown", startRecording);
        talkButton.addEventListener("mouseup", stopRecording);
        talkButton.addEventListener("touchstart", startRecording);
        talkButton.addEventListener("touchend", stopRecording);
    })
    .catch(error => {
        console.error("Error al acceder al micrófono:", error);
        statusText.textContent = "Estado: Error al acceder al micrófono";
    });

// Notificaciones y alertas visuales
function mostrarNotificacion() {
    if ('Notification' in window) {
        if (Notification.permission === "granted") {
            const notification = new Notification("Nuevo mensaje de audio", {
                body: "Haz clic para escuchar el nuevo mensaje",
                icon: "/images/icon.png"
            });
            notification.onclick = () => {
                window.focus();
            };
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission(); // Solicitar permiso
        }
    }
}

function mostrarAlertaVisual() {
    const alertDiv = document.createElement('div');
    alertDiv.textContent = "Nuevo audio recibido";
    alertDiv.className = 'alerta-visual';
    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Reproducir audio recibido
socket.on('audio-message', (audioBuffer) => {
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(blob);
    audioPlayback.src = audioUrl;
    audioPlayback.play();
    statusText.textContent = "Estado: Reproduciendo audio recibido";
    mostrarNotificacion();
    mostrarAlertaVisual();
});

// Solicitar permisos de notificación al cargar la página
if ('Notification' in window) {
    Notification.requestPermission();
}
