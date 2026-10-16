import {ComplaintForm} from "@/features/student";
import { requireRole } from "@/features/auth/guards";


export default async function Submit_Complaint_Page(){
    await requireRole("student");
    return (<div>
        <ComplaintForm/>
    </div>);
}