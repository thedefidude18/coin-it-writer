-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Coins policies
CREATE POLICY "Anyone can view coins" ON coins
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own coins" ON coins
    FOR INSERT WITH CHECK (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own coins" ON coins
    FOR UPDATE USING (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can delete their own coins" ON coins
    FOR DELETE USING (creator_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON coins TO authenticated;
GRANT SELECT ON coins_with_creator TO authenticated;

-- Allow anonymous users to read coins (for public discovery)
GRANT SELECT ON coins TO anon;
GRANT SELECT ON coins_with_creator TO anon; 