// rolling_ball.js - Rolling Ball Simulation with Cycloid Tracing
const defaultValues={
    ballRadius: 30,
    ballSpeed: 5,
    MAX_TRAIL_POINTS: 300
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
    let ballRadius = parameters?.ballRadius ?? defaultValues.ballRadius;
    let ballSpeed = parameters?.ballSpeed ?? defaultValues.ballSpeed;
    let MAX_TRAIL_POINTS = parameters?.MAX_TRAIL_POINTS ?? defaultValues.MAX_TRAIL_POINTS;
let ball;
let trailPoints = [];
let tracerPointAngle = 0;

// Ground top edge
const groundTop = 550; // center - half height = 550

function rollingBallMotion(radius, speed) {
    ballRadius = radius;
    ballSpeed = speed;
    trailPoints = []; // Reset trail points
    
    // Remove any existing bodies
    Matter.Composite.allBodies(world).forEach(body => {
        Matter.Composite.remove(world, body);
    });
    
    // Create ground (using the existing ground from other simulations)
    const ground = Matter.Bodies.rectangle(400, 575, 800, 50, { 
        isStatic: true, 
        render: { fillStyle: '#28ba3eff' },
        friction: 0,
        frictionStatic: 0,
        restitution: 0
    });

    // Ball center y (on top of ground)
    let ballY = groundTop - ballRadius;

    // Create ball with no friction or resistance
    ball = Matter.Bodies.circle(100, ballY, ballRadius, {
        restitution: 0, 
        friction: 0, 
        frictionStatic: 0,
        frictionAir: 0,
        density: 0.004, 
        render: { fillStyle: '#f55a3c' }
    });

    // Set initial velocity for constant motion
    Matter.Body.setVelocity(ball, { x: ballSpeed, y: 0 });
    
    // Set angular velocity for rolling without slipping
    // For rolling without slipping: angular velocity = linear velocity / radius
    Matter.Body.setAngularVelocity(ball, ballSpeed / ballRadius);

    Matter.Composite.add(world, [ball, ground]);
    
    // Add continuous motion logic to maintain constant velocity
    Matter.Events.on(engine, 'beforeUpdate', function() {
        if (ball) {
            // Maintain constant horizontal velocity
            Matter.Body.setVelocity(ball, { x: ballSpeed, y: 0 });
            // Maintain proper angular velocity for rolling without slipping
            Matter.Body.setAngularVelocity(ball, ballSpeed / ballRadius);
        }
    });
    
    // Add continuous motion logic for wrapping around and trail tracking
    Matter.Events.on(engine, 'afterUpdate', function() {
        if (ball) {
            // Wrap around when ball goes off screen
            if (ball.position.x > 900) {
                Matter.Body.setPosition(ball, { x: -50, y: ballY });
                trailPoints = []; // Clear trail when wrapping around
            }
            
            // Calculate tracer point position (a point on the rim of the ball)
            const angle = ball.angle;
            const tracerX = ball.position.x + ballRadius * Math.cos(angle);
            const tracerY = ball.position.y + ballRadius * Math.sin(angle);
            
            // Add point to trail
            trailPoints.push({ x: tracerX, y: tracerY });
            
            // Limit trail points
            if (trailPoints.length > MAX_TRAIL_POINTS) {
                trailPoints.shift();
            }
        }
    });
}

// Custom rendering function for the cycloid trail
function renderTrail() {
    if (!render || !render.context || trailPoints.length < 2) return;
    
    const ctx = render.context;
    
    // Draw the cycloid trail
    ctx.beginPath();
    ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
    
    for (let i = 1; i < trailPoints.length; i++) {
        ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
    }
    
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw trail points
    for (let i = 0; i < trailPoints.length; i++) {
        const point = trailPoints[i];
        const age = i / trailPoints.length;
        ctx.fillStyle = `rgba(52, 152, 219, ${0.3 + age * 0.7})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw tracer point (the current point on the rim)
    if (ball && trailPoints.length > 0) {
        const currentPoint = trailPoints[trailPoints.length - 1];
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Add custom rendering after each frame
Matter.Events.on(render, 'afterRender', function() {
    renderTrail();
});

function resetScene() { // for the reset button
    // Clear the world
    Matter.Runner.stop(runner);
    isPlaying = false; // Reset play state
    Matter.World.clear(engine.world, false); // keep the engine, just remove bodies
    // Clear event handlers to prevent duplicates
    Matter.Events.off(engine, 'beforeUpdate');
    Matter.Events.off(engine, 'afterUpdate');
    // Recreate the scene
    rollingBallMotion(ballRadius, ballSpeed);
    ResetGUI();
    // Reset play button to paused state
    if (typeof playPauseBtn !== 'undefined') {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

function resetparams() { // for the slider
    Matter.Runner.stop(runner);
    isPlaying = false; // Reset play state
    // Clear event handlers to prevent duplicates
    Matter.Events.off(engine, 'beforeUpdate');
    Matter.Events.off(engine, 'afterUpdate');
    rollingBallMotion(ballRadius, ballSpeed);
    // Reset play button to paused state
    if (typeof playPauseBtn !== 'undefined') {
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

// ======= CUSTOM CONTROL PANEL =======

// Add custom control panel styles (matches your theme)
function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #rolling-control-panel {
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
        
        .cycloid-info {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            margin-top: 15px;
            font-size: 12px;
        }
        
        .cycloid-info p {
            margin: 5px 0;
        }
    `;
    document.head.appendChild(style);
}

// Create custom control panel
function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'rolling-control-panel';
    controlPanel.innerHTML = `
        <div class="control-group">
            <label>Trail Length</label>
            <div class="slider-container">
                <input type="range" id="trail-slider" min="50" max="500" step="10" value="${MAX_TRAIL_POINTS}">
                <span class="slider-value" id="trail-value">${MAX_TRAIL_POINTS}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Ball Speed</label>
            <div class="slider-container">
                <input type="range" id="speed-slider" min="1" max="20" step="0.5" value="${ballSpeed}">
                <span class="slider-value" id="speed-value">${ballSpeed}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Ball Radius</label>
            <div class="slider-container">
                <input type="range" id="radius-slider" min="10" max="50" step="1" value="${ballRadius}">
                <span class="slider-value" id="radius-value">${ballRadius}</span>
            </div>
        </div>
        
        <div class="cycloid-info">
            <p><strong>Cycloid Path:</strong></p>
            <p>• Yellow dot traces the path</p>
            <p>• Blue trail shows the curve</p>
            <p>• Used in gear designs</p>
            <p>• Area = 3 × circle area</p>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners
    const trailSlider = document.getElementById('trail-slider');
    const trailValue = document.getElementById('trail-value');
    trailSlider.addEventListener('input', function() {
        const newMax = parseInt(this.value);
        trailValue.textContent = newMax;
        // Adjust the trail points array if needed
        if (trailPoints.length > newMax) {
            trailPoints = trailPoints.slice(-newMax);
        }
    });
    
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    speedSlider.addEventListener('input', function() {
        ballSpeed = parseFloat(this.value);
        speedValue.textContent = ballSpeed;
        // Update the ball's velocity immediately
        if (ball) {
            Matter.Body.setVelocity(ball, { x: ballSpeed, y: 0 });
            Matter.Body.setAngularVelocity(ball, ballSpeed / ballRadius);
        }
        resetparams(); // Reset simulation when control changes
        // Reset play button to paused state
        if (typeof playPauseBtn !== 'undefined') {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
        console.log("speed changed to:", ballSpeed);
    });
    
    const radiusSlider = document.getElementById('radius-slider');
    const radiusValue = document.getElementById('radius-value');
    radiusSlider.addEventListener('input', function() {
        ballRadius = parseFloat(this.value);
        radiusValue.textContent = ballRadius;
        resetparams(); // Reset simulation when control changes
        // Reset play button to paused state
        if (typeof playPauseBtn !== 'undefined') {
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
        console.log("radius changed to:", ballRadius);
    });
}

function ResetGUI() {
    // Reset trail points
    trailPoints = [];
    
    // Update the custom control panel values
    document.getElementById('trail-slider').value = MAX_TRAIL_POINTS;
    document.getElementById('speed-slider').value = ballSpeed;
    document.getElementById('radius-slider').value = ballRadius;
    document.getElementById('trail-value').textContent = MAX_TRAIL_POINTS;
    document.getElementById('speed-value').textContent = ballSpeed;
    document.getElementById('radius-value').textContent = ballRadius;
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
rollingBallMotion(ballRadius, ballSpeed); // Initialize with default parameters

// Export functions for global access
window.resetScene = resetScene;
window.resetparams = resetparams;

// Override wireframes setting
render.options.wireframes = false;
return {engine,runner};
}
