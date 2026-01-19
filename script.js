const displayText = document.getElementById('display-text');
const selectionKnob = document.getElementById('selection-knob');
const adjustmentKnob = document.getElementById('adjustment-knob');
const okButton = document.getElementById('ok-button');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const backButton = document.getElementById('back-button');

// Constants for knob rotation calculations
const MODE_DEGREES_PER_STEP = 45; // 360° / 8 modes
const POWER_DEGREES_PER_LEVEL = 36; // 360° / 10 power levels
const TIMER_DEGREES_PER_STEP = 6; // For timer granularity

// Constants for UI timeouts (in milliseconds)
const SHORT_MESSAGE_TIMEOUT = 1000;
const MEDIUM_MESSAGE_TIMEOUT = 1500;
const LONG_MESSAGE_TIMEOUT = 2000;
const COMPLETION_MESSAGE_TIMEOUT = 3000;

// State variables
let mode = '';
let modeIndex = 0;
let power = 0;
let timerMinutes = 0;
let isTimerSet = false;
let isCooking = false;
let countdownInterval = null;

// Available modes
const modes = ['Off', 'MW', 'MW + air', 'Grill', 'Turbo Grill', 'Grill + MW', 'Grill + MW + air', 'Grill + air'];

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
    // Handle 360°/0° boundary crossing
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;
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

// Reset state to initial values
function resetState() {
    mode = '';
    modeIndex = 0;
    power = 0;
    timerMinutes = 0;
    isTimerSet = false;
    updateDisplay();
}

// Shared function to stop cooking process
function stopCooking() {
    isCooking = false;
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    startButton.textContent = 'Start';
}

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
    
    // Calculate mode index based on rotation
    const newModeIndex = Math.floor(normalizedRotation / MODE_DEGREES_PER_STEP) % modes.length;
    
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
    if (!mode || mode === 'Off') {
        displayText.textContent = 'Please select a cooking mode!';
        return;
    }
    
    // Normalize rotation to 0-360 range
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    
    if (!isTimerSet) {
        // Setting power (1-10 range)
        power = Math.floor(normalizedRotation / POWER_DEGREES_PER_LEVEL) + 1;
        if (power > 10) power = 10;
        updateDisplay();
    } else {
        // Setting timer after OK pressed (0-300 minutes in steps of 5)
        timerMinutes = Math.floor(normalizedRotation / TIMER_DEGREES_PER_STEP) * 5;
        if (timerMinutes > 300) timerMinutes = 300; // Max 5 hours
        updateDisplay();
    }
});

// OK button - confirms power and allows setting timer, then starts cooking
okButton.addEventListener('click', () => {
    if (!mode || mode === 'Off') {
        displayText.textContent = 'Please select a cooking mode!';
        setTimeout(updateDisplay, LONG_MESSAGE_TIMEOUT);
        return;
    }
    
    if (power === 0) {
        displayText.textContent = 'Please set power first!';
        setTimeout(updateDisplay, LONG_MESSAGE_TIMEOUT);
        return;
    }
    
    if (!isTimerSet) {
        // First click: confirm power and allow setting timer
        isTimerSet = true;
        timerMinutes = 0;
        displayText.textContent = 'Set timer with adjustment knob';
        return;
    }
    
    // Second click: start cooking if timer is set
    if (timerMinutes === 0) {
        displayText.textContent = 'Please set timer first!';
        setTimeout(updateDisplay, LONG_MESSAGE_TIMEOUT);
        return;
    }
    
    if (isCooking) {
        displayText.textContent = 'Already cooking!';
        setTimeout(updateDisplay, SHORT_MESSAGE_TIMEOUT);
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
            setTimeout(resetState, COMPLETION_MESSAGE_TIMEOUT);
        } else {
            displayText.textContent = `COOKING: ${mode} | Power: ${power} | ${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
});

// Start button - begins cooking countdown
startButton.addEventListener('click', () => {
    if (!mode || mode === 'Off' || power === 0 || timerMinutes === 0) {
        displayText.textContent = 'Set mode, power, and timer first!';
        setTimeout(updateDisplay, LONG_MESSAGE_TIMEOUT);
        return;
    }
    
    if (isCooking) {
        // Stop cooking
        stopCooking();
        displayText.textContent = 'Cooking stopped';
        setTimeout(updateDisplay, LONG_MESSAGE_TIMEOUT);
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
            setTimeout(resetState, COMPLETION_MESSAGE_TIMEOUT);
        } else {
            displayText.textContent = `COOKING: ${mode} | Power: ${power} | ${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
});

// Stop button - stops cooking process
stopButton.addEventListener('click', () => {
    if (isCooking) {
        stopCooking();
        displayText.textContent = 'Cooking stopped';
        setTimeout(updateDisplay, LONG_MESSAGE_TIMEOUT);
    } else {
        displayText.textContent = 'Not cooking';
        setTimeout(updateDisplay, SHORT_MESSAGE_TIMEOUT);
    }
});

// Back button - resets to previous state or clears settings
// Note: Requires user to stop cooking first (via Stop button) to prevent accidental interruption
backButton.addEventListener('click', () => {
    if (isCooking) {
        displayText.textContent = 'Stop cooking first!';
        setTimeout(updateDisplay, SHORT_MESSAGE_TIMEOUT);
        return;
    }
    
    if (isTimerSet) {
        // Go back from timer setting to power setting
        isTimerSet = false;
        timerMinutes = 0;
        displayText.textContent = 'Timer cleared. Back to power setting.';
        setTimeout(updateDisplay, MEDIUM_MESSAGE_TIMEOUT);
    } else if (power > 0) {
        // Go back from power setting to mode selection
        power = 0;
        displayText.textContent = 'Power cleared. Adjust mode if needed.';
        setTimeout(updateDisplay, MEDIUM_MESSAGE_TIMEOUT);
    } else {
        // Reset everything
        resetState();
        displayText.textContent = 'All settings cleared';
        setTimeout(() => {
            displayText.textContent = 'Select mode';
        }, MEDIUM_MESSAGE_TIMEOUT);
    }
});
