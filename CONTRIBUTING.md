# Contributing to Foliant

First off, thank you for considering contributing to Foliant! It's people like you that make the open-source community such an amazing place to learn, inspire, and create. 

We want to build the most lightweight, fast, and secure writing and worldbuilding tool for novelists. Whether you're fixing a bug, adding a feature, or improving documentation, your help is incredibly valuable.

## Our Core Philosophy
Foliant is designed with extreme performance in mind.

To keep the application lightning-fast and secure, our guiding principles are:
* **Keep it lightweight:** We try to avoid adding heavy third-party dependencies unless strictly necessary.
* **Local-First:** Features should prioritize local performance and respect the `.foliant` offline architecture.

## The Quality Pipeline (Local CI)
To make the review process as smooth as possible, we have set up a local automated pipeline. Before pushing your changes and opening a Pull Request, please ensure your code passes our quality checks by running:

```bash
npm run check-all
```

This single command helps us maintain a clean codebase by checking:
1. **TypeScript (`tsc --noEmit`):** Ensures type safety.
2. **ESLint:** Keeps React code clean and avoids phantom dependencies.
3. **Vitest:** Runs all unit tests to prevent regressions.
4. **Rustfmt (`cargo fmt -- --check`):** Keeps our Rust code formatted to standard.
5. **Clippy (`cargo clippy -D warnings`):** Helps us catch unoptimized Rust code or bad practices.

*Note: If the script fails, don't worry! It will tell you exactly what line needs fixing. If you're stuck on a Clippy or TypeScript error, feel free to open the PR anyway and ask for help in the comments.*

## Contribution Workflow
1. **Fork** the repository and clone it locally.
2. **Create a branch** for your feature or bugfix (e.g., `feat/dark-mode-tweaks` or `fix/timeline-scroll`).
3. **Commit** your changes using clear, descriptive messages.
4. **Run** `npm run check-all` to ensure everything is green.
5. **Push** to your fork and open a **Pull Request**.

If your PR changes the user interface, please include a screenshot or a short video in the description so we can see your awesome work in action!

Thank you for helping us make Foliant better. 🪶