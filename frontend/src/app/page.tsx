"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
    const router = useRouter();
    useEffect(() => {
        // Push to login if not logged in
        if (!sessionStorage.getItem("regno")) {
            router.push("/login");
        }

        // Push to admin or student based on role
        if (sessionStorage.getItem("regno")) {
            router.push((sessionStorage.getItem("teacher") == "yes") ? "/admin" : "/student");
        }

    }, [])
}
