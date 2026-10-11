const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  path = require('node:path');
const root = path.join(__dirname, '..'),
  helper = fs.readFileSync(path.join(root, 'shared-library.js'), 'utf8'),
  html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(helper, ctx);
const plain = (x) => JSON.parse(JSON.stringify(x)),
  item = { id: 's1', name: '测试剧本', roles: ['水手', '侍臣'] },
  empty = { presetNames: {}, customPresets: {} };
test('shared functions match the code actually embedded in the page', () =>
  assert.ok(
    html
      .replace(/\s/g, '')
      .includes(helper.slice(helper.indexOf('function validateLibrary')).replace(/\s/g, '')),
  ));
test('validate actual library and reject duplicate or malformed IDs', () => {
  const libraryContext = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'scripts.js'), 'utf8'), libraryContext);
  const actual = libraryContext.window.CLOCKTOWER_LIBRARY;
  assert.ok(ctx.validateLibrary(actual).length);
  assert.throws(() => ctx.validateLibrary({ schemaVersion: 1, scripts: [item, item] }));
  assert.throws(() =>
    ctx.validateLibrary({ schemaVersion: 1, scripts: [{ ...item, id: '__proto__' }] }),
  );
});
test('first device receives scripts, without adding game records', () => {
  const r = plain(ctx.mergeLibrary(empty, [item], {}));
  assert.equal(r.presetNames.s1, item.name);
  assert.deepEqual(r.customPresets.s1, item.roles);
  assert.equal(r.logs, undefined);
});
test('remote changes apply when local copy is unchanged', () => {
  const r = ctx.mergeLibrary(empty, [item], {});
  const next = { ...item, name: '新版名称', roles: ['水手'] };
  const updated = plain(ctx.mergeLibrary(r, [next], r.baseline));
  assert.equal(updated.presetNames.s1, '新版名称');
  assert.equal(updated.conflicts.length, 0);
});
test('unpublished local edits survive automatic remote refresh', () => {
  const r = ctx.mergeLibrary(empty, [item], {});
  r.presetNames.s1 = '本机编辑';
  const updated = plain(ctx.mergeLibrary(r, [{ ...item, name: '远端编辑' }], r.baseline));
  assert.equal(updated.presetNames.s1, '本机编辑');
  assert.deepEqual(updated.conflicts, ['s1']);
});
test('explicit adopt replaces conflict but preserves local-only scripts', () => {
  const r = ctx.mergeLibrary(empty, [item], {});
  r.presetNames.s1 = '本机编辑';
  r.presetNames.s2 = '本机新剧本';
  r.customPresets.s2 = ['占卜师'];
  const updated = plain(ctx.mergeLibrary(r, [item], r.baseline, true));
  assert.equal(updated.presetNames.s1, item.name);
  assert.equal(updated.presetNames.s2, '本机新剧本');
});
test('page initializes, saves new scripts, applies roles and exports restorable notes', () => {
  const nodes = {};
  for (const m of html.matchAll(/id="([^"]+)"/g))
    nodes[m[1]] = {
      value: '',
      options: [],
      textContent: '',
      addEventListener() {},
      focus() {},
      set innerHTML(v) {
        this.options = [...v.matchAll(/<option(?: value="([^"]*)")?[^>]*>(.*?)<\/option>/g)].map(
          (m) => ({ value: m[1] ?? m[2] }),
        );
      },
    };
  const c = {
    document: { getElementById: (id) => nodes[id] || null, addEventListener() {} },
    location: { protocol: 'file:', href: 'file:///index.html' },
    localStorage: { getItem: () => null, setItem() {} },
    setInterval() {},
    window: { scrollTo() {} },
    confirm: () => true,
    alert: (m) => {
      throw Error(m);
    },
  };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts.js'), 'utf8'), c);
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], c);
  assert.equal(vm.runInContext('presetIds().length', c), 6);
  assert.ok(nodes.preset.options.some((o) => o.value === '1'));
  nodes.newPreset.onclick();
  nodes.presetName.value = '新剧本';
  nodes.roleList.value = '水手\n侍臣\n水手';
  nodes.savePreset.onclick();
  const id = nodes.managePreset.value;
  nodes.preset.value = id;
  nodes.usePreset.onclick();
  const lib = plain(vm.runInContext('exportSharedLibrary()', c));
  assert.equal(lib.scripts.find((s) => s.id === id).roles.length, 2);
  assert.ok(!('logs' in lib));
  const md = vm.runInContext('analysisDocument()', c);
  const raw = md.match(/<!-- CLOCKTOWER_DATA\r?\n([\s\S]*?)\r?\nCLOCKTOWER_DATA -->/)[1];
  assert.equal(JSON.parse(raw).presetNames[id], '新剧本');
  vm.runInContext("state.composition={townsfolk:'7',outsider:'0',minion:'2',demon:'1'};save()", c);
  assert.ok(nodes.analysisSummary.value.includes('外来者 0 人'));
  assert.ok(nodes.compositionStatus.textContent.includes('一致'));
  const restored = vm.runInContext('validate(JSON.parse(JSON.stringify(state)))', c);
  assert.equal(restored.composition.outsider, '0');
  assert.equal(
    vm.runInContext('validate({...state,composition:undefined}).composition.townsfolk', c),
    '',
  );
  vm.runInContext(
    "state.players[0].guessType='恶魔';state.players[0].status='死亡';state.players[1].guessType='恶魔';save()",
    c,
  );
  assert.ok(nodes.guessBalance.textContent.includes('恶魔：已猜 2 人 / 开局 1 人（超出 1 人）'));
  assert.ok(nodes.analysisSummary.value.includes('猜测角色类型：恶魔'));
  assert.equal(
    vm.runInContext(
      'validate({...state,players:state.players.map(({guessType,...p})=>p)}).players[0].guessType',
      c,
    ),
    '未知',
  );
  nodes.reset.onclick();
  assert.equal(vm.runInContext('state.composition.townsfolk', c), '');
  assert.equal(vm.runInContext('state.presetNames', c)[id], '新剧本');
});
