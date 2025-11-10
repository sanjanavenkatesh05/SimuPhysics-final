// wheatstone_bridge.js - Wheatstone Bridge Simulator
const defaultValues={
    voltage: 6,
    R1:100,
    R2:100,
    R3:150,
    R4:150
};
// Global variables
function startSimulation(parameters){

    //step 3: since gemini will return a string, convert it back to an object using JSON.parse() function
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

    let R1 = parameters?.R1 ?? defaultValues.R1;
    let R2 = parameters?.R2 ?? defaultValues.R2;
    let R3 = parameters?.R3 ?? defaultValues.R3;
    let R4 = parameters?.R4 ?? defaultValues.R4;
    let voltage = parameters?.voltage ?? defaultValues.voltage;
let galvanometerCurrent = 0;
let isBalanced = false;
let VB = 0, VD = 0; // Potentials at nodes B and D
let calculatedR4 = 0;

// Variables for electron flow animation
let electronParticles = [];
const numElectrons = 20;
let flowOffset = 0;

// Disable gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

function createWheatstoneBridge() {
    Matter.World.clear(engine.world, false);

    // Calculate node potentials using voltage divider
    VB = voltage * R2 / (R1 + R2);
    VD = voltage * R4 / (R3 + R4);

    // Galvanometer current (simplified)
    const Rg = 50; // Galvanometer internal resistance
    galvanometerCurrent = (VB - VD) / Rg;

    // Check if balanced
    isBalanced = Math.abs(galvanometerCurrent) < 0.001;

    // Calculate unknown resistance from balance condition: R4 = (R2 * R3) / R1
    calculatedR4 = (R2 * R3) / R1;

    // Create electron particles for animation
    electronParticles = [];
    // Create electrons for each branch of the bridge
    for (let i = 0; i < numElectrons; i++) {
        electronParticles.push({
            progress: i / numElectrons,
            speed: 0.002,
            branch: 'AB' // Branch identifier
        });
        electronParticles.push({
            progress: i / numElectrons,
            speed: 0.002,
            branch: 'AD'
        });
        electronParticles.push({
            progress: i / numElectrons,
            speed: 0.002,
            branch: 'BC'
        });
        electronParticles.push({
            progress: i / numElectrons,
            speed: 0.002,
            branch: 'DC'
        });
        // Galvanometer branch (BD)
        electronParticles.push({
            progress: i / numElectrons,
            speed: Math.abs(galvanometerCurrent) * 0.01, // Speed proportional to current
            branch: 'BD'
        });
    }

    // Create visual bridge components (diamond shape)
    const centerX = 400;
    const centerY = 300;
    const spacing = 120;

    // Node A (top)
    const nodeA = Bodies.circle(centerX, centerY - spacing, 8, {
        isStatic: true,
        render: { fillStyle: '#FFD700' }
    });

    // Node B (left)
    const nodeB = Bodies.circle(centerX - spacing, centerY, 8, {
        isStatic: true,
        render: { fillStyle: '#00FFFF' }
    });

    // Node C (bottom)
    const nodeC = Bodies.circle(centerX, centerY + spacing, 8, {
        isStatic: true,
        render: { fillStyle: '#FFFFFF' }
    });

    // Node D (right)
    const nodeD = Bodies.circle(centerX + spacing, centerY, 8, {
        isStatic: true,
        render: { fillStyle: '#00FFFF' }
    });

    // Resistor bodies (visual)
    const r1Body = Bodies.rectangle(centerX - spacing/2, centerY - spacing/2, 40, 15, {
        isStatic: true,
        angle: -Math.PI/4,
        render: { fillStyle: '#FF6347' }
    });

    const r2Body = Bodies.rectangle(centerX - spacing/2, centerY + spacing/2, 40, 15, {
        isStatic: true,
        angle: Math.PI/4,
        render: { fillStyle: '#FF6347' }
    });

    const r3Body = Bodies.rectangle(centerX + spacing/2, centerY - spacing/2, 40, 15, {
        isStatic: true,
        angle: Math.PI/4,
        render: { fillStyle: '#FF6347' }
    });

    const r4Body = Bodies.rectangle(centerX + spacing/2, centerY + spacing/2, 40, 15, {
        isStatic: true,
        angle: -Math.PI/4,
        render: { fillStyle: R4 === calculatedR4 ? '#00FF00' : '#FF6347' }
    });

    // Galvanometer (center)
    const galvBody = Bodies.circle(centerX, centerY, 15, {
        isStatic: true,
        render: { fillStyle: isBalanced ? '#00FF00' : '#FF6347' }
    });

    Composite.add(world, [nodeA, nodeB, nodeC, nodeD, r1Body, r2Body, r3Body, r4Body, galvBody]);
}

// Get position on circuit path for electron animation
function getCircuitPosition(progress, branch) {
    const centerX = 400;
    const centerY = 300;
    const spacing = 120;

    let x, y;

    switch (branch) {
        case 'AB': // From A to B
            x = centerX - progress * spacing;
            y = centerY - spacing + progress * spacing;
            break;
        case 'AD': // From A to D
            x = centerX + progress * spacing;
            y = centerY - spacing + progress * spacing;
            break;
        case 'BC': // From B to C
            x = centerX - spacing + progress * spacing;
            y = centerY + progress * spacing;
            break;
        case 'DC': // From D to C
            x = centerX + spacing - progress * spacing;
            y = centerY + progress * spacing;
            break;
        case 'BD': // From B to D (galvanometer)
            x = centerX - spacing + progress * spacing * 2;
            y = centerY;
            break;
        default:
            x = centerX;
            y = centerY;
    }

    return { x, y };
}

Events.on(engine, 'beforeUpdate', function() {
    // Animate electrons
    flowOffset += 0.005;

    for (let electron of electronParticles) {
        electron.progress += electron.speed;
        if (electron.progress > 1) electron.progress = 0;
    }
});

Events.on(render, 'afterRender', function() {
    const context = render.context;
    const centerX = 400;
    const centerY = 300;
    const spacing = 120;

    // Draw bridge connections
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 3;

    context.beginPath();
    // AB
    context.moveTo(centerX, centerY - spacing);
    context.lineTo(centerX - spacing, centerY);
    // BC
    context.lineTo(centerX, centerY + spacing);
    // AD
    context.moveTo(centerX, centerY - spacing);
    context.lineTo(centerX + spacing, centerY);
    // DC
    context.moveTo(centerX + spacing, centerY);
    context.lineTo(centerX, centerY + spacing);
    // BD (galvanometer)
    context.moveTo(centerX - spacing, centerY);
    context.lineTo(centerX + spacing, centerY);
    context.stroke();

    // Draw animated electrons (current flow)
    for (let electron of electronParticles) {
        const pos = getCircuitPosition(electron.progress, electron.branch);

        // Electron
        context.fillStyle = '#FFFF00';
        context.beginPath();
        context.arc(pos.x, pos.y, 4, 0, 2 * Math.PI);
        context.fill();

        // Electron glow
        const electronGlow = context.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 8);
        electronGlow.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        electronGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
        context.fillStyle = electronGlow;
        context.beginPath();
        context.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
        context.fill();
    }

    // Draw resistor labels with increased visibility
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial'; // Increased font size and weight
    context.fillText(`R1 = ${R1}Ω`, centerX - spacing/2 - 35, centerY - spacing/2 - 10);
    context.fillText(`R2 = ${R2}Ω`, centerX - spacing/2 - 35, centerY + spacing/2 + 20);
    context.fillText(`R3 = ${R3}Ω`, centerX + spacing/2 + 15, centerY - spacing/2 - 10);
    context.fillText(`R4 = ${R4}Ω`, centerX + spacing/2 + 15, centerY + spacing/2 + 20);

    // Node labels
    context.fillStyle = '#FFD700';
    context.font = 'bold 14px Arial'; // Increased font size
    context.fillText('A (+)', centerX + 10, centerY - spacing - 15);
    context.fillStyle = '#FFFFFF';
    context.fillText('C (−)', centerX + 10, centerY + spacing + 25);
    context.fillStyle = '#00FFFF';
    context.fillText('B', centerX - spacing - 30, centerY + 5);
    context.fillText('D', centerX + spacing + 20, centerY + 5);

    // Galvanometer indicator
    context.fillStyle = isBalanced ? '#00FF00' : '#FF6347';
    context.font = 'bold 14px Arial'; // Increased font size
    context.fillText('G', centerX - 8, centerY + 6);

    // Display panel
    const panelX = 50;
    const panelY = 50;
    const lineHeight = 22;

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Wheatstone Bridge', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    context.fillStyle = '#FFD700';
    context.fillText(`Battery Voltage: ${voltage.toFixed(2)} V`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FFFF';
    context.fillText(`VB = ${VB.toFixed(3)} V`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`VD = ${VD.toFixed(3)} V`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FFFFFF';
    context.fillText(`ΔV (VB-VD) = ${(VB - VD).toFixed(4)} V`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = isBalanced ? '#00FF00' : '#FF6347';
    context.font = 'bold 13px Arial';
    context.fillText(`Ig = ${(galvanometerCurrent * 1000).toFixed(3)} mA`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = isBalanced ? '#00FF00' : '#FF6347';
    context.font = 'bold 14px Arial';
    context.fillText(isBalanced ? '✓ BALANCED' : '✗ NOT BALANCED', panelX, yOffset);
    yOffset += lineHeight + 10;

    context.fillStyle = '#FFFFFF';
    context.font = '12px Arial';
    context.fillText('Balance Condition:', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`R1/R2 = R3/R4`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FF00';
    context.font = 'bold 12px Arial';
    context.fillText(`Calculated R4 = ${calculatedR4.toFixed(2)} Ω`, panelX, yOffset);
    yOffset += lineHeight;

    if (Math.abs(R4 - calculatedR4) < 1) {
        context.fillStyle = '#00FF00';
        context.fillText('✓ R4 matches calculated value!', panelX, yOffset);
    }

    // Formula at bottom
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 11px Arial';
    context.fillText('Formula: R4 = (R2 × R3) / R1', 300, 580);
});

function resetScene() {
    Runner.stop(runner);
    createWheatstoneBridge();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    createWheatstoneBridge();
}

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
        .control-group { margin-bottom: 15px; }
        .control-group label { display: block; margin-bottom: 5px; font-size: 12px; }
        .value-display { float: right; color: #10A37F; font-weight: bold; }
        .panel-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #10A37F; text-align: center; }
        .balance-btn {
            width: 100%;
            padding: 10px;
            background: #10A37F;
            border: none;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">⚖️ Wheatstone Bridge</div>

        <div class="control-group">
            <label>Voltage: <span class="value-display" id="voltage-value">6 V</span></label>
            <input type="range" id="voltage-slider" min="1" max="15" step="0.5" value="6">
        </div>

        <div class="control-group">
            <label>R1: <span class="value-display" id="r1-value">100 Ω</span></label>
            <input type="range" id="r1-slider" min="10" max="1000" step="10" value="100">
        </div>

        <div class="control-group">
            <label>R2: <span class="value-display" id="r2-value">100 Ω</span></label>
            <input type="range" id="r2-slider" min="10" max="1000" step="10" value="100">
        </div>

        <div class="control-group">
            <label>R3 (adjust to balance): <span class="value-display" id="r3-value">150 Ω</span></label>
            <input type="range" id="r3-slider" min="10" max="1000" step="1" value="150">
        </div>

        <div class="control-group">
            <label>R4 (unknown): <span class="value-display" id="r4-value">150 Ω</span></label>
            <input type="range" id="r4-slider" min="10" max="1000" step="10" value="150">
        </div>

        <button class="balance-btn" onclick="autoBalance()">Auto Balance</button>
    `;

    document.body.appendChild(panel);

    document.getElementById('voltage-slider').addEventListener('input', function(e) {
        voltage = parseFloat(e.target.value);
        document.getElementById('voltage-value').textContent = voltage.toFixed(1) + ' V';
        createWheatstoneBridge();
    });

    document.getElementById('r1-slider').addEventListener('input', function(e) {
        R1 = parseFloat(e.target.value);
        document.getElementById('r1-value').textContent = R1 + ' Ω';
        createWheatstoneBridge();
    });

    document.getElementById('r2-slider').addEventListener('input', function(e) {
        R2 = parseFloat(e.target.value);
        document.getElementById('r2-value').textContent = R2 + ' Ω';
        createWheatstoneBridge();
    });

    document.getElementById('r3-slider').addEventListener('input', function(e) {
        R3 = parseFloat(e.target.value);
        document.getElementById('r3-value').textContent = R3 + ' Ω';
        createWheatstoneBridge();
    });

    document.getElementById('r4-slider').addEventListener('input', function(e) {
        R4 = parseFloat(e.target.value);
        document.getElementById('r4-value').textContent = R4 + ' Ω';
        createWheatstoneBridge();
    });
}

function autoBalance() {
    // To balance the bridge: R1/R2 = R3/R4
    // Therefore: R3 = (R1 * R4) / R2
    R3 = (R1 * R4) / R2;
    document.getElementById('r3-slider').value = R3;
    document.getElementById('r3-value').textContent = R3.toFixed(0) + ' Ω';
    createWheatstoneBridge();
}

addCustomControlStyles();
createCustomControlPanel();
createWheatstoneBridge();
return {engine,runner};
}
