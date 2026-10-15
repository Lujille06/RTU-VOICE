"use server";

import { getCurrentUser } from "@/features/auth/guards";
import { createClient } from "@/utils/supabase/server";
import { str } from "@/features/shared/sharedUtils";
export type SubmitComplaintState = {
    success: boolean;
    message: string;
    trackingId?: string;
};

// Adjust these to match your SRS
const TITLE_MAX = 100;
const DESCRIPTION_MAX = 2000;
const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MB total per submission
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "audio/mpeg",
    "audio/wav",
    "application/pdf",
    "video/mp4",
];

export async function submitComplaint(formData: FormData): Promise<SubmitComplaintState> {
    // 1. who is submitting? (from the session, never from the form)
    const me = await getCurrentUser();
    if (!me || me.role !== "student") {
        return { success: false, message: "Not allowed." };
    }

    // 2. read the fields
    const title = str(formData.get("title")).trim();
    const description = str(formData.get("description")).trim();
    const categoryId = Number(formData.get("category"));
    const releaseToPublic = formData.get("privacy_setting") !== "private"; // checked = keep private
    const evidence = formData
        .getAll("evidence")
        .filter((f): f is File => f instanceof File && f.size > 0);

    // 3. validate
    if (!title) return { success: false, message: "Please enter a title." };
    if (title.length > TITLE_MAX) {
        return { success: false, message: `Title must be ${TITLE_MAX} characters or fewer.` };
    }
    if (!description) return { success: false, message: "Please enter a description." };
    if (description.length > DESCRIPTION_MAX) {
        return { success: false, message: `Description must be ${DESCRIPTION_MAX} characters or fewer.` };
    }
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return { success: false, message: "Please choose a category." };
    }

    if (evidence.length > MAX_FILES) {
        return { success: false, message: `You can attach up to ${MAX_FILES} files.` };
    }
    const totalBytes = evidence.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
        return { success: false, message: "Evidence must be 5 MB or less in total." };
    }
    if (evidence.some((f) => !ALLOWED_TYPES.includes(f.type))) {
        // note: file.type comes from the browser; check file signatures too if you need stricter rules
        return { success: false, message: "One of the files has an unsupported type." };
    }

    // 4. does the category really exist?
    const supabase = await createClient();
    const { data: category, error: categoryError } = await supabase
        .from("categories") // TODO: use your real table name
        .select("id")
        .eq("id", categoryId)
        .maybeSingle();

    if (categoryError || !category) {
        return { success: false, message: "Invalid category." };
    }

    // 5. TODO (your part):
    //  - generate the tracking ID (e.g. STU-XXXXX) and make sure it is unique
    //  - insert into complaints: user_id: me.id, category_id, title, description,
    //    status_id: 1 (pending), release_to_public: releaseToPublic
    //  - upload the evidence (better: from the browser straight to Supabase Storage,
    //    then pass only the file paths here, because of the body size limits)
    //  - run the AI step for priority + public summary
    //  - never return priority_id to the student

    return { success: true, message: "Your concern was submitted.", trackingId: "TODO" };
}