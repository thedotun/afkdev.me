<script>
  import "../../lib/evil.css";

  const redirectTarget = "https://www.youtube.com/shorts/tzD9OxAHtzU";
  // is et it to five minutes instead of 20 seconds
  const redirectDelay = 20000;

  $effect(() => {
    document.body.classList.add("evil");

    // after the scaarry thing you need to GET OUT!
    const timeoutId = window.setTimeout(() => {
      window.location.href = redirectTarget;
    }, redirectDelay);

    return () => {
      document.body.classList.remove("evil");
      window.clearTimeout(timeoutId);
    };
  });
</script>

<svelte:head>
  <title>xcd's Evil website</title>
  <meta property="og:title" content="xcd's evil website" />
  <meta
    property="og:description"
    content="I'm evil xcd... Don't check out my website..."
  />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://afkdev.me/evil/" />
  <meta
    property="og:image"
    content="https://afkdev.me/assets/imevildotun.png"
  />
  <meta
    property="og:image:secure_url"
    content="https://afkdev.me/assets/imevildotun.png"
  />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1440" />
  <meta property="og:image:height" content="718" />
</svelte:head>

<div class="textnstuff" hit>
  <h1>you SHOULDN'T Be Here...</h1>
</div>
