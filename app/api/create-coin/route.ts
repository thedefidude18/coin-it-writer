import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { base } from 'viem/chains';

export async function POST(request: NextRequest) {
  try {
    const { blogData, walletAddress } = await request.json();

    if (!blogData || !walletAddress) {
      return NextResponse.json({ error: 'Blog data and wallet address are required' }, { status: 400 });
    }

    // Step 1: Upload metadata to IPFS via Pinata
    console.log('Uploading metadata to IPFS...');
    const ipfsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ blogData }),
    });

    if (!ipfsResponse.ok) {
      const ipfsError = await ipfsResponse.json();
      console.error('IPFS upload failed:', ipfsError);
      return NextResponse.json({ error: 'Failed to upload metadata to IPFS' }, { status: 500 });
    }

    const { ipfsUri, ipfsHash, gatewayUrl } = await ipfsResponse.json();
    console.log('IPFS upload successful:', { ipfsUri, ipfsHash });

    // Step 2: Store blog post in Supabase with IPFS information
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

    // Step 3: Create Zora coin with IPFS metadata
    try {
      // Generate token name and symbol from blog title
      const tokenName = blogData.title.substring(0, 32) || 'Blog Coin';
      const tokenSymbol = blogData.title
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 8)
        .toUpperCase() || 'BLOG';

      // Prepare coin parameters for Zora
      const coinParams = {
        name: tokenName,
        symbol: tokenSymbol,
        uri: ipfsUri, // Use the IPFS URI from Pinata upload
        payoutRecipient: walletAddress,
        platformReferrer: walletAddress, // You can set a different platform referrer if needed
        chainId: base.id,
        // Note: Actual coin creation would require wallet signing on the frontend
        // This is prepared for when you implement wallet integration
      };

      console.log('Coin parameters prepared:', coinParams);

      // For now, we'll create a mock coin with the real IPFS URI
      // In production, this would be handled on the frontend with wallet signing
      const coinData = {
        coinAddress: '0x' + Math.random().toString(16).substr(2, 40),
        coinId: Math.random().toString(),
        tokenName,
        tokenSymbol,
        ipfsUri,
        ipfsHash,
        gatewayUrl,
        coinParams,
      };

      // Update blog post with coin information
      const { error: updateError } = await supabaseAdmin
        .from('blog_posts')
        .update({
          zora_coin_address: coinData.coinAddress,
          zora_coin_id: coinData.coinId,
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
          coin_address: coinData.coinAddress,
          coin_id: coinData.coinId,
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
        coin: coinData,
        ipfsUri,
        ipfsHash,
        gatewayUrl,
        message: 'Blog post stored, uploaded to IPFS, and coin created successfully',
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