// Teacher-led mini presentations per (Tag, Phase).
// Shown as a fullscreen overlay the teacher clicks through in class.
window.TeacherPresentations = (function () {
  const PHASE_NAMES = { 1: 'Ermittlung', 2: 'Verknuepfungen', 3: 'Synthese' };

  // Each key is "day-phase"; every presentation has slides the teacher advances manually.
  const PRESENTATIONS = {
    '1-1': {
      title: 'Tag 1 - Phase 1: Ermittlung',
      subtitle: 'Einstieg in den Fall Max',
      slides: [
        {
          heading: 'Willkommen bei "Behind the Screen"',
          body: 'Ihr seid ab jetzt ein Ermittlungsteam. Euer Auftrag: herausfinden, was mit Max passiert ist und wie er in einen radikalen Online-Kreis geraten konnte.',
          bullets: [
            'Kein echter Fall - aber aufgebaut auf realen Mustern',
            'Es gibt keine "eine richtige Loesung"',
            'Euer Ziel: Muster erkennen, Zusammenhaenge verstehen'
          ]
        },
        {
          heading: 'Der Fall Max Hartmann',
          body: 'Max ist 17, Gymnasiast, vor wenigen Tagen verschwunden. In den letzten Monaten hat er sich zurueckgezogen, die Schule geschwaenzt und extrem viel Zeit online verbracht.',
          bullets: [
            'Eltern und Freunde sind besorgt',
            'Die letzten Spuren sind digital: Chats, Profile, Feeds',
            'Ihr habt Zugriff auf diese Beweise'
          ]
        },
        {
          heading: 'So arbeitet ihr heute',
          body: 'Phase 1 heisst "Ermittlung". Das bedeutet: Beweise sichten, durchlesen, markieren - noch nicht bewerten.',
          bullets: [
            'Oeffnet den Tab "Ermittlung"',
            'Jedes Team arbeitet auf seiner Spur (Gamer, Creator, Discord, Social Media, Algorithmus)',
            'Lest mindestens 4-5 Beweise gruendlich',
            'Was euch auffaellt: auf die Pinnwand!'
          ]
        },
        {
          heading: 'Eure Spuren',
          body: 'Jedes Team hat einen eigenen Blickwinkel auf Max. Spaeter werden wir die Spuren zusammenfuehren.',
          bullets: [
            'Gamer-Spur - In-Game-Chats, Clan-Protokolle',
            'Creator-Spur - Twitch-Streams, YouTube-Kommentare',
            'Discord-Spur - private Chat-Verlaeufe',
            'Social-Media-Spur - TikTok, Instagram, YouTube',
            'Algorithmus-Spur - Feed-Daten, Empfehlungen'
          ]
        },
        {
          heading: 'Regeln fuer diese Einheit',
          body: 'Wir arbeiten mit sensiblen Inhalten. Respekt und Sorgfalt sind Pflicht.',
          bullets: [
            'Keine Kommentare "das ist doch harmlos" ohne Begruendung',
            'Wenn ein Inhalt belastet: meldet es mir',
            'Fragen statt urteilen',
            'Beweise nicht ausdrucken, nicht abfotografieren'
          ]
        },
        {
          heading: 'Jetzt geht es los',
          body: 'Ihr habt ca. 20-25 Minuten fuer diese Phase. Am Ende treffen wir uns wieder hier.',
          bullets: [
            'Loggt euch mit eurem Team-Login ein',
            'Oeffnet den Tab "Ermittlung"',
            'Lest, notiert, pinnt an',
            'Viel Erfolg!'
          ]
        }
      ]
    },

    '1-2': {
      title: 'Tag 1 - Phase 2: Verknuepfungen',
      subtitle: 'Aus Einzelbeweisen wird ein Bild',
      slides: [
        {
          heading: 'Was bisher geschah',
          body: 'Ihr habt Beweise gesichtet. Jedes Team kennt seinen Ausschnitt. Jetzt fragen wir: Was gehoert zusammen?',
          bullets: [
            'Gleiche Personen in mehreren Spuren?',
            'Gleiche Uhrzeiten oder Ereignisse?',
            'Gleiche Begriffe, gleiche Sprache?'
          ]
        },
        {
          heading: 'Ziel dieser Phase',
          body: 'Wir bauen gemeinsam eine Timeline und verknuepfen Profile. Die Pinnwand wird unser gemeinsames Ermittlungsbild.',
          bullets: [
            'Zeitpunkte in die Timeline',
            'Personen unter "Profile"',
            'Eindeutige Beobachtungen verknuepfen (Tags nutzen)'
          ]
        },
        {
          heading: 'So arbeitet ihr',
          body: 'Ihr bleibt in euren Teams, aber schaut auch auf die Pinnwand der anderen.',
          bullets: [
            'Jede wichtige Erkenntnis -> neue Notiz',
            'Kommentiert Notizen anderer Teams',
            'Tags benutzen: z.B. #valhalla-knights, #umbruch'
          ]
        },
        {
          heading: 'Leitfragen',
          body: 'Diese Fragen helfen euch beim Verknuepfen.',
          bullets: [
            'Wann hat Max angefangen, sich zu veraendern?',
            'Wer hat ihn zuerst angesprochen?',
            'Welche Plattformen waren wichtig?',
            'Was hat ihn angezogen - und was hat ihn "gehalten"?'
          ]
        },
        {
          heading: 'Jetzt los',
          body: 'Ca. 20 Minuten. Qualitaet vor Menge - lieber drei gute Verknuepfungen als zehn lose Notizen.',
          bullets: [
            'Tab "Pinnwand" oeffnen',
            'Zeitleiste und Profile fuellen',
            'Miteinander sprechen, nicht nur tippen'
          ]
        }
      ]
    },

    '1-3': {
      title: 'Tag 1 - Phase 3: Synthese',
      subtitle: 'Erste Hypothese zum Fall',
      slides: [
        {
          heading: 'Die Einzelteile zusammenfuegen',
          body: 'Ihr habt heute viel Material gesichtet. Zum Abschluss von Tag 1 formulieren wir gemeinsam eine erste Hypothese.',
          bullets: [
            'Wer ist Max nach eurem Eindruck wirklich?',
            'Was hat sich veraendert - und wann?',
            'Wo war der Einstieg in die Gruppe?'
          ]
        },
        {
          heading: 'Lern-Module heute',
          body: 'Bearbeitet dazu die Module fuer Tag 1. Sie helfen euch, das Gesehene einzuordnen.',
          bullets: [
            'Wer ist Max?',
            'Digitale Identitaet',
            'Gaming-Communities'
          ]
        },
        {
          heading: 'Team-Aufgabe',
          body: 'Erarbeitet zu zweit oder im Team eine 3-Satz-Hypothese zur Situation von Max.',
          bullets: [
            'Satz 1: Wer ist Max?',
            'Satz 2: Was ist passiert?',
            'Satz 3: Welche Rolle spielt das Netz?'
          ]
        },
        {
          heading: 'Ausblick Tag 2',
          body: 'Morgen geht es um die Mechanismen: Wie funktionieren Algorithmen, Echokammern, Manipulation? Neue Beweise werden freigeschaltet.',
          bullets: [
            'Module zu Tag 2 werden vorbereitet',
            'Neue Spuren im Beweis-Tab',
            'Wir bauen auf euren heutigen Erkenntnissen auf'
          ]
        }
      ]
    },

    '2-1': {
      title: 'Tag 2 - Phase 1: Ermittlung',
      subtitle: 'Neue Beweise, neue Fragen',
      slides: [
        {
          heading: 'Willkommen zurueck',
          body: 'Tag 1 hat gezeigt: Max hat sich veraendert und ist auf eine bestimmte Gruppe gestossen. Heute fragen wir: Wie hat das System ihn "hineingezogen"?',
          bullets: [
            'Algorithmen',
            'Echokammern',
            'Gezielte Manipulation'
          ]
        },
        {
          heading: 'Frisch freigeschaltet',
          body: 'Ich habe heute neue Beweise fuer euch freigegeben. Ihr findet sie in eurem Beweis-Tab markiert.',
          bullets: [
            'Feed-Daten der Algorithmus-Spur',
            'Discord-Rollen und "Rekrutierungs-Scripts"',
            'Weitere Stream-Ausschnitte'
          ]
        },
        {
          heading: 'Perspektive wechseln',
          body: 'Versucht heute einmal, den Fall mit den Augen der "anderen Seite" zu sehen: Wie denkt jemand, der Jugendliche gezielt ansprechen will?',
          bullets: [
            'Welche Gefuehle werden ausgenutzt?',
            'Welche Versprechen werden gemacht?',
            'Welche Worte kommen immer wieder vor?'
          ]
        },
        {
          heading: 'Arbeitsauftrag',
          body: 'Sichtet die neuen Beweise auf eurer Spur. Fragt aktiv: Welchen Mechanismus seht ihr hier?',
          bullets: [
            'Ca. 20 Minuten',
            'Neue Notizen taggen mit #mechanismus',
            'Auffaelligkeiten auf die Pinnwand'
          ]
        }
      ]
    },

    '2-2': {
      title: 'Tag 2 - Phase 2: Verknuepfungen',
      subtitle: 'Das Algorithmus-Labor',
      slides: [
        {
          heading: 'Das System verstehen',
          body: 'Heute koennt ihr selbst ausprobieren, wie ein Empfehlungs-Algorithmus auf Verhalten reagiert.',
          bullets: [
            'Tab "Algorithmus-Lab" oeffnen',
            'Klickverhalten simulieren',
            'Beobachten: wie aendert sich der Feed?'
          ]
        },
        {
          heading: 'Was ihr herausfinden sollt',
          body: 'Arbeitet in Paaren. Wechselt Rollen.',
          bullets: [
            'Wie schnell wird ein Feed "eng"?',
            'Welche Klicks haben welche Wirkung?',
            'Koennt ihr den Algorithmus "gesund" halten?'
          ]
        },
        {
          heading: 'Verknuepfung mit Max',
          body: 'Denkt waehrend des Experiments an Max. Was haettet ihr auf seinem Geraet gesehen, nach 3 Tagen? Nach 3 Wochen?',
          bullets: [
            'Ergebnis als Notiz auf die Pinnwand (Spalte Warnsignale)',
            'Tag: #algorithmus'
          ]
        },
        {
          heading: 'Leitfragen fuer die Reflexion',
          body: 'Notiert kurz, damit wir im Plenum darueber sprechen koennen.',
          bullets: [
            'Wer ist verantwortlich fuer radikale Inhalte im Feed?',
            'Sind Algorithmen "neutral"?',
            'Was koennte helfen?'
          ]
        }
      ]
    },

    '2-3': {
      title: 'Tag 2 - Phase 3: Synthese',
      subtitle: 'Mechanismen benennen',
      slides: [
        {
          heading: 'Was wir heute gelernt haben',
          body: 'Radikalisierung ist kein Unfall. Sie hat Stufen, Werkzeuge, Sprache. Die Module zu Tag 2 helfen, das zu ordnen.',
          bullets: [
            'Phasen der Radikalisierung',
            'Algorithmen',
            'Echokammern',
            'Manipulationstechniken'
          ]
        },
        {
          heading: 'Team-Aufgabe',
          body: 'Identifiziert in eurem Spur-Material mindestens DREI konkrete Manipulationstechniken und belegt sie mit Beweisen.',
          bullets: [
            'Lovebombing?',
            'Wir-gegen-die-Narrativ?',
            'Exklusives Insider-Vokabular?',
            'Feindbilder?'
          ]
        },
        {
          heading: 'Erste Warnsignale',
          body: 'Uebertragt eure Erkenntnisse auf die Spalte "Warnsignale" der Pinnwand. Morgen bauen wir darauf Interventionen auf.',
          bullets: [
            'Signale moeglichst konkret formulieren',
            'Beispiel: "rueckzug aus alten Freundschaften" statt "merkwuerdig"'
          ]
        },
        {
          heading: 'Ausblick Tag 3',
          body: 'Morgen geht es um Loesungen: Wie erkennt man Radikalisierung frueh? Was kann man tun? Wie hilft man Max - oder einem realen "Max" im eigenen Umfeld?',
          bullets: [
            'Module zu Tag 3',
            'Abschluss-Diskussion und Reflexion',
            'Freischaltung der letzten Beweise'
          ]
        }
      ]
    },

    '3-1': {
      title: 'Tag 3 - Phase 1: Ermittlung',
      subtitle: 'Der Fall schliesst sich',
      slides: [
        {
          heading: 'Letzter Tag',
          body: 'Ihr habt nun ein Bild vom Fall und ein Verstaendnis der Mechanismen. Heute geht es um Verantwortung und Handlungsoptionen.',
          bullets: [
            'Warnsignale erkennen',
            'Hilfe organisieren',
            'Medienkompetenz als Schutz'
          ]
        },
        {
          heading: 'Frisch freigeschaltet',
          body: 'Die letzten Beweise sind freigegeben. Darunter auch Hinweise darauf, wo Max jetzt sein koennte.',
          bullets: [
            'Neue Nachrichten an Familie und Freunde',
            'Aktuelle Standort-Hinweise',
            'Die kryptische Abschieds-Nachricht'
          ]
        },
        {
          heading: 'Arbeitsauftrag',
          body: 'Sichtet die neuen Beweise. Fragt: Welche Signale haetten bereits vor Wochen gesehen werden koennen?',
          bullets: [
            'Ca. 15 Minuten',
            'Neue Notizen taggen mit #warnsignal oder #intervention',
            'Beobachtungen auf die Pinnwand'
          ]
        }
      ]
    },

    '3-2': {
      title: 'Tag 3 - Phase 2: Verknuepfungen',
      subtitle: 'Praevention und Intervention',
      slides: [
        {
          heading: 'Vom Verstehen zum Handeln',
          body: 'Jetzt setzen wir das Wissen um: Was haetten Eltern, Freunde, Lehrer oder Max selbst tun koennen - und an welcher Stelle?',
          bullets: [
            'Frueh-Signale (Woche 1-4)',
            'Mittlere Signale (Monat 2-4)',
            'Akute Signale (letzte Wochen)'
          ]
        },
        {
          heading: 'Team-Aufgabe',
          body: 'Erarbeitet drei Interventionen auf drei Zeitpunkten. Je ein Vorschlag fuer "frueh", "mitte", "spaet".',
          bullets: [
            'Wer haette was tun koennen?',
            'Was waere angemessen gewesen?',
            'Was haette Schaden angerichtet?'
          ]
        },
        {
          heading: 'Auf die Pinnwand',
          body: 'Spalte "Interventionen" nutzen. Kurze, konkrete Vorschlaege.',
          bullets: [
            'Titel: was?',
            'Text: von wem, wann, wie?',
            'Tags: #intervention + Zeitpunkt'
          ]
        },
        {
          heading: 'Hinweis',
          body: 'Es gibt keine perfekte Loesung. Es geht um Handlungsfaehigkeit - nicht um Schuld.',
          bullets: [
            'Auch "falsche" Interventionen sind wichtige Erkenntnisse',
            'Reden statt Kontrolle',
            'Hilfe holen ist Staerke'
          ]
        }
      ]
    },

    '3-3': {
      title: 'Tag 3 - Phase 3: Synthese',
      subtitle: 'Abschluss und Reflexion',
      slides: [
        {
          heading: 'Was bleibt',
          body: 'Drei Tage Ermittlung liegen hinter euch. Zum Schluss: Was nehmt ihr mit? Fuer euch selbst und fuer andere?',
          bullets: [
            'Radikalisierung ist ein Prozess, kein Ereignis',
            'Algorithmen sind nicht neutral',
            'Niemand ist "immun"',
            'Hinsehen ist der erste Schritt'
          ]
        },
        {
          heading: 'Module zum Abschluss',
          body: 'Bearbeitet die drei letzten Module - sie bauen auf eurer Ermittlung auf.',
          bullets: [
            'Warnsignale erkennen',
            'Intervention und Hilfe',
            'Medienkompetenz'
          ]
        },
        {
          heading: 'Plenum: Abschluss-Diskussion',
          body: 'Wir kommen im Plenum zusammen. Jedes Team stellt kurz vor:',
          bullets: [
            'Eine zentrale Erkenntnis eurer Spur',
            'Ein Warnsignal, das ihr besonders wichtig findet',
            'Eine Intervention, die realistisch umsetzbar ist'
          ]
        },
        {
          heading: 'Wenn es euch nah geht',
          body: 'Manche Inhalte koennen belasten. Sprecht mich an - auch spaeter.',
          bullets: [
            'Schulpsychologischer Dienst',
            'Telefonseelsorge 0800 111 0 111',
            'Nummer gegen Kummer 116 111',
            'Jederzeit: bei mir melden'
          ]
        },
        {
          heading: 'Danke',
          body: 'Ihr habt heute nicht nur einen fiktiven Fall geloest - ihr habt Werkzeuge mitgenommen, die im echten Leben Leben veraendern koennen.',
          bullets: [
            'Beobachten ohne zu urteilen',
            'Fragen statt vorverurteilen',
            'Handeln, wenn etwas auffaellt'
          ]
        }
      ]
    }
  };

  let overlayEl = null;
  let currentKey = null;
  let currentIndex = 0;
  let keydownHandler = null;

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function keyFor(day, phase) {
    return `${day}-${phase}`;
  }

  function getPresentation(day, phase) {
    return PRESENTATIONS[keyFor(day, phase)] || null;
  }

  function open(day, phase) {
    const pres = getPresentation(day, phase);
    if (!pres) return;
    currentKey = keyFor(day, phase);
    currentIndex = 0;
    renderOverlay(pres);
  }

  function close() {
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
    }
    overlayEl = null;
    currentKey = null;
    currentIndex = 0;
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
  }

  function next() {
    const pres = PRESENTATIONS[currentKey];
    if (!pres) return;
    if (currentIndex < pres.slides.length - 1) {
      currentIndex += 1;
      renderOverlay(pres);
    }
  }

  function prev() {
    const pres = PRESENTATIONS[currentKey];
    if (!pres) return;
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderOverlay(pres);
    }
  }

  function renderOverlay(pres) {
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.className = 'teacher-presentation-overlay';
      document.body.appendChild(overlayEl);

      keydownHandler = (e) => {
        if (!overlayEl) return;
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); return; }
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); return; }
      };
      document.addEventListener('keydown', keydownHandler);
    }

    const slide = pres.slides[currentIndex];
    const total = pres.slides.length;
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === total - 1;

    overlayEl.innerHTML = `
      <div class="teacher-presentation">
        <div class="tp-header">
          <div>
            <div class="tp-title">${escapeHTML(pres.title)}</div>
            <div class="tp-subtitle">${escapeHTML(pres.subtitle || '')}</div>
          </div>
          <button class="tp-close" id="tp-close-btn" title="Schliessen (Esc)">&times;</button>
        </div>
        <div class="tp-body">
          <h2 class="tp-heading">${escapeHTML(slide.heading || '')}</h2>
          ${slide.body ? `<p class="tp-text">${escapeHTML(slide.body)}</p>` : ''}
          ${Array.isArray(slide.bullets) && slide.bullets.length ? `
            <ul class="tp-bullets">
              ${slide.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
        <div class="tp-footer">
          <button class="btn btn-secondary" id="tp-prev-btn" ${isFirst ? 'disabled' : ''}>&larr; Zurueck</button>
          <div class="tp-progress">
            <span>Folie ${currentIndex + 1} / ${total}</span>
            <div class="tp-progress-bar"><div class="tp-progress-fill" style="width:${Math.round(((currentIndex + 1) / total) * 100)}%;"></div></div>
          </div>
          <button class="btn btn-primary" id="tp-next-btn" ${isLast ? 'disabled' : ''}>Weiter &rarr;</button>
        </div>
      </div>
    `;

    overlayEl.querySelector('#tp-close-btn').addEventListener('click', close);
    overlayEl.querySelector('#tp-prev-btn').addEventListener('click', prev);
    overlayEl.querySelector('#tp-next-btn').addEventListener('click', next);
  }

  function renderAdminSection(getDayPhase) {
    const grid = [];
    for (let d = 1; d <= 3; d++) {
      for (let p = 1; p <= 3; p++) {
        const pres = getPresentation(d, p);
        const label = `Tag ${d} - ${PHASE_NAMES[p]}`;
        const slides = pres ? pres.slides.length : 0;
        grid.push(`
          <button class="btn btn-secondary tp-grid-btn" data-day="${d}" data-phase="${p}">
            <span class="tp-grid-label">${label}</span>
            <span class="tp-grid-meta">${slides} Folien</span>
          </button>
        `);
      }
    }
    return `
      <div class="admin-section" id="admin-presentation-section">
        <h3>Unterrichts-Praesentation</h3>
        <p class="text-sm text-muted" style="margin-bottom:0.75rem;">
          Kurze Folien fuer den Einstieg in jede Phase. Werden im Vollbild gezeigt -
          ideal fuer den Beamer.
        </p>
        <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-primary" id="tp-start-current">Aktuelle Phase starten</button>
          <span id="tp-current-label" class="text-sm text-muted" style="align-self:center;"></span>
        </div>
        <div class="tp-grid">
          ${grid.join('')}
        </div>
        <div class="text-xs text-muted" style="margin-top:0.5rem;">
          Steuerung: Pfeiltasten oder Leertaste. Schliessen mit Esc.
        </div>
      </div>
    `;
  }

  function bindAdminSection(getDayPhase) {
    const root = document.getElementById('admin-presentation-section');
    if (!root) return;

    const { day, phase } = getDayPhase() || { day: 1, phase: 1 };
    const label = root.querySelector('#tp-current-label');
    if (label) label.textContent = `Aktuell: Tag ${day} - ${PHASE_NAMES[phase] || phase}`;

    const startBtn = root.querySelector('#tp-start-current');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const cur = getDayPhase() || { day: 1, phase: 1 };
        open(cur.day, cur.phase);
      });
    }

    root.querySelectorAll('.tp-grid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseInt(btn.dataset.day, 10);
        const p = parseInt(btn.dataset.phase, 10);
        open(d, p);
      });
    });
  }

  return {
    open,
    close,
    renderAdminSection,
    bindAdminSection,
    PHASE_NAMES
  };
})();
