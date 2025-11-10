// shm-ground.js - SHM simulation with block on surface and mass on ground - WITH CONTROL PANEL

const defaultValues = {
    amplitude: 150, // Fixed distance for oscillation
    frequency: 0.25, // Oscillation frequency
    period: 8// Period in seconds 
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

    let amplitude = parameters?.amplitude ?? defaultValues.amplitude;
    let frequency = parameters?.frequency ?? defaultValues.frequency;
    let period = parameters?.period ?? defaultValues.period;
let block, mass, spring, ground;
let isDragging = false;
let dragPoint = null;
let initialPosition;

let animationId;


// Ground parameters (matching projectile simulation)
const groundTop = 550;
const groundHeight = 50;


// Setup the SHM simulation with block on surface and mass on ground
function setupSHMGround() {
    // Clear old world
    Matter.World.clear(engine.world, false);
    
    // Enable gravity for this simulation
    engine.world.gravity.y = 1; // Standard downward gravity
    
    // Create ground (matching projectile simulation) with less friction
    ground = Matter.Bodies.rectangle(400, groundTop + groundHeight/2, 800, groundHeight, { 
        isStatic: true,
        friction: 0.0001, // Very low friction
        render: { fillStyle: '#28ba3eff' }
    });
    
    // Create fixed block on the surface (grey color) - all the way to the left, bigger and square
    const blockSize = 80; // Bigger and square
    block = Matter.Bodies.rectangle(60 + blockSize/2, groundTop - blockSize/2, blockSize, blockSize, {
        isStatic: true, // Fixed, not movable
        inertia: Infinity, // Infinite inertia
        render: { fillStyle: '#808080' } // Grey color
    });
    
    // Create mass on the ground - same size as block and square (orange color)
    const massSize = 80; // Same size as block
    // Start at center position
    initialPosition = 400;
    mass = Matter.Bodies.rectangle(initialPosition, groundTop - massSize/2, massSize, massSize, {
        restitution: 0.3,
        friction: 0.001,
        density: 0.002,
        inertia: Infinity, // Infinite inertia for orange block
        render: { fillStyle: "#f55a3c" } // Orange/red color
    });
    
    // Create visual spring connecting block to mass - for display only
    spring = Matter.Constraint.create({
        bodyA: block,
        bodyB: mass,
        pointA: { x: blockSize/2, y: 0 }, // Right side of the block, centered vertically
        pointB: { x: -massSize/2, y: 0 }, // Left side of the mass, centered vertically
        length: 0, // No physical effect
        stiffness: 0, // No physical effect
        render: { 
            strokeStyle: "#3d3dc1", 
            lineWidth: 12,
            type: 'spring' // Spring visualization
        }
    });
    
    // Add bodies and spring to the world
    Matter.Composite.add(world, [block, mass, spring, ground]);
    
    // Start continuous oscillation
    startContinuousOscillation();
}


// Continuous oscillation that runs forever
function startContinuousOscillation() {
    let startTime = Date.now();
    
    function update() {
        // Calculate elapsed time in seconds
        const elapsed = (Date.now() - startTime) / 1000;
        
        // Calculate position using current frequency
        const position = initialPosition + amplitude * Math.sin(elapsed * frequency * Math.PI);
        
        // Update mass position
        if (mass) {
            Matter.Body.setPosition(mass, { x: position, y: mass.position.y });
        }
        
        // Continue animation
        animationId = requestAnimationFrame(update);
    }
    
    // Start the animation loop
    update();
}


// Reset the simulation
function resetScene() {
    // Cancel ongoing animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    Matter.Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    setupSHMGround();
}


// Reset parameters (for slider changes)
function resetparams() {
    // Cancel ongoing animation
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    Matter.Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    setupSHMGround();
}


// ======= CUSTOM CONTROL PANEL - MATCHING PROJECTILE STYLE =======


// Add custom control panel styles (matches your projectile.js theme)
function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #custom-control-panel {
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
        
        /* Shift simulation container to the left */
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
        
        .slider-value {
            min-width: 40px;
            text-align: center;
            background-color: #343541;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
        }
        
        .control-buttons {
            display: flex;
            gap: 8px;
            margin-top: 15px;
        }
        
        .control-buttons button {
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .reset-btn {
            background-color: #ef4444;
            color: white;
        }
        
        .reset-btn:hover {
            background-color: #dc2626;
        }
        
        .panel-title {
            margin: 0 0 15px 0;
            font-size: 14px;
            font-weight: 600;
            color: #10A37F;
        }
    `;
    document.head.appendChild(style);
}


// Create custom control panel
function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <h3 class="panel-title">SHM Controls</h3>
        
        <div class="control-group">
            <label>Amplitude (pixels)</label>
            <div class="slider-container">
                <input type="range" id="amplitude-slider" min="50" max="205" step="5" value="${amplitude}">
                <span class="slider-value" id="amplitude-value">${amplitude}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Period (seconds)</label>
            <div class="slider-container">
                <input type="range" id="period-slider" min="2" max="20" step="0.5" value="${period}">
                <span class="slider-value" id="period-value">${period}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Frequency (Hz)</label>
            <div class="slider-container">
                <input type="range" id="frequency-slider" min="0.05" max="0.5" step="0.01" value="${frequency}">
                <span class="slider-value" id="frequency-value">${frequency}</span>
            </div>
        </div>
        
        <div class="control-buttons">
            <button class="reset-btn" onclick="resetScene()">Reset</button>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners
    const amplitudeSlider = document.getElementById('amplitude-slider');
    const amplitudeValue = document.getElementById('amplitude-value');
    amplitudeSlider.addEventListener('input', function() {
        amplitude = parseFloat(this.value);
        amplitudeValue.textContent = amplitude;
        resetparams();
        console.log('amplitude changed to:', amplitude);
    });
    
    const periodSlider = document.getElementById('period-slider');
    const periodValue = document.getElementById('period-value');
    periodSlider.addEventListener('input', function() {
        period = parseFloat(this.value);
        frequency = 1 / period; // Update frequency when period changes
        periodValue.textContent = period;
        // Update frequency display
        document.getElementById('frequency-value').textContent = frequency.toFixed(3);
        document.getElementById('frequency-slider').value = frequency;
        resetparams();
        console.log('period changed to:', period, 'frequency:', frequency);
    });
    
    const frequencySlider = document.getElementById('frequency-slider');
    const frequencyValue = document.getElementById('frequency-value');
    frequencySlider.addEventListener('input', function() {
        frequency = parseFloat(this.value);
        period = 1 / frequency; // Update period when frequency changes
        frequencyValue.textContent = frequency.toFixed(3);
        // Update period display
        document.getElementById('period-value').textContent = period.toFixed(1);
        document.getElementById('period-slider').value = period;
        resetparams();
        console.log('frequency changed to:', frequency, 'period:', period);
    });
}


// Reset GUI values (similar to projectile.js ResetGUI function)
function ResetGUI() {
    // Update the custom control panel values
    document.getElementById('amplitude-slider').value = amplitude;
    document.getElementById('period-slider').value = period;
    document.getElementById('frequency-slider').value = frequency;
    
    document.getElementById('amplitude-value').textContent = amplitude;
    document.getElementById('period-value').textContent = period;
    document.getElementById('frequency-value').textContent = frequency.toFixed(3);
}


// Initialize everything (matching projectile.js pattern)
addCustomControlStyles();
createCustomControlPanel();
setupSHMGround();
return {engine,runner};
}
