import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
            <div className="container px-6 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                            <Image
                                src="/dailywordlogo.png"
                                alt="DailyWord Logo"
                                width={40}
                                height={40}
                                className="h-8 w-auto object-contain"
                            />
                            <span className="text-xl font-serif font-bold text-gray-900 tracking-tight">DailyWord</span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                            Bringing the Word of God to your daily life through technology.
                            Simple, beautiful, and consistent spiritual nourishment delivered to the app you use most.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link></li>
                            <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><a href="mailto:support@dailyword.space" className="hover:text-primary transition-colors">Contact: support@dailyword.space</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} DailyWord. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span>Made with</span>
                        <span className="text-red-400">♥</span>
                        <span>for the Kingdom</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
