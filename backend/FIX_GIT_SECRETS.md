# Fix GitHub Push Protection - Remove Secrets from Git History

GitHub detected HuggingFace tokens in your Git history. Here's how to fix it:

## ⚠️ Problem

GitHub push protection blocked your push because it found HuggingFace tokens in your commit history. Even though we've removed them from the current code, they're still in Git history.

## ✅ Solution Options

### Option 1: Allow the Secret (Quick Fix - Not Recommended)

If you need to push immediately and the token is already exposed:

1. Click the URL from the error message:
   ```
   https://github.com/sujalmFilterit/studybuddy/security/secret-scanning/unblock-secret/...
   ```
2. Follow the prompts to allow the secret
3. **Important:** Rotate/revoke the token immediately after pushing, as it's now exposed

### Option 2: Remove Secrets from Git History (Recommended)

**⚠️ WARNING:** This rewrites Git history. Coordinate with your team first!

#### Step 1: Install BFG Repo-Cleaner (Easier Method)

```bash
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/
# Or use git-filter-repo (see below)
```

#### Step 2: Remove Token from History

**Using git-filter-repo (Recommended):**

```bash
# Install git-filter-repo first
pip install git-filter-repo

# Navigate to your repo
cd backend

# Remove the token from all commits
git filter-repo --replace-text <(echo "hf_your_token_here==>hf_REMOVED")

# Force push (WARNING: This rewrites history!)
git push origin new-dev --force
```

**Using BFG (Alternative):**

```bash
# Create a file with the token to remove
echo "hf_your_token_here" > tokens.txt

# Run BFG
java -jar bfg.jar --replace-text tokens.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin new-dev --force
```

#### Step 3: Rotate Your Token

**IMPORTANT:** After removing from history, you MUST:

1. Go to [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. Revoke the old token (the one that was exposed)
3. Create a new token
4. Update environment variables everywhere:
   - Vercel
   - Local `.env` files
   - Any other services

### Option 3: Create a New Branch (Safest)

If you don't want to rewrite history:

```bash
# Create a new branch from current state
git checkout -b new-dev-clean

# Push the new branch
git push origin new-dev-clean

# Delete the old branch on GitHub
# Then rename new branch to new-dev
```

## 🔒 Prevention

### 1. Verify .gitignore

Make sure `.gitignore` includes:
```
.env
.env.local
.env.*
backend/.env
backend/.env.*
```

### 2. Check Before Committing

```bash
# Check if you're about to commit secrets
git diff --cached | grep -i "hf_\|token\|password\|secret"
```

### 3. Use Git Hooks

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# Prevent committing secrets
if git diff --cached | grep -E "hf_[A-Za-z0-9]{40,}"; then
    echo "ERROR: Potential secret detected! Aborting commit."
    exit 1
fi
```

## ✅ Current Status

**All hardcoded tokens have been removed from code files:**

- ✅ `backend/src/lib/hf.js` - Now requires `process.env.HF_TOKEN`
- ✅ `backend/src/routes/chat.routes.js` - Now requires `process.env.HF_TOKEN`
- ✅ `backend/src/routes/ai-schedule.routes.js` - Now requires `process.env.HF_TOKEN`
- ✅ `backend/src/routes/feedback.routes.js` - Now requires `process.env.HF_TOKEN`
- ✅ Documentation files updated to use placeholders

**Next Steps:**

1. Choose one of the solutions above
2. Rotate your HuggingFace token (create a new one)
3. Update all environment variables
4. Verify no secrets are in current code: `grep -r "hf_" backend/src/`

## 🛡️ Best Practices Going Forward

1. **Never commit secrets** - Always use environment variables
2. **Use .env files** - Keep them in `.gitignore`
3. **Use secret management** - Consider using Vercel's environment variables or AWS Secrets Manager
4. **Rotate regularly** - Change tokens periodically
5. **Use different tokens** - Different tokens for dev/staging/production

---

**Need Help?** If you're unsure which option to choose, Option 3 (new branch) is the safest and doesn't require rewriting history.

