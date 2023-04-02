'use strict';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// simulation settings
const centeringFactor = 0.005;
const avoidOthersFactor = 0.03;
const matchVelocityFactor = 0.09;
const avoidWallsFactor = 0.3;

const avoidDistance = 14;
const visualRange = 130;
const boundsMargin = 50;
const speedLimit = 9;

const numBoids = 3000;

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

// spatial hash
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

// init positions and velocities
for (let i = 0; i < numBoids; i++) {
    xs[i] = Math.floor(Math.random() * canvas.width);
    ys[i] = Math.floor(Math.random() * canvas.height);
    vxs[i] = Math.random() * 5 - 2;
    vys[i] = Math.random() * 5 - 2;
    gIds[i] = getGridId(i);
    spatialHash[gIds[i]].add(i);
}

// declare variables here and reuse them to avoid GC
let centreOfMassX, centreOfMassY;
let avoidOthersX, avoidOthersY;
let avgVelocityX, avgVelocityY;
let numberOfNeighbours;
let i, j;
let distance, speed;
let outOfBounds;
let oldId, newId;

// main animation loop
function draw() {
    requestAnimationFrame(draw)

    // render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (i = 0; i < numBoids; i++) {
        ctx.fillRect(xs[i], ys[i], 4, 4);
    }

    // compute
    for (i = 0; i < numBoids; i++) {
        // steer away from the screen bounds
        outOfBounds = false;
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

        centreOfMassX = 0;
        centreOfMassY = 0;

        avoidOthersX = 0;
        avoidOthersY = 0;

        avgVelocityX = 0;
        avgVelocityY = 0;

        numberOfNeighbours = 0;

        for (j of spatialHash[gIds[i]]) {
            // distance = Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
            distance = Math.abs(xs[i] - xs[j]) + Math.abs(ys[i] - ys[j]) // simplified distance calculation

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

        // Rule 1: Boids try to fly towards the centre of mass
        centreOfMassX = (centreOfMassX / numberOfNeighbours) - xs[i];
        centreOfMassY = (centreOfMassY / numberOfNeighbours) - ys[i];
        vxs[i] += centreOfMassX * centeringFactor;
        vys[i] += centreOfMassY * centeringFactor;

        // Rule 2: Boids try to keep a small distance away from other boids
        vxs[i] += avoidOthersX * avoidOthersFactor;
        vys[i] += avoidOthersY * avoidOthersFactor;

        // Rule 3: Boids try to match velocity with other boids
        avgVelocityX = avgVelocityX / numberOfNeighbours;
        avgVelocityY = avgVelocityY / numberOfNeighbours;
        vxs[i] += avgVelocityX * matchVelocityFactor;
        vys[i] += avgVelocityY * matchVelocityFactor;

        // limit speed
        // speed = Math.sqrt(vxs[i] * vxs[i] + vys[i] ** 2 );
        speed = Math.abs(vxs[i]) + Math.abs(vys[i]); // simplified speed estimation
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

        for (i = 0; i < numBoids; i++) {
            oldId = gIds[i];
            newId = getGridId(i);

            // if the bird is still in the same cell, don't update spatial hash
            if (oldId == newId) continue;

            // birdie is out of bounds, don't update it's position as that would error
            if (newId < 0 || newId >= numBuckets) continue;

            spatialHash[oldId].delete(i);
            gIds[i] = newId;
            spatialHash[newId].add(i);
        }
    }
}

draw()