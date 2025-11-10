// pendulum.js - Your original code with NO air resistance, longer swinging
const defaultValues = {
    pendulumLength: 200,
    initialAngle: Math.PI / 6
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
let pendulumLength = parameters?.pendulumLength ?? defaultValues.pendulumLength;
    let initialAngle = parameters?.initialAngle ?? defaultValues.initialAngle;
    
// Global variables
let pendulumBall, pendulumConstraint;
let pivotX = 400;
let pivotY = 230;

let ballRadius = 25;

// Initial angle in radians (30 degrees)


function createPendulum() {
    // Calculate initial position of the ball based on the angle
    let ballX = pivotX + pendulumLength * Math.sin(initialAngle);
    let ballY = pivotY + pendulumLength * Math.cos(initialAngle);

    // Create the pendulum ball - MINIMAL FRICTION FOR LONGER SWING
    pendulumBall = Matter.Bodies.circle(ballX, ballY, ballRadius, {
        restitution: 1.0,        // Perfect bounce
        friction: 0.0001,        // Almost no friction
        frictionAir: 0.0001,     // Almost no air resistance
        render: { fillStyle: '#f55a3c' }
    });

    // Create the constraint (pendulum string)
    pendulumConstraint = Matter.Constraint.create({
        pointA: { x: pivotX, y: pivotY },
        bodyB: pendulumBall,
        length: pendulumLength,
        stiffness: 1,
        render: { strokeStyle: '#ffffff' }
    });

    // Add the pendulum ball and constraint to the world
    Matter.Composite.add(world, [pendulumBall, pendulumConstraint]);

    // Add ground
    const ground = Matter.Bodies.rectangle(400, 575, 800, 50, {
        isStatic: true,
        render: { fillStyle: '#28ba3eff' }
    });
    Matter.Composite.add(world, ground);

    // Add mouse control
    var mouse = Matter.Mouse.create(render.canvas),
        mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });
    Matter.Composite.add(world, mouseConstraint);

    // keep the mouse in sync with rendering
    render.mouse = mouse;
}

function resetScene() {
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    createPendulum();
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    createPendulum();
}

// ======= CUSTOM CONTROL PANEL =======

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
        
        .control-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #10A37F;
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
            min-width: 45px;
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

function createCustomControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'custom-control-panel';
    controlPanel.innerHTML = `
        <div class="control-title">Pendulum Controls</div>
        
        <div class="control-group">
            <label>Initial Angle (degrees)</label>
            <div class="slider-container">
                <input type="range" id="angle-slider" min="-90" max="90" step="1" value="${initialAngle * 180 / Math.PI}">
                <span class="slider-value" id="angle-value">${Math.round(initialAngle * 180 / Math.PI)}°</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Pendulum Length</label>
            <div class="slider-container">
                <input type="range" id="length-slider" min="50" max="300" step="1" value="${pendulumLength}">
                <span class="slider-value" id="length-value">${pendulumLength}</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners
    const angleSlider = document.getElementById('angle-slider');
    const angleValue = document.getElementById('angle-value');
    angleSlider.addEventListener('input', function() {
        initialAngle = parseFloat(this.value) * Math.PI / 180;
        angleValue.textContent = this.value + '°';
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    const lengthSlider = document.getElementById('length-slider');
    const lengthValue = document.getElementById('length-value');
    lengthSlider.addEventListener('input', function() {
        pendulumLength = parseFloat(this.value);
        lengthValue.textContent = pendulumLength;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
}

function ResetGUI() {
    document.getElementById('angle-slider').value = initialAngle * 180 / Math.PI;
    document.getElementById('length-slider').value = pendulumLength;
    document.getElementById('angle-value').textContent = Math.round(initialAngle * 180 / Math.PI) + '°';
    document.getElementById('length-value').textContent = pendulumLength;
}

function loadFromJSON(jsonData) {
    if (jsonData.simulation === "pendulum") {
        initialAngle = (jsonData.parameters.angle || 30) * Math.PI / 180;
        pendulumLength = jsonData.parameters.length || pendulumLength;
        resetparams();
        ResetGUI();
    }
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();
createPendulum();

window.resetScene = resetScene;
window.loadSimulationFromJSON = loadFromJSON;
return {engine,runner};
}
