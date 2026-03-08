import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import { MOCK_TOURNAMENTS, MOCK_PAIRS, MOCK_RANKINGS } from '@/data/mock';
import { ArrowLeft, Calendar, MapPin, Users, Shield, Target, Trophy, Check, Plus, X } from 'lucide-react';
import { generateBracket, type BracketMatch, calculate2v2EloChanges } from '@/lib/bracket';
import { TournamentPair, RatingChange } from '@/types';
import { toast } from 'sonner';

const formatLabels: Record<string, string> = {
  eliminacion_simple: 'Eliminación simple',
  eliminacion_doble: 'Eliminación doble',
  round_robin: 'Round Robin',
  grupos_cuadro: 'Grupos + Cuadro',
  suizo: 'Sistema suizo',
  americano: 'Americano',
  rey_mesa: 'Rey de la mesa',
};

const statusLabels: Record<string, string> = {
  borrador: 'Borrador',
  abierto: 'Inscripción abierta',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const statusColors: Record<string, string> = {
  borrador: 'bg-muted text-muted-foreground',
  abierto: 'bg-success text-success-foreground',
  en_curso: 'bg-secondary text-secondary-foreground',
  finalizado: 'bg-muted text-muted-foreground',
  cancelado: 'bg-destructive text-destructive-foreground',
};

// Store ELO changes for display
interface EloChangeDisplay {
  matchKey: string;
  changes: {
    userId: string;
    displayName: string;
    position: string;
    previousElo: number;
    newElo: number;
    change: number;
  }[];
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const tournament = MOCK_TOURNAMENTS.find(t => t.id === id);
  const pairs = MOCK_PAIRS.filter(p => p.tournamentId === id);
  const [bracket, setBracket] = useState<BracketMatch[][]>(() =>
    pairs.length > 0 ? generateBracket(pairs) : []
  );
  const [eloChanges, setEloChanges] = useState<EloChangeDisplay[]>([]);
  const [, forceUpdate] = useState(0);

  // === FASE 1: Inscripción de parejas ===
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    goalkeeperName: '',
    goalkeeperElo: '1500',
    forwardName: '',
    forwardElo: '1500',
  });

  const handleEnrollPair = () => {
    if (!enrollForm.goalkeeperName.trim() || !enrollForm.forwardName.trim()) {
      toast.error('Ambos jugadores son obligatorios');
      return;
    }
    if (!tournament) return;

    const currentPairs = MOCK_PAIRS.filter(p => p.tournamentId === id);
    if (currentPairs.length >= tournament.maxPairs) {
      toast.error('El torneo está lleno');
      return;
    }

    const newPair: TournamentPair = {
      id: `p_${Date.now()}`,
      tournamentId: tournament.id,
      goalkeeper: {
        userId: `u_gk_${Date.now()}`,
        displayName: enrollForm.goalkeeperName,
        elo: parseInt(enrollForm.goalkeeperElo) || 1500,
      },
      forward: {
        userId: `u_fw_${Date.now()}`,
        displayName: enrollForm.forwardName,
        elo: parseInt(enrollForm.forwardElo) || 1500,
      },
      seed: currentPairs.length + 1,
      status: 'inscrita',
    };

    MOCK_PAIRS.push(newPair);

    // Add to rankings if not exists
    const addToRanking = (userId: string, displayName: string, elo: number) => {
      if (!MOCK_RANKINGS.find(r => r.userId === userId)) {
        MOCK_RANKINGS.push({
          userId,
          displayName,
          city: tournament.city,
          general: elo,
          asGoalkeeper: elo,
          asForward: elo,
          byTable: {},
          byStyle: { parado: elo, movimiento: elo },
          wins: 0,
          losses: 0,
          tournamentsPlayed: 0,
          tournamentsWon: 0,
          mvpCount: 0,
          currentStreak: 0,
          bestStreak: 0,
        });
      }
    };
    addToRanking(newPair.goalkeeper.userId, newPair.goalkeeper.displayName, newPair.goalkeeper.elo);
    addToRanking(newPair.forward.userId, newPair.forward.displayName, newPair.forward.elo);

    // Regenerate bracket with updated pairs
    const updatedPairs = MOCK_PAIRS.filter(p => p.tournamentId === id);
    if (updatedPairs.length >= 2) {
      setBracket(generateBracket(updatedPairs));
    }

    setEnrollForm({ goalkeeperName: '', goalkeeperElo: '1500', forwardName: '', forwardElo: '1500' });
    setShowEnrollDialog(false);
    toast.success('Pareja inscrita correctamente');
    forceUpdate(n => n + 1);
  };

  const handleSelectWinner = useCallback((roundIdx: number, matchIdx: number, winnerId: string) => {
    setBracket(prev => {
      const newBracket = prev.map(r => r.map(m => ({ ...m })));
      const match = newBracket[roundIdx][matchIdx];

      if (match.winnerId) return prev; // Already decided

      match.winnerId = winnerId;

      // Calculate ELO changes
      const allPairs = MOCK_PAIRS.filter(p => p.tournamentId === id);
      const winnerPair = allPairs.find(p => p.id === winnerId);
      const loserId = match.pair1Id === winnerId ? match.pair2Id : match.pair1Id;
      const loserPair = allPairs.find(p => p.id === loserId);

      if (winnerPair && loserPair) {
        const eloResult = calculate2v2EloChanges(
          winnerPair.goalkeeper.elo,
          winnerPair.forward.elo,
          loserPair.goalkeeper.elo,
          loserPair.forward.elo,
        );

        const changes: EloChangeDisplay['changes'] = [];

        // FASE 3: Update rankings in mock data (persists globally)
        const updateRanking = (userId: string, displayName: string, change: number, position: string) => {
          const ranking = MOCK_RANKINGS.find(r => r.userId === userId);
          if (ranking) {
            const prevElo = ranking.general;
            ranking.general += change;
            if (position === 'portero') ranking.asGoalkeeper += change;
            else ranking.asForward += change;
            changes.push({ userId, displayName, position, previousElo: prevElo, newElo: ranking.general, change });
          }
        };

        // Winner pair
        updateRanking(winnerPair.goalkeeper.userId, winnerPair.goalkeeper.displayName, eloResult.winnerGoalkeeperChange, 'portero');
        updateRanking(winnerPair.forward.userId, winnerPair.forward.displayName, eloResult.winnerForwardChange, 'delantero');
        // Loser pair
        updateRanking(loserPair.goalkeeper.userId, loserPair.goalkeeper.displayName, eloResult.loserGoalkeeperChange, 'portero');
        updateRanking(loserPair.forward.userId, loserPair.forward.displayName, eloResult.loserForwardChange, 'delantero');

        // Update wins/losses
        const wGk = MOCK_RANKINGS.find(r => r.userId === winnerPair.goalkeeper.userId);
        const wFw = MOCK_RANKINGS.find(r => r.userId === winnerPair.forward.userId);
        const lGk = MOCK_RANKINGS.find(r => r.userId === loserPair.goalkeeper.userId);
        const lFw = MOCK_RANKINGS.find(r => r.userId === loserPair.forward.userId);
        if (wGk) wGk.wins++;
        if (wFw) wFw.wins++;
        if (lGk) lGk.losses++;
        if (lFw) lFw.losses++;

        setEloChanges(prev => [...prev, { matchKey: `${roundIdx}-${matchIdx}`, changes }]);
        toast.success('Ganador registrado. ELO actualizado.');
      }

      // FASE 2: Advance winner to next round
      if (roundIdx + 1 < newBracket.length) {
        const nextMatchIdx = Math.floor(matchIdx / 2);
        const nextMatch = newBracket[roundIdx + 1][nextMatchIdx];
        if (matchIdx % 2 === 0) {
          nextMatch.pair1Id = winnerId;
        } else {
          nextMatch.pair2Id = winnerId;
        }
        // Check if the other slot in the next match also has a winner advancing (auto-bye scenario)
        // Don't auto-advance - let the user pick
      }

      return newBracket;
    });
    forceUpdate(n => n + 1);
  }, [id]);

  if (!tournament) {
    return (
      <PageShell title="Torneo no encontrado">
        <p className="text-center text-muted-foreground mt-8">Este torneo no existe.</p>
        <Link to="/torneos" className="mt-4 block text-center text-sm text-primary font-medium">Volver a torneos</Link>
      </PageShell>
    );
  }

  const formattedDate = new Date(tournament.date).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/torneos" className="rounded-lg bg-muted p-2">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold truncate">{tournament.name}</h1>
          <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusColors[tournament.status]}`}>
            {statusLabels[tournament.status]}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{tournament.tableBrand}</span>
        <span className="rounded-md bg-accent/30 px-2 py-0.5 text-xs font-semibold text-accent-foreground capitalize">{tournament.playStyle}</span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{formatLabels[tournament.format]}</span>
      </div>

      {/* Info */}
      <div className="rounded-xl bg-card p-4 shadow-card mb-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="capitalize">{formattedDate} · {tournament.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            {tournament.venueId ? (
              <Link to={`/locales/${tournament.venueId}`} className="text-primary font-medium hover:underline">
                {tournament.venueName}
              </Link>
            ) : (
              <span>{tournament.venueName}</span>
            )}
            <span>· {tournament.city}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            <span>{pairs.length}/{tournament.maxPairs} parejas</span>
          </div>
          {tournament.entryFee && (
            <p>💰 Inscripción: {tournament.entryFee}€</p>
          )}
          {tournament.prizes && (
            <p>🏆 {tournament.prizes}</p>
          )}
        </div>
        {tournament.description && (
          <p className="mt-3 text-sm text-foreground border-t border-border pt-3">{tournament.description}</p>
        )}
      </div>

      {/* Categorías */}
      {tournament.hasCategories && tournament.categories.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-card mb-4">
          <h3 className="font-display text-sm font-semibold mb-3">Categorías</h3>
          <div className="flex flex-wrap gap-2">
            {tournament.categories.map(cat => (
              <div key={cat.id} className="rounded-lg bg-muted px-3 py-2 text-center">
                <p className="text-sm font-semibold">{cat.name}</p>
                {cat.maxPairs && <p className="text-[10px] text-muted-foreground">Máx {cat.maxPairs} parejas</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parejas inscritas */}
      <div className="rounded-xl bg-card p-4 shadow-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-sm font-semibold">Parejas inscritas ({pairs.length})</h3>
          {pairs.length < tournament.maxPairs && (
            <button
              onClick={() => setShowEnrollDialog(true)}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition active:scale-95"
            >
              <Plus className="h-3 w-3" /> Añadir
            </button>
          )}
        </div>
        {pairs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {pairs.map((pair, i) => (
              <div key={pair.id} className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{pair.goalkeeper.displayName}</span>
                    <span className="text-[10px] text-muted-foreground">{pair.goalkeeper.elo}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Target className="h-3 w-3 text-secondary shrink-0" />
                    <span className="text-sm font-medium truncate">{pair.forward.displayName}</span>
                    <span className="text-[10px] text-muted-foreground">{pair.forward.elo}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{pair.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No hay parejas inscritas aún. ¡Añade la primera!</p>
        )}
      </div>

      {/* Bracket / Matches */}
      {bracket.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-card mb-4">
          <h3 className="font-display text-sm font-semibold mb-3">
            <Trophy className="h-4 w-4 inline mr-1" />
            Cuadro — {bracket.length} rondas
          </h3>
          <div className="overflow-x-auto">
            <BracketView
              rounds={bracket}
              pairs={MOCK_PAIRS.filter(p => p.tournamentId === id)}
              onSelectWinner={handleSelectWinner}
              eloChanges={eloChanges}
            />
          </div>
        </div>
      )}

      {/* ELO Changes log */}
      {eloChanges.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-card mb-4">
          <h3 className="font-display text-sm font-semibold mb-3">📊 Cambios de ELO</h3>
          <div className="flex flex-col gap-3">
            {eloChanges.map((ec, i) => (
              <div key={i} className="rounded-lg bg-muted p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Partido {ec.matchKey}</p>
                {ec.changes.map((c, j) => (
                  <div key={j} className="flex items-center justify-between text-xs py-0.5">
                    <span className="font-medium">{c.displayName} <span className="text-muted-foreground">({c.position})</span></span>
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">{c.previousElo}</span>
                      <span className={c.change >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                        {c.change >= 0 ? `+${c.change}` : c.change}
                      </span>
                      <span className="font-bold">{c.newElo}</span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA - Inscribir pareja (for open tournaments) */}
      {(tournament.status === 'abierto' || tournament.status === 'en_curso') && pairs.length < tournament.maxPairs && (
        <button
          onClick={() => setShowEnrollDialog(true)}
          className="w-full rounded-xl bg-secondary py-3.5 text-center font-display font-semibold text-secondary-foreground transition active:scale-[0.98]"
        >
          Inscribir pareja
        </button>
      )}

      {/* FASE 1: Enrollment dialog */}
      {showEnrollDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Inscribir pareja</h3>
              <button onClick={() => setShowEnrollDialog(false)}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Goalkeeper */}
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Portero</span>
                </div>
                <input
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nombre del jugador"
                  value={enrollForm.goalkeeperName}
                  onChange={e => setEnrollForm(f => ({ ...f, goalkeeperName: e.target.value }))}
                />
                <input
                  type="number"
                  className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ELO (default 1500)"
                  value={enrollForm.goalkeeperElo}
                  onChange={e => setEnrollForm(f => ({ ...f, goalkeeperElo: e.target.value }))}
                />
              </div>

              {/* Forward */}
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Delantero</span>
                </div>
                <input
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nombre del jugador"
                  value={enrollForm.forwardName}
                  onChange={e => setEnrollForm(f => ({ ...f, forwardName: e.target.value }))}
                />
                <input
                  type="number"
                  className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="ELO (default 1500)"
                  value={enrollForm.forwardElo}
                  onChange={e => setEnrollForm(f => ({ ...f, forwardElo: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowEnrollDialog(false)}
                className="flex-1 rounded-lg bg-muted py-2.5 text-sm font-medium text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnrollPair}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Inscribir
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function BracketView({
  rounds,
  pairs,
  onSelectWinner,
  eloChanges,
}: {
  rounds: BracketMatch[][];
  pairs: TournamentPair[];
  onSelectWinner: (roundIdx: number, matchIdx: number, winnerId: string) => void;
  eloChanges: EloChangeDisplay[];
}) {
  const getPairName = (pairId?: string) => {
    if (!pairId) return '—';
    const pair = pairs.find(p => p.id === pairId);
    if (!pair) return '—';
    return `${pair.goalkeeper.displayName.split(' ')[0]} / ${pair.forward.displayName.split(' ')[0]}`;
  };

  return (
    <div className="flex gap-4 min-w-max">
      {rounds.map((round, ri) => (
        <div key={ri} className="flex flex-col justify-around gap-2" style={{ minWidth: 180 }}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            {ri === rounds.length - 1 ? 'Final' : `Ronda ${ri + 1}`}
          </p>
          {round.map((match, mi) => {
            const canSelect = !match.winnerId && !match.isBye && match.pair1Id && match.pair2Id;

            return (
              <div key={match.position} className={`rounded-lg border p-2 text-xs ${match.isBye ? 'border-dashed border-muted bg-muted/30' : 'border-border bg-card'}`}>
                <div
                  className={`px-2 py-1.5 rounded flex items-center justify-between gap-1 ${
                    match.winnerId === match.pair1Id && match.pair1Id ? 'bg-green-50 font-semibold text-green-800' : ''
                  } ${canSelect ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                  onClick={() => canSelect && match.pair1Id && onSelectWinner(ri, mi, match.pair1Id)}
                >
                  <span>{getPairName(match.pair1Id)}</span>
                  {match.winnerId === match.pair1Id && match.pair1Id && <Check className="h-3 w-3 text-green-600" />}
                  {canSelect && !match.winnerId && <span className="text-[9px] text-primary">Elegir</span>}
                </div>
                <div className="h-px bg-border my-0.5" />
                <div
                  className={`px-2 py-1.5 rounded flex items-center justify-between gap-1 ${
                    match.winnerId === match.pair2Id && match.pair2Id ? 'bg-green-50 font-semibold text-green-800' : ''
                  } ${canSelect ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                  onClick={() => canSelect && match.pair2Id && onSelectWinner(ri, mi, match.pair2Id)}
                >
                  <span>{getPairName(match.pair2Id)}</span>
                  {match.winnerId === match.pair2Id && match.pair2Id && <Check className="h-3 w-3 text-green-600" />}
                  {canSelect && !match.winnerId && <span className="text-[9px] text-primary">Elegir</span>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
