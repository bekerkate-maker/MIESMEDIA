import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://etlxgjylypmpywxvglkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bHhnanlseXBtcHl3eHZnbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDgwMjIsImV4cCI6MjA4MDEyNDAyMn0.w_DmbORU9M4W2LGRjt_CNaDlgI_kU5aJ9d7UNPb9egQ'
);

// Test of model_notes tabel bestaat
console.log('Testing model_notes table...');
const { data, error } = await supabase
  .from('model_notes')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error);
  console.log('\nTabel bestaat waarschijnlijk nog niet. Je moet de SQL uitvoeren in Supabase.');
} else {
  console.log('Success! Table exists. Data:', data);
}
