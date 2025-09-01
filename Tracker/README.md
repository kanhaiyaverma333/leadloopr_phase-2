# 🧠 LeadLoopr Tracker

## 🚀 Script Generation

1. Navigate to the `lead-script` folder:

   ```bash
   cd lead-script
   ```

2. Run the following command to generate the minified tracking script:

   ```bash
   npx esbuild init.ts --bundle --format=iife --minify --outfile=filename.js --global-name=LeadLoopr
   ```

This will create a single minified file (`filename.js`) that can be used as a script on any webpage.
# Dummy url for google ads
http://localhost:5173/lead-form?gclid=TEST-GCLID-123&utm_source=google&utm_medium=cpc&utm_campaign=demo-campaign&utm_term=crm+software&utm_content=ad-copy-a


> ✅ **Hosting the script:**  
> After generation, host this script file on your server.  
> Currently, we have hosted it on our **development server**:  
> `https://staging3.zealousys.com/leadloopr-tracker.iife.js`

> 🧪 **For local development:**  
> You can directly reference the local file path in your HTML, like:

```html
<script
  id="leadloopr-tracker"
  src="/path-to-lead-script/filename.js"
  data-org-id="org_test123"
  data-debug="true"
  data-endpoint="http://localhost:4000/user-data"
></script>
```

---

## 🔌 Usage in HTML

Embed the generated script on your page using:

```html
<script
  id="leadloopr-tracker"
  src="https://staging3.zealousys.com/leadloopr-tracker.iife.js"
  data-org-id="org_test123"
  data-debug="true"
  data-endpoint="your-backend-endpoint"
></script>
```

### ℹ️ `data-org-id`

The `data-org-id` uniquely identifies the organization using the tracker and is required for accurate attribution of submissions.

---

## ✅ Consent Management

To comply with user privacy, form tracking is only activated **after user consent is granted**.

### 🧪 Local Development

In development, you can simulate consent by running this in the browser console:

```js
localStorage.setItem("leadloopr_consent", "true");
```

This enables the script to begin tracking immediately.

### 🚀 Production

In production, consent is managed via **Google Tag Manager (GTM) and gtag consent API** integration. The script will only activate if GTM confirms user consent has been given.

---

> ✅ This script will automatically capture form data and send it to the defined `data-endpoint`.

> ⚠️ This script is intended for development and testing. Make sure your backend is running to handle incoming form data.

---

## 🖼️ Frontend (Dashboard Viewer)

The frontend fetches and displays stored form data in a card-style layout using Material UI.

### 🔧 Setup

1. Copy the example environment file:

   ```bash
   cp .env_example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

> ✅ The frontend will display all stored form submissions in a clean, responsive UI.

---

## 🗄️ Backend (API Server)

The backend handles the API endpoints for storing and retrieving form submissions.

### 🔧 Setup

1. Copy the example environment file:

   ```bash
   cp .env_example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

---

## 🌐 Hosted Script

The script is currently hosted on our development server:

```
https://staging3.zealousys.com/leadloopr-tracker.iife.js
```

You can replace this with your own hosted version if needed.

---

## 📂 Folder Structure

```
/frontend       → React + Vite UI to display data
/backend        → Node.js + Express API for data storage
/lead-script/   → Script bundling setup (with init.ts)
/filename.js    → Output bundled script (after build)
```
