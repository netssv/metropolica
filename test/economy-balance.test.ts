import assert from 'node:assert/strict';
import test from 'node:test';
import { DEVELOPMENT_ECONOMY, constructionCost, estimateMonthlyFiscalBalance } from '../shared/economyBalance.ts';
import { ciudadDividida } from '../src/content/scenarios/ciudad_dividida.ts';

test('development-economy profile centralizes scenario budget and construction prices', () => {
  assert.equal(ciudadDividida.startingCity.treasury, DEVELOPMENT_ECONOMY.treasury.initial);
  assert.equal(ciudadDividida.startingCity.taxRate, DEVELOPMENT_ECONOMY.treasury.taxRate);
  assert.equal(constructionCost('zone-c', 'hospital'), DEVELOPMENT_ECONOMY.construction.hospital);
  assert.equal(constructionCost('zone-c', 'mall-government'), DEVELOPMENT_ECONOMY.construction['mall-government']);
  assert.equal(estimateMonthlyFiscalBalance(10_000, 7_000, 1_500), 1_500);
});
