'use strict';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// SIMULATION SETTINGS

let centeringFactor = 0.005; // coherence
let avoidOthersFactor = 0.03; // separation
let matchVelocityFactor = 0.09; // alignment

let avoidPredatorFactor = 0.05;
let avoidWallsFactor = 0.8;

let speedLimit = 7;
let avoidDistance = 14;
const visualRange = 130;
const boundsMargin = 10;

let mousePredator = true

// SETTINGS UPDATE

const coherenceControl = document.getElementById('coherence');
coherenceControl.value = centeringFactor;
coherenceControl.addEventListener('change', function (e) {
    centeringFactor = e.target.valueAsNumber
})

const separationControl = document.getElementById('separation');
separationControl.value = avoidOthersFactor;
separationControl.addEventListener('change', function (e) {
    avoidOthersFactor = e.target.valueAsNumber
})

const alignmentControl = document.getElementById('alignment');
alignmentControl.value = matchVelocityFactor;
alignmentControl.addEventListener('change', function (e) {
    matchVelocityFactor = e.target.valueAsNumber
})

const speedControl = document.getElementById('speed');
speedControl.value = speedLimit
speedControl.addEventListener('change', function (e) {
    speedLimit = e.target.valueAsNumber
})

// document.getElementById('mousePredator').addEventListener('change', function (e) {
//     mousePredator = e.target.checked
// })

// prevent mouse events (disturbing birds) while cursor is inside settings panel
document.querySelector(".settings").onmousemove = (e) => { e.stopPropagation() }

// init predator (mouse) position
let predatorX = -1000;
let predatorY = -1000;

document.onmousemove = (e) => {
    if (mousePredator) {
        predatorX = e.clientX;
        predatorY = e.clientY;
    }
}

// BOIDS SETUP 

const numBoids = 5000;

// allocate one buffer and divide it into 4 for float arrays
const buf = new ArrayBuffer(numBoids * 4 * Float32Array.BYTES_PER_ELEMENT);

// horizontal positions
const xs = new Float32Array(buf, (0 * numBoids) * Float32Array.BYTES_PER_ELEMENT, numBoids);
// vertical positions
const ys = new Float32Array(buf, (1 * numBoids) * Float32Array.BYTES_PER_ELEMENT, numBoids);
// horizontal velocities
const vxs = new Float32Array(buf, (2 * numBoids) * Float32Array.BYTES_PER_ELEMENT, numBoids);
// vertical velocities
const vys = new Float32Array(buf, (3 * numBoids) * Float32Array.BYTES_PER_ELEMENT, numBoids);
// positions inside spatial hash grid
const gIds = new Uint16Array(numBoids);

// SPATIAL HASH

const cellSize = 50;
const gridWidth = Math.ceil((window.innerWidth) / cellSize);
const gridHeight = Math.ceil((window.innerHeight) / cellSize);
const numBuckets = gridWidth * gridHeight;

const spatialHash = Array.from(Array(numBuckets), () => new Set());
const updateSpatialHashEveryNFrames = 30;
let spatialHashUpdateCounter = updateSpatialHashEveryNFrames;

function getGridId(i) {
    return ~~(xs[i] / cellSize) + (~~(ys[i] / cellSize) * gridWidth);
}

// INIT POSITIONS AND VELOCITIES

for (let i = 0; i < numBoids; i++) {
    xs[i] = Math.floor(Math.random() * canvas.width);
    ys[i] = Math.floor(Math.random() * canvas.height);
    vxs[i] = Math.random() * 5 - 2;
    vys[i] = Math.random() * 5 - 2;
    gIds[i] = getGridId(i);
    spatialHash[gIds[i]].add(i);
}

// MAIN ANIMATION LOOP

function draw() {
    requestAnimationFrame(draw)

    // render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath()
    for (let i = 0; i < numBoids; i++) {
        ctx.rect(xs[i], ys[i], 4, 4);
    }
    ctx.fill();

    // compute
    for (let i = 0; i < numBoids; i++) {
        // steer away from the screen bounds
        let outOfBounds = false;
        if (xs[i] < boundsMargin) { outOfBounds = true; vxs[i] += avoidWallsFactor; }
        if (ys[i] < boundsMargin) { outOfBounds = true; vys[i] += avoidWallsFactor; }
        if (xs[i] > canvas.width - boundsMargin) { outOfBounds = true; vxs[i] -= avoidWallsFactor; }
        if (ys[i] > canvas.height - boundsMargin) { outOfBounds = true; vys[i] -= avoidWallsFactor; }

        // if a birdie is out of the bounds or it doesn't have neighbours, skip further calculcations
        if (outOfBounds || spatialHash[gIds[i]].length <= 1) {
            xs[i] += vxs[i];
            ys[i] += vys[i];
            continue;
        }

        let centreOfMassX = 0;
        let centreOfMassY = 0;

        let avoidOthersX = 0;
        let avoidOthersY = 0;

        let avgVelocityX = 0;
        let avgVelocityY = 0;

        let numberOfNeighbours = 0;

        for (const j of spatialHash[gIds[i]]) {
            // distance = Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
            const distance = Math.abs(xs[i] - xs[j]) + Math.abs(ys[i] - ys[j]) // simplified distance calculation

            if (distance > visualRange) continue;

            centreOfMassX += xs[j];
            centreOfMassY += ys[j];

            avgVelocityX += vxs[j];
            avgVelocityY += vys[j];

            if (distance < avoidDistance) {
                avoidOthersX += xs[i] - xs[j];
                avoidOthersY += ys[i] - ys[j];
            }

            numberOfNeighbours++;
        }

        // Rule 1: Boids try to fly towards the centre of mass (coherence)
        centreOfMassX = (centreOfMassX / numberOfNeighbours) - xs[i];
        centreOfMassY = (centreOfMassY / numberOfNeighbours) - ys[i];
        vxs[i] += centreOfMassX * centeringFactor;
        vys[i] += centreOfMassY * centeringFactor;

        // Rule 2: Boids try to keep a small distance away from other boids (separation)
        vxs[i] += avoidOthersX * avoidOthersFactor;
        vys[i] += avoidOthersY * avoidOthersFactor;

        // Rule 3: Boids try to match velocity with other boids (alignment)
        avgVelocityX = avgVelocityX / numberOfNeighbours;
        avgVelocityY = avgVelocityY / numberOfNeighbours;
        vxs[i] += avgVelocityX * matchVelocityFactor;
        vys[i] += avgVelocityY * matchVelocityFactor;

        // avoid predator
        if (predatorX > 0 && predatorY > 0) {
            // distanceFromPredator = Math.abs(xs[i] - predatorX) + Math.abs(ys[i] - predatorY) // simplified distance calculation
            let distanceFromPredator = Math.sqrt((xs[i] - predatorX) ** 2 + (ys[i] - predatorY) ** 2);

            if (visualRange > distanceFromPredator) {
                vxs[i] += (xs[i] - predatorX) * avoidPredatorFactor;
                vys[i] += (ys[i] - predatorY) * avoidPredatorFactor;
            }
        }

        // limit speed
        // speed = Math.sqrt(vxs[i] * vxs[i] + vys[i] ** 2 );
        const speed = Math.abs(vxs[i]) + Math.abs(vys[i]); // simplified speed estimation
        if (speed > speedLimit) {
            vxs[i] = (vxs[i] / speed) * speedLimit;
            vys[i] = (vys[i] / speed) * speedLimit;
        }

        // round position so anti-aliasing doesn't kick in
        xs[i] = (xs[i] + vxs[i] + 0.5) >> 0;
        ys[i] = (ys[i] + vys[i] + 0.5) >> 0;
    }

    // update spatial hash ever so often
    spatialHashUpdateCounter--;
    if (spatialHashUpdateCounter < 0) {
        spatialHashUpdateCounter = updateSpatialHashEveryNFrames;

        for (let i = 0; i < numBoids; i++) {
            const oldId = gIds[i];
            const newId = getGridId(i);

            // if the bird is still in the same cell, don't update spatial hash
            if (oldId == newId) continue;

            // birdie is out of bounds, don't update it's position as that would error
            if (newId < 0 || newId >= numBuckets) continue;

            spatialHash[oldId].delete(i);
            gIds[i] = newId;
            spatialHash[newId].add(i);
        }
    }

    // set predator position offscreen if mouse isn't actively moved
    predatorX = -1000;
    predatorY = -1000;
}

draw()