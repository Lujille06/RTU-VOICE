import LP_navbar from "@/components/layout/Navbar/auth-navbar";

export default function AuthLayout({children,}: {children: React.ReactNode;}){
    return (
       
        <div className='auth-container'>
            <LP_navbar/>
            <main>{children}</main>
        </div>
    );
}