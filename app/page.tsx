import Link from "next/link";
import Image from "next/image";
import { Check, Smartphone, BookOpen, Clock, Heart } from "lucide-react";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
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
          <nav className="hidden md:flex gap-8">
            <Link className="text-sm font-medium text-gray-600 hover:text-primary transition-colors" href="#features">
              Features
            </Link>
            <Link className="text-sm font-medium text-gray-600 hover:text-primary transition-colors" href="#pricing">
              Pricing
            </Link>
            <Link className="text-sm font-medium text-gray-600 hover:text-primary transition-colors" href="/dashboard">
              Login
            </Link>
          </nav>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
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
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-gray-900">
                  Daily Grace, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500">Delivered.</span>
                </h1>
                <p className="text-lg lg:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Start your morning with purpose. Receive a hand-picked, spiritually uplifting Bible verse or reading directly to your WhatsApp every day.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-white shadow-xl transition-all hover:bg-amber-700 hover:scale-105 active:scale-95"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-white border border-gray-200 px-8 text-base font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300"
                  >
                    How it Works
                  </Link>
                </div>
                <div className="pt-4 flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-500">
                  {/* <Check className="w-4 h-4 text-green-500" /> No credit card required for trial */}
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
                        <p className="font-bold mb-2 text-gray-900">📅 Daily Bible Summary</p>

                        <p className="font-semibold text-[#d97706] mb-1 text-xs">✨ The Word</p>
                        <p className="mb-2 text-xs leading-snug text-gray-700 line-clamp-3">
                          Jesus brings light to those in darkness. Live in love and discern truth by the Spirit.
                        </p>

                        <p className="font-semibold text-blue-600 mb-1 text-xs">🕊️ Reflection</p>
                        <p className="mb-2 text-xs leading-snug text-gray-700 line-clamp-4">
                          We are called to love one another (1 John 3:23). Empowered by the Holy Spirit, let us be bearers of His light to the world.
                        </p>

                        <p className="font-semibold text-purple-600 mb-1 text-xs">🙏 Prayer</p>
                        <p className="mb-2 text-xs leading-snug text-gray-700">
                          Lord, let us live in Your love and be Your light. Amen.
                        </p>

                        <p className="text-xs text-blue-500 mb-2 truncate">
                          Read full: <span className="underline">dailyword.space/read...</span>
                        </p>

                        <div className="text-[10px] text-gray-400 text-right mt-1 flex justify-end gap-1 items-center border-t border-gray-100 pt-2">
                          DailyWord • 08:00 AM <Check className="w-3 h-3 text-[#008069]" />
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

        {/* Features Section */}
        <section id="features" className="py-20 bg-white/50">
          <div className="container px-6 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Designed for your Spiritual Walk</h2>
              <p className="text-gray-600">Simple, consistent, and distraction-free. The easiest way to keep Scripture close to your heart.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Curated Content</h3>
                <p className="text-gray-600 leading-relaxed">
                  Choose between a daily inspirational verse or standard Lectionary readings (USCCB).
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Your Schedule</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set the exact time you want to receive your message. Morning routine? Lunch break? Evening reflection? You decide.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-8 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-6">
                  <Heart className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Spiritual Growth</h3>
                <p className="text-gray-600 leading-relaxed">
                  Consistent engagement with the Word helps build a lasting habit of faith and reflection.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container px-6 mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">Simple, Transparent Pricing</h2>
            <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">

              {/* Monthly Plan */}
              <div className="glass-card p-8 rounded-3xl border border-gray-100 hover:shadow-xl transition-all">
                <h3 className="text-2xl font-bold text-gray-900">Monthly</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">$2.99</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="mt-4 text-gray-500 text-sm">Cancel anytime.</p>
                <Link href="/dashboard" className="block w-full py-3 px-4 mt-8 bg-white border-2 border-gray-200 text-gray-900 font-bold rounded-xl text-center hover:border-gray-900 transition-colors">
                  Start 7-Day Trial
                </Link>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center text-gray-600"><Check className="w-5 h-5 text-green-500 mr-3" /> Daily WhatsApp Messages</li>
                  <li className="flex items-center text-gray-600"><Check className="w-5 h-5 text-green-500 mr-3" /> Custom Delivery Time</li>
                  <li className="flex items-center text-gray-600"><Check className="w-5 h-5 text-green-500 mr-3" /> Lectionary or Daily Verses</li>
                </ul>
              </div>

              {/* Yearly Plan */}
              <div className="glass-card p-8 rounded-3xl border-2 border-primary/20 relative shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">BEST VALUE</div>
                <h3 className="text-2xl font-bold text-gray-900">Yearly</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">$24.99</span>
                  <span className="text-gray-500">/yr</span>
                </div>
                <p className="mt-4 text-green-600 font-medium text-sm">Save 30% vs Monthly</p>
                <Link href="/dashboard" className="block w-full py-3 px-4 mt-8 bg-primary text-white font-bold rounded-xl text-center hover:bg-amber-700 transition-colors shadow-lg hover:shadow-xl hover:scale-[1.02] transform duration-200">
                  Start Yearly Plan
                </Link>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center text-gray-600"><Check className="w-5 h-5 text-green-500 mr-3" /> All Monthly Features</li>
                  <li className="flex items-center text-gray-600"><Check className="w-5 h-5 text-green-500 mr-3" /> Priority Support</li>
                  <li className="flex items-center text-gray-600"><Check className="w-5 h-5 text-green-500 mr-3" /> Early Access to New Features</li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
