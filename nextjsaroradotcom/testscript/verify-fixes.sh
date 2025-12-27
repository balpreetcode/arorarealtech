#!/bin/bash

echo "==================================="
echo "Verifying Arora Real Tech Fixes"
echo "==================================="

BASE_URL="http://localhost:3002"

echo ""
echo "1. Testing homepage loads..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$RESPONSE" = "200" ]; then
    echo "   ✓ Homepage loads successfully (HTTP $RESPONSE)"
else
    echo "   ✗ Homepage failed (HTTP $RESPONSE)"
    exit 1
fi

echo ""
echo "2. Checking homepage content..."
CONTENT=$(curl -s "$BASE_URL/")
if echo "$CONTENT" | grep -q "Arora Real Tech"; then
    echo "   ✓ Homepage contains title"
else
    echo "   ✗ Homepage missing title"
fi

if echo "$CONTENT" | grep -q "Latest Properties"; then
    echo "   ✓ Homepage contains Latest Properties section"
else
    echo "   ✗ Homepage missing Latest Properties section"
fi

if echo "$CONTENT" | grep -q "About Us"; then
    echo "   ✓ Navigation links present"
else
    echo "   ✗ Navigation links missing"
fi

echo ""
echo "3. Checking for property listings..."
PROPERTY_COUNT=$(echo "$CONTENT" | grep -o "<article" | wc -l)
echo "   Found $PROPERTY_COUNT property listings"
if [ "$PROPERTY_COUNT" -gt 0 ]; then
    echo "   ✓ Properties are being displayed"
else
    echo "   ✗ No properties found"
fi

echo ""
echo "4. Checking for images..."
IMAGE_COUNT=$(echo "$CONTENT" | grep -o 'src="/sites/default/files/' | wc -l)
echo "   Found $IMAGE_COUNT images from /sites/default/files/"
if [ "$IMAGE_COUNT" -gt 0 ]; then
    echo "   ✓ Images are being rendered"
else
    echo "   ⚠ No images found (might be expected if no nodes have images)"
fi

echo ""
echo "5. Testing property page link..."
# Extract first property link
FIRST_LINK=$(echo "$CONTENT" | grep -oP 'href="[^"]+(?=")' | grep -v "about-us\|contact\|sitemap\|rss.xml" | head -1 | cut -d'"' -f2)
if [ ! -z "$FIRST_LINK" ]; then
    echo "   Testing link: $FIRST_LINK"
    LINK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$FIRST_LINK")
    if [ "$LINK_RESPONSE" = "200" ]; then
        echo "   ✓ Property page loads successfully (HTTP $LINK_RESPONSE)"
    else
        echo "   ✗ Property page failed (HTTP $LINK_RESPONSE)"
    fi
else
    echo "   ⚠ No property links found to test"
fi

echo ""
echo "==================================="
echo "Verification Complete!"
echo "==================================="
