// electric_field_lines.js - Electric Field Lines Visualization

const defaultValues={
    charge1:5.0,
    charge2:5.0,
    initialDistance:400
}


// Global variables
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
let charge1 = parameters?.charge1??defaultValues.charge1;
let charge2 = parameters?.charge2??defaultValues.charge2;
let initialDistance = parameters?.defaultValues.initialDistance;
let k = 9.0; // Coulomb's constant

let body1, body2;
let mouseX = 400;
let mouseY = 300;
let fieldLines = [];
const numFieldLines = 16; // Number of field lines per charge
let animationOffset = 0; // For flowing animation

// Disable Matter.js gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

function createFieldLineSystem(q1, q2, distance) {
    charge1 = q1;
    charge2 = q2;
    initialDistance = distance;

    const centerX = 400;
    const centerY = 300;

    const radius1 = 25;
    const radius2 = 25;

    // Position charges
    body1 = Bodies.circle(centerX - distance / 2, centerY, radius1, {
        isStatic: true,
        render: { fillStyle: charge1 > 0 ? '#FF6347' : '#4169E1' }
    });

    body2 = Bodies.circle(centerX + distance / 2, centerY, radius2, {
        isStatic: true,
        render: { fillStyle: charge2 > 0 ? '#FF6347' : '#4169E1' }
    });

    Composite.add(world, [body1, body2]);

    // Generate field lines
    generateFieldLines();
}

// Generate field lines starting from positive charges
function generateFieldLines() {
    fieldLines = [];

    // For positive charge
    if (charge1 > 0) {
        for (let i = 0; i < numFieldLines; i++) {
            const angle = (i / numFieldLines) * 2 * Math.PI;
            const startX = body1.position.x + 30 * Math.cos(angle);
            const startY = body1.position.y + 30 * Math.sin(angle);
            const line = traceFieldLine(startX, startY, 1);
            fieldLines.push(line);
        }
    }

    if (charge2 > 0) {
        for (let i = 0; i < numFieldLines; i++) {
            const angle = (i / numFieldLines) * 2 * Math.PI;
            const startX = body2.position.x + 30 * Math.cos(angle);
            const startY = body2.position.y + 30 * Math.sin(angle);
            const line = traceFieldLine(startX, startY, 1);
            fieldLines.push(line);
        }
    }
}

// Trace a field line from starting point
function traceFieldLine(startX, startY, direction) {
    const points = [];
    let x = startX;
    let y = startY;
    const stepSize = 5;
    const maxSteps = 200;

    for (let step = 0; step < maxSteps; step++) {
        points.push({ x: x, y: y });

        // Calculate electric field at current position
        const field = calculateElectricField(x, y);
        const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);

        if (magnitude < 0.01) break; // Stop if field too weak

        // Normalize and move in field direction
        const dx = (field.x / magnitude) * stepSize * direction;
        const dy = (field.y / magnitude) * stepSize * direction;

        x += dx;
        y += dy;

        // Stop if out of bounds
        if (x < 0 || x > 800 || y < 0 || y > 600) break;

        // Stop if near negative charge
        const dist1 = Math.sqrt((x - body1.position.x) ** 2 + (y - body1.position.y) ** 2);
        const dist2 = Math.sqrt((x - body2.position.x) ** 2 + (y - body2.position.y) ** 2);

        if ((charge1 < 0 && dist1 < 25) || (charge2 < 0 && dist2 < 25)) break;
    }

    return points;
}

// Calculate electric field at a point
function calculateElectricField(x, y) {
    let Ex = 0;
    let Ey = 0;

    // Contribution from charge1
    const dx1 = x - body1.position.x;
    const dy1 = y - body1.position.y;
    const r1Squared = dx1 * dx1 + dy1 * dy1;
    const r1 = Math.sqrt(r1Squared);

    if (r1 > 1) {
        const E1 = (k * charge1) / r1Squared;
        Ex += E1 * (dx1 / r1);
        Ey += E1 * (dy1 / r1);
    }

    // Contribution from charge2
    const dx2 = x - body2.position.x;
    const dy2 = y - body2.position.y;
    const r2Squared = dx2 * dx2 + dy2 * dy2;
    const r2 = Math.sqrt(r2Squared);

    if (r2 > 1) {
        const E2 = (k * charge2) / r2Squared;
        Ex += E2 * (dx2 / r2);
        Ey += E2 * (dy2 / r2);
    }

    return { x: Ex, y: Ey };
}

// Calculate electric potential at a point
function calculateElectricPotential(x, y) {
    let V = 0;

    // Contribution from charge1
    const dx1 = x - body1.position.x;
    const dy1 = y - body1.position.y;
    const r1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

    if (r1 > 1) {
        V += (k * charge1) / r1;
    }

    // Contribution from charge2
    const dx2 = x - body2.position.x;
    const dy2 = y - body2.position.y;
    const r2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    if (r2 > 1) {
        V += (k * charge2) / r2;
    }

    return V;
}

// Track mouse position
render.canvas.addEventListener('mousemove', function(event) {
    const rect = render.canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
});

// Draw field lines and information
Events.on(render, 'afterRender', function() {
    if (!body1 || !body2) return;

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

    // Draw charges with symbols
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 28px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(charge1 > 0 ? '+' : '−', body1.position.x, body1.position.y);
    context.fillText(charge2 > 0 ? '+' : '−', body2.position.x, body2.position.y);

    // Draw mouse cursor crosshair
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

    // Calculate field and potential at mouse position
    const field = calculateElectricField(mouseX, mouseY);
    const fieldMagnitude = Math.sqrt(field.x * field.x + field.y * field.y);
    const potential = calculateElectricPotential(mouseX, mouseY);

    // Draw field vector at mouse position
    if (fieldMagnitude > 0.1) {
        const scale = Math.min(50, fieldMagnitude * 5);
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

    // Display live information panel
    const panelX = 100;
    const panelY = 20;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(panelX - 5, panelY - 15, 200, 260);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Electric Field & Potential', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    // Charge information
    context.fillStyle = charge1 > 0 ? '#FF6347' : '#4169E1';
    context.fillText('Charge 1: ' + charge1.toFixed(1) + ' C (' + (charge1 > 0 ? 'Positive' : 'Negative') + ')', panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = charge2 > 0 ? '#FF6347' : '#4169E1';
    context.fillText('Charge 2: ' + charge2.toFixed(1) + ' C (' + (charge2 > 0 ? 'Positive' : 'Negative') + ')', panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FFFFFF';
    context.fillText('Distance: ' + initialDistance.toFixed(0) + ' px', panelX, yOffset);
    yOffset += lineHeight + 5;

    // Field at mouse cursor
    context.fillStyle = '#FFD700';
    context.font = 'bold 14px Arial';
    context.fillText('At Cursor Position:', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '13px Arial';
    context.fillStyle = '#FFFFFF';
    context.fillText('Position: (' + mouseX.toFixed(0) + ', ' + mouseY.toFixed(0) + ')', panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FFFF';
    context.fillText('E-field magnitude: ' + fieldMagnitude.toFixed(3) + ' N/C', panelX, yOffset);
    yOffset += lineHeight;

    context.fillText('E_x: ' + field.x.toFixed(3) + ' N/C', panelX, yOffset);
    yOffset += lineHeight;

    context.fillText('E_y: ' + field.y.toFixed(3) + ' N/C', panelX, yOffset);
    yOffset += lineHeight + 5;

    // Electric potential at mouse cursor
    context.fillStyle = '#9370DB';
    context.font = 'bold 14px Arial';
    context.fillText('Electric Potential:', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '13px Arial';
    context.fillStyle = '#9370DB';
    context.fillText('V = ' + potential.toFixed(3) + ' V', panelX, yOffset);
    yOffset += lineHeight + 5;

    // Field line info
    context.fillStyle = '#AAAAAA';
    context.font = '12px Arial';
    context.fillText('Field lines drawn: ' + fieldLines.length, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText('Cyan arrows show field direction', panelX, yOffset);

    // Formula at bottom
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 12px Arial';
    context.fillText('Formula: E = k × q / r²  (Vector sum)', 10, 570);
    context.fillText('Formula: V = k × q / r  (Scalar sum)', 10, 585);
    context.fillText('Field lines go from + to − charges', 10, 600);
});

// Helper function to draw arrowhead
function drawArrowhead(context, x, y, angle, size, color) {
    // Set default color if not provided
    if (color === undefined) {
        color = '#00FFFF';
    }
    
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
    createFieldLineSystem(charge1, charge2, initialDistance);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createFieldLineSystem(charge1, charge2, initialDistance);
}

// ======= CUSTOM CONTROL PANEL =======
function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = '' +
        '#custom-control-panel {' +
            'position: fixed;' +
            'top: 80px;' +
            'right: 20px;' +
            'width: 320px;' +
            'background-color: #202123;' +
            'border: 1px solid #4D4D4F;' +
            'border-radius: 8px;' +
            'color: #ECECF1;' +
            'font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;' +
            'z-index: 1000;' +
            'padding: 15px;' +
            'max-height: calc(100vh - 100px);' +
            'overflow-y: auto;' +
        '}' +

        '.simulation-container {' +
            'margin-right: 340px !important;' +
        '}' +

        '.control-group {' +
            'margin-bottom: 15px;' +
        '}' +

        '.control-group label {' +
            'display: block;' +
            'margin-bottom: 5px;' +
            'font-size: 12px;' +
            'color: #ECECF1;' +
        '}' +

        '.control-group input[type="range"] {' +
            'width: 100%;' +
            'height: 6px;' +
            'border-radius: 3px;' +
            'background: #4D4D4F;' +
            'outline: none;' +
            '-webkit-appearance: none;' +
        '}' +

        '.control-group input[type="range"]::-webkit-slider-thumb {' +
            '-webkit-appearance: none;' +
            'appearance: none;' +
            'width: 16px;' +
            'height: 16px;' +
            'border-radius: 50%;' +
            'background: #10A37F;' +
            'cursor: pointer;' +
        '}' +

        '.control-group input[type="range"]::-moz-range-thumb {' +
            'width: 16px;' +
            'height: 16px;' +
            'border-radius: 50%;' +
            'background: #10A37F;' +
            'cursor: pointer;' +
            'border: none;' +
        '}' +

        '.value-display {' +
            'display: inline-block;' +
            'float: right;' +
            'color: #10A37F;' +
            'font-weight: bold;' +
        '}' +

        '.panel-title {' +
            'font-size: 16px;' +
            'font-weight: bold;' +
            'margin-bottom: 15px;' +
            'color: #10A37F;' +
            'text-align: center;' +
        '}' +

        '.info-box {' +
            'background: #2A2A2C;' +
            'padding: 10px;' +
            'border-radius: 5px;' +
            'margin-bottom: 15px;' +
            'font-size: 11px;' +
            'color: #ECECF1;' +
            'line-height: 1.5;' +
        '}' +

        '.info-text {' +
            'font-size: 11px;' +
            'color: #999;' +
            'margin-top: 5px;' +
            'font-style: italic;' +
        '}';
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = '' +
        '<div class="panel-title">Electric Field Lines</div>' +

        '<div class="info-box">' +
            '<strong>Field Line Rules:</strong><br>' +
            '• Lines start from + charges<br>' +
            '• Lines end at − charges<br>' +
            '• Lines never cross<br>' +
            '• Cyan lines show field direction<br>' +
            '• Move mouse to measure field' +
            '<br>• Press Play to see flowing animation' +
        '</div>' +

        '<div class="control-group">' +
            '<label>Charge 1: <span class="value-display" id="q1-value">' + charge1.toFixed(1) + '</span></label>' +
            '<input type="range" id="q1-slider" min="-10" max="10" step="0.5" value="' + charge1 + '">' +
            '<div class="info-text">Red (+) or Blue (−)</div>' +
        '</div>' +

        '<div class="control-group">' +
            '<label>Charge 2: <span class="value-display" id="q2-value">' + charge2.toFixed(1) + '</span></label>' +
            '<input type="range" id="q2-slider" min="-10" max="10" step="0.5" value="' + charge2 + '">' +
            '<div class="info-text">Red (+) or Blue (−)</div>' +
        '</div>' +

        '<div class="control-group">' +
            '<label>Distance: <span class="value-display" id="distance-value">' + initialDistance + '</span></label>' +
            '<input type="range" id="distance-slider" min="200" max="600" step="20" value="' + initialDistance + '">' +
            '<div class="info-text">Separation between charges</div>' +
        '</div>' +

        '<div class="control-group">' +
            '<label>Coulomb Constant (k): <span class="value-display" id="k-value">' + k.toFixed(1) + '</span></label>' +
            '<input type="range" id="k-slider" min="1" max="20" step="0.5" value="' + k + '">' +
            '<div class="info-text">Field strength multiplier</div>' +
        '</div>';

    document.body.appendChild(panel);
    attachControlListeners();
}

function attachControlListeners() {
    document.getElementById('q1-slider').addEventListener('input', function() {
        charge1 = parseFloat(this.value);
        document.getElementById('q1-value').textContent = charge1.toFixed(1);
        resetparams();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });

    document.getElementById('q2-slider').addEventListener('input', function() {
        charge2 = parseFloat(this.value);
        document.getElementById('q2-value').textContent = charge2.toFixed(1);
        resetparams();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });

    document.getElementById('distance-slider').addEventListener('input', function() {
        initialDistance = parseFloat(this.value);
        document.getElementById('distance-value').textContent = initialDistance;
        resetparams();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });

    document.getElementById('k-slider').addEventListener('input', function() {
        k = parseFloat(this.value);
        document.getElementById('k-value').textContent = k.toFixed(1);
        resetparams();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    });
}

function ResetGUI() {
    document.getElementById('q1-slider').value = charge1;
    document.getElementById('q2-slider').value = charge2;
    document.getElementById('distance-slider').value = initialDistance;
    document.getElementById('k-slider').value = k;

    document.getElementById('q1-value').textContent = charge1.toFixed(1);
    document.getElementById('q2-value').textContent = charge2.toFixed(1);
    document.getElementById('distance-value').textContent = initialDistance;
    document.getElementById('k-value').textContent = k.toFixed(1);
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createFieldLineSystem(charge1, charge2, initialDistance);
return {engine,runner};
}