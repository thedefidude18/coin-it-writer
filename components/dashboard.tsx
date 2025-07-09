'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Coins, TrendingUp, Users, User, Wallet, LogOut, Copy, Check } from 'lucide-react';
import { useAccount } from 'wagmi';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import CoinCreationModal from './coin-creation-modal';
import CoinCard from './coin-card';

// Mock data - this will be replaced with Supabase data later
const mockCoins = [
  {
    id: '1',
    name: 'The Future of AI in Web Development',
    symbol: 'FUTUAI',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    createdAt: '2024-01-15T10:30:00Z',
    metadata: {
      title: 'The Future of AI in Web Development: A Comprehensive Guide',
      description: 'Exploring how artificial intelligence is revolutionizing the way we build and interact with web applications.',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
      originalUrl: 'https://medium.com/@techwriter/future-of-ai-web-dev',
      author: 'TechWriter'
    },
    ipfsUri: 'ipfs://QmYourHashHere'
  },
  {
    id: '2',
    name: 'Blockchain Adoption in Enterprise',
    symbol: 'BLKENT',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    creator: '0xabcdef1234567890abcdef1234567890abcdef12',
    createdAt: '2024-01-14T15:45:00Z',
    metadata: {
      title: 'How Fortune 500 Companies Are Adopting Blockchain Technology',
      description: 'A detailed analysis of blockchain implementation strategies across major corporations.',
      image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
      originalUrl: 'https://techcrunch.com/blockchain-enterprise',
      author: 'CryptoAnalyst'
    },
    ipfsUri: 'ipfs://QmAnotherHashHere'
  },
  {
    id: '3',
    name: 'Web3 Design Principles',
    symbol: 'WEB3DES',
    address: '0x9876543210fedcba9876543210fedcba98765432',
    creator: '0x1234567890abcdef1234567890abcdef12345678', // Same as first coin creator
    createdAt: '2024-01-13T09:15:00Z',
    metadata: {
      title: 'Design Principles for Web3 Applications: UX Meets Decentralization',
      description: 'Understanding how to create user-friendly interfaces for decentralized applications.',
      image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400',
      originalUrl: 'https://uxdesign.cc/web3-principles',
      author: 'DesignGuru'
    },
    ipfsUri: 'ipfs://QmYetAnotherHash'
  }
];

export default function Dashboard() {
  const { address } = useAccount();
  const { user, authenticated } = usePrivy();
  const { logout } = useLogout();
  const [userCoins, setUserCoins] = useState<typeof mockCoins>([]);
  const [allCoins, setAllCoins] = useState<typeof mockCoins>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalCoins: 0,
    userCoins: 0,
    totalCreators: 0
  });

  // Mock data loading - replace with Supabase calls later
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter coins by current user
      const userCreatedCoins = mockCoins.filter(coin => 
        coin.creator.toLowerCase() === address?.toLowerCase()
      );
      
      setUserCoins(userCreatedCoins);
      setAllCoins(mockCoins);
      
      // Calculate stats
      const uniqueCreators = new Set(mockCoins.map(coin => coin.creator)).size;
      setStats({
        totalCoins: mockCoins.length,
        userCoins: userCreatedCoins.length,
        totalCreators: uniqueCreators
      });
      
      setIsLoading(false);
    };

    if (address) {
      loadData();
    }
  }, [address]);

  const handleCoinCreated = (newCoin: any) => {
    // This will be called when a new coin is created
    // For now, we'll just add it to the mock data
    const coinData = {
      id: Date.now().toString(),
      name: newCoin.tokenName,
      symbol: newCoin.tokenSymbol,
      address: newCoin.coinAddress,
      creator: address!,
      createdAt: new Date().toISOString(),
      metadata: {
        title: newCoin.tokenName,
        description: 'Newly created coin',
        image: '',
        originalUrl: '',
        author: ''
      },
      ipfsUri: newCoin.ipfsUri
    };
    
    setUserCoins(prev => [coinData, ...prev]);
    setAllCoins(prev => [coinData, ...prev]);
    setStats(prev => ({
      ...prev,
      totalCoins: prev.totalCoins + 1,
      userCoins: prev.userCoins + 1
    }));
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
              Welcome back! Create and discover blog-to-coin transformations on Zora.
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
                Coins you've created
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
              <Badge variant="secondary">{allCoins.length} coins</Badge>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allCoins.map((coin) => (
                  <CoinCard 
                    key={coin.id} 
                    coin={coin} 
                    isOwnCoin={coin.creator.toLowerCase() === address?.toLowerCase()}
                  />
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
                  <h3 className="text-lg font-medium text-gray-600 mb-2">You haven't created any coins yet</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Start by creating your first coin from a blog post!
                  </p>
                  <CoinCreationModal onCoinCreated={handleCoinCreated} />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCoins.map((coin) => (
                  <CoinCard 
                    key={coin.id} 
                    coin={coin} 
                    isOwnCoin={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 