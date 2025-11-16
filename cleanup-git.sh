#!/bin/bash

# Git Cleanup Script
# Removes files that should be ignored but were accidentally committed

echo "=========================================="
echo "Git Repository Cleanup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}This script will remove the following from git:${NC}"
echo "  - node_modules/"
echo "  - dist/"
echo "  - .env files (except templates)"
echo "  - deployment-package/"
echo "  - *.zip files"
echo "  - logs/"
echo "  - uploads/ (except .gitkeep)"
echo "  - backups/"
echo ""
echo -e "${RED}WARNING: This will modify your git history!${NC}"
echo -e "${YELLOW}Make sure you have a backup before proceeding.${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo -e "${YELLOW}Removing files from git...${NC}"

# Remove node_modules
if git ls-files | grep -q "node_modules"; then
    echo "Removing node_modules..."
    git rm -r --cached node_modules 2>/dev/null || true
    git rm -r --cached backend/node_modules 2>/dev/null || true
fi

# Remove dist
if git ls-files | grep -q "^dist/"; then
    echo "Removing dist..."
    git rm -r --cached dist 2>/dev/null || true
fi

# Remove .env files (keep templates)
if git ls-files | grep -q "\.env$"; then
    echo "Removing .env files..."
    git rm --cached .env 2>/dev/null || true
    git rm --cached backend/.env 2>/dev/null || true
    git rm --cached .env.local 2>/dev/null || true
    git rm --cached backend/.env.local 2>/dev/null || true
fi

# Remove deployment artifacts
if git ls-files | grep -q "deployment-package"; then
    echo "Removing deployment-package..."
    git rm -r --cached deployment-package 2>/dev/null || true
fi

if git ls-files | grep -q "\.zip$"; then
    echo "Removing .zip files..."
    git rm --cached *.zip 2>/dev/null || true
fi

# Remove logs
if git ls-files | grep -q "logs/"; then
    echo "Removing logs..."
    git rm -r --cached logs 2>/dev/null || true
    git rm -r --cached backend/logs 2>/dev/null || true
fi

# Remove uploads (except .gitkeep)
if git ls-files | grep -q "uploads/"; then
    echo "Removing uploads..."
    git rm -r --cached backend/uploads 2>/dev/null || true
    git add backend/uploads/.gitkeep 2>/dev/null || true
fi

# Remove backups
if git ls-files | grep -q "backups/"; then
    echo "Removing backups..."
    git rm -r --cached backups 2>/dev/null || true
    git rm -r --cached backend/backups 2>/dev/null || true
fi

# Remove test-results
if git ls-files | grep -q "test-results/"; then
    echo "Removing test-results..."
    git rm -r --cached test-results 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}Cleanup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review changes: git status"
echo "2. Commit changes: git commit -m 'Remove ignored files from git'"
echo "3. Push changes: git push"
echo ""
echo -e "${YELLOW}Note: If you committed secrets (.env files), regenerate them!${NC}"
echo ""
