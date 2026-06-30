# Birthday Portal

A static birthday surprise portal with:

- Story timeline
- Verification game
- Scratch-card surprise
- Admin page for photo overrides

## Photo Backend

The live site includes bundled photos in `photos/`. The admin page can save photo overrides in the current browser with `localStorage`.

For shared uploads across devices, fill `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `config.js`, then create a `photos` table with `id` as a unique key and `url` as text.

## Deployment

This folder is ready for GitHub Pages or Vercel static hosting.
