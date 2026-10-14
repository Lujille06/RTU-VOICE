import Link from "next/link";
import Image from "next/image";

export default function LP_navbar(){
    return(
        <nav>
            <div>
                <Image
                    src='/logo.png'
                    alt='logo'
                    width={20}
                    height={20}
                />
                <Link href='/'>RTU Voice</Link>
            </div>
            <div>
                <ul>
                    <li><Link href='/login'>Login</Link></li>
                    <li><Link href='/register'>Register</Link></li>
                </ul>
            </div>
        </nav>
    );
}