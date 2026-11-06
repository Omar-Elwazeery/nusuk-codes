# Nusuk Challenge Codes · أكواد تحدي نسك

A simple bilingual (Arabic default / English) site where people share their Nusuk Challenge referral codes (`NG-...`).

- The site owner's code is always pinned at the top.
- A random code is featured for 30 minutes at a time, the same one for every visitor.
- Anyone can add their code, either the bare code or the full share link.
- "Open in Nusuk" opens `https://services.nusuk.sa/app?p=27&id=CODE`.
- The list sorts least-used first so everyone gets a turn. Codes you already opened move to the end.

## Setup

### 1. Backend (Google Sheet + Apps Script, free)
1. Create a new Google Sheet.
2. **Extensions → Apps Script**. Replace the code with `apps-script/Code.gs` and save.
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorize the script and copy the **Web app URL**.

### 2. Frontend
1. Put the URL in `config.js` → `API_URL`.
2. To change your own code, edit `OWNER_CODE` in both `config.js` and `apps-script/Code.gs`.

### 3. GitHub Pages
1. Push these files to a GitHub repo.
2. **Settings → Pages → Deploy from a branch → `main` / root**.
3. The site will be live at `https://<user>.github.io/<repo>/`.

## Managing codes
All codes live in the `codes` sheet. To remove spam, delete the row. The site shows the change within 30 seconds, when the cache expires.

> Unofficial community site. Not affiliated with Nusuk or the Ministry of Hajj and Umrah.
