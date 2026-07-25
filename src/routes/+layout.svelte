<script>
  import "../app.css";
  import { beforeNavigate } from "$app/navigation";
  import { updated } from "$app/state";

  let { children } = $props();
  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) {
      location.href = to.url.href;
    }
  });
</script>

<header class="header" hit>
  <nav class="nav" aria-label="what you're looking at right Now!">
    <a href="/">Home</a>
  </nav>
</header>

{@render children()}
