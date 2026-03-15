#!/bin/bash
##############################################################
# CareerAiHub — Full VPS Deployment Script
# Tested on Ubuntu 22.04 (Hostinger VPS)
#
# USAGE:
#   1. SSH into your Hostinger VPS
#   2. Paste this entire script and run it
#   3. Follow the prompts
#
# WHAT THIS DOES:
#   - Installs Nginx, Node.js 20, Certbot
#   - Creates /var/www/careeraihub directory
#   - Sets up Nginx config
#   - Gets free SSL certificate from Let's Encrypt
#   - Deploys landing page + React app
##############################################################

set -e  # Stop on any error

echo ""
echo "======================================================"
echo "  CareerAiHub — VPS Deployment"
echo "======================================================"
echo ""

# ── STEP 0: Confirm domain ────────────────────────────────
read -p "Enter your domain (e.g. careeraihub.com): " DOMAIN
read -p "Enter your email (for SSL certificate): " EMAIL

echo ""
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""
read -p "Correct? Press Enter to continue or Ctrl+C to cancel..."

# ── STEP 1: Update system ─────────────────────────────────
echo ""
echo "[1/7] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq
echo "✓ System updated"

# ── STEP 2: Install Nginx ─────────────────────────────────
echo ""
echo "[2/7] Installing Nginx..."
apt-get install -y nginx -qq
systemctl enable nginx
systemctl start nginx
echo "✓ Nginx installed and running"

# ── STEP 3: Install Node.js 20 ────────────────────────────
echo ""
echo "[3/7] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -qq
apt-get install -y nodejs -qq
echo "✓ Node.js $(node --version) installed"

# ── STEP 4: Install Certbot ───────────────────────────────
echo ""
echo "[4/7] Installing Certbot (free SSL)..."
apt-get install -y certbot python3-certbot-nginx -qq
echo "✓ Certbot installed"

# ── STEP 5: Create web directory ─────────────────────────
echo ""
echo "[5/7] Creating web directory..."
mkdir -p /var/www/careeraihub/app
chown -R www-data:www-data /var/www/careeraihub
chmod -R 755 /var/www/careeraihub
echo "✓ Directory /var/www/careeraihub created"

# ── STEP 6: Nginx config ──────────────────────────────────
echo ""
echo "[6/7] Configuring Nginx..."

cat > /etc/nginx/sites-available/careeraihub << NGINXEOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://$DOMAIN\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    root /var/www/careeraihub;
    index index.html;

    location = / {
        try_files /index.html =404;
    }

    location ~* \.(html|css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf)\$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location /app {
        alias /var/www/careeraihub/app;
        try_files \$uri \$uri/ /app/index.html;
        add_header Cache-Control "no-cache";
    }

    if (\$host = www.$DOMAIN) {
        return 301 https://$DOMAIN\$request_uri;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/javascript application/javascript application/json;

    error_page 404 /index.html;
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/careeraihub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Temporary HTTP-only config for certbot
cat > /etc/nginx/sites-available/careeraihub-temp << TEMPEOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root /var/www/careeraihub;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
}
TEMPEOF
ln -sf /etc/nginx/sites-available/careeraihub-temp /etc/nginx/sites-enabled/careeraihub-temp

nginx -t && systemctl reload nginx
echo "✓ Nginx configured"

# ── STEP 7: SSL certificate ───────────────────────────────
echo ""
echo "[7/7] Getting free SSL certificate from Let's Encrypt..."
echo "Make sure your domain DNS A record points to this server IP first!"
echo ""
read -p "Press Enter when DNS is ready (or Ctrl+C to skip SSL for now)..."

certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Remove temp config, switch to SSL config
rm -f /etc/nginx/sites-enabled/careeraihub-temp
nginx -t && systemctl reload nginx

echo "✓ SSL certificate installed"

# ── Auto-renew SSL ────────────────────────────────────────
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
echo "✓ Auto-renewal configured"

echo ""
echo "======================================================"
echo "  ✅ Server setup complete!"
echo "======================================================"
echo ""
echo "Next steps:"
echo "  1. Upload index.html → /var/www/careeraihub/"
echo "  2. Upload app files  → /var/www/careeraihub/app/"
echo "  3. Visit https://$DOMAIN"
echo ""
echo "Upload commands (run from your LOCAL machine):"
echo "  scp index.html root@YOUR_VPS_IP:/var/www/careeraihub/"
echo "  scp -r app/* root@YOUR_VPS_IP:/var/www/careeraihub/app/"
echo ""
