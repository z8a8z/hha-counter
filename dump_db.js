import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found in the project root directory!');
    console.log('Please make sure you have a .env file with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] ? match[2].trim() : '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });

  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in your .env file!');
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${url}...`);
  const supabase = createClient(url, key);

  const dump = {};
  const tables = ['app_users', 'role_permissions', 'user_permissions', 'counter'];

  for (const table of tables) {
    console.log(`Fetching table: ${table}...`);
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        dump[table] = { error: error.message };
        console.error(`Failed to fetch ${table}:`, error.message);
      } else {
        dump[table] = data;
        console.log(`Successfully fetched ${data.length} rows from ${table}`);
      }
    } catch (e) {
      dump[table] = { error: e.message };
      console.error(`Exception while fetching ${table}:`, e.message);
    }
  }

  const outputPath = path.resolve('db_dump.json');
  fs.writeFileSync(outputPath, JSON.stringify(dump, null, 2), 'utf-8');
  console.log(`\nSuccess! Database content has been exported to: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error running dump script:', err);
});
