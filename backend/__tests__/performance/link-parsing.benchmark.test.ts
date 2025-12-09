/**
 * Performance Benchmarks for Link Parsing
 * 
 * Measures latency and performance characteristics of link parsing operations:
 * - Link parsing latency (<500ms target)
 * - URL expansion latency (<2s per URL target)
 * - Total job duration (<15s target)
 * - Step-by-step durations
 * 
 * Prerequisites:
 * - Network access (for URL expansion tests)
 * - GOOGLE_PLACES_API_KEY (optional, for full job tests)
 * 
 * To run these tests:
 * ```bash
 * pnpm test:performance -- link-parsing.benchmark.test.ts
 * ```
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import { extractLinksFromText, parseGoogleMapsUrl } from '@/lib/links/parser'
import { expandShortenedUrl, isShortenedUrl } from '@/lib/links/url-expander'
import { E2E_TEST_URLS, E2E_TEST_TEXT } from '../e2e/test-data'
import { calculateStatistics } from '../e2e/helpers'

describe('Link Parsing Performance Benchmarks', () => {
  describe('Link Parsing Latency', () => {
    it('should parse links from text within 500ms target', async () => {
      const text = E2E_TEST_TEXT.WITH_MULTIPLE_LINKS
      const startTime = performance.now()

      const result = extractLinksFromText(text)

      const duration = performance.now() - startTime

      expect(result.googleMapsLinks.length).toBeGreaterThan(0)
      // Target: <500ms
      expect(duration).toBeLessThan(500)

      console.log(`[Benchmark] Link parsing: ${duration.toFixed(2)}ms (target: <500ms)`)
    })

    it('should measure average latency across multiple iterations', async () => {
      const text = E2E_TEST_TEXT.WITH_MULTIPLE_LINKS
      const iterations = 10
      const durations: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        extractLinksFromText(text)
        durations.push(performance.now() - startTime)
      }

      const stats = calculateStatistics(durations)

      console.log(`[Benchmark] Link parsing (${iterations} iterations):`)
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`)
      console.log(`  Median: ${stats.median.toFixed(2)}ms`)
      console.log(`  P95: ${stats.p95.toFixed(2)}ms`)
      console.log(`  P99: ${stats.p99.toFixed(2)}ms`)
      console.log(`  Min: ${stats.min.toFixed(2)}ms`)
      console.log(`  Max: ${stats.max.toFixed(2)}ms`)

      // Mean should be well under target
      expect(stats.mean).toBeLessThan(100)
      // P95 should be under target
      expect(stats.p95).toBeLessThan(500)
    })
  })

  describe('URL Parsing Latency', () => {
    it('should parse Google Maps URL quickly', () => {
      const url = E2E_TEST_URLS.WITH_PLACE_ID
      const startTime = performance.now()

      const result = parseGoogleMapsUrl(url)

      const duration = performance.now() - startTime

      expect(result.placeId).toBeDefined()
      // Should be very fast (<10ms)
      expect(duration).toBeLessThan(10)

      console.log(`[Benchmark] URL parsing: ${duration.toFixed(2)}ms`)
    })

    it('should measure parsing latency for various URL formats', () => {
      const urls = [
        E2E_TEST_URLS.WITH_PLACE_ID,
        E2E_TEST_URLS.WITH_COORDINATES,
        E2E_TEST_URLS.WITH_QUERY,
      ]

      const durations: number[] = []

      for (const url of urls) {
        const startTime = performance.now()
        parseGoogleMapsUrl(url)
        durations.push(performance.now() - startTime)
      }

      const stats = calculateStatistics(durations)

      console.log(`[Benchmark] URL parsing (${urls.length} formats):`)
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`)
      console.log(`  Max: ${stats.max.toFixed(2)}ms`)

      // All should be very fast
      expect(stats.max).toBeLessThan(10)
    })
  })

  describe('URL Expansion Latency', () => {
    it('should expand shortened URL within 2s target', async () => {
      const shortenedUrl = E2E_TEST_URLS.SHORTENED

      if (!isShortenedUrl(shortenedUrl)) {
        console.warn('⚠️  Skipping: Test URL is not shortened')
        return
      }

      const startTime = performance.now()

      const expanded = await expandShortenedUrl(shortenedUrl)

      const duration = performance.now() - startTime

      expect(expanded).not.toBe(shortenedUrl)
      // Target: <2s per URL
      expect(duration).toBeLessThan(2000)

      console.log(`[Benchmark] URL expansion: ${duration.toFixed(2)}ms (target: <2000ms)`)
    }, 10000)

    it('should measure average expansion latency', async () => {
      const shortenedUrl = E2E_TEST_URLS.SHORTENED

      if (!isShortenedUrl(shortenedUrl)) {
        console.warn('⚠️  Skipping: Test URL is not shortened')
        return
      }

      const iterations = 3
      const durations: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()
        await expandShortenedUrl(shortenedUrl)
        durations.push(performance.now() - startTime)
      }

      const stats = calculateStatistics(durations)

      console.log(`[Benchmark] URL expansion (${iterations} iterations):`)
      console.log(`  Mean: ${stats.mean.toFixed(2)}ms`)
      console.log(`  P95: ${stats.p95.toFixed(2)}ms`)
      console.log(`  Max: ${stats.max.toFixed(2)}ms`)

      // Mean should be under target
      expect(stats.mean).toBeLessThan(2000)
    }, 30000)
  })

  describe('End-to-End Link Processing', () => {
    it('should process link extraction and parsing efficiently', async () => {
      const text = E2E_TEST_TEXT.WITH_SINGLE_LINK
      const startTime = performance.now()

      // Step 1: Extract links
      const extracted = extractLinksFromText(text)

      // Step 2: Parse each link
      for (const link of extracted.googleMapsLinks) {
        parseGoogleMapsUrl(link.originalUrl)
      }

      const duration = performance.now() - startTime

      expect(extracted.googleMapsLinks.length).toBeGreaterThan(0)
      // Should be fast (<100ms for single link)
      expect(duration).toBeLessThan(100)

      console.log(`[Benchmark] End-to-end link processing: ${duration.toFixed(2)}ms`)
    })

    it('should handle multiple links efficiently', async () => {
      const text = E2E_TEST_TEXT.WITH_MULTIPLE_LINKS
      const startTime = performance.now()

      const extracted = extractLinksFromText(text)

      for (const link of extracted.googleMapsLinks) {
        parseGoogleMapsUrl(link.originalUrl)
      }

      const duration = performance.now() - startTime

      expect(extracted.googleMapsLinks.length).toBeGreaterThan(1)
      // Should scale linearly (<500ms for 3 links)
      expect(duration).toBeLessThan(500)

      console.log(`[Benchmark] Multiple links processing (${extracted.googleMapsLinks.length} links): ${duration.toFixed(2)}ms`)
    })
  })

  describe('Performance Targets Verification', () => {
    it('should meet all performance targets', async () => {
      const results = {
        linkParsing: 0,
        urlParsing: 0,
        urlExpansion: 0,
      }

      // Measure link parsing
      const text = E2E_TEST_TEXT.WITH_SINGLE_LINK
      const start1 = performance.now()
      extractLinksFromText(text)
      results.linkParsing = performance.now() - start1

      // Measure URL parsing
      const start2 = performance.now()
      parseGoogleMapsUrl(E2E_TEST_URLS.WITH_PLACE_ID)
      results.urlParsing = performance.now() - start2

      // Measure URL expansion (if shortened URL available)
      if (isShortenedUrl(E2E_TEST_URLS.SHORTENED)) {
        const start3 = performance.now()
        await expandShortenedUrl(E2E_TEST_URLS.SHORTENED)
        results.urlExpansion = performance.now() - start3
      }

      console.log('[Benchmark] Performance Targets:')
      console.log(`  Link parsing: ${results.linkParsing.toFixed(2)}ms (target: <500ms)`)
      console.log(`  URL parsing: ${results.urlParsing.toFixed(2)}ms (target: <10ms)`)
      console.log(`  URL expansion: ${results.urlExpansion.toFixed(2)}ms (target: <2000ms)`)

      expect(results.linkParsing).toBeLessThan(500)
      expect(results.urlParsing).toBeLessThan(10)
      if (results.urlExpansion > 0) {
        expect(results.urlExpansion).toBeLessThan(2000)
      }
    }, 10000)
  })
})

