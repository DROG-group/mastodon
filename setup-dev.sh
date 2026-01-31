#!/bin/bash
# DROG Research Instance - Setup Script
# ======================================

set -e

echo "=== Mastodon Glitch Development Setup ==="
echo ""

# Create necessary directories
echo "[1/8] Creating directories..."
mkdir -p public/system postgres14 redis

# Build the images from source
echo "[2/8] Building Docker images (this takes a while on first run)..."
docker-compose build

# Start the database and redis first
echo "[3/8] Starting database services..."
docker-compose up -d db redis
sleep 10  # Wait for postgres to be ready

# Generate secrets if not set
echo "[4/8] Generating secrets..."
if grep -q "^SECRET_KEY_BASE=$" .env.production 2>/dev/null || grep -q "development_secret" .env.production; then
    SECRET=$(docker-compose run --rm web bundle exec rails secret)
    OTP=$(docker-compose run --rm web bundle exec rails secret)

    # Generate VAPID keys
    VAPID_OUTPUT=$(docker-compose run --rm web bundle exec rails mastodon:webpush:generate_vapid_key 2>/dev/null || echo "")
    VAPID_PRIVATE=$(echo "$VAPID_OUTPUT" | grep "VAPID_PRIVATE_KEY" | cut -d'=' -f2 || echo "")
    VAPID_PUBLIC=$(echo "$VAPID_OUTPUT" | grep "VAPID_PUBLIC_KEY" | cut -d'=' -f2 || echo "")

    # Update .env.production with real secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/^SECRET_KEY_BASE=.*/SECRET_KEY_BASE=$SECRET/" .env.production
        sed -i '' "s/^OTP_SECRET=.*/OTP_SECRET=$OTP/" .env.production
        if [ -n "$VAPID_PRIVATE" ]; then
            sed -i '' "s/^VAPID_PRIVATE_KEY=.*/VAPID_PRIVATE_KEY=$VAPID_PRIVATE/" .env.production
            sed -i '' "s/^VAPID_PUBLIC_KEY=.*/VAPID_PUBLIC_KEY=$VAPID_PUBLIC/" .env.production
        fi
    else
        sed -i "s/^SECRET_KEY_BASE=.*/SECRET_KEY_BASE=$SECRET/" .env.production
        sed -i "s/^OTP_SECRET=.*/OTP_SECRET=$OTP/" .env.production
        if [ -n "$VAPID_PRIVATE" ]; then
            sed -i "s/^VAPID_PRIVATE_KEY=.*/VAPID_PRIVATE_KEY=$VAPID_PRIVATE/" .env.production
            sed -i "s/^VAPID_PUBLIC_KEY=.*/VAPID_PUBLIC_KEY=$VAPID_PUBLIC/" .env.production
        fi
    fi
    echo "   Secrets generated and saved to .env.production"
fi

# Setup database
echo "[5/8] Setting up database..."
docker-compose run --rm web bundle exec rails db:setup

# Create admin account
echo "[6/8] Installing Node/Yarn + JS dependencies..."
docker-compose run --rm -u root web bash -lc "node -v >/dev/null 2>&1 || (apt-get update && apt-get install -y nodejs npm)"
docker-compose run --rm -u root web bash -lc "corepack enable && corepack prepare yarn@4.12.0 --activate"
docker-compose run --rm -u root web bash -lc "chown -R mastodon:mastodon /opt/mastodon"
docker-compose run --rm -u mastodon web bash -lc "cd /opt/mastodon && yarn install"
docker-compose run --rm -u mastodon web bash -lc "cd /opt/mastodon && yarn build:development"

# Create admin account
echo "[7/8] Creating admin account..."
echo ""
echo "Creating admin user: admin@localhost"
docker-compose run --rm web bin/tootctl accounts create admin --email=admin@localhost --confirmed --role=Owner || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start Mastodon:"
echo "  cd mastodon-glitch"
echo "  docker-compose up -d"
echo ""
echo "Access at: http://localhost:3000"
echo "Admin user: admin@localhost"
echo ""
echo "To create a password for admin:"
echo "  docker-compose run --rm web bin/tootctl accounts modify admin --reset-password"
echo ""
echo "To rebuild after code changes:"
echo "  docker-compose build"
echo "  docker-compose up -d"
echo "  docker-compose run --rm -u mastodon web bash -lc \"cd /opt/mastodon && yarn install\""
echo "  docker-compose run --rm -u mastodon web bash -lc \"cd /opt/mastodon && yarn build:development\""
