import { isAuthenticated } from "@/actions/authActions";
import ChangePasswordForm from "@/features/shared/components/change-password";
import ProfileForm from "@/features/shared/components/profile-form";
import { redirect } from "next/navigation";

export default async function Profile(){
    const isLogin = await isAuthenticated();
    
    if (!isLogin){
        redirect("/login");
    }
    
    return (
        <div>
            <h1>Welcome</h1>
            <ProfileForm></ProfileForm>
            <ChangePasswordForm></ChangePasswordForm>
        </div>
    )
}