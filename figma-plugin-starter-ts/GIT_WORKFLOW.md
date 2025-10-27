# Git Workflow Guide — Figma Plugin Starter

This guide walks you through how to safely commit and push updates to your plugin repository.

---

## 🗂️ 1. Navigate to your project folder

Make sure you're inside the correct directory before running Git commands:

```bash
cd ~/Documents/FigmaPlugs/figma-plugin-starter-ts
pwd
```

Expected output:

```
/Users/billinghamdaniel/Documents/FigmaPlugs/figma-plugin-starter-ts
```

---

## 🧰 2. Build your plugin before committing

Run the build process so that `dist/` is up to date.

```bash
npm run build
```

You should see something like:

```
[copy-ui] Copied src/ui.html -> dist/ui.html
[copy-ui] Copied src/images -> dist/images
```

---

## 💾 3. Stage and commit your changes

Once you’ve verified your plugin builds correctly:

```bash
git add .
git commit -m "Update plugin UI and code"
```

If you ever see this error:

```
fatal: Unable to read current working directory: No such file or directory
```

You’re likely in a broken shell session. Run:

```bash
cd ~/Documents/FigmaPlugs/figma-plugin-starter-ts
```

Then try again.

---

## ☁️ 4. Push to GitHub

Push your local changes to your GitHub repo:

```bash
git push origin main
```

If you get this message:

```
Updates were rejected because the remote contains work that you do not have locally.
```

Run this to pull and sync safely:

```bash
git pull origin main --rebase --allow-unrelated-histories
git push origin main
```

---

## ✅ 5. Confirm the update

Go to your GitHub repo:
[https://github.com/DanBilly13/playerAvatars](https://github.com/DanBilly13/playerAvatars)

You should now see your latest commit message and updated files.

---

### 💡 Tips

- Use `git status` often — it shows you what’s staged, changed, or untracked.
- Use `git log --oneline` to quickly view recent commits.
- If you get stuck, you can always safely exit with `Ctrl + C`.

---

Happy coding 👏
