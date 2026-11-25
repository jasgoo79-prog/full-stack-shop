# Fundația magazinului online + pagina de produs după modelul atașat

## Notă despre tehnologie
Lovable nu poate rula Express, MongoDB sau Socket.io separat. Echivalentele pe care le folosesc:
- React + Express -> React cu funcții de server integrate (aceeași aplicație)
- MongoDB -> baza de date Lovable Cloud
- JWT Auth -> autentificarea Lovable Cloud (folosește tot token-uri JWT)
- Socket.io -> actualizări live prin Lovable Cloud (de ex. numărul de vizitatori/observatori)
- TailwindCSS -> rămâne la fel

## Ce construiesc
1. **Pagina de produs** (`/produs/:id`), fidelă modelului: antet cu logo și căutare, breadcrumb, galerie cu miniaturi, titlu, preț și reducere, stare, buton Cumpără / Adaugă în coș / Urmărește, livrare, plăți, retur, specificații, descriere, informații vânzător și feedback-uri. Textele rămân în italiană, ca în model.
2. **Pagina principală** (`/`): lista de produse cu link spre fiecare pagină.
3. **Cont**: înregistrare, autentificare, deconectare.
4. **Coș** (`/cos`): adăugare/ștergere produse, salvat în cont.
5. **Live**: "X persoane văd acum" și numărul de observatori se actualizează în timp real.
6. **Produse demo**: 3–4 produse completate cu datele din model.

## Detalii tehnice
- Tabele: products (toate câmpurile din obiectul PRODOTTO, inclusiv specificații/feedback ca JSON), profiles, cart_items, watchers; RLS + grant-uri.
- Citire publică a produselor; coșul și observarea doar pentru utilizatorul autentificat.
- Design: culorile, fontul și spațierile din model, ca variabile în stilurile aplicației.
- Plata reală (checkout) nu e inclusă acum; o putem adăuga ulterior.
