
let c1 = 100, c2 = 100, c3 = 100;
let configuration = 'series'; // 'series' or 'parallel'
let totalCapacitance = 0;

const defaultValues={
    c1:100,
    c2:100,
    c3:100,
    configuration:'series',
    totalCapacitance:0
};




function startSimulation(parameters){
    let c1=prameters?.c1??defaultValues.c1;
    let c2=parameters?.c2??defaultValues.c2;
    let c3=parameters?.c3??defaultValues.c3;
    let configuration=parameters?.configuration??defaultValues.configuration;
    let totalCapacitance=parameters?.totalCapacitance??defaultValues.totalCapacitance;
    engine.world.gravity.y = 0;
engine.world.gravity.x = 0;
// capacitors_combination.js - Series & Parallel Capacitors
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


function calculateTotalCapacitance() {
    if (configuration === 'series') {
        totalCapacitance = 1 / (1/c1 + 1/c2 + 1/c3);
    } else {
        totalCapacitance = c1 + c2 + c3;
    }
}

Events.on(render, 'afterRender', function() {
    const context = render.context;
    calculateTotalCapacitance();

    const cx = 300, cy = 300;

    // Draw configuration
    if (configuration === 'series') {
        // Series: capacitors in line
        for (let i = 0; i < 3; i++) {
            const x = cx - 150 + i * 150;
            context.strokeStyle = '#FFFFFF';
            context.lineWidth = 3;
            
            context.strokeRect(x - 10, cy - 40, 20, 80);
            context.strokeRect(x + 10, cy - 40, 20, 80);
            context.fillStyle = '#4169E1';
            const caps = [c1, c2, c3];
            context.fillText(`${caps[i]}μF`, x + 10, cy + 60);
        }
        // Connecting wires
        context.strokeStyle = '#00FFFF';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(cx - 150 - 30, cy);
        context.lineTo(cx - 150 - 10, cy);
        context.moveTo(cx - 150 + 30, cy);
        context.lineTo(cx - 10, cy);
        context.moveTo(cx + 30, cy);
        context.lineTo(cx + 150 - 30, cy);
        context.moveTo(cx + 150 + 30, cy);
        context.lineTo(cx + 150 + 50, cy);
        context.stroke();

        context.fillStyle = '#FFFFFF';
        context.font = 'bold 18px Arial';
        context.textAlign = 'center';
        context.fillText('SERIES Configuration', cx, 200);
        context.fillText(`1/Ctotal = 1/C₁ + 1/C₂ + 1/C₃`, cx, 500);
    } else {
        // Parallel: capacitors stacked
        for (let i = 0; i < 3; i++) {
            const y = cy - 100 + i * 100;
            context.strokeStyle = '#FFFFFF';
            context.lineWidth = 3;
            context.strokeRect(cx - 10, y - 20, 20, 40);
            context.strokeRect(cx + 10, y - 20, 20, 40);
            context.fillStyle = '#4169E1';
            const caps = [c1, c2, c3];
            context.fillText(`${caps[i]}μF`, cx + 50, y);
        }
        // Wires
        context.strokeStyle = '#00FFFF';
        context.lineWidth = 5;
        for (let i = 0; i < 3; i++) {
            const y = cy - 100 + i * 100;
            context.beginPath();
            context.moveTo(cx - 50, y);
            context.lineTo(cx - 10, y);
            context.moveTo(cx + 30, y);
            context.lineTo(cx + 80, y);
            context.stroke();
        }
        // Vertical wires
        context.beginPath();
        context.moveTo(cx - 50, cy - 100);
        context.lineTo(cx - 50, cy + 100);
        context.moveTo(cx + 80, cy - 100);
        context.lineTo(cx + 80, cy + 100);
        context.stroke();

        context.fillStyle = '#FFFFFF';
        context.font = 'bold 18px Arial';
        context.textAlign = 'center';
        context.fillText('PARALLEL Configuration', cx, 200);
        context.fillText(`Ctotal = C₁ + C₂ + C₃`, cx, 500);
    }

    // Result box
    context.fillStyle = 'rgba(0,0,0,0.85)';
    context.fillRect(5, 15, 280, 140);
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 16px Arial';
    context.textAlign = 'left';
    context.fillText('Capacitor Combination', 10, 35);
    context.font = '13px Arial';
    context.fillStyle = '#4169E1';
    context.fillText(`C₁ = ${c1} μF`, 10, 60);
    context.fillText(`C₂ = ${c2} μF`, 10, 80);
    context.fillText(`C₃ = ${c3} μF`, 10, 100);
    context.fillStyle = '#FFD700';
    context.font = 'bold 14px Arial';
    context.fillText(`Total: ${totalCapacitance.toFixed(2)} μF`, 10, 125);

    // Comparison chart
    const chartX = 550, chartY = 150, chartW = 200, chartH = 300;
    context.fillStyle = 'rgba(0,0,0,0.8)';
    context.fillRect(chartX, chartY, chartW, chartH);
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 2;
    context.strokeRect(chartX, chartY, chartW, chartH);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 14px Arial';
    context.textAlign = 'center';
    context.fillText('Capacitance', chartX + chartW/2, chartY - 10);

    // Bars
    const barY = chartY + chartH - 50;
    const barHeight = (totalCapacitance / 300) * (chartH - 100);
    context.fillStyle = '#10A37F';
    context.fillRect(chartX + 50, barY - barHeight, 100, barHeight);
    context.strokeRect(chartX + 50, barY - barHeight, 100, barHeight);

    context.fillStyle = '#FFFFFF';
    context.font = '12px Arial';
    context.fillText(`${totalCapacitance.toFixed(1)}μF`, chartX + 100, barY - barHeight - 10);
});

function addCustomControlStyles() {
    const style = document.createElement('style');
    style.textContent = `
        #custom-control-panel {
            position: fixed; top: 80px; right: 20px; width: 320px;
            background: #202123; border: 1px solid #4D4D4F;
            border-radius: 8px; color: #ECECF1; padding: 15px; z-index: 1000;
        }
        .control-group { margin-bottom: 15px; }
        .control-group label { display: block; margin-bottom: 5px; font-size: 12px; }
        .control-group input[type="range"] {
            width: 100%; height: 6px; background: #4D4D4F; outline: none; -webkit-appearance: none;
        }
        .control-group input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 16px; height: 16px;
            border-radius: 50%; background: #10A37F; cursor: pointer;
        }
        .value-display { float: right; color: #10A37F; font-weight: bold; }
        .panel-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #10A37F; text-align: center; }
        .config-btns { display: flex; gap: 10px; margin-top: 10px; }
        .config-btn { flex: 1; padding: 10px; border: none; border-radius: 5px;
            font-weight: bold; cursor: pointer; background: #4D4D4F; color: white; }
        .config-btn.active { background: #10A37F; }
    `;
    document.head.appendChild(style);
}

function createCustomControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'custom-control-panel';
    panel.innerHTML = `
        <div class="panel-title">Capacitor Combination</div>
        <div class="control-group">
            <label>C₁: <span class="value-display" id="c1-val">${c1}</span></label>
            <input type="range" id="c1-slider" min="10" max="200" step="10" value="${c1}">
        </div>
        <div class="control-group">
            <label>C₂: <span class="value-display" id="c2-val">${c2}</span></label>
            <input type="range" id="c2-slider" min="10" max="200" step="10" value="${c2}">
        </div>
        <div class="control-group">
            <label>C₃: <span class="value-display" id="c3-val">${c3}</span></label>
            <input type="range" id="c3-slider" min="10" max="200" step="10" value="${c3}">
        </div>
        <div class="config-btns">
            <button class="config-btn active" id="series-btn">Series</button>
            <button class="config-btn" id="parallel-btn">Parallel</button>
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('c1-slider').addEventListener('input', function() {
        c1 = parseFloat(this.value);
        document.getElementById('c1-val').textContent = c1;
    });
    document.getElementById('c2-slider').addEventListener('input', function() {
        c2 = parseFloat(this.value);
        document.getElementById('c2-val').textContent = c2;
    });
    document.getElementById('c3-slider').addEventListener('input', function() {
        c3 = parseFloat(this.value);
        document.getElementById('c3-val').textContent = c3;
    });

    document.getElementById('series-btn').addEventListener('click', function() {
        configuration = 'series';
        this.classList.add('active');
        document.getElementById('parallel-btn').classList.remove('active');
    });
    document.getElementById('parallel-btn').addEventListener('click', function() {
        configuration = 'parallel';
        this.classList.add('active');
        document.getElementById('series-btn').classList.remove('active');
    });
}

addCustomControlStyles();
createCustomControlPanel();
calculateTotalCapacitance();
return {engine,runner};
}