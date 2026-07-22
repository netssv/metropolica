# Nota de diseño: tráfico, routing y KotCity

Fecha: 2026-07-21. Esta nota es investigación de diseño; no copia código de KotCity ni
autoriza todavía una implementación nueva.

## Qué hace cada sistema

Metropolica calcula una ruta BFS por vehículo en `frontend/src/lib/trafficSystem.ts` y
recalcula cuando cambia el mapa, la plantilla de actividad o el roster. En cada frame,
`trafficBehavior.ts` decide `following`, `signal` o `yield` usando progreso local, el tramo
dirigido y la ocupación aproximada del cruce. `laneOffset.ts` solo cambia la posición visual.
La asignación de hogares/destinos aplica cupos deterministas, pero cuando se agotan conserva
un fallback estable; por tanto varios ciudadanos todavía pueden converger en el mismo tile.

KotCity no contiene una clase `TrafficNetwork` en el commit estudiado (`0ee1cbf`). Su diseño
real es más cercano a A* con caché que a un flow field: `Pathfinder.kt` hace A* (`truePathfind`),
considera `CityMap.trafficLayer` en la heurística y tiene cachés para consultas de ubicaciones.
`CityMap.kt` conserva la capa de tráfico y `TrafficCalculator.kt` la reconstruye desde los
paths/contracts agregados. El documento de diseño de KotCity describe explícitamente “A* with
a heavy amount of caching” y deja como objetivo futuro que los edificios incorporen congestión
de rutas. La documentación pública también declara A* y optimizaciones de pathfinding.

Fuentes consultadas:

- `kotcity/pathfinding/Pathfinder.kt`
- `kotcity/data/CityMap.kt`
- `kotcity/automata/TrafficCalculator.kt`
- `design_docs/KotCity.mm`, sección “Traffic / Pathfinding”
- [Repositorio KotCity](https://github.com/kotcity/kotcity), Apache License 2.0

## Diagnóstico comparativo

| Síntoma | Causa estructural posible | Diagnóstico actual | Acción recomendada |
| --- | --- | --- | --- |
| Bunching | Muchas rutas idénticas y decisiones independientes pueden concentrar agentes | Principalmente local: cupos/fallback de destino, rutas con el mismo siguiente tramo y separación que no altera la ruta lógica | Medir ocupación por destino y siguiente tramo; corregir cupos/fallback y añadir elección determinista entre alternativas antes de flow fields |
| Vehículos atascados cerca del destino | Una ruta compartida no garantiza capacidad de llegada ni liberación | Local: transición de llegada, ruta inválida, estado `progress`/`arrival` y selección de tile final | Instrumentar un límite de ticks y limpiar el viaje al completar; no cambiar arquitectura todavía |
| Yield permanente | La política de prioridad puede formar una espera circular | Local: ocupación del cruce y prioridad; un flow field no resuelve un semáforo o una reserva mal calculada | Probar cuatro aproximaciones, distinguir “entrando” de “dentro” y reservar la caja por movimiento |
| Stop dentro del cruce | El índice lógico y la proyección visual pueden usar fronteras distintas | Local: umbral de progreso y punto de parada en el tramo de entrada | Derivar el stop line del nodo `to` y del borde `from -> to`; prueba geométrica antes de tocar routing |
| Señales invisibles | No es un problema de routing | Es un problema de integración renderer/runtime: la fase puede existir sin que el Canvas dibuje cabezales | Mantener una función pura de fase y comprobar que el render pass recorre intersecciones visibles |

Un flow field reduce el coste marginal de muchos agentes que comparten destino y hace explícita
la dirección siguiente por tile, pero no evita por sí mismo colisiones, mala capacidad de hogar,
un stop line incorrecto ni señales no dibujadas. En KotCity, además, la evidencia disponible
apunta a A* cacheado, no a un flow field. Por eso no se justifica una reescritura ahora: los
problemas observados son mayormente locales y están en la capa frontend autorizada.

## Propuesta incremental, si la medición la justifica

1. **Medición (sin cambio de comportamiento):** registrar por snapshot el destino, primer tramo,
   ocupación del tile final, longitud de cola, razón de espera y tiempo estacionario. Reproducir
   cuatro aproximaciones y rutas convergentes.
2. **Corrección local:** hacer que el cupo sea parte de la selección de destino, añadir reservas
   deterministas de caja/stop line y una transición de llegada finita. Validar primero con los
   tests y un escenario visual pequeño.
3. **Caché compartida tipo KotCity:** si el perfil demuestra que la recomputación o la
   concentración siguen siendo estructurales, crear en `frontend/` un `routingCache` por
   `roadSignature + destino lógico + política de tráfico`. Reutilizar rutas/prefijos y
   invalidarlo en cambios de carretera; no moverlo a `core/` ni `simulation/`.
4. **Flow field acotado opcional:** solo para el último tramo hacia 2–4 clases de destino
   (`home`, `work`, `commercial`, `refuel`) dentro de un distrito. Cada celda guardaría distancia
   y siguiente vecino; la capa de reserva/señal seguiría siendo independiente. Comparar contra
   BFS en bunching, cruces y mapas no cuadrados antes de ampliar el alcance.

Cada fase debe conservar determinismo, no crear entidades ni comandos nuevos, y quedar en módulos
pequeños. Esta propuesta no implementa ninguna de las fases.
