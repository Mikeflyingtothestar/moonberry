# MoonBerry
Personalised, illustrated bedtime stories where your child is the hero, read aloud.

Static site (GitHub Pages). Accounts, parental consent, child profiles (including pronoun), listener profiles, the story library, favourites, and listen history are stored in Supabase (Auth, Postgres row-level security, and Storage). The library list comes from `get_my_library`; a story’s full text is loaded when it is opened. Studio narration MP3s stay in this repository, and the shelf is read from `studio_tracks`. Allow-listed admins have an overview at `#/admin`. Visitors can still try a free 5-minute story before creating an account. Premium and Family stay on the waitlist until billing is switched on.
