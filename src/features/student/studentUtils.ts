import { createClient } from "@/utils/supabase/server"; 


export const str = (v: FormDataEntryValue | null) => (v ?? "").toString();
