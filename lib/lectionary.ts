import * as cheerio from 'cheerio';

export interface DailyReading {
    title: string;
    reading1: ReadingContent;
    psalm: ReadingContent;
    gospel: ReadingContent;
    reading2?: ReadingContent; // Sundays often have 2nd reading
}

export interface ReadingContent {
    reference: string;
    text: string;
}

export async function getUSCCBReadings(date: Date): Promise<DailyReading> {
    // Format date as MMDDYY for USCCB URL
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);

    const url = `https://bible.usccb.org/bible/readings/${mm}${dd}${yy}.cfm`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch USCCB: ${res.statusText}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        const title = $('.content-header h2').first().text().trim() || "Daily Readings";

        const readings: any = {};

        // Helper to find content block
        // USCCB structure varies but typically blocks are separated relative to headers.
        // We look for "Reading 1", "Gospel", "Responsorial Psalm"

        // This selector strategy is an approximation based on common USCCB structure.
        // They often use specific classes or just grouping divs.
        // Based on analysis, headers are often h3 or h4 within a content area.

        const sections = ['Reading 1', 'Responsorial Psalm', 'Gospel', 'Reading 2'];

        sections.forEach(sectionName => {
            // Find the element containing the section name
            // Often <h3 class="name">Reading 1</h3>
            const header = $(`h3:contains("${sectionName}")`).first();

            if (header.length) {
                // The reference is usually in the next block or inside the header area
                // The text follows.
                // This is tricky without exact DOM inspection, but let's try a generic approach

                // Reference link is often an <a> tag nearby
                // Text is in <div class="content-body"> or similar

                // Let's try to grab the "address" (reference) and "content-body" (text)
                // Note: USCCB HTML structure changes. 
                // Current observation:
                // <div class="b-verse"> ... <h3>Reading 1</h3> ... <div class="address"><a href="...">REF</a></div> ... <div class="content-body">TEXT</div> </div>

                const container = header.closest('.b-verse'); // "b-verse" is a common wrapper class on USCCB for readings

                if (container.length) {
                    const reference = container.find('.address a').text().trim() || container.find('.address').text().trim();
                    const text = container.find('.content-body').text().trim();
                    readings[sectionName] = { reference, text };
                } else {
                    // Fallback: try next siblings if not wrapped nicely
                    const reference = header.next('.address').text().trim();
                    const text = header.nextAll('.content-body').first().text().trim();
                    readings[sectionName] = { reference, text };
                }
            }
        });

        // Construct result
        return {
            title,
            reading1: readings['Reading 1'] || { reference: "Unknown", text: "Could not fetch Reading 1" },
            psalm: readings['Responsorial Psalm'] || { reference: "Unknown", text: "Could not fetch Psalm" },
            gospel: readings['Gospel'] || { reference: "Unknown", text: "Could not fetch Gospel" },
            reading2: readings['Reading 2'] // Optional
        };

    } catch (e) {
        console.error("Scraper Error", e);
        // Fallback or re-throw
        throw e;
    }
}
