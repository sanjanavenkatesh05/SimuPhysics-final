document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const initialContent = document.getElementById('initial-content');
    const simulationContent = document.getElementById('simulation-content');
    const promptText = document.getElementById('prompt-text');
    const loadingScreen = document.getElementById('loading-screen');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const clearHistoryBtn = document.getElementById('clear-history');

    let isPlaying = false;

    function updateLoadingPosition() {
        const sidebarWidth = sidebar.classList.contains('collapsed') ? 60 : 250;
        loadingScreen.style.left = sidebarWidth + 'px';
        loadingScreen.style.width = `calc(100% - ${sidebarWidth}px)`;
    }

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        const icon = toggleBtn.querySelector('i');
        if (sidebar.classList.contains('collapsed')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
            icon.style.transform = 'rotate(90deg)';
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
            icon.style.transform = 'rotate(0deg)';
        }
        updateLoadingPosition();
    }

    function addToHistory(prompt) {
        let history = JSON.parse(localStorage.getItem('simuHistory') || '[]');
        if (!history.includes(prompt)) {
            history.unshift(prompt);
            if (history.length > 10) history.pop();
            localStorage.setItem('simuHistory', JSON.stringify(history));
        }
        renderHistory();
    }

    function renderHistory() {
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        const history = JSON.parse(localStorage.getItem('simuHistory') || '[]');
        history.forEach(prompt => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.textContent = prompt;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                let history = JSON.parse(localStorage.getItem('simuHistory') || '[]');
                history = history.filter(p => p !== prompt);
                localStorage.setItem('simuHistory', JSON.stringify(history));
                renderHistory();
            };
            li.appendChild(deleteBtn);

            li.onclick = () => loadHistory(prompt);
            list.appendChild(li);
        });
    }

    function loadHistory(prompt) {
        searchInput.value = prompt;
        handleSearch();
    }

    function handleSearch() {
        const prompt = searchInput.value.trim();
        if (!prompt) return; // do nothing if empty

        // Show loading screen
        loadingScreen.classList.remove("hidden");

        // Keep initialContent visible until simulation is ready
        setTimeout(() => {
            // Hide loading screen
            loadingScreen.classList.add("hidden");

            // Update prompt in simulation
            promptText.textContent = prompt;

            // Hide initial chatbot view
            initialContent.classList.add('hidden');
            // Show simulation view
            simulationContent.classList.remove('hidden');

            addToHistory(prompt);
            localStorage.setItem('lastPrompt', prompt);

            // Setup play/pause and reset buttons
            const playPauseBtn = document.getElementById("playPauseBtn");
            const resetBtn = document.getElementById("resetBtn");

            playPauseBtn.onclick = () => {
                isPlaying = !isPlaying;
                if (isPlaying) {
                    Runner.run(runner, engine);
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                } else {
                    Runner.stop(runner);
                    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            };

            resetBtn.onclick = () => {
                resetScene();
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                guiParams.xVelocity = xVelocity;
                guiParams.yVelocity = yVelocity;
                guiParams.blockY = blockY;
                vel.updateDisplay();
            };
        }, 2000);
    }

    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
    });

    document.querySelector('.new-chat').addEventListener('click', () => {
        localStorage.removeItem('lastPrompt');
        searchInput.value = '';
        simulationContent.classList.add('hidden');
        initialContent.classList.remove('hidden');
    });

    toggleBtn.addEventListener('click', toggleSidebar);
    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('simuHistory');
        renderHistory();
    });

    // Initial setup
    updateLoadingPosition();
    renderHistory();
    
    // Load last simulation if available
    const lastPrompt = localStorage.getItem('lastPrompt');
    if (lastPrompt) {
        searchInput.value = lastPrompt;
        // Small delay to ensure DOM is ready
        setTimeout(() => handleSearch(), 100);
    }
});
