"use client"
import { redirect } from "next/navigation"
import { useEffect } from "react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (sessionStorage.getItem("regno") === null) {
            redirect("/login")
        }

        if (sessionStorage.getItem("teacher") === "yes") {
            redirect("/admin")
        }
    })
    return <>{children}</>;
}