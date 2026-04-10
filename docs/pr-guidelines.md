# Pull request guidelines

## Title

Use conventional commit format:

```
type(scope): short description
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `ci`, `perf`, `test`

Keep it under 72 characters. Use imperative mood ("add feature" not "added feature").

## Description

Every PR description must include:

1. **What** changed and **why**
2. **How to test** (steps or commands)
3. Screenshot or recording for UI changes

### Template

```markdown
## What

Brief summary of the change.

## Why

Context or issue link.

## How to test

1. Run `bun run dev`
2. Navigate to ...
3. Verify ...

## Screenshots

(if applicable)
```

## Conditions

- Title must match conventional commit format
- Description must not be empty
- Link related issues with `Closes #123` or `Fixes #123`
- UI changes require a screenshot
- Breaking changes must include `BREAKING CHANGE:` in the body
