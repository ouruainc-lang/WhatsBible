"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface User {
    subscriptionStatus: string;
    subscriptionPlan?: string | null;
    stripeCustomerId?: string | null;
}

export function SubscriptionCard({ user }: { user: User }) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Track TikTok ViewContent on mount
        if ((window as any).ttq) {
            console.log("Firing TikTok Pixel: ViewContent");
            (window as any).ttq.track('ViewContent', {
                contents: [
                    { content_id: 'MONTHLY', content_type: 'product', price: 2.99, currency: 'USD' },
                    { content_id: 'YEARLY', content_type: 'product', price: 24.99, currency: 'USD' }
                ]
            });
        }
    }, []);

    const handleSubscription = async (plan: 'MONTHLY' | 'YEARLY') => {
        setLoading(true);
        try {
            console.log("Starting subscription process...");
            // Track Meta Pixel Event
            if ((window as any).fbq) {
                console.log("Firing Meta Pixel: InitiateCheckout");
                (window as any).fbq('track', 'InitiateCheckout');
            } else {
                console.warn("Meta Pixel (fbq) not found.");
            }

            // Track TikTok Pixel Event
            if ((window as any).ttq) {
                console.log("Firing TikTok Pixel: InitiateCheckout");
                (window as any).ttq.track('InitiateCheckout', {
                    contents: [
                        {
                            content_id: plan,
                            content_type: 'product',
                            price: plan === 'MONTHLY' ? 2.99 : 24.99,
                            currency: 'USD'
                        }
                    ]
                });
            } else {
                console.warn("TikTok Pixel (ttq) not found.");
            }

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan, // Send plan type ('MONTHLY' | 'YEARLY') to server
                    isTrial: true
                }),
            });

            if (!response.ok) throw new Error("Failed to start subscription");
            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePortal = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/stripe/portal', { method: 'POST' });
            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error("Failed to load portal");
        } finally {
            setLoading(false);
        }
    };

    const isActive = ['active', 'trial'].includes(user.subscriptionStatus);

    return (
        <div id="subscription-section" className="glass-card p-6 rounded-2xl h-full border-t-4 border-t-primary flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                    <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold font-serif">Subscription</h2>
            </div>

            <div className="space-y-6 flex-1">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Current Status</p>
                    </div>

                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${isActive
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-gray-50 text-gray-600 border border-gray-100'
                        }`}>
                        <span className="capitalize mr-2">{user.subscriptionStatus === 'trial' ? 'Free Trial' : user.subscriptionStatus}</span>
                        {isActive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                    </div>
                </div>

                {isActive ? (
                    <div className="bg-green-50/50 border border-green-100 rounded-xl p-6 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <h4 className="font-medium text-green-900">Active Plan</h4>
                        </div>
                        <p className="text-sm text-green-700/80 mb-6">
                            You are subscribed to the {user.subscriptionPlan || "Monthly"} plan.
                        </p>
                        <button
                            onClick={handlePortal}
                            disabled={loading}
                            className="w-full py-2.5 bg-white border border-green-200 text-green-700 text-sm font-medium rounded-xl hover:bg-green-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            Manage Subscription
                        </button>
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                            <h4 className="font-serif font-bold text-amber-900 mb-2 text-lg">
                                Start 7-Day Free Trial
                            </h4>
                            <p className="text-sm text-amber-800/70 mb-0">
                                Experience daily grace delivered directly to your phone. Cancel anytime.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => handleSubscription('MONTHLY')}
                                disabled={loading}
                                className="relative flex items-center justify-between p-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-primary/30 rounded-xl transition-all group text-left shadow-sm hover:shadow-md"
                            >
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 mb-0.5">Monthly</span>
                                    <span className="block text-lg font-bold text-gray-900">$2.99<span className="text-sm font-normal text-gray-400">/mo</span></span>
                                </div>
                                <div className="px-3 py-1.5 bg-gray-100 group-hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Trial"}
                                </div>
                            </button>

                            <button
                                onClick={() => handleSubscription('YEARLY')}
                                disabled={loading}
                                className="relative flex items-center justify-between p-4 bg-white hover:bg-gray-50 border border-amber-200 hover:border-amber-400 rounded-xl transition-all group text-left shadow-md hover:shadow-lg ring-1 ring-amber-100"
                            >
                                <div className="absolute -top-2.5 right-4 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    SAVE 30%
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-amber-600 mb-0.5">Yearly (Best Value)</span>
                                    <span className="block text-lg font-bold text-gray-900">$24.99<span className="text-sm font-normal text-gray-400">/yr</span></span>
                                </div>
                                <div className="px-3 py-1.5 bg-amber-100 group-hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start Trial <Sparkles className="w-3 h-3" /></>}
                                </div>
                            </button>
                        </div>

                        <p className="text-[10px] text-gray-400 text-center px-4 leading-relaxed">
                            Subscription covers server costs, WhatsApp fees, and AI features.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
