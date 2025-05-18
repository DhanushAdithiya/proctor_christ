"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (sessionStorage.getItem("regno") === null) {
      redirect("/login");
    }

    if (sessionStorage.getItem("teacher") === "no") {
      redirect("/student");
    }
  });
  return <>{children}</>;
}
