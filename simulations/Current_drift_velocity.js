// drift_velocity.js - Drift Velocity & Electron Motion Simulator
// Global variables

const defaultValues={
    electricField:100,temperature:300,material:'Copper'

};



function startSimulation(parameters){
    

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
let electricField = parameters?.electricField??defaultValues.electricField;
let temperature = parameters?.temperature??defaultValues.temperature; // Kelvin
let relaxationTime = 2.3e-14; // seconds
let material = parameters?.material??defaultValues.material;

// Physical constants
const electronCharge = 1.602e-19;
const electronMass = 9.109e-31;
const boltzmannConstant = 1.381e-23;

// Material properties
const materials = {
    'Copper': { density: 8.5e28, resistivity: 1.68e-8, relaxation: 2.3e-14 },
    'Aluminum': { density: 6.0e28, resistivity: 2.82e-8, relaxation: 1.4e-14 },
    'Silver': { density: 5.9e28, resistivity: 1.59e-8, relaxation: 3.8e-14 },
    'Iron': { density: 1.7e28, resistivity: 9.71e-8, relaxation: 0.5e-14 }
};

let electrons = [];
const numElectrons = 80;
let driftVelocity = 0;
let thermalVelocity = 0;
let currentDensity = 0;
let showVectors = true;
let showCollisions = true;

// Disable gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

// Initialize drift velocity simulation
function createDriftVelocitySimulation() {
    Matter.World.clear(engine.world, false);
    electrons = [];

    // Calculate drift velocity: v_d = (e * E * τ) / m
    driftVelocity = (electronCharge * electricField * relaxationTime) / electronMass;

    // Calculate thermal velocity: v_thermal ≈ sqrt(3kT/m)
    thermalVelocity = Math.sqrt((3 * boltzmannConstant * temperature) / electronMass);

    // Calculate current density: J = n * e * v_d
    const n = materials[material].density;
    currentDensity = n * electronCharge * driftVelocity;

    // Create electron particles
    const wireLeft = 100;
    const wireRight = 700;
    const wireTop = 200;
    const wireBottom = 400;

    for (let i = 0; i < numElectrons; i++) {
        const x = wireLeft + Math.random() * (wireRight - wireLeft);
        const y = wireTop + Math.random() * (wireBottom - wireTop);

        const electron = Bodies.circle(x, y, 4, {
            frictionAir: 0,
            friction: 0,
            render: { fillStyle: '#00FFFF' }
        });

        // Random thermal velocity
        const thermalAngle = Math.random() * Math.PI * 2;
        const scaledThermalV = 2; // Scaled for visualization

        Body.setVelocity(electron, {
            x: scaledThermalV * Math.cos(thermalAngle),
            y: scaledThermalV * Math.sin(thermalAngle)
        });

        electrons.push({
            body: electron,
            collisionTimer: 0,
            thermalAngle: thermalAngle
        });

        Composite.add(world, electron);
    }

    // Create lattice ions (stationary)
    for (let x = wireLeft; x <= wireRight; x += 40) {
        for (let y = wireTop; y <= wireBottom; y += 40) {
            const ion = Bodies.circle(x, y, 3, {
                isStatic: true,
                render: { fillStyle: 'rgba(255, 255, 255, 0.3)' }
            });
            Composite.add(world, ion);
        }
    }
}

// Update electron motion with drift and thermal components
Events.on(engine, 'beforeUpdate', function() {
    const wireLeft = 100;
    const wireRight = 700;
    const wireTop = 200;
    const wireBottom = 400;

    const driftScaled = electricField * 0.01; // Scaled for visualization

    electrons.forEach((electron) => {
        const pos = electron.body.position;
        const vel = electron.body.velocity;

        // Add drift component (rightward if field is positive)
        const newVelX = vel.x + driftScaled * 0.01;
        const newVelY = vel.y;

        Body.setVelocity(electron.body, { x: newVelX, y: newVelY });

        // Boundary wrap-around
        if (pos.x > wireRight) {
            Body.setPosition(electron.body, { x: wireLeft, y: pos.y });
        }
        if (pos.x < wireLeft) {
            Body.setPosition(electron.body, { x: wireRight, y: pos.y });
        }
        if (pos.y > wireBottom) {
            Body.setPosition(electron.body, { x: pos.x, y: wireTop });
        }
        if (pos.y < wireTop) {
            Body.setPosition(electron.body, { x: pos.x, y: wireBottom });
        }

        // Collision timer (randomize direction periodically)
        electron.collisionTimer++;
        if (electron.collisionTimer > 30) {
            electron.collisionTimer = 0;
            const newAngle = Math.random() * Math.PI * 2;
            const speed = 2;
            Body.setVelocity(electron.body, {
                x: speed * Math.cos(newAngle),
                y: speed * Math.sin(newAngle)
            });

            if (showCollisions) {
                electron.body.render.fillStyle = '#FF6347';
                setTimeout(() => {
                    electron.body.render.fillStyle = '#00FFFF';
                }, 100);
            }
        }
    });
});

// Render visualization
Events.on(render, 'afterRender', function() {
    const context = render.context;

    // Draw conductor wire
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.strokeRect(100, 200, 600, 200);

    // Draw electric field arrows
    if (electricField > 0) {
        context.fillStyle = '#FFD700';
        context.font = 'bold 16px Arial';
        context.fillText('⚡ Electric Field →', 320, 180);

        for (let x = 150; x < 700; x += 100) {
            drawArrow(context, x, 180, 0, 40, '#FFD700', 2);
        }
    }

    // Display live data
    const panelX = 50;
    const panelY = 450;
    const lineHeight = 20;

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Drift Velocity - Live Data', panelX, panelY);

    context.font = '12px Arial';
    let yOffset = panelY + lineHeight + 5;

    context.fillStyle = '#FFD700';
    context.fillText(`Electric Field: ${electricField.toFixed(2)} V/m`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FFFF';
    context.fillText(`Drift Velocity: ${(driftVelocity * 1000).toFixed(6)} mm/s`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FF6347';
    context.fillText(`Thermal Velocity: ${(thermalVelocity / 1000).toFixed(2)} km/s`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FF00';
    context.fillText(`Current Density: ${currentDensity.toExponential(2)} A/m²`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FFFFFF';
    context.fillText(`Material: ${material}`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillText(`Temperature: ${temperature.toFixed(0)} K`, panelX, yOffset);

    // Formula
    context.font = 'italic 11px Arial';
    context.fillText('v_d = (e × E × τ) / m_e', 600, 580);
});

function drawArrow(context, x, y, angle, length, color, width) {
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = width;

    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(endX, endY);
    context.stroke();

    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(endX - 10 * Math.cos(angle - 0.3), endY - 10 * Math.sin(angle - 0.3));
    context.lineTo(endX - 10 * Math.cos(angle + 0.3), endY - 10 * Math.sin(angle + 0.3));
    context.closePath();
    context.fill();
}

function resetScene() {
    Runner.stop(runner);
    createDriftVelocitySimulation();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    createDriftVelocitySimulation();
}

// Custom Control Panel
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
        }
        .value-display {
            float: right;
            color: #10A37F;
            font-weight: bold;
        }
        .panel-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #10A37F;
            text-align: center;
        }
        select {
            width: 100%;
            padding: 5px;
            background: #2A2A2C;
            color: #ECECF1;
            border: 1px solid #4D4D4F;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">⚡ Drift Velocity Controls</div>

        <div class="control-group">
            <label>Electric Field (V/m): <span class="value-display" id="field-value">100</span></label>
            <input type="range" id="field-slider" min="0" max="1000" step="10" value="100">
        </div>

        <div class="control-group">
            <label>Temperature (K): <span class="value-display" id="temp-value">300</span></label>
            <input type="range" id="temp-slider" min="0" max="500" step="10" value="300">
        </div>

        <div class="control-group">
            <label>Material:</label>
            <select id="material-select">
                <option value="Copper">Copper</option>
                <option value="Aluminum">Aluminum</option>
                <option value="Silver">Silver</option>
                <option value="Iron">Iron</option>
            </select>
        </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('field-slider').addEventListener('input', function(e) {
        electricField = parseFloat(e.target.value);
        document.getElementById('field-value').textContent = electricField.toFixed(0);
        createDriftVelocitySimulation();
    });

    document.getElementById('temp-slider').addEventListener('input', function(e) {
        temperature = parseFloat(e.target.value);
        document.getElementById('temp-value').textContent = temperature.toFixed(0);
        createDriftVelocitySimulation();
    });

    document.getElementById('material-select').addEventListener('change', function(e) {
        material = e.target.value;
        relaxationTime = materials[material].relaxation;
        createDriftVelocitySimulation();
    });
}

addCustomControlStyles();
createCustomControlPanel();
createDriftVelocitySimulation();
return {engine,runner};
}