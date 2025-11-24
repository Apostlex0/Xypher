#!/bin/bash

# Helius Setup Script for ZEC Dark Perps
# This script helps you set up Helius webhooks for local development

set -e

echo "🚀 Helius Webhook Setup"
echo "======================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env from .env.example first"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$HELIUS_API_KEY" ]; then
    echo "❌ HELIUS_API_KEY not set in .env"
    exit 1
fi

if [ -z "$PROGRAM_ID" ]; then
    echo "❌ PROGRAM_ID not set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "   API Key: ${HELIUS_API_KEY:0:8}..."
echo "   Program ID: $PROGRAM_ID"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "⚠️  ngrok not found"
    echo "   For local development, you need ngrok to expose your server"
    echo "   Install: brew install ngrok"
    echo ""
    echo "   Or use the Helius dashboard to create webhooks manually:"
    echo "   https://dashboard.helius.dev/"
    echo ""
    read -p "Continue without ngrok? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ ngrok is installed"
    echo ""
    echo "📡 Starting ngrok..."
    echo "   Run this in a separate terminal:"
    echo "   ngrok http 3001"
    echo ""
    echo "   Then copy the https URL (e.g., https://abc123.ngrok.io)"
    echo "   and update WEBHOOK_URL in .env"
    echo ""
fi

# Ask if user wants to create webhook now
echo "Options:"
echo "  1) List existing webhooks"
echo "  2) Create new webhook (requires ngrok URL in .env)"
echo "  3) Exit"
echo ""
read -p "Choose option (1-3): " option

case $option in
    1)
        echo ""
        echo "📋 Listing webhooks..."
        npm run webhook:list
        ;;
    2)
        if [ -z "$WEBHOOK_URL" ] || [ "$WEBHOOK_URL" = "http://localhost:3001/webhooks/helius" ]; then
            echo ""
            echo "⚠️  WEBHOOK_URL is not set to a public URL"
            echo "   Please:"
            echo "   1. Run: ngrok http 3001"
            echo "   2. Copy the https URL"
            echo "   3. Update WEBHOOK_URL in .env"
            echo "   4. Run this script again"
            exit 1
        fi
        echo ""
        echo "🔧 Creating webhook..."
        echo "   URL: $WEBHOOK_URL"
        npm run webhook:create
        ;;
    3)
        echo "👋 Exiting"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
echo ""
echo "Next steps:"
echo "  1. Start the matching engine: npm run dev"
echo "  2. Test the webhook endpoint"
echo "  3. Deploy your Solana program"
echo "  4. Transactions will trigger webhooks automatically!"
