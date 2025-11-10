
///////absloutely common to all

// Global variables
let charge1 = 5.0;
let charge2 = 5.0;
let initialDistance = 300;
let k = 9.0; // Coulomb's constant (scaled for simulation)

const defaultValues={charge1:5.0,charge2:5.0,initialDistance:300,k:9.0};

function startSimulation(parameters){
    let charge1=parameters?.charge1??defaultValues.charge1;
    let charge2=parameters?.charge2??defaultValues.charge2;
    let initialDistance=parameters?.initialDistance??defaultValues.initialDistance;
    


    // coulombs_law.js - Coulomb's Law - Two Charges with Electrostatic Force
const {
  Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint,
  Constraint, Composite, Events,Body
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


let body1, body2;
let currentForce = 0;
let currentDistance = 0;
let initialForce = 0;

// Disable Matter.js gravity (we'll calculate our own)
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

// Create two charged bodies
function createCoulombSystem(q1, q2, distance) {
    charge1 = q1;
    charge2 = q2;
    initialDistance = distance;

    const centerX = 400;
    const centerY = 300;

    // Calculate radii based on charge magnitude (visual representation)
    const radius1 = Math.abs(charge1) * 3 + 15;
    const radius2 = Math.abs(charge2) * 3 + 15;

    // Position charges with distance between them
    body1 = Bodies.circle(centerX - distance / 2, centerY, radius1, {
        frictionAir: 0,
        friction: 0,
        restitution: 0,
        render: { fillStyle: charge1 > 0 ? '#FF6347' : '#4169E1' } // Red for positive, Blue for negative
    });

    body2 = Bodies.circle(centerX + distance / 2, centerY, radius2, {
        frictionAir: 0,
        friction: 0,
        restitution: 0,
        render: { fillStyle: charge2 > 0 ? '#FF6347' : '#4169E1' }
    });

    // Set mass (use charge magnitude for physics)
    Body.setMass(body1, Math.abs(charge1));
    Body.setMass(body2, Math.abs(charge2));

    // Start with ZERO velocity (completely stationary)
    Body.setVelocity(body1, { x: 0, y: 0 });
    Body.setVelocity(body2, { x: 0, y: 0 });

    Composite.add(world, [body1, body2]);

    // Calculate initial force: F = k * |q1 * q2| / r^2
    initialForce = (k * Math.abs(charge1 * charge2)) / (initialDistance * initialDistance);
}

// Apply electrostatic forces between charges
Events.on(engine, 'beforeUpdate', function() {
    if (body1 && body2 && body1.position && body2.position) {
        // Calculate distance between charges
        const dx = body2.position.x - body1.position.x;
        const dy = body2.position.y - body1.position.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared);

        currentDistance = distance;

        // Prevent collision/extreme forces
        if (distance > (body1.circleRadius + body2.circleRadius + 5)) {
            // Calculate electrostatic force magnitude: F = k * |q1 * q2| / r^2
            const forceMagnitude = (k * Math.abs(charge1 * charge2)) / distanceSquared;
            currentForce = forceMagnitude;

            // Determine if force is attractive or repulsive
            const isRepulsive = (charge1 * charge2) > 0;
            const forceDirection = isRepulsive ? -1 : 1; // -1 for repulsion, +1 for attraction

            // Calculate force components
            const forceX = (forceMagnitude * dx) / distance;
            const forceY = (forceMagnitude * dy) / distance;

            // Apply forces
            if (isRepulsive) {
                // Repulsion: forces push away from each other
                Body.applyForce(body1, body1.position, { x: -forceX / Math.abs(charge1), y: -forceY / Math.abs(charge1) });
                Body.applyForce(body2, body2.position, { x: forceX / Math.abs(charge2), y: forceY / Math.abs(charge2) });
            } else {
                // Attraction: forces pull toward each other
                Body.applyForce(body1, body1.position, { x: forceX / Math.abs(charge1), y: forceY / Math.abs(charge1) });
                Body.applyForce(body2, body2.position, { x: -forceX / Math.abs(charge2), y: -forceY / Math.abs(charge2) });
            }
        } else {
            currentForce = 0;
        }
    }
});

// Draw connection line, force vectors, electric field lines, and live information
Events.on(render, 'afterRender', function() {
    if (!body1 || !body2) return;

    const context = render.context;

    // Calculate current values
    const dx = body2.position.x - body1.position.x;
    const dy = body2.position.y - body1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity1 = Math.sqrt(body1.velocity.x ** 2 + body1.velocity.y ** 2);
    const velocity2 = Math.sqrt(body2.velocity.x ** 2 + body2.velocity.y ** 2);

    // Draw electric field lines
    drawElectricFieldLines(context, body1, body2, charge1, charge2);

    // Draw connection line between charges
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

    // Draw charge symbols on bodies
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(charge1 > 0 ? '+' : '−', body1.position.x, body1.position.y);
    context.fillText(charge2 > 0 ? '+' : '−', body2.position.x, body2.position.y);

    // Determine force type
    const isRepulsive = (charge1 * charge2) > 0;

    // Draw force vectors (arrows) from each charge
    const forceScale = 50;
    const arrowLength = currentForce * forceScale;

    if (arrowLength > 2) {
        const angle = Math.atan2(dy, dx);

        if (isRepulsive) {
            // Repulsion: arrows point away from each other
            drawArrow(context, body1.position.x, body1.position.y, angle + Math.PI, arrowLength, '#FF6347', 3);
            drawArrow(context, body2.position.x, body2.position.y, angle, arrowLength, '#FF6347', 3);
        } else {
            // Attraction: arrows point toward each other
            drawArrow(context, body1.position.x, body1.position.y, angle, arrowLength, '#00FF00', 3);
            drawArrow(context, body2.position.x, body2.position.y, angle + Math.PI, arrowLength, '#00FF00', 3);
        }
    }

    // Display live information panel
    const panelX = 120;
    const panelY = 20;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Coulomb\'s Law - Live Data', panelX, panelY);

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
    context.fillText(`Current Force: ${currentForce.toFixed(4)} N`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#AAAAAA';
    context.font = '13px Arial';
    context.fillText(`Initial Force: ${initialForce.toFixed(4)} N`, panelX, yOffset);
    yOffset += lineHeight;

    // Force change percentage
    const forceIncrease = ((currentForce / initialForce) - 1) * 100;
    context.fillStyle = forceIncrease > 0 ? '#00FF00' : '#FFFFFF';
    context.fillText(`Force Change: ${forceIncrease > 0 ? '+' : ''}${forceIncrease.toFixed(1)}%`, panelX, yOffset);
    yOffset += lineHeight;

    // Force type
    context.fillStyle = isRepulsive ? '#FF6347' : '#00FF00';
    context.font = 'bold 13px Arial';
    context.fillText(`Force Type: ${isRepulsive ? 'REPULSIVE' : 'ATTRACTIVE'}`, panelX, yOffset);
    yOffset += lineHeight + 5;

    // Charge velocities
    context.font = '13px Arial';
    context.fillStyle = charge1 > 0 ? '#FF6347' : '#4169E1';
    context.fillText(`Charge 1 Speed: ${velocity1.toFixed(3)}`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = charge2 > 0 ? '#FF6347' : '#4169E1';
    context.fillText(`Charge 2 Speed: ${velocity2.toFixed(3)}`, panelX, yOffset);

    // Display original Coulomb's constant and formula on the bottom left
    context.fillStyle = '#FFD700'; // Gold color for visibility
    context.font = 'bold 14px Arial';
    context.textAlign = 'left';
    context.fillText('k = 8.988 × 10⁹ N⋅m²/C²', 20, 570);
    context.font = '12px Arial';
    context.fillText('F = k × |q₁ × q₂| / r²', 20, 590);
    context.fillText('(Same charges repel, opposite charges attract)', 20, 610);
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

// Helper function to draw electric field lines
function drawElectricFieldLines(context, charge1Body, charge2Body, q1, q2) {
    const centerX1 = charge1Body.position.x;
    const centerY1 = charge1Body.position.y;
    const centerX2 = charge2Body.position.x;
    const centerY2 = charge2Body.position.y;
    
    // Number of field lines based on charge magnitude
    const numLines1 = Math.max(8, Math.min(20, Math.abs(q1) * 2));
    const numLines2 = Math.max(8, Math.min(20, Math.abs(q2) * 2));
    
    context.strokeStyle = q1 > 0 ? 'rgba(255, 99, 71, 0.6)' : 'rgba(65, 105, 225, 0.6)';
    context.lineWidth = 1.5;
    
    // Draw field lines for charge 1
    for (let i = 0; i < numLines1; i++) {
        const angle = (i / numLines1) * Math.PI * 2;
        drawFieldLine(context, centerX1, centerY1, angle, q1, centerX2, centerY2, q2);
    }
    
    context.strokeStyle = q2 > 0 ? 'rgba(255, 99, 71, 0.6)' : 'rgba(65, 105, 225, 0.6)';
    
    // Draw field lines for charge 2
    for (let i = 0; i < numLines2; i++) {
        const angle = (i / numLines2) * Math.PI * 2;
        drawFieldLine(context, centerX2, centerY2, angle, q2, centerX1, centerY1, q1);
    }
}

// Helper function to draw a single field line
function drawFieldLine(context, startX, startY, angle, charge, otherX, otherY, otherCharge) {
    const isAttractive = (charge * otherCharge) < 0;
    const stepSize = 5;
    const maxSteps = 100;
    
    let x = startX + Math.cos(angle) * 20; // Start outside the charge
    let y = startY + Math.sin(angle) * 20;
    
    context.beginPath();
    context.moveTo(x, y);
    
    for (let i = 0; i < maxSteps; i++) {
        // Calculate force from both charges
        const dx1 = x - startX;
        const dy1 = y - startY;
        const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        
        const dx2 = x - otherX;
        const dy2 = y - otherY;
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        
        if (distance1 < 5 || distance2 < 5) break; // Too close to a charge
        
        // Calculate field components
        const field1 = charge / (distance1 * distance1);
        const field2 = otherCharge / (distance2 * distance2);
        
        const fieldX1 = (field1 * dx1) / distance1;
        const fieldY1 = (field1 * dy1) / distance1;
        
        const fieldX2 = (field2 * dx2) / distance2;
        const fieldY2 = (field2 * dy2) / distance2;
        
        // Total field
        const totalFieldX = fieldX1 + fieldX2;
        const totalFieldY = fieldY1 + fieldY2;
        
        const totalFieldMagnitude = Math.sqrt(totalFieldX * totalFieldX + totalFieldY * totalFieldY);
        
        // Normalize and scale
        const normalizedX = (totalFieldX / totalFieldMagnitude) * stepSize;
        const normalizedY = (totalFieldY / totalFieldMagnitude) * stepSize;
        
        x += normalizedX;
        y += normalizedY;
        
        context.lineTo(x, y);
        
        // Stop if too far or too close to other charge
        if (x < 0 || x > 800 || y < 0 || y > 600) break;
    }
    
    context.stroke();
}

function resetScene() {
    Runner.stop(runner);
    isPlaying=false;
    Matter.World.clear(engine.world, false);
    createCoulombSystem(charge1, charge2, initialDistance);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createCoulombSystem(charge1, charge2, initialDistance);
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
        <div class="panel-title">Coulomb's Law</div>

        <div class="info-box">
            <strong>Electrostatic Force</strong><br>
            • Positive charges: Red (+)<br>
            • Negative charges: Blue (−)<br>
            • Same charges: Repel (red arrows)<br>
            • Opposite charges: Attract (green arrows)
        </div>

        <div class="control-group">
            <label>Charge q₁: <span class="value-display" id="q1-value">${charge1.toFixed(1)}</span></label>
            <input type="range" id="q1-slider" min="-10" max="10" step="0.5" value="${charge1}">
            <div class="info-text">Positive (+) or Negative (−)</div>
        </div>

        <div class="control-group">
            <label>Charge q₂: <span class="value-display" id="q2-value">${charge2.toFixed(1)}</span></label>
            <input type="range" id="q2-slider" min="-10" max="10" step="0.5" value="${charge2}">
            <div class="info-text">Positive (+) or Negative (−)</div>
        </div>

        <div class="control-group">
            <label>Initial Distance: <span class="value-display" id="distance-value">${initialDistance}</span></label>
            <input type="range" id="distance-slider" min="150" max="500" step="10" value="${initialDistance}">
            <div class="info-text">Distance between charges (px)</div>
        </div>
    `;

    document.body.appendChild(panel);
    attachControlListeners();
}

function attachControlListeners() {
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

    document.getElementById('distance-slider').addEventListener('input', function() {
        initialDistance = parseFloat(this.value);
        document.getElementById('distance-value').textContent = initialDistance;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });
}

function ResetGUI() {
    document.getElementById('q1-slider').value = charge1;
    document.getElementById('q2-slider').value = charge2;
    document.getElementById('distance-slider').value = initialDistance;

    document.getElementById('q1-value').textContent = charge1.toFixed(1);
    document.getElementById('q2-value').textContent = charge2.toFixed(1);
    document.getElementById('distance-value').textContent = initialDistance;
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createCoulombSystem(charge1, charge2, initialDistance);
return {engine,runner};}