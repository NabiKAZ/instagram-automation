/**
 * A sample code to login to Instagram, monitor a page, and post a comment as soon as you see a new post.
 * https://github.com/NabiKAZ/instagram-automation
 * Programmer: @NabiKAZ (https://twitter.com/NabiKAZ)
 * Channel: https://t.me/BotSorati
 */

import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

// خواندن متغییرهای محیطی
dotenv.config();

// اطلاعات کاربری اینستاگرام و سایر تنظیمات
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const doLogin = true;
const targetProfile = 'nabikaz'; // صفحه مورد نظر
const browserPath = 'C:\\Users\\Nabi\\.cache\\puppeteer\\chrome\\win64-127.0.6533.99\\chrome-win64\\chrome.exe';
const userDataDir = './user_data';
const headless = false;
const delayCheckNewPost = 5 * 1000;
const message = 'اول (:';

// تابع جداگانه برای فرمت تاریخ
const getFormattedDate = () => {
    const now = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return now.toLocaleString('en-GB', options).replace(',', ''); // فرمت: DD/MM/YYYY HH:MM:SS
};

const monitorInstagram = async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: browserPath, // مسیر کروم نصب‌شده
            headless: headless,
            userDataDir: userDataDir,
            args: [`--window-size=760,850`]
        });

        const page = await browser.newPage();
        await page.setViewport({
            width: 760, // عرض ویوپورت
            height: 850, // ارتفاع ویوپورت
        });

        // ورود به اینستاگرام
        if (doLogin) {
            await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
            await page.type('input[name="username"]', username, { delay: 100 });
            await page.type('input[name="password"]', password, { delay: 100 });
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
            ]);

            console.log(getFormattedDate(), 'Logged in to Instagram.');
        }

        let lastPostId = null;
        while (true) {
            // رفتن به صفحه هدف
            await page.goto(`https://www.instagram.com/${targetProfile}/`, { waitUntil: 'networkidle2' });

            // پیدا کردن آخرین پست
            // const postUrl = await page.evaluate(() => {
            //     const postElement = document.querySelector('article a');
            //     return postElement ? postElement.href : null;
            // });

            const links = await page.$$eval('a > div > div > img', elements => {
                return elements.map(el => el.closest('a').href);
            });
            const postUrl = links[0];

            if (postUrl && lastPostId && postUrl !== lastPostId) {
                console.log(getFormattedDate(), 'New post detected:', postUrl);

                // باز کردن پست و ارسال کامنت
                await page.goto(postUrl, { waitUntil: 'networkidle2' });
                await page.type('textarea', message, { delay: 100 });
                await page.click('textarea + div');
                console.log(getFormattedDate(), 'Reply posted!');

                lastPostId = postUrl; // به‌روزرسانی شناسه آخرین پست
            } else {
                console.log(getFormattedDate(), 'No new post detected.');
            }

            if (!lastPostId) {
                lastPostId = postUrl;
            }

            // انتظار برای چک مجدد
            await new Promise((resolve) => setTimeout(resolve, delayCheckNewPost)); // چک هر چند ثانیه
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await browser.close();
    }
};

monitorInstagram();
