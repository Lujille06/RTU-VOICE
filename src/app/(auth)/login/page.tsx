import { LoginForm } from "@/features/auth";
import Link from "next/link";
import { redirectIfAuthenticated } from "@/features/auth/guards";

export default async function LoginPage(){
    await redirectIfAuthenticated();
    return(
        <main>
            <h1>Login Page</h1>
            <LoginForm></LoginForm>
            <Link href="/forgot-password">Forgot Password?</Link>

        </main>
    );
}