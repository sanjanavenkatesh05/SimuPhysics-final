// kinematics_1d_uniform_motion.js - 1D Uniform Linear Motion Simulator
// Global variables
const defaultValues={
    velocity:5,
    initialPosition:0,
    time:0
};


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
    let velocity=parameters?.velocity??defaultValues.velocity;
    let initialPosition=parameters?.initialPosition??defaultValues.initialPosition;
    let time=parameters?.time??defaultValues.time;
//let velocity = 5; // m/s
let position = 0; // meters
//let time = 0; // seconds
//let initialPosition = 0; // meters
let trailPoints = []; // For drawing position trail
let maxTrailPoints = 100;
let simulationComplete = false; // Flag to indicate if simulation is complete

// Disable gravity for 1D motion simulation
engine.world.gravity.y = 0;

// Create the 1D motion simulation
function create1DMotionSimulation() {
    Matter.World.clear(engine.world, false);
    trailPoints = [];
    position = initialPosition;
    time = 0;
    simulationComplete = false;
    
    // Create moving object (a ball)
    const ball = Bodies.circle(100, 500, 20, {
        render: { fillStyle: '#FF6347' },
        friction: 0,
        frictionAir: 0
    });
    
    Composite.add(world, [ball]);
    
    // Store reference to the ball for updating position
    window.movingBall = ball;
}

// Update motion based on uniform linear motion equation: x = x₀ + vt
Events.on(engine, 'beforeUpdate', function() {
    if (isPlaying && !simulationComplete) {
        // Update time
        time += 1/60; // Assuming 60 FPS
        
        // Update position using uniform motion equation
        position = initialPosition + velocity * time;
        
        // Check if ball has reached boundary (620px = 52m in our scale)
        const maxXPosition = 52; // Maximum position in meters (moved 80px left from 700px to 620px)
        if (position >= maxXPosition) {
            position = maxXPosition;
            simulationComplete = true;
            // Stop the simulation
            isPlaying = false;
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        }
        
        // Update ball position
        if (window.movingBall) {
            Body.setPosition(window.movingBall, { x: 100 + position * 10, y: 500 }); // Scale position for visualization
            
            // Add current position to trail (only if not at boundary)
            if (!simulationComplete) {
                trailPoints.push({
                    x: 100 + position * 10,
                    y: 500
                });
                
                // Limit trail points
                if (trailPoints.length > maxTrailPoints) {
                    trailPoints.shift();
                }
            }
        }
    }
});

// Draw everything including graphs
Events.on(render, 'afterRender', function() {
    const context = render.context;
    
    // Draw position trail
    if (trailPoints.length > 1) {
        context.beginPath();
        context.moveTo(trailPoints[0].x, trailPoints[0].y);
        for (let i = 1; i < trailPoints.length; i++) {
            context.lineTo(trailPoints[i].x, trailPoints[i].y);
        }
        context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        context.lineWidth = 2;
        context.stroke();
    }
    
    // Draw distance vs time graph
    drawDistanceVsTimeGraph(context);
    
    // Draw live data panel
    drawLiveDataPanel(context);
    
    // Draw boundary line (moved 80px left from 700px to 620px)
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(620, 450);
    context.lineTo(620, 550);
    context.stroke();
    
    // Draw boundary label
    context.fillStyle = '#FFFFFF';
    context.font = '12px Arial';
    context.fillText('Finish', 625, 500);
});

// Draw distance vs time graph
function drawDistanceVsTimeGraph(context) {
    const graphX = 500;
    const graphY = 50;
    const graphWidth = 250;
    const graphHeight = 200;
    
    // Draw graph background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(graphX, graphY, graphWidth, graphHeight);
    
    // Draw graph border
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.strokeRect(graphX, graphY, graphWidth, graphHeight);
    
    // Draw axis labels
    context.fillStyle = '#FFFFFF';
    context.font = '12px Arial';
    context.fillText('Time (s)', graphX + graphWidth/2 - 20, graphY + graphHeight + 20);
    context.save();
    context.translate(graphX - 30, graphY + graphHeight/2);
    context.rotate(-Math.PI/2);
    context.fillText('Position (m)', 0, 0);
    context.restore();
    
    // Draw axis lines
    context.beginPath();
    context.moveTo(graphX, graphY + graphHeight); // X-axis
    context.lineTo(graphX + graphWidth, graphY + graphHeight);
    context.moveTo(graphX, graphY); // Y-axis
    context.lineTo(graphX, graphY + graphHeight);
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 1;
    context.stroke();
    
    // Draw graph title
    context.fillStyle = '#10A37F';
    context.font = 'bold 14px Arial';
    context.fillText('Position vs Time', graphX + graphWidth/2 - 50, graphY - 10);
    
    // Draw grid lines
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 1;
    
    // Vertical grid lines (time)
    for (let i = 1; i <= 4; i++) {
        const x = graphX + (i * graphWidth / 5);
        context.beginPath();
        context.moveTo(x, graphY);
        context.lineTo(x, graphY + graphHeight);
        context.stroke();
    }
    
    // Horizontal grid lines (position)
    for (let i = 1; i <= 4; i++) {
        const y = graphY + (i * graphHeight / 5);
        context.beginPath();
        context.moveTo(graphX, y);
        context.lineTo(graphX + graphWidth, y);
        context.stroke();
    }
    
    // Draw the actual graph line (position vs time)
    if (time > 0) {
        context.beginPath();
        // Limit the graph to show last 10 seconds of data
        const maxTime = Math.max(10, time);
        const timeScale = graphWidth / maxTime;
        const positionScale = graphHeight / 52; // Scale for 52m max position (adjusted)
        
        // Plot points for the graph
        const startTime = Math.max(0, time - 10);
        const timePoints = 100;
        
        for (let i = 0; i <= timePoints; i++) {
            const t = startTime + (i / timePoints) * Math.min(10, time);
            const pos = initialPosition + velocity * t;
            // Limit position to max 52m
            const limitedPos = Math.min(pos, 52);
            const x = graphX + t * timeScale;
            const y = graphY + graphHeight - (limitedPos * positionScale);
            
            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
        
        context.strokeStyle = '#00FFFF'; // Changed from red to cyan
        context.lineWidth = 2;
        context.stroke();
    }
    
    // Draw current position marker
    if (time > 0) {
        const maxTime = Math.max(10, time);
        const timeScale = graphWidth / maxTime;
        const positionScale = graphHeight / 52;
        const limitedPos = Math.min(position, 52);
        const x = graphX + Math.min(time, 10) * timeScale;
        const y = graphY + graphHeight - (limitedPos * positionScale);
        
        context.fillStyle = '#FFD700';
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
    }
}

// Draw live data panel
function drawLiveDataPanel(context) {
    const panelX = 50;
    const panelY = 50;
    const lineHeight = 22;
    
    // Draw panel background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(panelX - 10, panelY - 20, 200, 250);
    
    // Draw panel border
    context.strokeStyle = '#4D4D4F';
    context.lineWidth = 1;
    context.strokeRect(panelX - 10, panelY - 20, 200, 250);
    
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('1D Uniform Motion', panelX, panelY);
    
    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;
    
    context.fillStyle = '#FFD700';
    context.fillText(`Velocity: ${velocity.toFixed(2)} m/s`, panelX, yOffset);
    yOffset += lineHeight;
    
    context.fillStyle = '#00FFFF';
    context.fillText(`Position: ${position.toFixed(2)} m`, panelX, yOffset);
    yOffset += lineHeight;
    
    context.fillStyle = '#FF6347';
    context.fillText(`Time: ${time.toFixed(2)} s`, panelX, yOffset);
    yOffset += lineHeight + 10;
    
    // Show simulation status
    context.fillStyle = simulationComplete ? '#00FF00' : '#FFFFFF';
    context.font = 'bold 12px Arial';
    context.fillText(simulationComplete ? '🏁 Simulation Complete' : '▶️ Simulation Running', panelX, yOffset);
    yOffset += lineHeight + 5;
    
    // Show equation
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 12px Arial';
    context.fillText(`x = x₀ + vt`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`x = ${initialPosition} + ${velocity}t`, panelX, yOffset);
}

// Reset simulation
function resetScene() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    create1DMotionSimulation();
}

// Reset parameters
function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    create1DMotionSimulation();
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

// Create custom control panel
function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">📏 1D Uniform Motion</div>

        <div class="control-group">
            <label>Velocity (m/s): <span class="value-display" id="velocity-value">5.00</span></label>
            <input type="range" id="velocity-slider" min="-20" max="20" step="0.1" value="5">
        </div>

        <div class="control-group">
            <label>Initial Position (m): <span class="value-display" id="position-value">0.00</span></label>
            <input type="range" id="position-slider" min="0" max="50" step="0.1" value="0">
        </div>

        <div class="info-box">
            <strong>Uniform Linear Motion:</strong><br>
            • Object moves with constant velocity<br>
            • Position changes linearly with time<br>
            • Equation: x = x₀ + vt<br>
            • Simulation stops when object reaches finish line!
        </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('velocity-slider').addEventListener('input', function(e) {
        velocity = parseFloat(e.target.value);
        document.getElementById('velocity-value').textContent = velocity.toFixed(2);
        // Reset simulation when velocity changes
        resetparams();
    });

    document.getElementById('position-slider').addEventListener('input', function(e) {
        initialPosition = parseFloat(e.target.value);
        document.getElementById('position-value').textContent = initialPosition.toFixed(2);
        // Reset simulation when initial position changes
        resetparams();
    });
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
create1DMotionSimulation();
return {engine,runner};
}