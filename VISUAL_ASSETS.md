# VISUAL_ASSETS.md — Metropolica · Catálogo de Assets Visuales
# Motor gráfico: Canvas 2D puro (NO se usan sprites/imágenes externas)
# Propósito: referencia para agentes IA y desarrolladores sobre qué gráficos están implementados al 100%.
# Última actualización: 2026-07-21

---

## ⚠️ DECISIÓN DE ARQUITECTURA

**Metropolica usa exclusivamente Canvas 2D primitivas** para todos los gráficos:
- `fillRect`, `arc`, `beginPath`, `ellipse`, `strokeRect`, `fillText`
- Sin imágenes externas, sin sprite sheets, sin `drawImage()`
- El render modularizado se distribuye en `js/render_1.js`, `js/render_2.js`, `js/render_3.js` y `js/render_4.js` (respetando la regla de < 200 líneas por archivo).

---

## 🏠 Tiles Implementados — Terreno y Zonas (`render_1.js`)

| ID | Nombre ES | Técnica Canvas | Animado |
|----|-----------|----------------|---------|
| `grass` | Pasto | `fillRect` base + manchas + flores flotantes | ❌ |
| `water` | Agua | `fillRect` HSL dinámico + olas en `sin(t)` | ✅ Olas |
| `road` | Calle | `fillRect` asfalto + aceras + conexiones inteligentes H/V/cruces | ❌ |
| `bridge` | Puente | `fillRect` agua + plataforma de madera + barandillas | ❌ |
| `tree` | Árbol | `fillRect` tronco + 3 `arc` copa de follaje | ❌ |
| `park` | Parque | `fillRect` pasto + senderos cruzados + banco + fuente animada | ✅ Fuente |
| `sand` | Arena | `fillRect` beige + textura de dunas | ❌ |
| `zone-r` | Zona Residencial | `fillRect` + marco + indicador "R" | ❌ |
| `zone-c` | Zona Comercial | `fillRect` + marco + indicador "C" | ❌ |
| `zone-i` | Zona Industrial | `fillRect` + marco + indicador "I" | ❌ |

---

## 🏛️ Edificios y Niveles por Clase Social (`render_2.js` & `render_3.js`)

### 🏡 Residencial (`BLDG_R` — 4 Niveles por Clase Social)
| Nivel | Tipo | Clase Social | Técnica Canvas |
|-------|------|-------------|----------------|
| **1** | Casa Unifamiliar / Cabaña | Clase Baja | Tejado rojo a dos aguas (`moveTo/lineTo`), pared cálida, puerta y ventana |
| **2** | Dúplex / Chalet | Clase Media-Baja | Fachada 2 pisos, tejado plano oscuro, balcón y camino de gravilla |
| **3** | Edificio de Apartamentos | Clase Media | Ladrillo terracota 3 pisos, marquesina azul de acceso, 9 ventanas iluminadas |
| **4** | Torre Condominios de Lujo | Clase Alta | Rascacielos cristal panorámico azul, jardín en azotea y baliza roja animada |

### 🏪 Comercial (`BLDG_C` — 4 Niveles por Tipo)
| Nivel | Tipo | Técnica Canvas |
|-------|------|----------------|
| **1** | Tienda Local / Minimarket | Fachada azul, escaparate transparente, marquesina amarilla |
| **2** | Plaza Comercial / Galería | Estructura 2 niveles, balcones con escaparates iluminados y letrero |
| **3** | Supermercado / Mall | 3 plantas de vidrio templado, franjas reflectantes horizontales |
| **4** | Torre Corporativa Financiera | Rascacielos cristal neón panorámico con luz estroboscópica animada |

### 🏭 Industrial (`BLDG_I` — 4 Niveles por Tipo)
| Nivel | Tipo | Técnica Canvas |
|-------|------|----------------|
| **1** | Taller Mecánico / Artesanal | Nave baja de ladrillo/acero con portón metálico corredizo |
| **2** | Fábrica Manufacturera | Cuerpo de concreto con 1 chimenea echando humo suave animado |
| **3** | Planta Refinería | 2 chimeneas activas con humo denso + tanque cilíndrico de almacenamiento |
| **4** | Mega Complejo Industrial | 4 chimeneas activas con humo pulsante + luz roja de advertencia |

### 🚓 Servicios y Edificios Cívicos
| ID | Nombre ES | Archivo | Técnica Canvas | Animado |
|----|-----------|---------|----------------|---------|
| `power` | Central Eléctrica | `render_2.js` | Poste de alta tensión + cables + pulso amarillo | ✅ Pulso |
| `police` | Comisaría | `render_2.js` | Fachada azul + letrero POL + sirena estroboscópica | ✅ Sirena |
| `fire` | Estación Bomberos | `render_2.js` | Ladrillo + portón rojo + llama fleteante animada | ✅ Llama |
| `hospital` | Hospital | `render_2.js` | Estructura blanca + Cruz Roja + helipuerto H | ❌ |
| `school` | Escuela | `render_2.js` | Fachada escolar + tejado + campanario y reloj | ❌ |
| `city_hall` | Ayuntamiento | `render_3.js` | Fachada cívica + 4 columnas + cúpula dorada + bandera flameando | ✅ Bandera |
| `market` | Mercado Central | `render_3.js` | Toldos franjeados rojo/blanco + puestos multicolor | ❌ |
| `transit` | Estación Tránsito | `render_3.js` | Bahía de buses + marquesina + indicador neón BUS | ✅ Indicador |
| `stadium` | Estadio Deportivo | `render_3.js` | Graderías + cancha de fútbol + 4 focos reflectores | ✅ Focos |
| `cemetery` | Cementerio | `render_3.js` | Pasto oscuro + senderos + lápidas de piedra + cipreses | ❌ |

---

## 🚗 Entidades Móviles — Vehículos (`vehicles.js`)

Los vehículos transitan automáticamente por el carril derecho respetando las vías (`ROAD`, `BRIDGE`, `TRANSIT`):

| Categoría | Tipo (`type`) | Nombre ES | Técnica Canvas |
|-----------|---------------|-----------|----------------|
| **Clase Baja** | `compact` | Compacto Económico | Hatchback verde turquesa compacto |
| | `pickup_old` | Pickup de Trabajo | Camioneta café rústica con caja trasera y carga |
| **Clase Media** | `sedan` | Sedán Familiar | Sedán elegante gris plata con parabrisas |
| | `suv` | Camioneta SUV | SUV robusto gris oscuro con portaequipajes de techo |
| | `minivan` | Minivan Familiar | Minivan azul marino alargada |
| **Clase Alta** | `sports` | Deportivo de Lujo | Supercar rojo aerodinámico con alerón negro |
| | `limo` | Limusina Ejecutiva | Limusina extra larga negra con cristales tintados |
| | `electric` | EV Eléctrico Neón | Auto blanco perlado con franja neón azul brillante |
| **Servicios** | `taxi` | Taxi Urbano | Carrocería amarilla con letrero negro |
| | `police` | Patrulla Policía | Carrocería azul/blanca con sirena roja/azul animada |
| | `ambulance` | Ambulancia | Carrocería blanca con cruz roja |
| | `truck` | Camión Carga | Cabina roja + gran contenedor plateado corrugado |
| | `bus` | Autobús Urbano | Carrocería azul larga + techo blanco + filas de ventanas |

---

## 🚶 Entidades Móviles — Peatones (`pedestrians.js`)

Peatones clasificados por tipo y rol social con oscilación de paso `sin(t)` y tonos de piel variados:

| Tipo (`pedType`) | Rol / Clase | Apariencia Visual |
|------------------|-------------|-------------------|
| `worker` | Obrero (Baja) | Casco de seguridad amarillo + uniforme azul |
| `casual` | Casual (Media) | Vestimenta informal en variados colores de acento |
| `executive` | Ejecutivo (Alta) | Traje elegante oscuro con corbata |
| `student` | Estudiante | Mochila morada en la espalda + ropa ligera |
| `elder` | Anciano | Cabello canoso + bastón de madera + ritmo lento |
| `tourist` | Turista | Sombrero de sol + cámara fotográfica colgada |
| `police` | Policía | Uniforme oficial azul oscuro + gorra |
| `child` | Niño/a | Escala pequeña + movimientos ágiles |

---

## 📊 Estado de Cobertura
- **Tiles de Terreno / Zonas**: 100% Completado (10/10)
- **Edificios por Clase/Nivel**: 100% Completado (12/12)
- **Servicios y Cívicos**: 100% Completado (10/10)
- **Vehículos**: 100% Completado (13/13)
- **Peatones**: 100% Completado (8/8)
- **Vista Previa Interactiva**: Disponible en [preview_tiles.html](file:///home/netss/Projects/Metropolica/preview_tiles.html)

## Auditoría del renderer actual — 2026-07-21

La ruta activa es `frontend/src/lib/isoRenderer.ts` + `frontend/src/lib/buildingSprites.ts` y usa
Canvas 2D procedural; no carga sprites externos. Todos los tipos que puede producir
`generateInitialMap()` tienen una ruta activa: `grass`, `water`, `sand`, `tree`, `road`, `bridge`,
`park`, `power`, `bldg-r`, `bldg-c`, `bldg-i`, `zone-r`, `zone-c` y `zone-i`.

La implementación activa tiene tiers `0|1|2`, no cuatro niveles: tier 0 es lote/silueta, tier 1
es edificio bajo y tier 2 es edificio desarrollado. Las casas ocupadas reciben además el perfil
real visible del hogar y se dibujan como casa, dúplex o apartamento según tamaño/ingreso. Las
especialidades `hospital` y `mall-government` reutilizan el asset comercial con su variante
procedural correspondiente. Los vehículos activos son `compact`, `pickup_old`, `sedan`, `suv`,
`minivan`, `sports`, `electric` y `limo`; las categorías taxi/patrulla/ambulancia/bus de la tabla
histórica no son emitidas por el tránsito actual.

Los tiles `bridge` tienen asset propio dentro de `drawRoad()`: agua visible alrededor del tablero,
superficie de madera, líneas de circulación, barandales laterales y un soporte central. No se
confunden con una carretera terrestre.

Los edificios comerciales/industriales de borde acuático usan especialidades procedurales
`fish-market`, `pier`, `customs` y `water-treatment`, seleccionadas por proximidad al agua. Se
renderizan con paleta azul, señalética de muelle/mercado o depósitos de tratamiento y reutilizan la
huella de los edificios existentes.
