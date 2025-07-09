import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000, // 30 second timeout
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract metadata and content
    const title = $('title').text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  $('h1').first().text().trim() || 
                  'Untitled';

    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       '';

    const author = $('meta[name="author"]').attr('content') || 
                   $('meta[property="article:author"]').attr('content') || 
                   $('[rel="author"]').text().trim() || 
                   '';

    const publishDate = $('meta[property="article:published_time"]').attr('content') || 
                       $('meta[name="publishdate"]').attr('content') || 
                       $('time').attr('datetime') || 
                       '';

    const image = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || 
                  $('img').first().attr('src') || 
                  '';

    // Extract main content
    let content = '';
    
    // Try different content selectors for different blog platforms
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.content',
      '.article-body',
      '.story-body',
      '.post-body',
      'main',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Remove unwanted elements
        element.find('script, style, nav, footer, header, .sidebar, .comments, .social-share, .advertisement, .ad').remove();
        content = element.text().trim();
        if (content.length > 100) { // Only use if substantial content
          break;
        }
      }
    }

    // Fallback to body text if no content found
    if (!content || content.length < 100) {
      $('script, style, nav, footer, header, .sidebar, .comments, .social-share, .advertisement, .ad').remove();
      content = $('body').text().trim();
    }

    // Clean up content
    content = content.replace(/\s+/g, ' ').trim();

    // Extract tags/keywords
    const tags = $('meta[name="keywords"]').attr('content')?.split(',').map(tag => tag.trim()) || [];

    const scrapedData = {
      url,
      title,
      description,
      author,
      publishDate,
      image,
      content: content.substring(0, 10000), // Limit content to 10k characters
      tags,
      scrapedAt: new Date().toISOString(),
    };

    return NextResponse.json(scrapedData);

  } catch (error) {
    console.error('Scraping error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
      }
      if (error.response?.status === 404) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      if (error.response?.status === 403) {
        return NextResponse.json({ error: 'Access forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to scrape content' }, { status: 500 });
  }
} 