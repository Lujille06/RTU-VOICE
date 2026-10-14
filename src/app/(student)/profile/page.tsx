import { isAuthenticated } from "@/actions/authActions";
import ChangePasswordForm from "@/features/student/components/change-password";
import { redirect } from "next/navigation";

export default async function Profile(){
    const isLogin = await isAuthenticated();
    
    if (!isLogin){
        redirect("/login");
    }
    
    return (
        <div>
            <h1>Welcome</h1>
            <ChangePasswordForm></ChangePasswordForm>
        </div>
    )
}