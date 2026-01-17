"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle, Send, Link as LinkIcon, Check } from "lucide-react";
import { toast } from 'sonner';
import Link from 'next/link';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { dictionaries, SystemLanguage } from '@/lib/i18n/dictionaries';

interface User {
    deliveryTime: string;
    timezone: string;
    bibleVersion: string;
    systemLanguage?: string;
    contentPreference: string;
    whatsappOptIn: boolean;
    phoneNumber?: string | null;
    subscriptionStatus: string;
    subscriptionPlan?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    lastTestMessageSentAt?: Date | string | null;
    phoneVerificationCode?: string | null;
    deliveryStatus?: string | null;
}

export function UserSettingsForm({ user, botNumber }: { user: User, botNumber?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false); // UI state for entering code
    const [code, setCode] = useState("");
    // User is verified if their verification code is the sentinel "VERIFIED"
    const [isVerified, setIsVerified] = useState(user.phoneVerificationCode === "VERIFIED"); // Sentinel value check
    /*
      Migration Note: Legacy verified users (null code) will need to re-verify. 
      This is acceptable to ensure security and fix the bypass bug.
    */
    const [resendTimer, setResendTimer] = useState(0); // Cooldown in seconds

    const [formData, setFormData] = useState({
        deliveryTime: user.deliveryTime || "08:00",
        timezone: user.timezone || "UTC",
        bibleVersion: user.bibleVersion || "KJV",
        systemLanguage: user.systemLanguage || "en",
        contentPreference: user.contentPreference || "REF",
        whatsappOptIn: user.whatsappOptIn,
        phoneNumber: user.phoneNumber || "",
    });

    const sysLang = (formData.systemLanguage as SystemLanguage) || 'en';
    const d = dictionaries[sysLang] || dictionaries.en;

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Smart Language Auto-Sync
    useEffect(() => {
        const checkAutoSync = async () => {
            const hasConfigured = localStorage.getItem('dailyword-lang-configured');
            // If already configured or user already has a specific language set in DB (not default 'en'), skip
            if (hasConfigured || user.systemLanguage !== 'en') return;

            const browserLang = navigator.language.split('-')[0];
            let newLang = '';
            let newBible = '';

            if (browserLang === 'pt') {
                newLang = 'pt';
                newBible = 'almeida';
            } else if (browserLang === 'tl' || browserLang === 'fil') {
                newLang = 'tl';
                newBible = 'ABTAG2001';
            }

            if (newLang) {
                console.log(`[Auto-Sync] Detected ${newLang}, syncing defaults...`);

                // 1. Optimistic UI Update
                setFormData(prev => ({
                    ...prev,
                    systemLanguage: newLang,
                    bibleVersion: newBible
                }));

                // 2. Persist to DB
                try {
                    await fetch('/api/user', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...formData,
                            systemLanguage: newLang,
                            bibleVersion: newBible
                        })
                    });
                    toast.success("Language set to " + (newLang === 'pt' ? "Português" : "Tagalog"));
                } catch (e) {
                    console.error("Auto-sync failed", e);
                }

                // 3. Mark as configured so we don't overwrite later
                localStorage.setItem('dailyword-lang-configured', 'true');
                router.refresh();
            }
        };

        checkAutoSync();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;

        // If user manually changes language/bible, mark as explicitly configured
        if (name === 'systemLanguage' || name === 'bibleVersion') {
            localStorage.setItem('dailyword-lang-configured', 'true');
        }

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
        if (!formData.phoneNumber) return toast.error(d.ui.enterPhone);

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
                const updatedFormData = { ...formData, whatsappOptIn: true };
                setFormData(updatedFormData);

                // Auto-save: Persist verification immediately
                await fetch('/api/user', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedFormData)
                }).catch(err => console.error("Auto-save failed", err));

                router.refresh();
                toast.success("Phone Verified & Saved! ✅");
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

    const handleSubscription = async () => {
        setLoading(true);
        try {
            // Track Pixels
            if ((window as any).fbq) (window as any).fbq('track', 'InitiateCheckout');
            if ((window as any).ttq) (window as any).ttq.track('InitiateCheckout', { contents: [{ content_id: 'MONTHLY', content_type: 'product', price: 2.99, currency: 'USD' }] });

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'MONTHLY', isTrial: true }),
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



    const handleTogglePause = async () => {
        // Optimistic toggle
        const newState = !formData.whatsappOptIn;
        setFormData(prev => ({ ...prev, whatsappOptIn: newState }));

        try {
            // We save the full form with the new toggle state
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, whatsappOptIn: newState })
            });
            if (res.ok) {
                toast.success(newState ? d.messages?.resumed || "Messages Resumed!" : "Messages Paused ⏸️");
                router.refresh();
            } else {
                throw new Error("Failed");
            }
        } catch (e) {
            toast.error("Failed to update status");
            // Revert
            setFormData(prev => ({ ...prev, whatsappOptIn: !newState }));
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
                toast.success(d.ui.saved);
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

    const isPhoneDirty = (formData.phoneNumber || "") !== (user.phoneNumber || "");

    const isDirty =
        formData.deliveryTime !== (user.deliveryTime || "08:00") ||
        formData.timezone !== (user.timezone || "UTC") ||
        formData.bibleVersion !== (user.bibleVersion || "KJV") ||
        formData.systemLanguage !== (user.systemLanguage || "en") ||
        formData.contentPreference !== (user.contentPreference || "VER") ||
        formData.whatsappOptIn !== user.whatsappOptIn ||
        isPhoneDirty;

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClasses}>{d.ui.systemLanguage}</label>
                    <select
                        name="systemLanguage"
                        value={formData.systemLanguage}
                        onChange={handleChange}
                        className={inputClasses}
                    >
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                        <option value="tl">Tagalog</option>
                    </select>
                </div>

                <div>
                    <label className={labelClasses}>{d.ui.timezone}</label>
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
                    <label className={labelClasses}>{d.ui.deliveryTime}</label>
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
                    <label className={labelClasses}>{d.ui.bibleVersion}</label>
                    <select
                        name="bibleVersion"
                        value={formData.bibleVersion}
                        onChange={handleChange}
                        className={inputClasses}
                    >
                        <option value="NABRE">NABRE (USCCB) - Standard</option>
                        <option value="ABTAG2001">Ang Biblia 2001 (Tagalog)</option>
                        <option value="almeida">João Ferreira de Almeida (Portuguese)</option>
                        <option value="COMING_SOON" disabled>More versions coming soon...</option>
                    </select>
                </div>


            </div>

            <div className="pt-4 border-t border-gray-100">
                <label className={labelClasses}>{d.ui.whatsappConnection}</label>

                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 relative">
                        <div className="flex-1">
                            <PhoneInput
                                placeholder={d.ui.enterPhone}
                                value={formData.phoneNumber || ''}
                                onChange={(value?: any) => {
                                    const newValue = value || "";

                                    // If number changed from saved verified number, reset verification
                                    if (newValue !== (user.phoneNumber || "")) {
                                        setIsVerified(false);
                                        setFormData(prev => ({ ...prev, phoneNumber: newValue, whatsappOptIn: false }));
                                    } else {
                                        // If matches saved number, restore saved state
                                        setIsVerified(user.whatsappOptIn);
                                        setFormData(prev => ({ ...prev, phoneNumber: newValue, whatsappOptIn: user.whatsappOptIn }));
                                    }
                                }}
                                defaultCountry="US"
                                numberInputProps={{
                                    className: "bg-transparent border-none outline-none w-full ml-2 text-sm text-gray-900 placeholder:text-gray-400"
                                }}
                                className="flex items-center w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
                                disabled={verifying}
                            />
                        </div>



                        {!isVerified && !verifying && (
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={loading || !formData.phoneNumber || resendTimer > 0}
                                    className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap justify-center"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {resendTimer > 0 ? `Wait ${resendTimer}s` : d.ui.verify}
                                </button>

                                {botNumber && (
                                    <div className="text-center">
                                        <a
                                            href={`https://wa.me/${botNumber.replace(/[^\d]/g, '')}?text=no-otp`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-gray-500 hover:text-green-600 underline transition-colors w-full inline-block mt-1"
                                        >
                                            {d.ui.noCode}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {verifying && (
                            <div className="flex flex-col gap-2 flex-1 md:flex-none">
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
                                        {d.ui.confirm}
                                    </button>
                                </div>
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={resendTimer > 0 || loading}
                                        className="text-xs text-gray-500 hover:text-gray-900 underline disabled:no-underline disabled:text-gray-300 transition-colors"
                                    >
                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : d.ui.resend}
                                    </button>
                                </div>
                                {botNumber && (
                                    <div className="text-right mt-1">
                                        <a
                                            href={`https://wa.me/${botNumber.replace(/[^\d]/g, '')}?text=no-otp`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-gray-500 hover:text-green-600 underline transition-colors"
                                        >
                                            {d.ui.noCode}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {isVerified && (
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium whitespace-nowrap">
                                <CheckCircle className="w-5 h-5" />
                                {d.ui.verified}
                            </div>
                        )}
                    </div>

                    {!['active', 'trial', 'trialing'].includes(user.subscriptionStatus) && (
                        <div>
                            <Link onClick={(e) => { e.preventDefault(); document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' }); }} href="#subscription-section" className="inline-flex text-xs text-amber-600 font-semibold items-center gap-1 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                                {['canceled', 'past_due'].includes(user.subscriptionStatus) || user.stripeSubscriptionId // Check ID to catch returning users
                                    ? d.ui.subscriptionInactive
                                    : d.ui.clickToSubscribe}
                            </Link>
                        </div>
                    )}

                    {isVerified && (
                        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${!['active', 'trial', 'trialing'].includes(user.subscriptionStatus) ? 'bg-red-500' :
                                    (user.deliveryStatus === 'active' || !user.deliveryStatus) && formData.whatsappOptIn ? 'bg-green-500' :
                                        user.deliveryStatus === 'pending_activation' ? 'bg-amber-500' : 'bg-gray-300'
                                    }`}></div>

                                <div className="flex-1">
                                    <span className="block text-sm font-medium text-gray-900">
                                        {!['active', 'trial', 'trialing'].includes(user.subscriptionStatus) ? 'Paused (Subscription Inactive)' :
                                            (user.deliveryStatus === 'active' || !user.deliveryStatus) && formData.whatsappOptIn ? 'Active & Receiving Messages' :
                                                user.deliveryStatus === 'pending_activation' ? 'Pending Activation' :
                                                    user.deliveryStatus === 'paused_inactive' ? 'Paused (24h Timeout)' :
                                                        !formData.whatsappOptIn ? 'Paused by User' : 'Status Unknown'}
                                    </span>
                                    {user.deliveryStatus === 'pending_activation' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            <a href="https://wa.me/15079365510?text=start" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-semibold underline inline-flex items-center gap-1">
                                                Click here to Activate (Send START) <LinkIcon className="w-3 h-3" />
                                            </a>
                                        </p>
                                    )}
                                    {user.deliveryStatus === 'paused_inactive' && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            No interaction in 24h.
                                            <a href="https://wa.me/15079365510?text=start" target="_blank" rel="noopener noreferrer" className="ml-1 text-green-600 hover:text-green-700 font-semibold underline inline-flex items-center gap-1">
                                                Click to Resume (Send START) <LinkIcon className="w-3 h-3" />
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end border-t border-gray-200 pt-3">
                                {(user.deliveryStatus === 'active' || !user.deliveryStatus) && formData.whatsappOptIn ? (
                                    <button
                                        type="button"
                                        onClick={handleTogglePause}
                                        disabled={loading}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        {d.ui.pause}
                                    </button>
                                ) : (
                                    <a
                                        href="https://wa.me/15079365510?text=start"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-green-50 border-green-200 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-2"
                                    >
                                        <Send className="w-3 h-3" />
                                        {d.ui.resume}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading || !isDirty || isPhoneDirty}
                    className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    title={isPhoneDirty ? "Please verify phone number to save" : ""}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {loading ? d.ui.saving : d.ui.save}
                </button>
            </div>
        </form >
    );
}
