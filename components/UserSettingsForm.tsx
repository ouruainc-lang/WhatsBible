"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle, Send, Link as LinkIcon, Check } from "lucide-react";
import { toast } from 'sonner';
import Link from 'next/link';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

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
        contentPreference: user.contentPreference || "REF",
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
                toast.success(newState ? "Messages Resumed! 🎉" : "Messages Paused ⏸️");
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

    const isPhoneDirty = (formData.phoneNumber || "") !== (user.phoneNumber || "");

    const isDirty =
        formData.deliveryTime !== (user.deliveryTime || "08:00") ||
        formData.timezone !== (user.timezone || "UTC") ||
        formData.bibleVersion !== (user.bibleVersion || "KJV") ||
        formData.contentPreference !== (user.contentPreference || "VER") ||
        formData.whatsappOptIn !== user.whatsappOptIn ||
        isPhoneDirty;

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


            </div>

            <div className="pt-4 border-t border-gray-100">
                <label className={labelClasses}>WhatsApp Connection</label>

                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3 relative">
                        <div className="flex-1">
                            <PhoneInput
                                placeholder="Enter phone number"
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
                                className={`flex items-center w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all ${!['active', 'trial'].includes(user.subscriptionStatus) ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                                    }`}
                                disabled={verifying || !['active', 'trial'].includes(user.subscriptionStatus)}
                            />
                        </div>



                        {!isVerified && !verifying && (
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={loading || !formData.phoneNumber || resendTimer > 0 || !['active', 'trial'].includes(user.subscriptionStatus)}
                                    className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap justify-center"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {resendTimer > 0 ? `Wait ${resendTimer}s` : 'Verify'}
                                </button>

                                {botNumber && (
                                    <div className="text-center">
                                        <a
                                            href={`https://wa.me/${botNumber.replace(/[^\d]/g, '')}?text=no-otp`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-gray-500 hover:text-green-600 underline transition-colors w-full inline-block mt-1"
                                        >
                                            Not receiving verification code? Click here
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
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 font-medium whitespace-nowrap">
                                <CheckCircle className="w-5 h-5" />
                                Verified
                            </div>
                        )}
                    </div>

                    {!['active', 'trial'].includes(user.subscriptionStatus) && (
                        <div>
                            <Link onClick={(e) => { e.preventDefault(); document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' }); }} href="#subscription-section" className="inline-flex text-xs text-amber-600 font-semibold items-center gap-1 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                                🔒 Subscribe to enable WhatsApp delivery. 7 day Free Trial. No Credit Card. Cancel anytime.
                            </Link>
                        </div>
                    )}

                    {isVerified && (
                        <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${(user.deliveryStatus === 'active' || !user.deliveryStatus) && formData.whatsappOptIn ? 'bg-green-500' :
                                    user.deliveryStatus === 'pending_activation' ? 'bg-amber-500' : 'bg-gray-300'
                                    }`}></div>

                                <div className="flex-1">
                                    <span className="block text-sm font-medium text-gray-900">
                                        {(user.deliveryStatus === 'active' || !user.deliveryStatus) && formData.whatsappOptIn ? 'Active & Receiving Messages' :
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
                                        Pause Messages
                                    </button>
                                ) : (
                                    <a
                                        href="https://wa.me/15079365510?text=start"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-green-50 border-green-200 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-2"
                                    >
                                        <Send className="w-3 h-3" />
                                        Activate on WhatsApp
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
                    {loading ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </form >
    );
}
