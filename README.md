# promptLM

## Static site deployment

The repository ships with a GitHub Actions workflow that publishes the contents of [`site/`](site/) to GitHub Pages.

### How it works

- On every push to the `main` branch that touches files in `site/`, the workflow `.github/workflows/deploy-gh-pages.yml` runs automatically.
- The workflow uploads the `site/` directory as a Pages artifact and deploys it to the GitHub Pages environment.
- You can trigger a manual deployment from the **Actions** tab by selecting the workflow and using **Run workflow**.

### First-time setup in GitHub

1. Go to your repository settings → **Pages**.
2. Under **Build and deployment**, choose **GitHub Actions** (the workflow already exists in the repo).
3. (Optional) If the workflow has not run yet, trigger it manually from the **Actions** tab so that Pages gets an initial deployment.

Once deployed, the site will be available at `https://<your-username>.github.io/<repository-name>/` unless you configure a custom domain.

### Linking a custom domain

To serve the site from your own URL:

1. Add a DNS CNAME record for your domain pointing to `<your-username>.github.io`.
2. Create a file `site/CNAME` that contains exactly your custom domain (for example, `www.example.com`). Commit and push the change.
3. In repository settings → **Pages**, enter the same custom domain and save. GitHub will provision TLS certificates automatically.

> **Tip:** After updating DNS or the `CNAME` file, rerun the deployment workflow (push a change to `site/` or trigger it manually) so GitHub Pages picks up the new domain.


