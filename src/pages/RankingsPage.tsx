import { useState } from 'react';
import PageShell from '@/components/PageShell';
import { MOCK_RANKINGS } from '@/data/mock';
import { Trophy, Shield, Target } from 'lucide-react';

type RankingView = 'general' | 'porteros' | 'delanteros';

export default function RankingsPage() {
  const [view, setView] = useState<RankingView>('general');
  // Force re-read of MOCK_RANKINGS each render (it's mutated by tournament matches)
  const [, forceUpdate] = useState(0);

  const sorted = [...MOCK_RANKINGS].sort((a, b) => {
    if (view === 'porteros') return b.asGoalkeeper - a.asGoalkeeper;
    if (view === 'delanteros') return b.asForward - a.asForward;
    return b.general - a.general;
  });

  const getElo = (player: typeof sorted[0]) => {
    if (view === 'porteros') return player.asGoalkeeper;
    if (view === 'delanteros') return player.asForward;
    return player.general;
  };

  return (
    <PageShell title="Ranking">
      {/* Tabs */}
      <div className="mb-4 flex gap-1.5">
        {([
          { key: 'general' as const, label: 'General', icon: Trophy },
          { key: 'porteros' as const, label: 'Porteros', icon: Shield },
          { key: 'delanteros' as const, label: 'Delanteros', icon: Target },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
              view === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {sorted.map((player, i) => {
          const elo = getElo(player);
          const winrate = player.wins + player.losses > 0
            ? Math.round((player.wins / (player.wins + player.losses)) * 100)
            : 0;

          return (
            <div
              key={player.userId}
              className={`flex items-center gap-3 rounded-lg p-3 transition ${
                i < 3 ? 'bg-card shadow-card' : 'bg-card/50'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                i === 0 ? 'bg-accent text-accent-foreground' :
                i === 1 ? 'bg-muted text-muted-foreground' :
                i === 2 ? 'bg-secondary/20 text-secondary' :
                'text-muted-foreground'
              }`}>
                {i + 1}
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                {player.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold">{player.displayName}</p>
                <p className="text-xs text-muted-foreground">{player.city}</p>
              </div>

              <div className="text-right">
                <p className="font-display text-lg font-bold text-primary">{elo}</p>
                <p className="text-[10px] text-muted-foreground">
                  {player.wins}V {player.losses}D · {winrate}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
