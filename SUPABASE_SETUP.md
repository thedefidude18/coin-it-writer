# Supabase Setup Guide

This guide will help you set up Supabase for the CoinIt Launchpad project.

## Prerequisites

1. A Supabase account ([sign up here](https://supabase.com))
2. Supabase CLI installed ([installation guide](https://supabase.com/docs/guides/cli))

## Step 1: Create a New Supabase Project

1. Go to your [Supabase dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `coinit-launchpad`
5. Enter a database password (save this securely)
6. Choose your region
7. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (save as `NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon public key** (save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Service role key** (save as `SUPABASE_SERVICE_ROLE_KEY`)

## Step 3: Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 4: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

1. Initialize Supabase in your project:
```bash
supabase init
```

2. Link to your remote project:
```bash
supabase link --project-ref your-project-id
```

3. Run the migrations:
```bash
supabase db push
```

### Option B: Manual Setup via Dashboard

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run"
5. Copy and paste the contents of `supabase/migrations/002_rls_policies.sql`
6. Click "Run"

## Step 5: Configure Row Level Security

The RLS policies are set up automatically with the migrations. They ensure:

- Users can only modify their own profile
- Anyone can view coins (for public discovery)
- Users can only create/modify their own coins
- Anonymous users can read coins but not modify them

## Step 6: Test Your Setup

1. Start your Next.js development server:
```bash
npm run dev
```

2. Connect your wallet and try creating a coin
3. Check your Supabase dashboard → Table Editor to see if data is being saved

## Database Schema

### Users Table
- `wallet_address` (TEXT, PRIMARY KEY) - User's wallet address
- `email` (TEXT, NULLABLE) - User's email from Privy
- `created_at` (TIMESTAMP) - When user was created
- `updated_at` (TIMESTAMP) - When user was last updated

### Coins Table
- `id` (UUID, PRIMARY KEY) - Unique coin identifier
- `creator_wallet` (TEXT, FOREIGN KEY) - References users.wallet_address
- `name` (TEXT) - Token name
- `symbol` (TEXT) - Token symbol
- `coin_address` (TEXT, UNIQUE) - Blockchain address of the coin
- `transaction_hash` (TEXT) - Transaction hash from coin creation
- `ipfs_uri` (TEXT) - IPFS URI for metadata
- `ipfs_hash` (TEXT) - IPFS hash
- `gateway_url` (TEXT) - IPFS gateway URL
- `metadata` (JSONB) - Blog post metadata (title, description, image, etc.)
- `created_at` (TIMESTAMP) - When coin was created
- `updated_at` (TIMESTAMP) - When coin was last updated

### Views
- `coins_with_creator` - Joins coins with user information for easier querying

## Troubleshooting

### Migration Errors
- Ensure you have the correct database URL and credentials
- Check that UUID extension is enabled
- Verify your database permissions

### RLS Issues
- Make sure RLS policies are properly set up
- Check that your JWT claims include the wallet address
- Verify that your API calls include proper authentication

### Connection Issues
- Double-check your environment variables
- Ensure your Supabase project is running
- Check network connectivity

## Next Steps

Once your Supabase setup is complete:

1. The dashboard will load real data from your database
2. Creating coins will save to your database
3. Users will be automatically created when they first connect
4. All coin data will persist between sessions

## Security Notes

- Never commit your `.env.local` file to version control
- Use environment variables for all sensitive data
- The service role key should only be used server-side
- RLS policies are crucial for data security

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify your environment variables
3. Ensure your database schema matches the expected structure
4. Test your connection using the Supabase client 