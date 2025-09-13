import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
  throw new Error('Missing Telegram bot token or channel ID in environment variables');
}

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

export async function sendTelegramMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') {
  return axios.post(TELEGRAM_API_URL, {
    chat_id: TELEGRAM_CHANNEL_ID,
    text,
    parse_mode: parseMode,
    disable_web_page_preview: false,
  });
}

// Formatters for different event types
export function formatNewCoinMessage({
  name,
  symbol,
  marketCap,
  totalSupply,
  creator,
  createdAt,
  contract,
  description,
  zoraUrl,
  baseScanUrl,
  dexScreenerUrl,
}: {
  name: string;
  symbol: string;
  marketCap: string;
  totalSupply: string;
  creator: string;
  createdAt: string;
  contract: string;
  description?: string;
  zoraUrl: string;
  baseScanUrl: string;
  dexScreenerUrl: string;
}) {
  return [
    '🆕🪙 NEW CREATOR COIN CREATED',
    '',
    `📛 ${name} (${symbol})`,
    `💰 Market Cap: ${marketCap}`,
    `📊 Total Supply: ${totalSupply}`,
    `👤 ${creator}`,
    `📅 Created: ${createdAt}`,
    `📄 Contract: ${contract}`,
    description ? `📝 ${description}` : '',
    '',
    `🔗 View on [Zora](${zoraUrl}) | [BaseScan](${baseScanUrl}) | [DexScreener](${dexScreenerUrl})`,
  ].filter(Boolean).join('\n');
}
