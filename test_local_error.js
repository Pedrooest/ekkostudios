import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    let logs = [];
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => {
            logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
        });
        page.on('pageerror', err => {
            logs.push(`[PAGE ERROR] ${err.message}`);
        });

        await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 6000));

        const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || 'NO ROOT');
        logs.push(`\n--- ROOT HTML DUMP ---\n${rootHtml.substring(0, 1000)}...`);

        fs.writeFileSync('browser_logs.txt', logs.join('\n'));
        await browser.close();
    } catch (err) {
        fs.writeFileSync('browser_logs.txt', 'PUPPETEER ERROR: ' + err.message);
        process.exit(1);
    }
})();
