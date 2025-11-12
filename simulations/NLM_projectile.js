// projectile.js - FINAL VERSION - Custom Control Panel with Velocity & Angle

//when reset, just the position is changing, im not putting stuff back to initial.
const defaultValues={
    height:100,
    velocity:14,
    angle:45

}

function startSimulation(parameters){

const {
  Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint,
  Constraint, Composite, Events,Body
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

// Global variables
let blockHeight = parameters?.blockHeight??defaultValues.height;

let velocity = parameters?.velocity??defaultValues.velocity;      // Overall velocity magnitude
let angle = parameters?.angle??defaultValues.angle;
angle=angle*Math.PI/180;
let xVelocity=velocity*Math.cos(angle);
let yVelocity=velocity*Math.sin(angle);      // Launch angle in degrees
let block, body;

// ground(common to questions with a ground-this exact code.)
const ground = Bodies.rectangle(400, 575, 800, 50, { isStatic: true,render:{ fillStyle: '#28ba3eff'}});

//height of the body from the ground. defined through a block.
const blockWidth = 60;

//circle parameters
const circleRadius = 20;

// Ground top edge
const groundTop = 550; // center - half height = 550

function projectileMotion(height, xVel, yVel){
    blockHeight = height;
    xVelocity = xVel;
    yVelocity = yVel;

    // Block center y
    let blockY = groundTop - blockHeight / 2;

    // Circle center y (on top of block)
    let circleY = blockY - blockHeight / 2 - circleRadius;

    // Create block
    block = Bodies.rectangle(100, blockY, blockWidth, blockHeight, {
        isStatic: true,
        render: { fillStyle: '#3d3dc1ff' }
    });

    body = Bodies.circle(100, circleY, 20,{restitution: 0.0, friction: 0.1, density: 0.004, render:{ fillStyle: '#f55a3c'}});

    Body.setVelocity(body, { x: xVelocity, y: yVelocity });

    Composite.add(world,[block,body, ground]);
}

// Function to calculate current physics parameters
function calculateCurrentParameters() {
    if (!body) return null;
    
    const currentTime = performance.now() / 1000; // Convert to seconds
    const gravity = 1; // Matter.js default gravity
    
    return {
        position: {
            x: body.position.x,
            y: body.position.y
        },
        velocity: {
            x: body.velocity.x,
            y: body.velocity.y,
            magnitude: Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y)
        },
        acceleration: {
            x: 0, // No horizontal acceleration
            y: gravity // Vertical acceleration due to gravity
        },
        time: currentTime,
        kineticEnergy: 0.5 * body.mass * (body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y)
    };
}

// Draw live information on canvas
Events.on(render, 'afterRender', function() {
    if (!body) return;
    
    const context = render.context;
    const params = calculateCurrentParameters();
    
    if (!params) return;
    
    // Draw live information panel
    const panelX = render.options.width - 250;
    const panelY = 80;
    const panelWidth = 230;
    const panelHeight = 150;
    
    // Panel background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Panel border
    context.strokeStyle = '#4D4D4F';
    context.lineWidth = 1;
    context.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Panel title
    context.fillStyle = '#10A37F';
    context.font = 'bold 14px Arial';
    context.textAlign = 'left';
    context.fillText('Live Projectile Data', panelX + 10, panelY + 20);
    
    // Panel content
    context.fillStyle = 'white';
    context.font = '12px Arial';
    context.fillText('Position: (' + params.position.x.toFixed(1) + ', ' + params.position.y.toFixed(1) + ')', panelX + 10, panelY + 40);
    context.fillText('Velocity: ' + params.velocity.magnitude.toFixed(2) + ' m/s', panelX + 10, panelY + 60);
    context.fillText('Vx: ' + params.velocity.x.toFixed(2) + ' m/s', panelX + 10, panelY + 80);
    context.fillText('Vy: ' + params.velocity.y.toFixed(2) + ' m/s', panelX + 10, panelY + 100);
    context.fillText('Kinetic Energy: ' + params.kineticEnergy.toFixed(3) + ' J', panelX + 10, panelY + 120);
});

function resetScene() {//for the reset button
    // Clear the world
    Runner.stop(runner);
    Matter.World.clear(engine.world, false); // keep the engine, just remove bodies
    // Recreate the scene
    projectileMotion(blockHeight, xVelocity, yVelocity);
    ResetGUI();
}

function resetparams(){//for the slider
    Runner.stop(runner);
    isPlaying=false;
    Matter.World.clear(engine.world, false); // keep the engine, just remove bodies
    // Recreate the scene
    projectileMotion(blockHeight, xVelocity, yVelocity);
}

// ======= CUSTOM CONTROL PANEL WITH VELOCITY & ANGLE =======

// Add custom control panel styles (matches your theme)
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
        
        .physics-info {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            margin-top: 15px;
            font-size: 11px;
        }
        
        .physics-info p {
            margin: 3px 0;
        }
    `;
    document.head.appendChild(style);
}

// Function to update velocity components from angle and speed
function updateVelocityComponents() {
    const radians = (angle * Math.PI) / 180; // Convert to radians
    xVelocity = velocity * Math.cos(radians);
    yVelocity = -velocity * Math.sin(radians); // Negative for upward motion in Matter.js
}

// Create custom control panel
function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <div class="control-group">
            <label>Initial Velocity (m/s)</label>
            <div class="slider-container">
                <input type="range" id="velocity-slider" min="1" max="30" step="0.5" value="${velocity}">
                <span class="slider-value" id="velocity-value">${velocity}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Launch Angle (degrees)</label>
            <div class="slider-container">
                <input type="range" id="angle-slider" min="0" max="90" step="1" value="${angle}">
                <span class="slider-value" id="angle-value">${angle}°</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Height of object from ground</label>
            <div class="slider-container">
                <input type="range" id="height-slider" min="0" max="500" step="0.1" value="${blockHeight}">
                <span class="slider-value" id="height-value">${blockHeight}</span>
            </div>
        </div>
        
        <div class="physics-info">
            <p><strong>Projectile Physics:</strong></p>
            <p>• Horizontal: x = v₀cos(θ)t</p>
            <p>• Vertical: y = v₀sin(θ)t - ½gt²</p>
            <p>• Vx = v₀cos(θ) (constant)</p>
            <p>• Vy = v₀sin(θ) - gt (changing)</p>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners
    const velocitySlider = document.getElementById('velocity-slider');
    const velocityValue = document.getElementById('velocity-value');
    velocitySlider.addEventListener('input', function() {
        velocity = parseFloat(this.value);
        velocityValue.textContent = velocity;
        updateVelocityComponents(); // Calculate new x,y velocities
        resetparams();
        playPauseBtn.innerHTML = '▶';
        console.log("velocity changed to:", velocity);
    });
    
    const angleSlider = document.getElementById('angle-slider');
    const angleValue = document.getElementById('angle-value');
    angleSlider.addEventListener('input', function() {
        angle = parseFloat(this.value);
        angleValue.textContent = angle + '°';
        updateVelocityComponents(); // Calculate new x,y velocities
        resetparams();
        playPauseBtn.innerHTML = '▶';
        console.log("angle changed to:", angle);
    });
    
    const heightSlider = document.getElementById('height-slider');
    const heightValue = document.getElementById('height-value');
    heightSlider.addEventListener('input', function() {
        blockHeight = parseFloat(this.value);
        heightValue.textContent = blockHeight;
        resetparams();
        playPauseBtn.innerHTML = '▶';
        console.log("height changed");
    });
}

function ResetGUI() {
    // Update the custom control panel values
    document.getElementById('velocity-slider').value = velocity;
    document.getElementById('angle-slider').value = angle;
    document.getElementById('height-slider').value = blockHeight;
    document.getElementById('velocity-value').textContent = velocity;
    document.getElementById('angle-value').textContent = angle + '°';
    document.getElementById('height-value').textContent = blockHeight;
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
updateVelocityComponents(); // Calculate initial x,y velocities from angle and speed
projectileMotion(100, xVelocity, yVelocity);
return {engine,runner};
}
//change the behavior on reset
//when increasing the height of the body, the y position must increase also , the block must be replaced with a different block of different height