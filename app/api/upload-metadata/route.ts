import { NextRequest, NextResponse } from 'next/server';
import { pinata } from '@/lib/pinata';
import { Metadata } from 'next';

export async function POST(request: NextRequest) {
  try {
    const { blogData } = await request.json();

    if (!blogData) {
      return NextResponse.json({ error: 'Blog data is required' }, { status: 400 });
    }

    // Prepare metadata for IPFS upload
    const metadata = {
      name: blogData.title || 'Blog Post Coin',
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
        {
          trait_type: 'Original Link',
          value: blogData.url,
        },
        {
          trait_type: 'Publish Date',
          value: blogData.publishDate || 'Unknown',
        },
      ],
      // Include the blog content (limited to 100 words)
      content: {
        uri: blogData.url,
        mime: 'text/html',
      }
    };

    console.log('Uploading metadata to IPFS:', metadata);

    // Create a JSON file from the metadata
    const jsonString = JSON.stringify(metadata, null, 2);
    const file = new File([jsonString], `blog-metadata-${Date.now()}.json`, {
      type: 'application/json',
    });

    // Upload to IPFS via Pinata
    const { cid } = await pinata.upload.public.file(file);
    const gatewayUrl = await pinata.gateways.public.convert(cid);

    console.log('IPFS upload successful:', { cid, gatewayUrl });

    // Return the IPFS hash and gateway URL
    const ipfsHash = cid;
    const ipfsUri = `ipfs://${cid}`;

    return NextResponse.json({
      ipfsHash,
      ipfsUri,
      gatewayUrl,
      metadata,
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    
    // Handle specific Pinata errors
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: `Failed to upload to IPFS: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to upload metadata to IPFS' 
    }, { status: 500 });
  }
} 