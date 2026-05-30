#!/bin/bash
NODE_ID=${1:-"test-node"}
echo "Starting audio mesh node: $NODE_ID"
echo "Frequency: 18kHz-22kHz "
echo "Encryption: XOR stream cipher enabled"
echo "Routing: CSMA/CA with mesh forwarding"

npm run build
node dist/main.js "$NODE_ID"