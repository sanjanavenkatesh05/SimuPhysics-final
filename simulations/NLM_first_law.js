// laws_of_motion_first_law.js - Newton's First Law (Inertia)
const defaultValues={
    appliedForce: 0,
    initialVelocity: 0
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
let appliedForce = parameters?.appliedForce ?? defaultValues.appliedForce;
    let initialVelocity = parameters?.initialVelocity ?? defaultValues.initialVelocity;
let box;

let time = 0;
let velocityData = [];
let maxDataPoints = 100;
let simulationComplete = false;

engine.world.gravity.y = 0;

function createFirstLawSimulation() {
    Matter.World.clear(engine.world, false);
    velocityData = [];
    time = 0;
    simulationComplete = false;

    box = Bodies.rectangle(150, 350, 60, 60, {
        mass: 5,
        frictionAir: 0,
        friction: 0,
        inertia: Infinity, // Prevent rotation as per user preference
        render: { fillStyle: '#FF6347' }
    });

    Body.setVelocity(box, { x: initialVelocity, y: 0 });
    Composite.add(world, [box]);
}

Events.on(engine, 'beforeUpdate', function() {
    if (isPlaying && box && !simulationComplete) {
        time += 1/60;

        if (appliedForce !== 0) {
            Body.applyForce(box, box.position, { x: appliedForce / 1000, y: 0 });
        }

        velocityData.push({ t: time, v: box.velocity.x });
        if (velocityData.length > maxDataPoints) velocityData.shift();

        // Pause simulation after 4 seconds
        if (time >= 4) {
            simulationComplete = true;
            isPlaying = false;
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        }

        // Keep box within bounds by wrapping around
        if (box.position.x > 750) {
            Body.setPosition(box, { x: 50, y: box.position.y });
        } else if (box.position.x < 50) {
            Body.setPosition(box, { x: 750, y: box.position.y });
        }
    }
});

Events.on(render, 'afterRender', function() {
    const context = render.context;

    // Only draw when simulation is initialized
    if (box) {
        drawLiveDataPanel(context);
        drawForceArrow(context);
    }
});

function drawForceArrow(context) {
    if (!box) return;

    if (Math.abs(appliedForce) > 0.1) {
        const startX = box.position.x;
        const startY = box.position.y;
        const scale = 3;
        const endX = startX + appliedForce * scale;

        context.strokeStyle = '#FFD700';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, startY);
        context.stroke();

        const angle = appliedForce > 0 ? 0 : Math.PI;
        const headSize = 12;
        context.fillStyle = '#FFD700';
        context.beginPath();
        context.moveTo(endX, startY);
        context.lineTo(endX - headSize * Math.cos(angle - Math.PI/6), 
                       startY - headSize * Math.sin(angle - Math.PI/6));
        context.lineTo(endX - headSize * Math.cos(angle + Math.PI/6), 
                       startY - headSize * Math.sin(angle + Math.PI/6));
        context.closePath();
        context.fill();

        context.fillStyle = '#FFD700';
        context.font = 'bold 14px Arial';
        context.fillText('F', endX + (appliedForce > 0 ? 10 : -20), startY - 10);
    }
}

// Velocity graph removed as per user request

function drawLiveDataPanel(context) {
    const panelX = 100;
    const panelY = 50;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(panelX - 50, panelY - 20, 210, 240);

    context.strokeStyle = '#4D4D4F';
    context.lineWidth = 1;
    context.strokeRect(panelX - 50, panelY - 20, 210, 240);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText("Newton's First Law", panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    context.fillStyle = '#FFD700';
    context.fillText(`Applied Force: ${appliedForce.toFixed(1)} N`, panelX, yOffset);
    yOffset += lineHeight;

    if (box) {
        context.fillStyle = '#00FFFF';
        context.fillText(`Velocity: ${box.velocity.x.toFixed(2)} m/s`, panelX, yOffset);
        yOffset += lineHeight;

        context.fillStyle = '#32CD32';
        context.fillText(`Position: ${box.position.x.toFixed(1)} px`, panelX, yOffset);
        yOffset += lineHeight;
    }

    context.fillStyle = '#FFA500';
    context.fillText(`Time: ${time.toFixed(2)} s`, panelX, yOffset);
    yOffset += lineHeight + 10;

    context.fillStyle = '#FFFFFF';
    context.font = 'italic 12px Arial';
    context.fillText('Law of Inertia:', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '11px Arial';
    context.fillText('• Object at rest stays at rest', panelX, yOffset);
    yOffset += lineHeight - 3;
    context.fillText('• Object in motion continues', panelX, yOffset);
    yOffset += lineHeight - 3;
    context.fillText('  with constant velocity', panelX, yOffset);
    yOffset += lineHeight - 3;
    context.fillText('• Unless acted upon by force', panelX, yOffset);
}

window.resetScene = function() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    createFirstLawSimulation();
    ResetGUI();
}

window.resetparams = function() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    createFirstLawSimulation();
    ResetGUI();
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
        .simulation-container { margin-right: 320px !important; }
        .control-group { margin-bottom: 15px; }
        .control-group label { display: block; margin-bottom: 5px; font-size: 12px; }
        .value-display { float: right; color: #10A37F; font-weight: bold; }
        .panel-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #10A37F; text-align: center; }
        .info-box { background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px; margin-top: 15px; font-size: 11px; }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">First Law: Inertia</div>
        <div class="control-group">
            <label>Applied Force (N): <span class="value-display" id="force-value">${appliedForce}</span></label>
            <input type="range" id="force-slider" min="-10" max="10" step="0.5" value="${appliedForce}" style="width: 100%;">
        </div>
        <div class="control-group">
            <label>Initial Velocity: <span class="value-display" id="velocity-value">${initialVelocity}</span></label>
            <input type="range" id="velocity-slider" min="-5" max="5" step="0.5" value="${initialVelocity}" style="width: 100%;">
        </div>
        <div class="info-box">
            <strong>First Law:</strong><br>
            An object remains in its state<br>
            of rest or uniform motion unless<br>
            acted upon by external force.
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('force-slider').addEventListener('input', function(e) {
        appliedForce = parseFloat(e.target.value);
        document.getElementById('force-value').textContent = appliedForce.toFixed(1);
    });

    document.getElementById('velocity-slider').addEventListener('input', function(e) {
        initialVelocity = parseFloat(e.target.value);
        document.getElementById('velocity-value').textContent = initialVelocity.toFixed(1);
        resetparams();
    });
}

function ResetGUI() {
    document.getElementById('force-slider').value = appliedForce;
    document.getElementById('velocity-slider').value = initialVelocity;
    document.getElementById('force-value').textContent = appliedForce.toFixed(1);
    document.getElementById('velocity-value').textContent = initialVelocity.toFixed(1);
}

addCustomControlStyles();
createCustomControlPanel();
createFirstLawSimulation();
return {engine,runner};
}
