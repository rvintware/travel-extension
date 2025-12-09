#!/bin/bash

# E2E Test Execution Script
# 
# Runs all E2E tests and generates reports
# 
# Usage:
#   ./scripts/run-e2e-tests.sh
#   ./scripts/run-e2e-tests.sh --performance
#   ./scripts/run-e2e-tests.sh --cost-analysis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create results directory
RESULTS_DIR="__tests__/e2e/results"
mkdir -p "$RESULTS_DIR"

# Timestamp for reports
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${GREEN}Running E2E Tests...${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if Inngest dev server is running
if ! curl -s http://localhost:8288 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Warning: Inngest dev server may not be running${NC}"
  echo "   Start with: npx inngest-cli dev"
  echo ""
fi

# Run E2E tests
echo -e "${GREEN}Running E2E tests...${NC}"
pnpm test:e2e --json > "$RESULTS_DIR/e2e_results_$TIMESTAMP.json" 2>&1 || true

# Run performance tests if requested
if [[ "$1" == "--performance" ]] || [[ "$1" == "--all" ]]; then
  echo -e "${GREEN}Running performance benchmarks...${NC}"
  pnpm test:performance --json > "$RESULTS_DIR/performance_results_$TIMESTAMP.json" 2>&1 || true
fi

# Run cost analysis if requested
if [[ "$1" == "--cost-analysis" ]] || [[ "$1" == "--all" ]]; then
  echo -e "${GREEN}Running cost analysis...${NC}"
  pnpm test -- __tests__/e2e/cost-analysis.test.ts --json > "$RESULTS_DIR/cost_analysis_$TIMESTAMP.json" 2>&1 || true
fi

# Generate summary report
echo ""
echo -e "${GREEN}Generating summary report...${NC}"
cat > "$RESULTS_DIR/summary_$TIMESTAMP.md" << EOF
# E2E Test Results Summary

**Date:** $(date)
**Timestamp:** $TIMESTAMP

## Test Execution

- E2E Tests: Completed
- Performance Tests: $([ "$1" == "--performance" ] || [ "$1" == "--all" ] && echo "Completed" || echo "Skipped")
- Cost Analysis: $([ "$1" == "--cost-analysis" ] || [ "$1" == "--all" ] && echo "Completed" || echo "Skipped")

## Results Files

- E2E Results: \`e2e_results_$TIMESTAMP.json\`
- Performance Results: \`performance_results_$TIMESTAMP.json\`
- Cost Analysis: \`cost_analysis_$TIMESTAMP.json\`

## Next Steps

1. Review test results in JSON files
2. Update RESULTS.md with findings
3. Address any failing tests
4. Document performance metrics
EOF

echo ""
echo -e "${GREEN}✓ Test execution complete!${NC}"
echo "Results saved to: $RESULTS_DIR/"
echo "Summary: $RESULTS_DIR/summary_$TIMESTAMP.md"

