(function () {
    const canvas = document.querySelector(".logo-canvas");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!canvas || !window.THREE) {
        return;
    }

    const vertices4D = [];
    const edges = [];
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
    });
    const scene = new THREE.Scene();
    // the camera
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const positions = new Float32Array(32 * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
        color: 0x17324d,
        transparent: true,
        opacity: 0.95,
    });
    const lines = new THREE.LineSegments(geometry, material);
    const core = new THREE.Mesh(
        // its purple and shiny
        new THREE.SphereGeometry(0.24, 18, 18),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.12,
        })
    );
    let animationFrameId = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    function rotatePlane(point, axisA, axisB, angle) {
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        // math.. gulp...
        const nextA = point[axisA] * cos - point[axisB] * sin;
        const nextB = point[axisA] * sin + point[axisB] * cos;

        point[axisA] = nextA;
        point[axisB] = nextB;
    }

    function rotatePoint(vertex, time) {
        const point = vertex.slice();
        // trigonometry is so cool isnt it
        rotatePlane(point, 0, 1, time * 0.9);
        rotatePlane(point, 2, 3, time * 0.7);
        rotatePlane(point, 0, 3, time * 0.55);
        rotatePlane(point, 1, 2, time * 0.45);

        return point;
    }

    function projectPoint(vertex) {
        const wDistance = 3.6;
        const wScale = wDistance / (wDistance - vertex[3]);
        const scale = wScale * 1.15;
        // yk i wanted to make an extension for vertecies
        return [
            vertex[0] * scale,
            vertex[1] * scale,
            vertex[2] * scale,
        ];
    }

    function updateRendererSize() {
        const width = Math.max(1, canvas.clientWidth || canvas.parentElement.clientWidth || 1);
        const height = Math.max(1, canvas.clientHeight || canvas.parentElement.clientHeight || 1);
        // durr
        if (width === lastWidth && height === lastHeight) {
            return;
        }

        lastWidth = width;
        lastHeight = height;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        // itll all be worth it in the end
    }

    function updateGeometry(time) {
        const projectedVertices = vertices4D.map((vertex) => projectPoint(rotatePoint(vertex, time)));
        let positionIndex = 0;

        for (const [startIndex, endIndex] of edges) {
            const start = projectedVertices[startIndex];
            const end = projectedVertices[endIndex];
            // more math.. 
            positions[positionIndex] = start[0];
            positions[positionIndex + 1] = start[1];
            positions[positionIndex + 2] = start[2];
            positions[positionIndex + 3] = end[0];
            positions[positionIndex + 4] = end[1];
            positions[positionIndex + 5] = end[2];
            positionIndex += 6;
        }

        geometry.attributes.position.needsUpdate = true;
        //turns it juuust a bit
        lines.rotation.z = time * 0.2;
        core.scale.setScalar(1 + Math.sin(time * 2.2) * 0.06);
    }

    function renderFrame(timestamp) {
        // updates each frame
        const time = timestamp * 0.001;

        updateRendererSize();
        updateGeometry(time);
        renderer.render(scene, camera);
        animationFrameId = window.requestAnimationFrame(renderFrame);
    }

    function renderStatic() {
        updateRendererSize();
        updateGeometry(0);
        renderer.render(scene, camera);
    }

    function startAnimation() {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;

        if (reducedMotion.matches) {
            renderStatic();
            return;
        }

        animationFrameId = window.requestAnimationFrame(renderFrame);
    }

    for (let index = 0; index < 16; index += 1) {
        // oh my gosh a cube!!!!11111
        vertices4D.push([
            index & 1 ? 1 : -1,
            index & 2 ? 1 : -1,
            index & 4 ? 1 : -1,
            index & 8 ? 1 : -1,
        ]);
    }

    for (let index = 0; index < vertices4D.length; index += 1) {
        for (let axis = 0; axis < 4; axis += 1) {
            const connectedIndex = index ^ (1 << axis);

            if (index < connectedIndex) {
                edges.push([index, connectedIndex]);
            }
        }
    }

    camera.position.z = 5.5;
    renderer.setClearColor(0xffffff, 1
    );
    //smushes them together
    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));
    // set the dir
    lines.rotation.x = -0.35;
    lines.rotation.y = 0.55;
    //makes it
    scene.add(lines);
    scene.add(core);
    window.addEventListener("resize", renderStatic);

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", startAnimation);
    } else {
        reducedMotion.addListener(startAnimation);
    }

    startAnimation();
}());
