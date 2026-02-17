
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to parse CSV line manually (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const importDrugs = async (filePath, wholesalerName, userId) => {
  console.log(`Starting import for ${wholesalerName}...`);

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    // Skip header
    const dataLines = lines.slice(1);
    
    // Process in batches
    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < dataLines.length; i += batchSize) {
      const batch = dataLines.slice(i, i + batchSize);
      
      const records = batch.map(line => {
        // Simple CSV parsing assuming Columns: 
        // BRAND, GENERIC, DOSAGE_FORM, STRENGTH, MANUFACTURER, BATCH, PRICE, EXPIRY
        // Note: Order must match your CSV template!
        const cols = parseCSVLine(line);
        if (cols.length < 2) return null; // Skip invalid lines

        const [brand, generic, dosage, strength, manufacturer, batchNum, priceRaw, expiry] = cols;

        // Clean price (remove commas, currency symbols)
        const price = priceRaw ? parseFloat(priceRaw.replace(/[^0-9.]/g, '')) : null;

        return {
          brand_name: brand,
          generic_name: generic,
          dosage_form: dosage || 'Tablet',
          strength: strength || 'N/A',
          manufacturer: manufacturer || 'N/A',
          batch_number: batchNum || null,
          price: price, // NEW FIELD
          expiry_date: expiry || null,
          wholesaler_name: wholesalerName,
          city: 'Imported City', // Default needed
          contact_method: 'Imported Contact', // Default needed
          user_id: userId, // VERY IMPORTANT: If null, RLS might hide it from suppliers
          availability: 'In stock'
        };
      }).filter(r => r !== null);

      if (records.length > 0) {
        const { error } = await supabase.from('Drugs').insert(records);
        if (error) {
            console.error('Batch insert error:', error.message);
            failCount += records.length;
        } else {
            successCount += records.length;
        }
      }
    }

    console.log(`Import complete for ${wholesalerName}. Success: ${successCount}, Failed: ${failCount}`);

  } catch (err) {
    console.error('Import failed:', err.message);
  }
};

// --- RUNNER ---
// Usage: node import_drugs.js <file_path> <wholesaler_name> <user_id>
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node import_drugs.js <csv_file_path> <wholesaler_name> <user_id>');
  console.log('Example: node import_drugs.js ./data/widespectrum.csv "WideSpectrum" "user-uuid-here"');
  process.exit(1);
}

importDrugs(args[0], args[1], args[2]);
