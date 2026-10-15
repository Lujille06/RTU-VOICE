"use client";

import { UpdateProfile } from "@/actions/profileAction";
import { useState } from "react";
import { UpdateProfileType } from "../sharedTypes";

export default function ProfileForm(){
    const [error, setError] = useState<UpdateProfileType["errors"]>({});
    const handleProfileFormSubmit =  async (e:React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const data = e.currentTarget;
        const form = new FormData(data);

        const result = await UpdateProfile(form);

        if(!result) return;

        if (!result.success){
            setError(result.errors);
            return
        };
    }
    return (
        <form onSubmit={handleProfileFormSubmit}>
            <label htmlFor="firstName">First Name</label>
            <input name="firstName" required></input>
            {error && <div>{error.firstName}</div>}
            <label htmlFor="lastName">Last Name</label>
            <input name="lastName" required></input>
            {error && <div>{error.lastName}</div>}
            <button type="submit">Save Changes</button>
        </form>
    );
}