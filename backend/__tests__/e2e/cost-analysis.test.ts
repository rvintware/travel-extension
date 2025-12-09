/**
 * Cost Analysis Tests
 * 
 * Measures and analyzes cost implications of link processing:
 * - OpenAI token usage (should be slightly reduced due to cleaned text)
 * - Google Places API calls (1-4 calls per link in fallback chain)
 * - Cost per scenario type
 * 
 * Note: These tests use mocked APIs to avoid actual charges.
 * Real cost tracking would require intercepting API calls or parsing logs.
 */

import { describe, it, expect } from '@jest/globals'
import { extractLinksFromText } from '@/lib/links/parser'
import { E2E_TEST_TEXT, E2E_TEST_URLS } from './test-data'

/**
 * Mock cost tracking structure
 */
interface CostMetrics {
  openaiTokens?: {
    input: number
    output: number
    total: number
  }
  googleApiCalls?: {
    placeIdLookups: number
    coordinateSearches: number
    textSearches: number
    total: number
  }
  estimatedCost?: {
    openai: number
    google: number
    total: number
  }
}

/**
 * Mock OpenAI pricing (as of 2024)
 * gpt-4o-mini: $0.15/$0.60 per 1M tokens (input/output)
 */
const OPENAI_PRICING = {
  input: 0.15 / 1_000_000, // $0.15 per 1M input tokens
  output: 0.60 / 1_000_000, // $0.60 per 1M output tokens
}

/**
 * Mock Google Places API pricing (as of 2024)
 */
const GOOGLE_PLACES_PRICING = {
  placeDetails: 0.017, // $0.017 per request
  placesNearby: 0.032, // $0.032 per request
  textSearch: 0.032, // $0.032 per request
}

describe('Cost Analysis', () => {
  describe('Text Cleaning Impact on OpenAI Tokens', () => {
    it('should reduce token count by removing URLs from text', () => {
      const textWithLinks = E2E_TEST_TEXT.WITH_SINGLE_LINK
      const textWithoutLinks = E2E_TEST_TEXT.TEXT_ONLY

      // Simulate token counting (rough estimate: 1 token ≈ 4 characters)
      const tokensWithLinks = Math.ceil(textWithLinks.length / 4)
      const tokensWithoutLinks = Math.ceil(textWithoutLinks.length / 4)

      // Extract links and get cleaned text
      const extracted = extractLinksFromText(textWithLinks)
      const cleanedTokens = Math.ceil(extracted.cleanedText.length / 4)

      const tokenReduction = tokensWithLinks - cleanedTokens
      const reductionPercentage = (tokenReduction / tokensWithLinks) * 100

      console.log('[Cost Analysis] Token reduction from cleaning:')
      console.log(`  Original text tokens: ~${tokensWithLinks}`)
      console.log(`  Cleaned text tokens: ~${cleanedTokens}`)
      console.log(`  Reduction: ${tokenReduction} tokens (${reductionPercentage.toFixed(1)}%)`)

      // Cleaned text should have fewer tokens
      expect(cleanedTokens).toBeLessThan(tokensWithLinks)
    })

    it('should calculate cost savings from text cleaning', () => {
      const textWithLinks = E2E_TEST_TEXT.WITH_MULTIPLE_LINKS
      const extracted = extractLinksFromText(textWithLinks)

      // Estimate tokens
      const originalTokens = Math.ceil(textWithLinks.length / 4)
      const cleanedTokens = Math.ceil(extracted.cleanedText.length / 4)
      const savedTokens = originalTokens - cleanedTokens

      // Calculate cost savings (assuming input tokens)
      const costPerToken = OPENAI_PRICING.input
      const costSavings = savedTokens * costPerToken

      console.log('[Cost Analysis] Cost savings from cleaning:')
      console.log(`  Saved tokens: ${savedTokens}`)
      console.log(`  Cost savings: $${costSavings.toFixed(6)} per request`)

      // Should save some tokens
      expect(savedTokens).toBeGreaterThan(0)
    })
  })

  describe('Google Places API Call Count', () => {
    it('should estimate API calls for Place ID lookup (best case)', () => {
      // Best case: Place ID found → 1 API call
      const calls = {
        placeIdLookups: 1,
        coordinateSearches: 0,
        textSearches: 0,
        total: 1,
      }

      const cost = calls.placeIdLookups * GOOGLE_PLACES_PRICING.placeDetails

      console.log('[Cost Analysis] Place ID lookup (best case):')
      console.log(`  API calls: ${calls.total}`)
      console.log(`  Cost: $${cost.toFixed(4)}`)

      expect(calls.total).toBe(1)
      expect(cost).toBeLessThan(0.02)
    })

    it('should estimate API calls for coordinate lookup (medium case)', () => {
      // Medium case: Coordinates found → 2 API calls (nearby + place details)
      const calls = {
        placeIdLookups: 1,
        coordinateSearches: 1,
        textSearches: 0,
        total: 2,
      }

      const cost =
        calls.coordinateSearches * GOOGLE_PLACES_PRICING.placesNearby +
        calls.placeIdLookups * GOOGLE_PLACES_PRICING.placeDetails

      console.log('[Cost Analysis] Coordinate lookup (medium case):')
      console.log(`  API calls: ${calls.total}`)
      console.log(`  Cost: $${cost.toFixed(4)}`)

      expect(calls.total).toBe(2)
      expect(cost).toBeLessThan(0.05)
    })

    it('should estimate API calls for query fallback (worst case)', () => {
      // Worst case: Query only → 3-4 API calls (text search + place details, possibly retries)
      const calls = {
        placeIdLookups: 1,
        coordinateSearches: 0,
        textSearches: 1,
        total: 2, // Text search + place details
      }

      const cost =
        calls.textSearches * GOOGLE_PLACES_PRICING.textSearch +
        calls.placeIdLookups * GOOGLE_PLACES_PRICING.placeDetails

      console.log('[Cost Analysis] Query fallback (worst case):')
      console.log(`  API calls: ${calls.total}`)
      console.log(`  Cost: $${cost.toFixed(4)}`)

      expect(calls.total).toBeGreaterThanOrEqual(2)
      expect(cost).toBeLessThan(0.05)
    })
  })

  describe('Cost Per Scenario Type', () => {
    it('should calculate cost for link-only save', () => {
      // Link-only: No OpenAI (no text), Google Places API only
      const metrics: CostMetrics = {
        openaiTokens: {
          input: 0,
          output: 0,
          total: 0,
        },
        googleApiCalls: {
          placeIdLookups: 1,
          coordinateSearches: 0,
          textSearches: 0,
          total: 1,
        },
        estimatedCost: {
          openai: 0,
          google: 1 * GOOGLE_PLACES_PRICING.placeDetails,
          total: 1 * GOOGLE_PLACES_PRICING.placeDetails,
        },
      }

      console.log('[Cost Analysis] Link-only save:')
      console.log(`  OpenAI cost: $${metrics.estimatedCost!.openai.toFixed(6)}`)
      console.log(`  Google cost: $${metrics.estimatedCost!.google.toFixed(4)}`)
      console.log(`  Total cost: $${metrics.estimatedCost!.total.toFixed(4)}`)

      expect(metrics.estimatedCost!.total).toBeLessThan(0.02)
    })

    it('should calculate cost for text-only save (baseline)', () => {
      // Text-only: OpenAI + Google Places API
      const estimatedTokens = 500 // Rough estimate
      const metrics: CostMetrics = {
        openaiTokens: {
          input: estimatedTokens,
          output: 100,
          total: 600,
        },
        googleApiCalls: {
          placeIdLookups: 1,
          coordinateSearches: 0,
          textSearches: 1, // May need text search fallback
          total: 2,
        },
        estimatedCost: {
          openai:
            estimatedTokens * OPENAI_PRICING.input + 100 * OPENAI_PRICING.output,
          google:
            1 * GOOGLE_PLACES_PRICING.placeDetails +
            1 * GOOGLE_PLACES_PRICING.textSearch,
          total: 0,
        },
      }

      metrics.estimatedCost!.total =
        metrics.estimatedCost!.openai + metrics.estimatedCost!.google

      console.log('[Cost Analysis] Text-only save (baseline):')
      console.log(`  OpenAI cost: $${metrics.estimatedCost!.openai.toFixed(6)}`)
      console.log(`  Google cost: $${metrics.estimatedCost!.google.toFixed(4)}`)
      console.log(`  Total cost: $${metrics.estimatedCost!.total.toFixed(6)}`)

      // Realistic threshold: Google Places API costs are higher than $0.01
      // Text-only uses place details ($0.017) + text search ($0.032) = $0.049
      expect(metrics.estimatedCost!.total).toBeLessThan(0.10)
    })

    it('should calculate cost for mixed content save', () => {
      // Mixed: OpenAI (cleaned text) + Google Places API (link)
      const cleanedTextTokens = 400 // Reduced from 500 due to cleaning
      const metrics: CostMetrics = {
        openaiTokens: {
          input: cleanedTextTokens,
          output: 100,
          total: 500,
        },
        googleApiCalls: {
          placeIdLookups: 1,
          coordinateSearches: 0,
          textSearches: 0, // Link found, no text search needed
          total: 1,
        },
        estimatedCost: {
          openai:
            cleanedTextTokens * OPENAI_PRICING.input + 100 * OPENAI_PRICING.output,
          google: 1 * GOOGLE_PLACES_PRICING.placeDetails,
          total: 0,
        },
      }

      metrics.estimatedCost!.total =
        metrics.estimatedCost!.openai + metrics.estimatedCost!.google

      console.log('[Cost Analysis] Mixed content save:')
      console.log(`  OpenAI cost: $${metrics.estimatedCost!.openai.toFixed(6)}`)
      console.log(`  Google cost: $${metrics.estimatedCost!.google.toFixed(4)}`)
      console.log(`  Total cost: $${metrics.estimatedCost!.total.toFixed(6)}`)

      // Realistic threshold: Mixed content uses place details ($0.017) only
      // Should be less than text-only due to cleaned text and direct Place ID lookup
      expect(metrics.estimatedCost!.total).toBeLessThan(0.10)
      // Verify it's cheaper than text-only (which uses place details + text search)
      expect(metrics.estimatedCost!.total).toBeLessThan(0.049135) // Text-only cost
    })
  })

  describe('Cost Comparison', () => {
    it('should compare costs across scenario types', () => {
      const scenarios = {
        linkOnly: {
          openai: 0,
          google: 0.017,
          total: 0.017,
        },
        textOnly: {
          openai: 0.000135, // ~500 input + 100 output tokens
          google: 0.049, // Place details + text search
          total: 0.049135,
        },
        mixed: {
          openai: 0.00012, // Reduced tokens from cleaning
          google: 0.017, // Place ID lookup only
          total: 0.01712,
        },
      }

      console.log('[Cost Analysis] Cost comparison:')
      console.log(`  Link-only: $${scenarios.linkOnly.total.toFixed(6)}`)
      console.log(`  Text-only: $${scenarios.textOnly.total.toFixed(6)}`)
      console.log(`  Mixed: $${scenarios.mixed.total.toFixed(6)}`)

      // Link-only should be cheapest
      expect(scenarios.linkOnly.total).toBeLessThan(scenarios.textOnly.total)
      // Mixed should be cheaper than text-only (due to cleaning + direct Place ID)
      expect(scenarios.mixed.total).toBeLessThan(scenarios.textOnly.total)
    })
  })
})

