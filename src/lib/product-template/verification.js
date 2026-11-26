// Browser-only presentational demo: no requests, banking codes or payment data.
(() => {
  const states = ['idle', 'verifying', 'challenge', 'waiting', 'error_challenge', 'error_details', 'timeout', 'success'];
  const shippingKeys = ['name', 'address', 'postalCode', 'city', 'province', 'email', 'phone'];
  const storageKey = 'checkout.shipping.v1';
  const shipping = [...document.querySelectorAll('[data-shipping]')];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    shipping.forEach(input => {
      const value = saved?.[input.dataset.shipping];
      if (typeof value === 'string') input.value = value.slice(0, 300);
    });
  } catch { /* Storage unavailable or invalid: keep form usable. */ }
  shipping.forEach(input => input.addEventListener('input', () => {
    const contact = {};
    shipping.forEach(field => {
      if (shippingKeys.includes(field.dataset.shipping)) contact[field.dataset.shipping] = field.value.slice(0, 300);
    });
    try { localStorage.setItem(storageKey, JSON.stringify(contact)); } catch { /* Optional persistence. */ }
  }));

  const overlay = document.createElement('div');
  overlay.className = 'verification-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `<section class="verification-dialog" role="dialog" aria-modal="true" aria-labelledby="verification-title" aria-describedby="verification-message" tabindex="-1">
    <div class="verification-demo">DEMO · Nessun pagamento reale</div>
    <button class="verification-close" aria-label="Chiudi">×</button>
    <div class="verification-symbol" aria-hidden="true"></div>
    <h2 id="verification-title"></h2><p id="verification-message" role="status"></p>
    <div class="verification-challenge" hidden>
      <p>Codice dimostrativo: <b>123456</b>. Non inserire codici ricevuti dalla banca.</p>
      <div class="verification-digits" role="group" aria-label="Codice dimostrativo">${Array.from({ length: 6 }, (_, i) => `<input aria-label="Cifra ${i + 1}" inputmode="numeric" type="text" maxlength="1" autocomplete="off" />`).join('')}</div>
      <button class="btn verification-confirm" disabled>Conferma</button>
      <button class="btn verification-secondary verification-quick">Clicca qui se tu vuoi simulare l’approvazione</button>
    </div>
    <p class="verification-tracking" hidden></p>
    <button class="btn verification-action" hidden></button>
  </section>`;
  document.body.append(overlay);
  const dialog = overlay.querySelector('section');
  const title = overlay.querySelector('h2');
  const message = overlay.querySelector('#verification-message');
  const symbol = overlay.querySelector('.verification-symbol');
  const challenge = overlay.querySelector('.verification-challenge');
  const confirm = overlay.querySelector('.verification-confirm');
  const action = overlay.querySelector('.verification-action');
  const tracking = overlay.querySelector('.verification-tracking');
  const digits = [...overlay.querySelectorAll('.verification-digits input')];
  let state = 'idle', previousFocus = null, trackingCode = '', oldOverflow = '';
  const callbacks = {};
  const copy = {
    verifying: ['Verifica dell’ordine', 'Verifica in corso. Ti preghiamo di non chiudere la pagina.'],
    challenge: ['Verifica dimostrativa', 'Completa la simulazione di verifica.'],
    waiting: ['Risposta ricevuta', 'La tua risposta è stata ricevuta. Stiamo aspettando la conferma finale.'],
    error_challenge: ['Codice non valido', 'Il codice inserito non è valido. Per favore, riprova.'],
    error_details: ['Controlla i dati', 'Controlla i dati di spedizione.'],
    timeout: ['Verifica scaduta', 'Il tempo di verifica è scaduto. Per favore riprova.'],
    success: ['Il tuo pagamento è stato confermato!', 'Conferma dimostrativa: nessun pagamento è stato effettuato.'],
  };
  function emit(name) {
    // Deliberately never expose the six input values, shipping or card data.
    const detail = { state, demo: true };
    window.dispatchEvent(new CustomEvent('checkoutVerification:' + name, { detail }));
    if (typeof callbacks[name] === 'function') callbacks[name](detail);
  }
  function setState(next, options = {}) {
    if (!states.includes(next)) return false;
    const opening = state === 'idle' && next !== 'idle';
    if (opening) {
      previousFocus = document.activeElement;
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      [...document.body.children].filter(el => el !== overlay && el.tagName !== 'SCRIPT').forEach(el => {
        if (!el.inert) { el.inert = true; el.dataset.verificationInert = 'true'; }
      });
    }
    state = next;
    overlay.hidden = next === 'idle';
    if (next === 'idle') {
      document.body.style.overflow = oldOverflow;
      document.querySelectorAll('[data-verification-inert]').forEach(el => { el.inert = false; delete el.dataset.verificationInert; });
      previousFocus?.focus();
      emit('statechange');
      return true;
    }
    const text = copy[next];
    title.textContent = text[0];
    message.textContent = next === 'error_details' && typeof options.message === 'string' ? options.message.slice(0, 500) : text[1];
    dialog.dataset.state = next;
    symbol.className = 'verification-symbol' + (['verifying', 'waiting'].includes(next) ? ' verification-spinner' : '');
    symbol.textContent = ({ error_challenge: '!', error_details: '!', timeout: '↻', success: '✓', challenge: '◇' })[next] || '';
    challenge.hidden = next !== 'challenge';
    digits.forEach(input => { input.value = ''; });
    confirm.disabled = true;
    action.hidden = !['error_challenge', 'error_details', 'timeout', 'success'].includes(next);
    action.textContent = next === 'error_details' ? 'Correggi i dati' : next === 'success' ? 'Chiudi' : 'Riprova';
    tracking.hidden = next !== 'success';
    if (next === 'success') {
      if (!trackingCode) trackingCode = 'DEMO-IT-' + crypto.randomUUID().slice(0, 8).toUpperCase();
      tracking.textContent = 'Tracking dimostrativo: ' + trackingCode;
    }
    (next === 'challenge' ? digits[0] : dialog).focus();
    emit('statechange');
    return true;
  }
  function distribute(value, start) {
    const values = value.replace(/\D/g, '').slice(0, 6 - start).split('');
    values.forEach((value, offset) => { digits[start + offset].value = value; });
    confirm.disabled = !digits.every(input => /^\d$/.test(input.value));
    digits[Math.min(start + values.length, 5)].focus();
  }
  digits.forEach((input, index) => {
    input.addEventListener('input', () => distribute(input.value, index));
    input.addEventListener('paste', event => {
      event.preventDefault();
      distribute(event.clipboardData.getData('text'), index);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Backspace' && !input.value && index > 0) {
        event.preventDefault(); digits[index - 1].value = ''; digits[index - 1].focus(); confirm.disabled = true;
      }
      if (event.key === 'ArrowLeft' && index > 0) digits[index - 1].focus();
      if (event.key === 'ArrowRight' && index < 5) digits[index + 1].focus();
    });
  });
  confirm.addEventListener('click', () => {
    if (confirm.disabled) return;
    const matchesDemo = digits.map(input => input.value).join('') === '123456';
    setState(matchesDemo ? 'waiting' : 'error_challenge');
    emit(matchesDemo ? 'confirm' : 'invalid');
  });
  overlay.querySelector('.verification-quick').addEventListener('click', () => { setState('waiting'); emit('quickApproval'); });
  overlay.querySelector('.verification-close').addEventListener('click', () => setState('idle'));
  action.addEventListener('click', () => {
    const current = state;
    setState(current === 'error_challenge' || current === 'timeout' ? 'challenge' : 'idle');
    emit(current === 'error_details' ? 'correctDetails' : current === 'success' ? 'close' : 'retry');
    if (current === 'error_details') shipping[0]?.focus();
  });
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') setState('idle');
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not(:disabled), input')].filter(el => !el.closest('[hidden]'));
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  window.checkoutVerification = Object.freeze({
    setState,
    getState: () => state,
    configure: (handlers = {}) => { Object.keys(callbacks).forEach(key => delete callbacks[key]); Object.assign(callbacks, handlers); },
    clearShipping: () => { try { localStorage.removeItem(storageKey); } catch { /* Optional storage. */ } },
  });
})();