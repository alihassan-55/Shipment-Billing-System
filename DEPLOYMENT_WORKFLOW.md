# Deployment Workflow Guide

## Step 1: Create and Switch to a New Branch

```bash
# Create a new branch for testing
git checkout -b feature/deployment-fixes

# Verify you're on the new branch
git branch
```

## Step 2: Stage and Commit Your Changes

```bash
# Stage all modified files
git add Dockerfile
git add .dockerignore
git add server/src/app.js
git add server/src/db/client.js
git add server/src/server.js
git add client/package.json
git add client/src/components/NewShipmentForm.jsx

# Or stage all changes at once
git add -A

# Commit with a descriptive message
git commit -m "Fix deployment issues: Dockerfile, static file serving, and environment variables"
```

## Step 3: Push the Branch to Remote

```bash
# Push the branch to remote repository
git push -u origin feature/deployment-fixes

# Or if the branch already exists remotely
git push
```

## Step 4: Deploy to Fly.io from the Branch

```bash
# Deploy the specific branch to Fly.io
flyctl deploy --build-only --push -a coureir-billing-system

# Or if you want to build and deploy in one command
flyctl deploy -a coureir-billing-system
```

**Note:** Fly.io will automatically use the branch you're currently on if you've pushed it to the remote repository.

## Step 5: Test the Deployment

```bash
# Check deployment status
flyctl status -a coureir-billing-system

# View logs
flyctl logs -a coureir-billing-system

# Open the app in browser
flyctl open -a coureir-billing-system
```

## Step 6: After Testing - Merge to Main

```bash
# Switch back to main branch
git checkout main

# Pull latest changes (if any)
git pull origin main

# Merge the feature branch
git merge feature/deployment-fixes

# Push the merged changes to main
git push origin main

# Deploy from main branch
flyctl deploy -a coureir-billing-system
```

## Step 7: Clean Up (Optional)

```bash
# Delete the local branch after merging
git branch -d feature/deployment-fixes

# Delete the remote branch
git push origin --delete feature/deployment-fixes
```

## Alternative: Using Pull Request Workflow

If you're using GitHub/GitLab:

1. Push your branch: `git push -u origin feature/deployment-fixes`
2. Create a Pull Request on GitHub/GitLab
3. Review and test the deployment
4. Merge the PR through the web interface
5. Deploy from main branch

## Important Notes

- **Always test on a separate branch** before merging to main
- **Fly.io will deploy from the branch you push** to the remote repository
- **Set environment variables** if needed:
  ```bash
  flyctl secrets set DATABASE_URL="your_database_url" -a coureir-billing-system
  flyctl secrets set CLIENT_URL="https://your-app.fly.dev" -a coureir-billing-system
  flyctl secrets set NODE_ENV="production" -a coureir-billing-system
  ```

