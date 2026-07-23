import React from 'react';
import { vehicleForIncome } from '../lib/vehicleSprites';

type Props = { house: any; onClose: () => void; onSelectCitizen: (citizen: any) => void };

export default function HouseInspector({ house, onClose, onSelectCitizen }: Props) {
  const income = house.income ?? 0;
  const type = house.householdSize >= 3 ? 'Edificio de apartamentos' : house.householdSize >= 2 ? 'Dúplex' : 'Casa individual';
  return <div className="citizen-inspector house-inspector">
    <button className="inspector-close" onClick={onClose} aria-label="Cerrar">×</button>
    <small className="inspector-eyebrow">VIVIENDA RESIDENCIAL</small>
    <strong className="inspector-title">{type}</strong>
    <div className="inspector-location">⌖ {house.owner ?? 'Sin distrito'} <small>({house.col}, {house.row})</small></div>
    <div className="inspector-highlights">
      <div><b>{house.occupants.length}</b><span>habitantes</span></div>
      <div><b>${Math.round(income).toLocaleString()}</b><span>ingreso hogar</span></div>
    </div>
    <small className="inspector-section">PERSONAS QUE VIVEN AQUÍ</small>
    {house.occupants.length === 0 && <span>No hay ciudadanos asignados a esta vivienda.</span>}
    {house.occupants.map((citizen: any) => <button className="inspector-person" key={citizen.id} onClick={() => onSelectCitizen(citizen)}>
      <span className="person-avatar">{(citizen.id ?? '?').slice(-1)}</span><span><b>{citizen.id}</b><small>{citizen.occupation ?? 'Ciudadano'} · {citizen.level === 3 ? vehicleForIncome(income, citizen.householdId ?? citizen.id) : 'sin vehículo'}</small></span>
    </button>)}
  </div>;
}
