const POPULAR_VERSES = [
    "John 3:16",
    "Jeremiah 29:11",
    "Philippians 4:13",
    "Romans 8:28",
    "Psalm 23:1",
    // ... more
];

// Readings follow a simple plan (e.g., one OT, one NT, one Psalm - simplified here)
const DAILY_READINGS = [
    "Genesis 1", "Genesis 2", "Genesis 3", // ... Placeholder
    "Matthew 1", "Matthew 2", "Matthew 3"
];

import { getDailyReadings } from './lectionary';

export async function getContentForToday(type: 'VER' | 'RDG', bibleVersion: string = 'NABRE') {
    if (type === 'VER') {
        return getVerseForToday();
    }

    // Logic for Reading (USCCB Lectionary)
    try {
        const today = new Date();
        const readings = await getDailyReadings(today, bibleVersion);

        // Format for simple consumption
        // We return a "text" block that composes all of them, or a structured object?
        // existing callers expect { reference, text }
        // Let's compose the text so it fits the interface, but it might be long.

        // Structure:
        // Reading 1: Ref
        // Text
        // ...

        // However, for pure data usage, we might want structure. 
        // But `getContentForToday` signature implies returning a common shape.
        // Let's return the structured object but cast/hack it or just return a rich object and let caller handle.
        // But strict typescript might complain. 
        // Let's return a "text" that is the composition, and reference is "Daily Mass Readings"

        return {
            reference: readings.title || "Daily Catholic Readings",
            text: "", // Caller should check if 'structure' exists if they want rich data, or we pack it
            structure: readings
        };
    } catch (e) {
        console.error("Failed to fetch USCCB readings", e);
        return {
            reference: "Genesis 1",
            text: "In the beginning God created the heaven and the earth..."
        }
    }
}

export async function getVerseForToday() {
    // Simple rotation based on day of year
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = Date.now() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const verseRef = POPULAR_VERSES[dayOfYear % POPULAR_VERSES.length];

    // Fetch content from API
    try {
        const res = await fetch(`https://bible-api.com/${encodeURIComponent(verseRef)}?translation=kjv`);
        const data = await res.json();
        return {
            reference: data.reference,
            text: data.text.trim()
        };
    } catch (e) {
        console.error("Failed to fetch verse", e);
        return {
            reference: "John 3:16",
            text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
        }
    }
}
