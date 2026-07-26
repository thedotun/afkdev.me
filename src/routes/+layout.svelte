<script>
  import "../app.css";
  import { beforeNavigate } from "$app/navigation";
  import { page, updated } from "$app/state"; // so that i can have just the bg, for a wallpaper, and not have the header and nav bar
  let { children } = $props();
  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) {
      location.href = to.url.href;
    }
  });
</script>

{#if page.route.id !== "/plain"}
  <header class="header" hit>
    <nav class="nav" aria-label="what you're looking at right Now!">
      <a href="/">Home</a>
    </nav>
  </header>
{/if}

{@render children()}
