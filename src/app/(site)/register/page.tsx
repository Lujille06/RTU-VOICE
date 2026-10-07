"use client";

import { RegisterForm, VerifyForm } from "@/features/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage(){
    const [step, setStep] = useState<"register" | "verify">("register");
    const router = useRouter();

    const handleAccountCreated = () => {
        console.log("onNext fired");
        setStep("verify");
    };

    const handleAccountVerified = () => {
        router.push("/login");
    }

    return(
        <div>
            {step === "register" && (
                <main>
                    <h1>Register Page</h1>
                    <RegisterForm onNext={handleAccountCreated}></RegisterForm>
                    <div> 
                        <p>Already have an account?</p>
                        <Link href="/login">Login</Link>
                    </div>
                </main>
                
            )}

            {step === "verify" && (
                <main>
                    <h1>Enter the code</h1>
                    <VerifyForm></VerifyForm>
                </main>
            )}
            
        </div>
    );
}