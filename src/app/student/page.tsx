import { createClient } from "@/utils/supabase/server"; 
import { isAuthenticated } from "@/actions/authActions";
import { redirect } from "next/navigation";

export default async function HomePage(){
    const supabase = await createClient();
    const isLogin = await isAuthenticated();

    // const firstName = 
    if (!isLogin){
        redirect("/login");
    }

    return (<div>
        <h1>Welcome, {}</h1>
    </div>);
}