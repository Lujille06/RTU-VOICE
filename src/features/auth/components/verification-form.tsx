"use client";

import { verifyAndRegisterUser, resendOtp, verifyResetOtp } from "@/actions/authActions";
import { useState } from "react";
import { type ButtonStepProps } from "../authTypes";
import * as AuthStore from '../authStore';

interface VerifyFormType {
    purpose: "registration" | "password_reset";
    nextStep: () => void
} 


export function VerifyForm({purpose, nextStep}: VerifyFormType){
    const [errorMessage, setErrorMessage] = useState<string>("");

    async function handleVerifyAccount (e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();

        const data = new FormData(e.currentTarget);
        if (purpose === "registration"){
            const result = await verifyAndRegisterUser(data, {
                email: AuthStore.useEmailStore.getState().email,
                firstName: AuthStore.useFirstNameStore.getState().firstName,
                lastName: AuthStore.useLastNameStore.getState().lastName,
                password: AuthStore.usePasswordStore.getState().password
            });
            console.log(result)

            if(!result){
                setErrorMessage("Error in registering the account");
                return;
            }

            if (!result.success){
                setErrorMessage(result.message);
                return;
            }

            AuthStore.useEmailStore.getState().reset();
            AuthStore.useFirstNameStore.getState().reset();
            AuthStore.usePasswordStore.getState().reset();
            AuthStore.useLastNameStore.getState().reset();

            nextStep();
            
        } 
        if (purpose === "password_reset") {
            const result = await verifyResetOtp(data, AuthStore.useEmailStore.getState().email);

            if (!result){
                setErrorMessage("Error in verifying account");
                return;
            }
            if (!result.success){
                setErrorMessage(result.message);
                return;
            }

            nextStep();
        }
        
    }

    async function handleResendOtp(){
        const result = await resendOtp(purpose, AuthStore.useEmailStore.getState().email);
        
        if(!result.success){
            setErrorMessage(result.message)
            return;
        }
    }

    return (
        <div>
            <h1>Verify Account</h1>
            <form onSubmit={handleVerifyAccount}>
                <input name="first_digit" maxLength={1}></input>
                <input name="second_digit" maxLength={1}></input>
                <input name="third_digit" maxLength={1}></input>
                <input name="fourth_digit" maxLength={1}></input>
                <input name="fifth_digit" maxLength={1}></input>
                <input name="sixth_digit" maxLength={1}></input>
                <button type="submit">Submit</button>
            </form>
            <button onClick={handleResendOtp}>Resend Code</button>

            {errorMessage && <div>{errorMessage}</div>}
        </div>
    );
}