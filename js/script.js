document.addEventListener("DOMContentLoaded", function () {
  const toggleSidebar = document.getElementById("toggle-sidebar");
  const sidebar = document.querySelector(".sidebar");
  const mobileMenu = document.querySelector(".mobile-menu");

  // Toggle sidebar collapse
  toggleSidebar.addEventListener("click", function () {
    sidebar.classList.toggle("collapsed");
  });

  // Toggle sidebar visibility on mobile
  mobileMenu.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    document.querySelector(".nav-list").classList.toggle("active");
  });

  // Adicionar interação aos itens do menu
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      menuItems.forEach((i) => i.classList.remove("active"));
      this.classList.add("active");
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active"); // Close sidebar on mobile after menu item click
      }
    });
  });

  // Variáveis para controle da câmera e upload
  const previewContainer = document.getElementById("previewContainer");
  const uploadWidget = document.getElementById("uploadWidget");
  const uploadFileBtn = document.getElementById("uploadFileBtn");
  const openCameraBtn = document.getElementById("openCameraBtn");
  let stream = null;
  let videoElement = null;
  let capturedImage = null;
  let isCameraActive = false;

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0, s = 0, v = max;
  
    if (delta !== 0) {
      s = delta / max;
      if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
  }
  
  function isSkinImage(imageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  
    let rSum = 0, gSum = 0, bSum = 0;
    let rSqSum = 0, gSqSum = 0, bSqSum = 0;
    let skinPixelCount = 0;
    let edgeCount = 0; // Para detecção de bordas
    const totalPixels = imageData.length / 4;
    const sampleRate = Math.max(1, Math.floor(totalPixels / 20000)); // Amostra ~20k pixels para maior precisão
  
    // Para detecção de bordas simples (gradiente)
    const pixelsToCheck = [];
    for (let i = 0; i < imageData.length; i += 4 * sampleRate) {
      pixelsToCheck.push(i);
    }
  
    for (let idx = 0; idx < pixelsToCheck.length; idx++) {
      const i = pixelsToCheck[idx];
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
  
      // Acumula para desvio padrão
      rSum += r; gSum += g; bSum += b;
      rSqSum += r * r; gSqSum += g * g; bSqSum += b * b;
  
      // Verifica tom de pele (faixa expandida)
      const hsv = rgbToHsv(r, g, b);
      if (hsv.h >= 0 && hsv.h <= 60 && hsv.s >= 10 && hsv.s <= 80 && hsv.v >= 30 && hsv.v <= 100) {
        skinPixelCount++;
      }
  
      // Detecção de bordas (opcional): compara com pixel vizinho
      if (idx < pixelsToCheck.length - 1) {
        const nextIdx = pixelsToCheck[idx + 1];
        if (nextIdx < imageData.length) {
          const rNext = imageData[nextIdx];
          const gNext = imageData[nextIdx + 1];
          const bNext = imageData[nextIdx + 2];
          const diff = Math.abs(r - rNext) + Math.abs(g - gNext) + Math.abs(b - bNext);
          if (diff > 30) { // Limite de diferença para considerar borda
            edgeCount++;
          }
        }
      }
    }
  
    const sampledPixels = pixelsToCheck.length;
  
    // Calcula médias
    const rMean = rSum / sampledPixels;
    const gMean = gSum / sampledPixels;
    const bMean = bSum / sampledPixels;
  
    // Calcula desvios padrões
    const rStd = Math.sqrt((rSqSum / sampledPixels) - rMean * rMean);
    const gStd = Math.sqrt((gSqSum / sampledPixels) - gMean * gMean);
    const bStd = Math.sqrt((bSqSum / sampledPixels) - bMean * bMean);
    const avgStd = (rStd + gStd + bStd) / 3;
  
    // Calcula porcentagem de pixels de pele
    const skinPercentage = (skinPixelCount / sampledPixels) * 100;
  
    // Verifica bordas (mínimo 5% de bordas para confirmar textura)
    const edgePercentage = (edgeCount / sampledPixels) * 100;
  
    // Critérios: desvio padrão > 10 OU bordas > 5%, e pele >= 20%
    return (avgStd > 10 || edgePercentage > 5) && skinPercentage >= 20;
  }
  

  // Função para resetar para o widget de upload
  function resetToUploadWidget() {
    stopCamera();
    previewContainer.innerHTML = "";
    previewContainer.appendChild(uploadWidget);
    uploadWidget.style.display = "flex";
    if (capturedImage) {
      capturedImage = null;
    }
  }

  function createImageControls() {
    const controls = document.createElement("div");
    controls.className = "image-controls";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-btn";
    cancelBtn.innerHTML = "<img src='images/deletar.png'>";
    cancelBtn.innerHTML = "<img src='/imagens/deletar.png'>";
    cancelBtn.addEventListener("click", resetToUploadWidget);
    const approveBtn = document.createElement("button");
    approveBtn.className = "approve-btn";
    approveBtn.innerHTML = "<img src='images/aceitar.png'>";
    approveBtn.innerHTML = "<img src='/imagens/aceitar.png'>";
    approveBtn.addEventListener("click", function () {
      if (capturedImage) {
        analyzeImage(capturedImage);
      }
      controls.remove();
      if (document.querySelector(".camera-icon-container")) {
        document.querySelector(".camera-icon-container").remove();
      }
    });

    controls.appendChild(cancelBtn);
    controls.appendChild(approveBtn);
    previewContainer.appendChild(controls);
  }

  // Função para exibir imagem capturada ou upload
  function displayImage(imageData) {
    previewContainer.innerHTML = "";
    const img = document.createElement("img");
    img.src = imageData;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    previewContainer.appendChild(img);
    capturedImage = img;

    const historyDate = document.querySelector(".history-date");
    const now = new Date();
    historyDate.textContent = `Data: ${now.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}`;

    createImageControls();
  }

  // Função para inicializar a câmera
  function initCamera() {
    isCameraActive = true;
    uploadWidget.style.display = "none";
    previewContainer.innerHTML = "";

    videoElement = document.createElement("video");
    videoElement.setAttribute("autoplay", "true");
    videoElement.setAttribute("playsinline", "true");
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    previewContainer.appendChild(videoElement);

    const iconContainer = document.createElement("div");
    iconContainer.className = "camera-icon-container";
    const cameraBtn = document.createElement("button");
    cameraBtn.className = "camera-btn";
    cameraBtn.innerHTML = "<img src='images/capturar.png'>";
    cameraBtn.addEventListener("click", captureImage);
    iconContainer.appendChild(cameraBtn);
    previewContainer.appendChild(iconContainer);

    createImageControls();

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then(function (mediaStream) {
          stream = mediaStream;
          videoElement.srcObject = mediaStream;
        })
        .catch(function (error) {
          console.error("Erro ao acessar a câmera:", error);
          alert(
            "Não foi possível acessar a câmera. Verifique as permissões do navegador."
          );
          resetToUploadWidget();
        });
    } else {
      alert("Seu navegador não suporta acesso à câmera.");
      resetToUploadWidget();
    }
  }

  // Função para capturar imagem da câmera
  function captureImage() {
    if (!videoElement) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const imgData = canvas.toDataURL("image/png");
    stopCamera();
    displayImage(imgData);

    const iconContainer = document.createElement("div");
    iconContainer.className = "camera-icon-container";
    const retakeBtn = document.createElement("button");
    retakeBtn.className = "retake-btn";
    retakeBtn.innerHTML = "<img src='../imagens/refazer.png'>";
    retakeBtn.addEventListener("click", function () {
      iconContainer.remove();
      initCamera();
    });
    iconContainer.appendChild(retakeBtn);
    previewContainer.appendChild(iconContainer);
  }

  // Função para parar a câmera
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (videoElement) {
      videoElement.remove();
      videoElement = null;
    }
    isCameraActive = false;
  }

  openCameraBtn.addEventListener("click", initCamera);

  uploadFileBtn.addEventListener("click", function () {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          displayImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
    fileInput.click();
  });

  previewContainer.addEventListener("dragover", function (e) {
    e.preventDefault();
    if (!isCameraActive) {
      previewContainer.style.borderColor = "#4a3124";
    }
  });

  previewContainer.addEventListener("dragleave", function (e) {
    if (!isCameraActive) {
      previewContainer.style.borderColor = "#103a71";
    }
  });

  previewContainer.addEventListener("drop", function (e) {
    e.preventDefault();
    if (!isCameraActive) {
      previewContainer.style.borderColor = "#103a71";
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
          displayImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  });

  const URL = "./my_model/";
  let model, maxPredictions;

  const acneMapping = {
    "Comedões Abertos": {
      severity: "Leve",
      inflammation: "Não Inflamatória",
      recommendations: [
        "Use um gel de limpeza com Ácido Salicílico (até 2%) para ajudar a dissolver a oleosidade e as células mortas que entopem os poros.",
        "Aplique um hidratante em gel não comedogênico (que não entope os poros) para manter a barreira da pele saudável e evitar a produção excessiva de sebo como rebote.",
        "Lave o rosto duas vezes ao dia (manhã e noite) e após suar muito.",
        "Use um protetor solar oil-free e não comedogênico todos os dias, sem falta.",
        "Troque a fronha do travesseiro a cada 2-3 dias para reduzir o acúmulo de óleo e bactérias.",
        "Evite manipular as lesões para prevenir inflamação.",
      ],
      warning2:
        "As recomendações não substituem o diagnóstico e tratamento profissional. O objetivo é evitar piorar a condição enquanto se busca ajuda médica.",
    },
    "Comedões Fechados": {
      severity: "Leve",
      inflammation: "Não Inflamatória",
      recommendations: [
        "Use um gel de limpeza com Ácido Salicílico (até 2%) para ajudar a dissolver a oleosidade e as células mortas que entopem os poros.",
        "Aplique um hidratante em gel não comedogênico (que não entope os poros) para manter a barreira da pele saudável e evitar a produção excessiva de sebo como rebote.",
        "Lave o rosto duas vezes ao dia (manhã e noite) e após suar muito.",
        "Use um protetor solar oil-free e não comedogênico todos os dias, sem falta.",
        "Troque a fronha do travesseiro a cada 2-3 dias para reduzir o acúmulo de óleo e bactérias.",
        "Evite manipular as lesões para prevenir inflamação.",
      ],
      warning2:
        "As recomendações não substituem o diagnóstico e tratamento profissional. O objetivo é evitar piorar a condição enquanto se busca ajuda médica.",
    },
    Pápulas: {
      severity: "Moderada",
      inflammation: "Inflamatória",
      recommendations: [
        "Use um sérum de Niacinamida (5-10%) para reduzir a vermelhidão, controlar a oleosidade e acalmar a inflamação.",
        "Para as pústulas, use adesivos hidrocoloides (acne patches) durante a noite. Eles protegem a lesão, absorvem o excesso de pus e previnem que você a cutuque.",
        "Use um protetor solar oil-free e não comedogênico todos os dias, sem falta.",
        "Troque a fronha do travesseiro a cada 2-3 dias para reduzir o acúmulo de óleo e bactérias.",
        "Evite manipular as lesões para prevenir inflamação.",
      ],
      warning2:
        "As recomendações não substituem o diagnóstico e tratamento profissional. O objetivo é evitar piorar a condição enquanto se busca ajuda médica.",
    },
    Pústulas: {
      severity: "Moderada",
      inflammation: "Inflamatória",
      recommendations: [
        "Use um sérum de Niacinamida (5-10%) para reduzir a vermelhidão, controlar a oleosidade e acalmar a inflamação.",
        "Para as pústulas, use adesivos hidrocoloides (acne patches) durante a noite. Eles protegem a lesão, absorvem o excesso de pus e previnem que você a cutuque.",
        "Use um protetor solar oil-free e não comedogênico todos os dias, sem falta.",
        "Troque a fronha do travesseiro a cada 2-3 dias para reduzir o acúmulo de óleo e bactérias.",
        "Evite manipular as lesões para prevenir inflamação.",
      ],
      warning2:
        "As recomendações não substituem o diagnóstico e tratamento profissional. O objetivo é evitar piorar a condição enquanto se busca ajuda médica.",
    },
    Nódulos: {
      warning1:
        "Aviso Importante: Estas são formas graves de acne. As dicas abaixo são paliativas para alívio temporário enquanto você busca um dermatologista.",
      severity: "Severa",
      inflammation: "Inflamatória",
      recommendations: [
        "Aplique compressas mornas (não quentes) sobre a área por 5-10 minutos, 2 a 3 vezes ao dia. Isso pode ajudar a aliviar a dor e a circulação, sem forçar a lesão.",
        "Coloque um adesivo hidrocoloides mesmo sem 'cabeça'. Sua função principal será criar uma barreira física, impedindo que você cutuque ou que a lesão sofra atrito, piorando a inflamação.",
        "Use um protetor solar oil-free e não comedogênico todos os dias, sem falta.",
        "Troque a fronha do travesseiro a cada 2-3 dias para reduzir o acúmulo de óleo e bactérias.",
        "Evite manipular as lesões para prevenir inflamação.",
      ],
      warning2:
        "As recomendações não substituem o diagnóstico e tratamento profissional. O objetivo é evitar piorar a condição enquanto se busca ajuda médica.",
    },
    Cistos: {
      warning1:
        "Aviso Importante: Estas são formas graves de acne. As dicas abaixo são paliativas para alívio temporário enquanto você busca um dermatologista.",
      severity: "Severa",
      inflammation: "Inflamatória",
      recommendations: [
        "Aplique compressas mornas (não quentes) sobre a área por 5-10 minutos, 2 a 3 vezes ao dia. Isso pode ajudar a aliviar a dor e a circulação, sem forçar a lesão.",
        "Coloque um adesivo hidrocoloides mesmo sem 'cabeça'. Sua função principal será criar uma barreira física, impedindo que você cutuque ou que a lesão sofra atrito, piorando a inflamação.",
        "Use um protetor solar oil-free e não comedogênico todos os dias, sem falta.",
        "Troque a fronha do travesseiro a cada 2-3 dias para reduzir o acúmulo de óleo e bactérias.",
        "Evite manipular as lesões para prevenir inflamação.",
      ],
      warning2:
        "As recomendações não substituem o diagnóstico e tratamento profissional. O objetivo é evitar piorar a condição enquanto se busca ajuda médica.",
    },
    "Acne Conglobata": {
      warning1:
        "Aviso Crítico: Estas condições requerem tratamento médico urgente com medicamentos de uso oral. Não há cuidados caseiros eficazes. As dicas abaixo visam apenas não piorar a situação até a consulta.",
      severity: "Muito Severa",
      inflammation: "Inflamatória",
      recommendations: [
        "Faça a limpeza da pele apenas com água fria ou morna e um sabonete super suave e sem fragrância (syndet). Evite qualquer produto ativo (ácidos, esfoliantes).",
        "Hidrate com um creme básico, hipoalergênico e reparador de barreira, com ingredientes como ceramidas ou pantenol. O objetivo é acalmar a pele, não tratar a acne.",
        "Use um protetor solar oil-free e não comedogênico todos os dias, sem falta.",
        "Troque a fronha do travesseiro a cada 2-3 dias para reduzir o acúmulo de óleo e bactérias.",
        "Evite manipular as lesões para prevenir inflamação.",
      ],
      warning2:
        "As recomendações não substituem o diagnóstico e tratamento profissional. O objetivo é evitar piorar a condição enquanto se busca ajuda médica.",
    },
    "Acne Fulminans": {
      warning1:
        "Aviso Crítico: Estas condições requerem tratamento médico urgente com medicamentos de uso oral. Não há cuidados caseiros eficazes. As dicas abaixo visam apenas não piorar a situação até a consulta.",
      severity: "Muito Severa",
      inflammation: "Inflamatória",
      recommendations: [
        "Faça a limpeza da pele apenas com água fria ou morna e um sabonete super suave e sem fragrância (syndet). Evite qualquer produto ativo (ácidos, esfoliantes).",
        "Hidrate com um creme básico, hipoalergênico e reparador de barreira, com ingredientes como ceramidas ou pantenol. O objetivo é acalmar a pele, não tratar a acne.",
        "Use um protetor solar oil-free e não comedogênico todos os dias, sem falta.",
        "Troque a fronha do travesseiro a cada 2-3 dias para reduzir o acúmulo de óleo e bactérias.",
        "Evite manipular as lesões para prevenir inflamação.",
      ],
      warning2:
        "As recomendações não substituem o diagnóstico e tratamento profissional. O objetivo é evitar piorar a condição enquanto se busca ajuda médica.",
    },
  };

  async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
  }

// Atualiza analyzeImage para usar a nova verificação
async function analyzeImage(imageElement) {
  if (!isSkinImage(imageElement)) {
    alert("A imagem não parece ser de pele humana ou contém padrões uniformes. Por favor, envie uma foto clara da área afetada pela acne.");
    resetToUploadWidget();
    return;
  }

  const prediction = await model.predict(imageElement);
  let highestPrediction = prediction[0];
  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > highestPrediction.probability) {
      highestPrediction = prediction[i];
    }
  }

  const lesionTypeElement = document.getElementById("lesion-type");
  const lesionTypeText = `${highestPrediction.className}`;
  lesionTypeElement.textContent = lesionTypeText;

  const acneInfo = acneMapping[highestPrediction.className] || {
    severity: "Desconhecida",
    inflammation: "Desconhecida",
    recommendations: ["Consulte um dermatologista para avaliação."],
  };

  document.getElementById("severity-level").textContent = acneInfo.severity;
  document.getElementById("inflammation").textContent = acneInfo.inflammation;
  document.getElementById("warning-rare-text").textContent = acneInfo.warning1 || "";
  document.getElementById("warning-text").textContent = acneInfo.warning2 || "";

  const recommendationsList = document.getElementById("recommendations-list");
  recommendationsList.innerHTML = "";
  acneInfo.recommendations.forEach((rec) => {
    const li = document.createElement("li");
    li.textContent = rec;
    recommendationsList.appendChild(li);
  });

  const now = new Date();
  const analysisData = {
    date: now.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    imageData: imageElement.src,
    lesionType: lesionTypeText,
    severity: acneInfo.severity,
    inflammation: acneInfo.inflammation,
    recommendations: acneInfo.recommendations,
  };

  saveToHistory(analysisData);
}

  window.addEventListener("load", () => {
    loadModel();
  });

  const historyMenuItem = document.querySelectorAll(".menu-item")[1];
  historyMenuItem.addEventListener("click", openModal);

  document.querySelector(".close").addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("historyModal")) {
      closeModal();
    }
  });
});

function saveToHistory(analysisData) {
  let history = JSON.parse(localStorage.getItem("diagnosisHistory")) || [];
  history.unshift(analysisData);
  if (history.length > 50) {
    history = history.slice(0, 50);
  }
  localStorage.setItem("diagnosisHistory", JSON.stringify(history));
  console.log("Análise salva no histórico:", analysisData);
}

function loadHistory() {
  return JSON.parse(localStorage.getItem("diagnosisHistory")) || [];
}

function displayHistory() {
  const history = loadHistory();
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML =
      '<div class="empty-history">Nenhum diagnóstico encontrado no histórico.</div>';
    return;
  }

  history.forEach((item, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.dataset.index = index;

    historyItem.innerHTML = `
      <div class="history-info">
        <div class="history-date">${item.date}</div>
        <div class="history-type">${item.lesionType}</div>
      </div>
      <div class="history-actions">
        <button class="delete-btn" data-index="${index}">🗑️</button>
      </div>
    `;

    historyList.appendChild(historyItem);

    historyItem.addEventListener("click", (e) => {
      if (!e.target.classList.contains("delete-btn")) {
        loadAnalysisFromHistory(index);
        closeModal();
      }
    });

    const deleteBtn = historyItem.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFromHistory(index);
    });
  });
}

function deleteFromHistory(index) {
  let history = loadHistory();
  if (index >= 0 && index < history.length) {
    history.splice(index, 1);
    localStorage.setItem("diagnosisHistory", JSON.stringify(history));
    displayHistory();
  }
}

function loadAnalysisFromHistory(index) {
  const history = loadHistory();
  if (index >= 0 && index < history.length) {
    const analysis = history[index];
    document.querySelector(
      ".history-date"
    ).textContent = `Data: ${analysis.date}`;
    document.getElementById("severity-level").textContent = analysis.severity;
    document.getElementById("lesion-type").textContent = analysis.lesionType;
    document.getElementById("inflammation").textContent = analysis.inflammation;

    const recommendationsList = document.getElementById("recommendations-list");
    recommendationsList.innerHTML = "";
    analysis.recommendations.forEach((rec) => {
      const li = document.createElement("li");
      li.textContent = rec;
      recommendationsList.appendChild(li);
    });

    const previewContainer = document.getElementById("previewContainer");
    previewContainer.innerHTML = "";

    const img = document.createElement("img");
    img.src = analysis.imageData;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    previewContainer.appendChild(img);

    const backButton = document.createElement("button");
    backButton.textContent = "Nova Análise";
    backButton.className = "back-btn";
    backButton.addEventListener("click", resetToUploadWidget);
    previewContainer.appendChild(backButton);
  }
}

function openModal() {
  displayHistory();
  document.getElementById("historyModal").style.display = "block";
}

function closeModal() {
  document.getElementById("historyModal").style.display = "none";
}

const diagnosticoMenuItem = document.querySelectorAll(".menu-item")[0];
diagnosticoMenuItem.addEventListener("click", function () {
  window.location.reload();
});
// Funções para o Modal de Ajuda
const helpMenuItem = document.querySelectorAll(".menu-item")[2];
helpMenuItem.addEventListener("click", openHelpModal);

function openHelpModal() {
  document.getElementById("helpModal").style.display = "block";
  showSlides(slideIndex); // Inicializa o slideshow
}

const helpClose = document.querySelectorAll(".close")[1]; // Assumindo que é o segundo .close (o primeiro é do histórico)
helpClose.addEventListener("click", closeHelpModal);

function closeHelpModal() {
  document.getElementById("helpModal").style.display = "none";
}

// Fechar modal ao clicar fora (adicione ao evento de window existente ou crie um novo)
window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("helpModal")) {
    closeHelpModal();
  }
});

// Lógica para Accordions
const accBtns = document.getElementsByClassName("accordion-btn");
for (let i = 0; i < accBtns.length; i++) {
  accBtns[i].addEventListener("click", function () {
    this.classList.toggle("active");
    const content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}

// Lógica para Slideshow
let slideIndex = 1;

function plusSlides(n) {
  showSlides((slideIndex += n));
}

function showSlides(n) {
  const slides = document.getElementsByClassName("slide");
  if (slides.length === 0) return; // Evita erro se não houver slides
  if (n > slides.length) {
    slideIndex = 1;
  }
  if (n < 1) {
    slideIndex = slides.length;
  }
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slideIndex - 1].style.display = "block";
}


