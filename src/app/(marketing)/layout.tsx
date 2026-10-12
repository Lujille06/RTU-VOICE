import LP_navbar from "@/components/lp-navbar";

export default function MarketingLayout({children,}: {children: React.ReactNode;}){
    return (
       
        <div className='auth-container'>
            <LP_navbar/>
            <main>{children}</main>
        </div>
    );
}