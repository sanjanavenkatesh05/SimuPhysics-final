// gravitational_escape_velocity.js - Perfect Escape Velocity (Free Fall Approach)

// Global variables
const defaultValues={
    planetMass:100,
    planetRadius:150,
    launchSpeed:30,
    
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

let planetMass = parameters?.planetMass??defaultValues.planetMass;
let planetRadius = parameters?.planetRadius??defaultValues.planetRadius;
let launchSpeed = parameters?.launchSpeed??defaultValues.launchSpeed;
let G = 50;
let gravity_accel = 0.5;  // Constant downward acceleration for free fall

let planet, projectile, ground;
let trail = [];
const maxTrailLength = 600;
let escapeVelocity = 0;
let willEscape = false;

// Disable Matter.js gravity
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

function createEscapeScenario(pMass, pRadius, speed) {
    planetMass = pMass;
    planetRadius = pRadius;
    launchSpeed = speed;

    const centerX = 400;
    const centerY = 550;

    // CALCULATE ESCAPE VELOCITY: v_esc = sqrt(2 * G * M / R)
    escapeVelocity = Math.sqrt((2 * G * planetMass) / planetRadius);

    // DECISION: Will it escape?
    willEscape = (launchSpeed >= escapeVelocity);

    // Create planet (large semicircle at bottom)
    planet = Bodies.circle(centerX, centerY, planetRadius, {
        isStatic: true,
        render: { fillStyle: '#4169E1' }
    });

    // Create invisible ground at the edge of semicircle (for free fall to land on)
    ground = Bodies.rectangle(centerX, centerY - planetRadius, 800, 10, {
        isStatic: true,
        render: { 
            fillStyle: '#28ba3eff',
            opacity: 0.5
        }
    });

    // Create projectile on top of ground/planet surface
    const projectileRadius = 8;
    const startX = centerX;
    const startY = centerY - planetRadius - projectileRadius - 2;

    projectile = Bodies.circle(startX, startY, projectileRadius, {
        frictionAir: 0,
        friction: 0,
        restitution: 0,
        render: { fillStyle: willEscape ? '#00FF00' : '#FF6347' }
    });

    // Launch straight upward (or downward if zero speed)
    Body.setVelocity(projectile, { x: 0, y: -launchSpeed });

    Composite.add(world, [planet, ground, projectile]);

    trail = [];
}

// Apply physics based on escape condition
Events.on(engine, 'beforeUpdate', function(event) {
    if (!projectile) return;

    if (willEscape && launchSpeed > 0) {
        // ESCAPE MODE: No gravity, just keep going up and out of frame
        // Do nothing - projectile keeps initial velocity and goes forever!

    } else if (launchSpeed > 0) {
        // FREE FALL MODE: Apply constant downward gravity (like projectile motion)
        // a = g (constant downward acceleration)
        const dt = event.delta / 1000;

        // Update velocity: v = v + g*dt
        const newVy = projectile.velocity.y + gravity_accel * dt;

        // Keep x velocity at 0 (straight up and down)
        Body.setVelocity(projectile, { x: 0, y: newVy });
    } else {
        // ZERO VELOCITY: Just apply gravity from the start
        const dt = event.delta / 1000;
        const newVy = projectile.velocity.y + gravity_accel * dt;
        Body.setVelocity(projectile, { x: 0, y: newVy });
    }

    // Update trail
    trail.push({ x: projectile.position.x, y: projectile.position.y });
    if (trail.length > maxTrailLength) trail.shift();
});

// Render
Events.on(render, 'afterRender', function() {
    const context = render.context;

    // Draw trail
    const trailColor = willEscape ? '#00FF00' : '#FF6347';
    context.strokeStyle = trailColor;
    context.lineWidth = 2;
    context.globalAlpha = 0.5;
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

    if (!projectile || !planet) return;

    const currentSpeed = Math.sqrt(projectile.velocity.x ** 2 + projectile.velocity.y ** 2);
    const altitude = planet.position.y - planetRadius - projectile.position.y;

    // Info display
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 18px Arial';
    context.fillText('Escape Velocity Demonstration', 10, 25);

    context.font = '14px Arial';
    context.fillStyle = '#FFD700';
    context.fillText(`Escape Velocity: ${escapeVelocity.toFixed(2)} units/s`, 10, 55);

    const speedColor = launchSpeed >= escapeVelocity ? '#00FF00' : '#FF6347';
    context.fillStyle = speedColor;
    context.fillText(`Launch Speed: ${launchSpeed.toFixed(2)} units/s`, 10, 75);

    context.fillStyle = '#FFFFFF';
    context.fillText(`Current Speed: ${currentSpeed.toFixed(2)} units/s`, 10, 95);
    context.fillText(`Altitude: ${altitude.toFixed(0)} px`, 10, 115);

    // Physics mode
    context.fillStyle = '#CCCCCC';
    context.font = '12px Arial';
    if (willEscape) {
        context.fillText('Mode: NO GRAVITY (Escape)', 10, 135);
    } else {
        context.fillText(`Mode: FREE FALL (g = ${gravity_accel.toFixed(2)})`, 10, 135);
    }

    // Status
    if (launchSpeed === 0) {
        context.fillStyle = '#FF6347';
        context.font = 'bold 24px Arial';
        context.fillText('✗ FALLING', 10, 170);
        context.font = '14px Arial';
        context.fillText('Zero launch speed → Immediate free fall', 10, 195);
    } else if (willEscape && altitude > 250) {
        context.fillStyle = '#00FF00';
        context.font = 'bold 24px Arial';
        context.fillText('✓ ESCAPED!', 10, 170);
        context.font = '14px Arial';
        context.fillText('Exiting frame, never returns!', 10, 195);
    } else if (willEscape) {
        context.fillStyle = '#00FF00';
        context.font = 'bold 24px Arial';
        context.fillText('ESCAPING...', 10, 170);
        context.font = '14px Arial';
        context.fillText('v ≥ v_esc → No gravity applied', 10, 195);
    } else if (!willEscape && projectile.velocity.y > 0 && altitude > 50) {
        context.fillStyle = '#FFA500';
        context.font = 'bold 24px Arial';
        context.fillText('FALLING BACK', 10, 170);
        context.font = '14px Arial';
        context.fillText('Free fall: v = u + gt', 10, 195);
    } else if (!willEscape) {
        context.fillStyle = '#FF6347';
        context.font = 'bold 24px Arial';
        context.fillText('✗ WILL RETURN', 10, 170);
        context.font = '14px Arial';
        context.fillText('v < v_esc → Free fall with gravity', 10, 195);
    }

    // Formula
    context.fillStyle = '#AAAAAA';
    context.font = 'italic 11px Arial';
    context.fillText('v_esc = √(2GM/R)', 10, 580);
    if (!willEscape) {
        context.fillText('Free fall: h = ut - ½gt²', 10, 595);
    }
});

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    createEscapeScenario(planetMass, planetRadius, launchSpeed);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createEscapeScenario(planetMass, planetRadius, launchSpeed);
}

// Control panel
function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #custom-control-panel {
            position: fixed;
            top: 80px;
            right: 20px;
            width: 320px;
            background-color: #202123;
            border: 1px solid #4D4D4F;
            border-radius: 8px;
            color: #ECECF1;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 1000;
            padding: 15px;
        }
        .simulation-container {
            margin-right: 340px !important;
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
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #10A37F;
            cursor: pointer;
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
            background: #2A2A2C;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            font-size: 11px;
        }
        #speed-indicator {
            margin-top: 5px;
            font-weight: bold;
            font-size: 13px;
        }
        .info-text {
            font-size: 11px;
            color: #999;
            margin-top: 3px;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">Escape Velocity</div>

        <div class="info-box">
            <strong>v<sub>esc</sub> = √(2GM/R)</strong><br>
            <span id="calc-escape">Required: ${escapeVelocity.toFixed(2)}</span>
        </div>

        <div class="control-group">
            <label>Planet Mass: <span class="value-display" id="pmass-value">${planetMass}</span></label>
            <input type="range" id="pmass-slider" min="50" max="200" step="10" value="${planetMass}">
            <div class="info-text">Higher mass → higher escape velocity</div>
        </div>

        <div class="control-group">
            <label>Planet Radius: <span class="value-display" id="pradius-value">${planetRadius}</span></label>
            <input type="range" id="pradius-slider" min="100" max="250" step="10" value="${planetRadius}">
            <div class="info-text">Larger radius → lower escape velocity</div>
        </div>

        <div class="control-group">
            <label>Launch Speed: <span class="value-display" id="speed-value">${launchSpeed.toFixed(1)}</span></label>
            <input type="range" id="speed-slider" min="0" max="60" step="0.5" value="${launchSpeed}">
            <div id="speed-indicator">Checking...</div>
        </div>

        <div class="control-group">
            <label>Gravity (G): <span class="value-display" id="g-value">${G}</span></label>
            <input type="range" id="g-slider" min="20" max="100" step="5" value="${G}">
            <div class="info-text">For escape velocity formula</div>
        </div>

        <div class="control-group">
            <label>Free Fall g: <span class="value-display" id="grav-value">${gravity_accel.toFixed(2)}</span></label>
            <input type="range" id="grav-slider" min="0.1" max="2" step="0.1" value="${gravity_accel}">
            <div class="info-text">Downward acceleration when v < v_esc</div>
        </div>
    `;

    document.body.appendChild(panel);
    attachControlListeners();
    updateSpeedIndicator();
}

function attachControlListeners() {
    document.getElementById('pmass-slider').addEventListener('input', function() {
        planetMass = parseFloat(this.value);
        document.getElementById('pmass-value').textContent = planetMass;
        updateEscapeVelocityDisplay();
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('pradius-slider').addEventListener('input', function() {
        planetRadius = parseFloat(this.value);
        document.getElementById('pradius-value').textContent = planetRadius;
        updateEscapeVelocityDisplay();
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('speed-slider').addEventListener('input', function() {
        launchSpeed = parseFloat(this.value);
        document.getElementById('speed-value').textContent = launchSpeed.toFixed(1);
        updateSpeedIndicator();
        resetparams();
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });

    document.getElementById('g-slider').addEventListener('input', function() {
        G = parseFloat(this.value);
        document.getElementById('g-value').textContent = G;
        updateEscapeVelocityDisplay();
    });

    document.getElementById('grav-slider').addEventListener('input', function() {
        gravity_accel = parseFloat(this.value);
        document.getElementById('grav-value').textContent = gravity_accel.toFixed(2);
    });
}

function updateEscapeVelocityDisplay() {
    escapeVelocity = Math.sqrt((2 * G * planetMass) / planetRadius);
    document.getElementById('calc-escape').textContent = `Required: ${escapeVelocity.toFixed(2)}`;
    updateSpeedIndicator();
}

function updateSpeedIndicator() {
    const indicator = document.getElementById('speed-indicator');
    const diff = launchSpeed - escapeVelocity;
    const percent = ((diff / escapeVelocity) * 100).toFixed(0);

    if (launchSpeed >= escapeVelocity) {
        indicator.textContent = `✓ WILL ESCAPE! (+${diff.toFixed(1)} / +${percent}%)`;
        indicator.style.color = '#00FF00';
    } else {
        indicator.textContent = `✗ FREE FALL (${diff.toFixed(1)} / ${percent}%)`;
        indicator.style.color = '#FF6347';
    }
}

function ResetGUI() {
    document.getElementById('pmass-slider').value = planetMass;
    document.getElementById('pradius-slider').value = planetRadius;
    document.getElementById('speed-slider').value = launchSpeed;
    document.getElementById('g-slider').value = G;
    document.getElementById('grav-slider').value = gravity_accel;

    document.getElementById('pmass-value').textContent = planetMass;
    document.getElementById('pradius-value').textContent = planetRadius;
    document.getElementById('speed-value').textContent = launchSpeed.toFixed(1);
    document.getElementById('g-value').textContent = G;
    document.getElementById('grav-value').textContent = gravity_accel.toFixed(2);

    updateEscapeVelocityDisplay();
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createEscapeScenario(planetMass, planetRadius, launchSpeed);
return {engine,runner};
}