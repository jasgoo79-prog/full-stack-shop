# Panou de administrare pentru pagini de produs (după modelul atașat)

## Notă despre tehnologie
Lovable nu rulează Express/MongoDB/Socket.io separat. Folosesc: React + funcții de server integrate, baza de date și autentificarea (JWT) din Lovable Cloud, Tailwind.

## Ce construiesc
1. **Autentificare admin** (`/auth`): doar conturile cu rol de admin intră în panou.
2. **Panou admin** (`/admin`): lista paginilor create, cu căutare, editare, duplicare, ștergere, link "Deschide pagina".
3. **Editor produs** (`/admin/produse/nou` și `/admin/produse/:id`): formular cu toate câmpurile din model:
   - logo, link logo, nume site, culoare brand
   - poze (încărcare sau link, reordonare)
   - titlu, recenzii, categorie/subcategorie
   - preț, preț vechi, reducere, TVA, stare, disponibilitate
   - vânzător, livrare, locație, ridicare, dată livrare, vizualizări, observatori, număr obiect
   - metode de plată, retur, garanție
   - specificații (listă nume/valoare)
   - descriere, informații vânzător, feedback-uri (listă), link feedback
   - previzualizare live alături de formular
4. **Pagina publică de produs** (`/p/:slug`): identică vizual cu modelul (antet, galerie, preț, butoane, specificații, descriere, feedback), cu link unic de distribuit.

## Detalii tehnice
- Tabele: product_pages (câmpurile de mai sus, liste ca JSON, slug unic, publicat/ciornă), user_roles (rol admin separat) + has_role; RLS: public citește doar paginile publicate, doar adminii scriu.
- Stocare pentru poze încărcate.
- Primul cont creat devine admin (sau îl setez manual după ce te înregistrezi).
- Stilurile (culori, font, spațieri) preluate din model.
