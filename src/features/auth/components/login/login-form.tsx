"use client";

import { useState } from "react";
import { validateAndloginUser } from "@/actions/authActions";

export function LoginForm(){
    const [error, setError] = useState<string>("");

    async function handleLoginAccount(e: React.SubmitEvent<HTMLFormElement>){
        e.preventDefault();
        const data = new FormData(e.currentTarget);

        const result = await validateAndloginUser(data);

        if(!result.success){
            setError(result.message);
            return;
        }
        // router.push("/homepage");
        
    }

    return(
        <div>
            <form onSubmit={handleLoginAccount}>
                <label></label>
                <input 
                    name="email"
                    type="email"
                    placeholder="20**-******@rtu.edu.ph"
                />
                <label></label>
                <input 
                    name="password"
                    type="password"
                    placeholder="Enter Your Password"
                />
                <button type="submit">Login</button>
            </form>
            {error && <div>{error}</div>}
        </div>
    );
}