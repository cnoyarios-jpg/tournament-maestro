import { motion } from 'framer-motion';
import { MapPin, Trophy, BarChart3, Users, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_TOURNAMENTS, MOCK_VENUES, MOCK_TABLES } from '@/data/mock';
import TournamentCard from '@/components/TournamentCard';
import VenueCard from '@/components/VenueCard';

export default function HomePage() {
  const upcomingTournaments = MOCK_TOURNAMENTS.filter(t => t.status === 'abierto').slice(0, 2);
  const featuredVenues = MOCK_VENUES.filter(v => v.status === 'activo').slice(0, 3);

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="gradient-hero px-5 pb-8 pt-12 text-center"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary-foreground">
            Futbolín<span className="text-accent">ES</span>
          </h1>
          <p className="mt-3 text-base font-medium text-primary-foreground/90">
            Todo el futbolín español en una app
          </p>
          <p className="mt-1 text-sm text-primary-foreground/70">
            Mapa · Torneos · Ranking · Comunidad
          </p>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-6 grid grid-cols-4 gap-2"
        >
          {[
            { icon: MapPin, label: 'Mapa', path: '/mapa' },
            { icon: Trophy, label: 'Torneos', path: '/torneos' },
            { icon: BarChart3, label: 'Ranking', path: '/ranking' },
            { icon: Users, label: 'Equipos', path: '/equipos' },
          ].map(({ icon: Icon, label, path }) => (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-primary-foreground/10 px-2 py-3 text-primary-foreground backdrop-blur-sm transition hover:bg-primary-foreground/20 active:scale-95"
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </motion.div>
      </motion.section>

      {/* Stats bar */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mx-4 -mt-4 flex items-center justify-around rounded-xl bg-card p-3 shadow-elevated"
      >
        <div className="text-center">
          <p className="font-display text-xl font-bold text-foreground">{MOCK_VENUES.length}</p>
          <p className="text-[10px] text-muted-foreground">Locales</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="font-display text-xl font-bold text-foreground">{MOCK_TOURNAMENTS.length}</p>
          <p className="text-[10px] text-muted-foreground">Torneos</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="font-display text-xl font-bold text-secondary">1.2K</p>
          <p className="text-[10px] text-muted-foreground">Jugadores</p>
        </div>
      </motion.div>

      {/* Próximos torneos */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Próximos torneos</h2>
          <Link to="/torneos" className="flex items-center gap-0.5 text-xs font-medium text-primary">
            Ver todos <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {upcomingTournaments.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <Link to={`/torneos/${t.id}`}>
                <TournamentCard tournament={t} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Locales destacados */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Locales destacados</h2>
          <Link to="/mapa" className="flex items-center gap-0.5 text-xs font-medium text-primary">
            Ver mapa <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {featuredVenues.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <Link to={`/locales/${v.id}`}>
                <VenueCard venue={v} table={MOCK_TABLES.find(t => t.venueId === v.id)} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mx-4 mt-6 mb-4 rounded-xl gradient-accent p-5 text-center"
      >
        <Zap className="mx-auto h-8 w-8 text-accent-foreground" />
        <h3 className="mt-2 font-display text-lg font-bold text-accent-foreground">
          Organiza tu torneo
        </h3>
        <p className="mt-1 text-sm text-accent-foreground/80">
          Crea torneos por parejas con bracket automático, ELO y categorías
        </p>
        <Link
          to="/torneos/crear"
          className="mt-3 inline-block rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 active:scale-95"
        >
          Crear torneo
        </Link>
      </motion.section>
    </div>
  );
}
