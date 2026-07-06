# Deployment Guide: Vercel & Render

This guide walks you through deploying the **Event Registration** application:
1. **Backend & Database** on Render (via `render.yaml` Blueprint or manually).
2. **Frontend** on Vercel.

---

## 🚀 Step 1: Deploy Backend & Database on Render

Render will build the backend using Docker and host a PostgreSQL database.

### Option A: Using Render Blueprints (Recommended & Simplest)

1. Push your updated code to a GitHub repository.
2. Go to the [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically read the `render.yaml` file and prompt you to create the resources:
   - A PostgreSQL Database (`event-registration-db`).
   - A Web Service (`event-registration-backend`).
6. Click **Apply**.
7. Once successfully deployed, note down the URL of your Web Service (e.g., `https://event-registration-backend.onrender.com`).

### Option B: Manual Setup on Render

If you prefer to configure the services manually:

#### 1. Create a PostgreSQL Database
1. In the Render Dashboard, click **New +** and select **PostgreSQL**.
2. Name it `event-registration-db` and select the **Free** tier.
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** or connection credentials.

#### 2. Create the Backend Web Service
1. Click **New +** and select **Web Service**.
2. Connect your GitHub repository.
3. Configure the following service settings:
   - **Name**: `event-registration-backend`
   - **Runtime**: `Docker`
   - **Docker Build Context**: `backend` (Important: points to the backend subdirectory)
   - **Dockerfile Path**: `Dockerfile`
   - **Plan**: `Free`
4. Expand the **Advanced** section and add the following Environment Variables:
   - `PORT`: `8081`
   - `DB_URL`: `jdbc:postgresql://<db-host>:<db-port>/<db-name>` (Replace using your Render PostgreSQL connection details)
   - `DB_USERNAME`: `<db-user>`
   - `DB_PASSWORD`: `<db-password>`
   - `DB_DRIVER`: `org.postgresql.Driver`
   - `ALLOWED_ORIGINS`: `*` (Or your Vercel frontend URL once deployed, for security)
5. Click **Create Web Service**.

---

## ⚡ Step 2: Deploy Frontend on Vercel

Vercel will host the static frontend files and inject the backend URL during compile-time.

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** and select **Project**.
3. Import your GitHub repository.
4. In the **Configure Project** step, set the following:
   - **Framework Preset**: `Other` (or keep default)
   - **Root Directory**: `./` (Keep it as the project root folder)
   - **Build and Output Settings** (Expand this section):
     - **Build Command**: `node build.js` (Leave toggle ON)
     - **Output Directory**: `frontend` (Leave toggle ON)
     - **Install Command**: (Leave toggle OFF)
5. Expand **Environment Variables** and add:
   - **Key**: `API_BASE_URL`
   - **Value**: `https://YOUR-BACKEND-ON-RENDER.onrender.com` (Use the Render backend URL you copied in Step 1)
6. Click **Deploy**.
7. Your app is now live! Open the Vercel-generated URL to check out the running site.

---

## 🔒 Post-Deployment Security (Optional)

Once your Vercel frontend is live, you can secure your backend:
1. Copy your Vercel site's domain (e.g., `https://event-registration-frontend.vercel.app`).
2. Go to the **Environment** settings of your backend service on Render.
3. Change the `ALLOWED_ORIGINS` variable value from `*` to your Vercel URL.
4. Save changes. Render will rebuild and redeploy, securing your REST API endpoints to only accept requests originating from your frontend.
