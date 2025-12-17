import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://etlxgjylypmpywxvglkx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bHhnanlseXBtcHl3eHZnbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDgwMjIsImV4cCI6MjA4MDEyNDAyMn0.w_DmbORU9M4W2LGRjt_CNaDlgI_kU5aJ9d7UNPb9egQ'
);

// Get alle notities
const { data: notes } = await supabase
  .from('model_notes')
  .select('*')
  .limit(5);

console.log(`Totaal ${notes.length} notities gevonden`);

if (notes && notes.length > 0) {
  const testNote = notes[0];
  console.log(`\nTest: Verwijderen van notitie "${testNote.note_text.substring(0, 30)}..."`);
  
  const { error } = await supabase
    .from('model_notes')
    .delete()
    .eq('id', testNote.id);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Notitie succesvol verwijderd!');
  }
  
  // Check hoeveel notities er nu zijn
  const { data: remainingNotes } = await supabase
    .from('model_notes')
    .select('*');
  
  console.log(`Nu nog ${remainingNotes.length} notities over`);
}
