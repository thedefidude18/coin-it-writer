'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Coins, FileText, Calendar, User, Link as LinkIcon } from 'lucide-react';

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
  metadata: {
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoin = async () => {
    if (!scrapedData || !walletAddress) {
      setError('Please provide wallet address and scrape a blog post first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-coin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blogData: scrapedData,
          walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create coin');
      }

      setCoinData(data.coin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create coin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            CoinIt Writer
          </h1>
          <p className="text-gray-600">
            Scrape blog posts and create Zora coins from your favorite content
          </p>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Blog URL & Wallet
            </CardTitle>
            <CardDescription>
              Enter a blog post URL and your wallet address to get started
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <Input
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleScrape}
              disabled={isLoading || !url}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Scrape Blog Post
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scraped Content */}
        {scrapedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Scraped Content
              </CardTitle>
              <CardDescription>
                Blog post content extracted from {new URL(scrapedData.url).hostname}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{scrapedData.title}</h3>
                {scrapedData.description && (
                  <p className="text-gray-600">{scrapedData.description}</p>
                )}
              </div>

              {scrapedData.image && (
                <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={scrapedData.image}
                    alt={scrapedData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {scrapedData.author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Author:</span>
                    <span>{scrapedData.author}</span>
                  </div>
                )}
                {scrapedData.publishDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Published:</span>
                    <span>{new Date(scrapedData.publishDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {scrapedData.tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {scrapedData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Content Preview:</label>
                <Textarea
                  value={scrapedData.content.substring(0, 500) + '...'}
                  readOnly
                  className="min-h-[100px] resize-none bg-gray-50"
                />
              </div>

              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-gray-500" />
                <a
                  href={scrapedData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Original Post
                </a>
              </div>

              <Button
                onClick={handleCreateCoin}
                disabled={isLoading || !walletAddress}
                className="w-full"
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

        {/* Coin Data */}
        {coinData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Zora Coin Created
              </CardTitle>
              <CardDescription>
                Your blog post has been successfully coined on Zora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Token Name:</span>
                  <p className="text-gray-700">{coinData.tokenName}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Symbol:</span>
                  <p className="text-gray-700">{coinData.tokenSymbol}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Coin Address:</span>
                  <p className="text-gray-700 font-mono text-sm break-all">
                    {coinData.coinAddress}
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Coin ID:</span>
                  <p className="text-gray-700 font-mono text-sm">
                    {coinData.coinId}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Metadata:</span>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm"><strong>Description:</strong> {coinData.metadata.description}</p>
                  <p className="text-sm mt-2"><strong>Attributes:</strong></p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {coinData.metadata.attributes.map((attr, index) => (
                      <div key={index} className="flex justify-between bg-white p-2 rounded text-sm">
                        <span className="font-medium">{attr.trait_type}:</span>
                        <span>{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  ✅ Successfully created Zora coin for "{scrapedData?.title}"
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
