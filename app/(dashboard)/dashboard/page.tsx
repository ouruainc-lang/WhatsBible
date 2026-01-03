import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserSettingsForm } from "@/components/UserSettingsForm";
import { SubscriptionButton } from "@/components/SubscriptionButton";
import { ManageSubscriptionButton } from "@/components/ManageSubscriptionButton";
import { BookOpen, CreditCard } from "lucide-react";

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
                    <div className="glass-card p-8 rounded-2xl h-full border-t-4 border-t-primary">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold font-serif">Subscription</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Current Status</p>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.subscriptionStatus === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    <span className="capitalize mr-2">{user.subscriptionStatus}</span>
                                    {user.subscriptionStatus === 'active' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                                </div>

                            </div>

                            {(user.subscriptionStatus === 'inactive' || user.subscriptionStatus === 'canceled') && (
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <h4 className="font-bold text-amber-900 mb-2">
                                        {user.subscriptionStatus === 'canceled' ? 'Re-subscribe' : 'Unlock Full Access'}
                                    </h4>
                                    <p className="text-sm text-amber-800/80 mb-4">Subscribe to start receiving your daily spiritual nourishment.</p>
                                    <SubscriptionButton
                                        priceId={process.env.STRIPE_PRICE_ID_MONTHLY || ""}
                                    />
                                </div>
                            )}

                            {user.subscriptionStatus === 'active' && (
                                <div className="text-center pt-4">
                                    <ManageSubscriptionButton />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
