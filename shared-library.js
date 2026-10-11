'use strict';
function validateLibrary(value) {
  if (value?.schemaVersion !== 1 || !Array.isArray(value.scripts) || value.scripts.length > 500)
    throw Error('剧本库格式不正确');
  const ids = new Set();
  return value.scripts.map((s) => {
    if (
      !s ||
      typeof s.id !== 'string' ||
      !/^(?:[0-9]+|s[0-9]+)$/.test(s.id) ||
      ids.has(s.id) ||
      typeof s.name !== 'string' ||
      !s.name.trim() ||
      s.name.length > 60 ||
      !Array.isArray(s.roles) ||
      !s.roles.length ||
      s.roles.length > 300 ||
      s.roles.some((r) => typeof r !== 'string' || !r.trim() || r.length > 40)
    )
      throw Error('剧本条目格式不正确');
    ids.add(s.id);
    return { id: s.id, name: s.name.trim(), roles: [...new Set(s.roles.map((r) => r.trim()))] };
  });
}
function libraryFingerprint(name, roles) {
  return JSON.stringify([name, roles]);
}
function mergeLibrary(current, scripts, baseline, force = false) {
  const names = { ...current.presetNames },
    roles = { ...current.customPresets },
    next = { ...baseline },
    conflicts = [];
  for (const item of scripts) {
    const id = item.id,
      incoming = libraryFingerprint(item.name, item.roles),
      hasLocal = Object.hasOwn(names, id) || Object.hasOwn(roles, id),
      local = libraryFingerprint(names[id] || '', roles[id] || []);
    if (force || !hasLocal || local === incoming || baseline[id] === local) {
      names[id] = item.name;
      roles[id] = [...item.roles];
      next[id] = incoming;
    } else conflicts.push(id);
  }
  return { presetNames: names, customPresets: roles, baseline: next, conflicts };
}
