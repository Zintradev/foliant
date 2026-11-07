# 🔒 Maintainers Guide

## 🚀 How to Release a New Version

This project uses an automated CI/CD pipeline to generate and publish releases. **Do not manually edit version numbers in Tauri or Cargo files.**

To release a new version:

1. Ensure your working directory is completely clean (`git status`).
2. Run the npm version command:

        npm version <new-version>

   *Note: This automatically triggers a custom script (`sync-version.cjs`) that synchronizes the version across `package.json`, `tauri.conf.json`, and `Cargo.toml`, and creates the Git tag.*

3. Push the commits and the new tag to GitHub:

        git push origin main --tags

4. GitHub Actions will automatically catch the tag, compile the `.msi` and `.dmg` installers, sign them, and publish the Release.
