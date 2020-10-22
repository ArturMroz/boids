const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.fillStyle = '#302e21';

const centeringFactor = 0.005;
const avoidOthersFactor = 0.06;
const matchVelocityFactor = 0.08;
const avoidWallsFactor = 0.8;

const avoidDistance = 25;
const visualRange = 170;
const boundsMargin = 180;
const speedLimit = 16;

const boidsNum = 700;

// allocate one buffer and divide it into 4 for float arrays
const buf = new ArrayBuffer(boidsNum * 4 * Float32Array.BYTES_PER_ELEMENT);
// horizontal positions
const xs = new Float32Array(buf, (0 * boidsNum) * Float32Array.BYTES_PER_ELEMENT, boidsNum);
// vertical positions
const ys = new Float32Array(buf, (1 * boidsNum) * Float32Array.BYTES_PER_ELEMENT, boidsNum);
// horizontal velocities
const vxs = new Float32Array(buf, (2 * boidsNum) * Float32Array.BYTES_PER_ELEMENT, boidsNum);
// vertical velocities
const vys = new Float32Array(buf, (3 * boidsNum) * Float32Array.BYTES_PER_ELEMENT, boidsNum);

for (let i = 0; i < boidsNum; i++) {
    xs[i] = Math.floor(Math.random() * canvas.width);
    ys[i] = Math.floor(Math.random() * canvas.height);
    vxs[i] = Math.random() * 10 - 5;
    vys[i] = Math.random() * 10 - 5;
}

// declare variables here and reuse them to avoid GC
let centreOfMassX, centreOfMassY;
let avoidOthersX, avoidOthersY;
let avgVelocityX, avgVelocityY;
let numberOfNeighbours;
let i, j;
let distance, speed;

function draw() {
    requestAnimationFrame(draw)

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (i = 0; i < boidsNum; i++) {
        centreOfMassX = 0;
        centreOfMassY = 0;

        avoidOthersX = 0;
        avoidOthersY = 0;

        avgVelocityX = 0;
        avgVelocityY = 0;

        numberOfNeighbours = 0;

        for (j = 0; j < boidsNum; j++) {
            // distance = Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
            // simplified distance calculation
            distance = Math.abs(xs[i] - xs[j]) + Math.abs(ys[i] - ys[j])

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
        vxs[i] +=  avoidOthersX * avoidOthersFactor;
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

        // steer away from the screen bounds
        if (xs[i] < boundsMargin) vxs[i] += avoidWallsFactor;
        if (ys[i] < boundsMargin) vys[i] += avoidWallsFactor;
        if (xs[i] > canvas.width - boundsMargin) vxs[i] -= avoidWallsFactor;
        if (ys[i] > canvas.height - boundsMargin) vys[i] -= avoidWallsFactor;

        // round it so anti-aliasing doesn't kick in
        xs[i] = (xs[i] + vxs[i] + 0.5) >> 0;
        ys[i] = (ys[i] + vys[i] + 0.5) >> 0;

        ctx.fillRect(xs[i], ys[i], 5, 5);
    }
}

draw()
