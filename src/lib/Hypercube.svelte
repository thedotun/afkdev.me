<script>
    import { createHypercube } from './hypercube.js';

    let canvas;

    $effect(() => {
        let teardown = null;
        let cancelled = false;

        createHypercube(canvas).then((stop) => {
            if (cancelled) {
                stop();
                return;
            }

            teardown = stop;
        });

        return () => {
            cancelled = true;
            teardown?.();
        };
    });
</script>

<canvas bind:this={canvas} class="logo-canvas" aria-hidden="true"></canvas>
