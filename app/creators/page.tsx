import { getAllCreatorsWithStats } from '@/lib/supabase-queries';
import Image from 'next/image';

export default async function CreatorsPage() {
  const creators = await getAllCreatorsWithStats();
  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Creators</h1>
      <p className="mb-6 text-gray-700">Discover top creators who are transforming blogs into coins. Explore their profiles, see their coins, and get inspired by their content!</p>
  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {creators.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No creators found.
          </div>
        )}
        {creators.map((creator: any) => (
          <div key={creator.wallet} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
            {/* Avatar (if available) */}
            {creator.user?.avatar_url ? (
              <Image src={creator.user.avatar_url} alt="avatar" width={48} height={48} className="rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xl">
                {creator.user?.email ? creator.user.email[0].toUpperCase() : creator.wallet.slice(2, 4).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="font-semibold text-lg">
                {creator.user?.email || creator.wallet}
              </div>
              <div className="text-gray-500 text-sm">
                {creator.wallet.slice(0, 6)}...{creator.wallet.slice(-4)}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Coins created: <span className="font-medium text-black">{creator.coinsCreated}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
