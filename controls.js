/*
 * Themed form controls for every page: number fields get gold up / down arrows instead of the browser's white
 * spinners (added to fields made later too, e.g. by the roller). Selects, search fields and checkboxes are themed
 * in style.css.
 */
(function () {
  'use strict';

  function step(input, up) {
    if (input.disabled || input.readOnly) return;
    var before = input.value;
    try {
      if (up) input.stepUp(); else input.stepDown();
    } catch (e) {
      var n = (Number(input.value) || 0) + (up ? 1 : -1);
      if (input.min !== '' && n < Number(input.min)) n = Number(input.min);
      if (input.max !== '' && n > Number(input.max)) n = Number(input.max);
      input.value = n;
    }
    if (input.value === before) return;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function button(input, up) {
    var b = document.createElement('button');
    b.type = 'button';
    b.tabIndex = -1;
    b.className = 'numstep-btn ' + (up ? 'up' : 'down');
    b.setAttribute('aria-label', up ? 'Increase' : 'Decrease');
    // Hold to keep counting
    var timer = null;
    var stop = function () { clearTimeout(timer); clearInterval(timer); timer = null; };
    b.addEventListener('mousedown', function (e) {
      e.preventDefault();
      step(input, up);
      timer = setTimeout(function () { timer = setInterval(function () { step(input, up); }, 70); }, 400);
    });
    ['mouseup', 'mouseleave', 'blur'].forEach(function (ev) { b.addEventListener(ev, stop); });
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') step(input, up); });
    return b;
  }

  function enhance(input) {
    if (input.getAttribute('data-numstep') || !input.parentNode) return;
    input.setAttribute('data-numstep', '1');
    var wrap = document.createElement('span');
    wrap.className = 'numstep';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    var arrows = document.createElement('span');
    arrows.className = 'numstep-arrows';
    arrows.appendChild(button(input, true));
    arrows.appendChild(button(input, false));
    wrap.appendChild(arrows);
  }

  function scan(root) {
    if (!root.querySelectorAll) return;
    if (root.matches && root.matches('input[type=number]')) enhance(root);
    Array.prototype.forEach.call(root.querySelectorAll('input[type=number]'), enhance);
  }

  function start() {
    scan(document.body);
    new MutationObserver(function (records) {
      records.forEach(function (r) { Array.prototype.forEach.call(r.addedNodes, scan); });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
