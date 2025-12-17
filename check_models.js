import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://etlxgjylypmpywxvglkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bHhnanlseXBtcHl3eHZnbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDgwMjIsImV4cCI6MjA4MDEyNDAyMn0.w_DmbORU9M4W2LGRjt_CNaDlgI_kU5aJ9d7UNPb9egQ'
);

const { data, error } = await supabase.from('models').select('*');
if (error) {
  console.error('Error:', error);
} else {
  console.log('Models in database:', data.length);
  data.forEach(model => {
    console.log(`- ${model.first_name} ${model.last_name}`);
    console.log(`  Email: ${model.email}`);
    console.log(`  Birthdate: ${model.birthdate}`);
    console.log('');
  });
}
