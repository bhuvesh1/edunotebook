#!/bin/bash
# Extract unique sims tarball if present
if [ -f "public/unique-sims.tar.gz" ]; then
  echo "Extracting unique sims..."
  tar --no-same-owner -xzf public/unique-sims.tar.gz -C app/components/sims/
  echo "Done"
fi
