import {requireRole} from '@/features/auth/guards'

export default async function Public_Dashboard_Page(){
    await requireRole("student");
    
    return (<div>

    </div>);
}