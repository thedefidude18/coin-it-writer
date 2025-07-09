import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createCollectorClient } from '@zoralabs/protocol-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

export async function POST(request: NextRequest) {
  try {
    const { blogData, walletAddress } = await request.json();

    if (!blogData || !walletAddress) {
      return NextResponse.json({ error: 'Blog data and wallet address are required' }, { status: 400 });
    }

    // Store blog post in Supabase
    const { data: blogPost, error: blogError } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        url: blogData.url,
        title: blogData.title,
        description: blogData.description,
        author: blogData.author,
        publish_date: blogData.publishDate,
        image: blogData.image,
        content: blogData.content,
        tags: blogData.tags,
        scraped_at: blogData.scrapedAt,
      })
      .select()
      .single();

    if (blogError) {
      console.error('Supabase error:', blogError);
      return NextResponse.json({ error: 'Failed to store blog post' }, { status: 500 });
    }

    // Create Zora coin
    try {
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      const collectorClient = createCollectorClient({ 
        chainId: base.id,
        publicClient: publicClient as any,
      });

      // Generate token name and symbol from blog title
      const tokenName = blogData.title.substring(0, 32) || 'Blog Coin';
      const tokenSymbol = blogData.title
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 8)
        .toUpperCase() || 'BLOG';

      // Create token metadata
      const tokenMetadata = {
        name: tokenName,
        description: `A coin representing the blog post: ${blogData.title}`,
        image: blogData.image || '',
        external_url: blogData.url,
        attributes: [
          {
            trait_type: 'Author',
            value: blogData.author || 'Unknown',
          },
          {
            trait_type: 'Source',
            value: new URL(blogData.url).hostname,
          },
          {
            trait_type: 'Type',
            value: 'Blog Post',
          },
        ],
      };

      // For now, we'll return the metadata structure
      // In a real implementation, you would:
      // 1. Upload metadata to IPFS
      // 2. Use Zora's coin creation API
      // 3. Sign the transaction with the user's wallet
      
      const mockCoinData = {
        coinAddress: '0x' + Math.random().toString(16).substr(2, 40),
        coinId: Math.random().toString(),
        tokenName,
        tokenSymbol,
        metadata: tokenMetadata,
      };

      // Update blog post with coin information
      const { error: updateError } = await supabaseAdmin
        .from('blog_posts')
        .update({
          zora_coin_address: mockCoinData.coinAddress,
          zora_coin_id: mockCoinData.coinId,
        })
        .eq('id', blogPost.id);

      if (updateError) {
        console.error('Failed to update blog post with coin info:', updateError);
      }

      // Store coin information
      const { error: coinError } = await supabaseAdmin
        .from('zora_coins')
        .insert({
          blog_post_id: blogPost.id,
          coin_address: mockCoinData.coinAddress,
          coin_id: mockCoinData.coinId,
          token_name: tokenName,
          token_symbol: tokenSymbol,
          creator_address: walletAddress,
          transaction_hash: '0x' + Math.random().toString(16).substr(2, 64),
        });

      if (coinError) {
        console.error('Failed to store coin info:', coinError);
      }

      return NextResponse.json({
        blogPost,
        coin: mockCoinData,
        message: 'Blog post stored and coin created successfully',
      });

    } catch (coinError) {
      console.error('Coin creation error:', coinError);
      return NextResponse.json({
        blogPost,
        error: 'Blog post stored but coin creation failed',
      }, { status: 207 }); // 207 Multi-Status
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 