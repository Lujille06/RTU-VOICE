import { requireRole } from "@/features/auth/guards";

export default async function HistoryPage(){
    await requireRole("student");
    return (<div>

    </div>);
}