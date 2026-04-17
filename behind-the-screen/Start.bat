@echo off
REM Behind the Screen - Start-Skript fuer Windows
REM Doppelklick zum Starten des Servers

setlocal

cd /d "%~dp0"

title Behind the Screen - Server

echo.
echo ==================================================
echo    BEHIND THE SCREEN - Ermittlungsspiel
echo ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert.
    echo.
    echo Bitte Node.js von https://nodejs.org herunterladen
    echo und installieren, danach dieses Skript erneut starten.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [Setup] Abhaengigkeiten werden installiert ^(einmalig, kann etwas dauern^)...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [FEHLER] npm install fehlgeschlagen.
        pause
        exit /b 1
    )
    echo.
)

if not exist "server\db\game.db" (
    echo [Setup] Datenbank wird initialisiert...
    echo.
    call npm run init-db
    if errorlevel 1 (
        echo.
        echo [FEHLER] Datenbank-Initialisierung fehlgeschlagen.
        pause
        exit /b 1
    )
    echo.
)

echo Server wird gestartet... Browser oeffnet sich automatisch.
echo Zum Beenden dieses Fenster schliessen oder Strg+C druecken.
echo.

start "" /B cmd /c "timeout /t 4 /nobreak >nul && start """" http://localhost:3000"

call npm start

echo.
echo Server wurde beendet.
pause
endlocal
