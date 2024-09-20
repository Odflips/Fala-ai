let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const socket = io(); // Conectar al servidor de Socket.IO
const talkButton = document.getElementById("talkButton");
const statusText = document.getElementById("status");
const audioPlayback = document.getElementById("audioPlayback");

// Solicitar permiso para las notificaciones del navegador
if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
        if (permission === "denied") {
            console.warn("Permiso para notificaciones denegado");
        }
    });
}

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

// Mostrar una notificación cuando se recibe un audio nuevo
function mostrarNotificacion() {
    if ('Notification' in window && Notification.permission === "granted") {
        const notification = new Notification("Nuevo mensaje de audio", {
            body: "Haz clic para escuchar el nuevo mensaje",
            icon: "/images/icon.png" // Ruta del ícono de la notificación
        });

        notification.onclick = () => {
            window.focus(); // Lleva la ventana al frente si está en segundo plano
        };
    }
}

// Mostrar una alerta visual en la página web
function mostrarAlertaVisual() {
    const alertDiv = document.createElement('div');
    alertDiv.textContent = "Nuevo audio recibido";
    alertDiv.className = 'alerta-visual';
    document.body.appendChild(alertDiv);

    // Remover la alerta después de unos segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000); // La alerta desaparece después de 5 segundos
}

// Escuchar cuando el servidor envía audio desde otros usuarios
socket.on('audio-message', (audioBuffer) => {
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    const audioUrl = URL.createObjectURL(blob);
    audioPlayback.src = audioUrl;
    audioPlayback.play();
    statusText.textContent = "Estado: Reproduciendo audio recibido";

    // Mostrar notificación y alerta visual
    mostrarNotificacion();
    mostrarAlertaVisual();
});
