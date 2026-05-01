# Atlastly Test Credentials

## Admin account (restored Feb 2026)
- **Email:** `sandratest@gmail.com`
- **Password:** `Atlastly2026!`
- **Role:** admin
- **Login URL:** https://atlastly-restore.preview.emergentagent.com/admin-auth

## Note
This account was accidentally wiped during earlier automated testing cleanups. It has been restored with a temporary password. The user should change it (once we add password-change UI) or simply delete+recreate via the signup form if desired.

## Important for future agents
**DO NOT run bulk `auth.admin.delete_user` or bulk `user_roles` deletion without explicit user consent.** Always filter by specific test email prefixes (e.g. emails containing `@atlastly.com` or starting with `test_`, `debug_`, `verify_`, `bulk_`, etc.) — never delete all users indiscriminately.
