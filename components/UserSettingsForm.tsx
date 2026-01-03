"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

interface User {
    deliveryTime: string;
    timezone: string;
    bibleVersion: string;
    contentPreference: string;
    whatsappOptIn: boolean;
    phoneNumber?: string | null;
}

export function UserSettingsForm({ user }: { user: User }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        deliveryTime: user.deliveryTime || "08:00",
        timezone: user.timezone || "UTC",
        bibleVersion: user.bibleVersion || "KJV",
        contentPreference: user.contentPreference || "VER",
        whatsappOptIn: user.whatsappOptIn,
        phoneNumber: user.phoneNumber,
    });

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: any) => {
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
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving settings');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none";
    const labelClasses = "block text-sm font-semibold text-gray-700 mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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

                        <optgroup label="Popular">
                            <option value="Asia/Singapore">Singapore / Malaysia (GMT+8)</option>
                            <option value="America/New_York">Eastern Time - US & Canada (GMT-5)</option>
                            <option value="America/Los_Angeles">Pacific Time - US & Canada (GMT-8)</option>
                            <option value="Europe/London">London (GMT+0)</option>
                        </optgroup>

                        <optgroup label="All Timezones">
                            <option value="Pacific/Midway">(GMT-11:00) Midway Island, Samoa</option>
                            <option value="Pacific/Honolulu">(GMT-10:00) Hawaii</option>
                            <option value="America/Anchorage">(GMT-09:00) Alaska</option>
                            <option value="America/Los_Angeles">(GMT-08:00) Pacific Time (US & Canada)</option>
                            <option value="America/Denver">(GMT-07:00) Mountain Time (US & Canada)</option>
                            <option value="America/Chicago">(GMT-06:00) Central Time (US & Canada)</option>
                            <option value="America/New_York">(GMT-05:00) Eastern Time (US & Canada)</option>
                            <option value="America/Halifax">(GMT-04:00) Atlantic Time (Canada)</option>
                            <option value="America/Sao_Paulo">(GMT-03:00) Brasilia</option>
                            <option value="Atlantic/Azores">(GMT-01:00) Azores</option>
                            <option value="Europe/London">(GMT+00:00) London, Dublin, Lisbon</option>
                            <option value="Europe/Paris">(GMT+01:00) Paris, Berlin, Rome, Madrid</option>
                            <option value="Europe/Istanbul">(GMT+03:00) Istanbul, Moscow</option>
                            <option value="Asia/Dubai">(GMT+04:00) Dubai, Abu Dhabi</option>
                            <option value="Asia/Karachi">(GMT+05:00) Islamabad, Karachi</option>
                            <option value="Asia/Kolkata">(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                            <option value="Asia/Dhaka">(GMT+06:00) Dhaka, Astana</option>
                            <option value="Asia/Bangkok">(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
                            <option value="Asia/Singapore">(GMT+08:00) Kuala Lumpur, Singapore</option>
                            <option value="Asia/Hong_Kong">(GMT+08:00) Hong Kong, Beijing</option>
                            <option value="Asia/Tokyo">(GMT+09:00) Osaka, Sapporo, Tokyo</option>
                            <option value="Australia/Sydney">(GMT+10:00) Canberra, Melbourne, Sydney</option>
                            <option value="Pacific/Auckland">(GMT+12:00) Auckland, Wellington</option>
                        </optgroup>
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
                    <p className="text-xs text-gray-400 mt-1.5 ml-1">Messages are checked every minute.</p>
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
                        <option value="KJV">King James Version (KJV)</option>
                        <option value="ASV">American Standard Version (ASV)</option>
                        <option value="WEB">World English Bible (WEB)</option>
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
                        <option value="VER">Daily Verse (One Verse)</option>
                        <option value="RDG">Daily Reading (Passage)</option>
                    </select>
                </div>
            </div>

            <div className="pt-2 border-t border-gray-100 mt-4">
                <label className={labelClasses}>WhatsApp Connection</label>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="tel"
                            name="phoneNumber"
                            placeholder="+1234567890"
                            value={formData.phoneNumber || ''}
                            onChange={handleChange}
                            className={inputClasses}
                        />
                        <p className="text-xs text-gray-400 mt-1.5 ml-1">Must include country code (e.g. +1 for US)</p>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 px-4 rounded-xl border border-gray-100">
                        <input
                            type="checkbox"
                            name="whatsappOptIn"
                            checked={formData.whatsappOptIn}
                            onChange={handleChange}
                            id="whatsappOptIn"
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="whatsappOptIn" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Enable Messages</label>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {loading ? 'Saving Changes...' : 'Save Settings'}
                </button>
            </div>
        </form>
    );
}
