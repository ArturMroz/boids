const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.fillStyle = 'teal';

const centeringFactor = 0.005
const avoidFactor = 0.04
const matchVelocityFactor = 0.07

const avoidDistance = 25
const visualRange = 180

const boidsNum = 500;
const boids = [];

const margin = 200;
const turnFactor = 1;

const speedLimit = 15;

for (let i = 0; i < boidsNum; i++) {
    boids.push({
        x: Math.floor(Math.random() * canvas.width),
        y: Math.floor(Math.random() * canvas.height),
        xv: Math.random() * 10 - 5,
        yv: Math.random() * 10 - 5,
    });
}

function distance(boid1, boid2) {
    return Math.sqrt((boid1.x - boid2.x) ** 2 + (boid1.y - boid2.y) ** 2);
}

function keepWithinScreenBounds(boid) {
    if (boid.x < margin) boid.xv += turnFactor;
    if (boid.y < margin) boid.yv += turnFactor;
    if (boid.x > canvas.width - margin) boid.xv -= turnFactor;
    if (boid.y > canvas.height - margin) boid.yv -= turnFactor;
}

function limitSpeed(boid) {
    const speed = Math.sqrt(boid.xv * boid.xv + boid.yv * boid.yv);

    if (speed > speedLimit) {
        boid.xv = (boid.xv / speed) * speedLimit;
        boid.yv = (boid.yv / speed) * speedLimit;
    }
}

// declare variables here and zero them in a loop to avoid GC
let centreOfMassX = 0
let centreOfMassY = 0

let avoidX = 0
let avoidY = 0

let avgVelocityX = 0
let avgVelocityY = 0

let numberOfNeighbours = 0

function draw() {
    requestAnimationFrame(draw)

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const boid of boids) {
        centreOfMassX = 0
        centreOfMassY = 0

        avoidX = 0
        avoidY = 0

        avgVelocityX = 0
        avgVelocityY = 0

        numberOfNeighbours = 0

        for (const otherBoid of boids) {
            if (otherBoid === boid) continue;

            const curDistance = distance(boid, otherBoid);

            if (curDistance > visualRange) continue;

            centreOfMassX += otherBoid.x;
            centreOfMassY += otherBoid.y;

            avgVelocityX += otherBoid.xv;
            avgVelocityY += otherBoid.yv;

            if (curDistance < avoidDistance) {
                avoidX += boid.x - otherBoid.x;
                avoidY += boid.y - otherBoid.y;
            }

            numberOfNeighbours++;
        }

        if (numberOfNeighbours > 0) {
            // Rule 1: Boids try to fly towards the centre of mass
            centreOfMassX = (centreOfMassX / numberOfNeighbours) - boid.x;
            centreOfMassY = (centreOfMassY / numberOfNeighbours) - boid.y;
            boid.xv += centreOfMassX * centeringFactor;
            boid.yv += centreOfMassY * centeringFactor;

            // Rule 2: Boids try to keep a small distance away from other boids
            boid.xv +=  avoidX * avoidFactor;
            boid.yv += avoidY * avoidFactor;

            // Rule 3: Boids try to match velocity with near boids.
            avgVelocityX = avgVelocityX / numberOfNeighbours;
            avgVelocityY = avgVelocityY / numberOfNeighbours;
            boid.xv += avgVelocityX * matchVelocityFactor;
            boid.yv += avgVelocityY * matchVelocityFactor;
        }

        limitSpeed(boid);
        keepWithinScreenBounds(boid);

        // round it so anti-aliasing doesn't kick in
        boid.x = (boid.x + boid.xv + 0.5) >> 0;
        boid.y = (boid.y + boid.yv + 0.5) >> 0;

        ctx.fillRect(boid.x, boid.y, 6, 6);
    }
}

draw()
