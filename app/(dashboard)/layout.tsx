import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin");
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <Link className="flex items-center" href="/">
                        <Image
                            src="/dailywordlogo.png"
                            alt="DailyWord"
                            width={140}
                            height={40}
                            className="h-8 w-auto object-contain"
                            priority
                        />
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 hidden sm:inline-block">Logged in as {session.user?.email}</span>
                        <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                        <LogoutButton />
                    </div>
                </div>
            </header>
            <main className="pt-24 pb-12 min-h-screen">
                {children}
            </main>
        </div>
    );
}
