const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const centeringFactor = 0.005
const avoidFactor = 0.05
const matchVelocityFactor = 0.07

const avoidDistance = 25
const visualRange = 100

const boidsNum = 400;
const boids = [];

for (let i = 0; i < boidsNum; i++) {
    boids.push({
        x: Math.floor(Math.random() * canvas.width),
        y: Math.floor(Math.random() * canvas.height),
        xv: 0,
        yv: 0,
    });
}

function distance(boid1, boid2) {
    return Math.sqrt((boid1.x - boid2.x) ** 2 + (boid1.y - boid2.y) ** 2);
}

// destructing is expensive performance-wise
function distance2({x1, y1}, {x2, y2}) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}


function keepWithinScreenBounds(boid) {
    const margin = 200;
    const turnFactor = 1;

    if (boid.x < margin) boid.xv += turnFactor;
    if (boid.y < margin) boid.yv += turnFactor;
    if (boid.x > canvas.width - margin) boid.xv -= turnFactor;
    if (boid.y > canvas.height - margin) boid.yv -= turnFactor;
}

function limitSpeed(boid) {
    const speedLimit = 15;

    // TODO optimize
    const speed = Math.sqrt(boid.xv * boid.xv + boid.yv * boid.yv);

    if (speed > speedLimit) {
        boid.xv = (boid.xv / speed) * speedLimit;
        boid.yv = (boid.yv / speed) * speedLimit;
    }
}

function draw() {
    requestAnimationFrame(draw)

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'teal';

    for (const boid of boids) {
        let centreX = 0
        let centreY = 0

        let avoidX = 0
        let avoidY = 0

        let velocityX = 0
        let velocityY = 0

        for (const otherBoid of boids) {
            if (otherBoid === boid) continue;

            centreX += otherBoid.x;
            centreY += otherBoid.y;

            const curDistance = distance(boid, otherBoid);
            if (curDistance < avoidDistance) {
                avoidX += boid.x - otherBoid.x;
                avoidY += boid.y - otherBoid.y;
            }

            if (curDistance < visualRange) {
                velocityX += otherBoid.xv;
                velocityY += otherBoid.yv;
            }
        }

        keepWithinScreenBounds(boid);

        // Rule 1: Boids try to fly towards the centre of mass
        const centreOfMassX = (centreX / boidsNum) - boid.x;
        const centreOfMassY = (centreY / boidsNum) - boid.y;
        boid.xv += centreOfMassX * centeringFactor;
        boid.yv += centreOfMassY * centeringFactor;

        // Rule 2: Boids try to keep a small distance away from other boids
        boid.xv += avoidX * avoidFactor;
        boid.yv += avoidY * avoidFactor;

        // Rule 3: Boids try to match velocity with near boids.
        const avgVelocityX = velocityX / boidsNum;
        const avgVelocityY = velocityY / boidsNum;
        boid.xv += avgVelocityX * matchVelocityFactor;
        boid.yv += avgVelocityY * matchVelocityFactor;

        limitSpeed(boid);

        // floor it so anti-aliasing doesn't kick in
        boid.x = Math.floor(boid.x + boid.xv);
        boid.y = Math.floor(boid.y + boid.yv);

        // boid.x += boid.xv;
        // boid.y += boid.yv;

        ctx.fillRect(boid.x, boid.y, 7, 7);
    }
}

draw()
