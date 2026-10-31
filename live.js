/*
 * Live rooms for the Character page: everyone who opens the same room sees the same party (players, rolls,
 * rerolls, picks, rules, era and world seed) change as it happens.
 *
 * No server of our own: browsers connect straight to each other (WebRTC). They find each other through public
 * Nostr relays, via Trystero (vendor/trystero-nostr.mjs, loaded only when a room is opened). The room code is
 * also the password, so only people with the code can join.
 *
 * It's an extra: a page opened from a file on your computer can't load it, and everything else works the same
 * without it. Each change sends the whole shared party; when two arrive at once, the later one wins (a counter,
 * then the sender's id, decide which is later, the same way on every browser).
 */
(function () {
  'use strict';

  var Roller = window.WorldRandomizerRoller;
  if (!Roller || !document.getElementById('live-panel')) return;

  var APP_ID = 'mod-world-randomizer-website';
  var CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
  var NAME_KEY = 'wr-live-name';
  var LOCAL_FILE = location.protocol === 'file:';

  var room = null; // the joined room: { code, conn, send, peers: { id: name } }
  var clock = 0; // how many changes this party has had, as far as we know
  var lastBy = ''; // who made the newest change we have
  var sentJson = ''; // the shared party as we last sent or received it
  var applying = false;
  var pending = null; // a change that arrived while the character picker was open
  var pendingTimer = 0;

  function $(id) { return document.getElementById(id); }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function newCode() {
    var out = '';
    var bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    for (var i = 0; i < bytes.length; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    return out;
  }

  function cleanCode(text) {
    return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  }

  function myName() {
    var name = $('live-name').value.trim().slice(0, 24);
    try { localStorage.setItem(NAME_KEY, name); } catch (e) { /* storage blocked */ }
    return name || 'Someone';
  }

  function roomLink(code) {
    return location.href.split('#')[0] + '#room=' + code;
  }

  // ---- Talking to the others ----

  // Trystero over Nostr relays; ?live=local uses the browser's own tabs instead (for trying it out on one computer)
  function connect(code) {
    if (/[?&]live=local\b/.test(location.search)) {
      var r = localRoom(code);
      return Promise.resolve({ room: r, selfId: r.selfId });
    }
    return import('./vendor/trystero-nostr.mjs').then(function (lib) {
      return { room: lib.joinRoom({ appId: APP_ID, password: code }, code), selfId: lib.selfId };
    });
  }

  // The same calls as a Trystero room, between tabs of one browser
  function localRoom(code) {
    var id = Math.random().toString(36).slice(2);
    var channel = new BroadcastChannel('wr-live-' + code);
    var actions = {};
    var r = {
      onPeerJoin: null, onPeerLeave: null, peers: {},
      makeAction: function (type) {
        var action = {
          onMessage: null,
          send: function (data, options) {
            channel.postMessage({ t: type, from: id, to: options && options.target, data: data });
            return Promise.resolve();
          }
        };
        actions[type] = action;
        return action;
      },
      leave: function () { channel.postMessage({ t: '_bye', from: id }); channel.close(); return Promise.resolve(); }
    };
    channel.onmessage = function (e) {
      var m = e.data;
      if (m.to && m.to !== id) return;
      if (m.t === '_hi' || m.t === '_hi2') {
        if (!r.peers[m.from]) {
          r.peers[m.from] = true;
          if (m.t === '_hi') channel.postMessage({ t: '_hi2', from: id, to: m.from });
          if (r.onPeerJoin) r.onPeerJoin(m.from);
        }
      } else if (m.t === '_bye') {
        delete r.peers[m.from];
        if (r.onPeerLeave) r.onPeerLeave(m.from);
      } else if (actions[m.t] && actions[m.t].onMessage) {
        actions[m.t].onMessage(m.data, { peerId: m.from });
      }
    };
    setTimeout(function () { channel.postMessage({ t: '_hi', from: id }); }, 0);
    r.selfId = id;
    return r;
  }

  function join(code, creating) {
    if (room) leave();
    $('live-msg').textContent = 'Connecting...';
    var name = myName();
    return connect(code).then(function (joined) {
      var conn = joined.room;
      var partyAction = conn.makeAction('party');
      var helloAction = conn.makeAction('hello');
      room = { code: code, conn: conn, peers: {}, selfId: joined.selfId || '', name: name };
      // Whoever opens the room starts with their party; anyone joining takes the room's
      clock = creating ? 1 : 0;
      lastBy = '';
      sentJson = JSON.stringify(Roller.shared());

      room.sendParty = function (target) {
        var message = { c: clock, by: room.selfId || room.name, party: Roller.shared() };
        partyAction.send(message, target ? { target: target } : undefined);
      };
      room.sendHello = function (target) {
        helloAction.send({ name: room.name }, target ? { target: target } : undefined);
      };

      conn.onPeerJoin = function (peerId) {
        room.peers[peerId] = room.peers[peerId] || 'Someone';
        room.sendHello(peerId);
        if (clock > 0) room.sendParty(peerId);
        status();
      };
      conn.onPeerLeave = function (peerId) {
        delete room.peers[peerId];
        status();
      };
      helloAction.onMessage = function (data, ctx) {
        room.peers[ctx.peerId] = String((data && data.name) || 'Someone').slice(0, 24);
        status();
      };
      partyAction.onMessage = function (data) { receive(data); };

      try { history.replaceState(null, '', roomLink(code)); } catch (e) { /* file: pages */ }
      status();
    }, function () {
      room = null;
      $('live-msg').innerHTML = '<span class="bad">Could not start the live room here.</span> It needs the page ' +
        'opened from a web address (like GitHub Pages), not from a file.';
      status();
    });
  }

  function leave() {
    if (!room) return;
    try { room.conn.leave(); } catch (e) { /* already gone */ }
    room = null;
    pending = null;
    try { history.replaceState(null, '', location.href.split('#')[0]); } catch (e) { /* file: pages */ }
    $('live-msg').textContent = 'You left the room. Your party stays as it was.';
    status();
  }

  // ---- Keeping everyone's party the same ----

  function newer(data) {
    return data.c > clock || (data.c === clock && String(data.by) > String(lastBy));
  }

  function receive(data) {
    if (!room || !data || typeof data.c !== 'number' || !data.party) return;
    if (!newer(data)) return;
    if (Roller.busy()) { // don't change the party under the open character picker
      pending = data;
      if (!pendingTimer) pendingTimer = setInterval(applyPending, 400);
      return;
    }
    apply(data);
  }

  function applyPending() {
    if (!pending) { clearInterval(pendingTimer); pendingTimer = 0; return; }
    if (Roller.busy()) return;
    var data = pending;
    pending = null;
    if (newer(data)) apply(data);
  }

  function apply(data) {
    clock = data.c;
    lastBy = String(data.by);
    applying = true;
    try { Roller.applyShared(data.party); } finally { applying = false; }
    sentJson = JSON.stringify(Roller.shared());
    status();
  }

  // After every redraw of the page: if the shared party changed here, send it
  Roller.afterRender(function () {
    if (!room || applying) return;
    var json = JSON.stringify(Roller.shared());
    if (json === sentJson) return;
    sentJson = json;
    clock += 1;
    lastBy = String(room.selfId || room.name);
    room.sendParty();
  });

  // ---- The panel ----

  function status() {
    var inRoom = !!room;
    $('live-out').style.display = inRoom ? 'none' : '';
    $('live-in').style.display = inRoom ? '' : 'none';
    if (!inRoom) return;
    $('live-code').textContent = room.code;
    var names = Object.keys(room.peers).map(function (id) { return room.peers[id]; });
    $('live-msg').innerHTML = names.length ?
      '<span class="good">Connected</span> with ' + names.map(esc).join(', ') + '.' :
      'Waiting for others: send them the link or the code.';
  }

  if (LOCAL_FILE) {
    $('live-out').innerHTML = '<p class="muted small" style="margin:0">Live rooms work when the page is opened from ' +
      'a web address, like its GitHub Pages copy. Opened from a file, everything else works as usual; share the ' +
      'party with the codes below instead.</p>';
    return;
  }

  try { $('live-name').value = localStorage.getItem(NAME_KEY) || ''; } catch (e) { /* storage blocked */ }

  $('live-create').addEventListener('click', function () { join(newCode(), true); });
  $('live-join').addEventListener('click', function () {
    var code = cleanCode($('live-join-code').value);
    if (code.length < 4) { $('live-msg').textContent = 'Type the room code you were given.'; return; }
    join(code, false);
  });
  $('live-join-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('live-join').click(); });
  $('live-leave').addEventListener('click', leave);
  $('live-copy').addEventListener('click', function () {
    if (!room) return;
    var done = function () { $('live-copy').textContent = 'Copied'; setTimeout(function () {
      $('live-copy').textContent = 'Copy link'; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(roomLink(room.code)).then(done, function () {});
  });

  // Opened from a room link (index.html#room=CODE): join it
  var linked = /#room=([A-Za-z0-9]+)/.exec(location.hash);
  if (linked) {
    $('live-join-code').value = cleanCode(linked[1]);
    join(cleanCode(linked[1]), false);
  } else {
    status();
  }
})();
