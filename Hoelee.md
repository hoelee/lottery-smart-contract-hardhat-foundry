# Hoelee Note Section

## 1. Git Version Control -> Own Gitea Server

First time initialize:

```
git config --global user.name "hoelee"
git config --global user.email "me@hoelee.com"
git init .
git add .
git checkout -b main
git commit -m "Initial Commit"
git remote set-url origin https://username:accessToken@git.hoelee.com/hoelee/ethers-simple-storage.git
git credential-cache exit // Fix Credential Error
```

Standard Update:

```
git add .
git commit -m "Describe what changes"
git push -u origin main
    // After set this, later easier usage via below line
git push
git pull
```

Development need exlude file can create root file with name .gitignore

```
node_modules
package.json
img
artifacts
cache
coverage
.env
.*
README.md
coverage.json
```
