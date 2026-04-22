import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yjuohucgkrbmibyzxcpm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdW9odWNna3JibWlieXp4Y3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MzU4NzUsImV4cCI6MjA5MjQxMTg3NX0.rj_xH-L9tFXvzvYxT9pltHpzy_r9kKMbNoSU6TgI2IY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
