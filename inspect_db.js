import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eoogmrwzzrhwxtctyxer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb2dtcnd6enJod3h0Y3R5eGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NTI3NzMsImV4cCI6MjA5MjQyODc3M30.pWMGq7XSetuRqjl8Qh2d2Inhjp20L_x7ZIjt6vVMoXk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumn(columnName) {
  const { data, error } = await supabase.from('user_documents').select(columnName).limit(1);
  if (error) {
    console.log(`Column '${columnName}':`, error.message);
  } else {
    console.log(`Column '${columnName}': EXISTS (or no schema error)`);
  }
}

async function run() {
  await testColumn('gemini_ai_response');
  await testColumn('ai_response');
  await testColumn('ai_analysis');
  await testColumn('insight');
  await testColumn('analysis');
}

run();
