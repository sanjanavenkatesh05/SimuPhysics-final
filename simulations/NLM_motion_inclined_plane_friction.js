// motion_inclined_plane.js - EXACT ORIGINAL CODE + Custom Control Panel

// Uses worldcreation.js for Matter.js setup
const defaultValues={
    friction: 0.3,
    appliedForce: 0,
    // forceAngle: 0,  // Removed force angle
    planeAngle: 30,
    blockSize: 25
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

    let friction = parameters?.friction ?? defaultValues.friction;
    let appliedForce = parameters?.appliedForce ?? defaultValues.appliedForce;
    // let forceAngle = parameters?.forceAngle ?? defaultValues.forceAngle;  // Removed force angle
    let planeAngle = parameters?.planeAngle ?? defaultValues.planeAngle;
    let blockSize = parameters?.blockSize ?? defaultValues.blockSize;
    
// Enable gravity
engine.world.gravity.y = 1;

// Global variables
let block, inclinedPlane;

let gravity = 1;
let blockMass = 10;

// Convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function motionInclinedPlane(frictionCoeff, force, gravityConstant, inclineAngle, blockSizeParam) {
    friction = frictionCoeff;
    appliedForce = force;
    // forceAngle = forceAngleDeg;  // Removed force angle
    gravity = gravityConstant;
    planeAngle = inclineAngle;
    blockSize = blockSizeParam;

    // Set gravity
    engine.world.gravity.y = gravity;

    // Create green ground just below the triangle base like in projectile simulation
    const ground = Bodies.rectangle(400, 575, 800, 50, {
        isStatic: true,
        render: { fillStyle: '#28ba3eff'} // Same green as projectile
    });

    // Calculate triangle dimensions with fixed base line position
    const groundTop = 550; // Top surface of the green ground
    const fixedBaseY = groundTop; // Position triangle base exactly at the green ground surface level
    const fixedHeight = 300; // Fixed height for the triangle
    const baseWidth = fixedHeight / Math.tan(toRadians(planeAngle)); // Calculate base width based on angle
    const height = fixedHeight; // Use fixed height

    // Create right-angled triangle using vertices
    // Triangle base positioned directly on the green ground surface
    const triangleVertices = [
        { x: 0, y: 0 }, // Bottom left (on ground)
        { x: baseWidth, y: 0 }, // Bottom right (on ground)
        { x: 0, y: -height } // Top left (limited height)
    ];

    // Create inclined plane as triangle with base at the same level as ground surface
    inclinedPlane = Bodies.fromVertices(250, fixedBaseY - height/2, [triangleVertices], {
        isStatic: true,
        friction: friction,
        render: {
            fillStyle: 'rgba(135, 206, 250, 0.6)', // light blue transparent
            strokeStyle: '#87CEEB',
            lineWidth: 2
        }
    });

    // Position block at the height of the perpendicular above the fixed base line
    const blockX = 200; // 120px right of the triangle base (which starts at x=0)
    const blockY = fixedBaseY - height; // At the height of the perpendicular above fixed base line

    // Create block at the height of the perpendicular with base parallel to inclined plane
    block = Bodies.rectangle(blockX, blockY, blockSize, blockSize, {
        mass: blockMass,
        friction: friction,
        frictionAir: 0.01,
        inertia: Infinity, // Prevent rotation while allowing linear movement
        angle: toRadians(planeAngle), // Rotate block to match inclined plane angle
        render: {
            fillStyle: '#ff6b35', // orange block
            strokeStyle: '#cc5429',
            lineWidth: 2
        }
    });

    // Add bodies to world (including green ground)
    World.add(world, [ground, inclinedPlane, block]);

    // Don't apply external force immediately - let user control it through play button
    // Only apply force when the simulation is playing
    Events.on(engine, 'beforeUpdate', function() {
        // Use the global isPlaying variable from script.js
        if (typeof isPlaying !== 'undefined' && isPlaying && appliedForce > 0 && block) {
            applyExternalForce();
        }
    });
    
    // Add rendering event for live screen updates
    Events.on(render, 'afterRender', function() {
        // Live screen updates will happen automatically through Matter.js rendering
    });
}

function applyExternalForce() {
    if (block && appliedForce > 0) {
        // Apply force in the horizontal direction (along x-axis)
        const forceX = appliedForce * 0.0005; // Adjusted multiplier for horizontal force
        const forceY = 0; // No vertical component
        Body.applyForce(block, block.position, { x: forceX, y: forceY });
    }
}

function resetScene() {
    isPlaying = false;
    Runner.stop(runner);
    Matter.World.clear(engine.world, false);
    // Reset force application events
    Events.off(engine, 'beforeUpdate');
    Events.off(render, 'afterRender');
    // Recreate simulation
    motionInclinedPlane(friction, appliedForce, gravity, planeAngle, blockSize);
    ResetGUI();
    // Update play button
    if (typeof playPauseBtn !== 'undefined') {
        playPauseBtn.innerHTML = '▶';
    }
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    Matter.World.clear(engine.world, false);
    // Reset force application events
    Events.off(engine, 'beforeUpdate');
    Events.off(render, 'afterRender');
    // Recreate simulation with new parameters
    motionInclinedPlane(friction, appliedForce, gravity, planeAngle, blockSize);
    // Update play button
    if (typeof playPauseBtn !== 'undefined') {
        playPauseBtn.innerHTML = '▶';
    }
}

// ======= REPLACE LIL.GUI WITH CUSTOM CONTROL PANEL =======

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
        }
        
        .simulation-container {
            margin-right: 340px !important;
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
            min-width: 50px;
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
        <div class="control-title">Inclined Plane Controls</div>
        
        <div class="control-group">
            <label>Friction of Surface</label>
            <div class="slider-container">
                <input type="range" id="friction-slider" min="0" max="1" step="0.01" value="${friction}">
                <span class="slider-value" id="friction-value">${friction}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Applied Force Magnitude</label>
            <div class="slider-container">
                <input type="range" id="force-slider" min="0" max="10" step="0.1" value="${appliedForce}">
                <span class="slider-value" id="force-value">${appliedForce}</span>
            </div>
        </div>
        
        <!-- Removed Force Angle control -->
        
        <div class="control-group">
            <label>Incline Angle (degrees)</label>
            <div class="slider-container">
                <input type="range" id="plane-slider" min="10" max="60" step="1" value="${planeAngle}">
                <span class="slider-value" id="plane-value">${planeAngle}°</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Block Size</label>
            <div class="slider-container">
                <input type="range" id="size-slider" min="15" max="50" step="1" value="${blockSize}">
                <span class="slider-value" id="size-value">${blockSize}</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // EXACT EVENT LISTENERS FROM YOUR ORIGINAL lil.GUI CODE
    document.getElementById('friction-slider').addEventListener('input', function() {
        friction = parseFloat(this.value);
        document.getElementById('friction-value').textContent = friction;
        resetparams();
        if (typeof playPauseBtn !== 'undefined') {
            playPauseBtn.innerHTML = '▶';
        }
        console.log("friction changed");
    });
    
    document.getElementById('force-slider').addEventListener('input', function() {
        appliedForce = parseFloat(this.value);
        document.getElementById('force-value').textContent = appliedForce;
        resetparams(); // Reset when force changes
        if (typeof playPauseBtn !== 'undefined') {
            playPauseBtn.innerHTML = '▶';
        }
        console.log("applied force changed");
    });
    
    // Removed force angle event listener
    
    document.getElementById('plane-slider').addEventListener('input', function() {
        planeAngle = parseFloat(this.value);
        document.getElementById('plane-value').textContent = planeAngle + '°';
        resetparams();
        if (typeof playPauseBtn !== 'undefined') {
            playPauseBtn.innerHTML = '▶';
        }
        console.log("plane angle changed");
    });
    
    document.getElementById('size-slider').addEventListener('input', function() {
        blockSize = parseFloat(this.value);
        document.getElementById('size-value').textContent = blockSize;
        resetparams();
        if (typeof playPauseBtn !== 'undefined') {
            playPauseBtn.innerHTML = '▶';
        }
        console.log("block size changed");
    });

}

function ResetGUI() {
    document.getElementById('friction-slider').value = friction;
    document.getElementById('force-slider').value = appliedForce;
    // document.getElementById('angle-slider').value = forceAngle;  // Removed force angle
    document.getElementById('plane-slider').value = planeAngle;
    document.getElementById('size-slider').value = blockSize;
    
    document.getElementById('friction-value').textContent = friction;
    document.getElementById('force-value').textContent = appliedForce;
    // document.getElementById('angle-value').textContent = forceAngle + '°';  // Removed force angle
    document.getElementById('plane-value').textContent = planeAngle + '°';
    document.getElementById('size-value').textContent = blockSize;
}

function loadFromJSON(jsonData) {
    if (jsonData.simulation === "inclined_plane") {
        friction = jsonData.parameters.friction || friction;
        appliedForce = jsonData.parameters.applied_force || appliedForce;
        // forceAngle = jsonData.parameters.force_angle || forceAngle;  // Removed force angle
        planeAngle = jsonData.parameters.plane_angle || planeAngle;
        blockSize = jsonData.parameters.block_size || blockSize;
        
        resetparams();
        ResetGUI();
    }
}

// Initialize everything
addCustomControlStyles();
createCustomControlPanel();

// Custom function call with default parameters - start with zero applied force
motionInclinedPlane(0.3, 0, 1, 30, 25); // friction=0.3, force=0, gravity=1, incline=30°, blockSize=25

window.resetScene = resetScene;
window.loadSimulationFromJSON = loadFromJSON;
return {engine,runner};
}
