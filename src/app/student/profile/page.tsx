import ChangePasswordForm from "@/features/shared/components/change-password";
import ProfileForm from "@/features/shared/components/profile-form";
import { requireRole } from "@/features/auth/guards";

export default async function Profile(){
    await requireRole("student");
    
    return (
        <div>
            <h1>Welcome</h1>
            <ProfileForm></ProfileForm>
            <ChangePasswordForm></ChangePasswordForm>
        </div>
    )
}