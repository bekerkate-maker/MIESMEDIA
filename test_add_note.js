import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://etlxgjylypmpywxvglkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bHhnanlseXBtcHl3eHZnbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDgwMjIsImV4cCI6MjA4MDEyNDAyMn0.w_DmbORU9M4W2LGRjt_CNaDlgI_kU5aJ9d7UNPb9egQ'
);

// Get eerste model
const { data: models } = await supabase.from('models').select('*').limit(1);
if (!models || models.length === 0) {
  console.log('Geen modellen gevonden');
  process.exit(1);
}

const model = models[0];
console.log(`Testing notitie toevoegen voor: ${model.first_name} ${model.last_name}`);

// Test notitie toevoegen
const { data, error } = await supabase
  .from('model_notes')
  .insert([{
    model_id: model.id,
    employee_name: 'Test Medewerker',
    note_text: 'Dit is een test notitie',
    shoot_name: 'La Cazuela Test',
    compensation_type: 'bedrag',
    compensation_amount: 150.00
  }])
  .select();

if (error) {
  console.error('Error:', error);
} else {
  console.log('✅ Notitie succesvol toegevoegd!');
  console.log('Data:', data);
}

// Haal notities op
const { data: notes } = await supabase
  .from('model_notes')
  .select('*')
  .eq('model_id', model.id);

console.log(`\nTotaal ${notes.length} notities voor dit model`);
