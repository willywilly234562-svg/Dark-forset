# Deployment Notes for GitHub Pages

This project has been configured to use **Vite** for building the static assets required for GitHub Pages.

## 1. Setup
Before you can deploy, you need to install the dependencies locally:

```bash
npm install
```

## 2. Building the Project
GitHub Pages cannot run `.tsx` files directly. You must build the project into standard HTML/JS:

```bash
npm run build
```

This command will create a `dist/` folder in your project root.

## 3. Deploying to GitHub Pages
There are two common ways to deploy:

### Option A: Manual Upload
1. Run `npm run build`.
2. Take the contents of the `dist/` folder (index.html, assets folder, etc.).
3. Upload *only* these files to your GitHub repository (or a specific branch like `gh-pages`).
4. Configure GitHub Pages settings to point to that branch/root.

### Option B: GitHub Actions (Recommended)
1. Push this entire project (source code) to your GitHub repository.
2. Go to **Settings > Pages** in your repository.
3. Under **Build and deployment**, select **GitHub Actions**.
4. Search for and select the **Static HTML** or **Vite** workflow.
5. GitHub will automatically build and deploy your site.

## Key Configuration
- **`vite.config.ts`**: The `base: './'` setting has been added. This ensures that your app works correctly whether it is hosted at `username.github.io/repo-name/` or a custom domain.
- **API Keys**: The app uses a "Bring Your Own Key" architecture. You do **not** need to set environment variables in GitHub Secrets. The user will be prompted to enter their key in the browser.
