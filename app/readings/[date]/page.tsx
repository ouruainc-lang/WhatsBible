import { getUSCCBReadings } from "@/lib/lectionary";
import { ArrowLeft, BookOpen, ScrollText, Music, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ date: string }>;
}

export default async function ReadingPage(props: PageProps) {
    const params = await props.params; // Await params (Next.js 15+ requirement)
    const { date } = params;

    // Validate and parse date (YYYY-MM-DD or similar)
    // Note: new Date("2025-01-04") handles dashes.
    const activeDate = new Date(date);
    if (isNaN(activeDate.getTime())) {
        return notFound();
    }

    let readings;
    try {
        readings = await getUSCCBReadings(activeDate);
    } catch (error) {
        console.error("Failed to fetch readings", error);
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-serif text-amber-900 mb-2">Readings Unavailable</h2>
                <p className="text-stone-600 mb-6">We couldn't load the readings for this date. Please try again later.</p>
                <Link href="/dashboard" className="text-amber-700 hover:underline">Return to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-serif text-stone-800">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-100">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="p-2 -ml-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-sm font-bold tracking-wide uppercase text-amber-900/60">Daily Readings</h1>
                        <p className="text-xs text-stone-500 font-sans">
                            {activeDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                    </div>
                    <div className="w-9"></div> {/* Spacer for alignment */}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-10 space-y-12">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-amber-950 mb-4 leading-tight">
                        {readings.title}
                    </h2>
                    <div className="w-16 h-1 bg-amber-200 mx-auto rounded-full"></div>
                </div>

                {/* Reading 1 */}
                <section className="relative">
                    <div className="absolute -left-3 top-0 md:-left-12 opacity-10 text-amber-900">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-amber-800 uppercase tracking-wider text-xs mb-1">First Reading</h3>
                        <p className="text-stone-500 font-sans text-sm">{readings.reading1.reference}</p>
                    </div>
                    <div className="prose prose-stone prose-lg leading-relaxed text-stone-800 md:text-xl">
                        {readings.reading1.text}
                    </div>
                </section>

                <hr className="border-stone-200 my-8 w-1/2 mx-auto" />

                {/* Psalm */}
                <section className="relative">
                    <div className="absolute -left-3 top-0 md:-left-12 opacity-10 text-amber-900">
                        <Music className="w-8 h-8" />
                    </div>
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-amber-800 uppercase tracking-wider text-xs mb-1">Responsorial Psalm</h3>
                        <p className="text-stone-500 font-sans text-sm">{readings.psalm.reference}</p>
                    </div>
                    <div className="prose prose-stone prose-lg leading-relaxed text-stone-800 md:text-xl italic pl-4 border-l-4 border-amber-100">
                        {readings.psalm.text}
                    </div>
                </section>

                <hr className="border-stone-200 my-8 w-1/2 mx-auto" />

                {/* Second Reading (Optional) */}
                {readings.reading2 && (
                    <>
                        <section className="relative">
                            <div className="absolute -left-3 top-0 md:-left-12 opacity-10 text-amber-900">
                                <ScrollText className="w-8 h-8" />
                            </div>
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-amber-800 uppercase tracking-wider text-xs mb-1">Second Reading</h3>
                                <p className="text-stone-500 font-sans text-sm">{readings.reading2.reference}</p>
                            </div>
                            <div className="prose prose-stone prose-lg leading-relaxed text-stone-800 md:text-xl">
                                {readings.reading2.text}
                            </div>
                        </section>
                        <hr className="border-stone-200 my-8 w-1/2 mx-auto" />
                    </>
                )}


                {/* Gospel */}
                <section className="relative bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-100 ring-1 ring-amber-50">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 p-2 rounded-full ring-4 ring-white">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-center mb-6 mt-2">
                        <h3 className="text-lg font-bold text-amber-800 uppercase tracking-wider text-xs mb-1">The Holy Gospel</h3>
                        <p className="text-stone-500 font-sans text-sm">{readings.gospel.reference}</p>
                    </div>
                    <div className="prose prose-stone prose-xl leading-relaxed text-stone-900 font-medium">
                        {readings.gospel.text}
                    </div>
                </section>

                <div className="text-center pt-10 pb-20">
                    <p className="text-stone-400 text-sm font-sans italic">Source: USCCB</p>
                </div>
            </main>
        </div>
    );
}
