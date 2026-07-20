import { readFile, writeFile } from "node:fs/promises";

type SourceRow = {
  uuid?: string;
  age?: number;
  occupation?: string;
  education_level?: string;
  household_type?: string;
  municipality?: string;
  department?: string;
  languages_spoken?: string;
  skills_and_expertise_list?: string | string[];
  hobbies_and_interests_list?: string | string[];
  career_goals_and_ambitions?: string;
  persona?: string;
  skills_and_expertise?: string;
  hobbies_and_interests?: string;
  cultural_background?: string;
  sports_persona?: string;
  arts_persona?: string;
  travel_persona?: string;
  culinary_persona?: string;
  family_persona?: string;
};

type Profile = {
  id: string;
  age: number;
  occupation: string;
  education: string;
  householdType: string;
  municipality: string;
  region: string;
  language: string;
  skills: number[];
  aspirations: number[];
  traits: number[];
  interests: string[];
};

function parseStringList(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Return as single item if not valid JSON array
      return [val];
    }
  }
  return [];
}

export function convert(row: SourceRow, index: number): Profile {
  const text = [
    row.persona || "",
    row.skills_and_expertise || "",
    row.career_goals_and_ambitions || "",
    row.hobbies_and_interests || "",
    row.cultural_background || "",
    row.sports_persona || "",
    row.arts_persona || "",
    row.travel_persona || "",
    row.culinary_persona || "",
    row.family_persona || "",
    row.occupation || ""
  ].join(" ").toLowerCase();

  const countKeywords = (words: string[]) => {
    let count = 0;
    for (const w of words) {
      // Escape word for regex
      const escaped = w.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(escaped, "g");
      const matches = text.match(regex);
      if (matches) count += matches.length;
    }
    return count;
  };

  // --- 10-20 Numeric Variables mapped into skills, aspirations, and traits arrays ---
  
  // SKILLS (4 variables)
  // 1. Technical / digital / vocational skills
  const techKeywords = ["mecánica", "moto", "consola", "videojuegos", "sistema", "computadora", "tecnología", "redes", "digital", "programa", "máquina", "herramientas", "construcción", "cocinar", "reparar", "conducir"];
  const techScore = Math.min(1.0, 0.1 + countKeywords(techKeywords) * 0.15);

  // 2. Professional / administrative / cognitive skills
  const profKeywords = ["docencia", "enseñar", "administrar", "gestión", "factura", "trámite", "presupuesto", "documentación", "finanzas", "ley", "auditoría", "escribir", "lectura", "estudio", "cálculo", "bachillerato", "universidad"];
  const profScore = Math.min(1.0, 0.1 + countKeywords(profKeywords) * 0.15);

  // 3. Social / interpersonal / sales skills
  const socialKeywords = ["cliente", "servicio", "hablar", "comunicación", "charlar", "panas", "amigo", "familia", "comunidad", "grupo", "ayudar", "reunión", "atención", "vecino", "vender", "ventas"];
  const socialScore = Math.min(1.0, 0.1 + countKeywords(socialKeywords) * 0.15);

  // 4. Adaptability / problem solving skills
  const adaptKeywords = ["calma", "imprevisto", "resolver", "independiente", "rápido", "iniciativa", "aprender", "adaptarse", "solución", "cambio"];
  const adaptScore = Math.min(1.0, 0.1 + countKeywords(adaptKeywords) * 0.15);

  // ASPIRATIONS (4 variables)
  // 1. Economic ambition / wealth creation
  const ambitionKeywords = ["sueña", "meta", "ambición", "negocio", "crecer", "éxito", "liderar", "aumento", "ahorrar", "comprar", "oficina", "propio", "inscribir", "ganar"];
  const ambitionScore = Math.min(1.0, 0.1 + countKeywords(ambitionKeywords) * 0.15);

  // 2. Stability / family comfort
  const stabilityKeywords = ["estabilidad", "tranquilidad", "seguridad", "familia", "casa", "hijos", "comida", "rutina", "quedarse", "cuidar"];
  const stabilityScore = Math.min(1.0, 0.1 + countKeywords(stabilityKeywords) * 0.15);

  // 3. Community orientation / local roots
  const communityKeywords = ["comunidad", "ayudar", "participar", "vecinos", "iglesia", "procesión", "compartir", "tradición", "feria", "cultura", "donar"];
  const communityScore = Math.min(1.0, 0.1 + countKeywords(communityKeywords) * 0.15);

  // 4. Geographic mobility / Emigration aspiration
  const emigrationKeywords = ["estados unidos", "ee.uu.", "emigrar", "viajar", "viaje", "frontera", "guatemala", "extranjero", "cruzar", "lejos"];
  const emigrationScore = Math.min(1.0, 0.1 + countKeywords(emigrationKeywords) * 0.15);

  // TRAITS (5 variables)
  // 1. Risk tolerance
  const riskKeywords = ["riesgo", "aventura", "cambiar", "moto", "emprender", "imprevisto", "independiente", "jugar", "apostar"];
  const riskScore = Math.min(1.0, 0.1 + countKeywords(riskKeywords) * 0.15);

  // 2. Sociability
  const sociabilityKeywords = ["amigo", "panas", "compa", "fiesta", "baile", "reunión", "charlar", "discoteca", "bar", "plaza", "compartir", "social"];
  const sociabilityScore = Math.min(1.0, 0.1 + countKeywords(sociabilityKeywords) * 0.15);

  // 3. Price sensitivity
  const priceKeywords = ["ahorrar", "barato", "precio", "descuento", "oferta", "económico", "gasto", "presupuesto", "costo", "limitar"];
  const priceScore = Math.min(1.0, 0.1 + countKeywords(priceKeywords) * 0.15);

  // 4. Institutional / State trust
  const trustKeywords = ["trámite", "registro", "oficial", "alcaldía", "estado", "gobierno", "seguro", "institución", "mercantil", "permiso", "ley"];
  const trustScore = Math.min(1.0, 0.1 + countKeywords(trustKeywords) * 0.15);

  // 5. Recreation preference: outdoor/active (high) vs indoor/quiet (low)
  const outdoorKeywords = ["fútbol", "playa", "correr", "gimnasio", "baile", "plaza", "viajar", "ciclismo", "montaña", "pasear"];
  const indoorKeywords = ["videojuegos", "consola", "televisión", "leer", "película", "casa", "habitación", "encerrado", "música", "internet"];
  const outCount = countKeywords(outdoorKeywords);
  const inCount = countKeywords(indoorKeywords);
  const recScore = outCount + inCount > 0 ? outCount / (outCount + inCount) : 0.5;

  return {
    id: row.uuid ?? `nemotron-${String(index + 1).padStart(3, "0")}`,
    age: row.age ?? 30,
    occupation: row.occupation ?? "ocupación no especificada",
    education: row.education_level ?? "no especificada",
    householdType: row.household_type ?? "no especificado",
    municipality: row.municipality ?? "no especificado",
    region: row.department ?? "no especificada",
    language: row.languages_spoken ?? "español",
    skills: [techScore, profScore, socialScore, adaptScore],
    aspirations: [ambitionScore, stabilityScore, communityScore, emigrationScore],
    traits: [riskScore, sociabilityScore, priceScore, trustScore, recScore],
    interests: parseStringList(row.hobbies_and_interests_list)
  };
}

async function run() {
  const input = process.argv[2];
  let rawRows: any[] = [];

  if (input) {
    console.log(`Reading from local file: ${input}`);
    const content = JSON.parse(await readFile(input, "utf8"));
    rawRows = Array.isArray(content) ? content : (content.rows || []);
  } else {
    console.log("No local file specified. Fetching 300 rows from Hugging Face Datasets Server API...");
    for (const offset of [0, 100, 200]) {
      const url = `https://datasets-server.huggingface.co/rows?dataset=nvidia/Nemotron-Personas-El-Salvador&config=default&split=train&offset=${offset}&limit=100`;
      console.log(`Fetching rows ${offset} to ${offset + 99}...`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch dataset from Hugging Face: ${response.statusText}`);
      }
      const data = await response.json();
      if (data && Array.isArray(data.rows)) {
        rawRows.push(...data.rows);
      }
    }
  }

  // Extract actual row objects (HF datasets server wraps them under `{ row: SourceRow }`)
  const rows: SourceRow[] = rawRows.map(item => {
    if (item && typeof item === "object" && "row" in item) {
      return item.row as SourceRow;
    }
    return item as SourceRow;
  });

  console.log(`Processing ${rows.length} rows...`);
  const output = rows.slice(0, 300).map((row, idx) => convert(row, idx));

  await writeFile("content/citizens/sample_pool.json", JSON.stringify(output, null, 2));
  console.log(`Successfully prepared ${output.length} profiles and wrote to content/citizens/sample_pool.json.`);
}

run().catch(err => {
  console.error("Error running prepare-citizens:", err);
  process.exit(1);
});
