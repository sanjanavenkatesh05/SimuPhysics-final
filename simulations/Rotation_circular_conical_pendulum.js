// conical_pendulum.js - Conical Pendulum with Oval Motion Path
const defaultValues={
ellipseA: 100, // Semi-major axis
ellipseB: 60, 
ballRadius: 15,
angularVelocity :0.03
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
    let ellipseA = parameters?.ellipseA ?? defaultValues.ellipseA;
    let ellipseB = parameters?.ellipseB ?? defaultValues.ellipseB;
    let ballRadius = parameters?.ballRadius ?? defaultValues.ballRadius;
    let angularVelocity = parameters?.angularVelocity ?? defaultValues.angularVelocity;
let pendulumBall, pendulumConstraint;
let pivotX = 400;
let pivotY = 100; // Moved pivot point higher above the ellipse
let pendulumLength = 150;
 // Angular velocity for circular motion
let currentAngle = 0;
 // Semi-minor axis
let ellipseCenterX = 400; // Center of the ellipse path
let ellipseCenterY = 250; // Center of the ellipse path (lower than pivot)
let trailParticles = [];
const MAX_TRAIL_PARTICLES = 150;
const TRAIL_LIFETIME = 90;

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
        ctx.fillStyle = `rgba(52, 152, 219, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createConicalPendulum() {
    // Calculate initial position on the ellipse
    let ballX = ellipseCenterX + ellipseA * Math.cos(currentAngle);
    let ballY = ellipseCenterY + ellipseB * Math.sin(currentAngle);

    // Create the pendulum ball
    pendulumBall = Bodies.circle(ballX, ballY, ballRadius, {
        isStatic: true, // Make static so we can manually control its position
        render: { fillStyle: '#e74c3c' }
    });

    // Create the constraint (pendulum string) - this will be updated each frame
    pendulumConstraint = Constraint.create({
        pointA: { x: pivotX, y: pivotY },
        bodyB: pendulumBall,
        length: pendulumLength,
        stiffness: 1,
        render: { strokeStyle: '#f39c12', lineWidth: 2 }
    });

    // Add the pendulum ball and constraint to the world
    Composite.add(world, [pendulumBall, pendulumConstraint]);
    
    // Setup motion
    if (window.motionHandler) {
        Events.off(engine, 'beforeUpdate', window.motionHandler);
    }
    
    window.motionHandler = function() {
        currentAngle += angularVelocity;
        
        // Calculate new position on ellipse
        let newX = ellipseCenterX + ellipseA * Math.cos(currentAngle);
        let newY = ellipseCenterY + ellipseB * Math.sin(currentAngle);
        
        // Update ball position
        Body.setPosition(pendulumBall, { x: newX, y: newY });
        
        // Update constraint attachment point to maintain visual connection
        pendulumConstraint.pointA = { x: pivotX, y: pivotY };
        
        // Add trail particle
        trailParticles.push(new TrailParticle(newX, newY, TRAIL_LIFETIME));
        
        // Limit trail particles
        if (trailParticles.length > MAX_TRAIL_PARTICLES) {
            trailParticles.shift();
        }
    };
    
    Events.on(engine, 'beforeUpdate', window.motionHandler);
}

// Function to draw trail particles
function drawTrail() {
    const ctx = render.context;
    
    // Update and draw trail particles
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const particle = trailParticles[i];
        if (!particle.update()) {
            trailParticles.splice(i, 1);
        } else {
            particle.draw(ctx);
        }
    }
    
    // Draw the ellipse path
    ctx.strokeStyle = 'rgba(127, 140, 141, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.ellipse(ellipseCenterX, ellipseCenterY, ellipseA, ellipseB, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw the pivot point
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw a small highlight to make it look more like a pivot
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 3, 0, Math.PI * 2);
    ctx.fill();
}

function resetScene() {
    Runner.stop(runner);
    World.clear(world);
    if (window.motionHandler) {
        Events.off(engine, 'beforeUpdate', window.motionHandler);
    }
    trailParticles = [];
    createConicalPendulum();
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    World.clear(world);
    if (window.motionHandler) {
        Events.off(engine, 'beforeUpdate', window.motionHandler);
    }
    trailParticles = [];
    createConicalPendulum();
}

// Control Panel Styles
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
    `;
    document.head.appendChild(style);
}

// Create Control Panel
function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <div class="control-group">
            <label>Ellipse Semi-Major Axis (a)</label>
            <div class="slider-container">
                <input type="range" id="axis-a-slider" min="50" max="200" step="5" value="${ellipseA}">
                <span class="slider-value" id="axis-a-value">${ellipseA}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Ellipse Semi-Minor Axis (b)</label>
            <div class="slider-container">
                <input type="range" id="axis-b-slider" min="30" max="150" step="5" value="${ellipseB}">
                <span class="slider-value" id="axis-b-value">${ellipseB}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Angular Velocity (ω)</label>
            <div class="slider-container">
                <input type="range" id="omega-slider" min="0.01" max="0.1" step="0.005" value="${angularVelocity}">
                <span class="slider-value" id="omega-value">${angularVelocity.toFixed(3)}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Ball Size</label>
            <div class="slider-container">
                <input type="range" id="size-slider" min="5" max="25" step="1" value="${ballRadius}">
                <span class="slider-value" id="size-value">${ballRadius}</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners
    document.getElementById('axis-a-slider').addEventListener('input', function() {
        ellipseA = parseFloat(this.value);
        document.getElementById('axis-a-value').textContent = ellipseA;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('axis-b-slider').addEventListener('input', function() {
        ellipseB = parseFloat(this.value);
        document.getElementById('axis-b-value').textContent = ellipseB;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('omega-slider').addEventListener('input', function() {
        angularVelocity = parseFloat(this.value);
        document.getElementById('omega-value').textContent = angularVelocity.toFixed(3);
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('size-slider').addEventListener('input', function() {
        ballRadius = parseFloat(this.value);
        document.getElementById('size-value').textContent = ballRadius;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
}

function ResetGUI() {
    document.getElementById('axis-a-slider').value = ellipseA;
    document.getElementById('axis-b-slider').value = ellipseB;
    document.getElementById('omega-slider').value = angularVelocity;
    document.getElementById('size-slider').value = ballRadius;
    
    document.getElementById('axis-a-value').textContent = ellipseA;
    document.getElementById('axis-b-value').textContent = ellipseB;
    document.getElementById('omega-value').textContent = angularVelocity.toFixed(3);
    document.getElementById('size-value').textContent = ballRadius;
}

// Hook into the Matter.js render loop to draw trail
Events.on(render, 'afterRender', function() {
    drawTrail();
});

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createConicalPendulum();
return {engine,runner};
}
