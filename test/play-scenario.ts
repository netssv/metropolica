import { ciudadDividida } from "../src/content/scenarios/ciudad_dividida.ts";
import { ScenarioRunner } from "../src/simulation/scenario/index.ts";
import { activeCitizenCount } from "../src/simulation/citizens/index.ts";

const game = new ScenarioRunner(ciudadDividida); game.clock.setSpeed(100);
let printedBreakdowns = 0;
const show = (label: string) => {
  console.log(`\n${label} | day=${game.clock.currentDay} treasury=${game.city.treasury.toFixed(0)} approval=${game.city.approval.toFixed(2)}`);
  for (const district of game.city.districts) console.log(`  ${district.id}: crime=${district.social.crimeRisk.toFixed(2)} water=${district.services.water.coverage.toFixed(2)} power=${district.services.electricity.coverage.toFixed(2)}`);
  console.log(`  organizations=${game.city.organizations.map(org => org.type + ":" + org.territory.join(",")).join(" ") || "none"}`);
  const periferiaCitizen = game.citizens.periferia[0];
  const totalCitizens = Object.values(game.citizens).reduce((sum, citizens) => sum + citizens.length, 0);
  console.log(`  citizen=${periferiaCitizen.id} occupation=${periferiaCitizen.occupation} age=${periferiaCitizen.age} level=${periferiaCitizen.level} problem=${periferiaCitizen.currentProblem ?? "none"}`);
  console.log(`  citizen-load: total=${totalCitizens} active-level3=${activeCitizenCount(game.citizens)}`);
  for (const delta of game.opinion.breakdownHistory.slice(printedBreakdowns)) console.log(`  opinion day ${delta.day}: social=${delta.socialMedia.toFixed(3)} news=${delta.newspapers.toFixed(3)} wom=${delta.wordOfMouth.toFixed(3)} press=${delta.pressConference.toFixed(3)} total=${delta.total.toFixed(3)}`);
  printedBreakdowns = game.opinion.breakdownHistory.length;
};
show("inicio");
// Editable command queue: each chunk is a human decision point.
game.advance(7); show("tras 7 días: crisis de periferia visible");
game.dispatcher.dispatch({ type: "HOLD_PRESS_CONFERENCE", topic: "crime", message: "acknowledge" });
game.dispatcher.dispatch({ type: "INVEST_UTILITY", district: "periferia", utility: "water", amount: 300000 });
game.dispatcher.dispatch({ type: "INVEST_SOCIAL_PROGRAM", district: "periferia", amount: 100000 });
game.advance(180); show("tras inversión de agua y programa social");
game.dispatcher.dispatch({ type: "SET_AUDIT_LEVEL", value: 0.85 });
game.dispatcher.dispatch({ type: "HOLD_PRESS_CONFERENCE", topic: "crime", message: "acknowledge" });
game.advance(ciudadDividida.targetYears * 365 - game.clock.currentDay); show("fin de la partida");
console.log(`\nRESULTADO: ${game.result.status.toUpperCase()} — ${game.result.reason ?? "en curso"}`);
