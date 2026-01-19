const displayText = document.getElementById('display-text');
const selectionKnob = document.getElementById('selection-knob');
const adjustmentKnob = document.getElementById('adjustment-knob');
const okButton = document.getElementById('ok-button');
const startButton = document.getElementById('start-button');

// State variables
let mode = '';
let modeIndex = 0;
let power = 0;
let timerMinutes = 0;
let isTimerSet = false;
let isCooking = false;
let countdownInterval = null;

// Available modes
const modes = ['Forced air', 'Forced air + MW', 'Grill', 'Turbo Grill', 'Grill + MW'];

// Knob rotation handler with shared event listeners
let activeKnob = null;
let isDragging = false;
let startAngle = 0;
let currentRotation = 0;
let onRotateCallback = null;

function makeKnobRotatable(knob, onRotate) {
    knob.addEventListener('mousedown', (e) => {
        activeKnob = knob;
        isDragging = true;
        currentRotation = parseFloat(knob.dataset.rotation) || 0;
        onRotateCallback = onRotate;
        
        const rect = knob.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    });
}

// Shared mousemove handler
document.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeKnob) return;
    
    const rect = activeKnob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    
    let deltaAngle = currentAngle - startAngle;
    currentRotation += deltaAngle;
    startAngle = currentAngle;
    
    activeKnob.style.transform = `rotate(${currentRotation}deg)`;
    activeKnob.dataset.rotation = currentRotation;
    
    if (onRotateCallback) {
        onRotateCallback(currentRotation);
    }
});

// Shared mouseup handler
document.addEventListener('mouseup', () => {
    isDragging = false;
    activeKnob = null;
    onRotateCallback = null;
});

// Update display
function updateDisplay() {
    if (isCooking) {
        displayText.textContent = `COOKING: ${mode} | Power: ${power} | Time: ${timerMinutes} min`;
    } else if (isTimerSet && timerMinutes > 0) {
        displayText.textContent = `${mode} | Power: ${power} | Timer: ${timerMinutes} min`;
    } else if (mode && power > 0) {
        displayText.textContent = `${mode} | Power: ${power}`;
    } else if (mode) {
        displayText.textContent = `Mode: ${mode}`;
    } else {
        displayText.textContent = 'Select mode';
    }
}

// Selection knob handler
makeKnobRotatable(selectionKnob, (rotation) => {
    // Normalize rotation to 0-360 range
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    
    // Calculate mode index based on rotation (5 modes, so 72 degrees per mode)
    const newModeIndex = Math.floor(normalizedRotation / 72) % 5;
    
    if (newModeIndex !== modeIndex) {
        modeIndex = newModeIndex;
        mode = modes[modeIndex];
        // Reset power and timer when mode changes
        power = 0;
        timerMinutes = 0;
        isTimerSet = false;
        updateDisplay();
    }
});

// Adjustment knob handler
makeKnobRotatable(adjustmentKnob, (rotation) => {
    if (!mode) {
        displayText.textContent = 'Please select mode first!';
        return;
    }
    
    // Normalize rotation to 0-360 range
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    
    if (!isTimerSet) {
        // Setting power (1-10 range)
        power = Math.floor(normalizedRotation / 36) + 1;
        if (power > 10) power = 10;
        updateDisplay();
    } else {
        // Setting timer after OK pressed (0-300 minutes in steps of 5)
        timerMinutes = Math.floor(normalizedRotation / 6) * 5;
        if (timerMinutes > 300) timerMinutes = 300; // Max 5 hours
        updateDisplay();
    }
});

// OK button - confirms power and allows setting timer
okButton.addEventListener('click', () => {
    if (!mode) {
        displayText.textContent = 'Please select mode first!';
        setTimeout(updateDisplay, 2000);
        return;
    }
    
    if (power === 0) {
        displayText.textContent = 'Please set power first!';
        setTimeout(updateDisplay, 2000);
        return;
    }
    
    isTimerSet = true;
    timerMinutes = 0;
    displayText.textContent = 'Set timer with adjustment knob';
});

// Start button - begins cooking countdown
startButton.addEventListener('click', () => {
    if (!mode || power === 0 || timerMinutes === 0) {
        displayText.textContent = 'Set mode, power, and timer first!';
        setTimeout(updateDisplay, 2000);
        return;
    }
    
    if (isCooking) {
        // Stop cooking
        isCooking = false;
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        startButton.textContent = 'Start';
        displayText.textContent = 'Cooking stopped';
        setTimeout(() => {
            timerMinutes = 0;
            isTimerSet = false;
            power = 0;
            updateDisplay();
        }, 2000);
        return;
    }
    
    // Start cooking
    isCooking = true;
    startButton.textContent = 'Stop';
    
    let remainingSeconds = timerMinutes * 60;
    
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            isCooking = false;
            startButton.textContent = 'Start';
            displayText.textContent = 'DONE! Enjoy your meal!';
            setTimeout(() => {
                mode = '';
                power = 0;
                timerMinutes = 0;
                isTimerSet = false;
                updateDisplay();
            }, 3000);
        } else {
            displayText.textContent = `COOKING: ${mode} | Power: ${power} | ${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
});
