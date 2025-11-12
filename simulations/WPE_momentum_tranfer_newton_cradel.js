// newtons_cradle.js - Newton's Cradle with Custom Control Panel
const defaultValues={
    ballCount: 5,
    ballSize: 30,
    stringLength: 200,
    ballSpacing: 1.9
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
    let ballCount = parameters?.ballCount ?? defaultValues.ballCount;
    let ballSize = parameters?.ballSize ?? defaultValues.ballSize;
    let stringLength = parameters?.stringLength ?? defaultValues.stringLength;
    let ballSpacing = parameters?.ballSpacing ?? defaultValues.ballSpacing;
let cradle, balls = [], strings = [];

function newtonsCradle(count, size, length, spacing) {
    ballCount = count;
    ballSize = size;
    stringLength = length;
    ballSpacing = spacing;
    balls = [];
    strings = [];

    // Calculate starting position to center the cradle
    const startX = 400 - ((ballCount - 1) * (ballSize * ballSpacing)) / 2;
    const startY = 100;

    // Create Newton's Cradle setup
    for (let i = 0; i < ballCount; i++) {
        const ballX = startX + i * (ballSize * ballSpacing);
        const ballY = startY + stringLength;

        // Create ball with EXACT same properties as your reference
        const ball = Bodies.circle(ballX, ballY, ballSize, {
            inertia: Infinity,    // EXACT: Prevents rotation
            restitution: 1,       // EXACT: Perfect bounce
            friction: 0,          // EXACT: No friction  
            frictionAir: 0,       // EXACT: No air resistance
            slop: ballSize * 0.02, // EXACT: Collision tolerance
            render: {
                fillStyle: '#E74C3C',
                strokeStyle: '#C0392B',
                lineWidth: 2
            }
        });

        // Create string constraint - EXACT same setup
        const constraint = Constraint.create({
            pointA: { x: ballX, y: startY },  // Fixed point at top
            bodyB: ball,                      // Connected to ball
            length: stringLength,             // String length
            stiffness: 1,                     // Rigid string
            render: {
                visible: true,
                strokeStyle: '#FFFFFF',
                lineWidth: 2
            }
        });

        balls.push(ball);
        strings.push(constraint);
    }

    // Add all bodies and constraints to world
    Composite.add(world, balls);
    Composite.add(world, strings);

    // Give the first ball initial momentum to start the motion
    // EXACT same displacement as your reference
    Body.translate(balls[0], { x: -150, y: -80 });

    // Standard boundaries (but cradle won't hit them normally)
    const ground = Bodies.rectangle(400, 575, 800, 50, {
        isStatic: true,
        render: { fillStyle: '#28ba3eff'}
    });

    Composite.add(world, ground);

    // Set gravity (Newton's cradle needs gravity)
    engine.world.gravity.y = 1;
}

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    newtonsCradle(ballCount, ballSize, stringLength, ballSpacing);
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    newtonsCradle(ballCount, ballSize, stringLength, ballSpacing);
}

// ======= CUSTOM CONTROL PANEL =======

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
            margin-right: 360px !important;
        }
        
        .control-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #10A37F;
        }
        
        .physics-section {
            margin-bottom: 18px;
            padding: 12px;
            background-color: #343541;
            border-radius: 6px;
            border-left: 3px solid #10A37F;
        }
        
        .physics-section h4 {
            margin: 0 0 12px 0;
            font-size: 13px;
            color: #ECECF1;
            font-weight: 600;
        }
        
        .control-group {
            margin-bottom: 14px;
        }
        
        .control-group label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: #B0B0B0;
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
            min-width: 50px;
            text-align: center;
            background-color: #2A2B32;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            color: #10A37F;
        }
        
        .physics-note {
            background-color: #2A2B32;
            padding: 10px;
            border-radius: 6px;
            margin-top: 15px;
            font-size: 11px;
            color: #8E8EA0;
            border-left: 3px solid #10A37F;
        }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <div class="control-title">⚪ Newton's Cradle</div>
        
        <div class="physics-section">
            <h4>🔴 Ball Configuration</h4>
            <div class="control-group">
                <label>Number of Balls</label>
                <div class="slider-container">
                    <input type="range" id="count-slider" min="3" max="8" step="1" value="${ballCount}">
                    <span class="slider-value" id="count-value">${ballCount}</span>
                </div>
            </div>
            <div class="control-group">
                <label>Ball Size</label>
                <div class="slider-container">
                    <input type="range" id="size-slider" min="15" max="50" step="1" value="${ballSize}">
                    <span class="slider-value" id="size-value">${ballSize}px</span>
                </div>
            </div>
            <div class="control-group">
                <label>Ball Spacing</label>
                <div class="slider-container">
                    <input type="range" id="spacing-slider" min="1.5" max="2.5" step="0.1" value="${ballSpacing}">
                    <span class="slider-value" id="spacing-value">${ballSpacing}</span>
                </div>
            </div>
        </div>
        
        <div class="physics-section">
            <h4>🔗 String Properties</h4>
            <div class="control-group">
                <label>String Length</label>
                <div class="slider-container">
                    <input type="range" id="length-slider" min="150" max="300" step="10" value="${stringLength}">
                    <span class="slider-value" id="length-value">${stringLength}px</span>
                </div>
            </div>
        </div>
        
        <div class="physics-note">
            <strong>Newton's Cradle Physics:</strong><br>
            • Perfect momentum & energy conservation<br>
            • Inertia: Infinity (no rotation)<br>
            • Restitution: 1.0 (perfect bounce)<br>
            • No friction or air resistance
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners
    document.getElementById('count-slider').addEventListener('input', function() {
        ballCount = parseInt(this.value);
        document.getElementById('count-value').textContent = ballCount;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('size-slider').addEventListener('input', function() {
        ballSize = parseInt(this.value);
        document.getElementById('size-value').textContent = ballSize + 'px';
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('spacing-slider').addEventListener('input', function() {
        ballSpacing = parseFloat(this.value);
        document.getElementById('spacing-value').textContent = ballSpacing;
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('length-slider').addEventListener('input', function() {
        stringLength = parseInt(this.value);
        document.getElementById('length-value').textContent = stringLength + 'px';
        resetparams();
        if (playPauseBtn) playPauseBtn.innerHTML = '▶';
    });
}

function ResetGUI() {
    document.getElementById('count-slider').value = ballCount;
    document.getElementById('size-slider').value = ballSize;
    document.getElementById('spacing-slider').value = ballSpacing;
    document.getElementById('length-slider').value = stringLength;
    
    document.getElementById('count-value').textContent = ballCount;
    document.getElementById('size-value').textContent = ballSize + 'px';
    document.getElementById('spacing-value').textContent = ballSpacing;
    document.getElementById('length-value').textContent = stringLength + 'px';
}

function loadFromJSON(jsonData) {
    if (jsonData.simulation === "newtons_cradle") {
        ballCount = jsonData.parameters.ball_count || ballCount;
        ballSize = jsonData.parameters.ball_size || ballSize;
        stringLength = jsonData.parameters.string_length || stringLength;
        ballSpacing = jsonData.parameters.ball_spacing || ballSpacing;
        
        resetparams();
        ResetGUI();
    }
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
newtonsCradle(5, 30, 200, 1.9); // Exactly like your reference

window.resetScene = resetScene;
window.loadSimulationFromJSON = loadFromJSON;
return {engine,runner};
}
