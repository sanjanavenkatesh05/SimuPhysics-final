// gravitational_two_body_stationary.js - Two Stationary Bodies Attracting

// Global variables


const defaultValues={
    mass1:30,
    mass2:30,
    initialDistance:400
};

function startSimulation(parameters)
{
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
let mass1 = parameters?.mass1??defaultValues.mass1;
let mass2 = parameters?.mass2??defaultValues.mass2;
let initialDistance = parameters?.initialDistance??defaultValues.initialDistance;
const G = 6.674e-11;


let body1, body2;
let currentForce = 0;
let currentDistance = 0;
let initialForce = 0;

// Disable Matter.js gravity (we'll calculate our own)
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

// Create two stationary bodies
function createTwoBodySystem() {
    const centerX = 400;
    const centerY = 300;

    // Calculate radii based on mass (visual representation)
    const radius1 = Math.sqrt(mass1) * 3;
    const radius2 = Math.sqrt(mass2) * 3;

    // Position bodies with distance between them
    body1 = Bodies.circle(centerX - distance / 2, centerY, radius1, {
        frictionAir: 0,
        friction: 0,
        restitution: 0,
        render: { fillStyle: '#FF6347' } // Red
    });

    body2 = Bodies.circle(centerX + distance / 2, centerY, radius2, {
        frictionAir: 0,
        friction: 0,
        restitution: 0,
        render: { fillStyle: '#4169E1' } // Blue
    });

    // Set mass
    Body.setMass(body1, m1);
    Body.setMass(body2, m2);

    // Start with ZERO velocity (completely stationary)
    Body.setVelocity(body1, { x: 0, y: 0 });
    Body.setVelocity(body2, { x: 0, y: 0 });

    Composite.add(world, [body1, body2]);

    // Calculate initial force
    initialForce = (G * mass1 * mass2) / (initialDistance * initialDistance);
}

// Apply gravitational forces between bodies
Events.on(engine, 'beforeUpdate', function() {
    if (body1 && body2 && body1.position && body2.position) {
        // Calculate distance between bodies
        const dx = body2.position.x - body1.position.x;
        const dy = body2.position.y - body1.position.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared);

        currentDistance = distance;

        // Prevent collision/extreme forces
        if (distance > (body1.circleRadius + body2.circleRadius + 5)) {
            // Calculate gravitational force magnitude: F = G * m1 * m2 / r^2
            const forceMagnitude = (G * mass1 * mass2) / distanceSquared;
            currentForce = forceMagnitude;

            // Calculate force components (direction from each body to the other)
            const forceX = (forceMagnitude * dx) / distance;
            const forceY = (forceMagnitude * dy) / distance;

            // Apply forces (Newton's third law: equal and opposite)
            // Force on body1 towards body2
            Body.applyForce(body1, body1.position, { x: forceX / mass1, y: forceY / mass1 });

            // Force on body2 towards body1
            Body.applyForce(body2, body2.position, { x: -forceX / mass2, y: -forceY / mass2 });
        } else {
            currentForce = 0;
        }
    }
});

// Draw connection line, force vectors, and live information
Events.on(render, 'afterRender', function() {
    if (!body1 || !body2) return;

    const context = render.context;

    // Calculate current values
    const dx = body2.position.x - body1.position.x;
    const dy = body2.position.y - body1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const velocity1 = Math.sqrt(body1.velocity.x ** 2 + body1.velocity.y ** 2);
    const velocity2 = Math.sqrt(body2.velocity.x ** 2 + body2.velocity.y ** 2);

    // Draw connection line between bodies
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.globalAlpha = 0.5;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(body1.position.x, body1.position.y);
    context.lineTo(body2.position.x, body2.position.y);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1.0;

    // Draw force vectors (arrows) from each body
    const forceScale = 80; // Scale for visualization
    const arrowLength = currentForce * forceScale;

    if (arrowLength > 2) {
        // Force arrow on body1 (pointing towards body2)
        const angle = Math.atan2(dy, dx);
        drawArrow(context, body1.position.x, body1.position.y, angle, arrowLength, '#FFD700', 3);

        // Force arrow on body2 (pointing towards body1)
        drawArrow(context, body2.position.x, body2.position.y, angle + Math.PI, arrowLength, '#00FF00', 3);
    }

    // Display live information panel
    const panelX = 10;
    const panelY = 20;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(panelX - 5, panelY - 15, 350, 190);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Gravitational Attraction - Live Data', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    // Distance info
    context.fillStyle = '#00FFFF';
    context.fillText(`Distance: ${distance.toFixed(2)} px`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FFFFFF';
    context.fillText(`Initial Distance: ${initialDistance.toFixed(2)} px`, panelX, yOffset);
    yOffset += lineHeight;

    // Force info
    context.fillStyle = '#FFD700';
    context.font = 'bold 13px Arial';
    context.fillText(`Current Force: ${currentForce.toFixed(4)}`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#AAAAAA';
    context.font = '13px Arial';
    context.fillText(`Initial Force: ${initialForce.toFixed(4)}`, panelX, yOffset);
    yOffset += lineHeight;

    // Force change percentage
    const forceIncrease = ((currentForce / initialForce) - 1) * 100;
    context.fillStyle = forceIncrease > 0 ? '#00FF00' : '#FFFFFF';
    context.fillText(`Force Increase: ${forceIncrease > 0 ? '+' : ''}${forceIncrease.toFixed(1)}%`, panelX, yOffset);
    yOffset += lineHeight;

    // Velocity info
    yOffset += 5;
    context.fillStyle = '#FF6347';
    context.fillText(`Body 1 Speed: ${velocity1.toFixed(3)}`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#4169E1';
    context.fillText(`Body 2 Speed: ${velocity2.toFixed(3)}`, panelX, yOffset);
    yOffset += lineHeight;

    // Formula display at bottom
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 12px Arial';
    context.fillText('Formula: F = G × m₁ × m₂ / r²', 10, 580);
    context.fillText('(Force increases as distance decreases)', 10, 595);
});

// Helper function to draw arrow
function drawArrow(context, x, y, angle, length, color, width) {
    const headLength = 12;
    const headWidth = 8;

    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = width;

    const endX = x + length * Math.cos(angle);
    const endY = y + length * Math.sin(angle);

    // Draw line
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(endX, endY);
    context.stroke();

    // Draw arrowhead
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(
        endX - headLength * Math.cos(angle) - headWidth * Math.sin(angle),
        endY - headLength * Math.sin(angle) + headWidth * Math.cos(angle)
    );
    context.lineTo(
        endX - headLength * Math.cos(angle) + headWidth * Math.sin(angle),
        endY - headLength * Math.sin(angle) - headWidth * Math.cos(angle)
    );
    context.closePath();
    context.fill();
}

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    createTwoBodySystem(mass1, mass2, initialDistance);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createTwoBodySystem(mass1, mass2, initialDistance);
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
            max-height: calc(100vh - 100px);
            overflow-y: auto;
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
        .control-group input[type="range"] {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: #4D4D4F;
            outline: none;
            -webkit-appearance: none;
        }
        .control-group input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #10A37F;
            cursor: pointer;
        }
        .control-group input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #10A37F;
            cursor: pointer;
            border: none;
        }
        .value-display {
            display: inline-block;
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
        .info-box {
            background: #2A2A2C;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 11px;
            color: #ECECF1;
            line-height: 1.5;
        }
        .info-text {
            font-size: 11px;
            color: #999;
            margin-top: 5px;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">Gravitational Force</div>

        <div class="info-box">
            <strong>Concept:</strong> Two stationary bodies start at rest. Watch them accelerate towards each other as gravitational force pulls them together. Force increases as distance decreases!
        </div>

        <div class="control-group">
            <label>Mass 1 (Red): <span class="value-display" id="mass1-value">${mass1}</span></label>
            <input type="range" id="mass1-slider" min="10" max="60" step="5" value="${mass1}">
            <div class="info-text">Heavier mass = stronger attraction</div>
        </div>

        <div class="control-group">
            <label>Mass 2 (Blue): <span class="value-display" id="mass2-value">${mass2}</span></label>
            <input type="range" id="mass2-slider" min="10" max="60" step="5" value="${mass2}">
            <div class="info-text">Heavier mass = stronger attraction</div>
        </div>

        <div class="control-group">
            <label>Initial Distance: <span class="value-display" id="distance-value">${initialDistance}</span></label>
            <input type="range" id="distance-slider" min="150" max="600" step="10" value="${initialDistance}">
            <div class="info-text">Starting separation between bodies</div>
        </div>

        <div class="control-group">
            <label>Gravity Constant (G): <span class="value-display" id="g-value">${G}</span></label>
            <input type="range" id="g-slider" min="0.1" max="2.0" step="0.1" value="${G}">
            <div class="info-text">Controls force strength</div>
        </div>

        <div class="info-box">
            <strong>Legend:</strong><br>
            Yellow arrow = Force on Body 1<br>
            Green arrow = Force on Body 2<br>
            Arrow length shows force magnitude
        </div>
    `;

    document.body.appendChild(panel);
    attachControlListeners();
}

function attachControlListeners() {
    // Mass 1
    document.getElementById('mass1-slider').addEventListener('input', function() {
        mass1 = parseFloat(this.value);
        document.getElementById('mass1-value').textContent = mass1;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    // Mass 2
    document.getElementById('mass2-slider').addEventListener('input', function() {
        mass2 = parseFloat(this.value);
        document.getElementById('mass2-value').textContent = mass2;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    // Distance
    document.getElementById('distance-slider').addEventListener('input', function() {
        initialDistance = parseFloat(this.value);
        document.getElementById('distance-value').textContent = initialDistance;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    // G constant
    document.getElementById('g-slider').addEventListener('input', function() {
        G = parseFloat(this.value);
        document.getElementById('g-value').textContent = G.toFixed(1);
    });
}

function ResetGUI() {
    document.getElementById('mass1-slider').value = mass1;
    document.getElementById('mass2-slider').value = mass2;
    document.getElementById('distance-slider').value = initialDistance;
    document.getElementById('g-slider').value = G;

    document.getElementById('mass1-value').textContent = mass1;
    document.getElementById('mass2-value').textContent = mass2;
    document.getElementById('distance-value').textContent = initialDistance;
    document.getElementById('g-value').textContent = G.toFixed(1);
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createTwoBodySystem();
return {engine,runner};
}