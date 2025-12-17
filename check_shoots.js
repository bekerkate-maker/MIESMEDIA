import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://etlxgjylypmpywxvglkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bHhnanlseXBtcHl3eHZnbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDgwMjIsImV4cCI6MjA4MDEyNDAyMn0.w_DmbORU9M4W2LGRjt_CNaDlgI_kU5aJ9d7UNPb9egQ'
);

const { data, error } = await supabase.from('shoots').select('*');
if (error) {
  console.error('Error:', error);
} else {
  console.log('Shoots in database:', data.length);
  data.forEach(shoot => {
    console.log(`- ${shoot.client_name}: ${shoot.description?.split('\n')[0]} (${shoot.shoot_date})`);
  });
}
