"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Smartphone, BookOpen, Clock, Heart, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { dictionaries, SystemLanguage } from "@/lib/i18n/dictionaries";

export function LandingPageContent() {
    const [lang, setLang] = useState<SystemLanguage>('en');
    const [isLangOpen, setIsLangOpen] = useState(false);

    useEffect(() => {
        // Load preference
        const saved = localStorage.getItem('dailyword-lang') as SystemLanguage;
        if (saved && dictionaries[saved]) {
            setLang(saved);
        } else {
            // Auto-detect browser lang? Optional.
            const browser = navigator.language.split('-')[0];
            if (browser === 'pt') setLang('pt');
            if (browser === 'tl' || browser === 'fil') setLang('tl');
        }
    }, []);

    const changeLang = (l: SystemLanguage) => {
        setLang(l);
        localStorage.setItem('dailyword-lang', l);
        setIsLangOpen(false);
    };

    const t = dictionaries[lang].landing;
    const common = dictionaries[lang];

    return (
        <div className="flex flex-col min-h-screen font-sans">
            {/* Navigation */}
            <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/50 backdrop-blur-md border-b border-white/20">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Link className="flex items-center gap-3" href="#">
                        <Image
                            src="/dailywordlogo.png"
                            alt="DailyWord Logo"
                            width={50}
                            height={50}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                        <span className="text-2xl font-serif font-bold text-gray-900 tracking-tight">DailyWord</span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex gap-8 items-center">
                        <Link className="text-sm font-medium text-gray-600 hover:text-primary transition-colors" href="#features">
                            {t.nav.features}
                        </Link>
                        <Link className="text-sm font-medium text-gray-600 hover:text-primary transition-colors" href="/dashboard">
                            {t.nav.login}
                        </Link>
                    </nav>

                    {/* Right Side Actions (Visible on Mobile) */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Language Selector */}
                        <div
                            className="relative py-2"
                            onMouseEnter={() => setIsLangOpen(true)}
                            onMouseLeave={() => setIsLangOpen(false)}
                        >
                            <button
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100/50 transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="uppercase">{lang}</span>
                            </button>

                            {/* Dropdown with padding bridge */}
                            <div className={`absolute right-0 top-full pt-2 w-32 z-50 ${isLangOpen ? 'block' : 'hidden'}`}>
                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-1">
                                    <button onClick={() => changeLang('en')} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${lang === 'en' ? 'font-bold text-primary' : 'text-gray-600'}`}>English</button>
                                    <button onClick={() => changeLang('pt')} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${lang === 'pt' ? 'font-bold text-primary' : 'text-gray-600'}`}>Português</button>
                                    <button onClick={() => changeLang('tl')} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${lang === 'tl' ? 'font-bold text-primary' : 'text-gray-600'}`}>Tagalog</button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                        >
                            {t.nav.getStarted}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-20">
                {/* Hero Section */}
                <section className="relative w-full py-20 lg:py-32 overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-100 rounded-full blur-[100px] opacity-30 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] opacity-30 translate-y-1/2 -translate-x-1/2"></div>

                    <div className="container px-6 mx-auto relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-16">

                            {/* Text Content */}
                            <div className="flex-1 text-center lg:text-left space-y-8">
                                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 bg-amber-50 mx-auto lg:mx-0">
                                    <span className="flex h-2 w-2 rounded-full bg-amber-600"></span>
                                    {t.hero.badge}
                                </div>
                                <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-gray-900">
                                    {t.hero.headline} <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500">{t.hero.subheadline}</span>
                                </h1>
                                <p className="text-lg lg:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                    {t.hero.description}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <button
                                        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                                        className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-white shadow-xl transition-all hover:bg-amber-700 hover:scale-105 active:scale-95"
                                    >
                                        {t.hero.ctaPrimary}
                                    </button>
                                    <Link
                                        href="#how-it-works"
                                        className="inline-flex h-12 items-center justify-center rounded-full bg-white border border-gray-200 px-8 text-base font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300"
                                    >
                                        {t.hero.ctaSecondary}
                                    </Link>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start pt-4 lg:pt-2">
                                    <div className="flex -space-x-3">
                                        {[
                                            "https://randomuser.me/api/portraits/women/44.jpg",
                                            "https://randomuser.me/api/portraits/men/32.jpg",
                                            "https://randomuser.me/api/portraits/women/68.jpg",
                                            "https://randomuser.me/api/portraits/men/86.jpg"
                                        ].map((src, i) => (
                                            <div key={i} className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                                                <img
                                                    src={src}
                                                    alt="User"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                        <div className="flex text-amber-400">
                                            {[1, 2, 3, 4, 5].map(s => <span key={s}>★</span>)}
                                        </div>
                                        <span>{t.hero.trusted}</span>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm font-medium text-gray-500">
                                    <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-start">
                                        {t.hero.benefits.map((benefit, i) => (
                                            <span key={i} className="flex items-center gap-1">
                                                <Check className="w-4 h-4 text-green-500" /> {benefit} <span className="hidden sm:inline text-gray-300 px-1">|</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Visual / Phone Mockup */}
                            <div className="flex-1 relative flex justify-center">
                                <div className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden z-10">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-xl z-20"></div>

                                    {/* Screen Content */}
                                    <div className="w-full h-full bg-[#E5DDD5] flex flex-col">
                                        {/* WhatsApp Header */}
                                        <div className="h-20 bg-[#008069] flex items-end pb-3 px-4 text-white shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">DW</div>
                                                <div>
                                                    <div className="font-medium text-sm">DailyWord</div>
                                                    <div className="text-[10px] opacity-80">tap for info</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chat Area */}
                                        <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                                            {/* Date Bubble */}
                                            <div className="flex justify-center">
                                                <span className="bg-[#DDD] text-gray-600 text-[10px] px-2 py-1 rounded shadow-sm">Today</span>
                                            </div>

                                            {/* Message Bubble */}
                                            <div className="bg-white p-3.5 rounded-lg rounded-tl-none shadow-sm max-w-[90%] text-sm text-gray-800 relative animate-in fade-in slide-in-from-bottom-4 duration-700 leading-relaxed font-sans">
                                                <p className="font-bold mb-2 text-gray-900">📅 {common.messages.readingHeader}</p>

                                                <p className="font-semibold text-[#d97706] mb-1 text-xs">✨ {common.messages.gospel}</p>
                                                <p className="mb-2 text-xs leading-snug text-gray-700 line-clamp-3">
                                                    Jesus brings light to those in darkness. Live in love and discern truth by the Spirit.
                                                </p>

                                                <p className="font-semibold text-blue-600 mb-1 text-xs">🕊️ Reflection</p>
                                                <p className="mb-2 text-xs leading-snug text-gray-700 line-clamp-4">
                                                    We are called to love one another (1 John 3:23). Empowered by the Holy Spirit, let us be bearers of His light to the world.
                                                </p>

                                                <p className="text-xs text-blue-500 mb-2 truncate">
                                                    {common.messages.readFull}: <span className="underline">dailyword.space/read...</span>
                                                </p>

                                                <div className="text-[10px] text-gray-400 text-right mt-1 flex justify-end gap-1 items-center border-t border-gray-100 pt-2">
                                                    DailyWord • 08:00 <Check className="w-3 h-3 text-[#008069]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative blobs behind phone */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/20 rounded-full blur-3xl -z-10 animation-pulse"></div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="py-20 bg-white">
                    <div className="container px-6 mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold font-serif mb-4">{t.howItWorks.title}</h2>
                            <p className="text-gray-600">{t.howItWorks.subtitle}</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 -z-10"></div>

                            {/* Step 1 */}
                            <div className="text-center bg-white p-6 rounded-2xl relative">
                                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg relative z-10">
                                    <span className="text-4xl font-bold text-amber-600 font-serif">1</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{t.howItWorks.step1.title}</h3>
                                <p className="mt-2 text-base leading-7 text-gray-600">
                                    {t.howItWorks.step1.desc}
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center bg-white p-6 rounded-2xl relative">
                                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg relative z-10">
                                    <span className="text-4xl font-bold text-amber-600 font-serif">2</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{t.howItWorks.step2.title}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {t.howItWorks.step2.desc}
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center bg-white p-6 rounded-2xl relative">
                                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg relative z-10">
                                    <span className="text-4xl font-bold text-amber-600 font-serif">3</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{t.howItWorks.step3.title}</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {t.howItWorks.step3.desc}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-white/50">
                    <div className="container px-6 mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold mb-4">{t.pricing.features[2]} (Features)</h2>
                            <p className="text-gray-600">{t.footer.description}</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{t.hero.featureCards.curated.title}</h3>
                                <p className="text-gray-600">{t.hero.featureCards.curated.desc}</p>
                            </div>
                            <div className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                    <Clock className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{t.hero.featureCards.schedule.title}</h3>
                                <p className="text-gray-600">{t.hero.featureCards.schedule.desc}</p>
                            </div>
                            <div className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-6">
                                    <Heart className="w-6 h-6 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{t.hero.featureCards.growth.title}</h3>
                                <p className="text-gray-600">{t.hero.featureCards.growth.desc}</p>
                            </div>
                        </div>
                    </div>
                </section>



                <section id="faq" className="py-24 bg-white">
                    <div className="container px-6 mx-auto max-w-3xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">{t.faq.title}</h2>
                            <p className="text-gray-600">{t.faq.subtitle}</p>
                        </div>

                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:bg-white transition-colors duration-200">
                                    <details className="group">
                                        <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 text-gray-900">
                                            {/* @ts-ignore */}
                                            <span>{t.faq[`q${i}`]}</span>
                                            <span className="transition group-open:rotate-180">
                                                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                            </span>
                                        </summary>
                                        <div className="text-gray-600 mt-0 px-6 pb-6 animate-in fade-in slide-in-from-top-1 duration-300">
                                            {/* @ts-ignore */}
                                            <p>{t.faq[`a${i}`]}</p>
                                        </div>
                                    </details>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
                    <div className="container px-6 mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                            <div className="md:col-span-2">
                                <Link href="/" className="inline-flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">DW</div>
                                    <span className="text-xl font-serif font-bold text-gray-900 tracking-tight">DailyWord</span>
                                </Link>
                                <div className="text-gray-500 text-sm leading-relaxed max-w-sm space-y-4">
                                    <p>{t.footer.description}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
                                <ul className="space-y-3 text-sm text-gray-600">
                                    <li><Link href="#features" className="hover:text-primary transition-colors">{t.nav.features}</Link></li>
                                    <li><Link href="#how-it-works" className="hover:text-primary transition-colors">{t.hero.ctaSecondary}</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-xs text-gray-400">
                                <p>© {new Date().getFullYear()} DailyWord. All rights reserved.</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <span>Made with</span>
                                <span className="text-red-400">♥</span>
                                <span>for the Kingdom</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </main>
        </div >
    );
}
