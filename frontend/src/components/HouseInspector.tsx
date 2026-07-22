import React from 'react';
import { vehicleForIncome } from '../lib/vehicleSprites';

type Props = { house: any; onClose: () => void; onSelectCitizen: (citizen: any) => void };

export default function HouseInspector({ house, onClose, onSelectCitizen }: Props) {
  const income = house.income ?? 0;
  return <div className="citizen-inspector">
    <button onClick={onClose} aria-label="Cerrar">×</button>
    <strong>Casa residencial</strong>
    <span>Ubicación: ({house.col}, {house.row})</span>
    <span>Distrito: {house.owner ?? '—'}</span>
    <span>Tipo: {house.householdSize >= 4 || income >= 2500 ? 'Edificio de apartamentos' : house.householdSize >= 3 || income >= 1500 ? 'Dúplex' : 'Casa individual'}</span>
    <span>Ingreso del hogar: ${Math.round(income).toLocaleString()}</span>
    <span>Habitantes: {house.occupants.length}</span>
    {house.occupants.length === 0 && <span>No hay ciudadanos asignados a esta vivienda.</span>}
    {house.occupants.map((citizen: any) => <button className="ctrl-btn" key={citizen.id} onClick={() => onSelectCitizen(citizen)}>
      {citizen.id} · {citizen.occupation ?? 'Ciudadano'} · {citizen.level === 3 ? vehicleForIncome(income, citizen.householdId ?? citizen.id) : 'sin vehículo'}
    </button>)}
  </div>;
}
