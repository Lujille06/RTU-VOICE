"use client";
import { resetPassword } from "@/actions/authActions";
import { useState } from "react";
import { type ButtonStepProps } from "../../authTypes";

export function ResetPasswordForm({nextStep}: ButtonStepProps){
    const [errorMessage, setErrorMessage] = useState<string>("");
    
    const handleResetPassword = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const data = new FormData(e.currentTarget)
        const result = await resetPassword(data);

        if (!result){
            setErrorMessage("Error in resseting password");
            return;
        }

        if (!result.success){
            setErrorMessage(result.message);
            return;
        }
        nextStep();
    }
    return ( 
        <div>
            <form onSubmit={handleResetPassword}>
                <input name="newPassword" type="text" placeholder="New password"></input>
                <input name="confirmPassword" type="text" placeholder="Confirm password"></input>
                <button type="submit">Reset Password</button>
            </form>
            {errorMessage && <div>{errorMessage}</div>}
        </div>
        
    );
    
}