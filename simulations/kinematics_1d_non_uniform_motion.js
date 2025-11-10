// kinematics_1d_non_uniform_motion.js - 1D Non-Uniform Motion Simulator
const defaultValues={
    initialVelocity:0,
    acceleration:2
};
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
let initialVelocity = parameters?.initialVelocity??defaultValues.initialVelocity;
let acceleration = parameters?.acceleration??defaultValues.acceleration;
let position = 0; // meters
let velocity = 0; // m/s
let time = 0; // seconds
let initialPosition = 0; // meters
let trailPoints = [];
let maxTrailPoints = 100;
let simulationComplete = false;

// Disable gravity
engine.world.gravity.y = 0;

function create1DMotionSimulation() {
    Matter.World.clear(engine.world, false);
    trailPoints = [];
    position = initialPosition;
    velocity = initialVelocity;
    time = 0;
    simulationComplete = false;

    const ball = Bodies.circle(100, 500, 20, {
        render: { fillStyle: '#FF6347' },
        friction: 0,
        frictionAir: 0
    });

    Composite.add(world, [ball]);
    window.movingBall = ball;
}

// Update using non-uniform motion: x = x₀ + u*t + (1/2)*a*t²
Events.on(engine, 'beforeUpdate', function() {
    if (isPlaying && !simulationComplete) {
        time += 1/60;

        // Non-uniform motion equations
        velocity = initialVelocity + acceleration * time;
        position = initialPosition + initialVelocity * time + 0.5 * acceleration * time * time;

        const maxXPosition = 52;
        if (position >= maxXPosition) {
            position = maxXPosition;
            simulationComplete = true;
            isPlaying = false;
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        }

        if (window.movingBall) {
            Body.setPosition(window.movingBall, { x: 100 + position * 10, y: 500 });

            if (!simulationComplete) {
                trailPoints.push({ x: 100 + position * 10, y: 500 });
                if (trailPoints.length > maxTrailPoints) {
                    trailPoints.shift();
                }
            }
        }
    }
});

Events.on(render, 'afterRender', function() {
    const context = render.context;

    // Draw trail
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

    drawVelocityVsTimeGraph(context);
    drawLiveDataPanel(context);

    // Boundary
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(620, 450);
    context.lineTo(620, 550);
    context.stroke();

    context.fillStyle = '#FFFFFF';
    context.font = '12px Arial';
    context.fillText('Finish', 625, 500);
});

function drawVelocityVsTimeGraph(context) {
    const graphX = 500;
    const graphY = 50;
    const graphWidth = 250;
    const graphHeight = 200;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(graphX, graphY, graphWidth, graphHeight);

    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.strokeRect(graphX, graphY, graphWidth, graphHeight);

    context.fillStyle = '#FFFFFF';
    context.font = '12px Arial';
    context.fillText('Time (s)', graphX + graphWidth/2 - 20, graphY + graphHeight + 20);

    context.save();
    context.translate(graphX - 30, graphY + graphHeight/2);
    context.rotate(-Math.PI/2);
    context.fillText('Velocity (m/s)', 0, 0);
    context.restore();

    context.beginPath();
    context.moveTo(graphX, graphY + graphHeight);
    context.lineTo(graphX + graphWidth, graphY + graphHeight);
    context.moveTo(graphX, graphY);
    context.lineTo(graphX, graphY + graphHeight);
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = '#10A37F';
    context.font = 'bold 14px Arial';
    context.fillText('Velocity vs Time', graphX + graphWidth/2 - 50, graphY - 10);

    // Grid
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    context.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        const x = graphX + (i * graphWidth / 5);
        context.beginPath();
        context.moveTo(x, graphY);
        context.lineTo(x, graphY + graphHeight);
        context.stroke();
    }
    for (let i = 1; i <= 4; i++) {
        const y = graphY + (i * graphHeight / 5);
        context.beginPath();
        context.moveTo(graphX, y);
        context.lineTo(graphX + graphWidth, y);
        context.stroke();
    }

    // Plot v-t graph (linear: v = u + at)
    if (time > 0) {
        context.beginPath();
        const maxTime = Math.max(10, time);
        const timeScale = graphWidth / maxTime;
        const velocityScale = graphHeight / 20; // Max 20 m/s

        const timePoints = 100;
        for (let i = 0; i <= timePoints; i++) {
            const t = (i / timePoints) * Math.min(10, time);
            const v = initialVelocity + acceleration * t;
            const limitedV = Math.min(v, 20);

            const x = graphX + t * timeScale;
            const y = graphY + graphHeight - (limitedV * velocityScale);

            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
        context.strokeStyle = '#00FFFF';
        context.lineWidth = 2;
        context.stroke();
    }

    // Current marker
    if (time > 0) {
        const maxTime = Math.max(10, time);
        const timeScale = graphWidth / maxTime;
        const velocityScale = graphHeight / 20;
        const limitedV = Math.min(velocity, 20);

        const x = graphX + Math.min(time, 10) * timeScale;
        const y = graphY + graphHeight - (limitedV * velocityScale);

        context.fillStyle = '#FFD700';
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fill();
    }
}

function drawLiveDataPanel(context) {
    const panelX = 50;
    const panelY = 50;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(panelX - 10, panelY - 20, 220, 270);

    context.strokeStyle = '#4D4D4F';
    context.lineWidth = 1;
    context.strokeRect(panelX - 10, panelY - 20, 220, 270);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Non-Uniform Motion', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    context.fillStyle = '#FFD700';
    context.fillText(`Initial Velocity: ${initialVelocity.toFixed(2)} m/s`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FF6347';
    context.fillText(`Acceleration: ${acceleration.toFixed(2)} m/s²`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FFFF';
    context.fillText(`Velocity: ${velocity.toFixed(2)} m/s`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#32CD32';
    context.fillText(`Position: ${position.toFixed(2)} m`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FFA500';
    context.fillText(`Time: ${time.toFixed(2)} s`, panelX, yOffset);
    yOffset += lineHeight + 10;

    context.fillStyle = simulationComplete ? '#00FF00' : '#FFFFFF';
    context.font = 'bold 12px Arial';
    context.fillText(simulationComplete ? '🏁 Simulation Complete' : '▶️ Simulation Running', panelX, yOffset);
    yOffset += lineHeight + 5;

    context.fillStyle = '#FFFFFF';
    context.font = 'italic 11px Arial';
    context.fillText(`v = u + at`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`x = x₀ + ut + ½at²`, panelX, yOffset);
}

function resetScene() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    create1DMotionSimulation();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    create1DMotionSimulation();
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

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">Non-Uniform Motion</div>
        <div class="control-group">
            <label>Initial Velocity (m/s): <span class="value-display" id="velocity-value">${initialVelocity}</span></label>
            <input type="range" id="velocity-slider" min="0" max="10" step="0.5" value="${initialVelocity}" 
                style="width: 100%;">
        </div>
        <div class="control-group">
            <label>Acceleration (m/s²): <span class="value-display" id="acceleration-value">${acceleration}</span></label>
            <input type="range" id="acceleration-slider" min="-5" max="10" step="0.5" value="${acceleration}" 
                style="width: 100%;">
        </div>
        <div class="info-box">
            <strong>Non-Uniform Motion:</strong><br>
            • Velocity changes with time<br>
            • v = u + at (linear)<br>
            • s = ut + ½at² (parabolic)<br>
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('velocity-slider').addEventListener('input', function(e) {
        initialVelocity = parseFloat(e.target.value);
        document.getElementById('velocity-value').textContent = initialVelocity.toFixed(1);
        resetparams();
    });

    document.getElementById('acceleration-slider').addEventListener('input', function(e) {
        acceleration = parseFloat(e.target.value);
        document.getElementById('acceleration-value').textContent = acceleration.toFixed(1);
        resetparams();
    });
}

function ResetGUI() {
    document.getElementById('velocity-slider').value = initialVelocity;
    document.getElementById('acceleration-slider').value = acceleration;
    document.getElementById('velocity-value').textContent = initialVelocity.toFixed(1);
    document.getElementById('acceleration-value').textContent = acceleration.toFixed(1);
}

addCustomControlStyles();
createCustomControlPanel();
create1DMotionSimulation();
return {engine,runner};
}