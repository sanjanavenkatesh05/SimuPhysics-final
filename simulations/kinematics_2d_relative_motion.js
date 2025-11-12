// kinematics_2d_relative_motion.js - Relative Motion Visualization
const defaultValues={
    velocityA_x:3,
    velocityA_y:2,
    velocityB_x:-2,
    velocityB_y:3
}


startSimulation(parameters)
{
// Global variables
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
let velocityA_x =parameters?.velocityA_x??defaultValues.velocityA_x;
let velocityA_y = parameters?.velocityA_y??defaultValues.velocityA_y;
let velocityB_x = parameters?.velocityB_x??defaultValues.velocityB_x;
let velocityB_y = parameters?.velocityB_y??defaultValues.velocityB_y;

let positionA = { x: 100, y: 300 };
let positionB = { x: 600, y: 300 };
let time = 0;
let trailPointsA = [];
let trailPointsB = [];
let maxTrailPoints = 80;
let simulationComplete = false;

// Relative velocity
let relativeVelocity = { x: 0, y: 0 };

// Disable gravity
engine.world.gravity.y = 0;

function createRelativeMotionSimulation() {
    Matter.World.clear(engine.world, false);
    trailPointsA = [];
    trailPointsB = [];
    time = 0;
    simulationComplete = false;

    positionA = { x: 100, y: 300 };
    positionB = { x: 600, y: 300 };

    // Create object A (red)
    const objectA = Bodies.circle(positionA.x, positionA.y, 15, {
        render: { fillStyle: '#FF6347' },
        friction: 0,
        frictionAir: 0
    });

    // Create object B (blue)
    const objectB = Bodies.circle(positionB.x, positionB.y, 15, {
        render: { fillStyle: '#4169E1' },
        friction: 0,
        frictionAir: 0
    });

    Composite.add(world, [objectA, objectB]);
    window.objectA = objectA;
    window.objectB = objectB;

    calculateRelativeVelocity();
}

function calculateRelativeVelocity() {
    // V_BA = V_B - V_A (velocity of B relative to A)
    relativeVelocity.x = velocityB_x - velocityA_x;
    relativeVelocity.y = velocityB_y - velocityA_y;
}

Events.on(engine, 'beforeUpdate', function() {
    if (isPlaying && !simulationComplete) {
        time += 1/60;

        // Update positions
        positionA.x += velocityA_x;
        positionA.y -= velocityA_y; // Negative because canvas y increases downward
        positionB.x += velocityB_x;
        positionB.y -= velocityB_y;

        // Boundary check
        if (positionA.x > 800 || positionA.x < 0 || positionA.y > 600 || positionA.y < 0 ||
            positionB.x > 800 || positionB.x < 0 || positionB.y > 600 || positionB.y < 0) {
            simulationComplete = true;
            isPlaying = false;
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        }

        // Update Matter.js bodies
        if (window.objectA && !simulationComplete) {
            Body.setPosition(window.objectA, { x: positionA.x, y: positionA.y });
            trailPointsA.push({ x: positionA.x, y: positionA.y });
            if (trailPointsA.length > maxTrailPoints) trailPointsA.shift();
        }

        if (window.objectB && !simulationComplete) {
            Body.setPosition(window.objectB, { x: positionB.x, y: positionB.y });
            trailPointsB.push({ x: positionB.x, y: positionB.y });
            if (trailPointsB.length > maxTrailPoints) trailPointsB.shift();
        }
    }
});

Events.on(render, 'afterRender', function() {
    const context = render.context;

    // Draw trails
    if (trailPointsA.length > 1) {
        context.beginPath();
        context.moveTo(trailPointsA[0].x, trailPointsA[0].y);
        for (let i = 1; i < trailPointsA.length; i++) {
            context.lineTo(trailPointsA[i].x, trailPointsA[i].y);
        }
        context.strokeStyle = 'rgba(255, 99, 71, 0.4)';
        context.lineWidth = 2;
        context.stroke();
    }

    if (trailPointsB.length > 1) {
        context.beginPath();
        context.moveTo(trailPointsB[0].x, trailPointsB[0].y);
        for (let i = 1; i < trailPointsB.length; i++) {
            context.lineTo(trailPointsB[i].x, trailPointsB[i].y);
        }
        context.strokeStyle = 'rgba(65, 105, 225, 0.4)';
        context.lineWidth = 2;
        context.stroke();
    }

    // Draw velocity vectors
    drawVelocityVector(context, positionA, velocityA_x, velocityA_y, '#FF6347', 'V_A');
    drawVelocityVector(context, positionB, velocityB_x, velocityB_y, '#4169E1', 'V_B');

    // Draw relative velocity vector from B
    drawRelativeVelocityVector(context);

    drawVectorDiagram(context);
    drawLiveDataPanel(context);
});

function drawVelocityVector(context, pos, vx, vy, color, label) {
    const scale = 15;
    const endX = pos.x + vx * scale;
    const endY = pos.y - vy * scale;

    // Arrow
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(pos.x, pos.y);
    context.lineTo(endX, endY);
    context.stroke();

    // Arrowhead
    const angle = Math.atan2(-vy, vx);
    const headSize = 10;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(endX - headSize * Math.cos(angle - Math.PI/6), 
                   endY + headSize * Math.sin(angle - Math.PI/6));
    context.lineTo(endX - headSize * Math.cos(angle + Math.PI/6), 
                   endY + headSize * Math.sin(angle + Math.PI/6));
    context.closePath();
    context.fill();

    // Label
    context.fillStyle = color;
    context.font = 'bold 14px Arial';
    context.fillText(label, endX + 10, endY - 10);
}

function drawRelativeVelocityVector(context) {
    const scale = 15;
    const startX = positionB.x;
    const startY = positionB.y;
    const endX = startX + relativeVelocity.x * scale;
    const endY = startY - relativeVelocity.y * scale;

    // Dashed line
    context.strokeStyle = '#00FF00';
    context.lineWidth = 3;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
    context.setLineDash([]);

    // Arrowhead
    const angle = Math.atan2(-relativeVelocity.y, relativeVelocity.x);
    const headSize = 10;
    context.fillStyle = '#00FF00';
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(endX - headSize * Math.cos(angle - Math.PI/6), 
                   endY + headSize * Math.sin(angle - Math.PI/6));
    context.lineTo(endX - headSize * Math.cos(angle + Math.PI/6), 
                   endY + headSize * Math.sin(angle + Math.PI/6));
    context.closePath();
    context.fill();

    // Label
    context.fillStyle = '#00FF00';
    context.font = 'bold 14px Arial';
    context.fillText('V_BA', endX + 10, endY - 10);
}

function drawVectorDiagram(context) {
    const diagramX = 480;
    const diagramY = 350;
    const diagramW = 300;
    const diagramH = 200;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(diagramX, diagramY, diagramW, diagramH);

    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.strokeRect(diagramX, diagramY, diagramW, diagramH);

    context.fillStyle = '#10A37F';
    context.font = 'bold 14px Arial';
    context.fillText('Vector Diagram', diagramX + diagramW/2 - 50, diagramY - 10);

    // Draw axes
    const centerX = diagramX + diagramW/2;
    const centerY = diagramY + diagramH/2;

    context.strokeStyle = '#666';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(diagramX + 30, centerY);
    context.lineTo(diagramX + diagramW - 30, centerY);
    context.moveTo(centerX, diagramY + 30);
    context.lineTo(centerX, diagramY + diagramH - 30);
    context.stroke();

    // Draw vectors from center
    const scale = 15;

    // V_A (red)
    drawDiagramVector(context, centerX, centerY, velocityA_x, velocityA_y, scale, '#FF6347', 'V_A');

    // V_B (blue)
    drawDiagramVector(context, centerX, centerY, velocityB_x, velocityB_y, scale, '#4169E1', 'V_B');

    // V_BA (green) - relative velocity
    drawDiagramVector(context, centerX, centerY, relativeVelocity.x, relativeVelocity.y, scale, '#00FF00', 'V_BA');

    // Formula
    context.fillStyle = '#FFFFFF';
    context.font = '12px Arial';
    context.fillText('V_BA = V_B - V_A', diagramX + 10, diagramY + diagramH - 10);
}

function drawDiagramVector(context, startX, startY, vx, vy, scale, color, label) {
    const endX = startX + vx * scale;
    const endY = startY - vy * scale;

    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();

    const angle = Math.atan2(-vy, vx);
    const headSize = 8;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(endX - headSize * Math.cos(angle - Math.PI/6), 
                   endY + headSize * Math.sin(angle - Math.PI/6));
    context.lineTo(endX - headSize * Math.cos(angle + Math.PI/6), 
                   endY + headSize * Math.sin(angle + Math.PI/6));
    context.closePath();
    context.fill();

    context.fillStyle = color;
    context.font = '11px Arial';
    context.fillText(label, endX + 8, endY - 5);
}

function drawLiveDataPanel(context) {
    const panelX = 50;
    const panelY = 50;
    const lineHeight = 22;

    

    context.strokeStyle = '#4D4D4F';
    context.lineWidth = 1;
    context.strokeRect(panelX - 10, panelY - 20, 260, 300);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Relative Motion', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    // Object A
    context.fillStyle = '#FF6347';
    context.font = 'bold 13px Arial';
    context.fillText('Object A (Red):', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '12px Arial';
    context.fillText(`V_A = (${velocityA_x.toFixed(1)}, ${velocityA_y.toFixed(1)}) m/s`, panelX, yOffset);
    yOffset += lineHeight;

    const magA = Math.sqrt(velocityA_x * velocityA_x + velocityA_y * velocityA_y);
    context.fillText(`|V_A| = ${magA.toFixed(2)} m/s`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Object B
    context.fillStyle = '#4169E1';
    context.font = 'bold 13px Arial';
    context.fillText('Object B (Blue):', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '12px Arial';
    context.fillText(`V_B = (${velocityB_x.toFixed(1)}, ${velocityB_y.toFixed(1)}) m/s`, panelX, yOffset);
    yOffset += lineHeight;

    const magB = Math.sqrt(velocityB_x * velocityB_x + velocityB_y * velocityB_y);
    context.fillText(`|V_B| = ${magB.toFixed(2)} m/s`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Relative velocity
    context.fillStyle = '#00FF00';
    context.font = 'bold 13px Arial';
    context.fillText('Relative Velocity:', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '12px Arial';
    context.fillText(`V_BA = V_B - V_A`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillText(`V_BA = (${relativeVelocity.x.toFixed(1)}, ${relativeVelocity.y.toFixed(1)}) m/s`, panelX, yOffset);
    yOffset += lineHeight;

    const magBA = Math.sqrt(relativeVelocity.x * relativeVelocity.x + relativeVelocity.y * relativeVelocity.y);
    context.fillText(`|V_BA| = ${magBA.toFixed(2)} m/s`, panelX, yOffset);
    yOffset += lineHeight + 10;

    context.fillStyle = '#FFA500';
    context.fillText(`Time: ${time.toFixed(2)} s`, panelX, yOffset);
    yOffset += lineHeight + 5;

    context.fillStyle = simulationComplete ? '#00FF00' : '#FFFFFF';
    context.font = 'bold 12px Arial';
    context.fillText(simulationComplete ? '🏁 Complete' : '▶️ Running', panelX, yOffset);
}

function resetScene() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    createRelativeMotionSimulation();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    createRelativeMotionSimulation();
}

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
        .object-section {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .info-box {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            margin-top: 15px;
            font-size: 11px;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">Relative Motion</div>

        <div class="object-section">
            <div class="section-title" style="color: #FF6347;">Object A</div>
            <div class="control-group">
                <label>V_A x: <span class="value-display" id="va-x-value">${velocityA_x}</span></label>
                <input type="range" id="va-x-slider" min="-5" max="5" step="0.5" value="${velocityA_x}" style="width: 100%;">
            </div>
            <div class="control-group">
                <label>V_A y: <span class="value-display" id="va-y-value">${velocityA_y}</span></label>
                <input type="range" id="va-y-slider" min="-5" max="5" step="0.5" value="${velocityA_y}" style="width: 100%;">
            </div>
        </div>

        <div class="object-section">
            <div class="section-title" style="color: #4169E1;">Object B</div>
            <div class="control-group">
                <label>V_B x: <span class="value-display" id="vb-x-value">${velocityB_x}</span></label>
                <input type="range" id="vb-x-slider" min="-5" max="5" step="0.5" value="${velocityB_x}" style="width: 100%;">
            </div>
            <div class="control-group">
                <label>V_B y: <span class="value-display" id="vb-y-value">${velocityB_y}</span></label>
                <input type="range" id="vb-y-slider" min="-5" max="5" step="0.5" value="${velocityB_y}" style="width: 100%;">
            </div>
        </div>

        <div class="info-box">
            <strong>Relative Velocity:</strong><br>
            V_BA = V_B - V_A<br>
            Green dashed arrow shows<br>
            velocity of B relative to A
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('va-x-slider').addEventListener('input', function(e) {
        velocityA_x = parseFloat(e.target.value);
        document.getElementById('va-x-value').textContent = velocityA_x.toFixed(1);
        calculateRelativeVelocity();
        resetparams();
    });

    document.getElementById('va-y-slider').addEventListener('input', function(e) {
        velocityA_y = parseFloat(e.target.value);
        document.getElementById('va-y-value').textContent = velocityA_y.toFixed(1);
        calculateRelativeVelocity();
        resetparams();
    });

    document.getElementById('vb-x-slider').addEventListener('input', function(e) {
        velocityB_x = parseFloat(e.target.value);
        document.getElementById('vb-x-value').textContent = velocityB_x.toFixed(1);
        calculateRelativeVelocity();
        resetparams();
    });

    document.getElementById('vb-y-slider').addEventListener('input', function(e) {
        velocityB_y = parseFloat(e.target.value);
        document.getElementById('vb-y-value').textContent = velocityB_y.toFixed(1);
        calculateRelativeVelocity();
        resetparams();
    });
}

function ResetGUI() {
    document.getElementById('va-x-slider').value = velocityA_x;
    document.getElementById('va-y-slider').value = velocityA_y;
    document.getElementById('vb-x-slider').value = velocityB_x;
    document.getElementById('vb-y-slider').value = velocityB_y;

    document.getElementById('va-x-value').textContent = velocityA_x.toFixed(1);
    document.getElementById('va-y-value').textContent = velocityA_y.toFixed(1);
    document.getElementById('vb-x-value').textContent = velocityB_x.toFixed(1);
    document.getElementById('vb-y-value').textContent = velocityB_y.toFixed(1);
}

addCustomControlStyles();
createCustomControlPanel();
createRelativeMotionSimulation();
return {engine,runner};
}