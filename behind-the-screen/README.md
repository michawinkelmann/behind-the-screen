# Behind the Screen - Ermittlungsspiel fuer den Klassenraum

Ein browserbasiertes Multiplayer-Ermittlungsspiel, in dem Schueler-Teams die Online-Radikalisierung eines Jugendlichen namens "Max" untersuchen. Konzipiert fuer den Einsatz im Unterricht (Klasse 12, 16-25 Schueler).

## Voraussetzungen

- **Node.js** (Version 18 oder hoeher) - Download: https://nodejs.org
- **Lehrer-PC** als lokaler Server (Windows, Mac oder Linux)
- **Schueler-Geraete** mit Browser (PC, Laptop oder iPad) im selben Netzwerk (WLAN/LAN)
- **Kein Internet noetig** nach der Installation

## Schnellstart (empfohlen)

1. Ordner `behind-the-screen` auf den Lehrer-PC kopieren
2. Node.js installieren (falls noch nicht vorhanden): https://nodejs.org
3. Doppelklick auf die passende Start-Datei im Projektordner:
   - **Windows:** `Start.bat`
   - **macOS:** `Start.command`
   - **Linux:** `Start.sh`

Beim ersten Start werden automatisch die Abhaengigkeiten installiert und die Datenbank initialisiert. Danach oeffnet sich der Browser automatisch mit dem Spiel. Zum Beenden einfach das Fenster schliessen oder `Strg+C` druecken.

> Hinweis fuer macOS: Beim ersten Start ggf. Rechtsklick auf `Start.command` -> "Oeffnen" waehlen, um den Gatekeeper-Dialog zu bestaetigen.

## Manueller Start (Alternative ueber Terminal)

1. Terminal/Eingabeaufforderung oeffnen und in den Ordner wechseln:
   ```
   cd behind-the-screen
   ```
2. Einmalig:
   ```
   npm install
   npm run init-db
   ```
3. Server starten:
   ```
   npm start
   ```

Nach dem Start erscheint eine Box mit den Verbindungs-URLs:

```
╔══════════════════════════════════════════════════╗
║      BEHIND THE SCREEN - Ermittlungsspiel       ║
╠══════════════════════════════════════════════════╣
║  Lokal:    http://localhost:3000                ║
║  Netzwerk: http://192.168.x.x:3000             ║
╚══════════════════════════════════════════════════╝
```

Die **Netzwerk-URL** ist die Adresse, die Schueler im Browser eingeben.

## Schueler verbinden

1. Schueler oeffnen einen Browser (Chrome, Safari, Firefox, Edge)
2. Die Netzwerk-URL eingeben (z.B. `http://192.168.1.72:3000`)
3. Team-Name eingeben, Passwort waehlen und eine Ermittlungsspur auswaehlen:
   - **Gamer-Spur** - In-Game-Chats und Clan-Protokolle
   - **Creator-Spur** - Twitch-Streams und Content-Analyse
   - **Discord-Spur** - Discord-Server und Chat-Verlaeufe
   - **Social-Media-Spur** - TikTok, Instagram, YouTube Posts
   - **Algorithmus-Spur** - Feed-Daten und Empfehlungsanalysen

Empfehlung: 3-5 Schueler pro Team, je ein Team pro Spur.

## Admin-Panel (Lehrkraft)

1. Im Browser die Server-URL oeffnen
2. Auf den Tab "Admin" klicken
3. Passwort eingeben: `admin2024` (aenderbar in der Datei `.env`)

### Funktionen im Admin-Panel

| Funktion | Beschreibung |
|---|---|
| **Pausieren/Fortsetzen** | Spiel anhalten fuer Reflexionsphasen |
| **Naechste Phase** | Zur naechsten Spielphase wechseln |
| **Tag setzen** | Spieltag wechseln (1-3), schaltet neue Beweise frei |
| **Nachricht senden** | Broadcast an alle Teams (erscheint als Banner) |
| **QR-Code** | Zum Anzeigen auf dem Beamer - Schueler scannen zum Verbinden |
| **Teams** | Uebersicht aller Teams mit Fortschritt |
| **Daten exportieren** | Alle Ergebnisse als JSON herunterladen |
| **Spiel zuruecksetzen** | Alle Fortschritte loeschen (fuer naechste Klasse) |

## Spielablauf (3 Tage / Unterrichtseinheiten)

### Tag 1 - Der Fall
- Teams machen sich mit dem Fall vertraut
- Erste Beweise sichten und durchsuchen
- Erkenntnisse auf der gemeinsamen Pinnwand festhalten
- Module: "Wer ist Max?", "Digitale Identitaet", "Gaming-Communities"

### Tag 2 - Die Mechanismen
- Neue Beweise werden freigeschaltet (Admin: Tag 2 setzen)
- Teams untersuchen Radikalisierungsmechanismen
- Algorithmus-Labor ausprobieren
- Module: "Phasen der Radikalisierung", "Algorithmen", "Echokammern", "Manipulationstechniken"

### Tag 3 - Die Loesung
- Letzte Beweise freigeschaltet (Admin: Tag 3 setzen)
- Teams erarbeiten Praeventionsstrategien
- Abschlussdiskussion und Reflexion
- Module: "Warnsignale erkennen", "Intervention und Hilfe", "Medienkompetenz"

## Spielphasen pro Tag

Jeder Tag hat 3 Phasen (steuerbar ueber Admin-Panel):

1. **Ermittlung** - Teams suchen und sichten Beweise
2. **Verknuepfungen** - Teams diskutieren und verknuepfen Erkenntnisse auf der Pinnwand
3. **Synthese** - Teams formulieren Ergebnisse und bearbeiten Lern-Module

## Tipps fuer den Unterricht

- **Vor dem Spiel:** Kurz den Kontext erklaeren - es geht um einen fiktiven Fall, der auf realen Mustern basiert
- **Waehrend des Spiels:** Pause-Funktion nutzen fuer gemeinsame Reflexionsphasen
- **Broadcast nutzen:** Hinweise oder Impulsfragen an alle Teams senden
- **Pinnwand beobachten:** Die gemeinsame Pinnwand zeigt, was Teams bereits herausgefunden haben
- **Nach dem Spiel:** Die Lern-Module enthalten Reflexionsfragen fuer die Abschlussdiskussion
- **Sensibilitaet:** Manche Inhalte koennen belastend sein - Gespraechsangebot machen

## Konfiguration

Die Datei `.env` im Hauptordner enthaelt die Einstellungen:

```
PORT=3000              # Server-Port
ADMIN_PASSWORD=admin2024  # Admin-Passwort (bitte aendern!)
```

## Spiel zuruecksetzen

Fuer eine neue Klasse:
- **Option A:** Im Admin-Panel auf "Spiel zuruecksetzen" klicken
- **Option B:** `npm run init-db` im Terminal ausfuehren (setzt auch die Datenbank komplett zurueck)

## Technische Hinweise

- Der Server laeuft lokal auf dem Lehrer-PC - keine Cloud, keine externen Dienste
- Alle Daten bleiben auf dem Lehrer-PC (SQLite-Datenbank)
- Getestet mit bis zu 10 gleichzeitigen Teams
- Funktioniert auf PC, Laptop und iPad (responsive Design)
- Echtzeit-Synchronisation: Wenn ein Team etwas auf die Pinnwand heftet, sehen es alle sofort

## Fehlerbehebung

| Problem | Loesung |
|---|---|
| Schueler koennen sich nicht verbinden | Pruefen ob alle im selben WLAN/Netzwerk sind. Firewall fuer Port 3000 freigeben |
| "npm not found" | Node.js ist nicht installiert - von https://nodejs.org herunterladen |
| Server startet nicht | `npm run init-db` ausfuehren, dann `npm start` |
| Seite laedt nicht vollstaendig | Browser-Cache leeren (Strg+Shift+R / Cmd+Shift+R) |
| Verbindung bricht ab | Server laeuft noch? Reconnect passiert automatisch nach wenigen Sekunden |

## Projektstruktur

```
behind-the-screen/
├── server/           # Backend (Node.js + Express + Socket.IO)
│   ├── app.js        # Server-Einstiegspunkt
│   ├── config/       # Datenbank, Socket-Handler, Spiellogik
│   ├── routes/       # REST-API Endpunkte
│   ├── models/       # Datenbank-Modelle
│   ├── data/         # Story-Inhalte (JSON)
│   │   ├── evidence/ # 124 Beweisstücke
│   │   ├── profiles/ # 6 Charakter-Profile
│   │   └── modules/  # 10 Lern-Module
│   ├── db/           # Datenbank-Schema
│   └── utils/        # Hilfsfunktionen
├── client/           # Frontend (Vanilla HTML/CSS/JS)
│   ├── index.html    # Single-Page-App Shell
│   ├── css/          # Styles (Dark Theme)
│   └── js/           # UI-Module, API, State
├── .env              # Konfiguration
└── package.json      # Abhaengigkeiten
```
