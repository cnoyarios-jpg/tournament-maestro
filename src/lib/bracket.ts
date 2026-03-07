import { TournamentPair } from '@/types';

export interface BracketMatch {
  round: number;
  position: number;
  pair1Id?: string;
  pair2Id?: string;
  winnerId?: string;
  isBye: boolean;
}

/**
 * Generates a single-elimination bracket with automatic byes for non-power-of-2 numbers.
 * Returns an array of rounds, each containing an array of matches.
 */
export function generateBracket(pairs: TournamentPair[]): BracketMatch[][] {
  const n = pairs.length;
  if (n < 2) return [];

  // Find next power of 2
  const bracketSize = nextPowerOf2(n);
  const totalRounds = Math.log2(bracketSize);
  const numByes = bracketSize - n;

  // Seed pairs by combined ELO (higher = better seed)
  const seeded = [...pairs].sort((a, b) => {
    const eloA = a.goalkeeper.elo + a.forward.elo;
    const eloB = b.goalkeeper.elo + b.forward.elo;
    return eloB - eloA;
  });

  // Create first round slots
  const slots: (string | null)[] = new Array(bracketSize).fill(null);

  // Place seeded pairs using standard bracket seeding
  const seedOrder = generateSeedOrder(bracketSize);
  for (let i = 0; i < seeded.length; i++) {
    slots[seedOrder[i]] = seeded[i].id;
  }

  // Generate rounds
  const rounds: BracketMatch[][] = [];

  let currentSlots = slots;
  for (let round = 0; round < totalRounds; round++) {
    const roundMatches: BracketMatch[] = [];
    const nextSlots: (string | null)[] = [];

    for (let i = 0; i < currentSlots.length; i += 2) {
      const pair1Id = currentSlots[i] || undefined;
      const pair2Id = currentSlots[i + 1] || undefined;
      // FIX: Only mark as bye in first round when one slot is empty from seeding.
      // For subsequent rounds, matches are "pending" (not byes).
      const isBye = round === 0 && (!pair1Id || !pair2Id);
      const winnerId = isBye ? (pair1Id || pair2Id) : undefined;

      roundMatches.push({
        round,
        position: i / 2,
        pair1Id,
        pair2Id,
        winnerId,
        isBye,
      });

      nextSlots.push(winnerId || null);
    }

    rounds.push(roundMatches);
    currentSlots = nextSlots;
  }

  return rounds;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Standard tournament seeding order.
 */
function generateSeedOrder(size: number): number[] {
  if (size === 1) return [0];
  const half = generateSeedOrder(size / 2);
  const result: number[] = [];
  for (const pos of half) {
    result.push(pos * 2);
    result.push(pos * 2 + 1);
  }
  return result;
}

/**
 * ELO calculation for a 2v2 match.
 */
export function calculateEloChange(
  winnerElo: number,
  loserElo: number,
  kFactor: number = 32,
  isTournament: boolean = true
): { winnerChange: number; loserChange: number } {
  const k = isTournament ? kFactor : kFactor * 0.5;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const change = Math.round(k * (1 - expectedWinner));
  return {
    winnerChange: change,
    loserChange: -change,
  };
}

/**
 * ELO for 2v2: average the pair's ELOs for comparison, then
 * apply changes to each individual based on their position ELO.
 */
export function calculate2v2EloChanges(
  winnerGoalkeeperElo: number,
  winnerForwardElo: number,
  loserGoalkeeperElo: number,
  loserForwardElo: number,
  kFactor: number = 32,
  isTournament: boolean = true
) {
  const winnerAvg = (winnerGoalkeeperElo + winnerForwardElo) / 2;
  const loserAvg = (loserGoalkeeperElo + loserForwardElo) / 2;

  const { winnerChange, loserChange } = calculateEloChange(winnerAvg, loserAvg, kFactor, isTournament);

  return {
    winnerGoalkeeperChange: winnerChange,
    winnerForwardChange: winnerChange,
    loserGoalkeeperChange: loserChange,
    loserForwardChange: loserChange,
  };
}
