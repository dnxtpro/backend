#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js..."
  sudo apt-get update
  sudo apt-get install -y curl ca-certificates gnupg
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "Installing MySQL..."
  sudo apt-get update
  sudo apt-get install -y mysql-server
  sudo systemctl start mysql
  sudo systemctl enable mysql
fi

echo "If MySQL is not setup yet, run:"
echo "sudo mysql -u root -p"
echo "CREATE DATABASE appstats;"
echo "CREATE USER 'root'@'localhost' IDENTIFIED BY 'tu_password';"
echo "GRANT ALL PRIVILEGES ON appstats.* TO 'root'@'localhost';"
echo "FLUSH PRIVILEGES;"
echo ""

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
  else
    echo "Missing .env.example file" >&2
    exit 1
  fi
fi

npm install

echo ""
echo "Backend ready."
echo "Edit .env before running:"
echo "npm run dev"
echo "API: http://localhost:4001"
echo ""
