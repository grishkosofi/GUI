const displayText = document.getElementById('display-text');
const selectionKnob = document.getElementById('selection-knob');
const adjustmentKnob = document.getElementById('adjustment-knob');
const okButton = document.getElementById('ok-button');
const startButton = document.getElementById('start-button');

let mode = '';
let power = '';
let time = '';

selectionKnob.addEventListener('click', () => {
    mode = 'Forced air'; // Placeholder logic; replace with actual rotation detection logic
    displayText.textContent = `Mode: ${mode}`;
});

adjustmentKnob.addEventListener('click', () => {
    if (!mode) {
        alert('Please select a mode first!');
        return;
    }
    power = 'Medium'; // Placeholder logic; replace with actual rotation detection logic
    displayText.textContent = `Mode: ${mode}, Power: ${power}`;
});

okButton.addEventListener('click', () => {
    if (!mode || !power) {
        alert('Please select mode and power first!');
        return;
    }
    time = '30 minutes'; // Placeholder logic; replace with actual rotation detection logic
    displayText.textContent = `Mode: ${mode}, Power: ${power}, Timer: ${time}`;
});

startButton.addEventListener('click', () => {
    if (!mode || !power || !time) {
        alert('Please set all parameters first!');
        return;
    }
    displayText.textContent = `Cooking: Mode: ${mode}, Power: ${power}, Timer: ${time}`;
});
