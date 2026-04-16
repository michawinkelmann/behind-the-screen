// Export tools for printing findings and exporting data
window.ExportTools = {
  printFindings() {
    const team = AppState.get('team');
    const boardNotes = document.getElementById('board-container').innerHTML;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Behind the Screen - Ermittlungsergebnisse ${team ? team.name : ''}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 2rem auto; color: #1a1a2e; line-height: 1.6; }
          h1 { font-size: 1.5rem; border-bottom: 2px solid #00d084; padding-bottom: 0.5rem; }
          h2 { font-size: 1.1rem; margin-top: 1.5rem; color: #0f1923; }
          .note { border: 1px solid #ddd; border-radius: 6px; padding: 0.75rem; margin: 0.5rem 0; page-break-inside: avoid; }
          .note-title { font-weight: 600; margin-bottom: 0.25rem; }
          .note-meta { font-size: 0.8rem; color: #666; }
          .badge { display: inline-block; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.7rem; background: #eee; margin-right: 0.25rem; }
          @media print { body { margin: 1cm; } }
        </style>
      </head>
      <body>
        <h1>Behind the Screen - Ermittlungsergebnisse</h1>
        <p><strong>Team:</strong> ${team ? team.name : 'Unbekannt'}</p>
        <p><strong>Datum:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
        <hr>
        ${boardNotes}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  },

  async exportAdminData() {
    try {
      const data = await API.adminExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'behind-the-screen-export-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      Notifications.show('Export heruntergeladen', 'success');
    } catch (e) {
      Notifications.show('Export fehlgeschlagen: ' + e.message, 'warning');
    }
  }
};
