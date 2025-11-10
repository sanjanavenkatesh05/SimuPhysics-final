// laws_of_motion_second_law.js - Newton's Second Law (F=ma)
const defaultValues={
    force: 10,
    mass: 5
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
    let force = parameters?.force ?? defaultValues.force;
    let mass = parameters?.mass ?? defaultValues.mass;
   
let acceleration = 2;
let box;
let time = 0;
let velocityData = [];
let accelerationData = [];
let maxDataPoints = 100;
let simulationComplete = false;

engine.world.gravity.y = 0;

function createSecondLawSimulation() {
    Matter.World.clear(engine.world, false);
    velocityData = [];
    accelerationData = [];
    time = 0;
    simulationComplete = false;

    acceleration = force / mass;

    box = Bodies.rectangle(150, 470, 60, 60, {
        mass: mass,
        frictionAir: 0,
        friction: 0,
        render: { fillStyle: '#4169E1' }
    });

    Composite.add(world, [box]);
}

Events.on(engine, 'beforeUpdate', function() {
    if (isPlaying && box && !simulationComplete) {
        time += 1/60;

        acceleration = force / mass;
        Body.applyForce(box, box.position, { x: force / 1000, y: 0 });

        velocityData.push({ t: time, v: box.velocity.x });
        accelerationData.push({ t: time, a: acceleration });

        if (velocityData.length > maxDataPoints) {
            velocityData.shift();
            accelerationData.shift();
        }

        if (box.position.x > 800 || box.position.x < 0) {
            simulationComplete = true;
            isPlaying = false;
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        }
    }
});

Events.on(render, 'afterRender', function() {
    const context = render.context;

    drawGraphs(context);
    drawLiveDataPanel(context);
    drawForceArrow(context);
});

function drawForceArrow(context) {
    if (!box) return;

    const startX = box.position.x;
    const startY = box.position.y;
    const scale = 5;
    const endX = startX + force * scale;

    context.strokeStyle = '#FFD700';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, startY);
    context.stroke();

    const angle = 0;
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
    context.fillText(`F=${force}N`, endX + 10, startY - 10);
}

function drawGraphs(context) {
    const graphX = 450;
    const graphY = 50;
    const graphWidth = 300;
    const graphHeight = 150;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(graphX, graphY, graphWidth, graphHeight);

    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.strokeRect(graphX, graphY, graphWidth, graphHeight);

    context.fillStyle = '#10A37F';
    context.font = 'bold 14px Arial';
    context.textAlign = 'center';
    context.fillText('Velocity vs Time', graphX + graphWidth/2, graphY - 10);

    context.strokeStyle = '#888';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(graphX + 30, graphY + 20);
    context.lineTo(graphX + 30, graphY + graphHeight - 30);
    context.lineTo(graphX + graphWidth - 20, graphY + graphHeight - 30);
    context.stroke();

    if (velocityData.length > 1) {
        context.beginPath();
        const maxTime = Math.max(10, time);
        const timeScale = (graphWidth - 50) / maxTime;
        const velScale = (graphHeight - 50) / 30;

        for (let i = 0; i < velocityData.length; i++) {
            const x = graphX + 30 + (velocityData[i].t * timeScale);
            const y = graphY + graphHeight - 30 - (velocityData[i].v * velScale);

            if (i === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }

        context.strokeStyle = '#00FFFF';
        context.lineWidth = 2;
        context.stroke();
    }

    const graphY2 = graphY + graphHeight + 30;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(graphX, graphY2, graphWidth, graphHeight);

    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.strokeRect(graphX, graphY2, graphWidth, graphHeight);

    context.fillStyle = '#10A37F';
    context.font = 'bold 14px Arial';
    context.fillText('Acceleration (a = F/m)', graphX + graphWidth/2, graphY2 - 10);

    context.strokeStyle = '#888';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(graphX + 30, graphY2 + 20);
    context.lineTo(graphX + 30, graphY2 + graphHeight - 30);
    context.lineTo(graphX + graphWidth - 20, graphY2 + graphHeight - 30);
    context.stroke();

    if (accelerationData.length > 1) {
        context.beginPath();
        const maxTime = Math.max(10, time);
        const timeScale = (graphWidth - 50) / maxTime;
        const accScale = (graphHeight - 50) / 10;

        for (let i = 0; i < accelerationData.length; i++) {
            const x = graphX + 30 + (accelerationData[i].t * timeScale);
            const y = graphY2 + graphHeight - 30 - (accelerationData[i].a * accScale);

            if (i === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        }

        context.strokeStyle = '#FF6347';
        context.lineWidth = 2;
        context.stroke();
    }
}

function drawLiveDataPanel(context) {
    const panelX = 120;
    const panelY = 50;
    const lineHeight = 22;

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(panelX - 100, panelY - 20, 260, 260);

    context.strokeStyle = '#4D4D4F';
    context.lineWidth = 1;
    context.strokeRect(panelX - 100, panelY - 20, 260, 260);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText("Newton's Second Law", panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    context.fillStyle = '#FFD700';
    context.fillText(`Force (F): ${force.toFixed(1)} N`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#4169E1';
    context.fillText(`Mass (m): ${mass.toFixed(1)} kg`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FF6347';
    context.font = 'bold 14px Arial';
    context.fillText(`Acceleration: ${acceleration.toFixed(2)} m/s²`, panelX, yOffset);
    yOffset += lineHeight;

    if (box) {
        context.fillStyle = '#00FFFF';
        context.font = '13px Arial';
        context.fillText(`Velocity: ${box.velocity.x.toFixed(2)} m/s`, panelX, yOffset);
        yOffset += lineHeight;
    }

    context.fillStyle = '#FFA500';
    context.fillText(`Time: ${time.toFixed(2)} s`, panelX, yOffset);
    yOffset += lineHeight + 10;

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 14px Arial';
    context.fillText('F = ma', panelX, yOffset);
    yOffset += lineHeight;

    context.font = '12px Arial';
    context.fillText(`${force} = ${mass} × ${acceleration.toFixed(2)}`, panelX, yOffset);
    yOffset += lineHeight + 5;

    context.font = 'italic 11px Arial';
    context.fillText('• Force is proportional to', panelX, yOffset);
    yOffset += lineHeight - 3;
    context.fillText('  acceleration', panelX, yOffset);
    yOffset += lineHeight - 3;
    context.fillText('• Inversely proportional to mass', panelX, yOffset);
}

function resetScene() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    createSecondLawSimulation();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    simulationComplete = false;
    if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    createSecondLawSimulation();
}

function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #custom-control-panel {
            position: fixed; top: 80px; right: 20px; width: 280px;
            background-color: #202123; border: 1px solid #4D4D4F;
            border-radius: 8px; color: #ECECF1;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 1000; padding: 15px;
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
        <div class="panel-title">Second Law: F=ma</div>
        <div class="control-group">
            <label>Force (N): <span class="value-display" id="force-value">${force}</span></label>
            <input type="range" id="force-slider" min="0" max="20" step="0.5" value="${force}" style="width: 100%;">
        </div>
        <div class="control-group">
            <label>Mass (kg): <span class="value-display" id="mass-value">${mass}</span></label>
            <input type="range" id="mass-slider" min="1" max="20" step="0.5" value="${mass}" style="width: 100%;">
        </div>
        <div class="info-box">
            <strong>Second Law:</strong><br>
            F = ma<br>
            Force equals mass times<br>
            acceleration
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('force-slider').addEventListener('input', function(e) {
        force = parseFloat(e.target.value);
        document.getElementById('force-value').textContent = force.toFixed(1);
        acceleration = force / mass;
    });

    document.getElementById('mass-slider').addEventListener('input', function(e) {
        mass = parseFloat(e.target.value);
        document.getElementById('mass-value').textContent = mass.toFixed(1);
        resetparams();
    });
}

function ResetGUI() {
    document.getElementById('force-slider').value = force;
    document.getElementById('mass-slider').value = mass;
    document.getElementById('force-value').textContent = force.toFixed(1);
    document.getElementById('mass-value').textContent = mass.toFixed(1);
}

addCustomControlStyles();
createCustomControlPanel();
createSecondLawSimulation();
return {engine,runner};
}
