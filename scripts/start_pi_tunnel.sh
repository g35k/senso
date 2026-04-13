#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/start_pi_tunnel.sh
#   PI_HOST="2607:fb91:...." PI_USER="senso" LOCAL_PORT="5050" ./scripts/start_pi_tunnel.sh

PI_USER="${PI_USER:-senso}"
PI_HOST="${PI_HOST:-2607:fb91:798f:d3f1:da3a:ddff:fef4:28d2}"
LOCAL_BIND="${LOCAL_BIND:-::1}"
LOCAL_PORT="${LOCAL_PORT:-5050}"
REMOTE_HOST="${REMOTE_HOST:-127.0.0.1}"
REMOTE_PORT="${REMOTE_PORT:-5000}"

echo "Starting SSH tunnel..."
echo "  local:  [${LOCAL_BIND}]:${LOCAL_PORT}"
echo "  remote: ${REMOTE_HOST}:${REMOTE_PORT} on ${PI_USER}@${PI_HOST}"
echo ""
echo "Keep this terminal open while testing."
echo "In another terminal, test with:"
echo "  curl \"http://[::1]:${LOCAL_PORT}/health\""
echo ""

exec ssh -6 -N -L "[${LOCAL_BIND}]:${LOCAL_PORT}:${REMOTE_HOST}:${REMOTE_PORT}" "${PI_USER}@${PI_HOST}"
