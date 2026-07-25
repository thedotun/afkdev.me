<script>
  import { createBounce } from "../lib/bounce.js";
  import Hypercube from "../lib/Hypercube.svelte";

  let stage;

  $effect(() => createBounce(stage));
</script>

<svelte:head>
  <title>xcd's website</title>
  <meta property="og:title" content="xcd's website" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://afkdev.me" />
  <meta property="og:image" content="https://afkdev.me/assets/imxcd.png" />
  <meta name="theme-color" content="#AFAFAF" />
</svelte:head>

<div class="textnstuff" hit>
  <h1>heya!</h1>
  <p>
    im xcd, and i make things. check out my work by clicking the bouncing
    things!
  </p>
</div>
<main class="logo-stage" bind:this={stage}>
  <div id="logo" class="logo-item" data-logo-item>
    <a class="logo-link" href="https://github.com/thedotun/afkdev.me">
      <img src="/assets/xcdicongreek.svg" alt="thedotun logo" />
    </a>
  </div>
  <div class="logo-item logo-item--three" data-logo-item>
    <a class="logo-link" href="/evil/" aria-label="click me trust">
      <Hypercube />
    </a>
  </div>
</main>
