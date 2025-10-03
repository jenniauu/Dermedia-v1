from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import os

app = Flask(__name__)

# Carrega o modelo Keras (se estiver usando)
model_keras = None
if os.path.exists('acne_model.h5'):
    model_keras = tf.keras.models.load_model('acne_model.h5')

@app.route('/analyze-ia', methods=['POST'])
def analyze_ia():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
        
    image = request.files['image']
    try:
        img = Image.open(image).convert('RGB')
        
        # Processamento para o modelo Keras
        if model_keras:
            img_keras = img.resize((150, 150))
            img_array = np.array(img_keras) / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            
            prediction = model_keras.predict(img_array)
            classes = ["leve", "moderada", "grave"]
            result = classes[np.argmax(prediction)]
            
            treatment = "Use retinóides tópicos." if result == "grave" else "Use ácido salicílico."
            
            return jsonify({
                "model": "keras",
                "condition": "acne",
                "severity": result,
                "treatment": treatment
            })
        
        return jsonify({"error": "No model loaded"}), 500
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Rota para a página web
@app.route('/')
def index():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Análise de Pele</title>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"></script>
    </head>
    <body>
        <h1>Análise de Condições de Pele</h1>
        
        <div>
            <h2>Opção 1: Upload de Imagem</h2>
            <input type="file" id="upload" accept="image/*">
            <div id="image-preview" style="max-width: 300px; display: none;"></div>
            <div id="result"></div>
        </div>
        
        <div>
            <h2>Opção 2: Webcam</h2>
            <button type="button" onclick="initWebcam()">Iniciar Webcam</button>
            <div id="webcam-container"></div>
            <div id="label-container"></div>
        </div>
        
        <script>
            // Código JavaScript aqui
            let modelTM;
            let webcam, labelContainer, maxPredictions;
            const modelTM_URL = "./model_tm/";
            
            // Função para upload de imagem
            document.getElementById('upload').addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                const preview = document.getElementById('image-preview');
                preview.src = URL.createObjectURL(file);
                preview.style.display = 'block';

                // Envia para o backend Keras
                const formData = new FormData();
                formData.append('image', file);
                
                try {
                    const response = await fetch('/analyze-ia', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    
                    if (result.error) {
                        document.getElementById('result').innerHTML = `<p style="color:red">${result.error}</p>`;
                        return;
                    }
                    
                    document.getElementById('result').innerHTML = `
                        <p><strong>Modelo:</strong> ${result.model}</p>
                        <p><strong>Condição:</strong> ${result.condition}</p>
                        <p><strong>Severidade:</strong> ${result.severity}</p>
                        <p><strong>Tratamento:</strong> ${result.treatment}</p>
                    `;
                } catch (error) {
                    console.error('Error:', error);
                }
            });
            
            // Funções para webcam com Teachable Machine
            async function initWebcam() {
                if (!modelTM) {
                    try {
                        modelTM = await tmImage.load(modelTM_URL + "model.json", modelTM_URL + "metadata.json");
                        maxPredictions = modelTM.getTotalClasses();
                    } catch (error) {
                        console.error("Failed to load Teachable Machine model:", error);
                        alert("Erro ao carregar o modelo Teachable Machine. Verifique o console para detalhes.");
                        return;
                    }
                }
                
                // Configura a webcam
                const flip = true;
                webcam = new tmImage.Webcam(200, 200, flip);
                try {
                    await webcam.setup();
                    await webcam.play();
                } catch (error) {
                    console.error("Webcam error:", error);
                    alert("Erro ao acessar a webcam. Verifique as permissões.");
                    return;
                }
                
                document.getElementById("webcam-container").appendChild(webcam.canvas);
                labelContainer = document.getElementById("label-container");
                labelContainer.innerHTML = '';
                
                for (let i = 0; i < maxPredictions; i++) {
                    labelContainer.appendChild(document.createElement("div"));
                }
                
                window.requestAnimationFrame(loopWebcam);
            }
            
            async function loopWebcam() {
                webcam.update();
                await predictWebcam();
                window.requestAnimationFrame(loopWebcam);
            }
            
            async function predictWebcam() {
                if (!modelTM || !webcam) return;
                
                const prediction = await modelTM.predict(webcam.canvas);
                for (let i = 0; i < maxPredictions; i++) {
                    const classPrediction = `
                        ${prediction[i].className}: ${(prediction[i].probability * 100).toFixed(1)}%
                    `;
                    labelContainer.childNodes[i].innerHTML = classPrediction;
                }
            }
        </script>
    </body>
    </html>
    """

if __name__ == '__main__':
    app.run(debug=True)