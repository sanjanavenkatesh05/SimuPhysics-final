// electric_dipole.js - Electric Field and Potential due to Dipole
const defaultValues={
    chargeMagnitude: 5.0,
    dipoleDistance: 200
};


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

    let chargeMagnitude = parameters?.chargeMagnitude ?? defaultValues.chargeMagnitude;
    let dipoleDistance = parameters?.dipoleDistance ?? defaultValues.dipoleDistance;
const k = 8.988e9; // Original Coulomb's constant (N⋅m²/C²)

let positiveCharge, negativeCharge;
let mouseX = 400;
let mouseY = 300;
let fieldLines = [];
const numFieldLines = 12;
let animationOffset = 0; // For flowing animation

// Disable Matter.js gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

function createDipoleSystem(q, distance) {
    chargeMagnitude = q;
    dipoleDistance = distance;
    // k is now a constant, so we don't need to pass it as a parameter

    const centerX = 400;
    const centerY = 300;
    const chargeRadius = 25;

    // Create positive charge
    positiveCharge = Bodies.circle(centerX - distance / 2, centerY, chargeRadius, {
        isStatic: true,
        render: { fillStyle: '#FF6347' }
    });

    // Create negative charge
    negativeCharge = Bodies.circle(centerX + distance / 2, centerY, chargeRadius, {
        isStatic: true,
        render: { fillStyle: '#4169E1' }
    });

    Composite.add(world, [positiveCharge, negativeCharge]);

    // Generate field lines
    generateDipoleFieldLines();
}

// Generate field lines for dipole
function generateDipoleFieldLines() {
    fieldLines = [];

    // Field lines emanate from positive charge
    for (let i = 0; i < numFieldLines; i++) {
        const angle = (i / numFieldLines) * 2 * Math.PI;
        const startX = positiveCharge.position.x + 30 * Math.cos(angle);
        const startY = positiveCharge.position.y + 30 * Math.sin(angle);
        const line = traceFieldLine(startX, startY);
        fieldLines.push(line);
    }
}

// Trace a field line
function traceFieldLine(startX, startY) {
    const points = [];
    let x = startX;
    let y = startY;
    const stepSize = 5;
    const maxSteps = 200;

    for (let step = 0; step < maxSteps; step++) {
        points.push({ x, y });

        const field = calculateElectricField(x, y);
        const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);

        if (magnitude < 0.01) break;

        const dx = (field.x / magnitude) * stepSize;
        const dy = (field.y / magnitude) * stepSize;

        x += dx;
        y += dy;

        // Stop if out of bounds
        if (x < 0 || x > 800 || y < 0 || y > 600) break;

        // Stop if near negative charge
        const distToNeg = Math.sqrt(
            (x - negativeCharge.position.x) ** 2 + 
            (y - negativeCharge.position.y) ** 2
        );
        if (distToNeg < 25) break;
    }

    return points;
}

// Calculate electric field at a point (vector sum)
function calculateElectricField(x, y) {
    let Ex = 0;
    let Ey = 0;

    // Contribution from positive charge
    const dxPos = x - positiveCharge.position.x;
    const dyPos = y - positiveCharge.position.y;
    const rPosSquared = dxPos * dxPos + dyPos * dyPos;
    const rPos = Math.sqrt(rPosSquared);

    if (rPos > 1) {
        const EPos = (k * chargeMagnitude) / rPosSquared;
        Ex += EPos * (dxPos / rPos);
        Ey += EPos * (dyPos / rPos);
    }

    // Contribution from negative charge
    const dxNeg = x - negativeCharge.position.x;
    const dyNeg = y - negativeCharge.position.y;
    const rNegSquared = dxNeg * dxNeg + dyNeg * dyNeg;
    const rNeg = Math.sqrt(rNegSquared);

    if (rNeg > 1) {
        const ENeg = (k * chargeMagnitude) / rNegSquared;
        Ex -= ENeg * (dxNeg / rNeg); // Negative charge
        Ey -= ENeg * (dyNeg / rNeg);
    }

    return { x: Ex, y: Ey };
}

// Calculate electric potential at a point (scalar sum)
function calculateElectricPotential(x, y) {
    // V = k*q/r for positive - k*q/r for negative

    const dxPos = x - positiveCharge.position.x;
    const dyPos = y - positiveCharge.position.y;
    const rPos = Math.sqrt(dxPos * dxPos + dyPos * dyPos);

    const dxNeg = x - negativeCharge.position.x;
    const dyNeg = y - negativeCharge.position.y;
    const rNeg = Math.sqrt(dxNeg * dxNeg + dyNeg * dyNeg);

    let V = 0;
    if (rPos > 1) V += (k * chargeMagnitude) / rPos;
    if (rNeg > 1) V -= (k * chargeMagnitude) / rNeg;

    return V;
}

// Track mouse position
render.canvas.addEventListener('mousemove', (event) => {
    const rect = render.canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

// Draw field lines and information
Events.on(render, 'afterRender', function() {
    if (!positiveCharge || !negativeCharge) return;

    const context = render.context;

    // Update animation offset when simulation is playing
    if (typeof isPlaying !== 'undefined' && isPlaying) {
        animationOffset = (animationOffset + 0.5) % 20;
    }

    // Draw field lines with flowing animation
    context.strokeStyle = '#00FFFF';
    context.lineWidth = 2;
    context.globalAlpha = 0.6;

    for (let i = 0; i < fieldLines.length; i++) {
        const line = fieldLines[i];
        if (line.length < 2) continue;

        context.beginPath();
        
        // Draw line with dashed pattern that moves when playing
        if (typeof isPlaying !== 'undefined' && isPlaying) {
            // Create flowing effect by changing line dash offset
            context.setLineDash([5, 5]);
            context.lineDashOffset = -animationOffset;
        } else {
            context.setLineDash([]);
        }

        context.moveTo(line[0].x, line[0].y);

        for (let j = 1; j < line.length; j++) {
            context.lineTo(line[j].x, line[j].y);
        }

        context.stroke();
        context.setLineDash([]);

        // Draw animated arrowheads at intervals
        for (let k = 20; k < line.length; k += 40) {
            if (k < line.length - 1) {
                const p1 = line[k];
                const p2 = line[k + 1];
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                
                // Animate arrowheads when playing
                let arrowSize = 8;
                if (typeof isPlaying !== 'undefined' && isPlaying) {
                    // Pulsing effect for arrowheads
                    arrowSize = 8 + 2 * Math.sin(animationOffset / 5 + k/10);
                }
                
                drawArrowhead(context, p1.x, p1.y, angle, arrowSize);
            }
        }
    }

    context.globalAlpha = 1.0;

    // Draw dipole axis line
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.globalAlpha = 0.3;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.moveTo(positiveCharge.position.x, positiveCharge.position.y);
    context.lineTo(negativeCharge.position.x, negativeCharge.position.y);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1.0;

    // Draw charge symbols
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 28px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('+', positiveCharge.position.x, positiveCharge.position.y);
    context.fillText('−', negativeCharge.position.x, negativeCharge.position.y);

    // Draw mouse cursor
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 1;
    context.globalAlpha = 0.5;
    context.beginPath();
    context.moveTo(mouseX - 10, mouseY);
    context.lineTo(mouseX + 10, mouseY);
    context.moveTo(mouseX, mouseY - 10);
    context.lineTo(mouseX, mouseY + 10);
    context.stroke();
    context.globalAlpha = 1.0;

    // Calculate field and potential at mouse
    const field = calculateElectricField(mouseX, mouseY);
    const fieldMag = Math.sqrt(field.x * field.x + field.y * field.y);
    const potential = calculateElectricPotential(mouseX, mouseY);

    // Draw field vector at mouse
    if (fieldMag > 0.1) {
        const scale = Math.min(50, fieldMag * 3);
        const angle = Math.atan2(field.y, field.x);

        context.strokeStyle = '#FFD700';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(mouseX, mouseY);
        context.lineTo(mouseX + scale * Math.cos(angle), mouseY + scale * Math.sin(angle));
        context.stroke();

        drawArrowhead(context, mouseX + scale * Math.cos(angle), 
                     mouseY + scale * Math.sin(angle), angle, 10, '#FFD700');
    }

    // Calculate dipole moment
    const dipoleMoment = chargeMagnitude * (dipoleDistance / 100); // p = q*d

    // Display live information panel
    const panelX = 10;
    const panelY = 20;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.85)';


    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.textAlign = 'left';
    context.fillText('Electric Dipole - Field & Potential', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    // Dipole information
    context.fillStyle = '#FFD700';
    context.fillText(`Charge Magnitude: ±${chargeMagnitude.toFixed(1)} C`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillText(`Dipole Separation: ${dipoleDistance.toFixed(0)} px`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillText(`Dipole Moment (p): ${dipoleMoment.toFixed(2)} C·m`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Field at cursor
    context.fillStyle = '#00FFFF';
    context.font = 'bold 13px Arial';
    context.fillText('Electric Field at Cursor:', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '13px Arial';
    context.fillStyle = '#FFFFFF';
    context.fillText(`Position: (${mouseX.toFixed(0)}, ${mouseY.toFixed(0)})`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FFFF';
    context.fillText(`E magnitude: ${fieldMag.toFixed(4)} N/C`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillText(`E_x: ${field.x.toFixed(4)} N/C`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillText(`E_y: ${field.y.toFixed(4)} N/C`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Potential at cursor
    context.fillStyle = '#FF69B4';
    context.font = 'bold 13px Arial';
    context.fillText(`Electric Potential (V): ${potential.toFixed(4)} V`, panelX, yOffset);
    yOffset += lineHeight;

    // Info
    context.fillStyle = '#AAAAAA';
    context.font = '12px Arial';
    context.fillText('Gold arrow = Field direction at cursor', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText('Cyan lines = Field lines (+ to −)', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText('Press Play to see flowing animation', panelX, yOffset);

    // Formulas at bottom with original Coulomb's constant
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 11px Arial';
    context.fillText('Electric Field: E = E₊ + E₋ (vector sum)', 10, 570);
    context.fillText('Electric Potential: V = V₊ + V₋ (scalar sum)', 10, 585);
    context.fillText('Dipole: p = q × d  |  On axis: E ∝ 1/r³', 10, 600);
    
    // Display original Coulomb's constant on the bottom left
    context.fillStyle = '#FFD700'; // Gold color for visibility
    context.font = 'bold 12px Arial';
    context.textAlign = 'left';
    context.fillText('k = 8.988 × 10⁹ N⋅m²/C²', 10, 555);
});

function drawArrowhead(context, x, y, angle, size, color = '#00FFFF') {
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
    createDipoleSystem(chargeMagnitude, dipoleDistance, k);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createDipoleSystem(chargeMagnitude, dipoleDistance, k);
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
        <div class="panel-title">Electric Dipole</div>

        <div class="info-box">
            <strong>Dipole Properties:</strong><br>
            • Two equal & opposite charges<br>
            • Dipole moment: p = q × d<br>
            • Field lines: + to −<br>
            • Field (on axis): E ∝ 1/r³<br>
            • Move mouse to measure E & V<br>
            • Press Play to see flowing animation
        </div>

        <div class="control-group">
            <label>Charge Magnitude: <span class="value-display" id="q-value">${chargeMagnitude.toFixed(1)}</span></label>
            <input type="range" id="q-slider" min="1" max="10" step="0.5" value="${chargeMagnitude}">
            <div class="info-text">Equal magnitude, opposite sign</div>
        </div>

        <div class="control-group">
            <label>Dipole Separation: <span class="value-display" id="distance-value">${dipoleDistance}</span></label>
            <input type="range" id="distance-slider" min="100" max="400" step="20" value="${dipoleDistance}">
            <div class="info-text">Distance between charges</div>
        </div>
    `;

    document.body.appendChild(panel);
    attachControlListeners();
}

function attachControlListeners() {
    document.getElementById('q-slider').addEventListener('input', function() {
        chargeMagnitude = parseFloat(this.value);
        document.getElementById('q-value').textContent = chargeMagnitude.toFixed(1);
        resetparams();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });

    document.getElementById('distance-slider').addEventListener('input', function() {
        dipoleDistance = parseFloat(this.value);
        document.getElementById('distance-value').textContent = dipoleDistance;
        resetparams();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });
}

function ResetGUI() {
    document.getElementById('q-slider').value = chargeMagnitude;
    document.getElementById('distance-slider').value = dipoleDistance;

    document.getElementById('q-value').textContent = chargeMagnitude.toFixed(1);
    document.getElementById('distance-value').textContent = dipoleDistance;
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createDipoleSystem(chargeMagnitude, dipoleDistance);
return {engine,runner};
}
