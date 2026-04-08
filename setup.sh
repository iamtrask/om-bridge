#!/bin/bash

# OMBox Setup — installs dependencies, pulls the model, and starts the bridge
# Usage: curl -fsSL https://raw.githubusercontent.com/.../setup.sh | bash

set -e

echo "=== OMBox Setup ==="
echo ""

# Install Node.js if missing
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install node
    elif command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v dnf &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
        sudo dnf install -y nodejs
    elif command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm nodejs npm
    else
        echo "Could not auto-install Node.js. Trying nvm..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
        nvm install --lts
    fi
fi

# Verify node is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js installation failed. Please install manually from https://nodejs.org"
    exit 1
fi
echo "Node.js: $(node --version)"

# Install Ollama if missing
if ! command -v ollama &> /dev/null; then
    echo "Ollama not found. Installing..."
    curl -fsSL https://ollama.com/install.sh | sh
fi
echo "Ollama: $(ollama --version)"

# Start Ollama in the background if not already running
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "Starting Ollama server..."
    ollama serve &> /dev/null &
    sleep 3
fi

# Pull the model
echo ""
echo "Pulling gemma4 (~9GB). If that's too big, ctrl-c and run:"
echo "  ollama pull qwen3.5:0.8b"
echo "  (then update MODEL in your Python code to match)"
echo ""
ollama pull gemma4

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Starting WhatsApp bridge... scan the QR code with your phone."
echo "(WhatsApp > Settings > Linked Devices > Link a Device)"
echo ""

# Start the WhatsApp bridge
npx @iamtrask/om-bridge
