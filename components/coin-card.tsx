'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, User, Coins, Copy, Check } from 'lucide-react';
import { useState } from 'react';

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
                <img 
                  src={coin.metadata.image} 
                  alt={coin.metadata.title || coin.name}
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
        </div>
      </CardContent>
    </Card>
  );
} 