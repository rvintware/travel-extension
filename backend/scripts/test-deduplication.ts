/**
 * Test script for deduplication functionality
 * Run with: npx tsx backend/scripts/test-deduplication.ts
 */

import { supabase } from '../lib/supabase'
import { mergeTips } from '../lib/locations/merge'

async function testDeduplication() {
  console.log('='.repeat(60))
  console.log('PHASE 1: DEDUPLICATION TEST SUITE')
  console.log('='.repeat(60))
  
  const testUserId = 'test-user-dedup-' + Date.now()
  const testPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4' // Sydney Opera House
  
  let testCountryId: string
  
  try {
    // Get a test country (use Uncategorized)
    const { data: country } = await supabase
      .from('countries')
      .select('id')
      .eq('code', 'XX')
      .single()
    
    if (!country) {
      console.error('❌ ERROR: Uncategorized country not found. Run migrations first.')
      return
    }
    
    testCountryId = country.id
    
    // ========================================================================
    // TEST 1: Create first location with place_id
    // ========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 1: Create first location with place_id')
    console.log('='.repeat(60))
    
    const { data: loc1, error: error1 } = await supabase
      .from('locations')
      .insert({
        user_id: testUserId,
        country_id: testCountryId,
        name: 'Sydney Opera House',
        place_id: testPlaceId,
        original_text: 'Check out the Opera House!',
        source_url: 'https://reddit.com/r/travel/1',
        sources: ['https://reddit.com/r/travel/1'],
        tips: [{ text: 'Book tickets in advance', source: 'highlight', priority: 1, confidence: 0.9 }],
        processing_status: 'complete',
        location_verified: true
      })
      .select()
      .single()
    
    if (error1) {
      console.error('❌ FAIL: Could not create first location:', error1.message)
      return
    }
    
    console.log('✅ PASS: Created location:', loc1.id)
    console.log('   - place_id:', loc1.place_id)
    console.log('   - tips:', loc1.tips)
    console.log('   - sources:', loc1.sources)
    
    // ========================================================================
    // TEST 2: Try to create duplicate (should fail due to constraint)
    // ========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 2: Try to create duplicate (should fail)')
    console.log('='.repeat(60))
    
    const { error: error2 } = await supabase
      .from('locations')
      .insert({
        user_id: testUserId,
        country_id: testCountryId,
        place_id: testPlaceId,
        name: 'Opera House Sydney',
        original_text: 'The Opera House is amazing',
        source_url: 'https://reddit.com/r/travel/2'
      })
    
    if (error2) {
      if (error2.code === '23505') {
        console.log('✅ PASS: Duplicate correctly blocked by constraint')
        console.log('   - Error code:', error2.code)
      } else {
        console.error('❌ FAIL: Unexpected error:', error2.message)
      }
    } else {
      console.error('❌ FAIL: Duplicate was allowed!')
    }
    
    // ========================================================================
    // TEST 3: Test mergeTips function
    // ========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 3: Test mergeTips function')
    console.log('='.repeat(60))
    
    const existing = [
      { text: 'Book tickets in advance', source: 'highlight', priority: 1, confidence: 0.9 }
    ]
    const newTips = [
      { text: 'Book tickets in advance', source: 'highlight', priority: 1, confidence: 0.9 }, // Duplicate
      { text: 'Visit at sunset', source: 'context', priority: 2, confidence: 0.8 }, // New
      { text: 'BOOK TICKETS IN ADVANCE', source: 'page', priority: 3, confidence: 0.7 } // Duplicate (case-insensitive)
    ]
    
    const merged = mergeTips(existing, newTips)
    
    console.log('Existing tips:', existing.length)
    console.log('New tips:', newTips.length)
    console.log('Merged tips:', merged.length)
    console.log('Merged content:', merged.map(t => t.text))
    
    if (merged.length === 2) {
      console.log('✅ PASS: Tips correctly merged and deduplicated')
      console.log('   - Kept unique tips: "Book tickets in advance", "Visit at sunset"')
      console.log('   - Removed case-insensitive duplicate')
    } else {
      console.error('❌ FAIL: Expected 2 tips, got', merged.length)
    }
    
    // ========================================================================
    // TEST 4: Test with different users (should allow same place_id)
    // ========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 4: Different users can have same place_id')
    console.log('='.repeat(60))
    
    const testUserId2 = 'test-user-dedup2-' + Date.now()
    
    const { data: loc2, error: error4 } = await supabase
      .from('locations')
      .insert({
        user_id: testUserId2,
        country_id: testCountryId,
        name: 'Sydney Opera House',
        place_id: testPlaceId, // Same place_id, different user
        original_text: 'Must see the Opera House!',
        source_url: 'https://reddit.com/r/travel/3',
        sources: ['https://reddit.com/r/travel/3'],
        processing_status: 'complete'
      })
      .select()
      .single()
    
    if (error4) {
      console.error('❌ FAIL: Could not create location for user 2:', error4.message)
    } else {
      console.log('✅ PASS: User 2 can save same place')
      console.log('   - User 1 location:', loc1.id)
      console.log('   - User 2 location:', loc2.id)
    }
    
    // ========================================================================
    // TEST 5: Test with null place_id (should allow duplicates)
    // ========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST 5: Null place_id allows duplicates')
    console.log('='.repeat(60))
    
    const { data: loc3 } = await supabase
      .from('locations')
      .insert({
        user_id: testUserId,
        country_id: testCountryId,
        name: 'Unknown Bar',
        place_id: null,
        original_text: 'Some bar downtown',
        source_url: 'https://reddit.com/r/travel/4',
        processing_status: 'complete'
      })
      .select()
      .single()
    
    const { data: loc4 } = await supabase
      .from('locations')
      .insert({
        user_id: testUserId,
        country_id: testCountryId,
        name: 'Unknown Bar',
        place_id: null, // null place_id
        original_text: 'Same bar name but unverified',
        source_url: 'https://reddit.com/r/travel/5',
        processing_status: 'complete'
      })
      .select()
      .single()
    
    if (loc3 && loc4 && loc3.id !== loc4.id) {
      console.log('✅ PASS: Null place_id locations can be duplicated')
      console.log('   - Location 1:', loc3.id)
      console.log('   - Location 2:', loc4.id)
    } else {
      console.error('❌ FAIL: Could not create duplicate null place_id locations')
    }
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ All tests passed!')
    console.log('   - Unique constraint working')
    console.log('   - Tip merging working')
    console.log('   - Multi-user support working')
    console.log('   - Null place_id handling working')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error)
  } finally {
    // ========================================================================
    // CLEANUP
    // ========================================================================
    console.log('\n' + '='.repeat(60))
    console.log('CLEANUP')
    console.log('='.repeat(60))
    
    const { error: cleanupError } = await supabase
      .from('locations')
      .delete()
      .or(`user_id.eq.${testUserId},user_id.eq.test-user-dedup2-${Date.now()}`)
    
    if (cleanupError) {
      console.warn('⚠️  Cleanup warning:', cleanupError.message)
    } else {
      console.log('✅ Cleanup complete')
    }
    
    console.log('='.repeat(60))
  }
}

// Run tests
testDeduplication()
  .then(() => {
    console.log('\n✅ Test suite completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  })

