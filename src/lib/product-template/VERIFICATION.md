# Local verification demo

The checkout exposes `window.checkoutVerification` after its document loads.
No network requests, customer-session control, payment processing or bank-code handling are implemented.
The challenge is explicitly a simulation accepting only the displayed demo code `123456`.

```js
window.checkoutVerification.setState('verifying');
window.checkoutVerification.setState('challenge');
window.checkoutVerification.setState('waiting');
window.checkoutVerification.setState('error_challenge');
window.checkoutVerification.setState('error_details', { message: 'Controlla l’indirizzo.' });
window.checkoutVerification.setState('timeout');
window.checkoutVerification.setState('success');
window.checkoutVerification.setState('idle'); // close and restore focus
window.checkoutVerification.getState();
window.checkoutVerification.clearShipping(); // remove saved contact/shipping data

window.checkoutVerification.configure({
  confirm: ({ state, demo }) => {},
  quickApproval: ({ state, demo }) => {},
  retry: ({ state, demo }) => {},
  correctDetails: ({ state, demo }) => {},
  close: ({ state, demo }) => {},
  invalid: ({ state, demo }) => {},
  statechange: ({ state, demo }) => {},
});
```

Equivalent browser events use `checkoutVerification:<callback name>` and the same `event.detail`.
Callbacks contain only the current state and `demo: true`, never input values.
`configure` replaces the previous callbacks. Invalid states return `false` without changing the UI.
Submitting the demo challenge or quick approval switches to `waiting`; retry opens a fresh challenge.
Correcting details closes the modal and focuses the shipping form. There are no automatic timers.
Success generates a stable, explicitly fictitious `DEMO-IT-…` tracking reference for that page lifetime.

The admin's **Verificare demo** dialog controls only its own embedded preview.
Shipping/contact fields use the versioned localStorage key `checkout.shipping.v1` with an explicit seven-field allowlist.
Card details, cardholder fields and challenge digits are never persisted or emitted.

The preview dialog includes one fictional session row with fixed masked fixtures, never checkout values.
Only value-free callbacks update its response marker (`DEMO` or `APPROMT`).
The four decision actions share one readiness flag: a decision locks them, a simulated confirm/quick approval/retry/correct-details response unlocks them.
Delete is always available; reset creates a fresh local row. Closing the preview discards it.
Presence and active-column highlighting are manually selected visual demo states, not visitor telemetry.