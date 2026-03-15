#!/bin/sh

# This script runs when the Docker container starts.
# It injects environment variables into the compiled React app before starting Nginx.

echo "Injecting environment variables into React app..."

APP_FILE="/usr/share/nginx/html/app/dream-job-ai.jsx"

if [ -f "$APP_FILE" ]; then
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
    
    # We can also handle the model overriding if needed.
    # The user has VITE_LLM_MODEL for a master override, but for now we'll 
    # stick to keys to ensure the multi-model architecture works flawlessly.
else
    echo "Warning: $APP_FILE not found."
fi

echo "Starting Nginx..."
# Start Nginx in the foreground
exec nginx -g 'daemon off;'
