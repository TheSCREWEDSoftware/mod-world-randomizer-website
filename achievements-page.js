/*
 * Achievements page: the module's achievement list (achievements.js, made by the module's
 * tools/generate_achievements.py) by category, for one content (Vanilla / TBC / Wrath).
 */
(function () {
  'use strict';

  var ALL = (window.RANDOMIZER_ACHIEVEMENTS || {}).achievements || [];
  // WoW icons by name (the module stores the game's icon names); hidden when they can't load
  var ICON_URL = 'https://wow.zamimg.com/images/wow/icons/medium/';
  var EXP_NAMES = { 1: 'Vanilla', 2: 'TBC', 4: 'Wrath' };
  var state = { exp: 4, cat: 0, search: '' };

  function $(id) { return document.getElementById(id); }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem('wr-ach') || '{}');
      if (EXP_NAMES[saved.exp]) state.exp = saved.exp;
    } catch (e) { /* storage blocked */ }
  }

  function save() {
    try { localStorage.setItem('wr-ach', JSON.stringify({ exp: state.exp })); } catch (e) { /* storage blocked */ }
  }

  function active(a) { return !a.expansion || (a.expansion & state.exp) !== 0; }

  function expText(mask) {
    if (!mask) return 'every expansion';
    return [1, 2, 4].filter(function (b) { return mask & b; }).map(function (b) { return EXP_NAMES[b]; }).join(', ');
  }

  // Other versions of the same achievement (same parent), for "In TBC: ..."
  function versions(a) {
    var base = a.parent || a.id;
    return ALL.filter(function (o) { return o.id !== a.id && (o.parent || o.id) === base; });
  }

  function matches(a) {
    if (!state.search) return true;
    var hay = (a.name + ' ' + a.desc + ' ' + a.catName + ' ' + a.rewards.map(function (r) {
      return r.text;
    }).join(' ')).toLowerCase();
    return state.search.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }

  function categories() {
    var list = [];
    var seen = {};
    ALL.forEach(function (a) {
      if (!active(a)) return;
      if (!seen[a.cat]) { seen[a.cat] = { id: a.cat, name: a.catName, count: 0 }; list.push(seen[a.cat]); }
      if (matches(a)) seen[a.cat].count++;
    });
    list.sort(function (x, y) { return x.id - y.id; });
    return list;
  }

  function row(a) {
    var off = !a.enabled;
    var others = versions(a);
    return '<div class="achrow' + (off ? ' off' : '') + '">' +
      '<img class="achicon" src="' + ICON_URL + esc(a.icon.toLowerCase()) + '.jpg" alt="" loading="lazy" ' +
      'onerror="this.style.visibility=\'hidden\'">' +
      '<div class="achbody"><div class="achname">' + esc(a.name) +
      (a.expansion ? ' <span class="achexp">' + esc(expText(a.expansion)) + '</span>' : '') +
      (off ? ' <span class="achoff">not in the game yet</span>' : '') + '</div>' +
      (a.desc ? '<div class="achdesc">' + esc(a.desc) + '</div>' : '') +
      '<ul class="achrewards">' + a.rewards.map(function (r) {
        return '<li' + (r.type === 0 ? ' class="textonly" data-tip="Needs a feature the module doesn\'t have yet"' :
          '') + '>' + esc(r.text) + (r.type === 0 ? ' <span class="achoff">not active yet</span>' : '') + '</li>';
      }).join('') + '</ul>' +
      (others.length ? '<div class="achother">' + others.map(function (o) {
        return esc(expText(o.expansion)) + ': ' + esc(o.rewards.map(function (r) { return r.text; }).join(', ') ||
          o.name);
      }).join(' &middot; ') + '</div>' : '') +
      '</div></div>';
  }

  function render() {
    var cats = categories();
    if (state.cat && !cats.some(function (c) { return c.id === state.cat && c.count; })) state.cat = 0;
    var shown = ALL.filter(function (a) {
      return active(a) && matches(a) && (!state.cat || a.cat === state.cat);
    });
    var total = ALL.filter(active).length;

    $('ach-cats').innerHTML = '<button class="achcat' + (state.cat ? '' : ' on') + '" data-cat="0">All <span>' +
      cats.reduce(function (n, c) { return n + c.count; }, 0) + '</span></button>' + cats.map(function (c) {
        return '<button class="achcat' + (state.cat === c.id ? ' on' : '') + '" data-cat="' + c.id + '"' +
          (c.count ? '' : ' disabled') + '>' + esc(c.name) + ' <span>' + c.count + '</span></button>';
      }).join('');

    var html = '';
    var last = null;
    shown.forEach(function (a) {
      if (a.cat !== last) {
        html += '<h3 class="achhead">' + esc(a.catName) + '</h3>';
        last = a.cat;
      }
      html += row(a);
    });
    $('ach-list').innerHTML = html || '<p class="muted">Nothing matches.</p>';
    $('ach-count').textContent = total + ' achievements for ' + EXP_NAMES[state.exp] +
      (shown.length !== total ? ', ' + shown.length + ' shown' : '') + '.';
  }

  load();
  $('ach-exp').value = String(state.exp);
  $('ach-exp').addEventListener('change', function () { state.exp = Number(this.value); save(); render(); });
  $('ach-search').addEventListener('input', function () {
    state.search = this.value.trim().toLowerCase();
    render();
  });
  $('ach-cats').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-cat]');
    if (!b || b.disabled) return;
    state.cat = Number(b.getAttribute('data-cat'));
    render();
    $('ach-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Tooltips (data-tip), like the other pages
  var tip = $('tip');
  document.addEventListener('mouseover', function (e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (!el) { tip.style.display = 'none'; return; }
    tip.textContent = el.getAttribute('data-tip');
    tip.style.display = 'block';
  });
  document.addEventListener('mousemove', function (e) {
    if (tip.style.display !== 'block') return;
    tip.style.left = Math.max(8, Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8)) + 'px';
    tip.style.top = (e.clientY + 18) + 'px';
  });

  render();
})();
