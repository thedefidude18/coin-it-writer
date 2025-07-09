# CoinIt Writer

A Next.js application that scrapes blog content and creates Zora coins from your favorite articles. Transform any blog post into a collectible digital asset on the Zora network.

## Features

- **Web Scraping**: Extract content from any blog URL (Medium, personal blogs, etc.)
- **Content Analysis**: Automatically parse title, description, author, publish date, and main content
- **Zora Integration**: Create coins on the Zora network using the blog content
- **Supabase Storage**: Store blog posts and coin data in a structured database
- **Modern UI**: Clean, responsive interface built with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **Blockchain**: Zora Protocol SDK, Viem
- **Web Scraping**: Cheerio, Axios

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account
- A wallet address for Zora coin creation

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coin-it-writer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with the following variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Zora Configuration  
NEXT_PUBLIC_ZORA_API_KEY=your_zora_api_key
NEXT_PUBLIC_ZORA_RPC_URL=your_rpc_url

# Web3 Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
```

4. Set up Supabase database:
Create the following tables in your Supabase database:

```sql
-- Blog posts table
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  publish_date TIMESTAMP,
  image TEXT,
  content TEXT,
  tags TEXT[],
  scraped_at TIMESTAMP NOT NULL,
  zora_coin_address TEXT,
  zora_coin_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Zora coins table
CREATE TABLE zora_coins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID REFERENCES blog_posts(id),
  coin_address TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Enter Blog URL**: Paste the URL of any blog post you want to scrape
2. **Add Wallet Address**: Enter your wallet address for coin creation
3. **Scrape Content**: Click "Scrape Blog Post" to extract content
4. **Review Content**: Check the extracted title, description, author, and content
5. **Create Coin**: Click "Create Zora Coin" to mint a coin representing the blog post
6. **View Results**: See your newly created coin with metadata and attributes

## API Endpoints

### POST /api/scrape
Scrapes content from a blog URL.

**Request:**
```json
{
  "url": "https://medium.com/@author/article-title"
}
```

**Response:**
```json
{
  "url": "https://medium.com/@author/article-title",
  "title": "Article Title",
  "description": "Article description",
  "author": "Author Name",
  "publishDate": "2024-01-15T10:00:00Z",
  "image": "https://example.com/image.jpg",
  "content": "Full article content...",
  "tags": ["tag1", "tag2"],
  "scrapedAt": "2024-01-15T10:00:00Z"
}
```

### POST /api/create-coin
Creates a Zora coin from scraped blog data.

**Request:**
```json
{
  "blogData": {
    "url": "https://medium.com/@author/article-title",
    "title": "Article Title",
    // ... other scraped data
  },
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "blogPost": {
    "id": "uuid",
    "url": "https://medium.com/@author/article-title",
    // ... stored blog data
  },
  "coin": {
    "coinAddress": "0x...",
    "coinId": "1",
    "tokenName": "Article Title",
    "tokenSymbol": "ARTICLE",
    "metadata": {
      "name": "Article Title",
      "description": "A coin representing the blog post: Article Title",
      "image": "https://example.com/image.jpg",
      "external_url": "https://medium.com/@author/article-title",
      "attributes": [
        {
          "trait_type": "Author",
          "value": "Author Name"
        },
        {
          "trait_type": "Source",
          "value": "medium.com"
        },
        {
          "trait_type": "Type",
          "value": "Blog Post"
        }
      ]
    }
  },
  "message": "Blog post stored and coin created successfully"
}
```

## Database Schema

The application uses two main tables:

### blog_posts
- `id`: UUID primary key
- `url`: Original blog post URL (unique)
- `title`: Blog post title
- `description`: Blog post description
- `author`: Author name
- `publish_date`: Original publication date
- `image`: Featured image URL
- `content`: Full blog post content
- `tags`: Array of tags/keywords
- `scraped_at`: When the content was scraped
- `zora_coin_address`: Address of created Zora coin
- `zora_coin_id`: ID of created Zora coin
- `created_at`: Database creation timestamp
- `updated_at`: Database update timestamp

### zora_coins
- `id`: UUID primary key
- `blog_post_id`: Foreign key to blog_posts
- `coin_address`: Zora coin contract address
- `coin_id`: Zora coin ID
- `token_name`: Token name
- `token_symbol`: Token symbol
- `creator_address`: Wallet address that created the coin
- `transaction_hash`: Transaction hash of coin creation
- `created_at`: Database creation timestamp
- `updated_at`: Database update timestamp

## Development

### Project Structure
```
coin-it-writer/
├── app/
│   ├── api/
│   │   ├── scrape/
│   │   │   └── route.ts      # Web scraping endpoint
│   │   └── create-coin/
│   │       └── route.ts      # Coin creation endpoint
│   ├── globals.css           # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main application page
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── utils.ts             # Utility functions
│   └── supabase.ts          # Supabase client setup
└── public/                  # Static assets
```

### Key Dependencies
- `@supabase/supabase-js`: Supabase client
- `@zoralabs/protocol-sdk`: Zora protocol integration
- `cheerio`: Server-side HTML parsing
- `axios`: HTTP requests
- `viem`: Ethereum interaction
- `react-hook-form`: Form handling
- `lucide-react`: Icons

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the Zora documentation at https://docs.zora.co/
- Review Supabase documentation at https://supabase.com/docs
