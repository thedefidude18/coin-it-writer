'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ExternalLink, Coins, FileText, Link as LinkIcon, Plus } from 'lucide-react';
import { createCoin, DeployCurrency, ValidMetadataURI } from "@zoralabs/coins-sdk";
import { Address } from "viem";
import { base } from "viem/chains";
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';

interface ScrapedData {
  url: string;
  title: string;
  description: string;
  author: string;
  publishDate: string;
  image: string;
  content: string;
  tags: string[];
  scrapedAt: string;
}

interface CoinData {
  coinAddress: string;
  coinId: string;
  tokenName: string;
  tokenSymbol: string;
  ipfsUri: string;
  ipfsHash: string;
  gatewayUrl: string;
  coinParams: {
    name: string;
    symbol: string;
    uri: string;
    payoutRecipient: string;
    platformReferrer: string;
    chainId: number;
  };
}

interface CoinCreationModalProps {
  onCoinCreated?: (coinData: CoinData) => void;
}

export default function CoinCreationModal({ onCoinCreated }: CoinCreationModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  // Editable fields for coin creation
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setScrapedData(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape content');
      }

      setScrapedData(data);
      // Initialize editable fields from scraped data
      setTokenName(data.title.substring(0, 50)); // Truncate if too long
      setTokenSymbol(data.title.substring(0, 10).toUpperCase().replace(/[^A-Z]/g, '')); // Create symbol from title
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoin = async () => {
    if (!scrapedData || !address || !isConnected || !walletClient || !publicClient) {
      setError('Please connect your wallet and scrape a blog post first');
      return;
    }

    if (!tokenName.trim() || !tokenSymbol.trim()) {
      setError('Please enter both token name and symbol');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Upload metadata to IPFS first
      console.log('Uploading metadata to IPFS...');
      const metadataResponse = await fetch('/api/upload-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogData: scrapedData,
        }),
      });

      if (!metadataResponse.ok) {
        const metadataError = await metadataResponse.json();
        throw new Error(metadataError.error || 'Failed to upload metadata to IPFS');
      }

      const { ipfsUri, ipfsHash, gatewayUrl, metadata } = await metadataResponse.json();
      console.log('IPFS upload successful:', { ipfsUri, ipfsHash });

      // Step 2: Define coin parameters using editable fields
      const coinParams = {
        name: tokenName.trim(),
        symbol: tokenSymbol.trim().toUpperCase(),
        uri: ipfsUri as ValidMetadataURI,
        payoutRecipient: address as Address,
        platformReferrer: address as Address, // Using same address for platform referrer
        chainId: base.id,
        currency: DeployCurrency.ZORA,
      };

      console.log('Creating coin with params:', coinParams);

      // Step 3: Create the coin using wagmi clients
      const result = await createCoin(coinParams, walletClient, publicClient, {
        gasMultiplier: 120, // Add 20% buffer to gas
      });

      console.log("Transaction hash:", result.hash);
      console.log("Coin address:", result.address);
      console.log("Deployment details:", result.deployment);

      // Set the coin data for display
      const newCoinData = {
        coinAddress: result.address || 'N/A',
        coinId: result.deployment?.coin || 'N/A',
        tokenName: coinParams.name,
        tokenSymbol: coinParams.symbol,
        ipfsUri,
        ipfsHash,
        gatewayUrl,
        coinParams,
      };

      setCoinData(newCoinData);
      
      // Call the callback if provided
      if (onCoinCreated) {
        onCoinCreated(newCoinData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coin');
      console.error('Error creating coin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setUrl('');
    setScrapedData(null);
    setCoinData(null);
    setError('');
    setTokenName('');
    setTokenSymbol('');
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetModal();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Create New Coin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6" />
            Create Coin from Blog
          </DialogTitle>
          <DialogDescription>
            Scrape a blog post and create a Zora coin from your favorite content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Blog URL
              </CardTitle>
              <CardDescription>
                Enter a blog post URL to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Blog Post URL</label>
                <Input
                  placeholder="https://medium.com/@author/article-title"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleScrape} 
                  disabled={isLoading || !url}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Scrape Content
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scraped Data Display */}
          {scrapedData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Scraped Content
                </CardTitle>
                <CardDescription>Review the extracted blog content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Name</label>
                    <Input 
                      value={tokenName} 
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="Enter token name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Symbol</label>
                    <Input 
                      value={tokenSymbol} 
                      onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                      placeholder="Enter symbol (e.g., BTC)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={scrapedData.description} readOnly rows={3} />
                </div>

                {scrapedData.tags && scrapedData.tags.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {scrapedData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {scrapedData.image && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Featured Image</label>
                    <div className="border rounded-md p-2">
                      <img 
                        src={scrapedData.image} 
                        alt={scrapedData.title}
                        className="w-full h-48 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleCreateCoin} 
                  disabled={isLoading || !isConnected}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Coin...
                    </>
                  ) : (
                    <>
                      <Coins className="mr-2 h-4 w-4" />
                      Create Zora Coin
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Coin Creation Success */}
          {coinData && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Coins className="h-5 w-5" />
                  Coin Created Successfully!
                </CardTitle>
                <CardDescription className="text-green-600">
                  Your blog post has been converted to a Zora coin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Name</label>
                    <Input value={coinData.tokenName} readOnly />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Symbol</label>
                    <Input value={coinData.tokenSymbol} readOnly />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Coin Address</label>
                  <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                    <code className="text-sm flex-1 truncate">{coinData.coinAddress}</code>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(coinData.coinAddress)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">IPFS Metadata</label>
                  <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                    <code className="text-sm flex-1 truncate">{coinData.ipfsUri}</code>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                    >
                      <a href={coinData.gatewayUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Close & View Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 