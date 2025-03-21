const canvas = document.getElementById("canvas");
const guideCanvas = document.getElementById("guideCanvas");

const ctx = canvas.getContext("2d", { willReadFrequently: true });
const guideCtx = guideCanvas.getContext("2d", { willReadFrequently: true });

let isDrawing = false;
let drawings = Array(11).fill(null);
let currentIndex = 0;
let color = "black";
let eraserMode = false;
let lineWidth = 11;
ctx.lineWidth = lineWidth;
let isPlaying = false;

function setColor(newColor) {
  color = newColor;
  eraserMode = false;
  ctx.lineWidth = lineWidth;
}

function setEraser() {
  eraserMode = true;
  ctx.lineWidth = lineWidth * 5;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveDrawing() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  drawings[currentIndex] = imageData;
  updateThumbnail(currentIndex);
}

function updateThumbnail(index) {
  const thumbCanvas = document.getElementById("thumbnails").children[index];
  if (!thumbCanvas) return;
  const thumbCtx = thumbCanvas.getContext("2d");
  thumbCtx.clearRect(0, 0, 50, 50);
  thumbCtx.drawImage(canvas, 0, 0, 50, 50);
}

function initializeThumbnails() {
  const thumbnails = document.getElementById("thumbnails");
  thumbnails.innerHTML = "";
  for (let i = 0; i < 11; i++) {
    const thumb = document.createElement("canvas");
    thumb.width = 50;
    thumb.height = 50;
    thumb.className = "thumbnail";
    thumb.onclick = () => loadDrawing(i);
    thumbnails.appendChild(thumb);
  }
}

function loadDrawing(index) {
  currentIndex = index;
  clearCanvas();
  if (drawings[index]) {
    ctx.putImageData(drawings[index], 0, 0);
  }
  drawGuides(index);
}

function drawGuides(index) {
  guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
  guideCtx.globalAlpha = 0.7;

  if (index > 0 && drawings[index - 1]) {
    guideCtx.putImageData(drawings[index - 1], 0, 0);
  }
  if (index < 10 && drawings[index + 1]) {
    guideCtx.putImageData(drawings[index + 1], 0, 0);
  }

  guideCtx.globalAlpha = 1.0;
}

function playAnimation() {
  if (isPlaying) {
    isPlaying = false;
    guideCanvas.style.display = "block";
    return;
  }

  isPlaying = true;
  guideCanvas.style.display = "none";

  let frame = 0;

  function nextFrame() {
    if (!isPlaying) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (drawings[frame]) {
      ctx.putImageData(drawings[frame], 0, 0);
    }

    frame = (frame + 1) % 11;
    setTimeout(nextFrame, 200);
  }

  nextFrame();
}

function saveGIF() {
  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js",
  });

  let frameCount = 0;

  function addFrame(i) {
    if (i >= 11) {
      if (frameCount > 0) {
        gif.on("finished", function (blob) {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "animation.gif";
          link.click();
        });
        gif.render();
      }
      return;
    }

    if (drawings[i]) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
      tempCtx.putImageData(drawings[i], 0, 0);

      // Canvas 데이터를 직접 Image로 변환
      const img = new Image();
      img.onload = function () {
        gif.addFrame(img, { delay: 200 });
        frameCount++;
        addFrame(i + 1); // 다음 프레임 추가
      };
      img.src = tempCanvas.toDataURL(); // 이미지 URL로 변환
    } else {
      addFrame(i + 1);
    }
  }

  addFrame(0);
}

canvas.addEventListener("mousedown", () => {
  isDrawing = true;
  ctx.beginPath();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  ctx.beginPath();
  saveDrawing();
});

canvas.addEventListener("mousemove", draw);

function draw(event) {
  if (!isDrawing) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = eraserMode ? "white" : color;
  ctx.lineTo(event.offsetX, event.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(event.offsetX, event.offsetY);
}

initializeThumbnails();