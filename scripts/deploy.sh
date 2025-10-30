#!/bin/bash

# Acadly Deployment Script
# This script helps deploy Acadly to production

set -e

echo "🚀 Starting Acadly deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    echo "🔍 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI is not installed. Installing..."
        npm install -g vercel
    fi
    
    print_status "All dependencies are available"
}

# Check environment variables
check_environment() {
    echo "🔧 Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please copy .env.example and configure it."
        exit 1
    fi
    
    # Check required environment variables
    required_vars=(
        "DATABASE_URL"
        "DIRECT_URL"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "RAZORPAY_KEY_ID"
        "RAZORPAY_KEY_SECRET"
        "NEXT_PUBLIC_RAZORPAY_KEY_ID"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    print_status "Environment configuration is valid"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm ci
    print_status "Dependencies installed"
}

# Generate Prisma client
generate_prisma() {
    echo "🗄️ Generating Prisma client..."
    npx prisma generate
    print_status "Prisma client generated"
}

# Run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    # Check if we're in production
    if [ "$NODE_ENV" = "production" ]; then
        npx prisma migrate deploy
    else
        npx prisma migrate dev
    fi
    
    print_status "Database migrations completed"
}

# Build the application
build_app() {
    echo "🏗️ Building application..."
    npm run build
    print_status "Application built successfully"
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Type checking
    npm run type-check
    
    # Linting
    npm run lint
    
    print_status "All tests passed"
}

# Deploy to Vercel
deploy_vercel() {
    echo "🚀 Deploying to Vercel..."
    
    # Check if this is production deployment
    if [ "$1" = "production" ]; then
        vercel --prod --yes
        print_status "Deployed to production"
    else
        vercel --yes
        print_status "Deployed to preview"
    fi
}

# Post-deployment checks
post_deployment_checks() {
    echo "✅ Running post-deployment checks..."
    
    # Wait a bit for deployment to be ready
    sleep 10
    
    # Check if the site is accessible
    if [ "$1" = "production" ]; then
        url="https://acadly.in"
    else
        # Get the preview URL from Vercel
        url=$(vercel ls | grep acadly | head -1 | awk '{print $2}')
        url="https://$url"
    fi
    
    echo "🌐 Checking site accessibility: $url"
    
    if curl -f -s "$url" > /dev/null; then
        print_status "Site is accessible"
    else
        print_warning "Site might not be ready yet. Please check manually."
    fi
    
    echo "🔗 Site URL: $url"
}

# Main deployment function
main() {
    echo "🎯 Acadly Deployment Script"
    echo "=========================="
    
    # Parse command line arguments
    ENVIRONMENT=${1:-preview}
    
    if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "preview" ]; then
        print_error "Invalid environment. Use 'production' or 'preview'"
        exit 1
    fi
    
    echo "📍 Deploying to: $ENVIRONMENT"
    echo ""
    
    # Run deployment steps
    check_dependencies
    check_environment
    install_dependencies
    generate_prisma
    
    # Only run migrations in production
    if [ "$ENVIRONMENT" = "production" ]; then
        run_migrations
    fi
    
    build_app
    run_tests
    deploy_vercel "$ENVIRONMENT"
    post_deployment_checks "$ENVIRONMENT"
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "🌟 Your app is now live at: https://acadly.in"
        echo ""
        echo "📋 Post-deployment checklist:"
        echo "  • Test user registration and verification"
        echo "  • Test payment integration"
        echo "  • Verify admin panel access"
        echo "  • Check cron job execution"
        echo "  • Monitor error logs"
    else
        echo "🔍 Preview deployment ready for testing"
        echo ""
        echo "📋 Testing checklist:"
        echo "  • Test core functionality"
        echo "  • Verify API endpoints"
        echo "  • Check responsive design"
        echo "  • Test payment flow (use test keys)"
    fi
}

# Run the main function with all arguments
main "$@"