"use client";

import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFormState } from "react-dom";

import { loginUser } from "@/app/actions/login";

export default function Login() {
	const [state, formAction] = useFormState(loginUser, null);
	const router = useRouter();


	useEffect(() => {
		if (sessionStorage.getItem("regno")) {
			router.push((sessionStorage.getItem("teacher") == "yes") ? "/admin" : "/student");
		}


		if (state?.success) {
			sessionStorage.setItem("regno", state.register)
			sessionStorage.setItem("teacher", state.isAdmin ? "yes" : "no")
			sessionStorage.setItem("name", state.name)
			router.push(state.isAdmin ? "/admin" : "/student");
		}
	}, [state, router]);
	return (
		<>
			<h1 className="text-5xl text-center p-6 font-bold">
				Lab Evaluation Application{" "}
			</h1>
			<div className="h-screen items-center">
				<div className="h-fit max-w-md mx-auto mt-20 p-6 border rounded-xl shadow">
					<h2 className="text-2xl mb-4 font-bold">Login</h2>
					<form action={formAction} className="flex flex-col gap-4">
						<Input
							type="text"
							name="register"
							placeholder="Register Number"
							className="p-2 border rounded"
						/>
						<Input
							type="password"
							name="password"
							placeholder="Password"
							className="p-2 border rounded"
						/>
						<Button type="submit">Login</Button>
						{state?.error && <p className="text-red-600">{state.error}</p>}
					</form>
				</div>
			</div>
		</>
	);
}
