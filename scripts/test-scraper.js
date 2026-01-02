const { getUSCCBReadings } = require('../lib/lectionary');

async function main() {
    console.log("Testing Scraper for today...");
    const today = new Date();
    try {
        const readings = await getUSCCBReadings(today);
        console.log("Result:", JSON.stringify(readings, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
