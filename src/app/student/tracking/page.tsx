import {requireRole} from '@/features/auth/guards'
    
export default async function TrackingPage(){
    await requireRole("student");
    return (<div>

    </div>);
}