// torque_simulation.js - Torque and Angular Motion
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
// Global variables
let rodLength = 300;
let forceMagnitude = 10;
let forceAngle = 90; // degrees from horizontal
let forcePosition = 0.8; // fraction of rod length (0 to 1)
let rodMass = 10;

let rod, pivot;
let isApplyingForce = false;

// Disable Matter.js gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

function createTorqueSystem(length, force, angle, position, mass) {
    rodLength = length;
    forceMagnitude = force;
    forceAngle = angle;
    forcePosition = position;
    rodMass = mass;

    const centerX = 400;
    const centerY = 300;
    const rodWidth = 20;

    // Create pivot point (fixed)
    pivot = Bodies.circle(centerX, centerY, 10, {
        isStatic: true,
        render: { fillStyle: '#808080' }
    });

    // Create rod (rotatable around pivot)
    rod = Bodies.rectangle(centerX + rodLength / 2, centerY, rodLength, rodWidth, {
        frictionAir: 0.02,
        friction: 0,
        render: { fillStyle: '#FF6347' }
    });
    Body.setMass(rod, mass);

    // Constrain rod to pivot
    const constraint = Constraint.create({
        bodyA: pivot,
        bodyB: rod,
        pointA: { x: 0, y: 0 },
        pointB: { x: -rodLength / 2, y: 0 },
        length: 0,
        stiffness: 1
    });

    Composite.add(world, [pivot, rod, constraint]);
}

// Apply torque based on force
Events.on(engine, 'beforeUpdate', function() {
    if (!rod || !isApplyingForce) return;

    // Calculate force application point
    const rodAngle = rod.angle;
    const forcePointX = rod.position.x + (rodLength / 2) * (2 * forcePosition - 1) * Math.cos(rodAngle);
    const forcePointY = rod.position.y + (rodLength / 2) * (2 * forcePosition - 1) * Math.sin(rodAngle);

    // Force direction (in world coordinates)
    const forceAngleRad = (forceAngle * Math.PI) / 180;
    const forceX = forceMagnitude * Math.cos(forceAngleRad);
    const forceY = forceMagnitude * Math.sin(forceAngleRad);

    // Apply force at the point
    Body.applyForce(rod, { x: forcePointX, y: forcePointY }, { 
        x: forceX * 0.001, 
        y: forceY * 0.001 
    });
});

// Calculate torque
function calculateTorque() {
    if (!rod) return { torque: 0, leverArm: 0, perpComponent: 0 };

    const rodAngle = rod.angle;

    // Position vector from pivot to force point (in rod frame)
    const r = rodLength * (forcePosition - 0.5);

    // Force angle in world frame
    const forceAngleRad = (forceAngle * Math.PI) / 180;

    // Angle between rod and force
    const relativeAngle = forceAngleRad - rodAngle;

    // Perpendicular component of force
    const perpForce = forceMagnitude * Math.sin(relativeAngle);

    // Torque = r × F (magnitude)
    const torque = Math.abs(r) * perpForce;

    // Lever arm (perpendicular distance)
    const leverArm = Math.abs(r * Math.sin(relativeAngle));

    return { 
        torque: torque, 
        leverArm: leverArm, 
        perpComponent: perpForce,
        angle: (relativeAngle * 180) / Math.PI
    };
}

// Draw visualization
Events.on(render, 'afterRender', function() {
    if (!rod || !pivot) return;

    const context = render.context;

    // Calculate force application point
    const rodAngle = rod.angle;
    const forcePointX = rod.position.x + (rodLength / 2) * (2 * forcePosition - 1) * Math.cos(rodAngle);
    const forcePointY = rod.position.y + (rodLength / 2) * (2 * forcePosition - 1) * Math.sin(rodAngle);

    // Draw lever arm line (from pivot to force point)
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.globalAlpha = 0.3;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(pivot.position.x, pivot.position.y);
    context.lineTo(forcePointX, forcePointY);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1.0;

    // Draw force vector
    const forceAngleRad = (forceAngle * Math.PI) / 180;
    const forceScale = 3;
    const forceEndX = forcePointX + forceMagnitude * forceScale * Math.cos(forceAngleRad);
    const forceEndY = forcePointY + forceMagnitude * forceScale * Math.sin(forceAngleRad);

    context.strokeStyle = '#00FF00';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(forcePointX, forcePointY);
    context.lineTo(forceEndX, forceEndY);
    context.stroke();

    // Draw arrowhead
    drawArrowhead(context, forceEndX, forceEndY, forceAngleRad, 12, '#00FF00');

    // Draw force application point
    context.fillStyle = '#FFD700';
    context.beginPath();
    context.arc(forcePointX, forcePointY, 8, 0, 2 * Math.PI);
    context.fill();

    // Draw pivot point highlight
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(pivot.position.x, pivot.position.y, 12, 0, 2 * Math.PI);
    context.fill();
    context.fillStyle = '#000000';
    context.beginPath();
    context.arc(pivot.position.x, pivot.position.y, 6, 0, 2 * Math.PI);
    context.fill();

    // Calculate torque
    const torqueData = calculateTorque();
    const angularVel = rod.angularVelocity;
    const angularAccel = rod.angularSpeed; // Approximation

    // Display live information panel
    const panelX = 10;
    const panelY = 20;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.85)';
    context.fillRect(panelX - 5, panelY - 15, 420, 300);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.textAlign = 'left';
    context.fillText('Torque & Angular Motion', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    // Rod properties
    context.fillStyle = '#FF6347';
    context.fillText(`Rod Length: ${rodLength.toFixed(0)} px`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`Rod Mass: ${rodMass.toFixed(1)} kg`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`Rod Angle: ${(rodAngle * 180 / Math.PI).toFixed(1)}°`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Force properties
    context.fillStyle = '#00FF00';
    context.fillText(`Force Magnitude: ${forceMagnitude.toFixed(1)} N`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`Force Angle: ${forceAngle.toFixed(1)}°`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`Force Position: ${(forcePosition * 100).toFixed(0)}% of rod`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Torque calculations
    context.fillStyle = '#FFD700';
    context.font = 'bold 14px Arial';
    context.fillText(`TORQUE (τ): ${torqueData.torque.toFixed(3)} N·m`, panelX, yOffset);
    yOffset += lineHeight;

    context.font = '13px Arial';
    context.fillStyle = '#FFFFFF';
    context.fillText(`Lever Arm (r): ${torqueData.leverArm.toFixed(2)} m`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`Perpendicular Force: ${torqueData.perpComponent.toFixed(2)} N`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`Angle (r to F): ${torqueData.angle.toFixed(1)}°`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Angular motion
    context.fillStyle = '#00FFFF';
    context.fillText(`Angular Velocity: ${angularVel.toFixed(4)} rad/s`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`Angular Speed: ${Math.abs(angularVel).toFixed(4)} rad/s`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Instructions
    context.fillStyle = '#AAAAAA';
    context.font = '12px Arial';
    context.fillText('Press SPACE to apply force', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText('Green arrow = Force vector', panelX, yOffset);

    // Formulas at bottom
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 11px Arial';
    context.fillText('Torque: τ = r × F = r·F·sin(θ)', 10, 570);
    context.fillText('Angular acceleration: α = τ / I', 10, 585);
    context.fillText('I (rod about end) = (1/3)·m·L²', 10, 600);
});

function drawArrowhead(context, x, y, angle, size, color) {
    context.save();
    context.translate(x, y);
    context.rotate(angle);

    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(-size, -size/2);
    context.lineTo(-size, size/2);
    context.closePath();
    context.fill();

    context.restore();
}

// Keyboard control
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        isApplyingForce = true;
        event.preventDefault();
    }
});

document.addEventListener('keyup', function(event) {
    if (event.code === 'Space') {
        isApplyingForce = false;
    }
});

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    createTorqueSystem(rodLength, forceMagnitude, forceAngle, forcePosition, rodMass);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createTorqueSystem(rodLength, forceMagnitude, forceAngle, forcePosition, rodMass);
}

// ======= CUSTOM CONTROL PANEL =======
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
            max-height: calc(100vh - 100px);
            overflow-y: auto;
        }
        .simulation-container { margin-right: 340px !important; }
        .control-group { margin-bottom: 15px; }
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
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #10A37F;
            cursor: pointer;
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
        .info-box {
            background: #2A2A2C;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 11px;
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
        <div class="panel-title">Torque Simulation</div>

        <div class="info-box">
            <strong>Torque Formula:</strong><br>
            τ = r × F = r·F·sin(θ)<br>
            <br>
            <strong>Controls:</strong><br>
            • Press SPACE to apply force<br>
            • Adjust force properties below<br>
            • Watch rod rotate!
        </div>

        <div class="control-group">
            <label>Rod Length: <span class="value-display" id="length-value">${rodLength}</span></label>
            <input type="range" id="length-slider" min="150" max="400" step="10" value="${rodLength}">
            <div class="info-text">Length of rotating rod</div>
        </div>

        <div class="control-group">
            <label>Rod Mass: <span class="value-display" id="mass-value">${rodMass}</span></label>
            <input type="range" id="mass-slider" min="5" max="30" step="1" value="${rodMass}">
            <div class="info-text">Moment of inertia depends on mass</div>
        </div>

        <div class="control-group">
            <label>Force Magnitude: <span class="value-display" id="force-value">${forceMagnitude}</span></label>
            <input type="range" id="force-slider" min="1" max="30" step="1" value="${forceMagnitude}">
            <div class="info-text">Force applied (N)</div>
        </div>

        <div class="control-group">
            <label>Force Angle: <span class="value-display" id="angle-value">${forceAngle}°</span></label>
            <input type="range" id="angle-slider" min="0" max="180" step="5" value="${forceAngle}">
            <div class="info-text">Direction of force (degrees)</div>
        </div>

        <div class="control-group">
            <label>Force Position: <span class="value-display" id="position-value">${(forcePosition * 100).toFixed(0)}%</span></label>
            <input type="range" id="position-slider" min="0.1" max="1" step="0.1" value="${forcePosition}">
            <div class="info-text">Where force is applied on rod</div>
        </div>
    `;

    document.body.appendChild(panel);
    attachControlListeners();
}

function attachControlListeners() {
    document.getElementById('length-slider').addEventListener('input', function() {
        rodLength = parseFloat(this.value);
        document.getElementById('length-value').textContent = rodLength;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('mass-slider').addEventListener('input', function() {
        rodMass = parseFloat(this.value);
        document.getElementById('mass-value').textContent = rodMass;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('force-slider').addEventListener('input', function() {
        forceMagnitude = parseFloat(this.value);
        document.getElementById('force-value').textContent = forceMagnitude;
    });

    document.getElementById('angle-slider').addEventListener('input', function() {
        forceAngle = parseFloat(this.value);
        document.getElementById('angle-value').textContent = forceAngle + '°';
    });

    document.getElementById('position-slider').addEventListener('input', function() {
        forcePosition = parseFloat(this.value);
        document.getElementById('position-value').textContent = (forcePosition * 100).toFixed(0) + '%';
    });
}

function ResetGUI() {
    document.getElementById('length-slider').value = rodLength;
    document.getElementById('mass-slider').value = rodMass;
    document.getElementById('force-slider').value = forceMagnitude;
    document.getElementById('angle-slider').value = forceAngle;
    document.getElementById('position-slider').value = forcePosition;

    document.getElementById('length-value').textContent = rodLength;
    document.getElementById('mass-value').textContent = rodMass;
    document.getElementById('force-value').textContent = forceMagnitude;
    document.getElementById('angle-value').textContent = forceAngle + '°';
    document.getElementById('position-value').textContent = (forcePosition * 100).toFixed(0) + '%';
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createTorqueSystem(rodLength, forceMagnitude, forceAngle, forcePosition, rodMass);
