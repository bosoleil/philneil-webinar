const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    console.log('Opening page...');
    await page.goto('https://webinar.founderscompass.com/watch.html', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });

    console.log('Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Take screenshot of pre-join screen
    await page.screenshot({ path: 'screenshot-prejoin.png', fullPage: true });
    console.log('Saved pre-join screenshot');

    // Fill in name and join
    console.log('Filling in name...');
    await page.fill('#userName', 'Test User');

    console.log('Clicking join...');
    await page.click('#joinBtn');

    // Wait for Zoom to load
    console.log('Waiting for Zoom to load...');
    await page.waitForTimeout(10000);

    // Take screenshot
    await page.screenshot({ path: 'screenshot-meeting.png', fullPage: true });
    console.log('Saved meeting screenshot');

    // Check what elements are visible
    const zoomRoot = await page.$('#zmmtg-root');
    const isActive = await zoomRoot?.evaluate(el => el.classList.contains('active'));
    console.log('Zoom root active:', isActive);

    const zoomRootBounds = await zoomRoot?.boundingBox();
    console.log('Zoom root bounds:', zoomRootBounds);

    // Check for toolbar
    const toolbar = await page.$('#zmmtg-root [class*="footer"]');
    const toolbarBounds = await toolbar?.boundingBox();
    console.log('Toolbar bounds:', toolbarBounds);

    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for 60 seconds for manual inspection...');
    await page.waitForTimeout(60000);

    await browser.close();
})();
