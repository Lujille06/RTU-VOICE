"use client";

import { VerifyForm } from "@/features/auth";
import { EmailForm } from "@/features/auth/";
import { ResetPasswordForm } from "@/features/auth/";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage(){
    const [step, setStep] = useState<"initial" | "verify" | "reset">("initial");
    
    const router = useRouter();

    const handleValidEmail = () => {
        setStep("verify");
    }
    const handleAccountVerified = () => {
        setStep("reset");
    }

    const handleResetPassword = () => {
        router.push("/login");
    }
    return(
        <div>
            {step === "initial" && 
                <main>
                    <h1>Forgot Password</h1>
                    <EmailForm nextStep={handleValidEmail}></EmailForm>
                </main>
            }
            {step === "verify" && 
                <main>
                    <h1>Enter OTP</h1>
                    <VerifyForm purpose="password_reset" nextStep={handleAccountVerified}></VerifyForm>
                </main>
            }
            {step === "reset" && 
                <main>
                    <h1>Reset Password</h1>
                    <ResetPasswordForm nextStep={handleResetPassword}></ResetPasswordForm>
                </main>
            }
        </div>
    );
}