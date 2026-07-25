<script>
    import '../app.css';

    let { children } = $props();
</script>

<header class="header" hit>
    <nav class="nav" aria-label="what you're looking at right Now!">
        <a href="/">Home</a>
    </nav>
</header>

{@render children()}
