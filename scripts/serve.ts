import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ScenarioRunner } from "../src/simulation/scenario/index.ts";
import { ciudadDividida } from "../src/content/scenarios/ciudad_dividida.ts";
import { activeCitizenCount } from "../src/simulation/citizens/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

let game = new ScenarioRunner(ciudadDividida);
let savedGame: string | null = null;

async function handleRequest(req: any, res: any) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Set default CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- REST API Endpoints ---
  
  if (pathname === "/api/state" && req.method === "GET") {
    const totalCitizens = Object.values(game.citizens).reduce((sum, list) => sum + list.length, 0);
    // Expose newest-first slices of already-collected opinion state — no new simulation logic
    const footprintLog = [...game.opinion.footprints].reverse().slice(0, 30);
    const opinionBreakdown = [...game.opinion.breakdownHistory].reverse().slice(0, 10);
    const state = {
      day: game.clock.currentDay,
      hour: game.clock.currentHour,
      minute: game.clock.currentMinute,
      speed: game.clock.currentSpeed,
      treasury: game.city.treasury,
      weeklyIncome: game.economySnapshot.taxesCollected,
      approval: game.city.approval,
      taxRate: game.city.taxRate,
      auditLevel: game.city.auditLevel,
      corruptionRisk: game.city.corruptionRisk,
      result: game.result,
      organizations: game.city.organizations,
      footprintLog,
      opinionBreakdown,
      districts: game.city.districts.map(d => ({
        id: d.id,
        population: d.population,
        approval: d.approval,
        services: d.services,
        economy: d.economy,
        social: d.social,
        cohorts: game.cohorts[d.id] ?? []
      })),
      totalCitizens,
      activeCitizens: activeCitizenCount(game.citizens)
      ,citizens: game.citizens
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(state));
    return;
  }

  if (pathname === "/api/citizens" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(game.citizens));
    return;
  }

  if (pathname === "/api/advance" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk: any) => body += chunk);
    req.on("end", () => {
      try {
        const { days } = JSON.parse(body);
        game.advance(days || 1);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, day: game.clock.currentDay }));
      } catch (err: any) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === "/api/speed" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk: any) => body += chunk);
    req.on("end", () => {
      try {
        const { speed } = JSON.parse(body);
        game.clock.setSpeed(speed);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, speed: game.clock.currentSpeed }));
      } catch (err: any) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === "/api/command" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk: any) => body += chunk);
    req.on("end", () => {
      try {
        const cmd = JSON.parse(body);
        // Type conversions if needed
        if (cmd.type === "SET_AUDIT_LEVEL") {
          cmd.value = parseFloat(cmd.value);
        } else if (cmd.type === "CHANGE_TAX_RATE") {
          cmd.value = parseFloat(cmd.value);
        } else if (cmd.type === "INVEST_UTILITY") {
          cmd.amount = parseFloat(cmd.amount);
        } else if (cmd.type === "INVEST_SOCIAL_PROGRAM") {
          cmd.amount = parseFloat(cmd.amount);
        }

        game.dispatcher.dispatch(cmd);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err: any) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === "/api/inspect" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk: any) => body += chunk);
    req.on("end", () => {
      try {
        const { citizenId } = JSON.parse(body);
        if (game.inspectedCitizens.has(citizenId)) {
          game.inspectedCitizens.delete(citizenId);
        } else {
          game.inspectedCitizens.add(citizenId);
        }
        game.syncCitizenActivationNow();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, inspected: Array.from(game.inspectedCitizens) }));
      } catch (err: any) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === "/api/tilemap" && req.method === "GET") {
    const tiles: any[] = [];
    game.city.districts.forEach(d => {
      (d.tiles ?? []).forEach((t: any) => {
        tiles.push({ row: t.row, col: t.col, type: t.type, owner: d.id, level: t.level ?? 0 });
      });
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ tiles }));
    return;
  }

  if (pathname === "/api/reset" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk: any) => body += chunk);
    req.on("end", () => {
      try {
        let seed = 1;
        if (body) {
          const parsed = JSON.parse(body);
          if (parsed.seed) seed = parsed.seed;
        }
        game = new ScenarioRunner(ciudadDividida, 10, seed);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err: any) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === "/api/save" && req.method === "POST") {
    try {
      savedGame = game.serialize();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === "/api/save/exists" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ exists: savedGame !== null }));
    return;
  }

  if (pathname === "/api/load" && req.method === "POST") {
    if (!savedGame) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No save found" }));
      return;
    }
    try {
      game = new ScenarioRunner(ciudadDividida);
      game.deserialize(savedGame);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // --- Serve Frontend Client & Assets ---
  
  if (pathname === "/" || pathname === "/index.html") {
    try {
      const htmlContent = await readFile(join(rootDir, "index.html"), "utf8");
      res.writeHead(200, { 
        "Content-Type": "text/html",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      });
      res.end(htmlContent);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Internal Server Error: ${err}`);
    }
    return;
  }

  // Serve any other static file
  try {
    const filePath = join(rootDir, pathname.substring(1));
    const content = await readFile(filePath);
    let contentType = "text/plain";
    if (filePath.endsWith(".css")) contentType = "text/css";
    else if (filePath.endsWith(".js")) contentType = "application/javascript";
    else if (filePath.endsWith(".html")) contentType = "text/html";
    
    res.writeHead(200, { 
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
    });
    res.end(content);
    return;
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }
}

const server = createServer(handleRequest);
const PORT = 3000;
// One simulated day is one real hour at 1×. Advance one simulated minute per
// real 2.5 seconds so the HUD clock visibly progresses.
setInterval(() => game.advance(game.clock.currentSpeed / 1440), 2500);
server.listen(PORT, () => {
  console.log(`Metropolica Server running at http://localhost:${PORT}`);
});
