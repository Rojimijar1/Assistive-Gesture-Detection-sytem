const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const cursor = document.getElementById('cursor');

// 1. Smoothing & State
let currentX = 0;
let currentY = 0;
const smoothing = 0.2; 
let isPinching = false;

function onResults(results) {
  // Set canvas size to match video feed
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  // 2. Draw the Visual Feedback
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw the actual camera image
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      // Draw the skeleton overlay
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#38bdf8', lineWidth: 5});
      drawLandmarks(canvasCtx, landmarks, {color: '#f87171', lineWidth: 2});

      // 3. Mouse Logic (Index Finger Tip is Landmark 8)
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      const targetX = (1 - indexTip.x) * window.innerWidth;
      const targetY = indexTip.y * window.innerHeight;

      currentX += (targetX - currentX) * smoothing;
      currentY += (targetY - currentY) * smoothing;

      cursor.style.left = `${currentX}px`;
      cursor.style.top = `${currentY}px`;

      // 4. Click Detection
      const distance = Math.sqrt(
        Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2)
      );

      if (distance < 0.05) {
        cursor.classList.add('clicking');
        if (!isPinching) {
          isPinching = true;
          const element = document.elementFromPoint(currentX, currentY);
          if (element && typeof element.click === 'function') {
              element.click();
          }
        }
      } else {
        cursor.classList.remove('clicking');
        isPinching = false;
      }
    }
  }
  canvasCtx.restore();
}

// 5. Modal Helpers
function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('custom-modal').classList.add('modal-visible');
}

function closeModal() {
    document.getElementById('custom-modal').classList.remove('modal-visible');
}

// 6. Initialization
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});
function changeToRandomColor(element) {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    element.style.backgroundColor = randomColor;
    element.style.borderColor = randomColor;
    
    // // Optional: Show the hex code in the modal
    // showModal('Color Changed!', `New Hex Code: ${randomColor.toUpperCase()}`);
}

camera.start();