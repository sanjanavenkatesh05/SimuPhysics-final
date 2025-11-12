// pulley_canvas.js - Canvas-based Pulley System Simulation
const defaultValues={
    mass1Value: 1,
    mass2Value: 2
};
function startSimulation(parameters){

    //step 3: since gemini will return a string, convert it back to an object using JSON.parse() function
    //parameters=JSON.parse(parameters);
    const {
  Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint,
  Constraint, Composite, Events, Body
} = Matter;

// create engine and world
let engine = Engine.create();
let world = engine.world;

// create renderer
let render = Render.create({
  element: document.querySelector('.simulation-container'),
  engine: engine,
  options: {
    width: 800,
    height: 600,
    wireframes: false,
    background: '#222'
  }
});

// create mouse constraint
let mouse = Mouse.create(render.canvas);
let mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: {
      visible: false
    }
  }
});

// Add mouse constraint to world
World.add(world, mouseConstraint);

// keep the mouse in sync with rendering
render.mouse = mouse;

Render.run(render);

// runner
let runner = Runner.create();
///////absloutely common to all


//step 4 (very important) go through the variables present in parameters and check if any value is null. if its null, assign the default value in the following format (its the most efficient.)
    let mass1Value = parameters?.mass1Value ?? defaultValues.mass1Value;
    let mass2Value = parameters?.mass2Value ?? defaultValues.mass2Value;
   
// Global variables
let canvas, ctx;
let gravity = 9.81; // m/s^2
let pulleyRadius = 50; // pixels

let position = 0; // Initial position of mass 1 relative to the pulley center (positive is down)
let velocity = 0; // Initial velocity
let lastTime = 0;
let animationId = null;
let isRunning = false;

// Pulley and mass positions (relative to canvas)
let pulleyX, pulleyY;

// Physics variables
let acceleration = 0;
let tension = 0; // Tension in the string

// Ground parameters (to match projectile simulation)
const groundHeight = 50;
let groundY;

// String length parameters
const initialStringLength = 200; // Longer string

function initPulleyCanvas() {
    // Create canvas
    const container = document.querySelector('.simulation-container') || document.body;
    
    // Clear container
    container.innerHTML = `
        <canvas id="pulleyCanvas" width="800" height="600"></canvas>
        <div class="controls">
            <button id="resetBtn" class="reset">
                <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button id="playPauseBtn" class="play">
                <i class="fa-solid fa-play"></i>
            </button>
        </div>
    `;
    
    canvas = document.getElementById('pulleyCanvas');
    ctx = canvas.getContext('2d');
    
    // Set positions
    pulleyX = canvas.width / 2;
    pulleyY = canvas.height / 3;
    groundY = canvas.height - groundHeight / 2;
    
    // Calculate initial tension
    calculateTension();
    
    // Draw initial state
    draw();
    
    // Setup event listeners for buttons
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    playPauseBtn.addEventListener('click', function() {
        isRunning = !isRunning;
        
        if (isRunning) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            lastTime = 0; // Reset time tracking
            animationId = requestAnimationFrame(animate);
        } else {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }
    });
    
    resetBtn.addEventListener('click', function() {
        // Cancel any ongoing animation
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        // Reset simulation variables
        position = 0;
        velocity = 0;
        lastTime = 0;
        isRunning = false;
        
        // Recalculate tension
        calculateTension();
        
        // Update button states
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        
        // Redraw the initial state
        draw();
    });
}

// Function to calculate mass size based on mass value (like in projectile simulation)
function getMassSize(mass) {
    // Base size + size proportional to mass
    return 20 + (mass * 8);
}

// Function to calculate tension in the string
function calculateTension() {
    // For a simple pulley system:
    // T = m₁(g + a) if m₁ is going down
    // T = m₂(g + a) if m₂ is going down
    // Or using the general formula: T = 2*m₁*m₂*g / (m₁ + m₂)
    
    if (mass1Value === mass2Value) {
        // Equal masses, no acceleration
        tension = mass1Value * gravity;
    } else {
        // Using the general formula for tension in a pulley system
        tension = (2 * mass1Value * mass2Value * gravity) / (mass1Value + mass2Value);
    }
    
    return tension;
}

// Function to draw the simulation elements
function draw() {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Draw background to match Matter.js simulations
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground (to match projectile simulation)
    ctx.fillStyle = '#28ba3eff';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    
    // Draw pulley
    ctx.beginPath();
    ctx.arc(pulleyX, pulleyY, pulleyRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#795548'; // Brown color for pulley
    ctx.fill();
    // Removed black outline as requested
    ctx.lineWidth = 2;

    // Calculate mass sizes based on their values
    const mass1Size = getMassSize(mass1Value);
    const mass2Size = getMassSize(mass2Value);

    // Draw rope
    ctx.beginPath();
    ctx.moveTo(pulleyX - pulleyRadius, pulleyY); // Left side of pulley
    ctx.lineTo(pulleyX - pulleyRadius, pulleyY + position + initialStringLength); // Mass 1 position
    ctx.moveTo(pulleyX + pulleyRadius, pulleyY); // Right side of pulley
    ctx.lineTo(pulleyX + pulleyRadius, pulleyY - position + initialStringLength); // Mass 2 position
    ctx.strokeStyle = 'white'; // Changed to white as requested
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Mass 1 (orange square)
    ctx.fillStyle = '#f55a3c'; // Orange color (matching projectile mass color)
    ctx.fillRect(
        pulleyX - pulleyRadius - mass1Size/2, 
        pulleyY + position + initialStringLength - mass1Size/2, 
        mass1Size, 
        mass1Size
    );
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(
        pulleyX - pulleyRadius - mass1Size/2, 
        pulleyY + position + initialStringLength - mass1Size/2, 
        mass1Size, 
        mass1Size
    );

    // Draw Mass 2 (blue square)
    ctx.fillStyle = '#4CAF50'; // Blue color
    ctx.fillRect(
        pulleyX + pulleyRadius - mass2Size/2, 
        pulleyY - position + initialStringLength - mass2Size/2, 
        mass2Size, 
        mass2Size
    );
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(
        pulleyX + pulleyRadius - mass2Size/2, 
        pulleyY - position + initialStringLength - mass2Size/2, 
        mass2Size, 
        mass2Size
    );

    // Draw labels
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('m₁ = ' + mass1Value + ' kg', 
        pulleyX - pulleyRadius, 
        pulleyY + position + initialStringLength - mass1Size/2 - 15);
    ctx.fillText('m₂ = ' + mass2Value + ' kg', 
        pulleyX + pulleyRadius, 
        pulleyY - position + initialStringLength - mass2Size/2 - 15);

    // Draw acceleration info
    const isMass1Heavier = mass1Value > mass2Value;
    const isMass2Heavier = mass2Value > mass1Value;
    let accelerationValue = 0;
    
    if (isMass1Heavier) {
        const netForce = (mass1Value - mass2Value) * gravity;
        accelerationValue = Math.abs(netForce / (mass1Value + mass2Value));
    } else if (isMass2Heavier) {
        const netForce = (mass2Value - mass1Value) * gravity;
        accelerationValue = Math.abs(netForce / (mass1Value + mass2Value));
    }
    
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Acceleration: ' + accelerationValue.toFixed(2) + ' m/s²', 20, 30);
    
    // Draw tension info
    ctx.fillStyle = '#FFD700'; // Gold color for tension
    ctx.font = '16px Arial';
    ctx.fillText('Tension: ' + tension.toFixed(2) + ' N', 20, 55);
    
    // Draw title
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Pulley System Simulation', canvas.width / 2, 30);
    
    // Draw direction indicators
    if (isMass1Heavier) {
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText('↓', pulleyX - pulleyRadius, pulleyY + position + initialStringLength);
        ctx.fillText('↑', pulleyX + pulleyRadius, pulleyY - position + initialStringLength);
    } else if (isMass2Heavier) {
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText('↑', pulleyX - pulleyRadius, pulleyY + position + initialStringLength);
        ctx.fillText('↓', pulleyX + pulleyRadius, pulleyY - position + initialStringLength);
    }
    
    // Draw live information panel
    const panelX = canvas.width - 250;
    const panelY = 80;
    const panelWidth = 230;
    const panelHeight = 120;
    
    // Panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Panel border
    ctx.strokeStyle = '#4D4D4F';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Panel title
    ctx.fillStyle = '#10A37F';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Live Physics Data', panelX + 10, panelY + 20);
    
    // Panel content
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('Position: ' + position.toFixed(2) + ' px', panelX + 10, panelY + 40);
    ctx.fillText('Velocity: ' + velocity.toFixed(2) + ' px/s', panelX + 10, panelY + 60);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Tension: ' + tension.toFixed(2) + ' N', panelX + 10, panelY + 80);
    ctx.fillStyle = 'white';
    ctx.fillText('Acceleration: ' + accelerationValue.toFixed(2) + ' m/s²', panelX + 10, panelY + 100);
}

// Function to update the simulation physics
function update(deltaTime) {
    // Calculate which mass is heavier
    const isMass1Heavier = mass1Value > mass2Value;
    const isMass2Heavier = mass2Value > mass1Value;
    
    // Check if we should stop the simulation (lighter mass reached the pulley)
    const mass1Size = getMassSize(mass1Value);
    const mass2Size = getMassSize(mass2Value);
    
    // Position of the top of each mass
    const mass1Top = pulleyY + position + initialStringLength - mass1Size/2;
    const mass2Top = pulleyY - position + initialStringLength - mass2Size/2;
    
    // Check if lighter mass has reached the pulley
    let shouldStop = false;
    
    if (isMass1Heavier) {
        // Mass 1 is heavier, mass 2 is lighter
        // Mass 2 moves up and should stop when it reaches the pulley
        if (mass2Top <= pulleyY + pulleyRadius) {
            shouldStop = true;
        }
    } else if (isMass2Heavier) {
        // Mass 2 is heavier, mass 1 is lighter
        // Mass 1 moves up and should stop when it reaches the pulley
        if (mass1Top <= pulleyY + pulleyRadius) {
            shouldStop = true;
        }
    }
    
    if (shouldStop) {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
        return;
    }

    // Calculate acceleration based on which mass is heavier
    // Positive acceleration means mass1 goes down and mass2 goes up
    // Negative acceleration means mass1 goes up and mass2 goes down
    if (isMass1Heavier) {
        // Mass 1 is heavier, it should go down
        const netForce = (mass1Value - mass2Value) * gravity;
        acceleration = Math.abs(netForce / (mass1Value + mass2Value));
    } else if (isMass2Heavier) {
        // Mass 2 is heavier, it should go down
        const netForce = (mass2Value - mass1Value) * gravity;
        acceleration = -Math.abs(netForce / (mass1Value + mass2Value));
    } else {
        // Equal masses, no acceleration
        acceleration = 0;
    }

    // Update velocity and position
    velocity += acceleration * deltaTime;
    position += velocity * deltaTime;
    
    // Recalculate tension
    calculateTension();
}

// Animation loop
function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    update(deltaTime);
    draw();

    animationId = requestAnimationFrame(animate);
}

function resetScene() {
    // Cancel any ongoing animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Reset simulation variables
    position = 0;
    velocity = 0;
    lastTime = 0;
    isRunning = false;
    
    // Recalculate tension
    calculateTension();
    
    // Redraw the initial state
    draw();
    
    // Update button states
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

function resetparams() {
    resetScene();
}

// ======= CUSTOM CONTROL PANEL =======

// Add custom control panel styles
function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #pulley-control-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 280px;
            background-color: #202123;
            border: 1px solid #4D4D4F;
            border-radius: 8px;
            color: #ECECF1;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 1000;
            padding: 15px;
        }
        
        .simulation-container {
            margin-right: 320px !important;
        }
        
        .control-group {
            margin-bottom: 15px;
        }
        .control-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: #ECECF1;
        }
        .slider-container {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .slider-container input[type="range"] {
            flex: 1;
            height: 4px;
            background: #4D4D4F;
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
        }
        .slider-container input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #10A37F;
            border-radius: 50%;
            cursor: pointer;
        }
        .slider-container input[type="range"]::-webkit-slider-thumb:hover {
            background: #0f946f;
        }
        .slider-value {
            min-width: 40px;
            text-align: center;
            background-color: #343541;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            color: #10A37F;
        }
        
        .physics-info {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            margin-top: 15px;
            font-size: 12px;
        }
        
        .physics-info p {
            margin: 5px 0;
        }
    `;
    document.head.appendChild(style);
}

// Create custom control panel
function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'pulley-control-panel';
    controlPanel.innerHTML = `
        <div class="control-group">
            <label>Mass 1 (kg)</label>
            <div class="slider-container">
                <input type="range" id="mass1-slider" min="0.1" max="10" step="0.1" value="${mass1Value}">
                <span class="slider-value" id="mass1-value">${mass1Value}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Mass 2 (kg)</label>
            <div class="slider-container">
                <input type="range" id="mass2-slider" min="0.1" max="10" step="0.1" value="${mass2Value}">
                <span class="slider-value" id="mass2-value">${mass2Value}</span>
            </div>
        </div>
        
        <div class="physics-info">
            <p><strong>Pulley Physics:</strong></p>
            <p>• Heavier mass moves down</p>
            <p>• Lighter mass moves up</p>
            <p>• Acceleration: a = (m₂-m₁)g/(m₁+m₂)</p>
            <p>• Tension: T = 2m₁m₂g/(m₁+m₂)</p>
            <p>• When m₂ > m₁, mass 2 moves down</p>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners
    document.getElementById('mass1-slider').addEventListener('input', function() {
        mass1Value = parseFloat(this.value);
        document.getElementById('mass1-value').textContent = mass1Value;
        calculateTension(); // Recalculate tension when mass changes
        resetScene();
    });
    
    document.getElementById('mass2-slider').addEventListener('input', function() {
        mass2Value = parseFloat(this.value);
        document.getElementById('mass2-value').textContent = mass2Value;
        calculateTension(); // Recalculate tension when mass changes
        resetScene();
    });
}

function ResetGUI() {
    document.getElementById('mass1-slider').value = mass1Value;
    document.getElementById('mass2-slider').value = mass2Value;
    document.getElementById('mass1-value').textContent = mass1Value;
    document.getElementById('mass2-value').textContent = mass2Value;
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
initPulleyCanvas();

// Override wireframes setting if render exists
if (typeof render !== 'undefined' && render && render.options) {
    render.options.wireframes = false;
}
}

