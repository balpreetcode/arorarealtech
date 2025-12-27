#!/bin/bash

echo "========================================="
echo "TESTING PROPERTY FILTERS"
echo "========================================="
echo ""

BASE_URL="http://localhost:3002"

echo "1. Testing homepage (no filter)..."
TOTAL=$(curl -s "$BASE_URL/" | grep -o '<article' | wc -l)
echo "   Found $TOTAL property cards"

echo ""
echo "2. Testing Plots filter..."
PLOTS=$(curl -s "$BASE_URL/?filter=plots" | grep -o '<article' | wc -l)
PLOTS_ACTIVE=$(curl -s "$BASE_URL/?filter=plots" | grep 'filter-btn active' | grep -i 'plots' | wc -l)
echo "   Found $PLOTS property cards"
if [ "$PLOTS_ACTIVE" -gt 0 ]; then
    echo "   ✓ 'Plots' button is active"
else
    echo "   ✗ 'Plots' button NOT active"
fi

echo ""
echo "3. Testing Residential filter..."
RESI=$(curl -s "$BASE_URL/?filter=residential" | grep -o '<article' | wc -l)
RESI_ACTIVE=$(curl -s "$BASE_URL/?filter=residential" | grep 'filter-btn active' | wc -l)
echo "   Found $RESI property cards"
if [ "$RESI_ACTIVE" -gt 0 ]; then
    echo "   ✓ Filter button is active"
else
    echo "   ✗ Filter button NOT active"
fi

echo ""
echo "4. Testing Agricultural filter..."
AGR=$(curl -s "$BASE_URL/?filter=agricultural" | grep -o '<article' | wc -l)
echo "   Found $AGR property cards"

echo ""
echo "5. Testing Commercial filter..."
COMM=$(curl -s "$BASE_URL/?filter=commercial" | grep -o '<article' | wc -l)
echo "   Found $COMM property cards"

echo ""
echo "========================================="
echo "FILTER TEST SUMMARY"
echo "========================================="
echo "Total properties: $TOTAL"
echo "Plots: $PLOTS"
echo "Residential: $RESI"
echo "Agricultural: $AGR"
echo "Commercial: $COMM"
echo ""

if [ "$PLOTS" -gt 0 ] && [ "$RESI" -gt 0 ]; then
    echo "✅ Filters are working!"
else
    echo "⚠️  Some filters may not be working correctly"
fi

echo "========================================="
