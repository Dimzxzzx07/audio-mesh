#!/bin/bash
echo "Starting Audio Mesh Network Layer 2.5"
echo "======================================"

if [ ! -d "node_modules" ]; then
  npm install
fi

npm run build

for i in {1..3}; do
  gnome-terminal -- bash -c "npm run start node$i; exec bash" 2>/dev/null || \
  osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && npm run start node$i\"" 2>/dev/null || \
  xterm -e "npm run start node$i" &
done

echo "3 mesh nodes started on ultrasound frequency 20kHz"
echo "Audio transmission active - inaudible to humans"