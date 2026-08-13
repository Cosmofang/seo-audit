import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('knowledge base covers the complete operating system', () => {
  const index = read('knowledge/README.md');
  for (const topic of [
    'strategy-and-measurement',
    'keyword-research-and-serp',
    'content-and-on-page',
    'information-architecture-and-internal-links',
    'technical-seo',
    'ecommerce-and-shopify',
    'international-and-local',
    'authority-links-and-digital-pr',
    'monitoring-experiments-and-recovery',
    'geo-and-ai-search',
  ]) assert.match(index, new RegExp(topic));
});

test('myth guide makes the five high-risk decisions explicit', () => {
  const myths = read('knowledge/myths-and-non-rules.md');
  assert.match(myths, /多个 H1.*不是.*排名/i);
  assert.match(myths, /170.*不是.*硬/i);
  assert.match(myths, /FAQ.*并非.*必须/i);
  assert.match(myths, /llms\.txt.*实验/i);
  assert.match(myths, /全站.*nofollow.*不要/i);
});

test('90-day playbook contains owners, deliverables, priorities, and KPIs', () => {
  const plan = read('playbooks/90-day-seo-plan.md');
  for (const required of ['第 1-30 天', '第 31-60 天', '第 61-90 天', '负责人', '交付物', '优先级', 'KPI']) {
    assert.match(plan, new RegExp(required));
  }
});

test('migration playbook includes mapping, launch checks, monitoring, and rollback', () => {
  const migration = read('playbooks/site-migration.md');
  for (const required of ['URL 映射', '上线前', '上线后', '监控窗口', '负责人', '回滚阈值', '重定向链', '100%']) {
    assert.match(migration, new RegExp(required));
  }
});

test('source register uses evidence levels and a verification date', () => {
  const sources = read('knowledge/sources-and-evidence.md');
  assert.match(sources, /最后核验：2026-08-13/);
  for (const level of ['A 级', 'B 级', 'C 级', 'D 级']) assert.match(sources, new RegExp(level));
});
