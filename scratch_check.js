import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key) env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('meetings').select('id, title, user_id, created_at').order('created_at', { ascending: false }).limit(5);
  console.log('Error:', error);
  console.log('Data:', data);
}

check();
