import { LoginForm } from "@/features/auth";
import Link from "next/link";

export default function LoginPage(){
    return(
        <main>
            <h1>Login Page</h1>
            <LoginForm></LoginForm>
            <Link href="/forgot-password">Forgot Password?</Link>

        </main>
    );
}