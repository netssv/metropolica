# VISUAL_ASSETS.md — Metropolica · Catálogo de Assets Visuales
# Motor gráfico: Canvas 2D puro (NO se usan sprites/imágenes externas)
# Propósito: referencia para agentes IA y desarrolladores sobre qué gráficos
# están implementados, cuáles faltan, y cómo agregarlos.
# Última actualización: 2026-07-20

---

## ⚠️ DECISIÓN DE ARQUITECTURA — Leer antes de generar cualquier asset

**Metropolica usa exclusivamente Canvas 2D primitivas** para todos los gráficos:
- `fillRect`, `arc`, `beginPath`, `ellipse`, `strokeRect`
- Sin imágenes externas, sin sprite sheets, sin drawImage()
- Todo el render está en `js/render_1.js` y `js/render_2.js`

**Razones:**
1. Sin dependencia de archivos externos — carga instantánea
2. Gráficos escalables sin pérdida de calidad a cualquier zoom
3. Animaciones por frame sin sheets de animación
4. Peatones y overlays en tiempo real sin texturas

---

## Tiles implementados (Canvas 2D)

| ID | Nombre ES | Archivo | Técnica | Animado | Niveles |
|----|-----------|---------|---------|---------|---------|
| `grass` | Pasto | `render_1.js` | fillRect base + 2 manchas | ❌ | — |
| `water` | Agua | `render_1.js` | fillRect HSL dinámico + franja sin | ✅ por frame | — |
| `road` | Calle | `render_1.js` | fillRect asfalto + aceras + líneas | ❌ | — |
| `bridge` | Puente | `render_1.js` | fillRect agua + tablón + 8 barandas | ❌ | — |
| `tree` | Árbol | `render_1.js` | fillRect tronco + 3 arc copa | ❌ | — |
| `park` | Parque | `render_1.js` | fillRect + sendero X + 2 árboles + banco | ❌ | — |
| `sand` | Arena | `render_1.js` | fillRect beige + 2 manchas | ❌ | — |
| `zone-r` | Zona Residencial | `render_1.js` | fillRect + strokeRect + letra R | ❌ | — |
| `zone-c` | Zona Comercial | `render_1.js` | fillRect + strokeRect + letra C | ❌ | — |
| `zone-i` | Zona Industrial | `render_1.js` | fillRect + strokeRect + letra I | ❌ | — |
| `bldg-r` | Edificio Residencial | `render_1.js` | fillRect escalado por nivel + ventanas | ❌ | 1–4 |
| `bldg-c` | Edificio Comercial | `render_2.js` | fillRect cristal + reflejo + pisos + antena | ❌ | 1–4 |
| `power` | Central Eléctrica | `render_2.js` | fillRect poste + travesaños + 4 arc insuladores | ❌ | — |
| `police` | Comisaría | `render_2.js` | fillRect azul + fachada + bandera + letrero PD + sirena animada | ✅ sirena (azul/rojo) | — |
| `fire` | Bomberos | `render_2.js` | fillRect ladrillo + garage + ventanas + letrero FD + llama animada | ✅ llama (flicker) | — |
| `hospital` | Hospital | `render_2.js` | fillRect gris + bloque blanco/gris + cruz roja + helipuerto H | ❌ | — |
| `school` | Escuela | `render_2.js` | fillRect pasto + ladrillo + tejado + puerta + ventanas + reloj | ❌ | — |

### Entidades móviles — Peatones

Implementados en `js/pedestrians.js` con Canvas 2D puro:

| Elemento | Técnica | Zoom mínimo |
|----------|---------|-------------|
| Sombra | `ellipse` semitransparente | 0.35 |
| Cuerpo | `arc` color por distrito | 0.35 |
| Cabeza | `arc` beige `#f4c49a` | 1.0 |

Colores por distrito:
- Periferia → `#86efac` (verde claro)
- Centro → `#a5f3fc` (azul claro)
- Zona Industrial → `#fbbf24` (amarillo)

---

## Tiles PENDIENTES — Canvas 2D

Estos tiles NO existen aún. Deben implementarse en `js/render_1.js` siguiendo el patrón estándar.

### Edificios públicos (tiles de T.*)

| ID sugerido | Nombre | Técnica Canvas propuesta | Prioridad |
|-------------|--------|--------------------------|-----------|
| `police` | Comisaría | Implementado en `render_2.js` | ✅ Listo |
| `fire` | Bomberos | Implementado en `render_2.js` | ✅ Listo |
| `hospital` | Hospital | Implementado en `render_2.js` | ✅ Listo |
| `school` | Escuela | Implementado en `render_2.js` | ✅ Listo |
| `city_hall` | Ayuntamiento | fillRect gris + columnas + cúpula arc | 🟡 Media |
| `market` | Mercado | fillRect naranja + toldo trapecio + mesas | 🟢 Baja |
| `transit` | Parada de bus | fillRect gris + poste + techo | 🟢 Baja |
| `stadium` | Estadio | fillRect verde + elipse campo + graderías | 🟢 Baja |
| `cemetery` | Cementerio | fillRect gris oscuro + cruces | ⚪ Opcional |

### Entidades móviles — Autos (NO implementados)

El motor actual NO tiene autos. Pendiente crear `js/vehicles.js`.

| Tipo | Técnica Canvas propuesta | Dir | Estado |
|------|--------------------------|-----|--------|
| Sedán básico | fillRect carrocería + arc ruedas + ventanas | N/S/E/W | ❌ Pendiente |
| Taxi | Sedán + techo amarillo + letrero | N/S/E/W | ❌ Pendiente |
| Patrulla | Sedán azul/blanco + arco luz estroboscópica | N/S/E/W | ❌ Pendiente |
| Ambulancia | fillRect blanco + cruz roja + luz | N/S/E/W | ❌ Pendiente |
| Camión | fillRect largo + cabina + ruedas grandes | N/S/E/W | ❌ Pendiente |
| Bus | fillRect muy largo + ventanas en fila | N/S/E/W | ❌ Pendiente |

### Mejoras a tiles existentes

| Tile actual | Mejora propuesta | Técnica |
|-------------|-----------------|---------|
| `road` | Variantes H/V/cruce/curva | 4 casos según tile vecino |
| `bldg-r` | Jardín/árbol base nv1 | arc pequeño en base |
| `grass` | Variante con flores | arc mini puntos de color |
| `park` | Fuente animada | arc + sin(t) radio |
| `water` | Botes/canoas | fillRect pequeño flotante |
| `tree` | Variante temporada | HSL dinámico color hoja |

---

## Tabla de priorización

| 🔴 1 | Variantes de road (H/V/cruce) | Alto — calles más detalladas |
| 🟡 2 | Añadir tile `city_hall` | Medio — nuevo tipo zona pública |
| 🟢 3 | Sistema de autos `js/vehicles.js` | Medio — movimiento vial |
| 🟢 4 | Mejoras a peatones (animación pasos) | Medio — caminata realista |
| ⚪ 5 | Tiles decorativos (fuente, flores) | Bajo — variedad ambiental |

---

## Patrón estándar para agregar un tile Canvas 2D

### 1. Constante en `js/constants.js`

```js
const T = {
  // ...existentes...
  POLICE: 'police',
};
```

### 2. Case en `js/render_1.js` (función drawTile)

```js
case T.POLICE:
  // Base
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(wx, wy, ts, ts);
  // Edificio
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(wx + ts*0.1, wy + ts*0.25, ts*0.8, ts*0.7);
  // Letrero
  if (ts >= 16) {
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.max(7, ts*0.28)}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PD', wx + ts/2, wy + ts*0.55);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  // Sirena (animada)
  if (Math.sin(t * 4) > 0) {
    ctx.fillStyle = 'rgba(239,68,68,0.8)';
    ctx.beginPath();
    ctx.arc(wx + ts*0.5, wy + ts*0.2, ts*0.08, 0, Math.PI*2);
    ctx.fill();
  }
  break;
```

### 3. Nombre en `js/ui_1.js` (TILE_NAMES)

```js
const TILE_NAMES = {
  // ...existentes...
  [T.POLICE]: 'Comisaría',
};
```

### 4. Costo en `js/constants.js` si es colocable por el jugador

```js
const TOOL_COSTS = {
  // ...existentes...
  police: 800,
};
```

### 5. Botón en `components/toolbar.html`

```html
<button class="tool-btn" data-tool="police" title="Comisaría ($800)">🚔</button>
```

---

## Reglas para agentes IA

```yaml
# MOTOR GRÁFICO:
  - TODO es Canvas 2D: fillRect, arc, strokeRect, ellipse, fillText
  - NO usar drawImage(), NO crear Image(), NO referenciar archivos PNG externos
  - NO sugerir sprite sheets ni texturas externas

# ANTES de implementar un tile nuevo:
  - Verificar que NO existe ya en render_1.js o render_2.js
  - Seguir el patrón estándar de 5 pasos de arriba
  - Mantener < 20 líneas de Canvas por tile para no superar el límite de 200 líneas/archivo

# ANIMACIONES permitidas (Canvas 2D):
  - Usar `t` (gameTime en segundos) que llega como parámetro a drawTile()
  - Patrón: Math.sin(t * velocidad + offset_posicion)
  - Ejemplos existentes: water (HSL oscilante), bldg-i (humo), bldg-c (futura: luz antena)

# PARA PEATONES:
  - Modificar solo js/pedestrians.js
  - Respetar el sistema de colores por distrito (periferia/centro/industrial)
  - Animación de pasos: oscilar posición con sin(gameTime * velocidad_ped)

# PARA VEHÍCULOS (futuro js/vehicles.js):
  - Misma estructura que pedestrians.js
  - Moverse solo en tiles road/bridge
  - Color por tipo: sedan=gris, taxi=amarillo, police=azul/blanco

# CONVENCIÓN de IDs de tile:
  - Terreno: grass, water, road, bridge, sand, tree, park
  - Zonas: zone-r, zone-c, zone-i
  - Edificios: bldg-r, bldg-c, bldg-i
  - Infraestructura: power, police, fire, hospital
  - Todo en minúsculas con guión
```

---

## Archivos de motor relacionados

| Archivo | Responsabilidad |
|---------|----------------|
| `js/constants.js` | Constantes `T.*`, `TOOL_COSTS` |
| `js/render_1.js` | `drawTile()` — grass, water, road, bridge, tree, park, sand, zones, bldg-r |
| `js/render_2.js` | `drawTile()` — bldg-c, bldg-i, power + render loop |
| `js/pedestrians.js` | Dibujo y movimiento de peatones (Canvas 2D arc) |
| `js/main.js` | Game loop, init(), evolveCityNaturally() |
| `js/map.js` | Generación procedural del mapa |
| `js/input_1.js` | placeTile(), tool system |
| `js/ui_1.js` | TILE_NAMES, inspectTile(), renderDistricts() |
| `src/rendering/gridPrimitives.ts` | Sistema TS legacy — referencia de tiles pendientes (police, fire) |
