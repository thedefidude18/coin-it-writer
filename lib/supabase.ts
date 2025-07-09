import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!


export const supabase = createClient(supabaseUrl, supabaseAnonKey)


// Database types
export interface BlogPost {
  id: string
  url: string
  title: string
  description: string
  author: string
  publish_date: string
  image: string
  content: string
  tags: string[]
  scraped_at: string
  zora_coin_address?: string
  zora_coin_id?: string
  created_at: string
  updated_at: string
}

export interface ZoraCoin {
  id: string
  blog_post_id: string
  coin_address: string
  coin_id: string
  token_name: string
  token_symbol: string
  creator_address: string
  transaction_hash: string
  created_at: string
  updated_at: string
} 