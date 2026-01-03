"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ManageSubscriptionButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleManage = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/stripe/portal", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to create portal session");
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleManage}
            disabled={isLoading}
            className="text-red-500 text-xs hover:text-red-600 font-medium hover:underline inline-flex items-center gap-2"
        >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            {isLoading ? "Redirecting..." : "Cancel / Manage Subscription"}
        </button>
    );
}
