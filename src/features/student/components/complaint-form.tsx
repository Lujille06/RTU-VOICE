"use client";

import { submitComplaint } from "@/actions/studentActions";
import { redirect } from "next/navigation";
import React from "react";

export function ComplaintForm(){

    const categories = ["Academic", "Facilities & Infrastucture", "Administrative", "Student Life", "Other"];
    
    const handleComplaintSubmit = async (e:React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const data = e.currentTarget;

        const form = new FormData(data);

        const result = await submitComplaint(form);
    }
    
    const handleCancelButton = () => {
        redirect("/student");
    }
    return (
        <form onSubmit={handleComplaintSubmit}>
            <label htmlFor="title">Title</label>
            <input type="text" name="title" required></input>

            <label htmlFor="category">Category</label>
            <select name="categories" defaultValue="">
                <option value="" disabled >Choose a category</option>
                {categories.map((c, i) => (<option key={i} value={c}>{c}</option>))}
            </select>

            <label htmlFor="description">Description</label>
            <textarea name="description" required></textarea>

            <label htmlFor="evidence">Evidence</label>
            <input type="file" name="evidence" accept="image/jpeg, image/png, audio/mpeg, audio/wav, application/pdf, video/mp4"
        multiple></input>

            <label htmlFor="toggle">Do not release this to the public</label>
            <input type="checkbox" name="privacy_setting" value="private"></input>

            <button type="button" onClick={handleCancelButton}>Cancel</button>
            <button type="submit">Submit Concern</button>
        </form>
    );
}
