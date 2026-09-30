#!/bin/bash
# Extract unique sims tarball if present
set -e
echo "=== Extract sims start ==="
echo "PWD: $(pwd)"
echo "Checking for tarball..."
if [ -f "public/unique-sims.tar.gz" ]; then
  echo "Found tarball, size: $(du -h public/unique-sims.tar.gz | cut -f1)"
  echo "Target dir: app/components/sims/"
  ls app/components/sims/ | head -5
  echo "Extracting..."
  tar --no-same-owner -xzf public/unique-sims.tar.gz -C app/components/sims/
  echo "Extraction done. Unique files:"
  ls app/components/sims/unique/Topic*.tsx 2>/dev/null | wc -l
else
  echo "No tarball found, skipping"
fi
echo "=== Extract sims end ==="
