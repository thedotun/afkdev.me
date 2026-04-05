(function () {
    const redirectTarget = document.body.dataset.redirectUrl;
    const redirectDelay = Number.parseInt(document.body.dataset.redirectDelay || "20000", 20);
    // i wish everything wasnt jsut document, i feel it should be dom but whatever
    // it works so i dont care
    if (!redirectTarget || Number.isNaN(redirectDelay) || redirectDelay < 0) {
        return;
    }

    // after the scaarry thing you need to GET OUT!
    window.setTimeout(() => {
        window.location.href = redirectTarget;
    }, redirectDelay);
}());
