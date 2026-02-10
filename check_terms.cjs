const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etlxgjylypmpywxvglkx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0bHhnanlseXBtcHl3eHZnbGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDgwMjIsImV4cCI6MjA4MDEyNDAyMn0.w_DmbORU9M4W2LGRjt_CNaDlgI_kU5aJ9d7UNPb9egQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTerms() {
    console.log('Checking terms_and_conditions table...');
    const { data, error } = await supabase
        .from('terms_and_conditions')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching terms:', error);
    } else {
        console.log('Terms found:', data);
        if (data.length === 0) {
            console.log('No active terms found.');
            // Check if any terms exist at all
            const { data: allTerms, error: allError } = await supabase
                .from('terms_and_conditions')
                .select('*');
            if (allError) {
                console.error('Error fetching all terms:', allError);
            } else {
                console.log('All terms in DB:', allTerms);
            }
        }
    }
}

checkTerms();
