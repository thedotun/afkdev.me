function recover() {
	try {
		const last = Number(sessionStorage.getItem('sk:recovered-at')) || 0;
		if (Date.now() - last < 10000) return false;
		sessionStorage.setItem('sk:recovered-at', String(Date.now()));
	} catch {
		return false;
	}

	location.reload();
	return true;
}

window.addEventListener('vite:preloadError', (event) => {
	if (recover()) event.preventDefault();
});
