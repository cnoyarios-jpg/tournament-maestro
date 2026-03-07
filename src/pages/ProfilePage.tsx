import PageShell from '@/components/PageShell';
import { MOCK_USER, MOCK_RANKINGS, MOCK_TEAMS } from '@/data/mock';
import { Settings, Trophy, Shield, Target, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const user = MOCK_USER;
  const rating = MOCK_RANKINGS.find(r => r.userId === user.id);
  const teams = MOCK_TEAMS.filter(t => t.captainId === user.id);

  const winrate = rating && (rating.wins + rating.losses > 0)
    ? Math.round((rating.wins / (rating.wins + rating.losses)) * 100)
    : 0;

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
            {user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">{user.displayName}</h1>
            <p className="text-sm text-muted-foreground">{user.city}</p>
            <div className="mt-1 flex gap-1.5">
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
                {user.preferredPosition}
              </span>
              <span className="rounded-md bg-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground capitalize">
                {user.preferredStyle}
              </span>
            </div>
          </div>
        </div>
        <button className="rounded-lg bg-muted p-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* ELO cards */}
      {rating && (
        <>
          <div className="mt-6 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card p-3 text-center shadow-card">
              <Trophy className="mx-auto h-4 w-4 text-accent" />
              <p className="mt-1 font-display text-2xl font-bold text-primary">{rating.general}</p>
              <p className="text-[10px] text-muted-foreground">ELO General</p>
            </div>
            <div className="rounded-xl bg-card p-3 text-center shadow-card">
              <Shield className="mx-auto h-4 w-4 text-primary" />
              <p className="mt-1 font-display text-2xl font-bold">{rating.asGoalkeeper}</p>
              <p className="text-[10px] text-muted-foreground">Portero</p>
            </div>
            <div className="rounded-xl bg-card p-3 text-center shadow-card">
              <Target className="mx-auto h-4 w-4 text-secondary" />
              <p className="mt-1 font-display text-2xl font-bold">{rating.asForward}</p>
              <p className="text-[10px] text-muted-foreground">Delantero</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 rounded-xl bg-card p-4 shadow-card">
            <h3 className="font-display text-sm font-semibold mb-3">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Victorias</p>
                <p className="font-display text-lg font-bold text-green-600">{rating.wins}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Derrotas</p>
                <p className="font-display text-lg font-bold text-destructive">{rating.losses}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="font-display text-lg font-bold">{winrate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Torneos</p>
                <p className="font-display text-lg font-bold">{rating.tournamentsPlayed}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Torneos ganados</p>
                <p className="font-display text-lg font-bold text-accent">{rating.tournamentsWon}</p>
              </div>
            </div>
          </div>

          {/* ELO por mesa */}
          {rating.byTable && Object.keys(rating.byTable).length > 0 && (
            <div className="mt-4 rounded-xl bg-card p-4 shadow-card">
              <h3 className="font-display text-sm font-semibold mb-3">ELO por mesa</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(rating.byTable).map(([brand, elo]) => (
                  <div key={brand} className="rounded-lg bg-muted px-3 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground">{brand}</p>
                    <p className="font-display text-sm font-bold">{elo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ELO por estilo */}
          <div className="mt-4 rounded-xl bg-card p-4 shadow-card">
            <h3 className="font-display text-sm font-semibold mb-3">ELO por estilo</h3>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg bg-muted px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">Parado</p>
                <p className="font-display text-sm font-bold">{rating.byStyle.parado}</p>
              </div>
              <div className="flex-1 rounded-lg bg-muted px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">Movimiento</p>
                <p className="font-display text-sm font-bold">{rating.byStyle.movimiento}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Equipos */}
      {teams.length > 0 && (
        <div className="mt-4 rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-semibold">Mis equipos</h3>
            <Link to="/equipos" className="text-xs text-primary font-medium">Ver todos</Link>
          </div>
          {teams.map(team => (
            <div key={team.id} className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold truncate">{team.name}</p>
                <p className="text-xs text-muted-foreground">{team.city} · Capitán</p>
              </div>
              <p className="font-display text-sm font-bold text-primary">{team.elo}</p>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
