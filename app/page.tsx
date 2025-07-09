'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wallet, Coins, Users, TrendingUp, Sparkles } from 'lucide-react';
import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import Dashboard from '@/components/dashboard';

export default function Home() {
  // Privy hooks
  const { user, authenticated, ready } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();
  
  // Wagmi hooks
  const { address, isConnected } = useAccount();

  // Show loading while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and wallet is connected, show dashboard
  if (authenticated && isConnected && address) {
    return <Dashboard />;
  }

  // Show login/connection page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 pt-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CoinIt Launchpad
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your favorite blog posts into tradeable coins on Zora. Connect your wallet to get started.
          </p>
        </div>

        {/* Connection Status */}
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-2 border-dashed border-gray-300">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Wallet className="h-6 w-6" />
                Connect Your Wallet
              </CardTitle>
              <CardDescription>
                You need to connect your wallet to create and view coins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!authenticated ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-500">
                    Step 1: Authenticate with Privy
                  </p>
                  <Button 
                    onClick={login}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </Button>
                  <p className="text-xs text-gray-400">
                    Connect via wallet or email to get started
                  </p>
                </div>
              ) : !isConnected ? (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Authenticated</span>
                  </div>
                  {user?.email?.address && (
                    <p className="text-xs text-gray-600">
                      Logged in as: {user.email.address}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Step 2: Connect your wallet to continue
                  </p>
                  <p className="text-xs text-gray-400">
                    Please connect your wallet in your browser extension
                  </p>
                  <Button 
                    onClick={logout}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                    {user?.email?.address && (
                      <p className="text-xs text-gray-600">
                        {user.email.address}
                      </p>
                    )}
                    <p className="text-xs font-mono text-gray-500">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 font-medium">
                      🎉 Ready to create coins!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      You&apos;ll be redirected to the dashboard shortly
                    </p>
                  </div>
                  <Button 
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="grid grid-cols-1 gap-4 mt-8">
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Create Coins from Blogs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Scrape any blog post and automatically create a tradeable coin with metadata stored on IPFS
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Discover & Trade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Browse coins created by other users and discover interesting content from across the web
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-yellow-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-600" />
                  Join the Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Be part of a community that values quality content and supports creators through blockchain technology
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500">
          <p>Powered by Zora Protocol • Built on Base</p>
        </div>
      </div>
    </div>
  );
}
