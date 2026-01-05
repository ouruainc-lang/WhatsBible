import React from 'react';

export const metadata = {
    title: "Terms of Service | DailyWord",
};

export default function TermsOfService() {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">Terms of Service</h1>
            <p className="text-gray-500 mb-12">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

            <div className="space-y-8 text-gray-700 leading-relaxed">

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By subscribing to DailyWord’s WhatsApp Bible reading service, you agree to these Terms of Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Service Description</h2>
                    <p>
                        DailyWord provides scheduled Bible readings delivered via WhatsApp. You may view or manage your subscription and delivery preferences through our dashboard: <a href="https://dailyword.space/dashboard" className="text-primary hover:underline">https://dailyword.space/dashboard</a>.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Subscription and Payments</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Subscriptions are billed monthly or annually.</li>
                        <li>Payments are processed via Stripe or other payment providers.</li>
                        <li>We may update pricing, and you will be notified prior to changes.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>You must provide a valid WhatsApp number.</li>
                        <li>You agree not to use the service for spam or illegal purposes.</li>
                        <li>You are responsible for maintaining the confidentiality of your account credentials (if applicable).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cancellation / Termination</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>You may cancel your subscription at any time via the dashboard.</li>
                        <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>DailyWord owns the branding, website design, and any original content created by us.</li>
                        <li>Bible readings, summaries, or excerpts provided through the service are sourced from public or licensed materials. All content is provided for personal, non-commercial use.</li>
                        <li>You may use the content for personal study and reflection only; redistribution or commercial use is prohibited.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We provide the service “as is.”</li>
                        <li>We are not responsible for any indirect, incidental, or consequential damages.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>We may update these Terms occasionally.</li>
                        <li>Continued use of the service constitutes acceptance of the updated Terms.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of Malaysia.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
                    <p>
                        Questions about these Terms can be sent to <a href="mailto:support@dailyword.space" className="text-primary hover:underline">support@dailyword.space</a>
                    </p>
                </section>

            </div>
        </div>
    );
}
