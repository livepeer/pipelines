Livepeer Pipelines enables developers and users to build, deploy, and scale real-time AI video processing workflows.

> Join the [Discord](https://discord.gg/livepeer) to stay up to date with the latest features and updates.

## Prerequisites

- Node.js >= 18
- pnpm 9.12.3 or later
- Livepeer Studio API key
- Supabase credentials (for database)

## Environment Variables

Rename `.env.example` to `.env` and fill in the values.

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

This is a monorepo using Turborepo with the following packages:

- `apps/app`: Main Next.js application
- `apps/docs`: Documentation site using Mintlify
- `packages/design-system`: Shared UI components
- `packages/tailwind-config`: Shared Tailwind configuration
- `packages/supabase`: Supabase clients for browser and server
- `packages/typescript-config`: Shared TypeScript configuration
- `packages/next-config`: Shared Next.js configuration

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages

