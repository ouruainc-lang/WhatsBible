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
        // We look for "Reading 1" (Weekday) or "Reading I" (Sunday).

        const sections = [
            { key: 'Reading 1', regex: /Reading (1|I)(?![0-9I])/i }, // Match 1 or I, but not 11 or II
            { key: 'Responsorial Psalm', regex: /Responsorial Psalm/i },
            { key: 'Gospel', regex: /Gospel/i },
            { key: 'Reading 2', regex: /Reading (2|II)(?![0-9I])/i }
        ];

        // Find all headers first
        const allHeaders = $('.content-header h3.name, .content-header h2, h3, h2, h4').toArray();

        sections.forEach(section => {
            // Find the header that matches the regex
            const headerEl = allHeaders.find(el => section.regex.test($(el).text().trim()));

            if (headerEl) {
                const header = $(headerEl);
                let reference = "Unknown";
                let text = "";

                // Strategy 1: Look for parent `.innerblock` (Standard USCCB 2024+)
                // <div class="innerblock"> <div class="content-header">...</div> <div class="content-body">...</div> </div>
                const innerBlock = header.closest('.innerblock');
                if (innerBlock.length) {
                    reference = innerBlock.find('.address a').text().trim() || innerBlock.find('.address').text().trim();
                    text = innerBlock.find('.content-body').text().trim();
                }

                // Strategy 2: Look for next siblings if structure is flat
                if (!text) {
                    // Try to find address next to header
                    // Header parent might be `.content-header`
                    const contentHeader = header.closest('.content-header');
                    if (contentHeader.length) {
                        reference = contentHeader.find('.address').text().trim();
                    } else {
                        reference = header.next('.address').text().trim();
                    }

                    // Try to find content body
                    const contentBody = header.closest('.content-header').next('.content-body');
                    if (contentBody.length) {
                        text = contentBody.text().trim();
                    }
                }

                // Strategy 3: Legacy/Fallback - Header -> Address -> Content Body
                if (!text) {
                    const container = header.closest('.b-verse');
                    if (container.length) {
                        reference = container.find('.address').text().trim();
                        text = container.find('.content-body').text().trim();
                    }
                }

                // Clean up reference (sometimes has newlines)
                reference = reference.replace(/\s+/g, ' ').trim();

                // Clean up text: Collapse multiple spaces/newlines into single lines
                // We perform 2 steps:
                // 1. Replace multiple spaces/tabs within lines with single space
                // 2. Preserve Paragraphs? Actually, USCCB text is often one block.
                // For safety against large gaps:
                if (text) {
                    text = text.replace(/\s+/g, ' ').trim();
                }

                if (text) {
                    readings[section.key] = { reference, text };
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
