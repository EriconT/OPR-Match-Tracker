# OPR Match Journal

A sleek, responsive, and persistent web application designed to serve as a personal digital journal for tracking casual OnePageRules tabletop games. 

The application utilizes local device features as a Progressive Web App (PWA) with full iOS home screen support, and persists its data entirely on the cloud using a custom Google Sheets database via Google Apps Script — allowing you to log matches safely from anywhere without relying on traditional paid server backends.

![Web App Preview](apple-touch-icon.png)

## 🌟 Features

- **Modern PWA Interface**: Experience a premium aesthetic with glassmorphic cards, vibrant typography, and a dark/light mode toggle.
- **Detailed Match Tracking**: Log opponents, differing factions, match locations, who won, and specialized post-game notes.
- **Dynamic Statistics**: Instantly view career games logged, total wins, and unique locations/opponents.
- **Smart Autocomplete**: The app natively learns your frequent locations and opponent names, providing dropdown suggestions for faster logging based on your history.
- **Full CRUD Support**: Add, view, edit, and fully delete any previous journals natively.
- **CSV Data Import/Export**: Back up your history at any time or push bulk rows to the cloud seamlessly.

## 🚀 Setup & Execution

Because the application relies solely on standard Web technologies (HTML, CSS, JS) and Google Apps Script, it is entirely static and requires no build steps or local dependencies like Node.js.

### Running Locally
1. Clone this repository or download the source files.
2. Open `index.html` directly in any modern web browser.
3. *Optional*: For active network development, you can serve it via VS Code's "Live Server" extension or a simple python server: `python -m http.server 8000`.

### Deploying to Production
You can freely host this app on **GitHub Pages**, **Netlify**, or **Vercel** simply by pointing the service to the root directory.

### Enabling iOS App Mode
1. Open the hosted URL in Safari on your iPhone or iPad.
2. Tap the 'Share' button at the bottom navigation bar.
3. Scroll down and tap **Add to Home Screen**.
4. You will now have a native-feeling app on your device sporting the custom high-resolution `apple-touch-icon.png`.

## 🗄️ Google Sheets Database Integration

This application is hardcoded to funnel data directly to a Google Sheets document, functioning as a free REST API. If you fork this project and want to use your own private database, follow these steps:

1. Create a brand new [Google Sheet](https://sheets.new/).
2. Rename the first tab to exactly: `Matches`.
3. In the first row (Cells A1 through H1), paste these exact case-sensitive headers:
   `id` | `date` | `location` | `opponent` | `myFaction` | `opponentFaction` | `winner` | `notes`
4. From the top menu, click **Extensions > Apps Script**.
5. Delete the default `Code.gs` content and replace it with the API code provided below.
6. Click **Deploy > New deployment**. Select the gear type as **Web app**, execute as **Me**, and ensure "Who has access" is set strictly to **Anyone**. 
7. Copy the resulting `Web app URL`.
8. In this project's `script.js`, replace the `API_URL` variable at the top with your new URL.

### Apps Script Backend Code

```javascript
const SHEET_NAME = 'Matches';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);
    
    // Handle Deletions
    if (data.action === 'delete') {
      const idColumnValues = sheet.getRange(2, 1, Math.max(1, sheet.getLastRow() - 1), 1).getValues();
      for (let i = 0; i < idColumnValues.length; i++) {
        if (idColumnValues[i][0] == data.id) {
          sheet.deleteRow(i + 2); 
          return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({"result":"error", "error":"ID not found"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // The columns we expect to save based on the app
    const rowData = [
      data.id, data.date, data.location, data.opponent, 
      data.myFaction, data.opponentFaction, data.winner, data.notes
    ];
    
    // Search for editing matching ID to replace
    const idColumnValues = sheet.getRange(2, 1, Math.max(1, sheet.getLastRow() - 1), 1).getValues();
    let rowIndexToEdit = -1;
    for (let i = 0; i < idColumnValues.length; i++) {
      if (idColumnValues[i][0] == data.id) {
        rowIndexToEdit = i + 2; 
        break;
      }
    }
    
    if (rowIndexToEdit > -1) {
      sheet.getRange(rowIndexToEdit, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Append new row
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
  
  const matches = data.map(row => {
    return {
      id: row[0].toString(), date: row[1], location: row[2], opponent: row[3],
      myFaction: row[4], opponentFaction: row[5], winner: row[6], notes: row[7]
    };
  });
  
  return ContentService.createTextOutput(JSON.stringify(matches)).setMimeType(ContentService.MimeType.JSON);
}
```
