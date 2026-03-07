import { useParams, Link } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import { MOCK_VENUES, MOCK_TABLES, MOCK_TOURNAMENTS, getTableForVenue } from '@/data/mock';
import { MapPin, CheckCircle, AlertTriangle, Clock, Trophy, ArrowLeft, Camera } from 'lucide-react';
import { useState } from 'react';

const verificationLabels: Record<string, string> = {
  verificado: 'Verificado',
  no_verificado: 'Sin verificar',
  en_disputa: 'En disputa',
};

const verificationColors: Record<string, string> = {
  verificado: 'bg-green-100 text-green-800',
  no_verificado: 'bg-muted text-muted-foreground',
  en_disputa: 'bg-yellow-100 text-yellow-800',
};

const statusLabels: Record<string, string> = {
  activo: 'Activo',
  pendiente: 'Pendiente',
  cambiado: 'Cambiado',
  cerrado_temporal: 'Cerrado temporalmente',
  cerrado: 'Cerrado',
};

export default function VenueDetailPage() {
  const { id } = useParams();
  const venue = MOCK_VENUES.find(v => v.id === id);
  const table = venue ? getTableForVenue(venue.id) : undefined;
  const venueTournaments = MOCK_TOURNAMENTS.filter(t => t.venueId === id);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!venue) {
    return (
      <PageShell title="Local no encontrado">
        <p className="text-center text-muted-foreground mt-8">Este local no existe.</p>
        <Link to="/mapa" className="mt-4 block text-center text-sm text-primary font-medium">Volver al mapa</Link>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-4">
        <Link to="/mapa" className="rounded-lg bg-muted p-2">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="font-display text-xl font-bold truncate">{venue.name}</h1>
      </div>

      {/* Status & Verification */}
      <div className="flex gap-2 mb-4">
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${verificationColors[venue.verificationLevel]}`}>
          {verificationLabels[venue.verificationLevel]}
        </span>
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {statusLabels[venue.status]}
        </span>
      </div>

      {/* Info card */}
      <div className="rounded-xl bg-card p-4 shadow-card mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{venue.address}, {venue.city}</span>
        </div>
        {venue.description && (
          <p className="text-sm text-foreground mb-3">{venue.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Confianza</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${venue.confidenceScore >= 80 ? 'bg-green-500' : venue.confidenceScore >= 50 ? 'bg-yellow-500' : 'bg-destructive'}`}
                  style={{ width: `${venue.confidenceScore}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{venue.confidenceScore}%</span>
            </div>
          </div>
          {venue.lastVerified && (
            <div>
              <p className="text-xs text-muted-foreground">Última verificación</p>
              <p className="mt-1 text-sm font-medium">
                {new Date(venue.lastVerified).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mesa */}
      {table && (
        <div className="rounded-xl bg-card p-4 shadow-card mb-4">
          <h3 className="font-display text-sm font-semibold mb-3">Mesa de futbolín</h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                {table.brand}
              </span>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold">{table.quantity}</p>
              <p className="text-[10px] text-muted-foreground">{table.quantity === 1 ? 'mesa' : 'mesas'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Torneos en este local */}
      {venueTournaments.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-card mb-4">
          <h3 className="font-display text-sm font-semibold mb-3">Torneos en este local</h3>
          <div className="flex flex-col gap-2">
            {venueTournaments.map(t => (
              <Link key={t.id} to={`/torneos/${t.id}`} className="flex items-center gap-3 rounded-lg bg-muted p-3 transition hover:bg-muted/80">
                <Trophy className="h-4 w-4 text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Acciones de verificación */}
      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={() => setShowConfirmDialog(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
        >
          <CheckCircle className="h-4 w-4" />
          Confirmar que sigue igual
        </button>
        <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 text-sm font-semibold text-foreground transition active:scale-[0.98]">
          <AlertTriangle className="h-4 w-4" />
          Reportar cambio
        </button>
        <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-semibold text-muted-foreground transition active:scale-[0.98]">
          <Camera className="h-4 w-4" />
          Subir foto
        </button>
      </div>

      {/* Crear torneo aquí */}
      <Link
        to={`/torneos/crear?venue=${venue.id}`}
        className="block w-full rounded-xl bg-secondary py-3 text-center text-sm font-semibold text-secondary-foreground transition active:scale-[0.98]"
      >
        Crear torneo en este local
      </Link>

      {/* Confirm dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-elevated">
            <h3 className="font-display text-lg font-bold mb-2">¿Confirmas que sigue igual?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Al confirmar, subirá la confianza del local y se actualizará la fecha de verificación.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 rounded-lg bg-muted py-2.5 text-sm font-medium text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
