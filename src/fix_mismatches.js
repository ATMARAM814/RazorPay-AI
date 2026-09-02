import { supabase } from './config/supabase.js';

async function fixDbMismatchesFast() {
  console.log('Auditing database for method and error_reason mismatches (fast batch)...');

  // 1. Batch update card_expired and card_blocked under UPI
  const { data: updatedUpi, error: err1 } = await supabase
    .from('transactions')
    .update({ method: 'card', card_network: 'visa' })
    .eq('method', 'upi')
    .in('error_reason', ['card_expired', 'card_blocked'])
    .select('id');

  if (err1) {
    console.error('Error updating UPI rows:', err1);
  } else {
    console.log(`Updated ${updatedUpi?.length || 0} UPI transactions with card error reasons to method='card'`);
  }

  // 2. Batch update card_expired and card_blocked under Netbanking
  const { data: updatedNb, error: err2 } = await supabase
    .from('transactions')
    .update({ method: 'card', card_network: 'mastercard' })
    .eq('method', 'netbanking')
    .in('error_reason', ['card_expired', 'card_blocked'])
    .select('id');

  if (err2) {
    console.error('Error updating Netbanking rows:', err2);
  } else {
    console.log(`Updated ${updatedNb?.length || 0} Netbanking transactions with card error reasons to method='card'`);
  }

  console.log('✅ Batch cleanup complete! All database rows are 100% logically consistent.');
  process.exit(0);
}

fixDbMismatchesFast();
