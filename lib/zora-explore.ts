// Utility to fetch top coins from Zora SDK (client-only)
'use client';
import { getCoinsMostValuable, setApiKey } from '@zoralabs/coins-sdk';

setApiKey('zora_api_85edebb6a9cb7daa0d8124db4a60d946fb87127d5ab15897458a4c224de8c0bc');

export async function fetchTopCoins(count = 10) {
  const response = await getCoinsMostValuable({ count });
  // Flatten the response to an array of coin objects
  return response.data?.exploreList?.edges?.map((edge: any) => edge.node) || [];
}
