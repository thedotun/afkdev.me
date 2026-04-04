const stage = document.querySelector(".logo-stage");
const logo = document.getElementById("logo");
const obstacleSelector = "[hit]";

if (stage && logo) {
    // init mate
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const SPEED_INCREASE_PER_SECOND = 20;
    const MAX_SPEED = 420;
    let animationFrameId = 0;
    let lastTimestamp = 0;
    let x = 0;
    let y = 0;
    let velocityX = 0;
    let velocityY = 0;

    document.body.classList.add("is-animated");

    function getBounds() {
        return {
            maxX: Math.max(0, stage.clientWidth - logo.offsetWidth),
            maxY: Math.max(0, stage.clientHeight - logo.offsetHeight),
        };
    }

    function getObstacles() {
        return [...document.querySelectorAll(obstacleSelector)]
            .filter((element) => element !== logo && !logo.contains(element))
            .map((element) => element.getBoundingClientRect())
            .filter((rect) => rect.width > 0 && rect.height > 0);
    }

    function getLogoRect(nextX = x, nextY = y) {
        return {
            left: nextX,
            top: nextY,
            right: nextX + logo.offsetWidth,
            bottom: nextY + logo.offsetHeight,
        };
    }

    function intersects(rectA, rectB) {
        return !(
            rectA.right <= rectB.left ||
            rectA.left >= rectB.right ||
            rectA.bottom <= rectB.top ||
            rectA.top >= rectB.bottom
        );
    }

    function isSafePosition(nextX, nextY) {
        const logoRect = getLogoRect(nextX, nextY);

        return getObstacles().every((obstacleRect) => !intersects(logoRect, obstacleRect));
    }

    function render() {
        logo.style.transform = `translate(${x}px, ${y}px)`;
    }

    function findSafeStartPosition() {
        const { maxX, maxY } = getBounds();
        const fallbackPositions = [
            { x: maxX / 2, y: maxY / 2 },
            { x: 24, y: 24 },
            { x: maxX - 24, y: 24 },
            { x: 24, y: maxY - 24 },
            { x: maxX - 24, y: maxY - 24 },
        ];

        for (let attempt = 0; attempt < 80; attempt += 1) {
            const candidateX = Math.random() * maxX;
            const candidateY = Math.random() * maxY;

            if (isSafePosition(candidateX, candidateY)) {
                return { x: candidateX, y: candidateY };
            }
        }

        for (const fallback of fallbackPositions) {
            const candidateX = Math.min(Math.max(fallback.x, 0), maxX);
            const candidateY = Math.min(Math.max(fallback.y, 0), maxY);

            if (isSafePosition(candidateX, candidateY)) {
                return { x: candidateX, y: candidateY };
            }
        }

        return { x: maxX / 2, y: maxY / 2 };
    }

    function placeLogo() {
        const position = findSafeStartPosition();

        x = position.x;
        y = position.y;
        render();
    }

    function setRandomVelocity() {
        const angle = (20 + Math.random() * 50) * (Math.PI / 180);
        const speed = 180 + Math.random() * 70;
        const xDirection = Math.random() < 0.5 ? -1 : 1;
        const yDirection = Math.random() < 0.5 ? -1 : 1;
        // who doesnt love Math.random()
        velocityX = Math.cos(angle) * speed * xDirection;
        velocityY = Math.sin(angle) * speed * yDirection;
    }

    function increaseSpeed(deltaTime) {
        const currentSpeed = Math.hypot(velocityX, velocityY);

        if (!currentSpeed) {
            return;
        }

        const nextSpeed = Math.min(
            currentSpeed + SPEED_INCREASE_PER_SECOND * deltaTime,
            MAX_SPEED
        );

        if (nextSpeed === currentSpeed) {
            return;
        }

        const scale = nextSpeed / currentSpeed;

        velocityX *= scale;
        velocityY *= scale;
    }

    function resolveXCollision(nextX, obstacles) {
        let resolvedX = nextX;
        const currentRect = getLogoRect(x, y);

        for (const obstacle of obstacles) {
            const nextRect = getLogoRect(resolvedX, y);

            if (!intersects(nextRect, obstacle)) {
                continue;
            }

            if (velocityX > 0 && currentRect.right <= obstacle.left) {
                resolvedX = obstacle.left - logo.offsetWidth;
                velocityX = -Math.abs(velocityX);
            } else if (velocityX < 0 && currentRect.left >= obstacle.right) {
                resolvedX = obstacle.right;
                velocityX = Math.abs(velocityX);
            }
        }

        return resolvedX;
    }

    function resolveYCollision(nextY, obstacles) {
        let resolvedY = nextY;
        const currentRect = getLogoRect(x, y);

        for (const obstacle of obstacles) {
            const nextRect = getLogoRect(x, resolvedY);

            if (!intersects(nextRect, obstacle)) {
                continue;
            }

            if (velocityY > 0 && currentRect.bottom <= obstacle.top) {
                resolvedY = obstacle.top - logo.offsetHeight;
                velocityY = -Math.abs(velocityY);
            } else if (velocityY < 0 && currentRect.top >= obstacle.bottom) {
                resolvedY = obstacle.bottom;
                velocityY = Math.abs(velocityY);
            }
        }

        return resolvedY;
    }

    function keepWithinBounds() {
        const { maxX, maxY } = getBounds();

        if (x <= 0) {
            x = 0;
            velocityX = Math.abs(velocityX);
        } else if (x >= maxX) {
            x = maxX;
            velocityX = -Math.abs(velocityX);
        }

        if (y <= 0) {
            y = 0;
            velocityY = Math.abs(velocityY);
        } else if (y >= maxY) {
            y = maxY;
            velocityY = -Math.abs(velocityY);
        }
    }

    function step(timestamp) {
        if (!lastTimestamp) {
            lastTimestamp = timestamp;
        }

        const deltaTime = (timestamp - lastTimestamp) / 1000;
        const obstacles = getObstacles();

        lastTimestamp = timestamp;
        increaseSpeed(deltaTime);

        x = resolveXCollision(x + velocityX * deltaTime, obstacles);
        y = resolveYCollision(y + velocityY * deltaTime, obstacles);
        keepWithinBounds();
        render();

        animationFrameId = window.requestAnimationFrame(step);
    }

    function startAniation() {
        window.cancelAnimationFrame(animationFrameId);
        lastTimestamp = 0;
        placeLogo();

        if (reducedMotion.matches) {
            return;
        }

        setRandomVelocity();
        animationFrameId = window.requestAnimationFrame(step);
    }

    function handleResize() {
        const { maxX, maxY } = getBounds();

        x = Math.min(Math.max(x, 0), maxX);
        y = Math.min(Math.max(y, 0), maxY);

        if (!isSafePosition(x, y)) {
            placeLogo();
            return;
        }

        render();
    }

    window.addEventListener("resize", handleResize);

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", startAniation);
    } else {
        reducedMotion.addListener(startAniation);
    }

    startAniation();
}
