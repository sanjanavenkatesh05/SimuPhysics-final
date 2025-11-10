
// motion2d.js - General 2D Motion with Custom Dark Theme Control Panel
const {
  Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint,
  Constraint, Composite, Events
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

// Global variables
let initialVelX = 5;     // Initial X velocity (m/s)
let initialVelY = -3;    // Initial Y velocity (m/s)
let startX = 100;        // Starting X position
let startY = 300;        // Starting Y position
let accelX = 0.5;        // X acceleration (m/s²)
let accelY = 0.2;        // Y acceleration (m/s²)
let movingObject;

function motion2D(velX, velY, posX, posY, aX, aY) {
    initialVelX = velX;
    initialVelY = velY;
    startX = posX;
    startY = posY;
    accelX = aX;
    accelY = aY;

    // Remove gravity for 2D motion simulation
    engine.world.gravity.y = 0;

    // Create moving object
    movingObject = Bodies.circle(startX, startY, 15, {
        restitution: 0.8,
        friction: 0.1,
        frictionAir: 0.005,
        render: { fillStyle: '#f55a3c' }
    });

    // Set initial velocity
    Body.setVelocity(movingObject, { x: initialVelX, y: initialVelY });

    // Apply continuous acceleration if needed
    if (accelX !== 0 || accelY !== 0) {
        Events.on(engine, 'beforeUpdate', function() {
            if (movingObject) {
                // Apply acceleration forces
                Body.applyForce(movingObject, movingObject.position, {
                    x: accelX * movingObject.mass * 0.001, // Scale for Matter.js
                    y: accelY * movingObject.mass * 0.001
                });
            }
        });
    }

    // Add boundaries (walls)
    const walls = [
        Bodies.rectangle(400, -25, 800, 50, { isStatic: true, render: { fillStyle: '#666666' } }), // Top
        Bodies.rectangle(400, 625, 800, 50, { isStatic: true, render: { fillStyle: '#28ba3eff' } }), // Bottom
        Bodies.rectangle(-25, 300, 50, 600, { isStatic: true, render: { fillStyle: '#666666' } }), // Left
        Bodies.rectangle(825, 300, 50, 600, { isStatic: true, render: { fillStyle: '#666666' } })  // Right
    ];

    Composite.add(world, [movingObject, ...walls]);
}

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    Events.off(engine, 'beforeUpdate');
    // Remove gravity for 2D motion simulation
    engine.world.gravity.y = 0;
    motion2D(initialVelX, initialVelY, startX, startY, accelX, accelY);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    Events.off(engine, 'beforeUpdate');
    // Remove gravity for 2D motion simulation
    engine.world.gravity.y = 0;
    motion2D(initialVelX, initialVelY, startX, startY, accelX, accelY);
}

// ======= CUSTOM CONTROL PANEL =======

function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #custom-control-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 300px;
            background-color: #202123;
            border: 1px solid #4D4D4F;
            border-radius: 8px;
            color: #ECECF1;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 1000;
            padding: 15px;
        }
        
        .simulation-container {
            margin-right: 340px !important;
        }
        
        .control-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #10A37F;
        }
        
        .control-section {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #343541;
            border-radius: 6px;
        }
        
        .control-section h4 {
            margin: 0 0 10px 0;
            font-size: 13px;
            color: #ECECF1;
            font-weight: 600;
        }
        
        .control-group {
            margin-bottom: 12px;
        }
        
        .control-group label {
            display: block;
            margin-bottom: 4px;
            font-size: 11px;
            color: #8E8EA0;
        }
        
        .slider-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .slider-container input[type="range"] {
            flex: 1;
            height: 3px;
            background: #4D4D4F;
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
        }
        
        .slider-container input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            background: #10A37F;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .slider-value {
            min-width: 35px;
            text-align: center;
            background-color: #4D4D4F;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 10px;
            color: #10A37F;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <div class="control-title">General 2D Motion</div>
        
        <div class="control-section">
            <h4>Initial Velocity</h4>
            <div class="control-group">
                <label>X Velocity (m/s)</label>
                <div class="slider-container">
                    <input type="range" id="velx-slider" min="-20" max="20" step="0.5" value="${initialVelX}">
                    <span class="slider-value" id="velx-value">${initialVelX}</span>
                </div>
            </div>
            <div class="control-group">
                <label>Y Velocity (m/s)</label>
                <div class="slider-container">
                    <input type="range" id="vely-slider" min="-20" max="20" step="0.5" value="${initialVelY}">
                    <span class="slider-value" id="vely-value">${initialVelY}</span>
                </div>
            </div>
        </div>
        
        <div class="control-section">
            <h4>Starting Position</h4>
            <div class="control-group">
                <label>X Position</label>
                <div class="slider-container">
                    <input type="range" id="posx-slider" min="50" max="750" step="10" value="${startX}">
                    <span class="slider-value" id="posx-value">${startX}</span>
                </div>
            </div>
            <div class="control-group">
                <label>Y Position</label>
                <div class="slider-container">
                    <input type="range" id="posy-slider" min="50" max="550" step="10" value="${startY}">
                    <span class="slider-value" id="posy-value">${startY}</span>
                </div>
            </div>
        </div>
        
        <div class="control-section">
            <h4>Acceleration</h4>
            <div class="control-group">
                <label>X Acceleration (m/s²)</label>
                <div class="slider-container">
                    <input type="range" id="accelx-slider" min="-5" max="5" step="0.1" value="${accelX}">
                    <span class="slider-value" id="accelx-value">${accelX}</span>
                </div>
            </div>
            <div class="control-group">
                <label>Y Acceleration (m/s²)</label>
                <div class="slider-container">
                    <input type="range" id="accely-slider" min="-5" max="5" step="0.1" value="${accelY}">
                    <span class="slider-value" id="accely-value">${accelY}</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners
    document.getElementById('velx-slider').addEventListener('input', function() {
        initialVelX = parseFloat(this.value);
        document.getElementById('velx-value').textContent = initialVelX;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('vely-slider').addEventListener('input', function() {
        initialVelY = parseFloat(this.value);
        document.getElementById('vely-value').textContent = initialVelY;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('posx-slider').addEventListener('input', function() {
        startX = parseFloat(this.value);
        document.getElementById('posx-value').textContent = startX;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('posy-slider').addEventListener('input', function() {
        startY = parseFloat(this.value);
        document.getElementById('posy-value').textContent = startY;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('accelx-slider').addEventListener('input', function() {
        accelX = parseFloat(this.value);
        document.getElementById('accelx-value').textContent = accelX;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('accely-slider').addEventListener('input', function() {
        accelY = parseFloat(this.value);
        document.getElementById('accely-value').textContent = accelY;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
}

function ResetGUI() {
    document.getElementById('velx-slider').value = initialVelX;
    document.getElementById('vely-slider').value = initialVelY;
    document.getElementById('posx-slider').value = startX;
    document.getElementById('posy-slider').value = startY;
    document.getElementById('accelx-slider').value = accelX;
    document.getElementById('accely-slider').value = accelY;
    
    document.getElementById('velx-value').textContent = initialVelX;
    document.getElementById('vely-value').textContent = initialVelY;
    document.getElementById('posx-value').textContent = startX;
    document.getElementById('posy-value').textContent = startY;
    document.getElementById('accelx-value').textContent = accelX;
    document.getElementById('accely-value').textContent = accelY;
}

function loadFromJSON(jsonData) {
    if (jsonData.simulation === "motion_2d") {
        initialVelX = jsonData.parameters.initial_velocity_x || initialVelX;
        initialVelY = jsonData.parameters.initial_velocity_y || initialVelY;
        startX = jsonData.parameters.position_x || startX;
        startY = jsonData.parameters.position_y || startY;
        accelX = jsonData.parameters.acceleration_x || accelX;
        accelY = jsonData.parameters.acceleration_y || accelY;
        
        resetparams();
        ResetGUI();
    }
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
motion2D(5, -3, 100, 300, 0.5, 0.2);

window.resetScene = resetScene;
window.loadSimulationFromJSON = loadFromJSON;
