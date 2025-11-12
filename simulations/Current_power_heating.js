// power_heating.js - Electric Power & Joule Heating Simulator
// Global variables


function startSimulation(parameters){

const {
  Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint,
  Constraint, Composite, Events
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
let voltage = 12;
let current = 2;
let resistance = 6;
let time = 0; // seconds
let totalEnergy = 0; // Joules
let temperature = 25; // Celsius
let heatGenerated = 0;
let resistorGlow = 0;

// Variables for electron flow animation
let electronParticles = [];
const numElectrons = 12;
let flowOffset = 0;

// Disable gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

function createPowerSimulation() {
    Matter.World.clear(engine.world, false);

    // Calculate power and related values
    resistance = voltage / current;
    const power = voltage * current;

    // Reset time and energy when parameters change
    time = 0;
    totalEnergy = 0;
    temperature = 25;

    // Create electron particles for animation
    electronParticles = [];
    for (let i = 0; i < numElectrons; i++) {
        electronParticles.push({
            progress: i / numElectrons,
            speed: 0.005
        });
    }

    // Create visual resistor (no battery rectangle needed since we're drawing a circle)
    const resistorBody = Bodies.rectangle(400, 300, 100, 40, {
        isStatic: true,
        render: { fillStyle: '#FF6347' }
    });

    Composite.add(world, [resistorBody]);
}

Events.on(engine, 'beforeUpdate', function() {
    // Update time and calculate cumulative energy
    time += 1/60; // Assuming 60 FPS

    const power = voltage * current;
    heatGenerated = power * time; // H = P × t
    totalEnergy = heatGenerated;

    // Temperature rise (simplified): ΔT = H / (m × c)
    // Assume mass = 10g, specific heat = 450 J/(kg·K) for nichrome
    const mass = 0.01; // kg
    const specificHeat = 450; // J/(kg·K)
    const tempRise = heatGenerated / (mass * specificHeat);
    temperature = 25 + tempRise;

    // Calculate glow intensity
    resistorGlow = Math.min(255, temperature * 2);

    // Animate electrons
    flowOffset += 0.005;

    for (let electron of electronParticles) {
        electron.progress += electron.speed;
        if (electron.progress > 1) electron.progress = 0;
    }
});

Events.on(render, 'afterRender', function() {
    const context = render.context;

    // Draw circuit with horizontal wires
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 3;
    context.beginPath();
    // Top wire (voltage source to resistor)
    context.moveTo(190, 300);  // Left of voltage source
    context.lineTo(350, 300);  // To resistor
    // Bottom wire (resistor back to voltage source)
    context.moveTo(450, 300);  // From resistor
    context.lineTo(600, 300);  // Right end
    context.lineTo(600, 400);  // Down
    context.lineTo(190, 400);  // Across bottom
    context.lineTo(190, 335);  // Up to voltage source
    context.stroke();

    // Draw voltage source as a circle (similar to power_in_resistor.js)
    const batteryX = 225;
    const batteryY = 300;

    // Battery body (circle)
    context.fillStyle = '#FFD700';  // Gold color for voltage
    context.beginPath();
    context.arc(batteryX, batteryY, 35, 0, 2 * Math.PI);
    context.fill();
    
    // Battery terminals
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 4;
    // Positive terminal (T-shape)
    context.beginPath();
    context.moveTo(batteryX - 12, batteryY - 8);
    context.lineTo(batteryX + 12, batteryY - 8);
    context.moveTo(batteryX, batteryY - 16);
    context.lineTo(batteryX, batteryY);
    context.stroke();
    // Negative terminal (horizontal line)
    context.beginPath();
    context.moveTo(batteryX - 12, batteryY + 8);
    context.lineTo(batteryX + 12, batteryY + 8);
    context.stroke();

    // Voltage label
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.fillText('voltage', batteryX, batteryY + 60);
    context.textAlign = 'left'; // Reset alignment

    // Draw glowing resistor
    const glowColor = `rgb(${resistorGlow}, ${Math.max(0, 100 - resistorGlow/2)}, 0)`;
    context.fillStyle = glowColor;
    context.fillRect(350, 280, 100, 40);

    // Draw animated electrons (current flow)
    for (let electron of electronParticles) {
        const pos = getCircuitPosition(electron.progress);

        // Electron
        context.fillStyle = '#FFFF00';
        context.beginPath();
        context.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
        context.fill();

        // Electron glow
        const electronGlow = context.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 10);
        electronGlow.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        electronGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
        context.fillStyle = electronGlow;
        context.beginPath();
        context.arc(pos.x, pos.y, 10, 0, 2 * Math.PI);
        context.fill();
    }

    // Draw heat waves
    if (temperature > 30) {
        context.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        context.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const offset = (time * 100 + i * 20) % 100;
            context.beginPath();
            context.moveTo(400, 280 - offset);
            context.bezierCurveTo(
                390, 260 - offset,
                410, 240 - offset,
                400, 220 - offset
            );
            context.stroke();
        }
    }

    // Display calculations
    const panelX = 10;
    const panelY = 30;
    const lineHeight = 22;

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.fillText('Electric Power & Heating', panelX, panelY);

    context.font = '13px Arial';
    let yOffset = panelY + lineHeight + 5;

    context.fillStyle = '#FFD700';
    context.fillText(`Voltage (V): ${voltage.toFixed(2)} V`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FFFF';
    context.fillText(`Current (I): ${current.toFixed(2)} A`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FF6347';
    context.fillText(`Resistance (R): ${resistance.toFixed(2)} Ω`, panelX, yOffset);
    yOffset += lineHeight + 5;

    const power = voltage * current;
    context.fillStyle = '#00FF00';
    context.font = 'bold 14px Arial';
    context.fillText(`Power (P): ${power.toFixed(3)} W`, panelX, yOffset);
    yOffset += lineHeight;

    context.font = '12px Arial';
    context.fillStyle = '#FFFFFF';
    context.fillText(`P = V × I = ${voltage.toFixed(2)} × ${current.toFixed(2)} = ${power.toFixed(3)} W`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`P = I²R = ${current.toFixed(2)}² × ${resistance.toFixed(2)} = ${power.toFixed(3)} W`, panelX, yOffset);
    yOffset += lineHeight;
    context.fillText(`P = V²/R = ${voltage.toFixed(2)}²/${resistance.toFixed(2)} = ${power.toFixed(3)} W`, panelX, yOffset);
    yOffset += lineHeight + 10;

    context.fillStyle = '#FFD700';
    context.fillText(`Time elapsed: ${time.toFixed(1)} s`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FF6347';
    context.font = 'bold 13px Arial';
    context.fillText(`Heat Generated: ${heatGenerated.toFixed(2)} J`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#FFA500';
    context.fillText(`Temperature: ${temperature.toFixed(1)} °C`, panelX, yOffset);
    yOffset += lineHeight;

    context.fillStyle = '#00FFFF';
    context.font = '12px Arial';
    context.fillText(`Energy: ${totalEnergy.toFixed(2)} J = ${(totalEnergy/3600).toFixed(6)} Wh`, panelX, yOffset);

    // Joule's Law
    context.fillStyle = '#FFFFFF';
    context.font = 'italic 12px Arial';
    context.fillText("Joule's Law: H = I²Rt", 320, 580);
});

function resetScene() {
    Runner.stop(runner);
    time = 0;
    totalEnergy = 0;
    temperature = 25;
    createPowerSimulation();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    time = 0;
    totalEnergy = 0;
    temperature = 25;
    createPowerSimulation();
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
        .control-group { margin-bottom: 15px; }
        .control-group label { display: block; margin-bottom: 5px; font-size: 12px; }
        .value-display { float: right; color: #10A37F; font-weight: bold; }
        .panel-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #10A37F; text-align: center; }
        .info-box {
            background: #2A2A2C;
            padding: 10px;
            border-radius: 4px;
            margin-top: 15px;
            font-size: 11px;
            line-height: 1.5;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">⚡ Power & Heating</div>

        <div class="control-group">
            <label>Voltage (V): <span class="value-display" id="voltage-value">12 V</span></label>
            <input type="range" id="voltage-slider" min="1" max="24" step="0.5" value="12">
        </div>

        <div class="control-group">
            <label>Current (I): <span class="value-display" id="current-value">2.0 A</span></label>
            <input type="range" id="current-slider" min="0.1" max="10" step="0.1" value="2">
        </div>

        <div class="info-box">
            <strong>Joule Heating Effect:</strong><br>
            When current flows through a resistor, electrical energy converts to heat.<br>
            <em>H = I²Rt</em><br>
            Watch the resistor glow as it heats up!
        </div>
    `;

    document.body.appendChild(panel);

    document.getElementById('voltage-slider').addEventListener('input', function(e) {
        voltage = parseFloat(e.target.value);
        document.getElementById('voltage-value').textContent = voltage.toFixed(1) + ' V';
        time = 0;
        totalEnergy = 0;
        temperature = 25;
        createPowerSimulation();
    });

    document.getElementById('current-slider').addEventListener('input', function(e) {
        current = parseFloat(e.target.value);
        document.getElementById('current-value').textContent = current.toFixed(1) + ' A';
        time = 0;
        totalEnergy = 0;
        temperature = 25;
        createPowerSimulation();
    });
}

addCustomControlStyles();
createCustomControlPanel();
createPowerSimulation();

// Get position on circuit path
function getCircuitPosition(progress) {
    // Circuit dimensions with horizontal wires
    const leftX = 190;
    const rightX = 600;
    const topY = 300;
    const bottomY = 400;
    
    const topLength = 410;      // Top wire length (from left to resistor and back)
    const rightLength = 100;    // Right wire length (down)
    const bottomLength = 410;   // Bottom wire length (across)
    const leftLength = 100;     // Left wire length (up)
    
    const totalPerimeter = topLength + rightLength + bottomLength + leftLength;
    const distance = progress * totalPerimeter;

    let x, y;

    if (distance < topLength) {
        // Top side (left to right)
        x = leftX + (distance / topLength) * (rightX - leftX);
        y = topY;
    } else if (distance < topLength + rightLength) {
        // Right side (top to bottom)
        x = rightX;
        y = topY + ((distance - topLength) / rightLength) * (bottomY - topY);
    } else if (distance < topLength + rightLength + bottomLength) {
        // Bottom side (right to left)
        x = rightX - ((distance - topLength - rightLength) / bottomLength) * (rightX - leftX);
        y = bottomY;
    } else {
        // Left side (bottom to top)
        x = leftX;
        y = bottomY - ((distance - topLength - rightLength - bottomLength) / leftLength) * (bottomY - topY);
    }

    return { x, y };
}
return {engine,runner};
}