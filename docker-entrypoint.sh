#!/bin/sh

# Injects environment variables into the compiled Vite bundle at container start.
# The build uses placeholder strings; this script replaces them with real values.

echo "Injecting environment variables into Vite production bundle..."

APP_FILE=$(ls /usr/share/nginx/html/assets/index-*.js 2>/dev/null | head -n 1)

if [ -z "$APP_FILE" ] || [ ! -f "$APP_FILE" ]; then
    echo "ERROR: Production bundle not found at /usr/share/nginx/html/assets/index-*.js"
    exit 1
fi

echo "Processing $APP_FILE..."

inject() {
    local placeholder="$1"
    local value="$2"
    local label="$3"
    if [ -n "$value" ]; then
        sed -i "s|${placeholder}|${value}|g" "$APP_FILE"
        echo "✓ ${label} injected"
    else
        echo "⚠ ${label} not set — feature may not work"
    fi
}

inject "__CLAUDE_KEY_PLACEHOLDER__"   "$VITE_ANTHROPIC_API_KEY"  "Anthropic API key"
inject "__OPENAI_KEY_PLACEHOLDER__"   "$VITE_OPENAI_API_KEY"     "OpenAI API key"
inject "__GEMINI_KEY_PLACEHOLDER__"   "$VITE_GEMINI_API_KEY"     "Gemini API key"
inject "__SUPABASE_URL_PLACEHOLDER__" "$VITE_SUPABASE_URL"       "Supabase URL"
inject "__SUPABASE_ANON_PLACEHOLDER__" "$VITE_SUPABASE_ANON"     "Supabase anon key"

echo "Starting Nginx..."
exec nginx -g 'daemon off;'
