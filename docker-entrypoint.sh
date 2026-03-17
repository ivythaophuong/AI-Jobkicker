#!/bin/sh

# This script runs when the Docker container starts.
# It injects environment variables into the compiled React app before starting Nginx.

echo "Injecting environment variables into Vite production bundle..."

# Find the main JS bundle in the assets directory (Vite naming pattern)
APP_FILE=$(ls /usr/share/nginx/html/assets/index-*.js | head -n 1)

if [ -n "$APP_FILE" ] && [ -f "$APP_FILE" ]; then
    echo "Processing $APP_FILE..."
    
    # Replace API Keys if present in the environment
    if [ -n "$VITE_ANTHROPIC_API_KEY" ]; then
        sed -i "s|__CLAUDE_KEY_PLACEHOLDER__|$VITE_ANTHROPIC_API_KEY|g" "$APP_FILE"
        echo "✓ Claude API key injected"
    fi

    if [ -n "$VITE_OPENAI_API_KEY" ]; then
        sed -i "s|__OPENAI_KEY_PLACEHOLDER__|$VITE_OPENAI_API_KEY|g" "$APP_FILE"
        echo "✓ OpenAI API key injected"
    fi

    if [ -n "$VITE_GEMINI_API_KEY" ]; then
        sed -i "s|__GEMINI_KEY_PLACEHOLDER__|$VITE_GEMINI_API_KEY|g" "$APP_FILE"
        echo "✓ Gemini API key injected"
    fi
else
    echo "Warning: Production bundle not found at /usr/share/nginx/html/assets/index-*.js"
fi

echo "Starting Nginx..."
# Start Nginx in the foreground
exec nginx -g 'daemon off;'
