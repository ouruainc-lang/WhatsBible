import React from 'react';

export const metadata = {
    title: "Privacy Policy | DailyWord",
};

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">Privacy Policy</h1>
            <p className="text-gray-500 mb-12">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

            <div className="space-y-8 text-gray-700 leading-relaxed">

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                    <p>
                        DailyWord (“we”, “our”, “us”) respects your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our WhatsApp Bible reading service and website (<a href="https://dailyword.space" className="text-primary hover:underline">https://dailyword.space</a>).
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>WhatsApp number:</strong> Required to deliver messages.</li>
                        <li><strong>Name (optional):</strong> If you provide it.</li>
                        <li><strong>Subscription information:</strong> Payment status, plan type, and preferences.</li>
                        <li><strong>Usage data:</strong> Interaction with messages (replies, clicks on dashboard links).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                    <p className="mb-2">We use your information to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Deliver Bible readings on WhatsApp.</li>
                        <li>Manage your subscription, preferences, and delivery times.</li>
                        <li>Provide customer support.</li>
                        <li>Communicate important updates about our service.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sharing Your Information</h2>
                    <p className="mb-2">We do not sell or share your personal data with third parties, except:</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Service providers</strong> (e.g., Twilio, Stripe, Supabase, Vercel) who help us operate the service.</li>
                        <li><strong>Legal compliance:</strong> if required by law.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Security</h2>
                    <p>
                        We take reasonable measures to protect your data. No system is completely secure, so we cannot guarantee absolute security.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>You may update or delete your personal data through the dashboard or by contacting <a href="mailto:support@dailyword.space" className="text-primary hover:underline">support@dailyword.space</a>.</li>
                        <li>You may unsubscribe at any time.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies / Analytics</h2>
                    <p>
                        Our website may use cookies or analytics to improve service, but WhatsApp message delivery does not require cookies.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children</h2>
                    <p>
                        Our service is not intended for children under 13. We do not knowingly collect data from children.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
                    <p>
                        Questions or concerns about this Privacy Policy can be sent to: <a href="mailto:support@dailyword.space" className="text-primary hover:underline">support@dailyword.space</a>
                    </p>
                </section>

            </div>
        </div>
    );
}
