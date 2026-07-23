'use client';
import { useEffect, useState } from 'react';
import { useGameContext } from '../hooks/GameContext';
import { t } from '../lib/labels';


function DistrictsTab({ districts }: { districts: any[] }) {
  if (!districts?.length) return <div className="empty-state">Sin datos de distrito</div>;
  return (
    <>
    <div className="city-grid">
      {districts.map((d: any) => (
        <div key={d.id} className="district-card">
          <div className="dc-header">
            <span className="dc-name">{t(d.id)}</span>
            <span className="dc-pop">{d.population} hab.</span>
          </div>
          <div className="dc-approval">
            <span>Aprobación</span>
            <div className="progress-bar"><div className="progress-value" style={{ width: `${(d.approval ?? 0) * 100}%` }} /></div>
            <span>{((d.approval ?? 0) * 100).toFixed(0)}%</span>
          </div>
          <div className="svc-row">
            <span>{t('averageIncome')}</span>
            <span>${Math.round(d.economy?.averageIncome ?? 0).toLocaleString()}</span>
          </div>
          <div className="svc-row">
            <span>Riesgo social</span>
            <span>{((d.social?.crimeRisk ?? 0) * 100).toFixed(0)}%</span>
          </div>
          {d.services && (
            <div className="dc-services">
              {Object.entries(d.services).map(([k, v]: any) => (
                <div key={k} className="svc-row">
                  <span>{t(k)}</span>
                  <div className="progress-bar sm"><div className="progress-value green" style={{ width: `${Math.round(v * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
    <div className="district-card census-card">
      <div className="dc-header"><span className="dc-name">Censo de ciudad</span></div>
      <div className="svc-row"><span>Distrito</span><span>Resid. · Com. · Industrial</span></div>
      {[...districts.map(d => ({ id: d.id, c: d.census })), { id: 'citywide', c: districts.reduce((sum, d) => ({ residencial: { total: (sum.residencial?.total ?? 0) + (d.census?.residencial?.total ?? 0) }, comercial: (sum.comercial ?? 0) + (d.census?.comercial ?? 0), industrial: (sum.industrial ?? 0) + (d.census?.industrial ?? 0) }), {}) }].map(({ id, c }: any) => <div className="svc-row" key={id}><span>{id === 'citywide' ? 'Total citywide' : t(id)}</span><span>{c?.residencial?.total ?? 0} · {c?.comercial ?? 0} · {c?.industrial ?? 0}</span></div>)}
    </div>
    </>
  );
}

function OpinionTab({ opinionBreakdown }: { opinionBreakdown: any[] }) {
  if (!opinionBreakdown?.length) return <div className="empty-state">Sin datos de opinión todavía</div>;
  const latest = opinionBreakdown[0];
  const channels = [
    { key: 'socialMedia', label: 'Redes Sociales', cls: 'social' },
    { key: 'newspapers', label: 'Prensa', cls: 'news' },
    { key: 'wordOfMouth', label: 'Boca a Boca', cls: 'wom' },
    { key: 'pressConference', label: 'Conf. Prensa', cls: 'press' },
  ];
  const maxAbs = Math.max(...channels.map(c => Math.abs(latest[c.key] ?? 0)), 0.01);
  return (
    <div className="opinion-breakdown">
      <div className="opinion-tick-label">Día {latest.day}</div>
      <div className="opinion-channels">
        {channels.map(ch => {
          const val = latest[ch.key] ?? 0;
          const pct = (Math.abs(val) / maxAbs) * 100;
          return (
            <div key={ch.key} className="ch-row">
              <span className="ch-label">{ch.label}</span>
              <div className="ch-bar-container">
                <div className={`ch-bar-fill ${ch.cls}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`ch-val ${val >= 0 ? 'pos' : 'neg'}`}>{val >= 0 ? '+' : ''}{(val * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CitizensTab({ simState }: { simState: any }) {
  const { fetchState } = useGameContext();
  const total = simState?.totalCitizens ?? 0;
  const active = simState?.activeCitizens ?? 0;
  const citizens = Object.values(simState?.citizens ?? {}).flat() as any[];
  async function toggleCitizen(id: string) {
    console.log('[activar] clicked', id);
    try {
      console.log('[activar] request start', { id, endpoint: '/api/inspect' });
      const response = await fetch('/api/inspect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ citizenId: id }) });
      const body = await response.json();
      console.log('[activar] response', { status: response.status, ok: response.ok, body });
      console.log('[activar] assigned commute coordinates', { id, home: body.citizen?.homeTile, work: body.citizen?.workTile, level: body.citizen?.level });
      if (!response.ok) throw new Error(`Activation request failed: ${response.status}`);
      console.log('[activar] state refresh start');
      await fetchState();
      console.log('[activar] state refresh complete');
    } catch (error) {
      console.error('[activar] failed', error);
    }
  }
  return (
    <div className="citizens-summary">
      <div className="cit-stat"><span>Total ciudadanos</span><strong>{total}</strong></div>
      <div className="cit-stat"><span>Ciudadanos activos</span><strong>{active}</strong></div>
      <div className="cit-section-title">Seguimiento individual</div>
      <div className="citizen-track-list">
        {citizens.slice(0, 12).map(citizen => <div className="citizen-track-row" key={citizen.id}>
          <span><strong>{citizen.id}</strong><small>{citizen.occupation}</small></span>
          <button onClick={() => toggleCitizen(citizen.id)}>{citizen.level === 3 ? 'Desactivar' : 'Activar'}</button>
        </div>)}
      </div>
      {simState?.organizations?.length > 0 && (
        <>
          <div className="cit-section-title">Organizaciones</div>
          {simState.organizations.map((o: any) => (
            <div key={o.id} className="org-row">
              <span>{o.name ?? o.id}</span>
              <span className="org-type">{t(o.type)}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function PedestriansTab({ simState }: { simState: any }) {
  const { fetchState } = useGameContext();
  const citizens = Object.values(simState?.citizens ?? {}).flat() as any[];
  const activePeds = citizens.filter(c => c.homeTile && c.workTile).slice(0, 60);

  function inspectPedestrian(citizen: any) {
    window.dispatchEvent(new CustomEvent('inspect:pedestrian', { detail: citizen }));
  }

  return (
    <div className="citizens-summary">
      <div className="cit-stat"><span>Transeúntes en aceras</span><strong>{activePeds.length}</strong></div>
      <div className="cit-section-title">Localizar e inspeccionar transeúnte</div>
      <div className="citizen-track-list">
        {activePeds.map(citizen => (
          <div className="citizen-track-row" key={citizen.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span>
              <strong>{citizen.id}</strong>
              <small style={{ marginLeft: 6 }}>({citizen.occupation ?? 'Peatón'})</small>
            </span>
            <button className="ctrl-btn" onClick={() => inspectPedestrian(citizen)}>🔍 Inspeccionar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { simState } = useGameContext();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'districts' | 'opinion' | 'citizens' | 'pedestrians'>('districts');

  useEffect(() => {
    const navigate = (event: Event) => {
      const requested = (event as CustomEvent<'districts' | 'opinion' | 'citizens' | 'pedestrians'>).detail;
      if (open && tab === requested) {
        setOpen(false);
        return;
      }
      setTab(requested);
      setOpen(true);
    };
    window.addEventListener('dashboard:navigate', navigate);
    return () => window.removeEventListener('dashboard:navigate', navigate);
  }, [open, tab]);

  return (
    <div id="hud-bottom" className={open ? '' : 'collapsed'}>
      <button id="hud-bottom-toggle" onClick={() => setOpen(o => !o)}>
        <span id="toggle-arrow">▲</span>
        <span>PANEL DE CIUDAD</span>
        <span id="dash-quick">
          <span className="qs-dot">•</span>
          Día {simState?.day ?? 0}
          <span className="qs-dot">•</span>
          ${(simState?.treasury ?? 0).toLocaleString()}
          <span className="qs-dot">•</span>
          Aprob. {((simState?.approval ?? 0) * 100).toFixed(0)}%
        </span>
      </button>
      <div id="hud-bottom-content">
        <div id="dash-tabs">
          {(['districts', 'opinion', 'citizens', 'pedestrians'] as const).map(t => (
            <button key={t} className={`dash-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'districts' ? 'DISTRITOS' : t === 'opinion' ? 'OPINIÓN' : t === 'citizens' ? 'CIUDADANOS' : 'TRANSEÚNTES'}
            </button>
          ))}
        </div>
        <div id="dash-content">
          <div className={`dash-pane ${tab === 'districts' ? 'active' : ''}`}>
            <DistrictsTab districts={simState?.districts ?? []} />
          </div>
          <div className={`dash-pane ${tab === 'opinion' ? 'active' : ''}`}>
            <OpinionTab opinionBreakdown={simState?.opinionBreakdown ?? []} />
          </div>
          <div className={`dash-pane ${tab === 'citizens' ? 'active' : ''}`}>
            <CitizensTab simState={simState} />
          </div>
          <div className={`dash-pane ${tab === 'pedestrians' ? 'active' : ''}`}>
            <PedestriansTab simState={simState} />
          </div>
        </div>
      </div>
    </div>
  );
}
