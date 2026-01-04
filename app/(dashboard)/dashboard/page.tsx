import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserSettingsForm } from "@/components/UserSettingsForm";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { BookOpen } from "lucide-react";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div className="container mx-auto px-6">
            <div className="mb-10">
                <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Welcome Back</h1>
                <p className="text-gray-500">Manage your daily delivery preferences and subscription.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Settings Column */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-8 rounded-2xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold font-serif">Delivery Settings</h2>
                        </div>
                        <UserSettingsForm user={user} />
                    </div>
                </div>

                {/* Subscription Column */}
                <div>
                    <SubscriptionCard user={user} />
                </div>
            </div>
        </div>
    );
}
