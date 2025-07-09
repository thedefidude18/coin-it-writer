'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Coins, TrendingUp, Users, User, Wallet, LogOut, Copy, Check, Search, Trash2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import CoinCreationModal from './coin-creation-modal';
import CoinCard from './coin-card';
import { 
  getAllCoins, 
  getUserCoins, 
  getCoinStats, 
  getUserCoinStats, 
  createOrUpdateUser, 
  getUser,
  getCoinByAddress,
  deleteCoin,
  type CoinWithCreator,
  type User as UserType 
} from '@/lib/supabase-queries';

export default function Dashboard() {
  const { address } = useAccount();
  const { user } = usePrivy();
  const { logout } = useLogout();
  const [userCoins, setUserCoins] = useState<CoinWithCreator[]>([]);
  const [allCoins, setAllCoins] = useState<CoinWithCreator[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<CoinWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [stats, setStats] = useState({
    totalCoins: 0,
    userCoins: 0,
    totalCreators: 0
  });

  // Search functionality
  useEffect(() => {
    if (searchTerm) {
      const filtered = allCoins.filter(coin => 
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.metadata.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCoins(filtered);
    } else {
      setFilteredCoins(allCoins);
    }
  }, [searchTerm, allCoins]);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        // Ensure user exists in database and get user profile
        await createOrUpdateUser(address, user?.email?.address);
        const userProfile = await getUser(address);
        setUserProfile(userProfile);
        
        // Load coins data in parallel
        const [allCoinsData, userCoinsData, globalStats, userStats] = await Promise.all([
          getAllCoins(50, 0),
          getUserCoins(address, 50, 0),
          getCoinStats(),
          getUserCoinStats(address),
        ]);
        
        setAllCoins(allCoinsData);
        setFilteredCoins(allCoinsData);
        setUserCoins(userCoinsData);
        setStats({
          totalCoins: globalStats.totalCoins,
          userCoins: userStats.userCoins,
          totalCreators: globalStats.totalCreators
        });
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [address, user?.email?.address]);

  const handleCoinCreated = async () => {
    // Refresh the data after a coin is created
    try {
      const [allCoinsData, userCoinsData, globalStats, userStats] = await Promise.all([
        getAllCoins(50, 0),
        getUserCoins(address!, 50, 0),
        getCoinStats(),
        getUserCoinStats(address!),
      ]);
      
      setAllCoins(allCoinsData);
      setFilteredCoins(allCoinsData);
      setUserCoins(userCoinsData);
      setStats({
        totalCoins: globalStats.totalCoins,
        userCoins: userStats.userCoins,
        totalCreators: globalStats.totalCreators
      });
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    }
  };

  const handleDeleteCoin = async (coinId: string) => {
    if (window.confirm('Are you sure you want to delete this coin? This action cannot be undone.')) {
      try {
        await deleteCoin(coinId);
        // Refresh the data after deletion
        await handleCoinCreated();
      } catch (error) {
        console.error('Error deleting coin:', error);
        alert('Failed to delete coin. Please try again.');
      }
    }
  };

  const handleSearchCoin = async (coinAddress: string) => {
    try {
      const coin = await getCoinByAddress(coinAddress);
      if (coin) {
        setFilteredCoins([coin]);
      } else {
        alert('Coin not found');
      }
    } catch (error) {
      console.error('Error searching for coin:', error);
      alert('Error searching for coin');
    }
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CoinIt Launchpad
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back{userProfile?.email ? `, ${userProfile.email}` : ''}! Create and discover blog-to-coin transformations on Zora.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Connection Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Connected</span>
                </div>
                {address && (
                  <div className="flex items-center gap-2 ml-3 pl-3 border-l">
                    <Wallet className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-mono">{formatAddress(address)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
                <Button
                variant="outline"
                onClick={logout}
                className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
              </div>
              
              
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Coins</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.userCoins}</div>
              <p className="text-xs text-muted-foreground">
                Coins you&apos;ve created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coins</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCoins}</div>
              <p className="text-xs text-muted-foreground">
                Across all creators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Creators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreators}</div>
              <p className="text-xs text-muted-foreground">
                Active on platform
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coins Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              All Coins ({stats.totalCoins})
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              My Coins ({stats.userCoins})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">All Coins</h2>
              <Badge variant="secondary">{filteredCoins.length} coins</Badge>
            </div>
            
            {/* Search functionality */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search coins by name, symbol, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const address = prompt('Enter coin address to search:');
                  if (address) handleSearchCoin(address);
                }}
              >
                Search by Address
              </Button>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear
                </Button>
              )}
            </div>
            
            {allCoins.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Coins className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No coins yet</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Be the first to create a coin from a blog post!
                  </p>
                  <CoinCreationModal onCoinCreated={handleCoinCreated} />
                </CardContent>
              </Card>
            ) : filteredCoins.length === 0 && searchTerm ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No coins found</h3>
                  <p className="text-gray-500 text-center mb-4">
                    No coins match your search criteria: &quot;{searchTerm}&quot;
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCoins.map((coin) => (
                  <div key={coin.id} className="relative">
                    <CoinCard 
                      coin={{
                        id: coin.id,
                        name: coin.name,
                        symbol: coin.symbol,
                        address: coin.coin_address,
                        creator: coin.creator_wallet,
                        createdAt: coin.created_at,
                        metadata: coin.metadata,
                        ipfsUri: coin.ipfs_uri,
                      }}
                      isOwnCoin={coin.creator_wallet.toLowerCase() === address?.toLowerCase()}
                    />
                    {coin.creator_wallet.toLowerCase() === address?.toLowerCase() && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteCoin(coin.id)}
                          className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">My Coins</h2>
              <Badge variant="secondary">{userCoins.length} coins</Badge>
            </div>
            
            {userCoins.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">You haven&apos;t created any coins yet</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Start by creating your first coin from a blog post!
                  </p>
                  <CoinCreationModal onCoinCreated={handleCoinCreated} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCoins.map((coin) => (
                  <div key={coin.id} className="relative">
                    <CoinCard 
                      coin={{
                        id: coin.id,
                        name: coin.name,
                        symbol: coin.symbol,
                        address: coin.coin_address,
                        creator: coin.creator_wallet,
                        createdAt: coin.created_at,
                        metadata: coin.metadata,
                        ipfsUri: coin.ipfs_uri,
                      }}
                      isOwnCoin={true}
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteCoin(coin.id)}
                        className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 