import { createClient } from "@/utils/supabase/server"; 
import { isAuthenticated } from "@/actions/authActions";
import { redirect } from "next/navigation";

export default async function HomePage(){
    const supabase = await createClient();
    const isLogin = await isAuthenticated();

    if (!isLogin){
        redirect("/login");
    }

    return (<div>

    </div>);
}