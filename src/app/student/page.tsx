import { requireRole } from "@/features/auth/guards";

export default async function HomePage(){
    await requireRole("student");
    return (<div>
        <h1>Welcome, {}</h1>
    </div>);
}