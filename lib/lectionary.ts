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

export async function getDailyReadings(date: Date, bibleVersion: string = 'NABRE'): Promise<DailyReading> {
    // 1. Always get USCCB references first (Source of Truth for "What to read")
    const usccb = await getUSCCBReadings(date);

    // 2. If standard version, return USCCB directly
    if (bibleVersion === 'NABRE' || bibleVersion === 'USCCB') {
        return usccb;
    }

    // 3. If "ABTAG2001" (Tagalog), scrape BibleGateway
    if (bibleVersion === 'ABTAG2001') {
        console.log(`[LECTIONARY] Fetching Tagalog (ABTAG2001) for ${date.toISOString()}...`);

        // Parallel fetch for speed
        const [r1, psalm, r2, gospel] = await Promise.all([
            fetchFromBibleGateway(usccb.reading1.reference, 'ABTAG2001'),
            fetchFromBibleGateway(usccb.psalm.reference, 'ABTAG2001'),
            usccb.reading2 ? fetchFromBibleGateway(usccb.reading2.reference, 'ABTAG2001') : Promise.resolve(null),
            fetchFromBibleGateway(usccb.gospel.reference, 'ABTAG2001')
        ]);

        return {
            title: usccb.title,
            reading1: { reference: usccb.reading1.reference, text: r1 || usccb.reading1.text },
            psalm: { reference: usccb.psalm.reference, text: psalm || usccb.psalm.text },
            reading2: (usccb.reading2 && r2) ? { reference: usccb.reading2.reference, text: r2 } : usccb.reading2,
            gospel: { reference: usccb.gospel.reference, text: gospel || usccb.gospel.text }
        };
    }

    // 4. "almeida" (Portuguese) - Use bible-api.com
    if (bibleVersion === 'almeida') {
        console.log(`[LECTIONARY] Fetching Portuguese (almeida) for ${date.toISOString()}...`);

        const [r1, psalm, r2, gospel] = await Promise.all([
            fetchFromBibleApi(usccb.reading1.reference, 'almeida'),
            fetchFromBibleApi(usccb.psalm.reference, 'almeida'),
            usccb.reading2 ? fetchFromBibleApi(usccb.reading2.reference, 'almeida') : Promise.resolve(null),
            fetchFromBibleApi(usccb.gospel.reference, 'almeida')
        ]);

        return {
            title: usccb.title,
            reading1: { reference: usccb.reading1.reference, text: r1 || usccb.reading1.text },
            psalm: { reference: usccb.psalm.reference, text: psalm || usccb.psalm.text },
            reading2: (usccb.reading2 && r2) ? { reference: usccb.reading2.reference, text: r2 } : usccb.reading2,
            gospel: { reference: usccb.gospel.reference, text: gospel || usccb.gospel.text }
        };
    }

    return usccb;
}

async function fetchFromBibleGateway(reference: string, version: string): Promise<string | null> {
    if (!reference || reference === 'Unknown') return null;

    const query = encodeURIComponent(reference);
    const url = `https://www.biblegateway.com/passage/?search=${query}&version=${version}`;

    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; WhatsBible/1.0)' } });
        if (!res.ok) return null;

        const html = await res.text();
        const $ = cheerio.load(html);

        let text = '';
        $('.passage-content').each((_, el) => {
            // Remove unwanted elements:
            // - footnotes/crossrefs/superscripts
            // - chapter/verse numbers
            // - headers (titles like "Pinagaling...")
            // - "Read full chapter" links
            $(el).find('.crossreference, .footnote, .sup, .chapternum, .versenum, h1, h2, h3, h4, h5, h6, .full-chap-link, .passage-bottom, .footnotes').remove();

            text += $(el).text() + ' ';
        });

        return text.replace(/\s+/g, ' ').trim();
    } catch (e) {
        console.error(`[BG SCRAPER] Failed to fetch ${reference}`, e);
        return null;
    }
}

async function fetchFromBibleApi(reference: string, version: string): Promise<string | null> {
    if (!reference || reference === 'Unknown') return null;

    // PATCH: bible-api.com 'almeida' requires "Salmos" instead of "Psalm"
    if (version === 'almeida') {
        reference = reference.replace(/Psalms?/i, 'Salmos');
    }

    // PATCH: bible-api.com rejects verse suffixes like "22a" (Returns 404)
    // We strip single lowercase letters immediately following digits.
    // Safe for "1 Samuel" (Uppercase S)
    reference = reference.replace(/(\d+)[a-z]/g, '$1');

    const query = encodeURIComponent(reference);
    const url = `https://bible-api.com/${query}?translation=${version}`;

    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; WhatsBible/1.0)' } });
        if (!res.ok) return null;

        const data = await res.json();
        if (data.text) {
            return data.text.replace(/\s+/g, ' ').trim();
        }
        return null;
    } catch (e) {
        console.error(`[BIBLE-API] Failed to fetch ${reference}`, e);
        return null;
    }
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
                    text = cleanText(innerBlock.find('.content-body'));
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
                        text = cleanText(contentBody);
                    }
                }

                // Strategy 3: Legacy/Fallback - Header -> Address -> Content Body
                if (!text) {
                    const container = header.closest('.b-verse');
                    if (container.length) {
                        reference = container.find('.address').text().trim();
                        text = cleanText(container.find('.content-body'));
                    }
                }

                // Clean up reference (sometimes has newlines)
                reference = reference.replace(/\s+/g, ' ').trim();

                // Text is already cleaned by cleanText helper
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

// Helper: Extract text with proper spacing between block elements
function cleanText($el: any): string {
    if (!$el || !$el.length) return "";

    // Clone to avoid mutation side-effects on the passed reference if reused (though we only read mostly)
    // We only need shallow clone of the wrapper, but deep structure.
    // Cheerio's clone is deep by default.
    const clone = $el.clone();

    // Replace common block breaks with a space to ensure separation
    clone.find('br').replaceWith(' ');
    clone.find('p, div, h1, h2, h3, h4, h5, h6, li').after(' ');

    // Get text and normalize whitespace
    // collapsed into single spaces
    return clone.text().replace(/\s+/g, ' ').trim();
}
