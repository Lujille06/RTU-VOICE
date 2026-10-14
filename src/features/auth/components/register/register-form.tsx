"use client";

import { validateAndSendOtp } from "@/actions/authActions";
import { type RegisterState } from "../../authTypes";
import { useState } from "react";
import { type ButtonStepProps } from "../../authTypes";
import * as AuthStore from '@/features/auth/authStore';

export function RegisterForm({nextStep}: ButtonStepProps){

    const [error, setError] = useState<RegisterState['errors']>({});
    const [message, setMessage] = useState<RegisterState['message']>("");

    async function handleRegisterAccount(e: React.SubmitEvent<HTMLFormElement>){
        e.preventDefault();

        const data = new FormData(e.currentTarget)
        const result = await validateAndSendOtp(data); // returns an object {}
        console.log(result)

        if (!result.success){
            setError(result.errors);
            setMessage(result.message);
            return;
        }
        const str = (v: FormDataEntryValue | null) => (v ?? "").toString();

        AuthStore.useEmailStore.getState().setEmail(str(data.get("email")), "registration");
        AuthStore.useFirstNameStore.getState().setFirstName(str(data.get("firstName")));
        AuthStore.useLastNameStore.getState().setLastName(str(data.get("lastName")));
        AuthStore.usePasswordStore.getState().setPassword(str(data.get("password")));
        nextStep();
    };

    return(        
        <div>
            <form onSubmit={handleRegisterAccount}>

                <label htmlFor="firstName">First Name:</label>
                <input name="firstName" type="text" placeholder="Juan" required></input>
                {error?.firstName && <div>{error.firstName}</div>}
                <input name="lastName" type="text" placeholder="Dela Cruz" required></input>
                {error?.lastName && <div>{error.lastName}</div>}
                <input name="email" type="email" placeholder="studentId@rtu.edu.ph" required></input>
                {error?.email && <div>{error.email}</div>}
                <input name="password" type="password" placeholder="Enter your password" required></input>
                {error?.password && <div>{error.password}</div>}
                <input name="confirmPassword" type="password" placeholder="Enter your password" required></input>
                {error?.confirmPassword && <div>{error.confirmPassword}</div>}
                
                <button type="submit">Register</button>
            </form>
            
       {error && <div>{message}</div>}
        </div>
    );
}