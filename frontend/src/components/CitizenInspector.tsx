import React from 'react';
import { activityInfo } from '../lib/citizens/activity';

type CitizenInspectorProps = { citizen: any; hour: number; onClose: () => void };
function currentActivity(citizen: any, hour: number): any { return citizen.routine?.find((block: any) => hour >= block.startHour && hour < block.endHour); }

export default function CitizenInspector({ citizen, hour, onClose }: CitizenInspectorProps) {
  const [expanded, setExpanded] = React.useState(false);
  const activity = currentActivity(citizen, hour);
  const activityVisual = activityInfo(activity);
  const district = citizen.districtId ?? citizen.id?.split('-citizen-')[0] ?? '—';
  return <div className="citizen-inspector">
    <button onClick={onClose} aria-label="Cerrar">×</button>
    <strong>Vehículo ciudadano</strong>
    <span>ID: {citizen.id}</span><span>Distrito: {district}</span>
    <span>Ocupación: {citizen.occupation ?? '—'}</span>
    <span style={{ color: activityVisual.color, fontWeight: 700 }}>Actividad actual: {activityVisual.icon} {activityVisual.label}</span>
    <span>Destino: {citizen.workplaceType ?? '—'}</span>
    <span>Commute: {citizen.commuteDelayState === 'delayed' ? 'Demorado' : citizen.commuteDelayState === 'normal' ? 'Normal' : 'No activo'}</span>
    <button className="ctrl-btn" onClick={() => setExpanded(value => !value)}>{expanded ? 'Ocultar detalle' : 'Ver más'}</button>
    {expanded && <>
      <span>Hogar: {citizen.householdId ?? '—'}</span><span>Edad: {citizen.age ?? '—'}</span>
      <span>Educación: {citizen.education ?? '—'}</span><span>Municipio: {citizen.municipality ?? '—'}</span>
      <span>Región: {citizen.region ?? '—'}</span><span>Idioma: {citizen.language ?? '—'}</span>
      <span>Intereses: {citizen.interests?.join(', ') || '—'}</span><span>Nivel: {citizen.level} · Estado: activo</span>
      <span>Causa: {citizen.activeCause ?? '—'}</span><span>Rutina diaria:</span>
      {citizen.routine?.map((block: any) => <span key={`${block.startHour}-${block.activity}`}>{String(block.startHour).padStart(2, '0')}:00–{String(block.endHour).padStart(2, '0')}:00 · {block.label}</span>)}
      <span>Problema actual: {citizen.currentProblem ?? '—'}</span><span>Vive: ({citizen.homeTile?.col ?? '—'}, {citizen.homeTile?.row ?? '—'})</span>
      <span>Propósito: {activity?.label ?? '—'}</span>
      <span>Turno: {citizen.workShift ? `${String(citizen.workShift.startHour).padStart(2, '0')}:00–${String(citizen.workShift.endHour).padStart(2, '0')}:00` : '—'}</span>
      <span>Trabajo: ({citizen.workTile?.col ?? '—'}, {citizen.workTile?.row ?? '—'})</span>
      <span>Habilidades: {citizen.skills?.map((value: number) => value.toFixed(2)).join(', ') || '—'}</span>
      <span>Aspiraciones: {citizen.aspirations?.map((value: number) => value.toFixed(2)).join(', ') || '—'}</span>
      <span>Rasgos: {citizen.traits?.map((value: number) => value.toFixed(2)).join(', ') || '—'}</span>
      <span>Relaciones: {citizen.relationships?.join(', ') || '—'}</span>
    </>}
  </div>;
}
