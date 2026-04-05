const stage = document.querySelector(".logo-stage");
const obstacleSelector = "[hit]";
const items = [...document.querySelectorAll("[data-logo-item]")].map((element) => ({
    element,
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    isPlaced: false,
}));

if (stage && items.length) {
    // init mate
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const SPEED_INCREASE_PER_SECOND = 20;
    // i removed the limit because its liek
    // more fun
    const MAX_SPEED = Infinity;
    let animationFrameId = 0;
    let lastTimestamp = 0;

    document.body.classList.add("is-animated");

    function getBounds(item) {
        return {
            maxX: Math.max(0, stage.clientWidth - item.element.offsetWidth),
            maxY: Math.max(0, stage.clientHeight - item.element.offsetHeight),
        };
    }

    function getStageRelativeRect(element) {
        const rect = element.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();

        return {
            left: rect.left - stageRect.left,
            top: rect.top - stageRect.top,
            right: rect.right - stageRect.left,
            bottom: rect.bottom - stageRect.top,
            width: rect.width,
            height: rect.height,
        };
    }

    function getStaticObstacles() {
        return [...document.querySelectorAll(obstacleSelector)]
            .filter((element) => !items.some((item) => item.element === element || item.element.contains(element)))
            .map((element) => getStageRelativeRect(element))
            .filter((rect) => rect.width > 0 && rect.height > 0);
    }

    function getItemRect(item, nextX = item.x, nextY = item.y) {
        return {
            left: nextX,
            top: nextY,
            right: nextX + item.element.offsetWidth,
            bottom: nextY + item.element.offsetHeight,
            width: item.element.offsetWidth,
            height: item.element.offsetHeight,
        };
    }

    function getOtherItemObstacles(item, placedOnly = false) {
        return items
            .filter((otherItem) => otherItem !== item && (!placedOnly || otherItem.isPlaced))
            .map((otherItem) => getItemRect(otherItem))
            .filter((rect) => rect.width > 0 && rect.height > 0);
    }

    function intersects(rectA, rectB) {
        return !(
            rectA.right <= rectB.left ||
            rectA.left >= rectB.right ||
            rectA.bottom <= rectB.top ||
            rectA.top >= rectB.bottom
        );
    }

    function isSafePosition(item, nextX, nextY, placedOnly = false) {
        const itemRect = getItemRect(item, nextX, nextY);
        const obstacles = getStaticObstacles().concat(getOtherItemObstacles(item, placedOnly));

        return obstacles.every((obstacleRect) => !intersects(itemRect, obstacleRect));
    }

    function renderItem(item) {
        item.element.style.transform = `translate(${item.x}px, ${item.y}px)`;
    }

    function findSafeStartPosition(item) {
        const { maxX, maxY } = getBounds(item);
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

            if (isSafePosition(item, candidateX, candidateY, true)) {
                return { x: candidateX, y: candidateY };
            }
        }

        for (const fallback of fallbackPositions) {
            const candidateX = Math.min(Math.max(fallback.x, 0), maxX);
            const candidateY = Math.min(Math.max(fallback.y, 0), maxY);

            if (isSafePosition(item, candidateX, candidateY, true)) {
                return { x: candidateX, y: candidateY };
            }
        }

        return { x: maxX / 2, y: maxY / 2 };
    }

    function placeItems() {
        for (const item of items) {
            item.isPlaced = false;
        }

        for (const item of items) {
            const position = findSafeStartPosition(item);

            item.x = position.x;
            item.y = position.y;
            item.isPlaced = true;
            renderItem(item);
        }
    }

    function setRandomVelocity(item) {
        const angle = (20 + Math.random() * 50) * (Math.PI / 180);
        const speed = 180 + Math.random() * 70;
        const xDirection = Math.random() < 0.5 ? -1 : 1;
        const yDirection = Math.random() < 0.5 ? -1 : 1;

        // who doesnt love Math.random()
        item.velocityX = Math.cos(angle) * speed * xDirection;
        item.velocityY = Math.sin(angle) * speed * yDirection;
    }

    function increaseSpeed(item, deltaTime) {
        const currentSpeed = Math.hypot(item.velocityX, item.velocityY);

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

        item.velocityX *= scale;
        item.velocityY *= scale;
    }

    function resolveXCollision(item, nextX, obstacles) {
        let resolvedX = nextX;
        const currentRect = getItemRect(item);

        for (const obstacle of obstacles) {
            const nextRect = getItemRect(item, resolvedX, item.y);

            if (!intersects(nextRect, obstacle)) {
                continue;
            }

            if (item.velocityX > 0 && currentRect.right <= obstacle.left) {
                resolvedX = obstacle.left - item.element.offsetWidth;
                item.velocityX = -Math.abs(item.velocityX);
            } else if (item.velocityX < 0 && currentRect.left >= obstacle.right) {
                resolvedX = obstacle.right;
                item.velocityX = Math.abs(item.velocityX);
            }
        }

        return resolvedX;
    }

    function resolveYCollision(item, nextY, obstacles) {
        let resolvedY = nextY;
        const currentRect = getItemRect(item);

        for (const obstacle of obstacles) {
            const nextRect = getItemRect(item, item.x, resolvedY);

            if (!intersects(nextRect, obstacle)) {
                continue;
            }

            if (item.velocityY > 0 && currentRect.bottom <= obstacle.top) {
                resolvedY = obstacle.top - item.element.offsetHeight;
                item.velocityY = -Math.abs(item.velocityY);
            } else if (item.velocityY < 0 && currentRect.top >= obstacle.bottom) {
                resolvedY = obstacle.bottom;
                item.velocityY = Math.abs(item.velocityY);
            }
        }

        return resolvedY;
    }

    function keepWithinBounds(item) {
        const { maxX, maxY } = getBounds(item);

        if (item.x <= 0) {
            item.x = 0;
            item.velocityX = Math.abs(item.velocityX);
        } else if (item.x >= maxX) {
            item.x = maxX;
            item.velocityX = -Math.abs(item.velocityX);
        }

        if (item.y <= 0) {
            item.y = 0;
            item.velocityY = Math.abs(item.velocityY);
        } else if (item.y >= maxY) {
            item.y = maxY;
            item.velocityY = -Math.abs(item.velocityY);
        }
    }

    function step(timestamp) {
        if (!lastTimestamp) {
            lastTimestamp = timestamp;
        }

        const deltaTime = (timestamp - lastTimestamp) / 1000;
        const staticObstacles = getStaticObstacles();

        lastTimestamp = timestamp;

        for (const item of items) {
            const obstacles = staticObstacles.concat(getOtherItemObstacles(item));

            increaseSpeed(item, deltaTime);
            item.x = resolveXCollision(item, item.x + item.velocityX * deltaTime, obstacles);
            item.y = resolveYCollision(item, item.y + item.velocityY * deltaTime, obstacles);
            keepWithinBounds(item);
            renderItem(item);
        }

        animationFrameId = window.requestAnimationFrame(step);
    }

    function startAnimation() {
        window.cancelAnimationFrame(animationFrameId);
        lastTimestamp = 0;
        placeItems();

        if (reducedMotion.matches) {
            return;
        }

        for (const item of items) {
            setRandomVelocity(item);
        }

        animationFrameId = window.requestAnimationFrame(step);
    }

    function handleResize() {
        for (const item of items) {
            const { maxX, maxY } = getBounds(item);

            item.x = Math.min(Math.max(item.x, 0), maxX);
            item.y = Math.min(Math.max(item.y, 0), maxY);
            item.isPlaced = true;
        }

        if (items.some((item) => !isSafePosition(item, item.x, item.y))) {
            placeItems();
            return;
        }

        for (const item of items) {
            renderItem(item);
        }
    }

    window.addEventListener("resize", handleResize);

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", startAnimation);
    } else {
        reducedMotion.addListener(startAnimation);
    }

    startAnimation();
}
