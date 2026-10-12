export default function DepartmentLayout({children} : {children: React.ReactNode}){
    return (
        <div>
            <main>{children}</main>
        </div>
    );
}