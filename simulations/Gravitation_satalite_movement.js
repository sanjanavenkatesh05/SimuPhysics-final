// gravitational_circular_orbit.js - Circular Orbit Around Central Mass
const defaultValues={
    centralMass: 100,
    orbitingMass: 5,
    orbitRadius: 250,
    orbitalSpeed: 4.5
    
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

    let centralMass = parameters?.centralMass ?? defaultValues.centralMass;
    let orbitingMass = parameters?.orbitingMass ?? defaultValues.orbitingMass;
    let orbitRadius = parameters?.orbitRadius ?? defaultValues.orbitRadius;
    let orbitalSpeed = parameters?.orbitalSpeed ?? defaultValues.orbitalSpeed;
// Global variables

let G = 1.0;

let centralBody, orbitingBody;
let trail = [];
const maxTrailLength = 300;

// Disable Matter.js gravity (we calculate our own gravitational forces)
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

// Create orbital system
function createOrbitalSystem(cMass, oMass, radius, speed) {
    centralMass = cMass;
    orbitingMass = oMass;
    orbitRadius = radius;
    orbitalSpeed = speed;

    const centerX = 400;
    const centerY = 300;

    const centralRadius = Math.sqrt(centralMass) * 3;
    centralBody = Bodies.circle(centerX, centerY, centralRadius, {
        isStatic: true,
        render: { fillStyle: '#FFD700' }
    });

    const orbitingRadius = Math.sqrt(orbitingMass) * 3;
    orbitingBody = Bodies.circle(centerX + radius, centerY, orbitingRadius, {
        frictionAir: 0,
        friction: 0,
        restitution: 1.0,
        render: { fillStyle: '#4169E1' }
    });

    Body.setMass(centralBody, centralMass);
    Body.setMass(orbitingBody, orbitingMass);

    const v = Math.sqrt((G * centralMass) / radius) * orbitalSpeed;
    Body.setVelocity(orbitingBody, { x: 0, y: v });

    Composite.add(world, [centralBody, orbitingBody]);

    trail = [];
}

Events.on(engine, 'beforeUpdate', function() {
    if (centralBody && orbitingBody && centralBody.position && orbitingBody.position) {
        const dx = centralBody.position.x - orbitingBody.position.x;
        const dy = centralBody.position.y - orbitingBody.position.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared);

        if (distance > 1) {
            const forceMagnitude = (G * centralMass * orbitingMass) / distanceSquared;
            const forceX = (forceMagnitude * dx) / distance;
            const forceY = (forceMagnitude * dy) / distance;

            Body.applyForce(orbitingBody, orbitingBody.position, { 
                x: forceX / orbitingMass, 
                y: forceY / orbitingMass 
            });
        }

        trail.push({ x: orbitingBody.position.x, y: orbitingBody.position.y });
        if (trail.length > maxTrailLength) trail.shift();
    }
});

Events.on(render, 'afterRender', function() {
    const context = render.context;

    context.strokeStyle = '#4169E1';
    context.lineWidth = 2;
    context.globalAlpha = 0.4;
    context.beginPath();
    for (let i = 0; i < trail.length; i++) {
        if (i === 0) {
            context.moveTo(trail[i].x, trail[i].y);
        } else {
            context.lineTo(trail[i].x, trail[i].y);
        }
    }
    context.stroke();
    context.globalAlpha = 1.0;

    if (centralBody && orbitingBody) {
        const dx = orbitingBody.position.x - centralBody.position.x;
        const dy = orbitingBody.position.y - centralBody.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        context.strokeStyle = '#FFFFFF';
        context.lineWidth = 1;
        context.globalAlpha = 0.3;
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(centralBody.position.x, centralBody.position.y);
        context.lineTo(orbitingBody.position.x, orbitingBody.position.y);
        context.stroke();
        context.setLineDash([]);
        context.globalAlpha = 1.0;

        context.fillStyle = '#FFFFFF';
        context.font = '12px Arial';
        const midX = (centralBody.position.x + orbitingBody.position.x) / 2;
        const midY = (centralBody.position.y + orbitingBody.position.y) / 2;
        context.fillText(`r = ${distance.toFixed(1)}`, midX + 10, midY);
    }
    
    // Display the gravitational constant and formula on the side
    context.fillStyle = '#FFD700'; // Gold color for visibility
    context.font = 'bold 14px Arial';
    context.fillText('G = 6.67430 × 10⁻¹¹ m³/kg⋅s²', 620, 30);
    context.font = '12px Arial';
    context.fillText('F = G × m₁ × m₂ / r²', 620, 50);
});

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    createOrbitalSystem(centralMass, orbitingMass, orbitRadius, orbitalSpeed);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createOrbitalSystem(centralMass, orbitingMass, orbitRadius, orbitalSpeed);
}

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
        <div class="panel-title">Circular Orbit</div>

        <div class="control-group">
            <label>Central Mass: <span class="value-display" id="cmass-value">${centralMass}</span></label>
            <input type="range" id="cmass-slider" min="50" max="200" step="5" value="${centralMass}">
            <div class="info-text">Mass of central body (star)</div>
        </div>

        <div class="control-group">
            <label>Orbiting Mass: <span class="value-display" id="omass-value">${orbitingMass}</span></label>
            <input type="range" id="omass-slider" min="1" max="20" step="1" value="${orbitingMass}">
            <div class="info-text">Mass of orbiting body (planet)</div>
        </div>

        <div class="control-group">
            <label>Orbit Radius: <span class="value-display" id="radius-value">${orbitRadius}</span></label>
            <input type="range" id="radius-slider" min="100" max="350" step="10" value="${orbitRadius}">
            <div class="info-text">Distance from center</div>
        </div>

        <div class="control-group">
            <label>Orbital Speed Factor: <span class="value-display" id="speed-value">${orbitalSpeed}</span></label>
            <input type="range" id="speed-slider" min="1" max="6" step="0.1" value="${orbitalSpeed}">
            <div class="info-text">Speed multiplier for orbit</div>
        </div>
    `;

    document.body.appendChild(panel);
    attachControlListeners();
}

function attachControlListeners() {
    document.getElementById('cmass-slider').addEventListener('input', function() {
        centralMass = parseFloat(this.value);
        document.getElementById('cmass-value').textContent = centralMass;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('omass-slider').addEventListener('input', function() {
        orbitingMass = parseFloat(this.value);
        document.getElementById('omass-value').textContent = orbitingMass;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('radius-slider').addEventListener('input', function() {
        orbitRadius = parseFloat(this.value);
        document.getElementById('radius-value').textContent = orbitRadius;
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('speed-slider').addEventListener('input', function() {
        orbitalSpeed = parseFloat(this.value);
        document.getElementById('speed-value').textContent = orbitalSpeed.toFixed(1);
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });
}

function ResetGUI() {
    document.getElementById('cmass-slider').value = centralMass;
    document.getElementById('omass-slider').value = orbitingMass;
    document.getElementById('radius-slider').value = orbitRadius;
    document.getElementById('speed-slider').value = orbitalSpeed;

    document.getElementById('cmass-value').textContent = centralMass;
    document.getElementById('omass-value').textContent = orbitingMass;
    document.getElementById('radius-value').textContent = orbitRadius;
    document.getElementById('speed-value').textContent = orbitalSpeed.toFixed(1);
}

addCustomControlStyles();
createCustomControlPanel();
createOrbitalSystem(centralMass, orbitingMass, orbitRadius, orbitalSpeed);
return {engine,runner};
}
