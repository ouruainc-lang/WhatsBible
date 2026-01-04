"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle, Send, Radio, Link as LinkIcon, Check } from "lucide-react";
import { toast } from 'sonner';
import Link from 'next/link';

interface User {
    deliveryTime: string;
    timezone: string;
    bibleVersion: string;
    contentPreference: string;
    whatsappOptIn: boolean;
    phoneNumber?: string | null;
    subscriptionStatus: string;
    subscriptionPlan?: string | null;
    stripeCustomerId?: string | null;
}

export function UserSettingsForm({ user }: { user: User }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false); // UI state for entering code
    const [code, setCode] = useState("");
    const [isVerified, setIsVerified] = useState(user.whatsappOptIn);
    const [resendTimer, setResendTimer] = useState(0); // Cooldown in seconds

    const [formData, setFormData] = useState({
        deliveryTime: user.deliveryTime || "08:00",
        timezone: user.timezone || "UTC",
        bibleVersion: user.bibleVersion || "KJV",
        contentPreference: user.contentPreference || "VER",
        whatsappOptIn: user.whatsappOptIn,
        phoneNumber: user.phoneNumber || "",
    });

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;

        // If changing phone number, reset verification
        if (name === 'phoneNumber' && value !== user.phoneNumber) {
            setIsVerified(false);
            setFormData(prev => ({ ...prev, whatsappOptIn: false }));
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSendCode = async () => {
        if (!formData.phoneNumber) return toast.error("Please enter a phone number");
        setLoading(true);
        try {
            const res = await fetch('/api/user/verify-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', phoneNumber: formData.phoneNumber })
            });

            if (res.ok) {
                setVerifying(true);
                setResendTimer(60); // Start 60s cooldown
                toast.success("Verification code sent to WhatsApp!");
            } else if (res.status === 429) {
                const txt = await res.text();
                toast.error(txt); // "Please wait Xs..."
            } else {
                const txt = await res.text();
                toast.error("Failed to send code: " + txt);
            }
        } catch (e) {
            console.error(e);
            toast.error("Error sending code");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCode = async () => {
        if (!code) return toast.error("Enter code");
        setLoading(true);
        try {
            const res = await fetch('/api/user/verify-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'confirm', code })
            });
            if (res.ok) {
                setIsVerified(true);
                setVerifying(false);
                setFormData(prev => ({ ...prev, whatsappOptIn: true }));
                router.refresh(); // Refresh to get server state update
                toast.success("Phone Verified Successfully!");
            } else {
                toast.error("Invalid code or expired");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error confirming code");
        } finally {
            setLoading(false);
        }
    };

    const handleTestMessage = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/test-message', { method: 'POST' });
            if (res.ok) {
                toast.success("Test message sent! Check WhatsApp.");
            } else {
                const txt = await res.text();
                toast.error("Failed to send test: " + txt);
            }
        } catch (e) {
            console.error(e);
            toast.error("Error sending test message");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                router.refresh();
                toast.success('Settings saved successfully!');
            } else {
                toast.error('Failed to save settings');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error saving settings');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none";
    const labelClasses = "block text-sm font-semibold text-gray-700 mb-1.5";

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClasses}>Timezone</label>
                    <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className={inputClasses}
                    >
                        <option value="UTC">UTC (Universal Time)</option>
                        {Intl.supportedValuesOf('timeZone').map((tz) => {
                            try {
                                const offset = new Intl.DateTimeFormat('en-US', {
                                    timeZone: tz,
                                    timeZoneName: 'shortOffset'
                                }).formatToParts(new Date())
                                    .find(part => part.type === 'timeZoneName')?.value;

                                return (
                                    <option key={tz} value={tz}>
                                        {tz.replace(/_/g, ' ')} ({offset || 'GMT'})
                                    </option>
                                );
                            } catch (e) {
                                return (
                                    <option key={tz} value={tz}>
                                        {tz.replace(/_/g, ' ')}
                                    </option>
                                );
                            }
                        })}
                    </select>
                </div>

                <div>
                    <label className={labelClasses}>Delivery Time (Local)</label>
                    <input
                        type="time"
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={handleChange}
                        className={inputClasses}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClasses}>Bible Version</label>
                    <select
                        name="bibleVersion"
                        value={formData.bibleVersion}
                        onChange={handleChange}
                        className={inputClasses}
                    >
                        <option value="NABRE">NABRE (USCCB) - Standard</option>
                        <option value="COMING_SOON" disabled>More versions coming soon...</option>
                    </select>
                </div>

                <div>
                    <label className={labelClasses}>Content Type</label>
                    <select
                        name="contentPreference"
                        value={formData.contentPreference}
                        onChange={handleChange}
                        className={inputClasses}
                    >
                        <option value="RDG">Daily Readings (Full)</option>
                        <option value="REF">Summary & Reflection (AI)</option>
                    </select>
                    {formData.contentPreference === 'RDG' && (
                        <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                            Note: Full readings may be truncated due to WhatsApp limits. A link to the full text will be included.
                        </p>
                    )}
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <label className={labelClasses}>WhatsApp Connection</label>

                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 relative">
                        <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="+1234567890"
                            value={formData.phoneNumber || ''}
                            onChange={handleChange}
                            className={`${inputClasses} ${!['active', 'trial'].includes(user.subscriptionStatus) ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                            disabled={verifying || !['active', 'trial'].includes(user.subscriptionStatus)}
                        />

                        {!isVerified && !verifying && (
                            <button
                                type="button"
                                onClick={handleSendCode}
                                disabled={loading || !formData.phoneNumber || resendTimer > 0 || !['active', 'trial'].includes(user.subscriptionStatus)}
                                className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {resendTimer > 0 ? `Wait ${resendTimer}s` : 'Verify'}
                            </button>
                        )}

                        {!['active', 'trial'].includes(user.subscriptionStatus) && (
                            <div className="absolute -bottom-10 left-0 w-full md:w-auto z-10">
                                <Link onClick={(e) => { e.preventDefault(); document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' }); }} href="#subscription-section" className="text-xs text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                                    🔒 Subscribe to enable WhatsApp delivery
                                </Link>
                            </div>
                        )}

                        {verifying && (
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className={inputClasses + " text-center tracking-widest font-mono min-w-[140px]"}
                                        maxLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleConfirmCode}
                                        disabled={loading}
                                        className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        Confirm
                                    </button>
                                </div>
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={resendTimer > 0 || loading}
                                        className="text-xs text-gray-500 hover:text-gray-900 underline disabled:no-underline disabled:text-gray-300 transition-colors"
                                    >
                                        {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Code"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isVerified && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium whitespace-nowrap">
                                <CheckCircle className="w-5 h-5" />
                                Verified
                            </div>
                        )}
                    </div>

                    {isVerified && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${formData.whatsappOptIn ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className="text-sm text-gray-700">
                                    {formData.whatsappOptIn ? 'Daily Messages Active' : 'Messages Paused'}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={handleTestMessage}
                                disabled={loading}
                                className="text-sm text-gray-600 hover:text-gray-900 font-medium underline inline-flex items-center gap-1"
                            >
                                <Radio className="w-3 h-3" />
                                Send Test
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {loading ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </form>
    );
}
