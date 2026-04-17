#!/bin/bash
# Behind the Screen - Start-Skript fuer macOS
# Doppelklick im Finder zum Starten des Servers

cd "$(dirname "$0")" || exit 1

echo ""
echo "=================================================="
echo "   BEHIND THE SCREEN - Ermittlungsspiel"
echo "=================================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "[FEHLER] Node.js ist nicht installiert."
    echo ""
    echo "Bitte Node.js von https://nodejs.org herunterladen"
    echo "und installieren, danach dieses Skript erneut starten."
    echo ""
    read -r -p "Zum Beenden Enter druecken..."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[Setup] Abhaengigkeiten werden installiert (einmalig, kann etwas dauern)..."
    echo ""
    if ! npm install; then
        echo ""
        echo "[FEHLER] npm install fehlgeschlagen."
        read -r -p "Zum Beenden Enter druecken..."
        exit 1
    fi
    echo ""
fi

if [ ! -f "server/db/game.db" ]; then
    echo "[Setup] Datenbank wird initialisiert..."
    echo ""
    if ! npm run init-db; then
        echo ""
        echo "[FEHLER] Datenbank-Initialisierung fehlgeschlagen."
        read -r -p "Zum Beenden Enter druecken..."
        exit 1
    fi
    echo ""
fi

echo "Server wird gestartet... Browser oeffnet sich automatisch."
echo "Zum Beenden dieses Fenster schliessen oder Strg+C druecken."
echo ""

(sleep 4 && open "http://localhost:3000") &

npm start

echo ""
echo "Server wurde beendet."
read -r -p "Zum Schliessen Enter druecken..."
