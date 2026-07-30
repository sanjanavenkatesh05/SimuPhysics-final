import { submitPrompt } from './apiClient.js';

let isPlaying = false;
let playPauseBtn;
let resetBtn;
let currentRunner;
let currentEngine;

function showError(message) {
    const solutionOutput = document.getElementById('solution-output');
    if (solutionOutput) {
        solutionOutput.innerHTML = message ? `<p class="error">${message}</p>` : '';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const initialContent = document.getElementById('initial-content');
    const simulationContent = document.getElementById('simulation-content');
    const promptText = document.getElementById('prompt-text');
    const historyContainer = document.getElementById('history');
    const sol = document.getElementById('solution-output');

    function loadScript(url, callback) {
        const oldScript = document.getElementById('dynamic-sim-script');
        if (oldScript) {
            oldScript.remove();
        }

        const simContainer = document.getElementById('simulation-content');
        const oldCanvas = simContainer.querySelector('canvas');
        if (oldCanvas) {
            oldCanvas.remove();
        }

        const script = document.createElement('script');
        script.id = 'dynamic-sim-script';
        script.type = 'text/javascript';
        script.src = url;

        script.onload = () => {
            console.log(`Script loaded: ${url}`);
            if (callback) callback();
        };

        script.onerror = () => {
            console.error(`Error loading script: ${url}`);
            showError('The simulation script could not be loaded.');
        };

        document.head.appendChild(script);
    }

    function handleSearch() {
        const prompt = searchInput.value.trim();
        if (!prompt) return;

        showError('');
        searchInput.value = '';

        submitPrompt(prompt)
            .then((data) => {
                console.log('Response from server:', data);

                if (!data.success) {
                    console.error('Server returned an error:', data.error);
                    showError(data.error || 'Unable to process your request.');
                    return;
                }

                promptText.textContent = data.received;
                initialContent.classList.add('hidden');
                simulationContent.classList.remove('hidden');
                addToHistory(data.received);

                const scriptUrl = data.scriptUrl;
                const simulationParams = Array.isArray(data.parameters) ? data.parameters : [];

                if (!simulationParams.length) {
                    console.error('No valid parameters were returned by the server.');
                    showError('The server did not return usable simulation parameters.');
                    return;
                }

                loadScript(scriptUrl, () => {
                    console.log(`Script ${scriptUrl} loaded and executed.`);

                    if (typeof startSimulation === 'function') {
                        const { engine, runner } = startSimulation(simulationParams);
                        currentEngine = engine;
                        currentRunner = runner;
                        const solution = data.solution;
                        sol.textContent = typeof solution === 'string' ? solution : JSON.stringify(solution, null, 2);
                    } else {
                        console.error('`startSimulation` function not found in loaded script.');
                        showError('The selected simulation could not be started.');
                    }

                    const oldPlayPauseBtn = document.getElementById('playPauseBtn');
                    const oldResetBtn = document.getElementById('resetBtn');
                    playPauseBtn = oldPlayPauseBtn.cloneNode(true);
                    resetBtn = oldResetBtn.cloneNode(true);
                    oldPlayPauseBtn.parentNode.replaceChild(playPauseBtn, oldPlayPauseBtn);
                    oldResetBtn.parentNode.replaceChild(resetBtn, oldResetBtn);

                    isPlaying = false;
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

                    playPauseBtn.addEventListener('click', function () {
                        if (!currentRunner || !currentEngine) return;

                        isPlaying = !isPlaying;
                        if (isPlaying) {
                            Matter.Runner.run(currentRunner, currentEngine);
                            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        } else {
                            Matter.Runner.stop(currentRunner);
                            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                        }
                    });

                    resetBtn.addEventListener('click', function () {
                        if (!currentEngine) return;

                        isPlaying = false;
                        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

                        if (typeof resetScene === 'function') {
                            resetScene();
                        }
                    });
                });
            })
            .catch((err) => {
                console.error('Error sending prompt:', err);
                showError(err.message || 'Unable to process your request right now.');
            });
    }

    function addToHistory(text) {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.textContent = text;

        historyItem.addEventListener('click', () => {
            searchInput.value = text;
            handleSearch();
        });

        historyContainer.prepend(historyItem);
    }

    searchButton.addEventListener('click', handleSearch);

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    const newChatButton = document.querySelector('.new-chat');
    newChatButton.addEventListener('click', function () {
        location.reload();
    });
});