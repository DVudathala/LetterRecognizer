const canvas = document.getElementById('drawingArea');
const context = canvas.getContext('2d');
const recognizeButton = document.getElementById('recognizeButton');
const clearButton = document.getElementById('clearButton');
const resultDiv = document.getElementById('resultDiv');
const possibleDiv = document.getElementById('possibleDiv');
const networkDiv = document.getElementById('networkDiv');
const body = document.body;

const network = new brain.NeuralNetwork();

clearButton.addEventListener('click', clearCanvas);
recognizeButton.addEventListener('click', recognizeLetter);

let isDrawing = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

animateResult('Fetching JSON...');
fetch('network.json')
  .then(response => {
    return response.json();
  })
  .then(data => {
    network.fromJSON(data);
    animateResult('Neural Net Initialized');
    possibleDiv.innerHTML = 'Please draw a capital letter in the box<br>above and press the <b>Recognize</b> button.';
  })
  .catch(function(error) {
    resultDiv.innerHTML = 'An error occurred:';
    possibleDiv.innerHTML = error.toString();
  });

function startDrawing(event) {
  animateResult('startDrawing');
  body.classList.add('stop-scrolling');
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  lastX = Math.floor((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
  lastY = Math.floor((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
}

function draw(event) {
  animateResult('draw');
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
  const y = Math.floor((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);

  drawLine(lastX, lastY, x, y);

  lastX = x;
  lastY = y;
}

function stopDrawing() {
  animateResult('stopDrawing');
  isDrawing = false;
  body.classList.remove('stop-scrolling');
}

function drawLine(x1, y1, x2, y2) {
  context.strokeStyle = '#3564e6';
  context.lineWidth = 10;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function recognizeLetter() {
  let result = network.run(convertToArray());
  let likelyLetter = '';
  let possibleLetters = [];
  let confidence = 0;

  for (let i = 0; i < 5; i++) {
    confidence = 0;
    for (let likely in result) {
      if (result[likely] > confidence) {
        confidence = result[likely];
        likelyLetter = likely;
      }
    }
    if (i == 0) {
      let outputResult = 'Detected Letter: ' + likelyLetter + '\nConfidence: ' + Math.round(confidence * 100) + '%';
      animateResult(outputResult);
      delete result[likelyLetter];
    }
    else {
      possibleLetters.push(likelyLetter + ': ' + Math.round(confidence * 100) + '%');
      delete result[likelyLetter];
    }
  }
  possibleDiv.innerHTML = 'Other Possible Letters: <br>' + possibleLetters.join('<br>');
}

function convertToArray() {
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = 28;
  resizedCanvas.height = 28;
  const resizedContext = resizedCanvas.getContext('2d');
  resizedContext.drawImage(canvas, 0, 0, 28, 28);
  const resizedImageData = resizedContext.getImageData(0, 0, 28, 28);

  const pixelArray = [];
  for (let i = 3; i < resizedImageData.data.length; i += 4) {
    const grayscaleValue = resizedImageData.data[i];
    pixelArray.push(Math.round((grayscaleValue / 255) * 10) / 10);
  }

  return pixelArray;
}

function animateResult(result) {
  const resultText = result;
  const resultDiv = document.getElementById('resultDiv');
  resultDiv.innerHTML = '';

  const lines = resultText.split('\n');

  lines.forEach((line, lineIndex) => {
    const lineDiv = document.createElement('div');
    resultDiv.appendChild(lineDiv);

    const characters = line.split('');

    characters.forEach((char, charIndex) => {
      setTimeout(() => {
        const span = document.createElement('span');
        span.textContent = char;
        lineDiv.appendChild(span);
        setTimeout(() => {
          span.classList.add('reveal-animation');
        }, 10);
      }, (lineIndex * 150) + (charIndex * 25));
    });
  });
}
