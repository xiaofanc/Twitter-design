'use client';

import useSWR from 'swr';
import { API_URL } from '@/lib/api';

interface ArchData {
  stack: { label: string; category: string }[];
  fanout: { title: string; steps: string[]; tradeoffs: string[] };
  caching: { title: string; tiers: { name: string; stores: string; key: string; ttl: string; invalidation: string }[]; devProdNote: string };
  pagination: { title: string; strategy: string; params: Record<string, string>; response: string; whyNotOffset: string };
  n1fixes: { title: string; before: string; after: string; notes: string[] };
  auth: { title: string; accessToken: string; refreshToken: string; refreshFlow: string; blacklist: string };
}

interface SystemStats {
  redis_hit_rate: number | null;
  redis_total_keys: number;
  redis_db0_keys: number;
  cache_backend: string;
}

const staticFetcher = (url: string) => fetch(url).then((r) => r.json());
const apiFetcher = (url: string) => fetch(url).then((r) => r.ok ? r.json() : null).catch(() => null);

export default function ArchitecturePage() {
  const { data: arch } = useSWR<ArchData>('/architecture-data.json', staticFetcher);
  const { data: stats } = useSWR<SystemStats>(`${API_URL}/api/system-stats/`, apiFetcher, {
    refreshInterval: 30000,
  });

  if (!arch) return <div className="p-8 text-zinc-400 text-sm">Loading…</div>;

  const backendStack = arch.stack.filter((s) => s.category === 'backend');
  const frontendStack = arch.stack.filter((s) => s.category === 'frontend');

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-zinc-100 px-4 py-3 z-10">
        <h1 className="font-bold text-xl">System Design</h1>
        <p className="text-zinc-500 text-sm">Live architecture walkthrough — open this in an interview</p>
      </div>

      <div className="px-4 py-6 space-y-10">

        {/* Live stats */}
        <section>
          <h2 className="font-bold text-lg mb-4">Live Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              label="Redis cache hit rate"
              value={stats?.redis_hit_rate != null ? `${(stats.redis_hit_rate * 100).toFixed(1)}%` : '—'}
              note={stats ? 'live' : 'add /api/system-stats/'}
            />
            <StatCard
              label="Redis total keys"
              value={stats?.redis_total_keys != null ? stats.redis_total_keys.toLocaleString() : '—'}
              note="db0"
            />
            <StatCard
              label="Cache backend"
              value={stats?.cache_backend ?? arch.caching.tiers[0].name.split(' ')[0]}
              note="prod: Redis db2"
            />
            <StatCard label="Pagination" value="Cursor" note="no page drift" />
            <StatCard label="N+1 queries" value="~0" note="select_related + prefetch" />
            <StatCard label="Feed read" value="O(1)" note="Redis list" />
          </div>
        </section>

        {/* Tech stack */}
        <section>
          <h2 className="font-bold text-lg mb-3">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {backendStack.map((s) => (
              <Pill key={s.label} label={s.label} color="zinc" />
            ))}
            {frontendStack.map((s) => (
              <Pill key={s.label} label={s.label} color="blue" />
            ))}
          </div>
          <p className="text-zinc-400 text-xs mt-2">Gray = backend · Blue = frontend</p>
        </section>

        {/* Fanout diagram */}
        <section>
          <h2 className="font-bold text-lg mb-1">{arch.fanout.title}</h2>
          <p className="text-zinc-500 text-sm mb-4">How a tweet reaches every follower&apos;s feed.</p>

          <div className="space-y-2">
            {arch.fanout.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < arch.fanout.steps.length - 1 && (
                    <div className="w-px flex-1 bg-zinc-200 mt-1" />
                  )}
                </div>
                <p className="text-sm pb-3 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-zinc-50 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Tradeoffs</p>
            {arch.fanout.tradeoffs.map((t, i) => (
              <p key={i} className="text-sm text-zinc-600">· {t}</p>
            ))}
          </div>
        </section>

        {/* Caching */}
        <section>
          <h2 className="font-bold text-lg mb-1">{arch.caching.title}</h2>

          <div className="space-y-3">
            {arch.caching.tiers.map((tier, i) => (
              <div key={i} className="border border-zinc-100 rounded-xl p-4">
                <p className="font-semibold text-sm mb-2">{tier.name}</p>
                <div className="space-y-1 text-sm text-zinc-600">
                  <p><span className="text-zinc-400">Stores:</span> {tier.stores}</p>
                  <p><span className="text-zinc-400">Key:</span> <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">{tier.key}</code></p>
                  <p><span className="text-zinc-400">TTL:</span> {tier.ttl}</p>
                  <p><span className="text-zinc-400">Invalidation:</span> {tier.invalidation}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-sm mt-3 bg-amber-50 rounded-lg px-3 py-2">
            ⚠ {arch.caching.devProdNote}
          </p>
        </section>

        {/* Pagination */}
        <section>
          <h2 className="font-bold text-lg mb-1">{arch.pagination.title}</h2>
          <p className="text-sm text-zinc-600 mb-3">{arch.pagination.strategy}</p>
          <div className="border border-zinc-100 rounded-xl p-4 space-y-2 text-sm">
            {Object.entries(arch.pagination.params).map(([param, desc]) => (
              <div key={param} className="flex gap-2">
                <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded self-start flex-shrink-0">{param}</code>
                <span className="text-zinc-600">{desc}</span>
              </div>
            ))}
            <div className="pt-1 border-t border-zinc-100">
              <p className="text-zinc-400 text-xs mb-0.5">Response shape</p>
              <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{arch.pagination.response}</code>
            </div>
          </div>
          <p className="text-zinc-500 text-sm mt-2">· {arch.pagination.whyNotOffset}</p>
        </section>

        {/* N+1 */}
        <section>
          <h2 className="font-bold text-lg mb-1">{arch.n1fixes.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Before</p>
              <p className="text-sm text-red-700">{arch.n1fixes.before}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">After</p>
              <p className="text-sm text-green-700">{arch.n1fixes.after}</p>
            </div>
          </div>
          <div className="space-y-1">
            {arch.n1fixes.notes.map((n, i) => (
              <p key={i} className="text-sm text-zinc-600">· {n}</p>
            ))}
          </div>
        </section>

        {/* Auth */}
        <section>
          <h2 className="font-bold text-lg mb-3">{arch.auth.title}</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Access token', value: arch.auth.accessToken },
              { label: 'Refresh token', value: arch.auth.refreshToken },
              { label: 'Refresh flow', value: arch.auth.refreshFlow },
              { label: 'Logout', value: arch.auth.blacklist },
            ].map(({ label, value }) => (
              <div key={label} className="border border-zinc-100 rounded-xl p-4">
                <p className="font-semibold text-xs text-zinc-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-zinc-700">{value}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-zinc-100 rounded-xl p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {note && <p className="text-zinc-400 text-xs mt-0.5">{note}</p>}
    </div>
  );
}

function Pill({ label, color }: { label: string; color: 'zinc' | 'blue' }) {
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
      color === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-700'
    }`}>
      {label}
    </span>
  );
}
