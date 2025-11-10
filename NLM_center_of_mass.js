// center_of_mass.js - Center of Mass Simulation with Person on Frictionless Plank
const defaultValues={
        carVelocity: 2,
    carMass: 10,
    plankMass: 50,
    plankLength: 400

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
let carVelocity = parameters?.carVelocity ?? defaultValues.carVelocity;
    let carMass = parameters?.carMass ?? defaultValues.carMass;
    let plankMass = parameters?.plankMass ?? defaultValues.plankMass;
    let plankLength = parameters?.plankLength ?? defaultValues.plankLength;
// Global variables
let car, plank, ground;
 // Increased from 300
let plankWidth = 30;   // Increased from 20
let carSize = 50;      // Increased from 30
let systemVelocity = 0; // Velocity of the plank due to conservation of momentum
let centerOfMassMarker; // Marker for center of mass

// Ground parameters
const groundHeight = 50;
const groundY = 575;

// Function to draw a more natural person shape
function drawPerson(ctx, x, y, size) {
    // Save the current context
    ctx.save();
    ctx.translate(x, y);
    
    // Head
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(0, -size/2, size/3, 0, Math.PI * 2);
    ctx.fill();
    
    // Body (torso)
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-size/4, -size/3, size/2, size/1.5);
    
    // Legs
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = size/5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Left leg
    ctx.moveTo(-size/6, size/6);
    ctx.lineTo(-size/6, size/2);
    // Right leg
    ctx.moveTo(size/6, size/6);
    ctx.lineTo(size/6, size/2);
    ctx.stroke();
    
    // Arms in a more natural walking position
    ctx.beginPath();
    // Left arm (swinging forward)
    ctx.moveTo(-size/4, -size/6);
    ctx.lineTo(-size/1.5, size/6);
    // Right arm (swinging back)
    ctx.moveTo(size/4, -size/6);
    ctx.lineTo(size/1.5, 0);
    ctx.stroke();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-size/8, -size/1.8, size/15, 0, Math.PI * 2);
    ctx.arc(size/8, -size/1.8, size/15, 0, Math.PI * 2);
    ctx.fill();
    
    // Smile
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -size/2.5, size/6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Restore the context
    ctx.restore();
}

function createCenterOfMassSystem() {
    // Create ground
    ground = Bodies.rectangle(400, groundY, 800, groundHeight, {
        isStatic: true,
        render: { fillStyle: '#28ba3eff' }
    });

    // Create plank (frictionless)
    const plankX = 400;
    const plankY = groundY - groundHeight / 2 - plankWidth / 2;
    
    plank = Bodies.rectangle(plankX, plankY, plankLength, plankWidth, {
        friction: 0, // Frictionless
        frictionAir: 0.01,
        render: { fillStyle: '#8B4513' } // Brown color for plank
    });

    // Create person on the plank
    const personX = plankX - plankLength / 3; // Start person at 1/3 of plank length from left
    const personY = plankY - plankWidth / 2 - carSize / 2;
    
    car = Bodies.rectangle(personX, personY, carSize, carSize, {
        friction: 0, // Frictionless
        frictionAir: 0.01,
        render: { 
            fillStyle: 'transparent',
            sprite: {
                texture: undefined // We'll draw the person manually
            }
        }
    });

    // Add all bodies to the world
    Composite.add(world, [ground, plank, car]);
    
    // Set initial velocity for the person
    Body.setVelocity(car, { x: carVelocity, y: 0 });
}

// Function to calculate and apply conservation of momentum
function applyMomentumConservation() {
    // Remove existing event listener if any
    if (window.momentumHandler) {
        Events.off(engine, 'beforeUpdate', window.momentumHandler);
    }
    
    window.momentumHandler = function() {
        // Calculate center of mass velocity of the system
        // Since the system starts at rest, total momentum should remain zero
        // m_person * v_person + m_plank * v_plank = 0
        // Therefore: v_plank = - (m_person * v_person) / m_plank
        
        const plankVelocity = - (carMass * car.velocity.x) / plankMass;
        
        // Apply velocity to plank
        Body.setVelocity(plank, { x: plankVelocity, y: 0 });
        
        // Keep person velocity consistent (in case of any physics engine adjustments)
        Body.setVelocity(car, { x: carVelocity, y: 0 });
        
        // Check if person is about to fall off the plank
        const plankLeftEdge = plank.position.x - plankLength / 2;
        const plankRightEdge = plank.position.x + plankLength / 2;
        const personLeftEdge = car.position.x - carSize / 2;
        const personRightEdge = car.position.x + carSize / 2;
        
        // If person is about to go off the plank, stop the simulation
        if (personLeftEdge < plankLeftEdge || personRightEdge > plankRightEdge) {
            // Stop the person and plank
            Body.setVelocity(car, { x: 0, y: 0 });
            Body.setVelocity(plank, { x: 0, y: 0 });
        }
    };
    
    Events.on(engine, 'beforeUpdate', window.momentumHandler);
}

// Function to draw the center of mass marker and the person
function drawCenterOfMass() {
    // Remove existing event listener if any
    if (window.drawHandler) {
        Events.off(render, 'afterRender', window.drawHandler);
    }
    
    window.drawHandler = function() {
        const ctx = render.context;
        
        // Draw the person
        drawPerson(ctx, car.position.x, car.position.y, carSize);
        
        // Calculate center of mass position
        // COM = (m1*x1 + m2*x2) / (m1 + m2)
        const comX = (carMass * car.position.x + plankMass * plank.position.x) / (carMass + plankMass);
        const comY = (carMass * car.position.y + plankMass * plank.position.y) / (carMass + plankMass);
        
        // Draw center of mass marker
        ctx.fillStyle = '#f1c40f'; // Yellow color
        ctx.beginPath();
        ctx.arc(comX, comY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(comX, comY, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('COM', comX, comY - 15);
    };
    
    Events.on(render, 'afterRender', window.drawHandler);
}

function resetScene() {
    Runner.stop(runner);
    World.clear(world);
    if (window.momentumHandler) {
        Events.off(engine, 'beforeUpdate', window.momentumHandler);
    }
    if (window.drawHandler) {
        Events.off(render, 'afterRender', window.drawHandler);
    }
    createCenterOfMassSystem();
    applyMomentumConservation();
    drawCenterOfMass();
    ResetGUI();
}

function resetparams() {
    Runner.stop(runner);
    isPlaying = false;
    World.clear(world);
    if (window.momentumHandler) {
        Events.off(engine, 'beforeUpdate', window.momentumHandler);
    }
    if (window.drawHandler) {
        Events.off(render, 'afterRender', window.drawHandler);
    }
    createCenterOfMassSystem();
    applyMomentumConservation();
    drawCenterOfMass();
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
        .slider-container input[type="range"]::-webkit-slider-thumb:hover {
            background: #0f946f;
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
            font-size: 12px;
        }
        
        .physics-info p {
            margin: 5px 0;
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
            <label>Person Velocity</label>
            <div class="slider-container">
                <input type="range" id="velocity-slider" min="0.5" max="5" step="0.1" value="${carVelocity}">
                <span class="slider-value" id="velocity-value">${carVelocity}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Person Mass</label>
            <div class="slider-container">
                <input type="range" id="car-mass-slider" min="1" max="30" step="1" value="${carMass}">
                <span class="slider-value" id="car-mass-value">${carMass}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Plank Mass</label>
            <div class="slider-container">
                <input type="range" id="plank-mass-slider" min="10" max="100" step="5" value="${plankMass}">
                <span class="slider-value" id="plank-mass-value">${plankMass}</span>
            </div>
        </div>
        
        <div class="control-group">
            <label>Plank Length</label>
            <div class="slider-container">
                <input type="range" id="plank-length-slider" min="300" max="600" step="10" value="${plankLength}">
                <span class="slider-value" id="plank-length-value">${plankLength}</span>
            </div>
        </div>
        
        <div class="physics-info">
            <p><strong>Physics Principle:</strong></p>
            <p>Conservation of Momentum</p>
            <p>m<sub>person</sub> × v<sub>person</sub> + m<sub>plank</sub> × v<sub>plank</sub> = 0</p>
            <p><strong>Therefore:</strong> v<sub>plank</sub> = - (m<sub>person</sub> × v<sub>person</sub>) / m<sub>plank</sub></p>
        </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Event listeners
    document.getElementById('velocity-slider').addEventListener('input', function() {
        carVelocity = parseFloat(this.value);
        document.getElementById('velocity-value').textContent = carVelocity;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('car-mass-slider').addEventListener('input', function() {
        carMass = parseFloat(this.value);
        document.getElementById('car-mass-value').textContent = carMass;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('plank-mass-slider').addEventListener('input', function() {
        plankMass = parseFloat(this.value);
        document.getElementById('plank-mass-value').textContent = plankMass;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
    
    document.getElementById('plank-length-slider').addEventListener('input', function() {
        plankLength = parseFloat(this.value);
        document.getElementById('plank-length-value').textContent = plankLength;
        resetparams();
        playPauseBtn.innerHTML = '▶';
    });
}

function ResetGUI() {
    document.getElementById('velocity-slider').value = carVelocity;
    document.getElementById('car-mass-slider').value = carMass;
    document.getElementById('plank-mass-slider').value = plankMass;
    document.getElementById('plank-length-slider').value = plankLength;
    
    document.getElementById('velocity-value').textContent = carVelocity;
    document.getElementById('car-mass-value').textContent = carMass;
    document.getElementById('plank-mass-value').textContent = plankMass;
    document.getElementById('plank-length-value').textContent = plankLength;
}

// Initialize
addCustomControlStyles();
createCustomControlPanel();
createCenterOfMassSystem();
applyMomentumConservation();
drawCenterOfMass();
return {engine,runner};
}
