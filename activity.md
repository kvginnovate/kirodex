# Activity Log

## 2026-04-11 16:39 GST (Dubai)
### CI: Commit and push release workflow, signing, Homebrew tap, and bundle metadata
Committed `ad9933a` to main with: reworked release workflow (setup + matrix build + homebrew jobs), macOS code signing/notarization support, Homebrew cask template, fixed bundle identifier to `com.kirodex.app`, added bundle metadata, and certificate patterns in `.gitignore`.
**Modified:** `.github/workflows/release.yml`, `.github/homebrew/Casks/kirodex.rb.template`, `.gitignore`, `src-tauri/tauri.conf.json`, `activity.md`

## 2026-04-11 16:33 GST (Dubai)
### Gitignore: Added certificate signing file patterns
Added `*.key`, `*.csr`, and `*.cer` glob patterns to `.gitignore` to prevent private keys, certificate signing requests, and certificates from being committed.

**Modified:** `.gitignore`
