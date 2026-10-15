"use client";

import { ChangePassword } from "@/actions/authActions";
import { useState } from "react";
import { ChangePasswordType } from "@/features/auth/authTypes";

export default function ChangePasswordForm(){
    const [error, setError] = useState<ChangePasswordType["errors"]>({});
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<ChangePasswordType["message"]>("");
    
    const handleChangePasswordSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const data = new FormData(form);

        const result = await ChangePassword(data);

        if (!result){
            setErrorMessage("Error in updating password. Please try again.");
        }

        if(!result.success){
            setError(result.errors)
            setErrorMessage(result.message);
        }

        setSuccessMessage("Successfully updated your password");
        form.reset();
    }

    return (
        <form onSubmit={handleChangePasswordSubmit}>
            {successMessage && <div>{successMessage}</div>}
            <label htmlFor="oldPassword">Old Password</label>
            <input name="oldPassword" type="text" required></input>
            {error?.oldPassword && <div>{error.oldPassword}</div>}
            <br></br>
            <label htmlFor="newPassword">New Password</label>
            <input name="newPassword" type="text" required></input>
            {error?.newPassword && <div>{error.newPassword}</div>}
            <br></br>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input name="confirmPassword" type="text" required></input>
            {error?.confirmPassword && <div>{error.confirmPassword}</div>}
            <button type="submit">Update Password</button>
        </form>
    )
}