import { submitPrompt } from './apiClient.js';

let isPlaying = false;
let playPauseBtn;
let resetBtn;
let currentRunner;
let currentEngine;
let currentParams = [];
let currentScriptUrl = '';

function showError(message) {
    const solutionOutput = document.getElementById('solution-output');
    if (solutionOutput) {
        solutionOutput.innerHTML = message
            ? `<div class="error-msg" style="color:#ef4444; background:rgba(239,68,68,0.1); padding:12px; border-radius:8px; border:1px solid rgba(239,68,68,0.3);"><i class="fa-solid fa-triangle-exclamation"></i> ${message}</div>`
            : '';
    }
}

function showLoader(statusText = 'Computing Vector Embeddings...') {
    const loader = document.getElementById('loading-screen');
    const statusEl = document.getElementById('loading-status');
    if (statusEl) statusEl.textContent = statusText;
    if (loader) loader.classList.remove('hidden');
}

function hideLoader() {
    const loader = document.getElementById('loading-screen');
    if (loader) loader.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const initialContent = document.getElementById('initial-content');
    const simulationContent = document.getElementById('simulation-content');
    const promptText = document.getElementById('prompt-text');
    const historyContainer = document.getElementById('history');
    const sol = document.getElementById('solution-output');
    const backBtn = document.getElementById('back-to-home');
    const newChatBtn = document.getElementById('new-chat-btn');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = id('sidebar');
    const copySolutionBtn = document.getElementById('copy-solution-btn');
    const paramHud = document.getElementById('parameter-hud');
    const controllersArea = document.getElementById('controllers-area');

    function id(str) { return document.getElementById(str); }

    // Sidebar Toggle
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // New Simulation Click
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            stopCurrentSimulation();
            simulationContent.classList.add('hidden');
            initialContent.classList.remove('hidden');
            if (searchInput) searchInput.value = '';
            showError('');
        });
    }

    // Back to Home Generator
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            stopCurrentSimulation();
            simulationContent.classList.add('hidden');
            initialContent.classList.remove('hidden');
        });
    }

    // Prompt Suggestions Chips
    const promptChips = document.querySelectorAll('.prompt-chip');
    promptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptValue = chip.getAttribute('data-prompt');
            if (promptValue && searchInput) {
                searchInput.value = promptValue;
                handleSearch();
            }
        });
    });

    // Copy Solution to Clipboard
    if (copySolutionBtn) {
        copySolutionBtn.addEventListener('click', () => {
            if (!sol) return;
            const textToCopy = sol.innerText || sol.textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalHtml = copySolutionBtn.innerHTML;
                copySolutionBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
                setTimeout(() => {
                    copySolutionBtn.innerHTML = originalHtml;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }

    function stopCurrentSimulation() {
        if (currentRunner) {
            try { Matter.Runner.stop(currentRunner); } catch (e) { }
            currentRunner = null;
        }
        currentEngine = null;
        isPlaying = false;
    }

    function loadScript(url, callback) {
        const simContainer = document.getElementById('simulation-container');
        if (simContainer) {
            const oldCanvas = simContainer.querySelector('canvas');
            if (oldCanvas) oldCanvas.remove();
            const oldControls = simContainer.querySelectorAll('.simulation-controls, .controls-overlay');
            oldControls.forEach((node) => node.remove());
        }

        const existingScript = document.getElementById('dynamic-sim-script');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'dynamic-sim-script';
        script.type = 'text/javascript';
        script.async = false;
        script.src = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;

        script.onload = () => {
            console.log(`Simulation script loaded: ${url}`);
            if (callback) callback();
        };

        script.onerror = () => {
            console.error(`Error loading script: ${url}`);
            showError('The simulation script could not be loaded.');
            hideLoader();
        };

        document.head.appendChild(script);
    }

    function renderParameterControllers(parameters) {
        if (!controllersArea || !paramHud) return;
        controllersArea.innerHTML = '';

        if (!Array.isArray(parameters) || parameters.length === 0) {
            paramHud.classList.add('hidden');
            return;
        }

        let hasValidParams = false;

        parameters.forEach((paramObj, index) => {
            if (typeof paramObj !== 'object' || paramObj === null) return;

            Object.entries(paramObj).forEach(([key, val]) => {
                hasValidParams = true;
                const numVal = (val !== null && !isNaN(Number(val))) ? Number(val) : 10;

                const card = document.createElement('div');
                card.className = 'param-card';

                const label = document.createElement('div');
                label.className = 'param-label';
                label.innerHTML = `<span>${key.toUpperCase()}</span> <span class="param-value" id="val-${index}">${numVal}</span>`;

                const slider = document.createElement('input');
                slider.type = 'range';
                slider.className = 'param-slider';
                slider.min = Math.floor(numVal * 0.1) || 1;
                slider.max = Math.ceil(numVal * 3.0) || 100;
                slider.step = (slider.max - slider.min) > 20 ? 1 : 0.1;
                slider.value = numVal;

                slider.addEventListener('input', (e) => {
                    const newNum = Number(e.target.value);
                    const valEl = document.getElementById(`val-${index}`);
                    if (valEl) valEl.textContent = newNum;

                    // Update live parameter in parameter array
                    currentParams[index][key] = newNum;

                    // Re-trigger simulation restart with updated parameters
                    if (typeof startSimulation === 'function') {
                        stopCurrentSimulation();
                        const oldCanvas = document.getElementById('simulation-container').querySelector('canvas');
                        if (oldCanvas) oldCanvas.remove();

                        const { engine, runner } = startSimulation(currentParams);
                        currentEngine = engine;
                        currentRunner = runner;
                    }
                });

                card.appendChild(label);
                card.appendChild(slider);
                controllersArea.appendChild(card);
            });
        });

        if (hasValidParams) {
            paramHud.classList.remove('hidden');
        } else {
            paramHud.classList.add('hidden');
        }
    }

    function handleSearch() {
        const prompt = searchInput.value.trim();
        if (!prompt) return;

        showError('');
        showLoader('Computing Vector Embeddings...');

        submitPrompt(prompt)
            .then((data) => {
                console.log('Response from server:', data);

                if (!data.success) {
                    hideLoader();
                    showError(data.error || 'Unable to process your request.');
                    return;
                }

                showLoader('Loading Physics Simulation Engine...');

                promptText.textContent = data.received;
                initialContent.classList.add('hidden');
                simulationContent.classList.remove('hidden');
                addToHistory(data.received);

                currentScriptUrl = data.scriptUrl;
                currentParams = Array.isArray(data.parameters) ? data.parameters : [];

                // Render dynamic parameter sliders
                renderParameterControllers(currentParams);

                loadScript(currentScriptUrl, () => {
                    console.log(`Script ${currentScriptUrl} loaded.`);

                    try {
                        if (typeof window.startSimulation === 'function') {
                            stopCurrentSimulation();
                            const { engine, runner } = window.startSimulation(currentParams);
                            currentEngine = engine;
                            currentRunner = runner;

                            const solution = data.solution;
                            if (sol) {
                                if (typeof solution === 'string') {
                                    sol.innerHTML = solution;
                                } else {
                                    sol.textContent = JSON.stringify(solution, null, 2);
                                }
                            }
                        } else {
                            console.error('`startSimulation` function not found in loaded script.');
                            showError('The selected simulation could not be started.');
                        }

                        // Setup controls
                        const oldPlayPauseBtn = document.getElementById('playPauseBtn');
                        const oldResetBtn = document.getElementById('resetBtn');

                        if (oldPlayPauseBtn && oldResetBtn) {
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

                                if (typeof window.resetScene === 'function') {
                                    window.resetScene();
                                }
                            });
                        }
                    } catch (err) {
                        console.error('Simulation startup failed:', err);
                        showError(err.message || 'The simulation could not be initialized.');
                    }

                    hideLoader();
                });
            })
            .catch((err) => {
                hideLoader();
                console.error('Error sending prompt:', err);
                showError(err.message || 'Unable to process your request right now.');
            });
    }

    function addToHistory(text) {
        if (!historyContainer) return;

        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.title = text;
        historyItem.textContent = text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'history-item-delete';
        deleteBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            historyItem.remove();
        });

        historyItem.appendChild(deleteBtn);

        historyItem.addEventListener('click', () => {
            if (searchInput) searchInput.value = text;
            handleSearch();
        });

        historyContainer.prepend(historyItem);
    }

    if (searchButton) searchButton.addEventListener('click', handleSearch);

    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
});