"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
        </button>
    );
}
