let isPlaying = false;
let playPauseBtn;
let resetBtn;

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const initialContent = document.getElementById('initial-content');
    const simulationContent = document.getElementById('simulation-content');
    const promptText = document.getElementById('prompt-text');
    const historyContainer = document.getElementById("history");

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
        .then(res => res.json())
        .then(data => {
            console.log("Response from server:", data);

            // Display the prompt in the simulation view
            promptText.textContent = data.received;

            // Switch from initial view to simulation view
            initialContent.classList.add('hidden');
            simulationContent.classList.remove('hidden');

            // Save query to history
            addToHistory(data.received);

            // Attach play/pause + reset functionality
            playPauseBtn = document.getElementById("playPauseBtn");
            resetBtn = document.getElementById("resetBtn");

            playPauseBtn.addEventListener("click", function() {
                isPlaying = !isPlaying;

                if (isPlaying) {
                    Runner.run(runner, engine);
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    console.log("Simulation playing");
                } else {
                    Runner.stop(runner);
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    console.log("Simulation paused");
                }
            });

            resetBtn.addEventListener("click", function() {
                isPlaying = false;
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                console.log("Simulation reset");
                resetScene();
            });
        })
        .catch(err => {
            console.error("Error sending prompt:", err);
        });

        searchInput.value = "";
    }

    // Add prompt to history panel
    function addToHistory(text) {
        const item = document.createElement("div");
        item.classList.add("history-item");
        item.textContent = text;

        // Reload prompt when clicked
        item.addEventListener("click", () => {
            promptText.textContent = text;
            initialContent.classList.add("hidden");
            simulationContent.classList.remove("hidden");
        });

        historyContainer.prepend(item); // newest on top
    }

    // Event listeners
    searchButton.addEventListener('click', handleSearch);

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // New chat button functionality to reset the interface
    const newChatButton = document.querySelector('.new-chat');
    newChatButton.addEventListener('click', function() {
        searchInput.value = '';
        simulationContent.classList.add('hidden');
        initialContent.classList.remove('hidden');
    });
});
