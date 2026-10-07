import Link from "next/link"

export function LoginForm(){
    return(
        <div>
            <label></label>
            <input 
                type="text"
                placeholder="20**-******@rtu.edu.ph"
            />
            <label></label>
            <input 
                type="text"
                placeholder="Enter Your Password"
            />
            <Link href="/forgot-password">Forgot Password?</Link>
            <button>Login</button>
        </div>
    );
}