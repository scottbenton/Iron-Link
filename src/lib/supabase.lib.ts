import { createClient } from "@supabase/supabase-js";
import { Database } from "types/supabase-generated.type";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient<Database>(url, anonKey);
