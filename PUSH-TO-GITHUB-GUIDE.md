# 🚀 Push to New GitHub Repository - SECURE GUIDE

## ⚠️ CRITICAL: Security First!

Your `.env` file contains **SECRET KEYS** that are already tracked by git. We need to remove them before pushing.

## 🔒 Step 1: Remove Sensitive Files from Git

```bash
# Remove .env from git tracking (but keep the file locally)
git rm --cached .env
git rm --cached .env.local

# Commit the removal
git commit -m "chore: remove sensitive environment files from git"
```

## 📝 Step 2: Verify .gitignore

Your `.gitignore` is now updated to include:
- `.env`
- `.env*.local`

This prevents future commits from including these files.

## ✅ Step 3: Create .env.example

I've created `.env.example` with placeholder values. This helps others set up the project without exposing your keys.

## 🔄 Step 4: Create New Repository

### Option A: Create on GitHub First (Recommended)
1. Go to https://github.com/new
2. Create a new repository (e.g., "college-erp-attendance")
3. **DO NOT** initialize with README (you already have code)
4. Copy the repository URL

### Option B: Use GitHub CLI
```bash
gh repo create college-erp-attendance --public --source=. --remote=origin
```

## 📤 Step 5: Push to New Repository

```bash
# If you created repo on GitHub (Option A):
git remote remove origin  # Remove old remote if exists
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main

# If you used GitHub CLI (Option B):
# Already done! Just push:
git push -u origin main
```

## 🔍 Step 6: Verify Security

After pushing, check:
1. Go to your GitHub repository
2. Make sure `.env` and `.env.local` are **NOT** visible
3. Make sure `.env.example` **IS** visible
4. Check that no API keys are exposed

## 📋 Complete Command Sequence

```bash
# 1. Remove sensitive files from git
git rm --cached .env
git rm --cached .env.local

# 2. Stage all changes
git add .

# 3. Commit
git commit -m "feat: add QR attendance with 500m radius + security fixes"

# 4. Create new repo (choose one method)
# Method 1: GitHub website (then add remote manually)
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Method 2: GitHub CLI
gh repo create college-erp-attendance --public --source=. --remote=origin

# 5. Push
git branch -M main
git push -u origin main
```

## 🎯 What Gets Pushed

✅ **Will be pushed:**
- All source code
- `.env.example` (template)
- `.gitignore` (updated)
- Documentation files
- SQL setup scripts
- README

❌ **Will NOT be pushed:**
- `.env` (contains secrets)
- `.env.local` (contains secrets)
- `node_modules/`
- `.next/` (build cache)

## 🔐 Security Checklist

Before pushing, verify:
- [ ] `.env` removed from git tracking
- [ ] `.env.local` removed from git tracking
- [ ] `.gitignore` includes `.env` and `.env*.local`
- [ ] `.env.example` created with placeholders
- [ ] No API keys visible in any committed files
- [ ] No database passwords in code

## 🆘 If You Accidentally Pushed Secrets

If you already pushed and exposed your keys:

1. **Immediately rotate your Supabase keys:**
   - Go to Supabase Dashboard
   - Settings → API
   - Click "Reset" on the anon key
   - Update your local `.env` files

2. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   
   git push origin --force --all
   ```

3. **Or use BFG Repo-Cleaner** (easier):
   ```bash
   # Install BFG
   # Then run:
   bfg --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

## 📚 After Pushing

Add this to your README:

```markdown
## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Add your Supabase credentials to `.env.local`
4. Run `npm install`
5. Run `npm run dev`
```

## ✅ Ready to Push?

Run these commands now:

```bash
git rm --cached .env .env.local
git add .
git commit -m "feat: QR attendance system with 500m radius + security improvements"
```

Then create your new repository and push!
