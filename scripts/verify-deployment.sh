#!/bin/bash
# QuantEnergx Deployment Verification Script
# Validates all deployment configurations and files

echo "🚀 QuantEnergx Deployment Configuration Verification"
echo "=================================================="

# Check for required files
echo "📋 Checking deployment files..."

files=(
    "backend/Dockerfile"
    "frontend/Dockerfile" 
    "frontend/nginx.conf"
    "docker-compose.yml"
    "frontend/vercel.json"
    "render.yaml"
    "railway.json"
    "backend/.env.example"
    "frontend/.env.example"
    "frontend/public/index.html"
    "frontend/public/manifest.json"
)

missing_files=()
for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file"
    else
        echo "❌ $file"
        missing_files+=("$file")
    fi
done

echo ""

# Check package.json files
echo "📦 Checking package.json files..."
if [[ -f "backend/package.json" ]] && [[ -f "frontend/package.json" ]]; then
    echo "✅ Backend and frontend package.json files exist"
else
    echo "❌ Missing package.json files"
fi

echo ""

# Validate Docker Compose
echo "🐳 Validating Docker Compose configuration..."
if command -v docker &> /dev/null; then
    if docker compose config >/dev/null 2>&1; then
        echo "✅ Docker Compose configuration is valid"
    else
        echo "❌ Docker Compose configuration has errors"
    fi
else
    echo "ℹ️  Docker not available for validation"
fi

echo ""

# Check JSON validity
echo "📄 Validating JSON configurations..."
json_files=("frontend/vercel.json" "railway.json" "frontend/public/manifest.json")
for file in "${json_files[@]}"; do
    if [[ -f "$file" ]]; then
        if python3 -m json.tool "$file" >/dev/null 2>&1; then
            echo "✅ $file is valid JSON"
        else
            echo "❌ $file has invalid JSON"
        fi
    fi
done

echo ""

# Summary
if [[ ${#missing_files[@]} -eq 0 ]]; then
    echo "🎉 All deployment files are present!"
    echo "✨ Ready for cloud deployment on Render, Vercel, Railway, and Docker platforms"
else
    echo "⚠️  Missing files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
fi

echo ""
echo "🔗 Deployment URLs:"
echo "   - Local: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - Health Check: http://localhost:3001/health"