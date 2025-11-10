// uniform_circular_motion_vectors.js - Uniform Circular Motion with Velocity and Acceleration Vectors
const defaultValues={
    circleRadius:100,
    angularVelocity:0.05,
    objectSize:15

};
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

    let circleRadius = parameters?.circleRadius ?? defaultValues.circleRadius;
    let angularVelocity = parameters?.angularVelocity ?? defaultValues.angularVelocity;
    let objectSize = parameters?.objectSize ?? defaultValues.objectSize;
// Global variables

let currentAngle = 0;
let movingBody;
let centerX = 400;
let centerY = 300;

// Physics constants
let velocityMagnitude = 0; // v = ω * r
let accelerationMagnitude = 0; // a = ω² * r

// Trail particles for motion path
let trailParticles = [];
const MAX_TRAIL_PARTICLES = 100;
const TRAIL_LIFETIME = 60;

// Particle class for trail
class TrailParticle {
    constructor(x, y, life) {
        this.x = x;
        this.y = y;
        this.life = life;
        this.maxLife = life;
    }
    
    update() {
        this.life--;
        return this.life > 0;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(245, 90, 60, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create the uniform circular motion simulation
function uniformCircularMotionVectors(radius, omega, size) {
    circleRadius = radius;
    angularVelocity = omega;
    objectSize = size;
    currentAngle = 0;
    
    // Calculate physics values
    velocityMagnitude = angularVelocity * circleRadius;
    accelerationMagnitude = angularVelocity * angularVelocity * circleRadius;
    
    // Calculate initial position
    let initialX = centerX + circleRadius * Math.cos(currentAngle);
    let initialY = centerY + circleRadius * Math.sin(currentAngle);
    
    // Create moving object
    movingBody = Bodies.circle(initialX, initialY, objectSize, {
        isStatic: true, // Static to prevent gravity effects
        render: { fillStyle: '#f55a3c' },
        frictionAir: 0,
        friction: 0
    });
    
    Composite.add(world, [movingBody]);
    
    // Setup motion
    if (window.motionHandler) {
        Events.off(engine, 'beforeUpdate', window.motionHandler);
    }
    
    window.motionHandler = function() {
        currentAngle += angularVelocity;
        let newX = centerX + circleRadius * Math.cos(currentAngle);
        let newY = centerY + circleRadius * Math.sin(currentAngle);
        Body.setPosition(movingBody, { x: newX, y: newY });
        
        // Add trail particle at current position
        trailParticles.push(new TrailParticle(newX, newY, TRAIL_LIFETIME));
        
        // Limit trail particles
        if (trailParticles.length > MAX_TRAIL_PARTICLES) {
            trailParticles.shift();
        }
    };
    
    Events.on(engine, 'beforeUpdate', window.motionHandler);
}

// Draw trail particles
function drawTrail() {
    const ctx = render.context;
    
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const particle = trailParticles[i];
        if (!particle.update()) {
            trailParticles.splice(i, 1);
        } else {
            particle.draw(ctx);
        }
    }
}

// Draw velocity and acceleration vectors
function drawMotionVectors() {
    if (!movingBody) return;
    
    const ctx = render.context;
    
    // Get current position
    const posX = movingBody.position.x;
    const posY = movingBody.position.y;
    
    // Calculate velocity vector (tangent to circle)
    // Velocity vector is perpendicular to radius vector
    const velX = -velocityMagnitude * Math.sin(currentAngle);
    const velY = velocityMagnitude * Math.cos(currentAngle);
    
    // Calculate acceleration vector (toward center)
    // Acceleration vector is opposite to radius vector
    const accX = -accelerationMagnitude * Math.cos(currentAngle);
    const accY = -accelerationMagnitude * Math.sin(currentAngle);
    
    // Draw velocity vector (green) - solid line
    ctx.setLineDash([]); // Solid line
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    drawVector(ctx, posX, posY, velX, velY, '#00FF00', 'Velocity (v)');
    
    // Draw acceleration vector (blue) - dashed line
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.strokeStyle = '#4169E1';
    ctx.lineWidth = 3;
    drawVector(ctx, posX, posY, accX, accY, '#4169E1', 'Acceleration (a)');
    ctx.setLineDash([]); // Reset to solid line
    
    // Draw center point with label
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw center label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('Center', centerX - 25, centerY - 10);
    
    // Draw radius line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(posX, posY);
    ctx.stroke();
    
    // Draw circle path
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();
}

// Helper function to draw a vector with arrowhead
function drawVector(ctx, startX, startY, vecX, vecY, color, label) {
    const scale = 2.0; // Further increased scale factor for longer vectors
    const endX = startX + vecX * scale;
    const endY = startY + vecY * scale;
    
    // Draw vector line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const headSize = 12;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - headSize * Math.cos(angle - Math.PI / 6),
        endY - headSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - headSize * Math.cos(angle + Math.PI / 6),
        endY - headSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    // Draw label with custom positioning to avoid overlap
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Arial';
    
    // Custom positioning based on vector type
    let labelX, labelY;
    if (label === 'Velocity (v)') {
        // Position velocity label to the right of the vector
        labelX = endX + 30;
        labelY = endY - 20;
    } else if (label === 'Acceleration (a)') {
        // Position acceleration label to the left of the vector
        labelX = endX - 60;
        labelY = endY - 20;
    } else {
        // Default positioning
        labelX = endX + 25;
        labelY = endY - 25;
    }
    
    ctx.fillText(label, labelX, labelY);
}

// Draw legend
function drawLegend(ctx) {
    const legendX = 600;
    const legendY = 400;
    
    // Draw legend background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(legendX - 10, legendY - 20, 160, 80);
    
    // Draw legend border
    ctx.strokeStyle = '#4D4D4F';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 10, legendY - 20, 160, 80);
    
    // Draw legend title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Vector Legend', legendX, legendY);
    
    // Draw velocity legend item
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 20);
    ctx.lineTo(legendX + 30, legendY + 20);
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText('Velocity', legendX + 35, legendY + 25);
    
    // Draw acceleration legend item
    ctx.strokeStyle = '#4169E1';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 45);
    ctx.lineTo(legendX + 30, legendY + 45);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillText('Acceleration', legendX + 35, legendY + 50);
}

// Draw live data panel
function drawLiveDataPanel(context) {
    const panelX = 50;
    const panelY = 400; // Moved lower to avoid overlap with vectors
    const lineHeight = 22;
    
    // Draw panel background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(panelX - 10, panelY - 20, 250, 300);
    
    // Draw panel border
    context.strokeStyle = '#4D4D4F';
    context.lineWidth = 1;
    context.strokeRect(panelX - 10, panelY - 20, 250, 300);
    
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Uniform Circular Motion', panelX, panelY);
    
    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;
    
    context.fillStyle = '#FFD700';
    context.fillText(`Radius: ${circleRadius.toFixed(2)} px`, panelX, yOffset);
    yOffset += lineHeight;
    
    context.fillStyle = '#00FFFF';
    context.fillText(`Angular Velocity (ω): ${angularVelocity.toFixed(4)} rad/s`, panelX, yOffset);
    yOffset += lineHeight;
    
    context.fillStyle = '#FF6347';
    context.fillText(`Tangential Speed: ${velocityMagnitude.toFixed(2)} px/s`, panelX, yOffset);
    yOffset += lineHeight;
    
    context.fillStyle = '#4169E1';
    context.fillText(`Centripetal Accel: ${accelerationMagnitude.toFixed(2)} px/s²`, panelX, yOffset);
    yOffset += lineHeight;
    
    context.fillStyle = '#9370DB';
    context.fillText(`Period: ${(2 * Math.PI / angularVelocity).toFixed(2)} s`, panelX, yOffset);
    yOffset += lineHeight;
    
    context.fillStyle = '#32CD32';
    context.fillText(`Frequency: ${(angularVelocity / (2 * Math.PI)).toFixed(4)} Hz`, panelX, yOffset);
    yOffset += lineHeight + 10;
    
    // Show equations
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 12px Arial';
    context.fillText(`v = ωr = ${velocityMagnitude.toFixed(2)} px/s`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`a = ω²r = ${accelerationMagnitude.toFixed(2)} px/s²`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`T = 2π/ω = ${(2 * Math.PI / angularVelocity).toFixed(2)} s`, panelX, yOffset);
}

// Reset simulation
function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    if (window.motionHandler) {
        Events.off(engine, 'beforeUpdate', window.motionHandler);
    }
    trailParticles = [];
    uniformCircularMotionVectors(circleRadius, angularVelocity, objectSize);
    ResetGUI();
}

// Reset parameters
function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    if (window.motionHandler) {
        Events.off(engine, 'beforeUpdate', window.motionHandler);
    }
    trailParticles = [];
    uniformCircularMotionVectors(circleRadius, angularVelocity, objectSize);
}

// Add custom control styles
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
            min-width: 40px;
            text-align: center;
            background-color: #343541;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            color: #10A37F;
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

// Create control panel
function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <div class="control-group">
            <label>Circle Radius</label>
            <div class="slider-container">
                <input type="range" id="radius-slider" min="50" max="200" step="5" value="${circleRadius}">
                <span class="slider-value" id="radius-value">${circleRadius}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Angular Velocity (ω)</label>
            <div class="slider-container">
                <input type="range" id="speed-slider" min="0.01" max="0.15" step="0.01" value="${angularVelocity}">
                <span class="slider-value" id="speed-value">${angularVelocity}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Object Size</label>
            <div class="slider-container">
                <input type="range" id="size-slider" min="5" max="25" step="1" value="${objectSize}">
                <span class="slider-value" id="size-value">${objectSize}</span>
            </div>
        </div>
        
        <div class="info-box">
            <strong>Uniform Circular Motion:</strong><br>
            • Velocity vector is tangent to the circle<br>
            • Acceleration vector points toward center<br>
            • v = ωr (tangential speed)<br>
            • a = ω²r (centripetal acceleration)<br>
            • T = 2π/ω (period)
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners
    document.getElementById('radius-slider').addEventListener('input', function() {
        circleRadius = parseFloat(this.value);
        document.getElementById('radius-value').textContent = circleRadius;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('speed-slider').addEventListener('input', function() {
        angularVelocity = parseFloat(this.value);
        document.getElementById('speed-value').textContent = angularVelocity;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('size-slider').addEventListener('input', function() {
        objectSize = parseFloat(this.value);
        document.getElementById('size-value').textContent = objectSize;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
}

// Reset GUI values
function ResetGUI() {
    document.getElementById('radius-slider').value = circleRadius;
    document.getElementById('speed-slider').value = angularVelocity;
    document.getElementById('size-slider').value = objectSize;
    document.getElementById('radius-value').textContent = circleRadius;
    document.getElementById('speed-value').textContent = angularVelocity;
    document.getElementById('size-value').textContent = objectSize;
}

// Hook into render loop for drawing
Events.on(render, 'afterRender', function() {
    drawTrail();
    drawMotionVectors();
    drawLegend(render.context);
    drawLiveDataPanel(render.context);
});

// Initialize
addCustomControlStyles();
createCustomControlPanel();
uniformCircularMotionVectors(100, 0.05, 15);
return {engine,runner};
}
