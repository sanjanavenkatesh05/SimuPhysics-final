// kinematics_1d_graphical_analysis.js - Graphical Analysis of Motion
const defautValues={
    initialVelocity:5,
    acceleration:2
};

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
let initialVelocity = parameters?.initialVelocity??defautValues.initialVelocity;
let acceleration = parameters?.acceleration??defautValues.acceleration;
let position = 0;
let velocity = 0;
let time = 0;
let initialPosition = 0;
let trailPoints = [];
let maxTrailPoints = 100;
let simulationComplete = false;

engine.world.gravity.y = 0;

function create1DMotionSimulation() {
    Matter.World.clear(engine.world, false);
    trailPoints = [];
    position = initialPosition;
    velocity = initialVelocity;
    time = 0;
    simulationComplete = false;

    const ball = Bodies.circle(100, 500, 20, {
        render: { fillStyle: '#4169E1' },
        friction: 0,
        frictionAir: 0
    });

    Composite.add(world, [ball]);
    window.movingBall = ball;
}

Events.on(engine, 'beforeUpdate', function() {
    if (isPlaying && !simulationComplete) {
        time += 1/60;

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
        context.strokeStyle = 'rgba(65, 105, 225, 0.5)';
        context.lineWidth = 2;
        context.stroke();
    }

    drawThreeGraphs(context);
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

function drawThreeGraphs(context) {
    const startX = 450;
    const startY = 30;
    const graphWidth = 300;
    const graphHeight = 120;
    const spacing = 15;

    // s-t graph (parabolic)
    drawSingleGraph(context, startX, startY, graphWidth, graphHeight, 
        's-t Graph', 'Position (m)', '#4169E1', (t) => {
            return initialPosition + initialVelocity * t + 0.5 * acceleration * t * t;
        }, 52);

    // v-t graph (linear)
    drawSingleGraph(context, startX, startY + graphHeight + spacing, graphWidth, graphHeight,
        'v-t Graph', 'Velocity (m/s)', '#32CD32', (t) => {
            return initialVelocity + acceleration * t;
        }, 20);

    // a-t graph (constant)
    drawSingleGraph(context, startX, startY + 2 * (graphHeight + spacing), graphWidth, graphHeight,
        'a-t Graph', 'Acceleration (m/s²)', '#FFD700', (t) => {
            return acceleration;
        }, 10);
}

function drawSingleGraph(context, gx, gy, gw, gh, title, yLabel, color, valueFunc, maxY) {
    // Background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(gx, gy, gw, gh);

    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 1.5;
    context.strokeRect(gx, gy, gw, gh);

    // Title
    context.fillStyle = '#10A37F';
    context.font = 'bold 12px Arial';
    context.fillText(title, gx + gw/2 - 30, gy - 5);

    // Axes
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(gx + 30, gy + 10);
    context.lineTo(gx + 30, gy + gh - 20);
    context.lineTo(gx + gw - 10, gy + gh - 20);
    context.stroke();

    // Labels
    context.fillStyle = '#FFFFFF';
    context.font = '10px Arial';
    context.fillText('Time (s)', gx + gw/2 - 15, gy + gh - 5);

    context.save();
    context.translate(gx + 10, gy + gh/2);
    context.rotate(-Math.PI/2);
    context.fillText(yLabel, 0, 0);
    context.restore();

    // Grid
    context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 1; i <= 3; i++) {
        const x = gx + 30 + (i * (gw - 40) / 4);
        context.beginPath();
        context.moveTo(x, gy + 10);
        context.lineTo(x, gy + gh - 20);
        context.stroke();
    }
    for (let i = 1; i <= 3; i++) {
        const y = gy + 10 + (i * (gh - 30) / 4);
        context.beginPath();
        context.moveTo(gx + 30, y);
        context.lineTo(gx + gw - 10, y);
        context.stroke();
    }

    // Plot graph
    if (time > 0) {
        context.beginPath();
        const maxTime = Math.max(10, time);
        const timeScale = (gw - 40) / maxTime;
        const valueScale = (gh - 30) / maxY;

        const points = 100;
        for (let i = 0; i <= points; i++) {
            const t = (i / points) * Math.min(10, time);
            const val = valueFunc(t);
            const limitedVal = Math.max(0, Math.min(val, maxY));

            const x = gx + 30 + t * timeScale;
            const y = gy + gh - 20 - (limitedVal * valueScale);

            if (i === 0) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.stroke();
    }

    // Current marker
    if (time > 0) {
        const maxTime = Math.max(10, time);
        const timeScale = (gw - 40) / maxTime;
        const valueScale = (gh - 30) / maxY;
        const val = valueFunc(time);
        const limitedVal = Math.max(0, Math.min(val, maxY));

        const x = gx + 30 + Math.min(time, 10) * timeScale;
        const y = gy + gh - 20 - (limitedVal * valueScale);

        context.fillStyle = '#FF6347';
        context.beginPath();
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();
    }
}

function drawLiveDataPanel(context) {
    const panelX = 50;
    const panelY = 50;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(panelX - 10, panelY - 20, 240, 260);

    context.strokeStyle = '#4D4D4F';
    context.lineWidth = 1;
    context.strokeRect(panelX - 10, panelY - 20, 240, 260);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Graphical Analysis', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    context.fillStyle = '#4169E1';
    context.fillText(`Position (s): ${position.toFixed(2)} m`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#32CD32';
    context.fillText(`Velocity (v): ${velocity.toFixed(2)} m/s`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FFD700';
    context.fillText(`Acceleration (a): ${acceleration.toFixed(2)} m/s²`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FFA500';
    context.fillText(`Time (t): ${time.toFixed(2)} s`, panelX, yOffset);
    yOffset += lineHeight + 10;

    // Graph interpretation
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 12px Arial';
    context.fillText('Graph Shapes:', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '11px Arial';
    context.fillStyle = '#4169E1';
    context.fillText('s-t: Parabola (a≠0)', panelX, yOffset);
    yOffset += lineHeight - 3;

    context.fillStyle = '#32CD32';
    context.fillText('v-t: Straight Line', panelX, yOffset);
    yOffset += lineHeight - 3;

    context.fillStyle = '#FFD700';
    context.fillText('a-t: Horizontal Line', panelX, yOffset);
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
        <div class="panel-title">Graphical Analysis</div>
        <div class="control-group">
            <label>Initial Velocity: <span class="value-display" id="velocity-value">${initialVelocity}</span></label>
            <input type="range" id="velocity-slider" min="0" max="15" step="0.5" value="${initialVelocity}" 
                style="width: 100%;">
        </div>
        <div class="control-group">
            <label>Acceleration: <span class="value-display" id="acceleration-value">${acceleration}</span></label>
            <input type="range" id="acceleration-slider" min="-5" max="10" step="0.5" value="${acceleration}" 
                style="width: 100%;">
        </div>
        <div class="info-box">
            <strong>Graph Analysis:</strong><br>
            • s-t: Parabolic (a≠0)<br>
            • v-t: Linear slope = a<br>
            • a-t: Constant horizontal<br>
            • Area under v-t = displacement<br>
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