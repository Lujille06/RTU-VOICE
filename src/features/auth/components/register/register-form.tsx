"use client";

import { validateAndSendOtp } from "@/actions/actions";
import { useState } from "react";
import { RegisterState } from "@/actions/actions";
import * as AuthStore from "../../authStore"

interface ButtonStepProps{
    onNext: () => void;
}
export function RegisterForm({onNext} : ButtonStepProps){

    const [error, setError] = useState<RegisterState["errors"]>({});
    const setFirstName = AuthStore.useFirstNameStore((state) => state.setFirstName);

    async function handleRegisterAccount(formData: FormData){
        const result = await validateAndSendOtp(formData); // returns an object {}
        console.log(result)

        if (!result.success){
            setError(result.errors);
            return;
        }
        onNext();
    };

    return(
        
        
        <div>
            <form action={handleRegisterAccount}>
                <label htmlFor="firstName">First Name:</label>
                <input name="firstName" type="text" placeholder="Juan"></input>
                <input name="lastName" type="text" placeholder="Dela Cruz"></input>
                <input name="email" type="email" placeholder="studentId@rtu.edu.ph"></input>
                <input name="password" type="password" placeholder="Enter your password"></input>
                <input name="confirmPassword" type="password" placeholder="Enter your password"></input>
                <button type="submit">Register</button>
            </form>
            
        {error && <div>Error</div>}
        </div>
    );
}