import { supabase } from './supabase';
import { sendTelegramMessage, formatNewCoinMessage } from './telegram';

export interface User {
  wallet_address: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Coin {
  id: string;
  creator_wallet: string;
  name: string;
  symbol: string;
  coin_address: string;
  transaction_hash?: string;
  ipfs_uri?: string;
  ipfs_hash?: string;
  gateway_url?: string;
  metadata: {
    title?: string;
    description?: string;
    image?: string;
    originalUrl?: string;
    author?: string;
    publishDate?: string;
    tags?: string[];
    content?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CoinWithCreator extends Coin {
  creator_email?: string;
}

export interface CreateCoinData {
  creator_wallet: string;
  name: string;
  symbol: string;
  coin_address: string;
  transaction_hash?: string;
  ipfs_uri?: string;
  ipfs_hash?: string;
  gateway_url?: string;
  metadata: Record<string, unknown>;
}

// User functions
export async function createOrUpdateUser(walletAddress: string, email?: string) {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      wallet_address: walletAddress,
      email,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }

  return data as User;
}

export async function getUser(walletAddress: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching user:', error);
    throw error;
  }

  return data as User | null;
}

// Coin functions
export async function createCoin(coinData: CreateCoinData) {
  const { data, error } = await supabase
    .from('coins')
    .insert(coinData)
    .select()
    .single();

  if (error) {
    console.error('Error creating coin:', error);
    throw error;
  }

  // Send Telegram message for new coin
  try {
    const coin = data as Coin;
    // Prepare message data
    const name = coin.name;
    const symbol = coin.symbol;
    const marketCap = '$0.00'; // Default, update if you have live data
    const totalSupply = '1.00B'; // Default, update if you have live data
    const creator = `${coin.creator_wallet.slice(0, 6)}...${coin.creator_wallet.slice(-4)} (https://zora.co/profile/${coin.creator_wallet})`;
    const createdAt = new Date(coin.created_at).toISOString().replace('T', ' ').replace('Z', ' UTC');
    const contract = `${coin.coin_address.slice(0, 6)}...${coin.coin_address.slice(-4)}`;
    const description = coin.metadata?.description || '';
    const zoraUrl = `https://zora.co/creator-coins/base:${coin.coin_address}`;
    const baseScanUrl = `https://basescan.org/address/${coin.coin_address}`;
    const dexScreenerUrl = `https://dexscreener.com/base/${coin.coin_address}`;
    const message = formatNewCoinMessage({
      name,
      symbol,
      marketCap,
      totalSupply,
      creator,
      createdAt,
      contract,
      description,
      zoraUrl,
      baseScanUrl,
      dexScreenerUrl,
    });
    await sendTelegramMessage(message, 'Markdown');
  } catch (err) {
    console.error('Failed to send Telegram message for new coin:', err);
  }

  return data as Coin;
}

export async function getAllCoins(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('coins')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching coins:', error);
    throw error;
  }

  return data as CoinWithCreator[];
}

export async function getUserCoins(walletAddress: string, limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('coins')
    .select('*')
    .eq('creator_wallet', walletAddress)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user coins:', error);
    throw error;
  }

  return data as CoinWithCreator[];
}

export async function getCoinByAddress(coinAddress: string) {
  const { data, error } = await supabase
    .from('coins')
    .select('*')
    .eq('coin_address', coinAddress)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching coin:', error);
    throw error;
  }

  return data as CoinWithCreator | null;
}

export async function updateCoin(coinId: string, updates: Partial<Coin>) {
  const { data, error } = await supabase
    .from('coins')
    .update(updates)
    .eq('id', coinId)
    .select()
    .single();

  if (error) {
    console.error('Error updating coin:', error);
    throw error;
  }

  return data as Coin;
}

export async function deleteCoin(coinId: string) {
  const { error } = await supabase
    .from('coins')
    .delete()
    .eq('id', coinId);

  if (error) {
    console.error('Error deleting coin:', error);
    throw error;
  }
}


// Stats functions
export async function getCoinStats() {
  const { data: totalCoins, error: totalError } = await supabase
    .from('coins')
    .select('id', { count: 'exact' });

  const { error: creatorsError } = await supabase
    .from('coins')
    .select('creator_wallet', { count: 'exact' });

  if (totalError || creatorsError) {
    console.error('Error fetching stats:', totalError || creatorsError);
    throw totalError || creatorsError;
  }

  // Get unique creators count
  const { data: creatorData } = await supabase
    .from('coins')
    .select('creator_wallet')
    .then(({ data, error }) => {
      if (error) throw error;
      const uniqueCreatorsSet = new Set(data?.map(coin => coin.creator_wallet));
      return { data: uniqueCreatorsSet.size, error: null };
    });

  return {
    totalCoins: totalCoins?.length || 0,
    totalCreators: creatorData || 0,
  };
}

// Fetch all creators and their stats (coins created, etc)
export async function getAllCreatorsWithStats() {
  // Get all coins
  const { data: coins, error } = await supabase
    .from('coins')
    .select('*');
  if (error) {
    console.error('Error fetching coins for creators:', error);
    throw error;
  }
  // Group by creator_wallet
  const creatorsMap = new Map();
  for (const coin of coins) {
    if (!creatorsMap.has(coin.creator_wallet)) {
      creatorsMap.set(coin.creator_wallet, {
        wallet: coin.creator_wallet,
        coins: [],
        coinsCreated: 0,
        // Placeholder for user info
        user: null,
      });
    }
    const creator = creatorsMap.get(coin.creator_wallet);
    creator.coins.push(coin);
    creator.coinsCreated++;
  }
  // Fetch user info for each creator
  const creatorWallets = Array.from(creatorsMap.keys());
  if (creatorWallets.length > 0) {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .in('wallet_address', creatorWallets);
    if (!userError && users) {
      for (const user of users) {
        if (creatorsMap.has(user.wallet_address)) {
          creatorsMap.get(user.wallet_address).user = user;
        }
      }
    }
  }
  // Convert to array
  return Array.from(creatorsMap.values());
}

export async function getUserCoinStats(walletAddress: string) {
  const { data, error } = await supabase
    .from('coins')
    .select('id', { count: 'exact' })
    .eq('creator_wallet', walletAddress);

  if (error) {
    console.error('Error fetching user coin stats:', error);
    throw error;
  }

  return {
    userCoins: data?.length || 0,
  };
} 