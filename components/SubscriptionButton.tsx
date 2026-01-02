"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SubscriptionButtonProps {
    priceId: string;
    isTrial?: boolean;
}

export function SubscriptionButton({ priceId, isTrial = false }: SubscriptionButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId,
                    isTrial,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create checkout session");
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error("Subscription Error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-primary text-white font-bold py-2.5 rounded-xl hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isTrial ? "Start Free Trial" : "Subscribe ($4.99/mo)"}
        </button>
    );
}
