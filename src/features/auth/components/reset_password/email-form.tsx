"use client";

import { validateEmailForPwReset } from "@/actions/authActions";
import { useState } from "react";
import { type ButtonStepProps } from "../../authTypes";
import { useEmailStore } from "../../authStore";

export function EmailForm({nextStep}: ButtonStepProps){
    const [error, setError] = useState<string>("");

    const handleVerifyEmail = async (e: React.SubmitEvent<HTMLFormElement>) => {
        
        e.preventDefault();

        const data = new FormData(e.currentTarget);
        const result = await validateEmailForPwReset(data);
        console.log(result);
        // 1. Guard clause: Ensure result exists at all
        if (!result) {
            setError("An unexpected error occurred. Please try again.");
            return;
        }

        // 2. Guard clause: Handle server-side validation or database failures
        if (!result.success) {
            // This will accurately catch "Not a valid RTU institutional email" 
            // OR "Email not found" depending on what your server sends back.
            setError(result.message || "Email validation failed");
            return;
        }
        const str = (v: FormDataEntryValue | null) => (v ?? "").toString();

        useEmailStore.getState().setEmail(str(data.get("email")), "password_reset");

        // 3. Success path
        nextStep();
    }


    return (
        <div>
            <form onSubmit={handleVerifyEmail}>
                <input name="email" type="email" placeholder="Enter your institutional email"></input>
                <button type="submit">Confirm</button>
            </form>

            { error && <div>{error}</div>}
        </div>
    )
}
