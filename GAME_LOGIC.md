# Metropolica — guía de lógica del juego

Este documento describe el comportamiento implementado actualmente. Cuando una sección diga
“aproximación” o “pendiente”, no debe interpretarse como una mecánica ya disponible.

## 1. Flujo general

```text
seed + tamaño de ciudad
        ↓
mapa procedural → distritos → hogares/citizens → homeTile/workTile
        ↓
reloj → loops diarios/semanales/mensuales → economía, servicios, opinión y activación
        ↓
frontend consulta estado → Canvas dibuja mapa, edificios, agua, puentes y vehículos
```

El backend es la fuente de verdad para estado, reloj, ciudadanía, economía y mapa. El frontend
calcula principalmente la presentación y el tránsito visual de los ciudadanos Level 3.

## 2. Reloj y simulación

`SimulationClock` empieza en día 0 y hora 00:00. Un día simulado equivale a 3.600.000 ms en
`ScenarioRunner`, pero el servidor usa un intervalo corto para avanzar la partida. La velocidad
modifica cuánto tiempo simulado procesa cada avance.

- Diario: decisiones y cambios de actividad de ciudadanos.
- Semanal: activación selectiva de ciudadanos, destinos y evaluación de organizaciones/opinión.
- Mensual: eventos registrados por los loops correspondientes.
- HUD: `+1 hora`, `+6 horas`, salto a despertar y salto a noche usan `/api/advance-hours`.
- “Hora de despertar” lee el final del bloque `sueño`; en las rutinas actuales suele ser 07:00.

## 3. Ciudadanos, hogares y demografía

El escenario `ciudad_dividida` trabaja con cohortes de hogares. Cada distrito comienza con una
cohorte económica y `assignCitizens()` crea 20 ciudadanos observacionales por distrito. Muchos
ciudadanos pueden compartir el mismo `householdId`; por eso la cantidad de ciudadanos visibles no
es idéntica a la cantidad de hogares económicos.

Cada ciudadano contiene, entre otros campos:

- identidad, edad, ocupación, educación, habilidades, aspiraciones, rasgos e intereses;
- `level`: Level 2 inactivo/observacional o Level 3 activo/con vehículo;
- `homeTile`, `workTile`, comercio y reabastecimiento;
- causa de activación (`driving`, `inspection`, `organization`, `footprint` o `policy`).

La asignación de vivienda es determinista por `householdId`. Los miembros del mismo hogar reutilizan
la misma vivienda. El seed garantiza 20 parcelas residenciales por distrito para cubrir la población
ciudadana inicial; `tileCensus` calcula capacidad estructural por nivel: nivel bajo 1, nivel medio 2
y nivel alto 4.

La población económica del distrito (`800` Centro, `1200` Periferia, `700` Zona Industrial) no es
la misma métrica que los 20 ciudadanos observacionales. Las zonas residenciales modifican la señal
proxy de población en +8; demolerlas revierte parcialmente −4.

## 4. Viviendas y assets

Los edificios se dibujan con Canvas 2D procedural en `frontend/src/lib/buildingSprites.ts`:

- tier 0: lote/silueta;
- tier 1: casa;
- tier 2: edificio desarrollado.

Para viviendas ocupadas, el renderer agrupa ciudadanos por `homeTile` y usa el ingreso/tamaño
visible para elegir casa individual, dúplex o apartamento. Esto es una representación visual del
perfil observado; la capacidad estructural real sigue dependiendo de `tile.level`.

## 5. Rutinas y actividades

Las rutinas de un ciudadano activo se derivan de ocupación, intereses, tipo de hogar y turno:

| Hora aproximada | Actividad | Destino |
|---|---|---|
| 00:00–07:00 | sueño | hogar |
| 07:00–inicio turno | preparación | hogar |
| inicio turno–+1 h | traslado | trabajo |
| durante turno | trabajo | trabajo |
| fin turno–+1 h | regreso | hogar |
| +1 h–22:00 | ocio en casa | hogar |
| 22:00–24:00 | sueño | hogar |

Al inicio de la partida, si el reloj está en madrugada, el ciudadano parte lógicamente desde su
hogar; no se crea un viaje fantasma desde el trabajo. Si cambia el nombre de la actividad pero el
destino no cambia, el tránsito conserva ruta y progreso para que una cola no reinicie el viaje.

## 6. Tránsito y vehículos

El frontend crea rutas sobre el grafo de carreteras y dibuja vehículos solo para ciudadanos Level 3.
La decisión por frame puede ser `moving`, `following`, `signal` o `yield`.

- semáforos: detención antes de la línea de entrada;
- seguimiento: separación lógica mínima, incluida la transición al siguiente segmento;
- intersecciones: un vehículo ya dentro conserva prioridad; aproximaciones simultáneas usan prioridad
  determinista para evitar deadlocks;
- colas: el vehículo delantero puede detenerse, pero el progreso de los seguidores no se reinicia
  al cambiar la actividad horaria;
- llegada: el vehículo se coloca en el `homeTile` y completa su fase de llegada.

Los vehículos son assets Canvas 2D seleccionados por ingreso: compacto/pickup, sedán/SUV/minivan o
deportivo/eléctrico/limusina.

En zoom alto aparecen peatones decorativos al costado de carreteras y puentes. Son una capa visual
determinista y animada; no son ciudadanos simulados, no tienen ID, hogar, rutina ni impacto en la
economía o en el tránsito.

## 7. Mapa, agua y uso del suelo

`generateInitialMap(seed, cols, rows)` crea agua/arena/árboles, carreteras, puentes, parques,
edificios y energía. Los mapas grandes no multiplican edificios solo por tener más terreno:

- viviendas: máximo inicial 20 por distrito;
- comercio e industria: límites derivados de la población económica del distrito;
- agua cercana: comercio prefiere `fish-market`, `pier` y `customs`;
- industria cercana: prefiere `water-treatment` o `customs`.

Las carreteras que atraviesan agua se marcan como `bridge`. El asset del puente usa la misma huella
que una carretera, con tablero, barandales, soporte y agua visible alrededor. El agua tiene ondas
procedurales animadas por frame.

## 8. Comercio, industria y economía

Las zonas comerciales aumentan empleo; las industriales aumentan el ingreso promedio del distrito.
Los hogares tienen ingreso, ahorro, deuda, desempleo, costo mensual, estrés y satisfacción. El
`EconomyLoop` actualiza agregados y el `UtilitiesLoop` calcula demanda/cobertura.

Los viajes de `compras` y `refuel` pueden emitir `CITIZEN_CONSUMPTION`. El backend descuenta un costo
del ingreso disponible y registra el ingreso comercial o industrial, evitando cobrar dos veces el
mismo hogar/día/actividad.

## 9. Servicios, opinión y riesgo

Agua y electricidad son utilidades con capacidad, demanda, cobertura y mantenimiento. Gasolina,
supermercado, hospitales, bomberos, ocio y telefonía reciben oferta derivada de edificios/zonas.
La opinión pondera aprobación, cobertura de servicios, confianza, desigualdad y riesgo social.
Organizaciones y huellas sociales pueden activar ciudadanos y modificar empleo/ingreso.

## 10. Clima y límites actuales

El sistema actual tiene clima/terreno visual: agua animada, arena, árboles, puentes y variaciones
procedurales. No existe todavía un modelo meteorológico persistente de lluvia, temperatura,
estaciones o impacto climático sobre economía/ciudadanos. No debe confundirse el modo noche del HUD
con clima: el modo noche es una capa visual según hora, con luna y estrellas.

## 11. Diagnóstico y evidencia

- Logs persistentes: `.metropolica/logs/games/`, máximo cinco partidas/reinicios.
- Cada snapshot conserva hora, velocidad, ciudadanos, hogares/destinos, rutinas, distritos y mapa
  residencial.
- Diagnóstico de tráfico frontend: habilitar `window.__METROPOLICA_TRAFFIC_DEBUG__` o usar
  `TRAFFIC_DIAGNOSTICS=...` en el harness Playwright.
- Las pruebas deterministas están en `test/`; la verificación mínima habitual es:

```bash
npm run typecheck
npm run typecheck:frontend
npm test
```

Cuando una captura contradiga el log, el log y la posición lógica tienen prioridad para investigar;
el renderer no debe corregir posiciones físicas mediante empujes visuales.
