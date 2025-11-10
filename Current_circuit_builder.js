// circuit_builder.js - Series & Parallel Circuit Analyzer
// Global variables
const defaultValues={
    circuitType:'series',
    resistor1:100,
    resistor2:100,
    resistor3:100,
    voltage:12
};

function startSimulation(parameters)
{
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

let circuitType = parameters?.circuitType??defaultValues.circuitType; // 'series' or 'parallel'
let resistor1 = parameters?.resistor1??defaultValues.resistor1;
let resistor2 = parameters?.resistor2??defaultValues.resistor2;
let resistor3 = parameters?.resistor3??defaultValues.resistor3;
let voltage = parameters?.voltage??defaultValues.voltage;
let totalResistance = 0;
let totalCurrent = 0;
let current1 = 0, current2 = 0, current3 = 0;
let voltage1 = 0, voltage2 = 0, voltage3 = 0;
let power1 = 0, power2 = 0, power3 = 0;
let flowingElectrons = [];

// Disable gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

function createCircuit() {
    Matter.World.clear(engine.world, false);
    flowingElectrons = [];

    if (circuitType === 'series') {
        createSeriesCircuit();
    } else {
        createParallelCircuit();
    }
}

function createSeriesCircuit() {
    // Calculate series circuit values
    totalResistance = resistor1 + resistor2 + resistor3;
    totalCurrent = voltage / totalResistance;

    current1 = current2 = current3 = totalCurrent;

    voltage1 = totalCurrent * resistor1;
    voltage2 = totalCurrent * resistor2;
    voltage3 = totalCurrent * resistor3;

    power1 = voltage1 * current1;
    power2 = voltage2 * current2;
    power3 = voltage3 * current3;

    // Create visual components
    const battery = Bodies.rectangle(100, 300, 40, 80, {
        isStatic: true,
        render: { fillStyle: '#FFD700' }
    });

    const res1 = Bodies.rectangle(250, 300, 50, 30, {
        isStatic: true,
        render: { fillStyle: '#FF6347' }
    });

    const res2 = Bodies.rectangle(400, 300, 50, 30, {
        isStatic: true,
        render: { fillStyle: '#FF6347' }
    });

    const res3 = Bodies.rectangle(550, 300, 50, 30, {
        isStatic: true,
        render: { fillStyle: '#FF6347' }
    });

    Composite.add(world, [battery, res1, res2, res3]);

    // Create flowing electrons
    for (let i = 0; i < 15; i++) {
        const progress = i / 15;
        const x = 100 + progress * 600;
        const electron = Bodies.circle(x, 300, 4, {
            render: { fillStyle: '#00FFFF' }
        });

        flowingElectrons.push({
            body: electron,
            progress: progress,
            speed: totalCurrent * 50
        });

        Composite.add(world, electron);
    }
}

function createParallelCircuit() {
    // Calculate parallel circuit values
    totalResistance = 1 / (1/resistor1 + 1/resistor2 + 1/resistor3);
    totalCurrent = voltage / totalResistance;

    voltage1 = voltage2 = voltage3 = voltage;

    current1 = voltage / resistor1;
    current2 = voltage / resistor2;
    current3 = voltage / resistor3;

    power1 = voltage1 * current1;
    power2 = voltage2 * current2;
    power3 = voltage3 * current3;

    // Create visual components
    const battery = Bodies.rectangle(100, 300, 40, 80, {
        isStatic: true,
        render: { fillStyle: '#FFD700' }
    });

    const res1 = Bodies.rectangle(400, 200, 50, 30, {
        isStatic: true,
        render: { fillStyle: '#FF6347' }
    });

    const res2 = Bodies.rectangle(400, 300, 50, 30, {
        isStatic: true,
        render: { fillStyle: '#FF6347' }
    });

    const res3 = Bodies.rectangle(400, 400, 50, 30, {
        isStatic: true,
        render: { fillStyle: '#FF6347' }
    });

    Composite.add(world, [battery, res1, res2, res3]);

    // Create flowing electrons in each branch
    for (let branch = 0; branch < 3; branch++) {
        const y = 200 + branch * 100;
        for (let i = 0; i < 5; i++) {
            const x = 150 + i * 100;
            const electron = Bodies.circle(x, y, 4, {
                render: { fillStyle: '#00FFFF' }
            });

            flowingElectrons.push({
                body: electron,
                branch: branch,
                progress: i / 5
            });

            Composite.add(world, electron);
        }
    }
}

Events.on(engine, 'beforeUpdate', function() {
    if (circuitType === 'series') {
        flowingElectrons.forEach(e => {
            e.progress += totalCurrent * 0.01;
            if (e.progress > 1) e.progress = 0;

            const x = 100 + e.progress * 600;
            Body.setPosition(e.body, { x: x, y: 300 });
        });
    } else {
        flowingElectrons.forEach(e => {
            e.progress += 0.01;
            if (e.progress > 1) e.progress = 0;

            const y = 200 + e.branch * 100;
            const x = 150 + e.progress * 400;
            Body.setPosition(e.body, { x: x, y: y });
        });
    }
});

Events.on(render, 'afterRender', function() {
    const context = render.context;

    // Draw circuit wires
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 3;

    if (circuitType === 'series') {
        // Series wiring
        context.beginPath();
        context.moveTo(120, 300);
        context.lineTo(700, 300);
        context.stroke();
    } else {
        // Parallel wiring
        context.beginPath();
        context.moveTo(120, 300);
        context.lineTo(150, 300);

        // Branch out
        context.moveTo(150, 300);
        context.lineTo(150, 200);
        context.lineTo(375, 200);

        context.moveTo(150, 300);
        context.lineTo(375, 300);

        context.moveTo(150, 300);
        context.lineTo(150, 400);
        context.lineTo(375, 400);

        // After resistors
        context.moveTo(425, 200);
        context.lineTo(600, 200);
        context.lineTo(600, 300);

        context.moveTo(425, 300);
        context.lineTo(600, 300);

        context.moveTo(425, 400);
        context.lineTo(600, 400);
        context.lineTo(600, 300);

        context.stroke();
    }

    // Display calculations
    const panelX = 50;
    const panelY = 50;
    const lineHeight = 20;

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText(circuitType === 'series' ? 'Series Circuit' : 'Parallel Circuit', panelX, panelY);

    context.font = '12px Arial';
    let yOffset = panelY + lineHeight + 5;

    context.fillStyle = '#FFD700';
    context.fillText(`Voltage: ${voltage.toFixed(2)} V`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FF6347';
    context.fillText(`R1=${resistor1}Ω  R2=${resistor2}Ω  R3=${resistor3}Ω`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FF00';
    context.font = 'bold 12px Arial';
    context.fillText(`Total Resistance: ${totalResistance.toFixed(2)} Ω`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FFFF';
    context.fillText(`Total Current: ${totalCurrent.toFixed(4)} A`, panelX, yOffset);
    yOffset += lineHeight + 10;

    // Individual values
    context.font = '11px Arial';
    context.fillStyle = '#FFFFFF';
    context.fillText('Resistor 1:', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`  V=${voltage1.toFixed(2)}V  I=${current1.toFixed(4)}A  P=${power1.toFixed(3)}W`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillText('Resistor 2:', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`  V=${voltage2.toFixed(2)}V  I=${current2.toFixed(4)}A  P=${power2.toFixed(3)}W`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillText('Resistor 3:', panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`  V=${voltage3.toFixed(2)}V  I=${current3.toFixed(4)}A  P=${power3.toFixed(3)}W`, panelX, yOffset);

    // Formulas
    context.font = 'italic 11px Arial';
    if (circuitType === 'series') {
        context.fillText('R_total = R1 + R2 + R3', 550, 580);
    } else {
        context.fillText('1/R_total = 1/R1 + 1/R2 + 1/R3', 520, 580);
    }
});

function resetScene() {
    Runner.stop(runner);
    createCircuit();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    createCircuit();
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
        /* Shift simulation container to the left */
        .simulation-container {
            margin-right: 320px !important;
        }
        .control-group { margin-bottom: 15px; }
        .control-group label { display: block; margin-bottom: 5px; font-size: 12px; }
        .value-display { float: right; color: #10A37F; font-weight: bold; }
        .panel-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #10A37F; text-align: center; }
        .circuit-type-btn {
            width: 48%;
            padding: 8px;
            margin: 2px;
            background: #2A2A2C;
            border: 1px solid #4D4D4F;
            color: #ECECF1;
            border-radius: 4px;
            cursor: pointer;
        }
        .circuit-type-btn.active { background: #10A37F; color: white; }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">⚡ Circuit Builder</div>

        <div style="margin-bottom: 15px;">
            <button class="circuit-type-btn active" id="series-btn" onclick="setCircuitType('series')">Series</button>
            <button class="circuit-type-btn" id="parallel-btn" onclick="setCircuitType('parallel')">Parallel</button>
        </div>

        <div class="control-group">
            <label>Voltage: <span class="value-display" id="voltage-value">12 V</span></label>
            <input type="range" id="voltage-slider" min="1" max="24" step="1" value="12">
        </div>

        <div class="control-group">
            <label>R1: <span class="value-display" id="r1-value">100 Ω</span></label>
            <input type="range" id="r1-slider" min="10" max="1000" step="10" value="100">
        </div>

        <div class="control-group">
            <label>R2: <span class="value-display" id="r2-value">220 Ω</span></label>
            <input type="range" id="r2-slider" min="10" max="1000" step="10" value="220">
        </div>

        <div class="control-group">
            <label>R3: <span class="value-display" id="r3-value">330 Ω</span></label>
            <input type="range" id="r3-slider" min="10" max="1000" step="10" value="330">
        </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('voltage-slider').addEventListener('input', function(e) {
        voltage = parseFloat(e.target.value);
        document.getElementById('voltage-value').textContent = voltage + ' V';
        createCircuit();
    });

    document.getElementById('r1-slider').addEventListener('input', function(e) {
        resistor1 = parseFloat(e.target.value);
        document.getElementById('r1-value').textContent = resistor1 + ' Ω';
        createCircuit();
    });

    document.getElementById('r2-slider').addEventListener('input', function(e) {
        resistor2 = parseFloat(e.target.value);
        document.getElementById('r2-value').textContent = resistor2 + ' Ω';
        createCircuit();
    });

    document.getElementById('r3-slider').addEventListener('input', function(e) {
        resistor3 = parseFloat(e.target.value);
        document.getElementById('r3-value').textContent = resistor3 + ' Ω';
        createCircuit();
    });
}

function setCircuitType(type) {
    circuitType = type;
    document.getElementById('series-btn').classList.toggle('active', type === 'series');
    document.getElementById('parallel-btn').classList.toggle('active', type === 'parallel');
    createCircuit();
}

addCustomControlStyles();
createCustomControlPanel();
createCircuit();
return {engine, runner};
}