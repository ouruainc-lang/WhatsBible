"use strict";
import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export function FAQ() {
    const faqs = [
        {
            question: "Is this really daily?",
            answer: "Yes! Every single morning at your chosen time (e.g., 8:00 AM), we send you the daily Mass readings, a short reflection, and a prayer directly to your WhatsApp."
        },
        {
            question: "Which Bible version do you use?",
            answer: "We primarily use the NABRE (New American Bible Revised Edition), which corresponds to the standard Catholic Lectionary used in Mass in the United States."
        },
        {
            question: "Can I cancel anytime?",
            answer: "Absolutely. You can manage your subscription directly from your dashboard or simply reply STOP to any message. There are no long-term contracts."
        },
        {
            question: "Is my phone number safe?",
            answer: "Your privacy is our priority. We use Meta's official Cloud API for secure delivery, and we never share your number with third parties or advertisers."
        },
        {
            question: "Do you support other timezones?",
            answer: "Yes! You can set your preferred delivery time in your local timezone, and our system ensures you receive your reading exactly when you want it."
        }
    ];

    return (
        <section id="faq" className="py-24 bg-white">
            <div className="container px-6 mx-auto max-w-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                    <p className="text-gray-600">Everything you need to know about DailyWord.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:bg-white transition-colors duration-200">
                            <details className="group">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 text-gray-900">
                                    <span>{faq.question}</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 mt-0 px-6 pb-6 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <p>{faq.answer}</p>
                                </div>
                            </details>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
