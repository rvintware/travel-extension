/**
 * Run database migration for deduplication
 * Usage: npx tsx backend/scripts/run-migration.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { supabase } from '../lib/supabase'

async function runMigration() {
  console.log('='.repeat(60))
  console.log('RUNNING MIGRATION: add_deduplication_constraint.sql')
  console.log('='.repeat(60))
  
  try {
    // Read migration file
    const migrationPath = join(__dirname, '../migrations/add_deduplication_constraint.sql')
    const sql = readFileSync(migrationPath, 'utf-8')
    
    console.log('\n📄 Migration file loaded')
    console.log('   Lines:', sql.split('\n').length)
    
    console.log('\n⚠️  NOTE: This script requires direct database access.')
    console.log('   Please run the migration manually using one of these methods:')
    console.log('\n   Option 1: Supabase Dashboard')
    console.log('     1. Go to your Supabase project dashboard')
    console.log('     2. Navigate to SQL Editor')
    console.log('     3. Copy/paste the contents of:')
    console.log(`        ${migrationPath}`)
    console.log('     4. Click "Run"')
    console.log('\n   Option 2: psql CLI')
    console.log('     psql $DATABASE_URL -f backend/migrations/add_deduplication_constraint.sql')
    console.log('\n   Option 3: Supabase CLI')
    console.log('     supabase db push')
    
    console.log('\n' + '='.repeat(60))
    console.log('MIGRATION SQL:')
    console.log('='.repeat(60))
    console.log(sql)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Migration instructions displayed')
    console.log('   Please run the SQL manually as described above')
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

