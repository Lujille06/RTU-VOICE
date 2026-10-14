import Link from "next/link";
import Image from "next/image";
import { logoutUser } from "@/actions/authActions";

export default function StudentNavbar(){
    return(
        <nav>
            <div>
                <Image
                    src='/logo.png'
                    alt='logo'
                    width={20}
                    height={20}
                />
                <Link href='/homepage'>RTU Voice</Link>
            </div>
            <div>
                <button className="dropbtn">Profile Icon</button>
                <div className="dropdown-content">
                    <Link href={"/profile"}></Link>
                    <form action={logoutUser}>
                        <button type="submit">Logout</button>
                    </form>
                </div>
            </div>
        </nav>
    );
}