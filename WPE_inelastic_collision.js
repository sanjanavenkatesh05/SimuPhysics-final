// inelastic_collision.js - Objects Sticking Together - FASTER VERSION
const defaultValues = { ball1Mass: 3, ball2Mass: 2, ball1VelX: 4, ball2VelX: -3, stickiness: 0.5 };
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
    let stickiness = parameters?.stickiness ?? defaultValues.stickiness;
let ball1, ball2;

function inelasticCollision(m1, m2, v1x, v2x, stick) {
    ball1Mass = m1;
    ball2Mass = m2;
    ball1VelX = v1x;
    ball2VelX = v2x;
    stickiness = stick;

    // Create ball 1 (RED - moving right) - NO AIR RESISTANCE
    ball1 = Bodies.circle(150, 300, Math.sqrt(ball1Mass) * 10 + 15, {
        mass: ball1Mass,
        restitution: 1.0 - stickiness, // Higher restitution for lower stickiness
        friction: 0,        // NO friction for faster motion
        frictionAir: 0,     // NO air resistance
        render: { 
            fillStyle: '#E74C3C',  // Red
            strokeStyle: '#C0392B',
            lineWidth: 2
        }
    });

    // FASTER VELOCITY - increased multiplier
    Body.setVelocity(ball1, { x: ball1VelX * 0.8, y: 0 });

    // Create ball 2 (BLUE - moving left) - NO AIR RESISTANCE
    ball2 = Bodies.circle(650, 300, Math.sqrt(ball2Mass) * 10 + 15, {
        mass: ball2Mass,
        restitution: 1.0 - stickiness, // Higher restitution for lower stickiness
        friction: 0,        // NO friction for faster motion
        frictionAir: 0,     // NO air resistance
        render: { 
            fillStyle: '#3498DB',  // Blue
            strokeStyle: '#2980B9',
            lineWidth: 2
        }
    });

    // FASTER VELOCITY - increased multiplier
    Body.setVelocity(ball2, { x: ball2VelX * 0.8, y: 0 });

    // Standard boundaries
    const ground = Bodies.rectangle(400, 575, 800, 50, {
        isStatic: true,
        restitution: 1.0, // Perfectly elastic
        render: { fillStyle: '#28ba3eff'}
    });

    const leftWall = Bodies.rectangle(-25, 300, 50, 600, { 
        isStatic: true, 
        restitution: 1.0, // Perfectly elastic
        render: { fillStyle: 'transparent' }
    });
    const rightWall = Bodies.rectangle(825, 300, 50, 600, { 
        isStatic: true, 
        restitution: 1.0, // Perfectly elastic
        render: { fillStyle: 'transparent' }
    });

    Composite.add(world, [ball1, ball2, ground, leftWall, rightWall]);

    engine.world.gravity.y = 0; // No gravity for pure collision

    // Handle sticky collisions
    Events.on(engine, 'collisionStart', function(event) {
        const pairs = event.pairs;
        
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            
            if ((pair.bodyA === ball1 && pair.bodyB === ball2) || 
                (pair.bodyA === ball2 && pair.bodyB === ball1)) {
                
                // Get current velocities
                const v1 = ball1.velocity.x;
                const v2 = ball2.velocity.x;
                const m1 = ball1Mass;
                const m2 = ball2Mass;
                
                if (stickiness === 1.0) {
                    // Fully inelastic collision - objects stick together
                    console.log('Fully inelastic collision! Objects sticking together...');
                    
                    // Calculate final velocity using momentum conservation
                    const totalMass = m1 + m2;
                    const finalVelX = (m1 * v1 + m2 * v2) / totalMass;
                    
                    // Apply the same velocity to both objects
                    setTimeout(() => {
                        Body.setVelocity(ball1, { x: finalVelX, y: 0 });
                        Body.setVelocity(ball2, { x: finalVelX, y: 0 });
                    }, 10);
                    
                    // Create a constraint to keep them together
                    const constraint = Constraint.create({
                        bodyA: ball1,
                        bodyB: ball2,
                        length: Math.abs(ball1.position.x - ball2.position.x),
                        stiffness: 0.1, // Lower stiffness for more natural movement
                        render: { visible: false }
                    });
                    Composite.add(world, constraint);
                } else if (stickiness === 0.0) {
                    // Perfectly elastic collision - no energy loss
                    console.log('Perfectly elastic collision!');
                    
                    // Final velocities for elastic collision
                    const v1f = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
                    const v2f = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
                    
                    // Apply the new velocities
                    setTimeout(() => {
                        Body.setVelocity(ball1, { x: v1f, y: 0 });
                        Body.setVelocity(ball2, { x: v2f, y: 0 });
                    }, 10);
                } else {
                    // Partially inelastic collision - some energy loss and partial sticking
                    console.log('Partially inelastic collision! Some sticking...');
                    
                    // Calculate final velocities with energy loss based on stickiness
                    // For partially elastic collision, we interpolate between elastic and inelastic results
                    const elastic_v1f = ((m1 - m2) * v1 + 2 * m2 * v2) / (m1 + m2);
                    const elastic_v2f = ((m2 - m1) * v2 + 2 * m1 * v1) / (m1 + m2);
                    
                    const inelastic_vf = (m1 * v1 + m2 * v2) / (m1 + m2);
                    
                    // Interpolate based on stickiness factor
                    const v1f = elastic_v1f * (1 - stickiness) + inelastic_vf * stickiness;
                    const v2f = elastic_v2f * (1 - stickiness) + inelastic_vf * stickiness;
                    
                    // Apply velocities with some separation to show partial sticking effect
                    setTimeout(() => {
                        Body.setVelocity(ball1, { x: v1f, y: 0 });
                        Body.setVelocity(ball2, { x: v2f, y: 0 });
                    }, 10);
                    
                    // For higher stickiness values, create a temporary constraint
                    if (stickiness > 0.5) {
                        const constraint = Constraint.create({
                            bodyA: ball1,
                            bodyB: ball2,
                            length: Math.abs(ball1.position.x - ball2.position.x) * (2 - stickiness), // Adjust length based on stickiness
                            stiffness: stickiness * 0.05, // Very low stiffness for gentle attraction
                            render: { visible: false }
                        });
                        
                        Composite.add(world, constraint);
                        
                        // Remove constraint after a short time to allow separation
                        setTimeout(() => {
                            Composite.remove(world, constraint);
                        }, 500 * stickiness); // Longer duration for higher stickiness
                    }
                }
            }
        }
    });

}

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    Events.off(engine, 'collisionStart');
    inelasticCollision(ball1Mass, ball2Mass, ball1VelX, ball2VelX, stickiness);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    Events.off(engine, 'collisionStart');
    inelasticCollision(ball1Mass, ball2Mass, ball1VelX, ball2VelX, stickiness);
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
        <div class="control-title">🧲 Inelastic Collision</div>
        
        <div class="physics-section">
            <h4>🔴 Ball 1 (Red)</h4>
            <div class="control-group">
                <label>Mass (kg)</label>
                <div class="slider-container">
                    <input type="range" id="mass1-slider" min="0.5" max="8" step="0.1" value="${ball1Mass}">
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
                    <input type="range" id="mass2-slider" min="0.5" max="8" step="0.1" value="${ball2Mass}">
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
            <h4>🧲 Stickiness Properties</h4>
            <div class="control-group">
                <label>Stickiness Factor</label>
                <div class="slider-container">
                    <input type="range" id="stickiness-slider" min="0" max="1" step="0.01" value="${stickiness}">
                    <span class="slider-value" id="stickiness-value">${stickiness}</span>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners (same as before)
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
    
    document.getElementById('stickiness-slider').addEventListener('input', function() {
        stickiness = parseFloat(this.value);
        document.getElementById('stickiness-value').textContent = stickiness;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
}

function ResetGUI() {
    document.getElementById('mass1-slider').value = ball1Mass;
    document.getElementById('mass2-slider').value = ball2Mass;
    document.getElementById('vel1x-slider').value = ball1VelX;
    document.getElementById('vel2x-slider').value = ball2VelX;
    document.getElementById('stickiness-slider').value = stickiness;
    
    document.getElementById('mass1-value').textContent = ball1Mass + 'kg';
    document.getElementById('mass2-value').textContent = ball2Mass + 'kg';
    document.getElementById('vel1x-value').textContent = ball1VelX;
    document.getElementById('vel2x-value').textContent = ball2VelX;
    document.getElementById('stickiness-value').textContent = stickiness;
}

function loadFromJSON(jsonData) {
    if (jsonData.simulation === "inelastic_collision") {
        ball1Mass = jsonData.parameters.mass1 || ball1Mass;
        ball2Mass = jsonData.parameters.mass2 || ball2Mass;
        ball1VelX = jsonData.parameters.velocity1_x || ball1VelX;
        ball2VelX = jsonData.parameters.velocity2_x || ball2VelX;
        stickiness = jsonData.parameters.stickiness || stickiness;
        
        resetparams();
        ResetGUI();
    }
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
inelasticCollision(3, 2, 4, -3, 0.5); // Start with partially sticky behavior

window.resetScene = resetScene;
window.loadSimulationFromJSON = loadFromJSON;
return {engine,runner};
}

