# Metropolica — Project Status

## What is this project?

Metropolica is a browser-oriented urban management simulation inspired by SimCity. Its focus is public
resource management, city administration and contemporary metropolitan problems. The simulation is
headless-first and uses TypeScript with deterministic aggregate systems. The active frontend renders the
city through procedural Canvas 2D drawing, chosen for deterministic behavior, agent-friendly iteration and
good runtime performance; external building-art dependencies are not part of the active visual path.

The project models most residents as household cohorts. A small observational subset of individually
tracked citizens can be activated around important events, policies, organizations or inspections.

## Current sprint

**Current authorization update:** Phase 2b is implemented as a separate, independently tested increment.
Low district coverage of seguridad, hospitales or bomberos may increase the existing
crime/social-risk value through the existing aggregate module. The approved design uses a `0.8` coverage
threshold, an equal-weight linear deficit across the three critical services and a maximum added penalty of
`0.15`. The penalty must be recalculated fresh on the existing social-risk cadence and must never compound.
Convenience services remain excluded, and crime/social-risk must never feed back into coverage, approval or
opinion.

### Registro persistente, assets 2D, tráfico y expansión de tiles — 2026-07-21
### Mejora del ciclo visual de peatones — 2026-07-21

Se ajustaron los peatones decorativos para eliminar saltos erráticos: ahora usan una fase lenta y
continua, desplazamiento reducido y ciclo de pasos. Las piernas alternan visiblemente mientras
caminan y el cuerpo tiene un pequeño rebote. Cuando hay una construcción junto a la calle, el ciclo
incluye estados visuales de acercamiento/entrada y salida, con una señal cálida breve en la puerta.
Todo continúa siendo presentación decorativa, sin ciudadanía simulada ni cambios económicos.
Typecheck raíz, frontend y 15/15 pruebas pasan.

### Peatones decorativos en zoom máximo — 2026-07-21

Se añadieron peatones visuales en `frontend/src/lib/pedestrianSprites.ts`. Aparecen únicamente
desde zoom 2 (por lo que el zoom máximo los hace claramente visibles), se colocan de forma
determinista junto a tiles `road`/`bridge`, caminan con una pequeña animación y tienen variaciones
de color. Son estrictamente decorativos: no se agregan a `citizens`, no modifican población,
economía, rutas ni colas de vehículos. Typecheck raíz, frontend y 15/15 pruebas pasan.

### Ventanas y humo nocturno en viviendas — 2026-07-21

El asset residencial procedural ahora recibe el estado nocturno real del HUD. Entre 19:00 y 06:00
las ventanas cambian a un tono cálido visible y cada vivienda desarrollada muestra una chimenea con
tres puffs de humo animados mediante seno y desfasados por tile. Durante el día se conserva la
paleta clara y no se dibuja humo. Se reutilizan los assets Canvas 2D existentes; typecheck raíz,
frontend y 15/15 pruebas pasan.

### Economía y assets de borde acuático — 2026-07-21

Los comercios e industrias ubicados a hasta dos tiles Manhattan del agua ahora reciben preferencia
de especialidad: `fish-market` y `pier` para comercio, `customs` y `water-treatment` para industria.
Si el distrito ya alcanzó su límite de oferta, el generador sustituye un edificio genérico por uno
de borde acuático para no aumentar artificialmente la cantidad total. El metadata queda disponible
para futuros loops económicos y el renderer muestra iconos/volúmenes acuáticos procedurales. Los
hospitales y mall-government conservan prioridad y no se reasignan. Typecheck raíz, frontend y
15/15 pruebas pasan.

### Puente con ancho de carretera e intersecciones sobre agua — 2026-07-21

La corrección anterior todavía dejaba una diferencia visual porque el tablero conservaba un margen
interior. Ahora el tablero `bridge` usa exactamente el mismo rombo completo que `road`; el agua solo
se dibuja antes como fondo visible en los bordes cuando la perspectiva lo permite. La conexión se
calcula con el mismo `roadConnections()` que las calles, por lo que un `bridge` con 3 o 4 vecinos
mantiene todos sus brazos, marcas y barandales como una intersección vial, no como un puente angosto
aislado. Typecheck raíz, typecheck frontend y 15/15 pruebas pasan.

### Ajuste de ancho visual del puente — 2026-07-21

La primera versión del asset de puente usaba un margen interior de 2 px por lado para revelar el
agua, haciendo que el tablero pareciera más estrecho que una carretera normal. El tablero ahora
usa prácticamente todo el rombo vial (`0.5 px` de margen proporcional al zoom); el agua queda como
borde sutil y los barandales permanecen dentro de la calzada. Typechecks y pruebas de tráfico/mapa
pasan.

### Asset visual de puentes sobre agua — 2026-07-21

Los mapas ya marcaban correctamente como `bridge` las carreteras colocadas sobre agua, pero el
renderer mostraba principalmente un rombo marrón. Ahora `drawRoad()` mantiene agua visible en los
bordes y dibuja un tablero de madera con marcas, barandales laterales y soporte central. El asset
es procedural Canvas 2D y reutiliza el agua animada existente debajo; las carreteras terrestres no
reciben estos elementos. Typecheck raíz, typecheck frontend y 15/15 pruebas pasan.

### Agua animada en Canvas — 2026-07-21

El asset procedural de agua ya existía, pero sus líneas de ola eran estáticas porque
`drawIsoTile()` no recibía el timestamp del frame. Ahora el renderer transmite `time` al asset y
dibuja tres ondas con fase senoidal por tile, de modo que cada superficie de agua tiene movimiento
continuo y ligeramente desfasado. Se mantiene el mismo asset Canvas 2D, sin sprites externos.
Typecheck raíz, typecheck frontend y 15/15 pruebas pasan.

### Fila que reiniciaba al cambiar la rutina — 2026-07-21

Se aisló el caso observado: un auto retenido por semáforo/cola podía seguir en ruta cuando el
reloj pasaba de `regreso a casa` a `ocio en casa` o `sueño`. Como el destino seguía siendo el mismo
`homeTile` pero el progreso aún era menor que 1, `transit.ts` reconstruía el viaje y lo reiniciaba
en progreso 0. El retraso de un vehículo podía así reiniciar repetidamente a toda la fila y evitar
que completaran su rutina.

Ahora el tránsito conserva ruta, progreso y fase de llegada siempre que el destino no cambie; solo
reinicia el viaje cuando cambia realmente el destino. Se añadió la regresión `a queued home trip
keeps progress when the routine label changes`. Typecheck raíz, typecheck frontend y 15/15 pruebas
pasan.

### Diagnóstico de autos estancados camino al trabajo — 2026-07-21

La lógica de intersecciones podía producir un bloqueo simétrico: dos vehículos perpendiculares
aproximándose al mismo cruce se veían mutuamente como `yield`, por lo que ambos frenaban antes de
entrar y ninguno liberaba la condición. El semáforo rojo y el seguimiento de cola siguen siendo
frenos válidos; el caso nuevo distingue un vehículo que ya está dentro del cruce y, cuando ambos
solo se aproximan, asigna prioridad determinista por ID. Así uno avanza y el otro espera, evitando
el deadlock permanente.

Se añadió la regresión `perpendicular vehicles use deterministic priority instead of mutual yield
deadlock`. Typecheck raíz, typecheck frontend y 15/15 pruebas pasan.

### Auditoría de assets visuales contra mapas — 2026-07-21

Se cruzaron los tipos emitidos por `generateInitialMap()` con `drawIsoTile()` y los assets
procedurales activos. No hay tipos de mapa sin renderer: terreno, agua, arena, árboles, carreteras,
puentes, parques, energía, zonas y edificios residenciales/comerciales/industriales tienen ruta
visual. Hospital y mall-government son variantes procedurales de los tiles comerciales existentes,
por lo que no aparecen como edificios huérfanos.

Se corrigió la referencia documental de `VISUAL_ASSETS.md`: el renderer actual usa Canvas 2D sin
sprites externos y tiers 0/1/2, no la tabla histórica de cuatro niveles ni las categorías móviles
de taxi/patrulla/ambulancia/bus, que no son emitidas por el tránsito actual. Las viviendas ocupadas
usan el perfil del hogar para mostrar casa, dúplex o apartamento. La auditoría no encontró un asset
visual faltante o desalineado con los mapas; no fue necesario cambiar lógica de juego.

### Balance de edificios iniciales por demanda — 2026-07-21

La auditoría de seeds mostró que los mapas grandes escalaban edificios con el área disponible,
no con la demanda: el seed 42 en Enormous llegaba a 199 viviendas en Centro, 442 en Periferia y
414 industrias, aunque el escenario inicia con 20 ciudadanos por distrito y poblaciones económicas
fijas de 800/1200/700. Esto podía hacer parecer que existían casas sin ciudadanos.

El generador ahora limita el stock inicial a 20 viviendas por distrito, mantiene el mínimo para los
20 ciudadanos, y limita comercio/industria según población: comercio máximo 20/30/18 e industria
máxima 27/40/24 para Centro/Periferia/Zona industrial. Los excedentes se convierten en terreno libre;
los servicios especiales siguen seleccionándose de los comercios restantes. Se validó que Tiny,
Normal, Big, Very big y Enormous no multiplican la oferta solo por tamaño de mapa. Se añadieron
pruebas deterministas de cobertura y límites; la suite completa pasa 15/15.

### Menú del reloj y modo noche — 2026-07-21

El reloj del HUD ahora abre un menú contextual con `+1 hora`, `+6 horas`, `Ir al día` (08:00) e
`Ir a la noche` (20:00). Se añadió `/api/advance-hours`, que avanza la simulación en fracciones
de día y registra el salto en el log persistente; los controles existentes de velocidad y avance
de días permanecen intactos.

La ciudad activa modo noche automáticamente entre 19:00 y 06:00: conserva los edificios, viviendas,
vehículos y assets procedurales existentes, aplicando una capa azul translúcida, luna y estrellas
discretas sobre el Canvas. No se añadieron sprites externos ni se duplicó el renderer. Typecheck
raíz, typecheck frontend y 15/15 pruebas pasan.

El botón diurno ahora calcula el salto desde los bloques `sueño` de las rutinas ciudadanas y avanza
a su hora de finalización más temprana; con los perfiles actuales es 07:00, la hora real de
despertar, en lugar de forzar las 08:00.

### Corrección de arranque a medianoche — 2026-07-21

Se confirmó la hipótesis de vehículos fuera del hogar al iniciar la partida: el reloj comienza en
hora 0, la rutina ya selecciona `sueño`, pero el renderer no tenía viaje previo y calculaba el
origen como `workTile`; por eso creaba un regreso a casa mientras el ciudadano ya estaba en modo
sueño. Ahora, cuando no existe viaje previo, la actividad doméstica entre 00:00 y 07:00 inicia
directamente en el `homeTile` con progreso 1. Los retornos reales desde trabajo a partir de las
16:00 conservan su ruta y deben llegar antes de cambiar a descanso/sueño.

Se añadió la regresión `midnight sleep starts at home instead of sending the citizen home late`.
Typecheck raíz, typecheck frontend y la suite completa pasan: 15/15.

### Garantía de viviendas al generar el seed — 2026-07-21

La revisión del último log confirmó que no había `homeTile` ausentes, pero sí una oferta inicial
desigual: el seed solo garantizaba 12 parcelas residenciales por distrito mientras
`assignCitizens()` crea 20 ciudadanos por distrito. Eso hacía que la asignación dependiera de
reutilización/fallback y dejaba autos visualmente sin una casa inequívoca, aunque el diagnóstico
posterior reportara un `homeTile`.

`MIN_RESIDENTIAL_TILES_PER_DISTRICT` ahora es 20, igual a la población ciudadana inicial por
distrito. El generador prioriza terrenos junto a carretera y, si no bastan, convierte terreno
libre no acuático (pasto, arena o árboles) para completar el stock; así también el mapa Tiny queda
en 20/20/20 parcelas residenciales para el seed 42. La prueba determinista de mapas verifica la
garantía para el tamaño Normal y la prueba de ciudadanía conserva que cada ciudadano recibe hogar
y destino laboral. Los assets siguen siendo procedurales: el renderer eleva las viviendas ocupadas
a casa/dúplex/edificio según el perfil visible.

### Auditoría de último log: autos y viviendas — 2026-07-21

El último log (`game-2026-07-22T04-50-17-967Z-tquiv1.json`) no contiene ciudadanos Level 3 sin
`homeTile`. Encontró 60 ciudadanos activos, 3 tiles residenciales ocupados y 20 ciudadanos por
hogar representado. La causa de que los autos parecieran dormir afuera era visual: los tiles
`bldg-r` ocupados tenían `level: 0` y el renderer aplicaba `growthTier: 0` del distrito, que dibuja
un lote, aunque `housingByTile` ya identificaba el hogar.

El renderer ahora fuerza tier 1 para una vivienda ocupada y tier 2 cuando el perfil representado
tiene al menos 3 ciudadanos o ingreso de hogar de al menos 1500. Así el asset muestra casa, dúplex
o edificio/apartamento acorde al perfil visible. La auditoría confirmó que los assets actuales son
procedurales (`buildingSprites.ts`); no hay sprites residenciales externos en `frontend/public`
que estén ocultando la vivienda. La discrepancia de capacidad de nivel 0 queda documentada: el log
representa ciudadanos activos por hogar, mientras `tileCensus` usa capacidad estructural del tile.

### Registro persistente de partidas — 2026-07-21

Se añadió `scripts/server/gameLog.ts`. Cada arranque del backend y cada `/api/reset` inicia una
sesión JSON independiente en `.metropolica/logs/games/`; la rotación elimina los archivos antiguos
y conserva estrictamente los 5 más recientes. Cada evento incluye secuencia y timestamp, y los
snapshots incluyen día/hora/minuto/velocidad, tamaño y resultado de ciudad, ciudadanos con IDs,
hogar/trabajo/destinos, rutinas, actividad, nivel, viviendas residenciales por distrito y eventos
de reset, avance, velocidad, inspección, save y load.

El endpoint `GET /api/game-logs` devuelve el índice de las cinco sesiones. La prueba operativa hizo
6 resets consecutivos: el endpoint devolvió exactamente 5 archivos, cada uno con su `sessionId` y
2 eventos iniciales. Los logs se excluyen del control de versiones mediante `.gitignore`. Las rutas
de carretera calculadas exclusivamente dentro del renderer siguen disponibles en el diagnóstico
frontend gated; el log backend conserva sus extremos (`homeTile`/`workTile`) para correlacionarlas.

### Corrección de autos fuera de casa durante el sueño — 2026-07-21

**Diagnóstico:** el tránsito reconstruye el viaje cuando cambia `activityKey`. La rutina tiene dos
bloques domésticos consecutivos (`ocio en casa` 17–22 y `sueño` 22–24); al cambiar entre ellos,
el rebuild reiniciaba el viaje a `progress=0` aunque el vehículo ya hubiera alcanzado el mismo
`homeTile`. Por eso reaparecía en la calle durante el sueño. No era un problema de cupos ni una cola
permanente.

**Corrección:** si el destino nuevo coincide con el destino anterior y el viaje ya tenía
`progress >= 1`, se conserva la llegada y su fase de animación aunque cambie la actividad. Se añadió
la regresión `arrival remains at home across consecutive home activities`, junto con las pruebas
existentes de llegada bounded-home. Typecheck raíz, typecheck frontend y 15/15 pruebas pasan.

### Barrido de verificación visual — 2026-07-21

Se añadió el harness reutilizable `test/browser-verification-sweep.ts`. Con el servidor temporal
3200/3201 produjo capturas para los cinco tamaños (`/tmp/metropolica-browser-sweep/size-tiny.png`,
`size-small.png`, `size-big.png`, `size-very-big.png`, `size-enormous.png`) y para especialidades
en zoom normal y alejado (`specialties-normal.png`, `specialties-zoomed-out.png`). Las capturas
confirman carga del Canvas y el mapa no cuadrado en cada tamaño; la etapa completa de save/load y
selección del inspector debe repetirse porque el primer barrido terminó prematuramente después de
generar esas capturas. No se cambia lógica por ese fallo del harness.

La ruta de `zona_industrial-citizen-12` en el mapa Small fue medida con 16 nodos frente a un umbral
de 15 (`max(12, 2.5 × Manhattan(2))`), por lo que el cálculo determinista devuelve `delayed`.
La captura del Inspector mostrando “Commute: Demorado” aún no quedó generada; queda como incidencia
de verificación del harness, no como bug confirmado de la aplicación. El fallback visual de
bomberos/ocio/telefonía sigue fuera de alcance y requiere autorización separada.

### Reparación del wrapper npm y verificación de vivienda — 2026-07-21

**Causa de entorno:** `npm` resolvía primero `/home/netss/.local/bin/npm`, un wrapper stale creado
el 2026-07-16 que ejecutaba `/app/bin/host-spawn /usr/bin/npm`. No había referencia a `host-spawn`
en `package.json`, `.npmrc` ni scripts del proyecto; `/app/bin/host-spawn` no existe en este
entorno y `/usr/bin/npm` sí. Se reemplazó el wrapper por un passthrough persistente a
`/usr/bin/npm`, por lo que los comandos estándar vuelven a funcionar. El bypass permanente no es
un cambio de lógica del proyecto.

**Evidencia Part 1:** `npm run typecheck`, `npm run typecheck:frontend` y `npm test` pasaron;
15/15 pruebas. El servidor temporal arrancó mediante `npm run start:all` en puertos 3200/3201.
Playwright generó `/tmp/metropolica-home-arrival.png` y
`/tmp/metropolica-home-arrival-diagnostics.json`: 1.310 registros, 10 vehículos, estados
`normal/following/yield/stop`, y tres vehículos alcanzaron `routeProgress=1` (`periferia-citizen-13`,
`zona_industrial-citizen-2`, `zona_industrial-citizen-5`). El estado API mostró 30 Level-3, 30 con
`homeTile` y ninguno sin vivienda. El cruce con `/api/tilemap` contó 36 tiles residenciales,
capacidad 36, 3 tiles ocupados y 33 cupos abiertos. Se dejó intacta la lógica de tráfico/housing.

### Scope proposal — viviendas sin motivo de propiedad

Esta propuesta no está implementada y requiere autorización de Rodrigo.

Actualmente `generateInitialMap()` genera un mínimo procedural determinista de tiles `bldg-r` cercanos a carreteras por distrito (`MIN_RESIDENTIAL_TILES_PER_DISTRICT`) para garantizar stock habitacional básico en mapas nuevos y pequeños. Después `assignCommuteLocations()` asigna los `homeTile` a ese stock.

Eliminar viviendas no asignadas exigiría rehacer el orden actual de spawn/asignación, porque los ciudadanos reciben casa después de que existe el mapa. También requiere una causalidad ciudadano-construye, compatibilidad de save/load con mapas existentes y un caso de degradación para mapas pequeños.

Opciones: mantener una semilla pequeña solo dentro de zonas residenciales designadas por el jugador (estable, pero puede dejar distritos sin vivienda); hacer construcción completamente dirigida por demanda cuando un hogar necesite una parcela válida (más coherente, pero requiere estados de construcción y un arranque nuevo); o separar viviendas iniciales explícitamente propietarias de la vivienda zonificada futura (conserva el tutorial, pero añade metadata, migraciones y reglas de capacidad/venta). No debe implementarse ninguna opción sin el checkpoint de Rodrigo, como ocurrió con Phase 2a/2b, economía de proximidad y el loop de consumo.

### Corrección de vehículos sin vivienda — 2026-07-21

`assignCommuteLocations()` consumía capacidad por ciudadano y no reutilizaba explícitamente la
vivienda elegida para los demás miembros del mismo hogar. Esto podía agotar artificialmente los
cupos y dejar un ciudadano Level 3 sin `homeTile`; `transit.ts` lo filtraba antes de crear el viaje,
por lo que nunca tenía destino ni ruta. Ahora la contabilidad inicial y las nuevas asignaciones usan
hogares únicos, y todos los miembros reutilizan el tile de su `householdId`.

La prueba de capacidad residencial real confirma que un ciudadano sin vivienda recibe un `bldg-r`
disponible, aparece en `censusTiles()` y recibe también destino laboral. La suite completa 15/15 y
ambos typechecks locales pasan. La evidencia Playwright/JSON fresca queda pendiente por el wrapper
global de npm roto (`/app/bin/host-spawn` inexistente); no se modificó la Parte 2.

### Corrección de llegada a casa y colas lógicas — 2026-07-21

**Regresión aislada:** el rebuild de `frontend/src/lib/citizens/transit.ts` calculaba el origen
del viaje y después llamaba `nearestRoad(graph, target, from)`. Cuando la vivienda ya era el nodo
de carretera más cercano al vehículo (caso normal al terminar una cola), el parámetro `exclude`
descartaba precisamente el nodo de destino. La actividad de hogar podía entonces crear una ruta
que se alejaba de `homeTile`, dejando sin completar la llegada. La corrección permite que el destino
sea el mismo nodo que `from`; la prueba determinista `bounded-home` alcanza progreso `1` en menos
de 200 ticks.

**Cola lógica:** `trafficBehavior.ts` ahora mide `followingGap()` en unidades de progreso sobre
el mismo segmento dirigido y también entre el segmento de entrada y el siguiente segmento ocupado
por el líder. La prueba de tres vehículos confirma que los dos seguidores entran en estado
`following` y que el hueco medido no converge por debajo del umbral de seguimiento. Se mantiene
`enforceVisualGap()` como no-op; la separación ya no depende del renderizado.

**Verificación:** 15/15 pruebas Node y ambos `tsc --noEmit` locales pasan. `npm run typecheck`,
`npm run typecheck:frontend` y `npm test` no pueden arrancar porque el wrapper global
`/home/netss/.local/bin/npm` apunta a `/app/bin/host-spawn`, que no existe en este entorno; esto es
un problema de entorno, no del proyecto. No se declara nueva evidencia Playwright/JSON en esta
pasada hasta poder ejecutar un servidor reproducible; los diagnósticos continúan correctamente
gated por `window.__METROPOLICA_TRAFFIC_DEBUG__` / `TRAFFIC_DIAGNOSTICS`.

### Diagnóstico instrumentado de tráfico — 2026-07-22

**Hallazgos medidos antes de modificar la lógica:** el logger temporal de `citizenTransit` se
activó con `window.__METROPOLICA_TRAFFIC_DEBUG__` y Playwright capturó 2.060 registros de 10
vehículos en Tiny, incluyendo aproximación y espera ante señales.

- **Solapamiento/desalineación:** la posición lógica más el carril se desplazaba por
  `enforceVisualGap()` una media de 35,8 px y hasta 252 px respecto de la posición calculada.
  El empuje dependía del orden de dibujo y podía crecer al comparar posiciones ya empujadas; no
  era un error de `laneOffset()` ni de la proyección.
- **Velocidad errática:** el registro no mostró una velocidad física aleatoria: la decisión era
  binaria (`targetSpeed` 1/0), con cambio máximo observado de 0,125 en la muestra. Sí se confirmó
  que `dt` variable se multiplica directamente por `simulationSpeed=8`, haciendo visibles los
  saltos entre frames aceptados y frames de espera. El estado lógico y la interpolación no tenían
  una única velocidad acotada.
- **Parada fuera de línea:** el vehículo `periferia-citizen-13`, segmento `7,7>7,6`, quedó en
  `localProgress=0.7495` con señal roja; `stopBeforeJunction()` solo devolvía un booleano y la
  actualización atravesaba el umbral 0.55 antes de detenerse. La posición no era la línea de
  parada declarada.

La captura y el JSON pre-fix fueron `/tmp/metropolica-diagnostic-before-fix.png` y
`/tmp/metropolica-traffic-diagnostics.json`. Se elimina el logger del camino normal tras la
corrección; queda disponible únicamente detrás del flag explícito para futuras auditorías.

**Corrección aplicada y límite de esta pasada:** se retiró el empuje visual acumulativo de
`enforceVisualGap()` y se adelantó la decisión de frenado para evitar que un frame cruce la línea
de 55%. El logger quedó gated y el harness puede producir JSON con `TRAFFIC_DIAGNOSTICS`. Los
typechecks locales y las 15 pruebas Node pasan. La captura post-fix es
`/tmp/metropolica-traffic-after-fix.png`; confirma mapa, señales y vehículos activos, pero no se
marca como evidencia final de “sin overlap”: aún se observa concentración visual en una
intersección. El siguiente diagnóstico debe medir proximidad entre segmentos contiguos y ocupación
del nodo antes de aplicar otra corrección. `npm run ...` no pudo ejecutarse en este entorno porque
el wrapper global de npm apunta a `/app/bin/host-spawn`, inexistente; se ejecutaron los binarios
locales equivalentes.

### Blindaje de arranque y recuperación — 2026-07-21

- [x] `scripts/start.sh` usa lock atómico y metadata aislada en `.metropolica/run/` para evitar lanzamientos duplicados y recuperar artefactos huérfanos.
- [x] Los procesos se validan por PID, ejecutable/directorio y pertenencia al checkout; la limpieza termina únicamente grupos iniciados por esta ejecución.
- [x] Puertos 3000/3001 son preferidos, con fallback configurable; los overrides explícitos fallan con diagnóstico si están ocupados.
- [x] Health checks por capas validan proceso, JSON de `/api/state`, HTML de Next y proxy `/api/state`, con logs y causa resumida en el backlog.
- [ ] La prueba automatizada exhaustiva de escenarios de launcher queda pendiente; se verificó sintaxis y preflight local en esta pasada.

## Continuación — ciudad isométrica, vehículos y viviendas (2026-07-21)

### Implementado

- Se mantuvo el renderizado visual en Canvas 2D, usando detalles procedurales para terreno,
  vegetación, agua, edificios y vehículos; no se añadieron imágenes externas ni nuevas categorías
  de tiles.
- Los ciudadanos activos ahora usan vehículos Canvas 2D seleccionados de forma determinista según
  el ingreso del hogar: compact/pickup para ingresos bajos, sedan/SUV/minivan para ingresos medios,
  y sports/electric/limo para ingresos altos.
- Los vehículos respetan la perspectiva isométrica: su orientación se calcula con la dirección
  proyectada en pantalla, por lo que el dibujo gira correctamente cuando avanzan horizontal o
  verticalmente en la cuadrícula.
- Se retiró el fondo amarillo del marcador ciudadano y se conservó únicamente el indicador de
  selección.
- Se añadió separación visual y lógica básica de seguimiento entre vehículos, con desplazamiento
  lateral por carril para calles de dos sentidos y distancia mínima para evitar superposición.
- La lógica auxiliar de tráfico de carriles quedó separada en
  `frontend/src/lib/citizens/roadTraffic.ts` y `roadTrafficTypes.ts` para facilitar mantenimiento.
- Las viviendas residenciales adaptan su silueta procedural a ingreso/tamaño: casa individual,
  dúplex o edificio de apartamentos, incluyendo líneas de pisos para las viviendas agrupadas.
- Se añadió selección de casas residenciales desde el Canvas. El inspector muestra ubicación,
  distrito, tipo de vivienda, habitantes, ingreso del hogar y el tipo de vehículo asociado.
- El inspector de vivienda permite abrir el detalle individual de cada residente.
- Se corrigió el arranque del frontend cambiando Next.js de Turbopack a Webpack y limpiando la caché
  `.next`; el typecheck del frontend pasa sin diagnósticos.

### Pendiente de pulir antes de cerrar esta línea

- La asociación visual casa-hogar todavía usa datos agregados/heurísticos en algunos tiles; debe
  consolidarse para que cada vivienda individual represente exactamente un hogar y sus residentes.
- Debe garantizarse que todos los ciudadanos tengan `homeTile` válido, incluyendo ciudadanos no
  activos, sin usar césped como fallback cuando exista capacidad residencial.
- La distancia entre vehículos, el bloqueo de cruces y el respeto de semáforos deben convertirse en
  una única lógica de tráfico por carril, evitando colisiones entre direcciones opuestas y giros.
- Falta completar la animación de llegada: los autos deben entrar a la vivienda, reducirse hasta un
  punto y desaparecer sin reaparecer abruptamente.
- Falta una verificación visual en navegador de selección de casas, orientación de vehículos,
  colas, semáforos y desaparición al llegar.

### Cierre técnico de la pasada de pulido

- [x] La vivienda visual ahora se alimenta del `homeTile` real de cada ciudadano visible y agrupa
  habitantes por coordenada; el ingreso se resuelve desde el cohorte del `householdId`, sin usar el
  promedio del distrito para clasificar una casa con residentes.
- [x] `assignCommuteLocations()` asigna `homeTile` también a ciudadanos Level 2 cuando existe una
  vivienda residencial, manteniendo los cohortes como fuente autoritativa y dejando el fallback de
  césped solo para mapas antiguos sin casas.
- [x] El avance de tránsito combina separación mínima, desplazamiento determinista por carril y
  bloqueo por semáforo rojo en el nodo de intersección según el eje de movimiento. La espera ocurre
  antes de cruzar, y no se añadió estado al backend ni una nueva entidad de simulación.
- [x] Al llegar al destino, el vehículo conserva el viaje durante una fase de llegada de 1.2 s,
  reduce su escala progresivamente y desaparece en el punto de destino; la marca de consumo sigue
  disparándose una sola vez por ciudadano, actividad y día.
- [x] Verificación técnica: typecheck raíz, typecheck frontend y 14 pruebas Node pasan.
- [ ] Verificación visual de navegador sigue pendiente: confirmar en pantalla casas, colas,
  semáforos, orientación y desaparición. No se marca como observada sin capturas reproducibles.

### Verificación visual de tráfico — 2026-07-21

- [x] Se comprobó que no había procesos huérfanos escuchando en 3000/3001 (`lsof` vacío).
- [x] El bind dentro del sandbox falla reproduciblemente con `listen EPERM: operation not permitted 127.0.0.1`.
- [x] `scripts/start.sh`, backend y proxy Next ahora aceptan `METROPOLICA_BACKEND_PORT` y
  `METROPOLICA_FRONTEND_PORT`; fuera del sandbox se confirmó HTTP 200 en 3100/3101.
- [x] Playwright navegó end-to-end y produjo `/tmp/metropolica-dedicated-buildings.png` y
  `/tmp/metropolica-map-evidence.png`. La segunda demuestra que el Canvas carga, aunque el mapa
  quedó sin tiles en esa captura por el estado inicial del arnés; el overlay del menú fue retirado
  solo dentro de Playwright.
- [x] Se implementó el dibujo de dos cabezales por cruce en `drawTrafficSignalHeads()`, usando la
  misma fase pura `signalVisualState()` que la lógica de movimiento.
- [x] La detención roja se adelanta al 55% del segmento de entrada mediante `stopBeforeJunction()`;
  se añadieron pruebas de punto de detención y estado visual del semáforo.
- [x] El harness reusable `frontend/scripts/verify/occupied-traffic-check.ts` reinicia Tiny por API,
  recarga para evitar la carrera de estado, cierra `Continuar` y espera que `.menu-overlay` desaparezca.
  Si un entorno de desarrollo deja el modal pegado por HMR, lo retira únicamente dentro del contexto
  de prueba y lo registra como fallback; no modifica la aplicación.
- [x] Verificación real contra Next producción: `METROPOLICA_BACKEND_PORT=3100 node scripts/serve.ts`,
  `METROPOLICA_BACKEND_PORT=3100 next build` y `next start -p 3101`. Playwright confirmó
  `menuDismissedByReact=true`, 30 ciudadanos Level-3, 80 intersecciones y generó
  `/tmp/metropolica-occupied-traffic.png`.
- [x] La captura muestra el mapa activo, múltiples vehículos y cabezales de señal rojos/verdes en
  cruces. Las aserciones Canvas pasaron: `signalLike=19531`, `brightPixels=2432`.

### Tráfico — revisión de comportamiento

- [x] Se confirmó que la lógica de tráfico de ciudadanos estaba parcialmente mezclada dentro de
  `transit.ts`: el seguimiento usaba índices de ruta incompatibles entre vehículos y la separación
  visual dependía del orden de dibujo.
- [x] La decisión de movimiento quedó separada en
  `frontend/src/lib/citizens/trafficBehavior.ts`. Evalúa únicamente el mismo segmento y sentido,
  distancia de seguimiento, semáforo de entrada y cruce ocupado para ceder el paso.
- [x] Los autos que circulan en dirección opuesta ya no se consideran vehículos de adelante; los
  vehículos que atraviesan un cruce pueden bloquear temporalmente la entrada de otro vehículo.
- [x] El semáforo se evalúa por eje y por avance dentro del segmento de entrada, con detención antes
  del nodo de intersección. La velocidad sigue limitada por el paso fijo de tránsito existente.
- [x] La separación visual quedó como función independiente (`enforceVisualGap`) y ya no modifica
  el progreso lógico ni empuja vehículos de forma acumulativa durante la simulación.
- [x] Se añadieron pruebas para seguimiento en el mismo sentido, circulación opuesta y detención en
  rojo. Typecheck raíz, typecheck frontend y las pruebas enfocadas pasan.
- [ ] Falta la comprobación visual final en navegador para calibrar escala, tiempos de espera,
  colas largas y giros en mapas reales; no se marcará como validada hasta observar capturas.

### Auditoría y corrección de agrupamiento visual de tráfico

- [x] La reproducción Playwright fue intentada antes del cambio. El sandbox bloqueó los binds de
  3000/3001 con `EPERM`; el arranque externo encontró el puerto 3000 ocupado y no permitió acceder
  al frontend. La evidencia visual nueva queda pendiente, no se declara observada.
- [x] `laneOffset()` ahora calcula la perpendicular real al vector proyectado isométrico. Antes
  aplicaba un desplazamiento diagonal que sacaba los vehículos del centro de la calzada.
- [x] La separación visual solo compara vehículos del mismo segmento y sentido. Se eliminó el
  empuje global entre autos de calles o direcciones diferentes, que dependía del orden de dibujo.
- [x] `trafficBehavior.ts` usa progreso local del tramo para semáforos y ocupación de cruces. La
  cesión se activa para tráfico transversal ocupado y no confunde vehículos opuestos del mismo eje
  con tráfico perpendicular.
- [x] La asignación de destinos incorpora cupos deterministas por tile: residencial nivel bajo 1,
  nivel medio 2 y nivel alto 4; destinos laborales usan cupos derivados del nivel del tile. Cuando
  se agota el cupo, conserva el fallback estable sin crear entidades ni alterar los cohortes.
- [x] La suite completa queda en 15/15 pruebas aprobadas y los typechecks raíz/frontend pasan.
- [ ] Falta una captura visual reproducible con puertos disponibles para validar escala del auto,
  colas largas, cruces y llegada a viviendas. `git diff --check` conserva un aviso preexistente en
  `js/constants.js:45` sobre una línea en blanco final, no introducido por esta corrección.

## Authorized workstreams — commute delay Phase 1 + dedicated hospital/mall-government Phase 1

**Design decisions before implementation:**

- Workstream A defines an abnormally long active route as more than
  `max(12, 2.5 × Manhattan(homeTile, workTile))` route nodes. The result is deterministic and
  derived from the existing citizen transit trip; it is cosmetic/Inspector-only in Phase 1.
  It is exposed as `commuteDelayState` in the view/Inspector data rather than overwriting
  `currentProblem`, which already carries inspection, organization and crisis causes. It does not
  affect routine choice, opinion, approval, social-risk or crime.
- Workstream B uses an optional `TileState.specialty` subtype with values `hospital` and
  `mall-government`, while retaining `type: bldg-c`/`zone-c`. This preserves existing EconomyLoop,
  proximity and commercial zoning behavior and limits downstream changes to coverage, workplace
  classification and Canvas 2D rendering. Placement reuses `PLACE_ZONE`, the existing grass
  validation and the existing commercial-zone cost, with the specialty carried on the typed command.
- Hospital supply is sourced from dedicated hospital tiles only. Bomberos, ocio and telefonía remain
  on the documented shared-commercial fallback and are explicitly deferred to a future checkpoint.
  The renderer reuses the existing procedural tier system; no new tile category or external art
  pipeline is introduced.

**Phase 1 implementation status and verification:** Workstream A now derives `commuteDelayState`
(`inactive`, `normal`, or `delayed`) from the active route on the existing transit cadence. It is
shown in the citizen Inspector and is not read by opinion, approval, social-risk or crime code;
the focused tests cover the strict threshold, deterministic repeated reads, day changes and Level-3
driving/Level-2 non-driving behavior. Workstream B carries the two specialties through `PLACE_ZONE`,
map generation and `/api/tilemap`, keeps the underlying `bldg-c`/`zone-c` category, renders both with
Canvas 2D procedural tier drawings, routes hospital coverage only to hospital tiles, and lets hospital
and government occupations select the dedicated destinations. A manual Playwright run placed both
specialties successfully (HTTP 200) and the inspected Canvas 2D map showed their distinct dedicated
building treatment; the Inspector showed a Level-3 driving citizen with `Commute: Normal`. The run
did not encounter a delayed route, so delayed-state visual confirmation remains pending rather than
being marked as observed.

Phase 2 of Workstream A (commute delay affecting opinion/approval/social risk) remains a separate
authorization checkpoint. Bomberos, ocio and telefonía remain on the generic commercial fallback and
require a separate future checkpoint.

### Task — visual asset audit follow-up

- [x] Verify the Canvas 2D asset path: `isoRenderer.ts` uses the procedural residential, commercial
  and industrial tier renderers plus the existing Central/Parque drawings; hospital and
  mall-government use the new specialty procedural renderer. The current Playwright screenshot
  showed the active map and distinct specialty building treatment after both placements returned
  HTTP 200.
- [ ] Future visual check: inspect all three tiers for hospital and mall-government at normal and
  zoomed-out Canvas 2D scales, then record screenshots. This remains renderer verification only; no
  new tile/building categories are authorized.
- [ ] Keep the documented fallback gap visible: bomberos, ocio and telefonía still use the generic
  developed-commercial accent/coverage fallback and need separate authorization for dedicated art.

### Verification follow-up — root typecheck and commute-delay trigger

- Root cause fixed: the root `package.json` had no root `typescript` dependency or lockfile and its
  `typecheck` script incorrectly delegated to the frontend installation. Root `typescript` and
  `@types/node` are now declared in `devDependencies`, `package-lock.json` is present, and the
  commands are separated into `npm run typecheck` (root project) and `npm run typecheck:frontend`.
  `./node_modules/.bin/tsc --noEmit -p tsconfig.json` passes with zero diagnostics.
- The deterministic focused test crosses the existing threshold: home `(0,0)`, work `(4,0)` gives
  `max(12, 2.5 × 4) = 12`; route length `12` is `normal`, while route length `13` is `delayed`.
  Repeated reads remain `delayed`, and the regression assertion confirms approval `0.8` and crime
  risk `0.1` remain unchanged. This is the verified trigger evidence; the prior browser run only
  showed `Commute: Normal`, so no Inspector claim for a naturally delayed citizen is being made.

## Ambient vehicle removal and Canvas 2D asset check

Ambient traffic vehicles and their erratic movement have been removed from the active renderer:
`useMapRenderer.ts` no longer creates or advances the traffic runtime, while the citizen transit
renderer remains active. The compatibility traffic handles remain inert so existing interaction
code cannot create environmental vehicles. The active Canvas 2D visual path draws terrain, water,
procedural residential/commercial/industrial tiers and the existing Central/Parque silhouettes directly
through code; it does not depend on an external building-art pipeline. No new tile or building types were
introduced. The prior traffic-light visual verification is superseded
for ambient vehicles: signal/spacing behavior is no longer part of the active map, and the
Playwright aid remains available only for future Canvas 2D/citizen rendering checks.

## Traffic/signal regression and asset audit — status

**Root cause:** the Sprint 21 traffic runtime was removed from the active refactor path. Commit
`d9708b8` still had `createTrafficSystem`, `drawSemaphores()` and the `traffic.updateAndDraw()`
call in `CanvasMap.tsx`; the current `useMapRenderer.ts` instead exposed a permanently empty traffic
wrapper and never advanced or drew traffic. The signal state helpers remained in `trafficSystem.ts`,
which made the regression look like a signal-state problem even though the render/update path had
been dropped.

**Fix:** restored the frontend-only runtime as `frontend/src/lib/trafficRuntime.ts` and connected it
from `useMapRenderer.ts`. It reuses `trafficSystem.ts`'s graph, route and directional signal helpers,
draws separate horizontal/vertical heads, preserves cars across road-graph rebuilds, and keeps all
vehicle kinds deterministic. Same-segment vehicles now enforce a minimum progress gap; red signals
hold a vehicle at `0.72` progress on the incoming tile segment, before the intersection boundary,
and release it only when the existing axis signal is green. No simulation state, command or economy
effect was added. Runtime and map-renderer files remain under 200 lines.

**Canvas 2D inventory:** procedural residential, commercial and industrial tier 0/1/2 renderers
are drawn by `isoRenderer.ts`; `drawPowerPlant()` and `drawPark()` are also wired in their existing
Central/Parque slots. Vehicle variants are private car, taxi, bus, fire truck, police, ambulance and
VIP, selected deterministically across the existing ambient pool. The active renderer is code-drawn
and does not require external building-art files. The documented Phase 1 gap remains: hospitales,
bomberos, ocio and telefonía use the shared developed-commercial placeholder for coverage/accent
supply; no new building or tile types were added.

**Verification:** Playwright is installed only in `frontend.devDependencies`; the manual,
throwaway `frontend/scripts/verify/traffic-visual-check.ts` is not wired into tests, CI or builds.
It selected Tiny, clicked “Empezar de cero”, waited for the active map and captured four frames in
`/tmp/metropolica-traffic-1.png` through `-4.png`. I inspected all four screenshots: the map was
active, separate horizontal/vertical signal heads were visible at the road intersections, their
lit red/green states changed between frames, traffic vehicles remained visibly separated on the
same approaches, and red-phase vehicles were stopped on the incoming road before the intersection
tile rather than inside it. No visual overlap or mid-intersection stop was observed in this pass.
Keep the Playwright aid for future visual checks; it remains manual and disposable rather than a
required project test.

## Stabilization and verification sprint — status

**1. TypeScript configuration:** complete. The root `tsconfig.json` now uses `ESNext` with
`Bundler` resolution and `allowImportingTsExtensions`, plus the local Node type root. The root
headless source check and the frontend Next.js check both pass with the local TypeScript binary in
one verification sequence; the former extension-resolution failure is resolved.

**2. Live browser/API verification:** partially complete with recorded limits. Outside the sandbox,
the backend and Next frontend responded successfully on ports 3000/3001. API resets returned the
five expected non-square dimensions: Tiny 24×18, Small 48×36, Big 96×72, Very big 128×96 and
Enormous 160×120. Save/load returned HTTP 200 for every size, and the Very big tilemap returned
12,288 tiles. Existing headless/transit tests cover non-square routing, road edits preserving trip
state and first-arrival consumption dispatch; however, direct visual confirmation of minimap
dragging, rendered traffic, business accents and the browser-visible first-arrival event was not
possible because this environment has no browser automation surface. The launcher itself cannot
bind ports inside the sandbox (`EPERM`); an external server was already occupying the ports during
the API checks.

**3. Citizen destination metadata:** complete and verified. `workplaceType`, stable `workTile`,
`commercialTile` and `refuelTile` are preserved through reassignment and simulation ticks, and the
Inspector/API exposes the metadata after activation. Focused tests cover occupation classification,
profile preservation, stable destination assignment and activation preserving an in-progress trip.

**4. Restart-and-inspect:** complete through a clean `/api/reset` followed by `/api/inspect` for
`centro-citizen-1`. The state response included the Nemotron-derived age, occupation, education,
skills, aspirations and traits; activation then returned `workplaceType: comercio / mall`, home and
work tiles, and the derived routine.

**5. Final verification:** complete. All 12 test files pass, including the focused destination
metadata tests; `node test/headless-simulation.ts` completes successfully; root and frontend
TypeScript checks pass; and `git diff --check` reports no whitespace errors. The root config includes
the modern frontend sources while excluding the intentionally legacy vanilla compatibility modules
already excluded by the frontend config. A short refactor pass kept the destination logic in its
existing classification/destination modules and exposed only a small transit progress diagnostic
needed by the activation-preservation test.

**Next scope checkpoint proposal:** Phase 2b service coverage affecting crime/social risk is now
authorized with explicit deterministic values and remains separate from implementation. The next unrelated
checkpoint should prioritize either deepening citizen agency through the commute-delay backlog or Phase C
infrastructure/employment feedback. Commute delay still requires an explicit affected personal field and a
decision about whether it remains Inspector-only or feeds approval/social risk. Phase C still requires a
clear recourse/floor design to avoid negative-treasury spirals.

## Scope authorization — service coverage affects approval (Phase 2a) and crime/social-risk (Phase 2b)

Authorized by Rodrigo and formalized before implementation as two independent pathways:

**Phase 2a — authorized and implemented:** low service coverage reduces district approval through the
existing opinion/approval aggregation system. Service weights are based on social criticality:

- **Critical tier:** agua, electricidad, seguridad, hospitales, bomberos. Coverage shortages have
  a strong, meaningful approval impact because these are survival and safety services.
- **Convenience tier:** internet, telefonía, residuos, ocio, gasolina, supermercado. Shortages
  nudge approval down mildly and must not dominate the result.

The approval effect is deterministic and one-directional: coverage affects approval; approval does
not reduce coverage or create a feedback loop.

**Phase 2b — implemented:** low district coverage of seguridad, hospitales or bomberos increases the
existing crime/social-risk value. Convenience-tier services never affect
crime. The approved deterministic design values are:

- Coverage threshold: `0.8` for each of the three critical services.
- Per-service normalized deficit: `clamp((0.8 - coverage) / 0.8, 0, 1)`.
- Aggregate deficit: equal-weight mean of seguridad, hospitales and bomberos deficits.
- Maximum added crime/social-risk penalty: `0.15`.
- Final coverage penalty: `min(0.15, aggregateDeficit × 0.15)`.

The `0.15` cap is intentionally lower than Phase 2a's `0.30` approval cap so missing services remain
a meaningful crime pressure without overpowering the existing employment, trust, organization and
policy signals. The calculation must run on the existing social-risk cadence, derive a fresh value
from current district coverage and never accumulate the previous coverage penalty.

The direction is strictly `coverage → crime/social-risk`. Crime/social-risk must never affect service
coverage, placement approval, public approval or opinion. Reuse the existing social-risk/crime module
and fields; district aggregate only; no citizen-level state changes, new randomness or new simulation
entities. Keep every affected implementation file at or under approximately 200 lines and add focused
tests independent from Phase 2a.

**Phase 2a status:** implemented in `src/simulation/opinion/index.ts`. The weekly opinion tick derives
a fresh tier-weighted coverage penalty using a `0.8` threshold and `0.30` maximum penalty, applies it
after existing opinion channels, and removes only the prior coverage penalty before recalculation so
unchanged coverage remains stable.

**Phase 2b status:** implemented in `src/simulation/social-risk/index.ts`. Sprint 3 retains its existing
district aggregate fields (`social.crimeRisk` and `social.atRisk`) and weekly recalculation cadence. The
new deterministic effect reads only seguridad, hospitales and bomberos, applies the equal-weight `0.8`
threshold deficit and adds a fresh penalty capped at `0.15` to the existing crime-risk result; it never
accumulates across ticks. Convenience services are excluded. Focused tests verify the strict boundary,
repeated-read determinism, high-coverage base case, weekly refresh and unchanged approval/opinion fields.
No visual/live confirmation has been performed yet; browser verification of the district crime display
remains pending.

**Phase 2b district-panel status:** implemented in `frontend/src/components/Dashboard.tsx`. The Distritos
tab now displays `Riesgo social` beside Aprobación and Ingreso promedio, formatted as a percentage from
the existing `district.social.crimeRisk` value in `/api/state`. No simulation logic, state, command or
endpoint was added. Frontend TypeScript verification passes with the local compiler; live visual
confirmation comparing low and high public-safety coverage remains pending because this environment
cannot bind the development backend port (`EPERM` on `0.0.0.0:3000`).

## Investigation — Day 0 crisis tint

**Finding:** `DistrictSocial.atRisk` is initialized as `false` in the scenario content, but that value is
not authoritative after reset. `ScenarioRunner` constructs `SocialRiskLoop` immediately, and its constructor
calls `recalculate()` before Day 0 is exposed. That method computes `district.social.crimeRisk` and sets
`atRisk = crimeRisk > 0.70`. The renderer then passes that district-wide boolean to `drawCrisisTint` for
every tile owned by the district.

For a fresh `ciudad_dividida` reset with seed `1` and the default scenario values, the observed Day 0
state is: Centro `crimeRisk=0.155` / `atRisk=false`, Periferia `0.839` / `true`, and Zona Industrial
`0.210` / `false`; city approval remains `0.90` and treasury `$100,000`. Thus the apparent widespread
red is Periferia's district-wide tint, not every district being at risk.

**Root cause classification:** this is primarily an intended initial-condition outcome, not a boolean
initialization bug. Periferia starts with `unemployment=0.70`, institutional trust `0.10`, water and
electricity coverage approximately `0.094` and `0.125`, and safety `0.60`; hospitales and bomberos start
at zero coverage. Sprint 3's pre-existing water/electricity deficit and socioeconomic formula already
produce substantial risk. Phase 2b then adds its authorized public-safety coverage penalty (`0.1125`
for this exact service mix), increasing the margin above the existing `0.70` threshold but not causing
the crossing: Sprint 3 alone is already `0.7264`. Centro and Zona Industrial also receive the Phase 2b
penalty but remain below the threshold. No crime/social-risk code writes back into coverage, approval or
opinion.

**Next steps proposed:** keep Phase 2b unchanged for now and decide separately whether the scenario's
Day 0 infrastructure/trust/unemployment values are intended to represent an already distressed city,
or whether the presentation should distinguish baseline underdevelopment from an active crisis. Any
threshold, starting-state, tint-scope or grace-period change should be authorized as a separate design
decision and tested against the current Sprint 3 and Phase 2b regressions.

## Investigation — Periferia Day 0 risk breakdown

**Scratch calculation, seed 1 / Day 0:** Periferia has one household cohort, so its weighted income
variance/inequality term is `0`. The existing Sprint 3 raw-risk terms are:

- unemployment: `0.70² = +0.4900`;
- institutional trust: `0.10`, therefore `-0.1000` in the raw formula;
- pre-existing water/electricity coverage deficit: `1 - min(0.09375, 0.125) = +0.90625`;
- raw Sprint 3 risk before exponentiation: `0.4900 + 0 + 0.90625 - 0.1000 = 1.29625`;
- Sprint 3 transformed risk without Phase 2b: `1 - exp(-1.29625) = 0.726444`.

Phase 2b reads seguridad `0.60`, hospitales `0`, and bomberos `0`. Their normalized deficits are
`0.25`, `1`, and `1`; the equal-weight mean is `0.75`, producing a specific Phase 2b addition of
`0.75 × 0.15 = 0.112500` (below the `0.15` cap). The final value is therefore
`0.726444 + 0.112500 = 0.838944`, and `atRisk` is true because it exceeds `0.70`.

**Counterfactual:** Periferia was already above the threshold without Phase 2b (`0.726444 > 0.70`).
Phase 2b increases the margin but does not cause the threshold crossing. The same Day 0 breakdown for
the comparison districts is:

| District | Unemployment term | Trust term | Sprint 3 coverage deficit | Risk without Phase 2b | Phase 2b addition | Final risk | atRisk |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Centro | +0.0064 | -0.6500 | +0.6875 | 0.042950 | +0.112500 | 0.155450 | false |
| Periferia | +0.4900 | -0.1000 | +0.90625 | 0.726444 | +0.112500 | 0.838944 | true |
| Zona Industrial | +0.0100 | -0.5500 | +0.642857 | 0.097744 | +0.112500 | 0.210244 | false |

All three districts start with seguridad `0.60`, hospitales `0`, and bomberos `0`, hence the same
Phase 2b addition. The difference is driven by the pre-existing Sprint 3 socioeconomic and utility
inputs, especially Periferia's unemployment and institutional trust.

**Seed/size check:** Periferia produced the same values for seeds `1`, `2`, `7`, and `42` at sizes
`tiny`, `big`, and `enormous`: risk without Phase 2b `0.726444`, Phase 2b addition `0.112500`, final
`0.838944`, `atRisk=true`. This is consistent across seeds because seeded randomness changes the map
layout, while the scenario's district and household definitions supply these risk inputs. Tiny maps
also emit unrelated minimum-residential-tile warnings for some seeds.

**Design-intent check:** `src/content/scenarios/ciudad_dividida.ts` explicitly labels Periferia with
the notes `"Crecimiento rápido"` and `"Cobertura inicial baja"`, and defines population `1200`, income
`1300`, trust/institutional trust `0.10`, unemployment `0.70`, and reduced water/electricity capacity.
There is no separate low-income archetype or comment that changes the crime threshold, but the starting
values clearly encode a disadvantaged/low-coverage district.

**Current `atRisk` consumers:** Sprint 3's organizations loop uses it to gate district organization
behavior; the opinion loop uses transitions to emit `crime`/`crime_resolved` footprints; and rendering
uses it for the red crisis tint (the active Canvas renderer and legacy rendering paths). No code found
uses it to write or directly alter approval, coverage, migration, or citizen state. This remains a
diagnostic-only entry; no calculation or threshold was changed.

## Scope authorization — Phase B: treasury expenses + commercial/industrial revenue integration

Authorized by Rodrigo and formalized before implementation:

The existing weekly `EconomyLoop`/treasury tick may be extended with two integrated effects:

1. **Revenue integration:** `district.economy.commercialRevenue` and
   `district.economy.industrialRevenue`, produced by Phase A citizen consumption, feed into
   `taxesCollected` alongside existing income-tax revenue. Shopping and refueling must therefore
   increase treasury through the existing weekly economy path, not only affect wages or district
   bookkeeping.
2. **Recurring expenses:** weekly treasury outflows may be added for:
   - Infrastructure maintenance proportional to placed infrastructure already represented by
     existing tile/district state: calles, parques and centrales eléctricas.
   - Public-service salaries proportional to offered coverage for agua, electricidad, seguridad,
     hospitales and bomberos. Higher coverage costs more to maintain.

The cadence must match `taxesCollected`, producing one coherent weekly balance:

`weekly treasury change = taxes + commercial/industrial revenue - maintenance - service salaries`

Constraints: deterministic; no new randomness or simulation entities; reuse existing tile, coverage
and economy fields; affected files at or under approximately 200 lines. The implementation must
also prevent an unrecoverable negative-treasury spiral through a floor or another clear signal;
the exact recourse mechanism remains a required proposal decision before implementation.

## Scope authorization update — driving citizen count increased

Authorized by Rodrigo; supersedes the original 8-citizen cap. The concurrent driving/active
Level-3 pool may increase to a benchmarked value in the 30–50 range, selected from measured
CPU, memory and frame-time cost. It remains a bounded deterministic pool, not one citizen per
resident/cohort and not full-population simulation. Existing routine and simulation-causality
constraints remain unchanged.

**Driving pool scale phase:** deterministic startup promotion now activates 30 Level-2 citizens.
Selection remains global and ordered; if fewer than 30 candidates exist, all available candidates
are promoted without inventing citizens or requiring equal district quotas.

**Citizen module boundary:** routine/activity, classification, spatial destination, frontend
transit and destination presentation now have dedicated module entry points under
`src/simulation/citizens/` and `frontend/src/lib/citizens/`. Compatibility exports preserve the
existing behavior while consumers migrate to the separated boundaries.

**Single-node arrival fix:** citizen transit now retains a route that resolves to one road node,
marks it as arrived, and renders the citizen at the actual home/work destination tile instead of
dropping the trip. Coverage includes the home-return case.

**Daily state-request stall fix:** citizen routines are cached by citizen signature and simulated
day in `citizenViewState()`. Repeated `/api/state` and `/api/inspect` reads reuse the same routine;
the cache refreshes only when a day or routine-affecting citizen field changes.

**Home activity arrival fix:** unresolved routes now retain an arrival trip and snap the citizen to
the intended home/work tile, with a development warning identifying the citizen and target. Transit
also synchronizes the latest `/api/state` day/hour before movement evaluation, closing the stale
activity window between polling and the render loop.

**Current activity display:** `frontend/src/lib/citizens/activity.ts` is the shared source of truth
for routine category, icon, color and label. The map marker shows a small activity badge and the
Inspector summary shows the same activity prominently; both update from the current routine block
without adding simulation state.

**Smooth HUD clock and control feedback:** the displayed clock now interpolates locally between
backend snapshots using the selected simulation speed, while server state remains authoritative.
Day-jump and speed buttons show a pending active state, disable during the request, and refresh the
HUD after completion.

**Routine cache performance fix:** derived citizen routines are cached by citizen ID, simulated day
and routine-affecting signature. Repeated `/api/state` and `/api/inspect` reads reuse the cached
result; day changes or activation-signature changes recompute it. `+7d`/`+30d` remain synchronous.
Full state serialization remains a known future optimization if profiling shows residual stalls.

## Scope authorization — proximity-based zoning economics

Authorized by Rodrigo before implementation:

- Player-placed Residential, Commercial, and Industrial zones gain deterministic economic effects from tile proximity.
- Residential tiles near commercial/mall tiles receive a positive income/value modifier.
- Residential tiles near industrial tiles receive a negative income/value modifier, representing lower-income housing patterns.
- The effect must apply through `district.economy.averageIncome` or an equivalent per-tile/per-cohort value, reusing existing EconomyLoop and zoning fields rather than creating a parallel economic system.
- Proximity is computed deterministically from the existing tile map and existing zone types; no new randomness is authorized.

This authorization does not cover new tile/building types, new UI, or new citizen-level behavior beyond the already authorized driving, shopping, refueling, and meeting work.

Implementation must proceed in small, independently testable phases with explicit before/after verification of `district.economy.averageIncome`, following the caution used for the CanvasMap refactor and citizen-movement work.

## Scope authorization — informal income floor for high-unemployment cohorts

Authorized by Rodrigo before implementation:

- If formal disposable income (`grossIncome - taxPaid - monthlyCost`) is negative, replace it with a minimum
  informal/subsistence income floor representing activity outside the formal employment model.
- Positive disposable income is unchanged; this applies only to the negative-result case.
- Scope is limited to households/economy. Migration between districts or out of the city, and links between
unemployment/income and crime or social-risk fields, remain unauthorized and separate.

## Backlog — commute-delay citizen state (not yet scoped)

Idea from Rodrigo; not authorized for implementation. Citizens whose home/work or other routine
commute takes abnormally long may eventually receive a personal-state decrease. The affected stat,
whether the effect is cosmetic/Inspector-only or connects to opinion, approval or social risk, and
the definition of “abnormally long” remain undecided. Requires a formal scope-authorization pass
after the current transit and arrival bugs are stable.

**Informal income floor phase:** implemented. `simulateHouseholdTick()` uses 25% of monthly household
costs only when formal disposable income is negative; district aggregation no longer serves as the
economic clamp and retains only a documented non-finite-value guard. Periferia and extreme-unemployment
tests confirm a positive subsistence value while healthy cohorts remain unchanged.

**Proximity economics phase:** the deterministic residential proximity modifier is implemented
through ZoningLoop cache invalidation and EconomyLoop aggregation. Commercial adjacency provides
a distance-decayed bonus and industrial adjacency a corresponding penalty; placement/demolition
recomputes only the affected district cache. The scan is placement-time work, not per-frame work,
but the current nearest-tile implementation is O(residential tiles × candidate tiles) for the
affected district, acceptable for commands but worth profiling on Very big/Enormous maps.

**Proximity income floor fix:** negative Periferia income was traced to the underlying household
disposable-income calculation falling below zero, not to compounded proximity modifiers. The
EconomyLoop still recomputes from fresh weekly outputs and applies the cached modifier once; a
minimum average income of 1 now prevents invalid negative district values. Repeated 30-day-style
aggregation tests confirm the floor is stable. A large treasury increase observed during +30d
was not causally connected to proximity averageIncome; it remains flagged as a separate economy/
tax-loop investigation.

**Zone placement validation:** residential, commercial, and industrial zones now require an
existing grass tile. The authoritative zoning command rejects attempts to overwrite buildings
or place zones on water, sand, roads, parks, trees, or infrastructure without charging the
treasury; coverage includes blocked-building and invalid-terrain cases.

**Phase 1 — Ambient traffic replacement:** anonymous traffic spawning and vehicle identity have
been removed from the frontend. `trafficSystem.ts` now exposes only road graph, routing, and
signal services for citizen transit. Citizen driving promotion is intentionally deferred to
Phase 2, so the map temporarily renders no traffic vehicles.

**Phase 2 — Citizen driving migration:** the former eight ambient slots now promote eight
deterministically selected pool citizens to Level 3 at startup. Citizen transit owns their
movement and rendering; Inspector activation is idempotent for driving citizens and does not
create duplicate records or trips. The project typecheck command now invokes the installed
frontend TypeScript binary directly, avoiding the broken npx wrapper.

**Phase 2 movement/classification fix:** citizenTransit was already called every animation frame;
the apparent freeze came from routine rendering pinning citizens to home/work outside transfer
blocks. It now uses the existing route progress for active citizens every frame. Workplace
classification now distinguishes industry, commerce/mall, government, and health/hospital from
the occupation field, with existing commercial/industrial tiles retained as spatial fallbacks.

**Stable activity destinations:** citizen transit now resolves one home/work target per routine
activity block and simulated day, rebuilds the BFS route only when that activity changes, and
stops at the target instead of reversing indefinitely.

**Distributed citizen destinations:** home and workplace tiles now use a deterministic citizen-id
hash across all matching district tiles. This prevents avoidable same-tile assignment without
adding occupancy/capacity state; a single available tile may still be shared.

**Citizen arrival presentation:** BFS routes still remain road-only, but arrived citizens now render
at their actual home/work tile center with a small deterministic per-citizen offset instead of
stopping at the nearest shared road node.

**Inspector summary/detail view:** the citizen Inspector opens in a compact summary showing identity,
district, occupation, current routine activity and destination. `Ver más` reveals the existing full
profile and routine details; the toggle is local to the selected Inspector instance.

**Sprint 21 follow-up — Directional intersection signals**

Traffic intersections now use coordinated axis-specific signals. Horizontal traffic receives
green/yellow phases while vertical traffic is red, then the phases swap. Vehicles consult the
signal for their actual movement axis before entering an intersection, and the renderer displays
separate, spatially separated heads for the horizontal and vertical directions. Traffic and
citizen movement continue updating in the background when their low-zoom visuals are hidden.

Traffic vehicles now use compact pixel-art variants for private cars, taxis, buses, fire trucks,
police cars, ambulances and VIP vehicles. Variants are assigned deterministically to the existing
ambient traffic pool and share the same road routes, signal rules and background-update behavior.
Selecting an ambient vehicle now shows its variant, route endpoints and current road position,
and the camera follows that vehicle while it moves.

**Sprint 21 — City-size selection and dimension-aware map rendering**

Completed:

- New-city menu now offers five map sizes: Tiny, Small, Big, Very big and Enormous.
- Map dimensions are generated from the selected city size and returned through game state;
  the frontend no longer assumes a fixed `MAP_COLS × MAP_ROWS` grid.
- Isometric camera centering, depth sorting, hover bounds, click hit-testing, minimap scaling
  and minimap dragging all consume the live map dimensions.
- Traffic graph construction and routing use the active map dimensions, including non-square maps.
- Random city creation uses `crypto.getRandomValues()` with a timestamp fallback instead of the
  low-range `Math.random()` seed path.
- The Metropolica brand in the HUD opens the main menu, and the size selector is styled for the
  dark Spanish UI.
- Server reset/state handling now preserves the selected city dimensions so save/load and map
  rendering remain aligned.

Verification: frontend TypeScript compilation passes with `npx tsc --noEmit -p frontend/tsconfig.json`;
the procedural-building follow-up also passes `git diff --check`. Full browser verification should
cover each city size, save/load, minimap navigation and traffic on a freshly started local server.

**Sprint 20 — Procedural pixel buildings with simulation-driven growth tiers**

Building tiles now use code-drawn Canvas 2D pixel art through dedicated procedural renderer modules.
Residential buildings use house roofs, commercial
buildings use storefront blocks, and industrial buildings use factory blocks and smokestacks.
Each zone has three visual tiers: undeveloped lot, small building, and developed building.
Central power plants now use a blocky substation/power-line silhouette, and Parque tiles use
procedural grass, paths, and trees. Both remain static infrastructure visuals because the current
game state has no separate power-output or park-development tier.
The first-pass tier formula uses district population, average income, and approval; it is applied
in the frontend from existing `/api/state` data and does not mutate simulation state. Terrain and decorative building visuals are generated directly in Canvas 2D. The adapted isometric
coordinate approach remains credited separately where applicable.

Follow-up fix: procedural building, power-plant and park renderers now paint the full terrain
diamond before their footprint. No opaque black base or building shadow is drawn; all nine
zone/tier combinations plus Central and Parque therefore remain seated on terrain instead of
revealing the canvas background.

**Sprint 19 — Canvas 2D render optimization and traffic/inspection fixes**

The former external-art rendering experiment is superseded. The active renderer uses procedural Canvas 2D
for terrain, buildings, infrastructure and specialty structures, keeping visual creation simple for coding
agents and avoiding large decoded image dependencies.

Completed:

- Isometric tiles are culled against the canvas viewport with a margin; the renderer reports
  `[render-benchmark]` samples containing FPS, average frame time, visible tile count, total tile count
  and zoom for before/after verification in the browser console.
- Normal and low zoom use the same procedural drawing system with scale-aware detail reduction.
- Inspection activation returns the affected citizen in the `/api/inspect` response and logs the
  resulting level/cause on the backend, making the Activar/Desactivar chain observable.
- Traffic vehicles stop before intersection nodes while the shared signal is red.
- Legacy chroma-key and external-art cleanup paths are no longer part of the active renderer.

Verification note: the frontend compiled successfully during `next build`, but the build worker exited
before completing its final TypeScript phase in this constrained environment. A targeted TypeScript scan
reported no errors in `isoRenderer.ts`, `CanvasMap.tsx`, `trafficSystem.ts`, or `Dashboard.tsx`. Live API
verification was blocked because the sandbox disallows binding port 3000; browser console and backend log
evidence remain available when running `./start.sh` locally.

Road polish remains unchanged because no specific road defect was provided; it needs Rodri's concrete
visual feedback before further changes.

**Sprint 18 follow-up — Citizen data, purposeful destinations, and UI inspection**

The active work is now focused on making the small individually tracked citizen subset
understandable and traceable in the map UI. Restart the backend after simulation-model changes so
citizens are rebuilt from the current Nemotron-derived sample pool.

## Current implementation snapshot

Completed:

- `scripts/start.sh` starts backend and frontend together, writes service logs, and maintains
  `STARTUP_BACKLOG.md` for startup failures.
- The isometric renderer uses procedural pixel-art buildings for residential, commercial and
  industrial zones, with three growth tiers driven by district population, average income and
  approval. Central power plants and Parque tiles also use procedural silhouettes and decoration.
- Building renderers paint the complete terrain diamond before the footprint, eliminating the
  solid black square/base artifact across all nine zone-tier combinations, Central and Parque.
- The active procedural Canvas 2D path draws terrain and buildings directly, anchors structures to
  tile bottoms, and renders roads with distinct asphalt plus adjacency-aware markings.
- The map generator, frontend canvas, minimap and traffic system share the live city dimensions
  selected from the main menu rather than relying on fixed constants.
- Ambient traffic (`frontend/src/lib/trafficSystem.ts`) uses a shared road graph and preserves car
  progress when roads are edited. Buildings do not rebuild traffic.
- Active Level-3 citizens have backend-owned home/work tiles and commute markers in
  `frontend/src/lib/citizenTransit.ts`. Citizen activity is preserved when another citizen is
  activated or when buildings/roads are edited; only a new simulated day changes commute direction.
- Citizen clicking uses the Inspector tool and shows identity, district, Nemotron profile fields,
  activation cause/problem, home/work, shift, and workplace classification.
- The top HUD metrics are shortcuts: population opens active/inactive citizens, approval opens
  opinion, and time/treasury open the city panel. Clicking the same shortcut again closes it.
- Minimap is visible by default on the right, draggable, clickable for camera movement, and hideable.
- Simulation clock displays `HH:MM`, with speed controls `1×`, `2×`, `4×`, and `8×`.

Recent citizen-data fix:

- `content/citizens/sample_pool.json` already contains education, household type, municipality,
  region, language and rich interests from the Nemotron preparation pipeline.
- `src/simulation/citizens/index.ts` now copies those fields into each citizen, adds `districtId`,
  and classifies work destinations from occupation/interests (government, commerce/mall, farm, or
  industry). Existing map types are used as temporary spatial fallbacks because dedicated
  government/mall/farm building types do not yet exist.
- The inspector formats numeric vectors to two decimals. If an old running backend still shows `—`
  for these profile fields, stop it and restart with `./start.sh`.

Verification baseline:

- `node --test test/**/*.test.ts`: 3/3 passing.
- Modified frontend files have no targeted TypeScript errors. The repository still has a known
  unrelated TypeScript configuration error for backend `.ts` import extensions when invoking the
  frontend compiler across the whole project.

Next recommended steps:

1. Restart and inspect `centro-citizen-1` to confirm the full Nemotron profile appears through
   `/api/state`, not only in the frontend.
2. Add explicit destination metadata (`workplaceType` and a stable destination tile) to the citizen
   inspector/minimap and verify occupation-to-destination mappings with tests.
3. Introduce dedicated government, mall and farm tile/building types only when authorized; keep
   the current zone fallback until renderer assets and simulation zoning rules exist.
4. Add focused tests for profile field preservation, destination classification, and activation
   not resetting existing citizen-trip progress.
5. Run a real browser verification: activate two citizens, confirm both markers move, add a building,
   add a road, and confirm neither marker nor ambient traffic restarts.

## Sprint 18 — Purposeful citizen movement

Implemented the first home-to-work commute layer for the existing active Level-3 citizen subset:
- Added backend `homeTile` and `workTile` assignments to individually active citizens, selected from their district's residential and commercial/industrial tiles.
- Exposed citizen commute assignments through `/api/state` alongside the existing citizen state.
- Exported the shared road graph and BFS route finder from `frontend/src/lib/trafficSystem.ts`.
- Added `citizenTransit.ts`, which routes active citizens over the shared road network and reverses commute direction on each simulation day.
- Citizen markers are visually distinct from traffic cars and emit periodic real-coordinate transit snapshots for verification.
- Cohorts and inactive Level-2 citizens remain aggregate/unmoved.

Known simplification: occupations map to industrial work for production/manufacturing roles and commercial work otherwise; school, hospital and other trip purposes are not modeled.

Completed in this sprint:
- **Coordinate math** (`frontend/src/lib/isoMath.ts`): Implemented `gridToIso` and `isoToGrid` transforms adapted from `isometric-city`'s `gridToScreen`/`screenToGrid` (MIT). Standard 2:1 isometric ratio — tile diamond 64 × 32 px.
- **Isometric renderer** (`frontend/src/lib/isoRenderer.ts`): Canvas 2D drawing for terrain, water, roads, trees, bridges, buildings and district-crisis overlays. Visual elements are generated procedurally in code rather than loaded from external building-art files.
- **Depth-sorting** (painter's algorithm in `CanvasMap.tsx`): Tiles are rendered back-to-front ordered by `col + row` sum, ensuring foreground tiles correctly overlap background tiles in isometric perspective.
- **`CanvasMap.tsx`** fully rewritten (~150 lines): Camera pan/zoom preserved, mouse click now uses `isoToGrid()` for accurate screen→grid hit-testing, hover highlight draws an isometric diamond outline.
- **`THIRD_PARTY_LICENSES.md`** retains attribution for the adapted coordinate math and architectural references only.
- All 5 backend tests pass — no simulation logic was touched.

**Sprint 15 — Full Spanish localization (UI text)**

Completed in this sprint:
- Audited all React components under `frontend/src/` for English strings.
- Created `frontend/src/lib/labels.ts` — lightweight centralized translation map with a `t(key)` function.
- `Dashboard.tsx` updated: service labels (`water→Agua`, `electricity→Electricidad`, `waste→Residuos`, `safety→Seguridad`), organization types (`UNION→Sindicato`, `BUSINESS→Negocios`, `CRIMINAL→Criminal`, etc.), and district IDs (`centro→Centro`, `periferia→Periferia`, `zona_industrial→Zona Industrial`) all pass through `t()`.
- All other components (`HUD`, `Sidebar`, `MainMenu`) confirmed fully Spanish.
- 5/5 backend tests still pass.

**Sprint 14 — Migrate frontend to Next.js/React (foundation for future IsoCity-derived systems)**

Completed in this sprint:
- Migrated the vanilla JS frontend to a Next.js (App Router) + React + TypeScript stack (`frontend/`).
- **`next.config.ts`**: Configured API rewrites to proxy `/api/:path*` to the existing Node backend (`scripts/serve.ts` running on port 3000), keeping simulation logic cleanly separated from UI.
- Ported rendering and UI logic into React components within `frontend/src/components/`:
  - `GameProvider`: Centralizes game state (treasury, tools, UI modal open/close) and fetches from the backend.
  - `CanvasMap`: Holds the 2D rendering loop (using `requestAnimationFrame`) and camera pan/zoom mechanics, keeping the `isometric-city` MIT-licensed pattern.
  - `HUD`, `Sidebar`, and `MainMenu`: Refactored from `chunk_*.js` into stateless or lightweight React components.
- Added `THIRD_PARTY_LICENSES.md` crediting the `isometric-city` project (MIT) for the architectural approach.
- Updated `package.json` with a new `dev` command that runs both the Node backend and Next.js frontend concurrently.
- All 5 headless backend tests passed. State correctly persists across page reloads via the backend `/api/save` endpoints from Sprint 13.


**Sprint 13 — Main menu (new city / continue / load / save)**

Completed in this sprint:
- **`scripts/serve.ts`**: Introduced a single-slot in-memory save system. Added `/api/save`, `/api/load`, and `/api/save/exists` endpoints. Refactored `/api/reset` to optionally take a specific random seed for map generation.
- **`src/simulation/scenario/index.ts`**: Introduced `serialize()` and `deserialize()` to save/restore the dynamic simulation state (city, cohorts, citizens, clock day, opinion footprint log) seamlessly.
- **`src/simulation/scenario/map.ts`**: Updated `generateInitialMap` to accept a random seed.
- **`js/chunk_10.js`** (new, 69 lines): Built a main menu overlay UI that injects over the canvas upon load. Hooks to the new server endpoints. Checks `/api/save/exists` on load to grey out "Cargar partida" if no backend save exists. "Continuar" closes the overlay.
- **`components/main_menu.html`**: A clean, modular, semi-transparent overlay UI following the design aesthetics of Metropolica.
- No local storage was used; the Node server remains the single source of truth for the active run and the saved snapshot.

**Sprint 12 — Backend as single source of truth for map layout (remove localStorage)**

Completed in this sprint:

- **`src/simulation/models.ts`**: Introduced `TileState` type and extended the `District` interface to hold an array of `tiles`. This aligns with the rule of keeping data structures nested within existing simulation boundaries.
- **`src/simulation/scenario/map.ts`**: Ported the entire procedural map generation logic (`initTileMap`) from the frontend into a standalone server-side function, which is now invoked in `ScenarioRunner`.
- **`src/core/commands/index.ts`**: Updated `PlaceZoneCommand` and `DemolishTileCommand` to include `col` and `row` coordinates so the server knows exactly where edits occur.
- **`src/simulation/districts/zoning.ts`**: Modified `ZoningLoop` to explicitly search and mutate the `tiles` array on the targeted district, ensuring real-time mapping consistency.
- **`js/`**: Removed all `localStorage` logic that cached the layout (specifically stripping `saveMap()`). 
- **`js/chunk_7.js`** (`fetchState`): Now extracts the current tile map directly from the backend API payloads (via `simState.districts.tiles`) and dynamically patches the frontend `tileMap`.
- Refactored `initTileMap` entirely out of `chunk_1.js` since generation is purely server-side now. Re-wired the Reset button to call `/api/reset` exclusively.
- All 5 tests passed; reloading the page pulls authoritative map state strictly from `/api/state`.

*(Note: The `localStorage` caching introduced in a previous unplanned step has been formally reverted, consolidating truth back to the headless simulation server).*

  | Zone type | Simulation field nudged | Rationale |
  |-----------|------------------------|-----------|
  | `zone-r`  | `district.population += 8` | Housing capacity proxy; same field EconomyLoop reads |
  | `zone-c`  | `district.economy.employment += 0.005` (max 0.98) | Commercial activity creates jobs; same field crime formula reads |
  | `zone-i`  | `district.economy.averageIncome += 50` | Industrial wage lift; same field household tick reads |
  | `park`    | `district.social.trust += 0.01` (max 1.0) | Green space / social cohesion proxy |
  | `power`   | `district.services.electricity.capacity += 500` | Reuses UtilityState.capacity that UtilitiesLoop already manages |
  | `road`    | no direct simulation field | Infrastructure; impact tracked only on tile map |
  | `demolish`| `district.population -= 4` (min 0) | Partial reversal of zone-r proxy |

- **`src/simulation/scenario/index.ts`**: `ZoningLoop` instantiated alongside the other system loops; wired to the shared `CommandDispatcher`.
- **`js/chunk_4.js`** (`placeTile`): Now `async`; dispatches `PLACE_ZONE` or `DEMOLISH_TILE` via the existing `postCommand()` API layer. Optimistic UI check uses `simState.treasury` (real snapshot) instead of a local copy. `localTreasury` removed from this path entirely.
- **`js/chunk_4.js`** (`updateTreasuryDisplay`): Reads `simState.treasury` — no local variable.
- **`js/chunk_1.js`**: `localTreasury` global variable removed. Comment documents the design intent.
- **`js/chunk_7.js`** (`fetchState`): Removed the `localTreasury` sync logic; `simState` is the single source of truth for all HUD values.
- **`js/chunk_2.js`** (`drawTile`): Fixed road visual orientation. Added `isRoad` neighbor sampling (col, row) so road dashes map horizontally, vertically, or as cross intersections dynamically. Bridges follow E-W water orientation.
- **`js/chunk_7.js`** and **`js/chunk_4.js`**: Implemented map persistence (`saveMap()`) in browser cache (`localStorage`). Map autosaves when placing tiles or natural growth, and loads automatically on refresh. The "Restart" button correctly clears the cache.
- All 5 existing tests pass (`node --test test/**/*.test.ts`). Smoke test confirmed treasury deduction and population nudge via dispatched commands.

Architecture boundary respected: `src/simulation/districts/zoning.ts` imports only from `core/` and `simulation/`; no imports from `rendering/`, `ui/`, or `js/`.

## Sprint history

- **Sprint 0:** repository scaffold, deterministic clock, command dispatcher, basic City/District types.
- **Sprint 1:** household cohorts, economy aggregation, taxation and treasury loop.
- **Sprint 1.5:** treasury/tax audit and weekly-income diagnostics.
- **Sprint 2:** water/electricity capacity, coverage, investment and decay.
- **Sprint 3:** crime risk, corruption risk and policy levers.
- **Sprint 4:** gangs, contractor networks, organization lifecycle and economic suppression.
- **Sprint 5:** public opinion through social media, newspapers, word of mouth and press conferences.
- **Sprint 6:** authored `Ciudad dividida` scenario, scenario runner and console harness.
- **Sprint 6.5:** opinion balance audit, recovery footprints, channel tuning and a winning replay.
- **Sprint 7A & 7B:** Nemotron integration, citizen routines, cohort feedback loops, and web dashboard.
- **Sprint 8:** Dashboard state exposure — organizations panel, corruption dial, footprint log, opinion channel breakdown, citizen trigger detail, treasury weekly income.
- **Sprint 9:** First rendering slice — static pixel-art district grid via Canvas 2D (`src/rendering/`), pure layout math with unit tests, canvas mount in web dashboard.
- **Sprint 10:** Transitioned to full-screen interactive game map, procedural tile generation, interactive build tools, animated pedestrians, HUD transition, and extreme modularization of frontend codebase.
- **Sprint 11:** Wired frontend build tools to real simulation — new `PLACE_ZONE`/`DEMOLISH_TILE` commands, server-side treasury validation, `ZoningLoop` applying zone effects to simulation fields, `localTreasury` removed in favour of `simState.treasury`.

## Repository structure

```text
index.html       Web UI entry point.
scripts/         
  serve.ts       Native HTTP simulation API and static assets web server.
css/             Modularized CSS styles (base, components, hud, modals).
js/              Modularized frontend engine (map, camera, entities, render, input, ui, api, main).
components/      HTML partials for the UI (toolbar, dashboard).
src/
  core/
    clock/       Deterministic daily/weekly/monthly simulation clock.
    commands/    Typed player-command dispatcher; state changes cross this boundary.
    random/      Seeded deterministic randomness.
  simulation/
    models.ts    City, district, utility, social and organization state types.
    households/  Aggregate household cohorts and pure needs/stress calculations.
    economy/     District aggregation, household/economy loop and treasury updates.
    utilities/   Generic water/electricity capacity, demand, coverage and decay.
    social-risk/ Crime and corruption formulas plus social policy commands.
    organizations/ Gangs and contractor networks with shared lifecycle logic.
    opinion/     Event footprints, channel transforms and approval aggregation.
    citizens/    Small Level-2/Level-3 citizen subset and activity scoring.
    scenario/    Generic scenario initialization and win/loss evaluation.
  content/
    scenarios/   Declarative scenario definitions, including Ciudad Dividida.
    citizens/    Static offline citizen sample pool and attribution notes.
    policies/    Declarative policy-content placeholder.
    events/      Declarative event-content placeholder.
    occupations/ Declarative occupation-content placeholder.
  rendering/     Backend Canvas 2D static district grids.
  ui/            UI placeholder panels, maps, reports and notifications.
test/
  clock.test.ts         Deterministic clock tests.
  citizens.test.ts      Citizens integration, activation lifecycle, and CPU performance tests.
  headless-simulation.ts Cross-system diagnostic simulation.
  play-scenario.ts      Console-playable Ciudad Dividida harness.
content/
  citizens/sample_pool.json  Checked-in citizen flavor profiles.
```

## Sprint 17 — Basic vehicle traffic

- Added frontend-only ambient traffic in `frontend/src/lib/trafficSystem.ts`.
- Maintains a fixed pool of eight generic cars, interpolates them between adjacent `road`/`bridge` tiles, turns at intersections, and respawns at another road node when a path ends.
- `CanvasMap.tsx` updates and draws traffic in its existing animation loop; the road graph is rebuilt from the live `tileMapRef`, so roads added through the build tool are picked up after the next tile refresh.
- No pedestrians, traffic lights, vehicle classes, commands, economy effects, or core/simulation imports were added.

## Important architecture rules

1. `core/` and `simulation/` must remain headless. They must never import from `rendering/` or `ui/`.
2. Cohorts are the authoritative population model. Individual citizens are a small Level-2/Level-3 subset,
   never a full-population simulation.
3. Content belongs in declarative files under `content/`; system logic should interpret generic data.
4. The clock is deterministic and multi-scale. Systems subscribe to daily, weekly or monthly ticks;
   do not create parallel timers.
5. Player actions enter through typed commands. UI or harness code must dispatch commands rather than
   mutate simulation state directly.
6. Events and footprints need traceable causes. Avoid unexplained randomness.
7. Nemotron data is synthetic and may contain stereotypes or unverified associations. It may provide
   profile variety and flavor only. It must never derive crime propensity, corruption propensity or
   political leaning from demographic or textual attributes.
8. Shared formulas are reused rather than copied between cohorts, households and citizens.
9. Keep files around 200 lines or fewer. Split by responsibility when a file grows beyond that signal.
10. After functionality works, perform a short refactor pass before moving on.

## Useful commands

The repository uses Node's TypeScript execution directly; the local npm wrapper may not be available in
every environment.

```bash
node --test test/**/*.test.ts
node test/headless-simulation.ts
node test/play-scenario.ts
node scripts/prepare-citizens.ts <local-huggingface-export.json>
```

Equivalent package scripts are available where npm is configured:

```bash
npm test
npm run simulate
npm run play
npm run typecheck
npm run typecheck:frontend
```

## Current scope boundaries

## Scope authorization — full consumption/business economic loop

Authorized by Rodrigo before implementation, with phased verification:

- Citizen shopping/refuel activities may become economically causal: disposable income funds deterministic consumption,
  the amount credits the destination district's existing commercial or industrial economy aggregate, and that revenue
  may feed the existing `taxesCollected` path into treasury.
- “Businesses” remain existing commercial/industrial zone tiles and district economy fields; no new simulation entities,
  tile types, citizen-level persistent state or randomness are authorized.
- Phase A: deduct a small deterministic shopping/refuel amount from cohort disposable income and credit the destination
  district aggregate. Phase B: include that aggregate in `taxesCollected` and verify treasury growth. Phase C is a
  separate future checkpoint for treasury-funded infrastructure/investment feedback into existing employment/capacity.
- Implementation must reuse routine/, `destinations.ts`, `classification.ts`, EconomyLoop, ZoningLoop and the existing
  proximity/informal-income mechanisms, with each phase independently tested before the next.

## Scope authorization — service coverage expansion

Authorized by Rodrigo before implementation and extended through the separate Phase 2a/2b authorization above:

- Phase 1 extends the existing `UtilityState`/district-panel coverage pattern beyond Agua, Electricidad,
  Residuos, Seguridad and Internet to gasolina, supermercado, hospitales, bomberos, ocio and telefonía.
- Phase 1 reuses existing district service structures, calculations and coverage bars.
- Phase 2a may affect district approval, and Phase 2b may affect district crime/social-risk, only through the
  explicit aggregate formulas and one-directional boundaries documented above.
- No citizen-level service consequences, new randomness or new simulation entities are authorized.
- Existing gas-station/supermarket procedural Canvas 2D accents remain the spatial presentation.

**Phase A status:** implemented. `CITIZEN_CONSUMPTION` is validated server-side with a transient
cohort/day/activity cap; shopping and refueling deduct bounded disposable income and credit the
district commercial/industrial revenue aggregates without changing taxes or treasury. Citizen transit
dispatches the command only on the first arrival transition, and developed building tiles receive
deterministic supermarket/fuel accents. Backend/frontend typecheck and 8/8 tests pass. Live browser
verification of arrival dispatch and the visual accents remains required.

**Service coverage Phase 1 status:** implemented. The six new services use the existing
`UtilityState` capacity/demand/coverage calculation and the existing district-panel bars. Gasolina and
supermercado use deterministic developed-building accent supply; hospitales, bomberos, ocio and telefonía
use a documented shared-placeholder fallback from the same developed commercial-building pool. The same
commercial building may therefore contribute to all four fallback coverages simultaneously until dedicated
building types exist. No citizen, approval, opinion, crime, economy or treasury effects were added.

**Procedural residential minimum:** newly generated maps now run a deterministic post-classification pass
that guarantees up to 12 road-adjacent `bldg-r` tiles per district, preserving the existing seeded zone
distribution otherwise. Small maps use every eligible plot and emit a development warning when 12 cannot
be reached; grass fallback remains for old saves and other edge cases. Same-seed, multi-seed, dominance and
small-map degradation tests pass.

Do not add full-population agents, Nemotron runtime calls, social graphs, generative narrative, new scenarios, elections, pollution or new causal power for citizens unless a future scope authorization explicitly permits it.

Likely next decisions are: connecting the frontend building mechanics directly to the backend simulation (converting map edits into simulation state modifiers), or deepening citizen agency.
The cohort-first simulation model and ethical dataset boundary remain hard constraints.

## Agent checklist

Before changing code:

1. Read `.claude/skills/metropolica-design/SKILL.md` completely.
2. Read this file and identify the current sprint and scope boundary.
3. Search for existing formulas and interfaces before adding parallel logic.
4. Check imports to preserve simulation/rendering/UI separation.
5. Keep new files small and run the headless tests after the change.
