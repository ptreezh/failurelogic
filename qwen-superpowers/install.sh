#!/bin/bash
# Qwen Superpowers Installation Script for Linux/macOS

echo "Installing Qwen Superpowers..."

# Check if running in the correct directory
if [ ! -d "skills" ]; then
  echo "Error: skills directory not found in current directory."
  echo "Please run this script from the qwen-superpowers directory."
  exit 1
fi

# Determine the Qwen config directory
QWEN_CONFIG_DIR="$HOME/.qwen"

echo "Using Qwen config directory: $QWEN_CONFIG_DIR"

# Create the skills directory if it doesn't exist
if [ ! -d "$QWEN_CONFIG_DIR" ]; then
  echo "Creating Qwen config directory..."
  mkdir -p "$QWEN_CONFIG_DIR"
fi

if [ ! -d "$QWEN_CONFIG_DIR/skills" ]; then
  echo "Creating skills directory..."
  mkdir -p "$QWEN_CONFIG_DIR/skills"
fi

# Copy all skills to the Qwen skills directory
echo "Copying skills to Qwen configuration..."
cp -r skills/* "$QWEN_CONFIG_DIR/skills/"

echo
echo "Qwen Superpowers installed successfully!"
echo
echo "The following skills are now available:"
echo "  - advanced-planning"
echo "  - code-analysis"
echo "  - system-automation"
echo "  - research-assistant"
echo
echo "To use these skills, restart your Qwen environment."
echo "You can reference specific skills in your prompts, for example:"
echo "  - \"Use advanced-planning to organize this task\""
echo "  - \"Apply code-analysis techniques to understand this codebase\""
echo