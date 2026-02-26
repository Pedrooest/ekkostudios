import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        console.log("Navigating to https://ekkostudios.vercel.app/ ...");
        await page.goto('https://ekkostudios.vercel.app/', { waitUntil: 'networkidle0', timeout: 30000 });

        await new Promise(r => setTimeout(r, 2000));

        console.log("Extracting document HTML to check for white screen...");
        const text = await page.evaluate(() => document.body.innerHTML);
        if (text.includes('id="root"')) {
            const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'NO ROOT');
            console.log("ROOT HTML (first 500 chars):", rootHtml.substring(0, 500));
        }

        await browser.close();
    } catch (err) {
        console.error("Puppeteer script failed:", err);
        process.exit(1);
    }
})();
