import StudendNavBar from "@/components/layout/Navbar/student-navbar";
import { requireRole } from "@/features/auth/guards";

export default async function AuthLayout({children,}: {children: React.ReactNode;}){
    await requireRole("student");
    
    return (
       
        <div className='auth-container'>
            <StudendNavBar/>
            <main>{children}</main>
        </div>
    );
}