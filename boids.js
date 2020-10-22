const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.fillStyle = '#302e21';

const centeringFactor = 0.005;
const avoidFactor = 0.04;
const matchVelocityFactor = 0.07;
const turnAwayFromBoundsFactor = 1;

const avoidDistance = 25;
const visualRange = 160;
const boundsMargin = 200;

const speedLimit = 14;

const boidsNum = 500;
const boids = new Array(boidsNum);

for (let i = 0; i < boids.length; i++) {
    boids[i] = {
        x: Math.floor(Math.random() * canvas.width),
        y: Math.floor(Math.random() * canvas.height),
        xv: Math.random() * 10 - 5,
        yv: Math.random() * 10 - 5,
    }
}

function keepWithinScreenBounds(boid) {
    if (boid.x < boundsMargin) boid.xv += turnAwayFromBoundsFactor;
    if (boid.y < boundsMargin) boid.yv += turnAwayFromBoundsFactor;
    if (boid.x > canvas.width - boundsMargin) boid.xv -= turnAwayFromBoundsFactor;
    if (boid.y > canvas.height - boundsMargin) boid.yv -= turnAwayFromBoundsFactor;
}

function limitSpeed(boid) {
    const speed = Math.sqrt(boid.xv * boid.xv + boid.yv * boid.yv);

    if (speed > speedLimit) {
        boid.xv = (boid.xv / speed) * speedLimit;
        boid.yv = (boid.yv / speed) * speedLimit;
    }
}

// declare variables here and reuse them to avoid GC

let centreOfMassX, centreOfMassY;
let avoidOthersX, avoidOthersY;
let avgVelocityX, avgVelocityY;
let numberOfNeighbours;
let i, j;
let distance;

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
            distance = Math.sqrt((boids[i].x - boids[j].x) ** 2 + (boids[i].y - boids[j].y) ** 2);

            if (distance > visualRange) continue;

            centreOfMassX += boids[j].x;
            centreOfMassY += boids[j].y;

            avgVelocityX += boids[j].xv;
            avgVelocityY += boids[j].yv;

            if (distance < avoidDistance) {
                avoidOthersX += boids[i].x - boids[j].x;
                avoidOthersY += boids[i].y - boids[j].y;
            }

            numberOfNeighbours++;
        }

        // Rule 1: Boids try to fly towards the centre of mass
        centreOfMassX = (centreOfMassX / numberOfNeighbours) - boids[i].x;
        centreOfMassY = (centreOfMassY / numberOfNeighbours) - boids[i].y;
        boids[i].xv += centreOfMassX * centeringFactor;
        boids[i].yv += centreOfMassY * centeringFactor;

        // Rule 2: Boids try to keep a small distance away from other boids
        boids[i].xv +=  avoidOthersX * avoidFactor;
        boids[i].yv += avoidOthersY * avoidFactor;

        // Rule 3: Boids try to match velocity with near boids
        avgVelocityX = avgVelocityX / numberOfNeighbours;
        avgVelocityY = avgVelocityY / numberOfNeighbours;
        boids[i].xv += avgVelocityX * matchVelocityFactor;
        boids[i].yv += avgVelocityY * matchVelocityFactor;

        limitSpeed(boids[i]);
        keepWithinScreenBounds(boids[i]);

        // round it so anti-aliasing doesn't kick in
        boids[i].x = (boids[i].x + boids[i].xv + 0.5) >> 0;
        boids[i].y = (boids[i].y + boids[i].yv + 0.5) >> 0;

        ctx.fillRect(boids[i].x, boids[i].y, 6, 6);
    }
}

draw()
