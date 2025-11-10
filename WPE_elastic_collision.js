// elastic_collision.js - Simple Elastic Collision with Standard Frame Size
const defaultValues = { ball1Mass: 2, ball2Mass: 1, ball1VelX: 3, ball2VelX: -2, restitution: 1.0 };
// Global variables
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

    let ball1Mass = parameters?.ball1Mass ?? defaultValues.ball1Mass;
    let ball2Mass = parameters?.ball2Mass ?? defaultValues.ball2Mass;
    let ball1VelX = parameters?.ball1VelX ?? defaultValues.ball1VelX;
    let ball2VelX = parameters?.ball2VelX ?? defaultValues.ball2VelX;
    let restitution = parameters?.restitution ?? defaultValues.restitution;
let ball1, ball2;

function elasticCollision(m1, m2, v1x, v2x, e) {
    ball1Mass = m1;
    ball2Mass = m2;
    ball1VelX = v1x;
    ball2VelX = v2x;
    restitution = e;

    // Create ball 1 (RED - moving right) - size based on mass
    ball1 = Bodies.circle(120, 300, Math.sqrt(ball1Mass) * 10 + 12, {
        mass: ball1Mass,
        restitution: restitution,
        friction: 0,
        frictionAir: 0,
        render: { 
            fillStyle: '#E74C3C',  // Red
            strokeStyle: '#C0392B',
            lineWidth: 2
        }
    });

    // Set initial velocity for ball 1 (REDUCED SCALE)
    Body.setVelocity(ball1, { x: ball1VelX * 0.3, y: 0 });

    // Create ball 2 (BLUE - moving left) - size based on mass
    ball2 = Bodies.circle(680, 300, Math.sqrt(ball2Mass) * 10 + 12, {
        mass: ball2Mass,
        restitution: restitution,
        friction: 0,
        frictionAir: 0,
        render: { 
            fillStyle: '#3498DB',  // Blue
            strokeStyle: '#2980B9',
            lineWidth: 2
        }
    });

    // Set initial velocity for ball 2 (REDUCED SCALE)
    Body.setVelocity(ball2, { x: ball2VelX * 0.3, y: 0 });

    // STANDARD BOUNDARIES - same as all other simulations
    const ground = Bodies.rectangle(400, 575, 800, 50, {
        isStatic: true,
        restitution: 1.0,
        render: { fillStyle: '#28ba3eff'}
    });

    // Standard walls (invisible but functional)
    const leftWall = Bodies.rectangle(-25, 300, 50, 600, { 
        isStatic: true, 
        restitution: 1.0,
        render: { fillStyle: 'transparent' }
    });
    const rightWall = Bodies.rectangle(825, 300, 50, 600, { 
        isStatic: true, 
        restitution: 1.0,
        render: { fillStyle: 'transparent' }
    });
    const topWall = Bodies.rectangle(400, -25, 800, 50, { 
        isStatic: true, 
        restitution: 1.0,
        render: { fillStyle: 'transparent' }
    });

    Composite.add(world, [ball1, ball2, ground, leftWall, rightWall, topWall]);

    // No gravity for horizontal collision demo
    engine.world.gravity.y = 0;
}

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    elasticCollision(ball1Mass, ball2Mass, ball1VelX, ball2VelX, restitution);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    elasticCollision(ball1Mass, ball2Mass, ball1VelX, ball2VelX, restitution);
}

// ======= CONTROL PANEL (same as before) =======

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
        
        .physics-section {
            margin-bottom: 18px;
            padding: 12px;
            background-color: #343541;
            border-radius: 6px;
            border-left: 3px solid #10A37F;
        }
        
        .physics-section h4 {
            margin: 0 0 12px 0;
            font-size: 13px;
            color: #ECECF1;
            font-weight: 600;
        }
        
        .control-group {
            margin-bottom: 14px;
        }
        
        .control-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: #B0B0B0;
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
            background-color: #2A2B32;
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
        <div class="control-title">⚽ Elastic Collision</div>
        
        <div class="physics-section">
            <h4>🔴 Ball 1 (Red)</h4>
            <div class="control-group">
                <label>Mass (kg)</label>
                <div class="slider-container">
                    <input type="range" id="mass1-slider" min="0.5" max="5" step="0.1" value="${ball1Mass}">
                    <span class="slider-value" id="mass1-value">${ball1Mass}kg</span>
                </div>
            </div>
            <div class="control-group">
                <label>X Velocity (m/s)</label>
                <div class="slider-container">
                    <input type="range" id="vel1x-slider" min="-8" max="8" step="0.5" value="${ball1VelX}">
                    <span class="slider-value" id="vel1x-value">${ball1VelX}</span>
                </div>
            </div>
        </div>
        
        <div class="physics-section">
            <h4>🔵 Ball 2 (Blue)</h4>
            <div class="control-group">
                <label>Mass (kg)</label>
                <div class="slider-container">
                    <input type="range" id="mass2-slider" min="0.5" max="5" step="0.1" value="${ball2Mass}">
                    <span class="slider-value" id="mass2-value">${ball2Mass}kg</span>
                </div>
            </div>
            <div class="control-group">
                <label>X Velocity (m/s)</label>
                <div class="slider-container">
                    <input type="range" id="vel2x-slider" min="-8" max="8" step="0.5" value="${ball2VelX}">
                    <span class="slider-value" id="vel2x-value">${ball2VelX}</span>
                </div>
            </div>
        </div>
        
        <div class="physics-section">
            <h4>⚡ Collision Properties</h4>
            <div class="control-group">
                <label>Restitution (e)</label>
                <div class="slider-container">
                    <input type="range" id="restitution-slider" min="0" max="1" step="0.01" value="${restitution}">
                    <span class="slider-value" id="restitution-value">${restitution}</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners
    document.getElementById('mass1-slider').addEventListener('input', function() {
        ball1Mass = parseFloat(this.value);
        document.getElementById('mass1-value').textContent = ball1Mass + 'kg';
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('mass2-slider').addEventListener('input', function() {
        ball2Mass = parseFloat(this.value);
        document.getElementById('mass2-value').textContent = ball2Mass + 'kg';
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('vel1x-slider').addEventListener('input', function() {
        ball1VelX = parseFloat(this.value);
        document.getElementById('vel1x-value').textContent = ball1VelX;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('vel2x-slider').addEventListener('input', function() {
        ball2VelX = parseFloat(this.value);
        document.getElementById('vel2x-value').textContent = ball2VelX;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('restitution-slider').addEventListener('input', function() {
        restitution = parseFloat(this.value);
        document.getElementById('restitution-value').textContent = restitution;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
}

function ResetGUI() {
    document.getElementById('mass1-slider').value = ball1Mass;
    document.getElementById('mass2-slider').value = ball2Mass;
    document.getElementById('vel1x-slider').value = ball1VelX;
    document.getElementById('vel2x-slider').value = ball2VelX;
    document.getElementById('restitution-slider').value = restitution;
    
    document.getElementById('mass1-value').textContent = ball1Mass + 'kg';
    document.getElementById('mass2-value').textContent = ball2Mass + 'kg';
    document.getElementById('vel1x-value').textContent = ball1VelX;
    document.getElementById('vel2x-value').textContent = ball2VelX;
    document.getElementById('restitution-value').textContent = restitution;
}

function loadFromJSON(jsonData) {
    if (jsonData.simulation === "elastic_collision") {
        ball1Mass = jsonData.parameters.mass1 || ball1Mass;
        ball2Mass = jsonData.parameters.mass2 || ball2Mass;
        ball1VelX = jsonData.parameters.velocity1_x || ball1VelX;
        ball2VelX = jsonData.parameters.velocity2_x || ball2VelX;
        restitution = jsonData.parameters.restitution || restitution;
        
        resetparams();
        ResetGUI();
    }
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
elasticCollision(2, 1, 3, -2, 1.0); // Controlled initial velocities

window.resetScene = resetScene;
window.loadSimulationFromJSON = loadFromJSON;
return {engine,runner};
}

