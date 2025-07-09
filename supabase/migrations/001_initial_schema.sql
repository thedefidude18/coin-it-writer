-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    wallet_address TEXT PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coins table
CREATE TABLE coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_wallet TEXT NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    coin_address TEXT NOT NULL UNIQUE,
    transaction_hash TEXT,
    ipfs_uri TEXT,
    ipfs_hash TEXT,
    gateway_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_coins_creator_wallet ON coins(creator_wallet);
CREATE INDEX idx_coins_created_at ON coins(created_at DESC);
CREATE INDEX idx_coins_coin_address ON coins(coin_address);
CREATE INDEX idx_coins_metadata ON coins USING GIN(metadata);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coins_updated_at BEFORE UPDATE ON coins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for coins with creator info
CREATE VIEW coins_with_creator AS
SELECT 
    c.id,
    c.name,
    c.symbol,
    c.coin_address,
    c.transaction_hash,
    c.ipfs_uri,
    c.ipfs_hash,
    c.gateway_url,
    c.metadata,
    c.created_at,
    c.updated_at,
    c.creator_wallet,
    u.email as creator_email
FROM coins c
JOIN users u ON c.creator_wallet = u.wallet_address
ORDER BY c.created_at DESC; 