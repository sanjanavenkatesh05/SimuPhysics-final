// freefall.js - CORRECTED Free Fall with Proper Equations of Motion

// Global variables  
const defaultValues={
    dropHeight: 300,
    initialVelocity:0,
    mass:1,
    airResistance:0,
    gravity:9.81
};

function startSimulation(parameters)
{
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
    //parameters=JSON.parse(parameters);
let dropHeight = parameters?.dropHeight??defaultValues.dropHeight;
let initialVelocity=parameters?.initialVelocity??defaultValues.initialVelocity;
let mass=parameters?.mass??defaultValues.mass;
let airResistance = parameters?.mass??defaultValues.airResistance;
let gravity = parameters?.gravity??defaultValues.gravity;
let ball, ground;
let velocityDisplay; // To show real-time velocity

// Physics constants
const groundHeight = 575;
const ballRadius = 20;
const canvasWidth = 800;

function freeFallMotion(height, initVel, ballMass, airRes, g) {
    dropHeight = height;
    initialVelocity = initVel;
    mass = ballMass;
    airResistance = airRes;
    gravity = g;

    // Calculate starting Y position (from top)
    let startY = groundHeight - dropHeight - ballRadius;
    
    // Create ground
    ground = Bodies.rectangle(canvasWidth/2, groundHeight, canvasWidth, 50, { 
        isStatic: true,
        render: { fillStyle: '#28ba3eff'}
    });

    // Create falling ball
    ball = Bodies.circle(canvasWidth/2, startY, ballRadius, {
        restitution: 0.7,
        friction: 0.1,
        frictionAir: airResistance * 0.01, // Use Matter.js air friction
        density: mass / (Math.PI * ballRadius * ballRadius),
        render: { fillStyle: '#f55a3c'}
    });

    // Set initial velocity 
    Body.setVelocity(ball, { x: 0, y: initialVelocity });

    // CORRECT GRAVITY SETTING - Matter.js uses scale of 0.001
    engine.world.gravity.y = gravity * 0.001;
    engine.world.gravity.x = 0;

    // Add real-time velocity display
    Events.on(engine, 'beforeUpdate', function() {
        if (ball && document.getElementById('current-velocity')) {
            let currentVel = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y);
            document.getElementById('current-velocity').textContent = currentVel.toFixed(2) + ' m/s';
            
            // Show acceleration (change in velocity)
            let acceleration = Math.abs(ball.force.y / ball.mass) * 1000; // Convert from Matter.js scale
            document.getElementById('current-acceleration').textContent = acceleration.toFixed(2) + ' m/s²';
        }
    });

    Composite.add(world, [ball, ground]);
}

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    Events.off(engine, 'beforeUpdate'); // Remove old event listeners
    engine.world.gravity.y = 0.00981; // Reset to default
    freeFallMotion(dropHeight, initialVelocity, mass, airResistance, gravity);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    Events.off(engine, 'beforeUpdate');
    engine.world.gravity.y = 0.00981;
    freeFallMotion(dropHeight, initialVelocity, mass, airResistance, gravity);
}

// ======= ENHANCED CONTROL PANEL WITH VELOCITY DISPLAY =======

function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #custom-control-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 320px;
            background-color: #202123;
            border: 1px solid #4D4D4F;
            border-radius: 8px;
            color: #ECECF1;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 1000;
            padding: 15px;
        }
        
        .simulation-container {
            margin-right: 360px !important;
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
            min-width: 45px;
            text-align: center;
            background-color: #343541;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            color: #10A37F;
        }
        
        .physics-info {
            background-color: #343541;
            padding: 12px;
            border-radius: 6px;
            margin-top: 15px;
            font-size: 11px;
        }
        
        .physics-info h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #ECECF1;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
        }
        
        .info-row span:first-child {
            color: #8E8EA0;
        }
        
        .info-row span:last-child {
            color: #10A37F;
            font-weight: 600;
        }
        
        .live-data {
            background-color: #2A2B32;
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            border-left: 3px solid #10A37F;
        }
        
        .live-data h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #10A37F;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <div class="control-title">Free Fall Controls</div>
        
        <div class="control-group">
            <label>Drop Height (m)</label>
            <div class="slider-container">
                <input type="range" id="height-slider" min="10" max="500" step="5" value="${dropHeight}">
                <span class="slider-value" id="height-value">${dropHeight}m</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Initial Velocity (m/s)</label>
            <div class="slider-container">
                <input type="range" id="velocity-slider" min="-20" max="20" step="0.5" value="${initialVelocity}">
                <span class="slider-value" id="velocity-value">${initialVelocity}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Mass (kg)</label>
            <div class="slider-container">
                <input type="range" id="mass-slider" min="0.1" max="10" step="0.1" value="${mass}">
                <span class="slider-value" id="mass-value">${mass}kg</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Air Resistance</label>
            <div class="slider-container">
                <input type="range" id="air-slider" min="0" max="0.1" step="0.001" value="${airResistance}">
                <span class="slider-value" id="air-value">${airResistance}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Gravity (m/s²)</label>
            <div class="slider-container">
                <input type="range" id="gravity-slider" min="1" max="20" step="0.1" value="${gravity}">
                <span class="slider-value" id="gravity-value">${gravity}</span>
            </div>
        </div>
        
        <div class="live-data">
            <h4>📈 Live Data (Equations of Motion)</h4>
            <div class="info-row">
                <span>Current Velocity:</span>
                <span id="current-velocity">0.0 m/s</span>
            </div>
            <div class="info-row">
                <span>Acceleration:</span>
                <span id="current-acceleration">9.81 m/s²</span>
            </div>
        </div>
        
        <div class="physics-info">
            <h4>🧮 Theoretical Values</h4>
            <div class="info-row">
                <span>Fall Time:</span>
                <span id="fall-time">0.0s</span>
            </div>
            <div class="info-row">
                <span>Final Velocity:</span>
                <span id="final-velocity">0.0 m/s</span>
            </div>
            <div class="info-row">
                <span>Impact Energy:</span>
                <span id="impact-energy">0.0 J</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners (same as before)
    document.getElementById('height-slider').addEventListener('input', function() {
        dropHeight = parseFloat(this.value);
        document.getElementById('height-value').textContent = dropHeight + 'm';
        updatePhysicsCalculations();
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('velocity-slider').addEventListener('input', function() {
        initialVelocity = parseFloat(this.value);
        document.getElementById('velocity-value').textContent = initialVelocity;
        updatePhysicsCalculations();
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('mass-slider').addEventListener('input', function() {
        mass = parseFloat(this.value);
        document.getElementById('mass-value').textContent = mass + 'kg';
        updatePhysicsCalculations();
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('air-slider').addEventListener('input', function() {
        airResistance = parseFloat(this.value);
        document.getElementById('air-value').textContent = airResistance;
        updatePhysicsCalculations();
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('gravity-slider').addEventListener('input', function() {
        gravity = parseFloat(this.value);
        document.getElementById('gravity-value').textContent = gravity;
        updatePhysicsCalculations();
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
}

// Physics calculations using proper equations of motion
function updatePhysicsCalculations() {
    // v = u + at, s = ut + (1/2)at²
    let fallTime;
    if (initialVelocity >= 0) {
        // Using: s = ut + (1/2)at² => t = (√(u² + 2as) - u) / a
        fallTime = (Math.sqrt(initialVelocity * initialVelocity + 2 * gravity * dropHeight) - initialVelocity) / gravity;
    } else {
        // Initial upward velocity
        let timeToApex = -initialVelocity / gravity;
        let apexHeight = (initialVelocity * initialVelocity) / (2 * gravity);
        let totalHeight = dropHeight + apexHeight;
        let timeFromApex = Math.sqrt(2 * totalHeight / gravity);
        fallTime = timeToApex + timeFromApex;
    }
    
    let finalVelocity = initialVelocity + gravity * fallTime; // v = u + at
    let impactEnergy = 0.5 * mass * finalVelocity * finalVelocity; // KE = (1/2)mv²
    
    document.getElementById('fall-time').textContent = fallTime.toFixed(2) + 's';
    document.getElementById('final-velocity').textContent = finalVelocity.toFixed(1) + ' m/s';
    document.getElementById('impact-energy').textContent = impactEnergy.toFixed(1) + ' J';
}

function ResetGUI() {
    document.getElementById('height-slider').value = dropHeight;
    document.getElementById('velocity-slider').value = initialVelocity;
    document.getElementById('mass-slider').value = mass;
    document.getElementById('air-slider').value = airResistance;
    document.getElementById('gravity-slider').value = gravity;
    
    document.getElementById('height-value').textContent = dropHeight + 'm';
    document.getElementById('velocity-value').textContent = initialVelocity;
    document.getElementById('mass-value').textContent = mass + 'kg';
    document.getElementById('air-value').textContent = airResistance;
    document.getElementById('gravity-value').textContent = gravity;
    
    updatePhysicsCalculations();
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
updatePhysicsCalculations();
freeFallMotion(300, 0, 1, 0, 9.81);

window.resetScene = resetScene;
return {engine,runner};
}