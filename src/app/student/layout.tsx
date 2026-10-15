import StudendNavBar from "@/components/layout/Navbar/student-navbar";

export default function AuthLayout({children,}: {children: React.ReactNode;}){
    return (
       
        <div className='auth-container'>
            <StudendNavBar/>
            <main>{children}</main>
        </div>
    );
}