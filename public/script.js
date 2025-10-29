// These variables must be in a scope accessible by the reset function
let isPlaying = false;
let playPauseBtn;
let resetBtn;
let currentRunner; // Store the current runner to stop/reset
let currentEngine; // Store the current engine to clear

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const initialContent = document.getElementById('initial-content');
    const simulationContent = document.getElementById('simulation-content');
    const promptText = document.getElementById('prompt-text');
    const historyContainer = document.getElementById("history");
    const sol=document.getElementById("solution-output");


    // --- (ADD THIS) ---
    /**
     * Dynamically loads a script file and executes it.
     * @param {string} url - The URL of the script to load.
     * @param {function} callback - A function to call after the script has loaded.
     */
    function loadScript(url, callback) {
        // First, remove any old simulation script to avoid conflicts
        const oldScript = document.getElementById('dynamic-sim-script');
        if (oldScript) {
            oldScript.remove();
        }

        // Clear the old simulation canvas (if any)
        // Assumes your sim scripts add a canvas to 'simulation-content'
        const simContainer = document.getElementById('simulation-content');
        const oldCanvas = simContainer.querySelector('canvas');
        if (oldCanvas) {
            oldCanvas.remove();
        }

        // Create the new script
        const script = document.createElement('script');
        script.id = 'dynamic-sim-script'; // Give it an ID to find it later
        script.type = 'text/javascript';
        script.src = url;

        script.onload = () => {
            console.log(`Script loaded: ${url}`);
            if (callback) callback();
        };

        script.onerror = () => {
            console.error(`Error loading script: ${url}`);
        };

        document.head.appendChild(script);
    }
    // --- (END ADD) ---


    // Function to handle search submission
    function handleSearch() {
        const prompt = searchInput.value.trim();
        if (!prompt) return;

        // Send prompt to backend Express API
        fetch("http://localhost:3000/api/prompt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Response from server:", data);

            if (!data.success) {
                console.error("Server returned an error:", data.error);
                return;
            }

            // --- (MODIFY THIS SECTION) ---

            // Display the prompt in the simulation view
            promptText.textContent = data.received;

            // Switch from initial view to simulation view
            initialContent.classList.add('hidden');
            simulationContent.classList.remove('hidden');

            // Save query to history
            addToHistory(data.received);

            // 1. Get the new data from the server
            const scriptUrl = data.scriptUrl;     // e.g., "/sims/projectile.js"
            
            // 2. Parse the parameters
// 2. Parse the parameters
            const paramString = data.parameters; // Get the raw string from the AI

            try {
                // --- Robust JSON Parsing ---
                
                // 1. Find the first '[' and the last ']'
                const startIndex = paramString.indexOf('[');
                const endIndex = paramString.lastIndexOf(']');

                // 2. Check if we found a valid array structure
                if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
                    // If we can't find a valid [ ... ], throw an error
                    throw new Error("AI response did not contain a valid JSON array.");
                }

                // 3. Extract *only* the text between the first [ and last ]
                const jsonString = paramString.substring(startIndex, endIndex + 1);

                // 4. Try to parse the *cleaned* string
                simulationParams = JSON.parse(jsonString);
                console.log("Parsed parameters:", simulationParams);

            } catch (e) {
                console.error("Failed to parse parameters from AI:", e.message);
                // Log the original, problematic string for debugging
                console.error("Original AI response string:", paramString); 
                return; // Stop if params are bad
            }

            // 3. Load the new simulation script
            loadScript(scriptUrl, () => {
                console.log(`Script ${scriptUrl} loaded and executed.`);
                
                // 4. Start the simulation, passing it the parameters
                //    We assume your "projectile.js" (etc.) file defines
                //    a *global function* called `startSimulation`.
                if (typeof startSimulation === 'function') {
                    
                    // The startSimulation function MUST return the
                    // engine and runner so we can control them
                    console.log("inside the if block that returns true if it finds the function and stuff");
                    const {engine,runner} = startSimulation(simulationParams); 
                    currentEngine=engine;
                    currentRunner=runner;
                    let solution=data.solution;
                    console.log(typeof(data.solution));
                    sol.innerHTML=JSON.stringify(solution);


                } else {
                    console.error("`startSimulation` function not found in loaded script.");
                }

                // 5. Attach play/pause + reset functionality
                //    We do this *inside* the callback to ensure it's
                //    all set up *after* the script is loaded.
                
                // Remove old listeners to prevent bugs
                const oldPlayPauseBtn = document.getElementById("playPauseBtn");
                const oldResetBtn = document.getElementById("resetBtn");
                playPauseBtn = oldPlayPauseBtn.cloneNode(true);
                resetBtn = oldResetBtn.cloneNode(true);
                oldPlayPauseBtn.parentNode.replaceChild(playPauseBtn, oldPlayPauseBtn);
                oldResetBtn.parentNode.replaceChild(resetBtn, oldResetBtn);

                // Set initial state
                isPlaying = false;
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

                playPauseBtn.addEventListener("click", function() {
                    if (!currentRunner || !currentEngine) return;
                    
                    isPlaying = !isPlaying;
                    if (isPlaying) {
                        Matter.Runner.run(currentRunner, currentEngine);
                        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        console.log("Simulation playing");
                    } else {
                        Matter.Runner.stop(currentRunner);
                        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                        console.log("Simulation paused");
                    }
                });

                resetBtn.addEventListener("click", function() {
                    if (!currentEngine) return;

                    isPlaying = false;
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    console.log("Simulation reset");
                    
                    // We also assume your scripts define a 'resetScene' function
                    if (typeof resetScene === 'function') {
                        resetScene();
                    }
                });
            });

            // --- (END MODIFY) ---
        })
        .catch(err => {
            console.error("Error sending prompt:", err);
        });

        searchInput.value = "";
    }

    // Add prompt to history panel (no changes)
    // Add prompt to history panel
// Add prompt to history panel
 function addToHistory(text) {
 // 1. Create a new div element for the history item
const historyItem = document.createElement('div');
 
 // 2. Add a class for styling (e.g., in your CSS file)
historyItem.classList.add('history-item');
 
 // 3. Set its text to the prompt text (using textContent for safety)
 historyItem.textContent = text;
 
 // 4. Add a click event listener to make it interactive
 historyItem.addEventListener('click', () => {
 // When clicked, put the text back in the search bar
 searchInput.value = text;
// And re-run the search
 handleSearch();
 });
 
 // 5. Add the new item to the *top* of the history container
 historyContainer.prepend(historyItem);
 }

    // Event listeners (no changes)
    searchButton.addEventListener('click', handleSearch);

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // New chat button (no changes)
const newChatButton = document.querySelector('.new-chat');
newChatButton.addEventListener('click', function() {
    // Reload the entire page
    location.reload();
});
});