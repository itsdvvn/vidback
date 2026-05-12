# Contributing to VidBack

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/vidback.git`
3. Install dependencies: `npm install`
4. Copy env file: `cp .env.example .env` and fill in your credentials
5. Push the database schema: `npx drizzle-kit push`
6. Run the dev server: `npm run dev`

## Development

- **Branch**: Create a branch for your changes: `git checkout -b feature/my-feature`
- **Code style**: The project uses TypeScript with strict mode. Run `npm run build` to check for errors.
- **Components**: Use shadcn/ui patterns. Add new components via `npx shadcn@latest add <component>`.
- **Server actions**: All server actions go in `src/lib/actions.ts`. They must use `requireAuth()` for protected routes.
- **Database**: Schema changes go in `src/db/schema.ts`. Run `npx drizzle-kit push` after changes.

## Pull Requests

1. Ensure your code compiles: `npm run build`
2. Write a clear PR description explaining what you changed and why
3. Link any related issues

## Reporting Issues

Use the GitHub issue tracker. Include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/environment details
