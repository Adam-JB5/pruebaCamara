"use strict";

const listaPredicciones = {
    0: 'Bean', 1: 'Bitter_Gourd', 2: 'Bottle_Gourd', 3: 'Brinjal',
    4: 'Broccoli', 5: 'Cabbage', 6: 'Capsicum', 7: 'Carrot',
    8: 'Cauliflower', 9: 'Cucumber', 10: 'Papaya', 11: 'Potato',
    12: 'Pumpkin', 13: 'Radish', 14: 'Tomato'
};

// Elementos del DOM
const video = document.getElementById('video');
const imagenSubida = document.getElementById('imagen-subida');
const capturarBtn = document.getElementById('capturar');
const cambiarCamaraBtn = document.getElementById('cambiar-camara');
const inputImagen = document.getElementById('input-imagen');
const canvas = document.createElement('canvas');
let usandoFrontal = true; // Alternar entre cámaras
let streamActivo = null;  // Almacenar el stream activo

// Cargar el modelo
async function cargarModelo() {
    return await tf.loadLayersModel('./modelo/model.json');
}

// Acceder a la cámara
async function accederCamara() {
    if (streamActivo) {
        streamActivo.getTracks().forEach(track => track.stop()); // Detener cámara anterior
    }

    try {
        const dispositivos = await navigator.mediaDevices.enumerateDevices();
        const camaras = dispositivos.filter(device => device.kind === 'videoinput');
        if (camaras.length > 1) {
            usandoFrontal = !usandoFrontal; // Alternar entre cámaras si hay más de una
        }

        streamActivo = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: usandoFrontal ? "user" : "environment" }
        });

        video.srcObject = streamActivo;
        video.style.display = "block";  // Mostrar video
        imagenSubida.style.display = "none"; // Ocultar imagen subida
    } catch (error) {
        console.error("Error al acceder a la cámara:", error);
    }
}

// Capturar un fotograma del video y procesarlo
function capturarFotograma() {
    const contexto = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    img.onload = () => predecir(img); // Pasar la imagen capturada a la función de predicción
}

// Cargar imagen desde archivo
inputImagen.addEventListener('change', (event) => {
    const archivo = event.target.files[0];
    if (archivo) {
        const img = new Image();
        img.src = URL.createObjectURL(archivo);
        img.onload = () => {
            video.style.display = "none";  // Ocultar video
            imagenSubida.src = img.src;
            imagenSubida.style.display = "block";  // Mostrar imagen subida
            predecir(img);
        };
    }
});

// Preprocesar la imagen antes de la predicción
async function preprocesarImagen(imagen) {
    const imgTensor = tf.browser.fromPixels(imagen);
    const imgRedimensionada = tf.image.resizeBilinear(imgTensor, [256, 256]);
    const imagenNormalizada = imgRedimensionada.div(tf.scalar(255));
    return imagenNormalizada.expandDims(0);
}

// Hacer la predicción con el modelo cargado
async function predecir(imagen) {
    const modelo = await cargarModelo();
    const imagenProcesada = await preprocesarImagen(imagen);
    const prediccion = modelo.predict(imagenProcesada);
    
    const clasePredicha = prediccion.argMax(1).dataSync()[0];
    document.getElementById('resultado').textContent = `Verdura detectada: ${listaPredicciones[clasePredicha]}`;
}

// Eventos de los botones
capturarBtn.addEventListener('click', capturarFotograma);
cambiarCamaraBtn.addEventListener('click', accederCamara);

// Iniciar cámara al cargar la página
accederCamara();
