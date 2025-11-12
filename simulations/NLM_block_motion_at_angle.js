// block-motion.js - YOUR EXACT CODE with Custom Control Panel

//when reset, just the position is changing, im not putting stuff back to initial.

// Global variables
const defaultValues={
    appliedForce: 50,
    forceAngle: 0,
    friction: 0.3,
    blockMass: 1.0,
    
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
    let appliedForce = parameters?.appliedForce ?? defaultValues.appliedForce;
    let forceAngle = parameters?.forceAngle ?? defaultValues.forceAngle;
    let friction = parameters?.friction ?? defaultValues.friction;
    let blockMass = parameters?.blockMass ?? defaultValues.blockMass;


let body;
let gravity = 1; // gravity constant
let forceApplied = false; // Force application state - START WITH FORCE NOT APPLIED

// ground(common to questions with a ground-this exact code.)
const ground = Bodies.rectangle(400, 575, 800, 50, { isStatic: true, render:{ fillStyle: '#28ba3eff'}});
const groundTop = 550; // center - half height = 550

//block parameters
const movingBlockWidth = 50; // Square block
const movingBlockHeight = 50; // Square block

// Physics tracking variables
let initialTime = 0;
let initialPosition = 0;
// Removed display-related variables

// Canvas text display variables
let canvas, ctx;

// Store the event handler so we can remove it when needed
let forceEventHandler = null;

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function setupCanvas() {
    // Get the Matter.js canvas element
    canvas = render.canvas;
    ctx = canvas.getContext('2d');
}

// Removed drawStatsBox function

function blockMotion(force, angle, frictionVal, mass){
    appliedForce = force;
    forceAngle = angle;
    friction = frictionVal;
    blockMass = mass;
    
    // Moving block center y (directly on ground)
    let movingBlockY = groundTop - movingBlockHeight / 2;
    
    // Create moving block directly on ground - SQUARE BLOCK
    body = Bodies.rectangle(100, movingBlockY, movingBlockWidth, movingBlockHeight, {
        restitution: 0.0,
        friction: 0, // We'll handle friction manually
        frictionAir: 0, // No air resistance for clean physics
        density: blockMass / (movingBlockWidth * movingBlockHeight),
        inertia: Infinity, // Prevent rotation
        render:{ fillStyle: '#f55a3c'}
    });
    
    // Set initial velocity to zero
    Body.setVelocity(body, { x: 0, y: 0 });
    
    // Store initial conditions for physics calculations
    initialTime = Date.now();
    initialPosition = body.position.x;
    
    // DON'T apply force immediately - wait for play button
    // Force will be applied when isPlaying becomes true
    
    Composite.add(world,[body, ground]);
    
    // Setup canvas for drawing stats if not already done
    if (!ctx) {
        setTimeout(() => {
            setupCanvas();
        }, 100);
    }
    
    // Remove existing event handler if it exists
    if (forceEventHandler) {
        Events.off(engine, 'beforeUpdate', forceEventHandler);
    }
    
    // Apply force only when simulation is playing
    forceEventHandler = function() {
        // Use the global isPlaying variable from script.js
        if (typeof isPlaying !== 'undefined' && isPlaying && !forceApplied && body) {
            // Calculate force components
            const forceX = appliedForce * Math.cos(toRadians(forceAngle));
            const forceY = appliedForce * Math.sin(toRadians(forceAngle));
            
            // Calculate normal force (mg - Fsin(θ))
            const weight = blockMass * gravity;
            const normalForce = weight - forceY;
            
            // Apply force vector
            if (normalForce <= 0) {
                // Block lifts off - apply full force vector (block is airborne)
                Body.applyForce(body, body.position, { 
                    x: forceX * 0.001, 
                    y: -forceY * 0.001 // Negative because y increases downward
                });
            } else {
                // Block is on ground, apply force with friction
                // Friction force = μ * N
                const maxFrictionForce = friction * normalForce;
                
                // Determine if the block will move based on static friction
                if (Math.abs(forceX) > maxFrictionForce) {
                    // Overcoming static friction - block will move
                    // Kinetic friction applies
                    const frictionForce = maxFrictionForce;
                    
                    // Effective horizontal force after friction
                    const effectiveForceX = forceX - (forceX > 0 ? frictionForce : -frictionForce);
                    
                    // Apply force vector
                    Body.applyForce(body, body.position, { 
                        x: effectiveForceX * 0.001, 
                        y: -forceY * 0.001 // Negative because y increases downward
                    });
                } else {
                    // Static friction prevents motion - no net horizontal force
                    // Only apply vertical component of force
                    Body.applyForce(body, body.position, { 
                        x: 0, 
                        y: -forceY * 0.001 // Negative because y increases downward
                    });
                }
            }
            
            forceApplied = true;
        }
        
        // Reset forceApplied when simulation is paused
        if (typeof isPlaying !== 'undefined' && !isPlaying) {
            forceApplied = false;
        }
    };
    
    Events.on(engine, 'beforeUpdate', forceEventHandler);
}

function resetScene() {//for the reset button
    // Stop the runner
    Runner.stop(runner);
    
    // Clear the world
    Matter.World.clear(engine.world, false); // keep the engine, just remove bodies
    
    // Reset force application flag
    forceApplied = false;
    
    // Recreate the scene
    blockMotion(appliedForce, forceAngle, friction, blockMass);
    ResetGUI();
}

function resetparams(){//for the slider
    // Stop the runner
    Runner.stop(runner);
    
    // Set isPlaying to false
    if (typeof isPlaying !== 'undefined') {
        isPlaying = false;
    }
    
    // Update play/pause button if it exists
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    
    // Clear the world
    Matter.World.clear(engine.world, false); // keep the engine, just remove bodies
    
    // Reset force application flag
    forceApplied = false;
    
    // Recreate the scene
    blockMotion(appliedForce, forceAngle, friction, blockMass);
}

// Removed the Events.on render loop that was drawing the stats box

// ======= REPLACE LIL.GUI WITH CUSTOM CONTROL PANEL =======

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
        
        .simulation-container {
            margin-right: 320px !important;
        }
        
        .control-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #10A37F;
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
            min-width: 50px;
            text-align: center;
            background-color: #343541;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            color: #10A37F;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <div class="control-title">Force at Angle Physics</div>
        
        <div class="control-group">
            <label>Applied Force (N)</label>
            <div class="slider-container">
                <input type="range" id="force-slider" min="0" max="200" step="1" value="${appliedForce}">
                <span class="slider-value" id="force-value">${appliedForce}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Force Angle (degrees)</label>
            <div class="slider-container">
                <input type="range" id="angle-slider" min="-90" max="90" step="1" value="${forceAngle}">
                <span class="slider-value" id="angle-value">${forceAngle}°</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Friction Coefficient</label>
            <div class="slider-container">
                <input type="range" id="friction-slider" min="0" max="1" step="0.01" value="${friction}">
                <span class="slider-value" id="friction-value">${friction}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Block Mass (kg)</label>
            <div class="slider-container">
                <input type="range" id="mass-slider" min="0.1" max="5.0" step="0.1" value="${blockMass}">
                <span class="slider-value" id="mass-value">${blockMass}</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners - EXACT SAME LOGIC AS YOUR lil.GUI
    document.getElementById('force-slider').addEventListener('input', function() {
        appliedForce = parseFloat(this.value);
        document.getElementById('force-value').textContent = appliedForce;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
        console.log("applied force changed");
    });
    
    document.getElementById('angle-slider').addEventListener('input', function() {
        forceAngle = parseFloat(this.value);
        document.getElementById('angle-value').textContent = forceAngle + '°';
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
        console.log("force angle changed");
    });
    
    document.getElementById('friction-slider').addEventListener('input', function() {
        friction = parseFloat(this.value);
        document.getElementById('friction-value').textContent = friction;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
        console.log("friction changed");
    });
    
    document.getElementById('mass-slider').addEventListener('input', function() {
        blockMass = parseFloat(this.value);
        document.getElementById('mass-value').textContent = blockMass;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
        console.log("block mass changed");
    });
}

function ResetGUI() {
    document.getElementById('force-slider').value = appliedForce;
    document.getElementById('angle-slider').value = forceAngle;
    document.getElementById('friction-slider').value = friction;
    document.getElementById('mass-slider').value = blockMass;
    
    document.getElementById('force-value').textContent = appliedForce;
    document.getElementById('angle-value').textContent = forceAngle + '°';
    document.getElementById('friction-value').textContent = friction;
    document.getElementById('mass-value').textContent = blockMass;
}

function loadFromJSON(jsonData) {
    if (jsonData.simulation === "block_motion") {
        appliedForce = jsonData.parameters.applied_force || appliedForce;
        forceAngle = jsonData.parameters.force_angle || forceAngle;
        friction = jsonData.parameters.friction || friction;
        blockMass = jsonData.parameters.mass || blockMass;
        
        resetparams();
        ResetGUI();
    }
}

// Initialize everything - EXACTLY LIKE YOUR ORIGINAL
addCustomControlStyles();
createCustomControlPanel();
blockMotion(50, 0, 0.3, 1.0); // Default: 50N force, 0° angle, 0.3 friction, 1.0kg mass

window.resetScene = resetScene;
window.loadSimulationFromJSON = loadFromJSON;
return {engine,runner};
}
