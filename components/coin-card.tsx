// 
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Calendar, User, Coins, Copy, Check, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { parseEther } from "viem";
import {
  Account,
  WalletClient,
  PublicClient,
} from "viem";
import {  useWallets, usePrivy } from "@privy-io/react-auth";
import {  tradeCoin, TradeParameters } from "@zoralabs/coins-sdk";
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

export type GenericPublicClient = PublicClient;

interface CoinCardProps {
  coin: {
    id: string;
    name: string;
    symbol: string;
    address: string;
    creator: string;
    createdAt: string;
    metadata?: {
      title?: string;
      description?: string;
      image?: string;
      originalUrl?: string;
      author?: string;
    };
    ipfsUri?: string;
  };
  isOwnCoin?: boolean;
}

export default function CoinCard({ coin, isOwnCoin = false }: CoinCardProps) {
  const [copied, setCopied] = useState(false);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ethAmount, setEthAmount] = useState("0.0001");

  const { wallets } = useWallets();
  const { ready } = usePrivy();
  
  const account = useAccount()
  // const account = getAccount(wagmiConfig)
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleTrade = async (coinAddress: `0x${string}`) => {
    if (!ready) {
      setError("Please log in with Privy first");
      return;
    }
    
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setError("Please enter a valid ETH amount");
      return;
    }
    
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const tradeParams: TradeParameters = {
        sell: { type: "eth" },
        buy: { type: "erc20", address: coinAddress as `0x${string}` },
        amountIn: parseEther(ethAmount),
        slippage: 0.05,
        sender: account.address as `0x${string}`,
      };

      const receipt = await tradeCoin({
        tradeParameters: tradeParams,
        walletClient: walletClient as WalletClient,
        publicClient: publicClient as GenericPublicClient,
        account: walletClient?.account as Account,
      });
      setTxHash(receipt.transactionHash);
    } catch (err: unknown) {
      console.log(err)
      setError((err as Error).message || "Trade failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isOwnCoin ? 'border-purple-200 bg-purple-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5" />
              {coin.name}
              {isOwnCoin && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Your Coin
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm">${coin.symbol}</span>
              <span>•</span>
              <span>{formatAddress(coin.address)}</span>
            </CardDescription>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(coin.address)}
            className="ml-2"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Blog Metadata */}
        {coin.metadata && (
          <div className="space-y-3">
            {coin.metadata.title && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Original Blog Title</h4>
                <p className="text-sm">{coin.metadata.title}</p>
              </div>
            )}

            {coin.metadata.description && (
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600 line-clamp-3">{coin.metadata.description}</p>
              </div>
            )}

            {coin.metadata.image && (
              <div className="rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={coin.metadata.image} 
                  alt={coin.metadata.title || coin.name}
                  width={500}
                  height={128}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Coin Details */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span>Creator</span>
            </div>
            <span className="font-mono">{formatAddress(coin.creator)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Created</span>
            </div>
            <span>{formatDate(coin.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {coin.metadata?.originalUrl && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={coin.metadata.originalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                View Blog
              </a>
            </Button>
          )}
          
          {coin.ipfsUri && (
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a href={coin.ipfsUri} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                View Metadata
              </a>
            </Button>
          )}

          {!isOwnCoin && (
            <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="flex-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Trade {coin.symbol}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Coin Details</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>{coin.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Symbol:</span>
                        <span>${coin.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-mono text-xs">{formatAddress(coin.address)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ethAmount" className="text-sm font-medium">
                        ETH Amount to Trade
                      </Label>
                      <Input
                        id="ethAmount"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={ethAmount}
                        onChange={(e) => setEthAmount(e.target.value)}
                        placeholder="Enter ETH amount"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Trade Details</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">You pay:</span>
                        <span>{ethAmount} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">You receive:</span>
                        <span>${coin.symbol} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Slippage:</span>
                        <span>5%</span>
                      </div>
                    </div>
                  </div>

              

                  {!ready || !wallets[0] ? (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Please log in with Privy to continue trading.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleTrade(coin.address as `0x${string}`)}
                      disabled={loading || !ethAmount || parseFloat(ethAmount) <= 0}
                      className="w-full"
                    >
                      {loading ? "Trading..." : `Trade ${ethAmount} ETH`}
                    </Button>
                  )}

                  {txHash && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ Transaction successful!
                      </p>
                      <p className="text-xs text-green-700 mt-1 font-mono break-all">
                        {txHash}
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 