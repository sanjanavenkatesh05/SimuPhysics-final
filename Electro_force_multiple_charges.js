// force_multiple_charges.js - Force on Test Charge from Multiple Charges

const defaultValues={
    testCharge:1.0,
    charge1:5.0,
    charge2:-5.0,
    charge3:3.0
}




// Global variables
function startSimulation(parameters){
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
let testCharge = parameters?.testCharge??defaultValues.testCharge;
let charge1 = parameters?.charge1??defaultValues.charge1;
let charge2 = parameters?.charge2??defaultValues.charge2;
let charge3 = parameters?.charge3??defaultValues.charge3;
let k = 9.0;

let testBody, body1, body2, body3;
let isDragging = false;

// Disable Matter.js gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

function createMultiChargeSystem(qTest, q1, q2, q3, kVal) {
    testCharge = qTest;
    charge1 = q1;
    charge2 = q2;
    charge3 = q3;
    k = kVal;

    const testRadius = 15;
    const chargeRadius = 20;

    // Create test charge at center (draggable)
    testBody = Bodies.circle(400, 300, testRadius, {
        isStatic: false,
        frictionAir: 0,
        friction: 0,
        render: { fillStyle: testCharge > 0 ? '#FFD700' : '#9370DB' }
    });
    Body.setMass(testBody, 0.1);

    // Create fixed charges around test charge
    body1 = Bodies.circle(250, 200, chargeRadius, {
        isStatic: true,
        render: { fillStyle: charge1 > 0 ? '#FF6347' : '#4169E1' }
    });

    body2 = Bodies.circle(550, 200, chargeRadius, {
        isStatic: true,
        render: { fillStyle: charge2 > 0 ? '#FF6347' : '#4169E1' }
    });

    body3 = Bodies.circle(400, 450, chargeRadius, {
        isStatic: true,
        render: { fillStyle: charge3 > 0 ? '#FF6347' : '#4169E1' }
    });

    Composite.add(world, [testBody, body1, body2, body3]);
}

// Calculate force from one charge on test charge
function calculateForce(sourceCharge, sourcePos, testPos) {
    const dx = testPos.x - sourcePos.x;
    const dy = testPos.y - sourcePos.y;
    const distSquared = dx * dx + dy * dy;
    const dist = Math.sqrt(distSquared);

    if (dist < 1) return { x: 0, y: 0, magnitude: 0 };

    const forceMag = (k * Math.abs(sourceCharge * testCharge)) / distSquared;
    const isRepulsive = (sourceCharge * testCharge) > 0;
    const direction = isRepulsive ? 1 : -1;

    const forceX = direction * forceMag * (dx / dist);
    const forceY = direction * forceMag * (dy / dist);

    return { x: forceX, y: forceY, magnitude: forceMag };
}

// Apply forces
Events.on(engine, 'beforeUpdate', function() {
    if (!testBody || isDragging) return;

    // Calculate individual forces
    const F1 = calculateForce(charge1, body1.position, testBody.position);
    const F2 = calculateForce(charge2, body2.position, testBody.position);
    const F3 = calculateForce(charge3, body3.position, testBody.position);

    // Net force
    const netForceX = F1.x + F2.x + F3.x;
    const netForceY = F1.y + F2.y + F3.y;

    // Apply net force
    Body.applyForce(testBody, testBody.position, { 
        x: netForceX * 0.0001, 
        y: netForceY * 0.0001 
    });
});

// Mouse drag for test charge
Events.on(render.mouse, 'mousedown', function(event) {
    const mousePos = event.mouse.position;
    const dist = Math.sqrt(
        (mousePos.x - testBody.position.x) ** 2 + 
        (mousePos.y - testBody.position.y) ** 2
    );
    if (dist < 20) {
        isDragging = true;
        Body.setVelocity(testBody, { x: 0, y: 0 });
    }
});

Events.on(render.mouse, 'mousemove', function(event) {
    if (isDragging) {
        Body.setPosition(testBody, event.mouse.position);
    }
});

Events.on(render.mouse, 'mouseup', function() {
    isDragging = false;
});

// Draw forces and information
Events.on(render, 'afterRender', function() {
    if (!testBody) return;

    const context = render.context;

    // Calculate all forces
    const F1 = calculateForce(charge1, body1.position, testBody.position);
    const F2 = calculateForce(charge2, body2.position, testBody.position);
    const F3 = calculateForce(charge3, body3.position, testBody.position);

    // Net force
    const netForceX = F1.x + F2.x + F3.x;
    const netForceY = F1.y + F2.y + F3.y;
    const netForceMag = Math.sqrt(netForceX * netForceX + netForceY * netForceY);

    const scale = 30;

    // Draw individual force vectors
    drawForceVector(context, testBody.position, F1, scale, '#FF6347', 'F₁');
    drawForceVector(context, testBody.position, F2, scale, '#4169E1', 'F₂');
    drawForceVector(context, testBody.position, F3, scale, '#32CD32', 'F₃');

    // Draw net force vector (thicker, different color)
    context.strokeStyle = '#FFD700';
    context.lineWidth = 5;
    const netAngle = Math.atan2(netForceY, netForceX);
    const netLength = Math.min(netForceMag * scale, 120);

    context.beginPath();
    context.moveTo(testBody.position.x, testBody.position.y);
    context.lineTo(
        testBody.position.x + netLength * Math.cos(netAngle),
        testBody.position.y + netLength * Math.sin(netAngle)
    );
    context.stroke();

    drawArrowhead(context, 
        testBody.position.x + netLength * Math.cos(netAngle),
        testBody.position.y + netLength * Math.sin(netAngle),
        netAngle, 12, '#FFD700');

    // Label net force
    context.fillStyle = '#FFD700';
    context.font = 'bold 14px Arial';
    context.fillText('F_net', 
        testBody.position.x + (netLength + 20) * Math.cos(netAngle),
        testBody.position.y + (netLength + 20) * Math.sin(netAngle));

    // Draw charge symbols
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(charge1 > 0 ? '+' : '−', body1.position.x, body1.position.y);
    context.fillText(charge2 > 0 ? '+' : '−', body2.position.x, body2.position.y);
    context.fillText(charge3 > 0 ? '+' : '−', body3.position.x, body3.position.y);
    context.fillText('T', testBody.position.x, testBody.position.y);

    // Display live information panel
    const panelX = 10;
    const panelY = 20;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.textAlign = 'left';
    context.fillText('Force on Test Charge - Vector Addition', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    // Test charge info
    context.fillStyle = '#FFD700';
    context.fillText(`Test Charge: ${testCharge.toFixed(1)} C (Drag to move)`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Individual forces
    context.fillStyle = '#FF6347';
    context.fillText(`Force from q₁ (${charge1.toFixed(1)}C): ${F1.magnitude.toFixed(4)} N`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#4169E1';
    context.fillText(`Force from q₂ (${charge2.toFixed(1)}C): ${F2.magnitude.toFixed(4)} N`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#32CD32';
    context.fillText(`Force from q₃ (${charge3.toFixed(1)}C): ${F3.magnitude.toFixed(4)} N`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Net force
    context.fillStyle = '#FFD700';
    context.font = 'bold 14px Arial';
    context.fillText(`NET FORCE MAGNITUDE: ${netForceMag.toFixed(4)} N`, panelX, yOffset);
    yOffset += lineHeight;

    context.font = '13px Arial';
    context.fillStyle = '#FFFFFF';
    context.fillText(`F_net_x: ${netForceX.toFixed(4)} N`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`F_net_y: ${netForceY.toFixed(4)} N`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Vector addition info
    context.fillStyle = '#AAAAAA';
    context.font = '12px Arial';
    context.fillText('Vector Addition: F_net = F₁ + F₂ + F₃', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText('Gold arrow = Resultant force', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText('Drag test charge (T) to move it', panelX, yOffset);

    // Formula at bottom
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 12px Arial';
    context.fillText('Formula: F = k × q₁ × q₂ / r² (vector sum)', 10, 580);
    context.fillText('Red/Blue/Green arrows = individual forces', 10, 595);
});

// Draw individual force vector
function drawForceVector(context, origin, force, scale, color, label) {
    if (force.magnitude < 0.001) return;

    const length = Math.min(force.magnitude * scale, 100);
    const angle = Math.atan2(force.y, force.x);

    context.strokeStyle = color;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(origin.x, origin.y);
    context.lineTo(
        origin.x + length * Math.cos(angle),
        origin.y + length * Math.sin(angle)
    );
    context.stroke();

    drawArrowhead(context,
        origin.x + length * Math.cos(angle),
        origin.y + length * Math.sin(angle),
        angle, 10, color);

    // Label
    context.fillStyle = color;
    context.font = 'bold 12px Arial';
    context.fillText(label,
        origin.x + (length + 15) * Math.cos(angle),
        origin.y + (length + 15) * Math.sin(angle));
}

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

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    createMultiChargeSystem(testCharge, charge1, charge2, charge3, k);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createMultiChargeSystem(testCharge, charge1, charge2, charge3, k);
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
        <div class="panel-title">Multiple Charges</div>

        <div class="info-box">
            <strong>Vector Addition</strong><br>
            • Red, Blue, Green = individual forces<br>
            • Gold = Net force (F_net)<br>
            • Drag test charge 'T' to move<br>
            • Watch forces change!
        </div>

        <div class="control-group">
            <label>Test Charge: <span class="value-display" id="qtest-value">${testCharge.toFixed(1)}</span></label>
            <input type="range" id="qtest-slider" min="-5" max="5" step="0.5" value="${testCharge}">
            <div class="info-text">Charge being tested (draggable)</div>
        </div>

        <div class="control-group">
            <label>Charge q₁: <span class="value-display" id="q1-value">${charge1.toFixed(1)}</span></label>
            <input type="range" id="q1-slider" min="-10" max="10" step="0.5" value="${charge1}">
            <div class="info-text">Top-left charge</div>
        </div>

        <div class="control-group">
            <label>Charge q₂: <span class="value-display" id="q2-value">${charge2.toFixed(1)}</span></label>
            <input type="range" id="q2-slider" min="-10" max="10" step="0.5" value="${charge2}">
            <div class="info-text">Top-right charge</div>
        </div>

        <div class="control-group">
            <label>Charge q₃: <span class="value-display" id="q3-value">${charge3.toFixed(1)}</span></label>
            <input type="range" id="q3-slider" min="-10" max="10" step="0.5" value="${charge3}">
            <div class="info-text">Bottom charge</div>
        </div>

        <div class="control-group">
            <label>Coulomb Constant (k): <span class="value-display" id="k-value">${k.toFixed(1)}</span></label>
            <input type="range" id="k-slider" min="1" max="20" step="0.5" value="${k}">
        </div>
    `;

    document.body.appendChild(panel);
    attachControlListeners();
}

function attachControlListeners() {
    document.getElementById('qtest-slider').addEventListener('input', function() {
        testCharge = parseFloat(this.value);
        document.getElementById('qtest-value').textContent = testCharge.toFixed(1);
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('q1-slider').addEventListener('input', function() {
        charge1 = parseFloat(this.value);
        document.getElementById('q1-value').textContent = charge1.toFixed(1);
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('q2-slider').addEventListener('input', function() {
        charge2 = parseFloat(this.value);
        document.getElementById('q2-value').textContent = charge2.toFixed(1);
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('q3-slider').addEventListener('input', function() {
        charge3 = parseFloat(this.value);
        document.getElementById('q3-value').textContent = charge3.toFixed(1);
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('k-slider').addEventListener('input', function() {
        k = parseFloat(this.value);
        document.getElementById('k-value').textContent = k.toFixed(1);
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });
}

function ResetGUI() {
    document.getElementById('qtest-slider').value = testCharge;
    document.getElementById('q1-slider').value = charge1;
    document.getElementById('q2-slider').value = charge2;
    document.getElementById('q3-slider').value = charge3;
    document.getElementById('k-slider').value = k;

    document.getElementById('qtest-value').textContent = testCharge.toFixed(1);
    document.getElementById('q1-value').textContent = charge1.toFixed(1);
    document.getElementById('q2-value').textContent = charge2.toFixed(1);
    document.getElementById('q3-value').textContent = charge3.toFixed(1);
    document.getElementById('k-value').textContent = k.toFixed(1);
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createMultiChargeSystem(testCharge, charge1, charge2, charge3, k);
return {engine,runner};
}