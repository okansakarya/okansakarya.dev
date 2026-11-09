import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useResource } from '../../hooks/useResource'
import { ApiError, MAX_BAN_MINUTES, createBan, liftBan, listBans } from '../../lib/api'
import type { IpBan } from '../../lib/api'
import { Button } from '../../widgets/Button/Button'
import { GlassCard } from '../../widgets/GlassCard/GlassCard'
import { TextField } from '../../widgets/TextField/TextField'
import { ErrorState, LoadingState, PageState } from '../shared/PageState'
import '../pages.css'
import './admin.css'

const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

function CreateBanForm({ onCreated }: { onCreated: (ban: IpBan) => void }) {
  const { authorized } = useAuth()
  const [ipAddress, setIpAddress] = useState('')
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('60')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const ban = await authorized((token) =>
        createBan(token, {
          ip_address: ipAddress.trim(),
          reason: reason.trim(),
          duration_minutes: Number(duration),
        }),
      )
      onCreated(ban)
      setIpAddress('')
      setReason('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Ban oluşturulamadı.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GlassCard eyebrow="Erişim Kontrolü" title="IP Adresi Engelle" icon="block">
      <form className="form-grid" onSubmit={handleSubmit}>
        <TextField
          label="IP Adresi"
          hint="IPv4 veya IPv6. Örnek: 203.0.113.7"
          value={ipAddress}
          onChange={(event) => setIpAddress(event.target.value)}
          maxLength={45}
          autoComplete="off"
          spellCheck={false}
          required
        />
        <TextField
          label="Süre (dakika)"
          hint={`1–${MAX_BAN_MINUTES} dakika (en fazla 30 gün).`}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_BAN_MINUTES}
          step={1}
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          required
        />
        <div className="span-2">
          <TextField
            label="Sebep"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={255}
            required
          />
        </div>
        {error && (
          <p className="form-message form-message--error span-2" role="alert">
            {error}
          </p>
        )}
        <div className="span-2 row">
          <Button
            type="submit"
            variant="danger"
            icon="block"
            loading={submitting}
            disabled={!ipAddress.trim() || !reason.trim() || !duration}
          >
            Banla
          </Button>
          <span className="stat-caption">Ban, süre dolunca kendiliğinden kalkar.</span>
        </div>
      </form>
    </GlassCard>
  )
}

export function AdminBansPage() {
  const { authorized } = useAuth()
  const load = useCallback(
    (signal: AbortSignal) => authorized((token) => listBans(token, signal)),
    [authorized],
  )
  const bans = useResource(load)
  const [pendingIp, setPendingIp] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleLift(ban: IpBan) {
    setPendingIp(ban.ip_address)
    setActionError(null)
    try {
      await authorized((token) => liftBan(token, ban.ip_address))
      bans.setData((current) => current.filter((item) => item.ip_address !== ban.ip_address))
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Ban kaldırılamadı.')
      if (caught instanceof ApiError && caught.status === 404) {
        bans.reload()
      }
    } finally {
      setPendingIp(null)
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="page-heading__eyebrow">Güvenlik</span>
          <h1 className="page-heading__title">IP Banları</h1>
          <p className="page-heading__lead">
            Kötüye kullanım yapan adresleri süreli olarak engelleyin veya engeli kaldırın.
          </p>
        </div>
        <div className="page-heading__actions">
          <Button variant="ghost" icon="sync" onClick={bans.reload}>
            Yenile
          </Button>
        </div>
      </div>

      <CreateBanForm onCreated={(ban) => bans.setData((current) => [ban, ...current])} />

      <section className="page-section">
        <div className="page-heading">
          <div>
            <h2 className="page-heading__title">Aktif Banlar</h2>
            <p className="page-heading__lead">Süresi dolan banlar listeden otomatik düşer.</p>
          </div>
        </div>
        {actionError && (
          <p className="form-message form-message--error" role="alert">
            {actionError}
          </p>
        )}
        {bans.status === 'loading' && <LoadingState title="Banlar yükleniyor…" />}
        {bans.status === 'error' && <ErrorState error={bans.error} onRetry={bans.reload} />}
        {bans.status === 'success' && bans.data.length === 0 && (
          <PageState icon="verified_user" title="Aktif ban yok" message="Engellenmiş bir adres bulunmuyor." />
        )}
        {bans.status === 'success' && bans.data.length > 0 && (
          <ul className="stack ban-list">
            {bans.data.map((ban) => (
              <li key={ban.id} className="upload-row ban-row">
                <span className="material-symbols-outlined" aria-hidden="true">
                  block
                </span>
                <div className="upload-row__info">
                  <span className="upload-row__name">{ban.ip_address}</span>
                  <span className="upload-row__meta">
                    {ban.reason} · Bitiş: {dateFormat.format(new Date(ban.expires_at))}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="lock_open"
                  loading={pendingIp === ban.ip_address}
                  onClick={() => handleLift(ban)}
                >
                  Banı Kaldır
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
