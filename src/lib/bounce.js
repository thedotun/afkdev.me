const obstacleSelector = "[hit]";
const START_HP = 100;
export function createBounce(stage) {
  const items = [...stage.querySelectorAll("[data-logo-item]")].map(
    (element, index) => ({
      element,
      index,
      x: 0,
      y: 0,
      hp: START_HP,
      velocityX: 0,
      velocityY: 0,
      isPlaced: false,
    }),
  );

  if (!items.length) {
    return () => {};
  }

  // init mate
  const SPEED_INCREASE_PER_SECOND = 20;
  // i had to add back the thing the limit becausw it would break fight mode
  const MAX_SPEED = 1000;
  const HIT_COOLDOWN = 250;
  const lastHitAt = new Map();
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
      .filter(
        (element) =>
          !items.some(
            (item) =>
              item.element === element || item.element.contains(element),
          ),
      )
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
      .filter(
        (otherItem) =>
          otherItem !== item && (!placedOnly || otherItem.isPlaced),
      )
      .map((otherItem) => ({ ...getItemRect(otherItem), source: otherItem })) // so that i can tell which item is which when doing collisions
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
    const obstacles = getStaticObstacles().concat(
      getOtherItemObstacles(item, placedOnly),
    );

    return obstacles.every(
      (obstacleRect) => !intersects(itemRect, obstacleRect),
    );
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
      MAX_SPEED,
    );

    if (nextSpeed === currentSpeed) {
      return;
    }

    const scale = nextSpeed / currentSpeed;

    item.velocityX *= scale;
    item.velocityY *= scale;
  }

  function resolveXCollision(item, nextX, obstacles, hits) {
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
      } else {
        continue;
      }

      if (obstacle.source) {
        hits.push(obstacle.source);
      }
    }

    return resolvedX;
  }

  function resolveYCollision(item, nextY, obstacles, hits) {
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
      } else {
        continue;
      }

      if (obstacle.source) {
        hits.push(obstacle.source);
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

  function registerHit(itemA, itemB, timestamp, impactSpeed) {
    const key =
      Math.min(itemA.index, itemB.index) +
      ":" +
      Math.max(itemA.index, itemB.index);
    const last = lastHitAt.get(key);

    if (last !== undefined && timestamp - last < HIT_COOLDOWN) {
      return;
    }

    lastHitAt.set(key, timestamp);
    const damage = Math.min(Math.max(Math.round(impactSpeed / 40), 4), 30);

    itemA.hp -= damage;
    itemB.hp -= damage;
    for (const item of [itemA, itemB]) {
      item.velocityX *= 1.3;
      item.velocityY *= 1.3;
    }
    console.log(damage, itemA.hp, itemB.hp);
  }

  function step(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const deltaTime = (timestamp - lastTimestamp) / 1000;
    const staticObstacles = getStaticObstacles();
    // impact speed comes from here
    const velocities = items.map((item) => ({
      velocityX: item.velocityX,
      velocityY: item.velocityY,
    }));

    lastTimestamp = timestamp;

    for (const item of items) {
      const obstacles = staticObstacles.concat(getOtherItemObstacles(item));
      const hits = [];

      increaseSpeed(item, deltaTime);
      item.x = resolveXCollision(
        item,
        item.x + item.velocityX * deltaTime,
        obstacles,
        hits,
      );
      item.y = resolveYCollision(
        item,
        item.y + item.velocityY * deltaTime,
        obstacles,
        hits,
      );
      keepWithinBounds(item);
      renderItem(item);

      for (const other of hits) {
        const a = velocities[item.index];
        const b = velocities[other.index];

        registerHit(
          item,
          other,
          timestamp,
          // trigonometry :glee:
          Math.hypot(a.velocityX - b.velocityX, a.velocityY - b.velocityY),
        );
      }
    }

    animationFrameId = window.requestAnimationFrame(step);
  }

  function startAnimation() {
    window.cancelAnimationFrame(animationFrameId);
    lastTimestamp = 0;
    placeItems();

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

  startAnimation();

  return () => {
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener("resize", handleResize);
    document.body.classList.remove("is-animated");
  };
}
