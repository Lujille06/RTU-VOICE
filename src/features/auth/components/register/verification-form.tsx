"use client";

import { verifyAndRegisterUser, resendOtp } from "@/actions/actions";
import { useState } from "react";

export function VerifyForm(){
    const [errorMessage, setErrorMessage] = useState<string>("");

    async function handleVerifyAccount (formData: FormData) {
        const result = await verifyAndRegisterUser(formData);
        console.log(result)

        if (!result.success){
            setErrorMessage(result.message);
        }
        
    }

    async function handleResendOtp(){
        resendOtp(1);
    }

    return (
        <div>
            <h1>Verify Account</h1>
            <form action={handleVerifyAccount}>
                <input name="first_digit" maxLength={1}></input>
                <input name="second_digit" maxLength={1}></input>
                <input name="third_digit" maxLength={1}></input>
                <input name="fourth_digit" maxLength={1}></input>
                <input name="fifth_digit" maxLength={1}></input>
                <input name="sixth_digit" maxLength={1}></input>
                <button type="submit">Submit</button>
            </form>
            <button >Resend Code</button>
        </div>
    );
}