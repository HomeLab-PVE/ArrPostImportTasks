# arr-post-import

### Install
`git clone https://github.com/HomeLab-PVE/arr-post-import.git`\
`cd arr-post-import`\
`npm install`\
`cp .env-model .env`\
`nano .env`

### Connect to Radarr
Open Radarr Web UI\
Go to Settings > Connect then click Add Notification and select Custom Script and Input data:
- Name: arr-post-import
- Notification Triggers: select import
- Path: /full-path/to/arr-post-import/bin.js
- Save.

### Connect to Sonarr
Open Sonarr Web UI\
Repet the procedure from Radarr
