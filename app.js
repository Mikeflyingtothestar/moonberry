/* MoonBerry app. Accounts and saved stories use Supabase; studio MP3s stay in /assets/audio. */
const APP = 'MoonBerry';
const SUPABASE_URL = 'https://jfmqmzapmgwsvvnowpzp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7PonXAFTBiy47PgTKvooOA_xddQXxoY';
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm';
const CONSENT_VERSION = '2026-11';
const POLICY_URL = 'https://mikeflyingtothestar.github.io/moonberry/#/privacy';
const PAGE_SEP = '\n\u001e\n';
const SCARY_RE = /ghost|horror|haunt|zombie|scary|monster|vampire|demon|creepy|spooky|nightmare/i;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rid = () => Math.random().toString(36).slice(2, 10);

const SC = { bedroom: ['#1b2550', '#F5C85A', '🛏️'], forest: ['#123b2e', '#9be37a', '🌲'], ocean: ['#0d3a5c', '#7fd3f7', '🐬'], space: ['#20134a', '#F5C85A', '🪐'], castle: ['#3b1d4a', '#f7a8c8', '🏰'], meadow: ['#2e4a22', '#ffe27a', '🌼'], jungle: ['#0f3d22', '#7ee3a0', '🌴'], dino: ['#24401f', '#c8e67a', '🦕'], city: ['#1c2350', '#ff9ad5', '🦸'], farm: ['#3a3218', '#ffd27a', '🐄'], dragon: ['#3e1b2a', '#ff9f6b', '🐉'], robot: ['#14324a', '#7af0e0', '🤖'], science: ['#1d2b55', '#a8f0ff', '🔭'], sports: ['#163d2a', '#fff07a', '⚽'], undersea: ['#062f45', '#5fe0d0', '🐙'], magic: ['#2a1650', '#d8a8ff', '🪄'], raya: ['#173a26', '#F5C85A', '🪔'], cny: ['#4a1414', '#ffcf5a', '🏮'], diwali: ['#3d1d0e', '#ffb347', '🪔'], xmas: ['#14304a', '#ff6b6b', '🎄'], bible: ['#2d2540', '#f3d9a4', '🕊️'], ghost: ['#1d2030', '#c9c3b0', '🕯️'], heaven: ['#3a3d6e', '#ffe9c4', '☁️'], history: ['#3a2a18', '#e6b86a', '🏛️'], meditation: ['#1d2448', '#b8c4ff', '🧘'], myth: ['#25184a', '#e0c27a', '🌕'], mystery: ['#2a2420', '#e8b46a', '🔎'], nature: ['#0f2f3a', '#8fd6c8', '🌊'], travel: ['#22234a', '#ffcf8a', '🌃'], scifi: ['#0b1a3a', '#7ab8ff', '🚀'], romance: ['#3a1f33', '#f7b2c4', '📚'], wisdom: ['#2b2a22', '#d8cf9a', '🍵'] };
const AN = { cat: '🐱', dog: '🐶', bunny: '🐰', turtle: '🐢', bear: '🐻', owl: '🦉', fox: '🦊', dinosaur: '🦕', unicorn: '🦄', dragon: '🐉', elephant: '🐘', penguin: '🐧' };
const KI = { dinosaurs: '🦖', space: '🪐', ocean: '🐬', knights: '🏰', superheroes: '🦸', farm: '🐄', fairytales: '📖', dragons: '🐉', robots: '🤖', bible: '🕊️', holidays: '🏮', science: '🔬', feelings: '💛', sports: '⚽', undersea: '🐙', jungle: '🐘', magic: '🪄', unicorns: '🦄' };
const LANGS = [['en', 'English'], ['en-GB', 'English (UK)'], ['ms', 'Bahasa Melayu'], ['id', 'Bahasa Indonesia'], ['zh', 'Chinese'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['ja', 'Japanese'], ['hi', 'Hindi'], ['ta', 'Tamil'], ['ar', 'Arabic'], ['pt', 'Portuguese'], ['it', 'Italian'], ['ko', 'Korean']];
const STUDIO_KIDS = [['s1', 'Aisha and the Twinkling Galaxy', 'Space'], ['s2', "Ethan's Mermaid's Song Adventure", 'Under the sea'], ['s3', "Aisha's Chinese New Year Night Adventure", 'Holidays'], ['s4', 'Ethan and the Moon Pond Dinosaurs', 'Dinosaurs']];
const STUDIO_ADULT = [['a1', 'The Guest in the East Wing', 'Ghost & spooky'], ['a2', 'Night Falls on Malacca', 'History'], ['a3', 'Ruth and Naomi', 'Bible']];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

let supabase = null;
let booted = false;
let routeGen = 0;
const state = {
  ready: false, session: null, profile: null, plans: [], ent: null, consent: null,
  children: [], stories: [], listeners: [], mode: 'kids', recovery: false,
  loadError: '', notice: '', editing: null, authLock: false, pendingEmail: ''
};

function siteUrl() {
  const u = new URL(location.href);
  u.hash = '';
  u.search = '';
  if (!u.pathname.endsWith('/')) u.pathname = u.pathname.replace(/[^/]*$/, '');
  if (!u.pathname) u.pathname = '/';
  return u.toString();
}
function browserLocale() {
  const raw = String(navigator.language || 'en').replace('_', '-');
  const [a, ...rest] = raw.split('-');
  const tag = a.toLowerCase() + (rest.length ? '-' + rest.join('-') : '');
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(tag) ? tag : 'en';
}
function safeLang(l) {
  const s = String(l || 'en');
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(s) ? s : 'en';
}
function uid() { return state.session?.user?.id || ''; }
function freeEnt() {
  const f = (state.plans || []).find(p => p.plan === 'free');
  return {
    plan: 'free', status: 'active', is_premium: false,
    max_story_minutes: f ? +f.max_story_minutes : 5,
    max_child_profiles: f ? +f.max_child_profiles : 2,
    ai_surprise: f ? !!f.ai_surprise : true
  };
}
function applyEnt(row) {
  if (!row) { state.ent = freeEnt(); return; }
  const mins = Number(row.max_story_minutes);
  const kids = Number(row.max_child_profiles);
  state.ent = {
    plan: row.plan || 'free',
    status: row.status || 'active',
    is_premium: !!row.is_premium,
    max_story_minutes: Number.isFinite(mins) ? mins : 5,
    max_child_profiles: Number.isFinite(kids) ? kids : 2,
    ai_surprise: row.ai_surprise !== false,
    current_period_end: row.current_period_end || null,
    cancel_at_period_end: !!row.cancel_at_period_end
  };
}
function maxMinutes() {
  const n = Number(state.ent?.max_story_minutes);
  return Number.isFinite(n) && n > 0 ? n : 5;
}
function childCap() {
  const n = Number(state.ent?.max_child_profiles);
  return Number.isFinite(n) ? n : 2;
}
function isUpgrade(error) {
  const h = `${error?.hint || ''} ${error?.message || ''} ${error?.details || ''} ${error?.code || ''}`;
  return /upgrade_required/i.test(h);
}
function isDuplicate(error) {
  return error?.code === '23505' || /duplicate key/i.test(`${error?.message || ''} ${error?.details || ''}`);
}
function isKidSafety(error) {
  const m = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`;
  return error?.kidSafety || /stories_kid_content_safe|kid-safety|cannot be played on a child|ghost|scary/i.test(m) && /check|constraint|violates|not allowed|child/i.test(m);
}
function friendly(error) {
  if (!error) return 'Something went wrong. Please try again.';
  if (error.kidSafety) return error.message;
  if (isUpgrade(error)) return 'That is past the limit of your current plan.';
  const msg = String(error.message || '');
  if (/Parental consent/i.test(msg)) return 'Please confirm you are the parent or guardian before adding a child.';
  if (/stories_kid_content_safe|kid content|is_scary/i.test(msg)) return 'That story cannot be saved for a child. MoonBerry keeps ghost and scary tales out of kids mode.';
  if (/Invalid login credentials/i.test(msg)) return 'That email and password do not match.';
  if (/Email not confirmed/i.test(msg)) return 'Confirm your email first (check your inbox), then log in.';
  if (/already registered|already been registered|User already/i.test(msg)) return 'That email is already registered. Try logging in.';
  if (/redirect/i.test(msg) && /not allowed|invalid/i.test(msg)) return 'This site address is not on the Supabase redirect list yet, so the email link cannot be sent. Add it under Authentication → URL configuration.';
  if (/Password/i.test(msg) && /least|weak|character|leaked|pwned|digit|letter/i.test(msg)) return msg;
  if (/rate limit|too many|over_request|429/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(msg)) return 'Network problem. Check your connection and try again.';
  if (/JWT|session|not authenticated|row-level security/i.test(msg)) return 'Your session expired. Please log in again.';
  if (/mime|content type|invalid_mime/i.test(msg)) return 'That file type is not allowed. Use a PNG, JPEG, or WebP image.';
  if (/exceeded the maximum|too large|413/i.test(msg)) return 'That file is too large.';
  return msg || 'Something went wrong. Please try again.';
}
function passwordProblem(pw) {
  if (!pw || pw.length < 10) return 'Use at least 10 characters.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use at least one letter and one number.';
  return '';
}
function parseInterests(s) {
  const parts = String(s || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return [...new Set(parts)].slice(0, 12).map(x => x.slice(0, 40));
}
function pronounMap() {
  try { return JSON.parse(localStorage.getItem('mb_pronouns') || '{}') || {}; } catch (e) { return {}; }
}
function rememberPronoun(id, pronoun) {
  if (!id) return;
  const m = pronounMap();
  m[id] = pronoun;
  try { localStorage.setItem('mb_pronouns', JSON.stringify(m)); } catch (e) {}
}
function readJSON(storage, key) {
  try {
    const v = JSON.parse(storage.getItem(key) || 'null');
    return v && typeof v === 'object' ? v : null;
  } catch (e) { return null; }
}
function takeNotice() {
  const t = state.notice;
  state.notice = '';
  return t;
}
function clearAccount() {
  state.session = null;
  state.profile = null;
  state.consent = null;
  state.children = [];
  state.stories = [];
  state.listeners = [];
  state.ent = freeEnt();
  state.recovery = false;
  state.editing = null;
  state.loadError = '';
}
function me() {
  if (!state.session || !state.profile) return null;
  return {
    email: state.session.user.email || '',
    name: state.profile.display_name || 'friend',
    mode: state.mode,
    children: state.children,
    listeners: state.listeners,
    stories: state.stories
  };
}
function lock(btn, label) {
  if (!btn) return () => {};
  const prev = btn.textContent;
  btn.disabled = true;
  btn.textContent = label;
  return () => { btn.disabled = false; btn.textContent = prev; };
}

function art(scene, animal) {
  const [bg, acc, e] = SC[scene] || SC.bedroom;
  const adult = !animal;
  let st = '';
  for (let i = 0; i < 28; i++) st += `<circle cx="${(i * 137) % 400}" cy="${(i * 53) % 140}" r="${i % 3 + 1}" fill="#fff" opacity=".${adult ? 3 : 5 + i % 4}"/>`;
  const g = 'g' + rid();
  const mist = scene === 'ghost' ? '<rect y="150" width="400" height="60" fill="#c9c3b0" opacity=".12"/><rect y="175" width="400" height="40" fill="#fff" opacity=".07"/>' : '';
  return `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(scene)} illustration"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#070a1a"/></linearGradient><radialGradient id="r${g}"><stop offset="0" stop-color="${acc}" stop-opacity=".45"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient></defs><rect width="400" height="260" fill="url(#${g})"/>${st}<circle cx="320" cy="60" r="70" fill="url(#r${g})"/><circle cx="320" cy="60" r="30" fill="${acc}" opacity=".9"/><circle cx="332" cy="52" r="26" fill="${bg}"/><path d="M0 210 Q100 170 200 205 T400 195 V260 H0Z" fill="${acc}" opacity=".22"/>${mist}<path d="M0 230 Q120 200 240 228 T400 220 V260 H0Z" fill="#070a1a" opacity=".6"/><text x="${adult ? 160 : 90}" y="${adult ? 205 : 200}" font-size="${adult ? 80 : 70}">${e}</text>${animal ? `<text x="230" y="215" font-size="56">${AN[animal] || '🐰'}</text>` : ''}</svg>`;
}
const mascot = `<img class="mascot" src="assets/logo-mark.svg" alt="MoonBerry logo" width="110" height="124">`;
const b64 = u => { let s = ''; u.forEach(c => s += String.fromCharCode(c)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function pack(o) {
  const stream = new Blob([JSON.stringify(o)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return b64(new Uint8Array(await new Response(stream).arrayBuffer()));
}
async function unpack(t) {
  const stream = new Blob([unb64(t)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return JSON.parse(await new Response(stream).text());
}

function hydrateChild(row, pronoun) {
  const animal = AN[row.avatar_key] ? row.avatar_key : 'bunny';
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    interests: (row.interests || []).join(', '),
    interestList: row.interests || [],
    animal,
    pronoun: pronoun || pronounMap()[row.id] || 'they',
    language: row.preferred_language || 'en',
    accent: row.preferred_accent || '',
    voice: row.preferred_voice || '',
    avatar_path: row.avatar_path || null,
    avatarUrl: ''
  };
}
function storyFromRow(row) {
  const meta = row.generation_metadata && typeof row.generation_metadata === 'object' ? row.generation_metadata : {};
  const texts = String(row.body || '').split(PAGE_SEP);
  const scenes = Array.isArray(meta.scenes) ? meta.scenes : [];
  const pages = (texts.length ? texts : ['']).map((text, i) => ({ text, scene: scenes[i] || meta.scene || 'bedroom' }));
  const child = state.children.find(c => c.id === row.child_profile_id);
  const adult = row.audience === 'adult';
  return {
    id: row.id,
    saved: true,
    mode: adult ? 'adult' : 'kids',
    title: row.title,
    pages,
    scene: meta.scene || pages[1]?.scene || pages[0]?.scene || 'bedroom',
    animal: adult ? null : (meta.animal || child?.animal || null),
    topic: adult ? row.topic : row.topic,
    lesson: meta.lesson || '',
    genre: adult ? row.topic : undefined,
    mood: meta.mood || '',
    minutes: row.length_minutes,
    cn: adult ? (meta.listenerName || 'you') : (child?.name || meta.heroName || 'your child'),
    cid: row.child_profile_id,
    pronoun: meta.pronoun || child?.pronoun || null,
    language: row.language || 'en',
    voice: row.voice || '',
    friend: meta.friend || '',
    listenerInterests: meta.listenerInterests || '',
    interests: meta.interests || '',
    childAge: meta.childAge || child?.age || 5,
    fav: !!row.is_favorite,
    created: new Date(row.created_at).getTime(),
    audio: row.studio_track_key || null,
    ai: row.source === 'ai',
    remix: !!meta.remix,
    listen_count: row.listen_count || 0
  };
}
function viewFromGenerated(gen, who, extra) {
  extra = extra || {};
  const adult = (gen.mode || extra.mode) === 'adult';
  return {
    saved: false,
    mode: adult ? 'adult' : 'kids',
    title: gen.title,
    pages: gen.pages,
    scene: gen.scene,
    animal: adult ? null : (gen.animal || who.animal || null),
    topic: gen.topic || extra.topic || 'space',
    lesson: gen.lesson || extra.lesson || '',
    genre: gen.genre || extra.genre,
    mood: gen.mood || extra.mood || '',
    minutes: gen.minutes || +extra.length || 5,
    cn: who.name || 'friend',
    cid: adult ? null : (who.id || null),
    pronoun: who.pronoun || null,
    language: who.language || 'en',
    voice: who.voice || '',
    friend: extra.friend || '',
    listenerInterests: adult ? (who.interests || '') : '',
    interests: who.interests || '',
    childAge: who.age || 5,
    fav: false,
    created: Date.now(),
    audio: extra.audio || null,
    ai: !!extra.ai,
    remix: !!extra.remix,
    listen_count: 0
  };
}
function engineChild(c) {
  return {
    name: c.name,
    age: c.age,
    interests: typeof c.interests === 'string' ? c.interests : (c.interestList || []).join(', '),
    animal: c.animal || 'bunny',
    pronoun: c.pronoun || 'they'
  };
}
function studioCast(key) {
  if (key === 's2' || key === 's4') return { name: 'Ethan', age: 7, interests: 'dinosaurs, football', animal: 'turtle', pronoun: 'he' };
  if (key.startsWith('s')) return { name: 'Aisha', age: 5, interests: 'space, drawing, rockets', animal: 'cat', pronoun: 'she' };
  return { name: 'Demo Parent', age: null, interests: 'old houses, jazz, the sea', animal: null, pronoun: null, mood: 'calm' };
}
function studioStory(key) {
  const who = studioCast(key);
  const spec = {
    s1: { topic: 'space', lesson: 'bravery', length: 5 },
    s2: { topic: 'undersea', lesson: 'friendship', length: 5 },
    s3: { topic: 'holidays', lesson: 'sharing', length: 5 },
    s4: { topic: 'dinosaurs', lesson: 'kindness', length: 5 },
    a1: { mode: 'adult', genre: 'ghost', length: 5, mood: 'cosy' },
    a2: { mode: 'adult', genre: 'history', length: 5, mood: 'calm' },
    a3: { mode: 'adult', genre: 'bible', length: 5, mood: 'calm' }
  }[key];
  const gen = Story.generate({ child: who, ...spec, seed: key });
  const view = viewFromGenerated(gen, who, { ...spec, audio: key });
  view.saved = false;
  return view;
}
function loadListeners() {
  if (!uid()) { state.listeners = []; return; }
  let local = [];
  try { local = JSON.parse(localStorage.getItem('mb_listeners_' + uid()) || '[]'); } catch (e) { local = []; }
  if (!Array.isArray(local)) local = [];
  const names = new Set(local.map(l => l.name));
  for (const s of state.stories) {
    if (s.mode !== 'adult' || !s.cn || names.has(s.cn)) continue;
    names.add(s.cn);
    local.push({ id: 'story-' + s.id, name: s.cn, interests: s.listenerInterests || '', mood: s.mood || 'calm', length: 5, fromStory: true });
  }
  state.listeners = local;
}
function storeListeners() {
  if (!uid()) return;
  const keep = state.listeners.filter(l => !l.fromStory).map(({ id, name, interests, mood, length }) => ({ id, name, interests, mood, length }));
  try { localStorage.setItem('mb_listeners_' + uid(), JSON.stringify(keep)); } catch (e) {}
}

async function loadPlans() {
  const { data, error } = await supabase.from('plan_features').select('plan, display_name, max_story_minutes, max_child_profiles, price_usd_monthly, ai_surprise');
  if (!error && data) state.plans = data;
  if (!state.session) state.ent = freeEnt();
}
async function signAvatars() {
  await Promise.all(state.children.map(async c => {
    if (!c.avatar_path) return;
    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(c.avatar_path, 3600);
    if (!error && data?.signedUrl) c.avatarUrl = data.signedUrl;
  }));
}
async function refreshAccount() {
  if (!state.session) { clearAccount(); return; }
  const id = uid();
  let profile = null, profileError = null;
  for (let i = 0; i < 4; i++) {
    const res = await supabase.from('profiles').select('id, display_name, locale, timezone, marketing_consent, marketing_consent_at, onboarding_state, adult_mode_enabled').eq('id', id).maybeSingle();
    profileError = res.error;
    profile = res.data;
    if (profile || profileError) break;
    await new Promise(r => setTimeout(r, 350 * (i + 1)));
  }
  const [ent, cons, kids, stories] = await Promise.all([
    supabase.rpc('get_my_entitlements'),
    supabase.from('parental_consents').select('id, withdrawn_at, consent_version, consented_at').order('consented_at', { ascending: false }),
    supabase.from('child_profiles').select('id, name, age, interests, avatar_key, avatar_path, preferred_language, preferred_accent, preferred_voice, created_at').order('created_at', { ascending: true }),
    supabase.from('stories').select('id, child_profile_id, audience, title, body, topic, length_minutes, language, voice, source, is_favorite, studio_track_key, generation_metadata, listen_count, created_at').order('created_at', { ascending: false })
  ]);
  state.profile = profile;
  state.loadError = '';
  const failed = profileError || ent.error || cons.error || kids.error || stories.error;
  if (!profile) state.loadError = friendly(profileError || { message: 'Your account is still being set up. Wait a moment and try again.' });
  else if (failed) state.loadError = friendly(failed);
  applyEnt(Array.isArray(ent.data) ? ent.data[0] : ent.data);
  state.consent = (cons.data || []).find(c => !c.withdrawn_at) || null;
  state.children = (kids.data || []).map(row => hydrateChild(row));
  state.stories = (stories.data || []).map(storyFromRow);
  for (const c of state.children) {
    if (pronounMap()[c.id]) continue;
    const s = state.stories.find(st => st.cid === c.id && st.pronoun);
    if (s) c.pronoun = s.pronoun;
  }
  await signAvatars();
  loadListeners();
  state.mode = profile?.adult_mode_enabled ? 'adult' : 'kids';
  if (profile && profile.onboarding_state === 'new' && localStorage.mtmode === 'adult' && !profile.adult_mode_enabled) {
    state.mode = 'adult';
    state.profile.adult_mode_enabled = true;
    supabase.from('profiles').update({ adult_mode_enabled: true }).eq('id', id);
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (profile && tz && profile.timezone === 'UTC' && tz !== 'UTC' && tz.length <= 64) {
      state.profile.timezone = tz;
      supabase.from('profiles').update({ timezone: tz }).eq('id', id);
    }
  } catch (e) {}
}

async function giveConsent() {
  const { error } = await supabase.from('parental_consents').insert({
    consent_version: CONSENT_VERSION,
    policy_url: POLICY_URL,
    method: 'checkbox_attestation',
    parent_is_adult_attested: true,
    user_agent: (navigator.userAgent || '').slice(0, 500) || null
  });
  if (error) throw error;
  if (state.profile && state.profile.onboarding_state === 'new') {
    await supabase.from('profiles').update({ onboarding_state: 'consent_pending' }).eq('id', uid());
    state.profile.onboarding_state = 'consent_pending';
  }
  const { data, error: readError } = await supabase.from('parental_consents').select('id, withdrawn_at, consent_version, consented_at').order('consented_at', { ascending: false });
  if (readError) throw readError;
  state.consent = (data || []).find(c => !c.withdrawn_at) || { id: 'ok' };
}
async function uploadAvatar(childId, file) {
  const map = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  const ext = map[file.type];
  if (!ext) throw new Error('Avatar images must be PNG, JPEG, or WebP.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Avatar images must be 2 MB or smaller.');
  const folder = `${uid()}/children`;
  const path = `${folder}/${childId}.${ext}`;
  await supabase.storage.from('avatars').remove([`${folder}/${childId}.png`, `${folder}/${childId}.jpg`, `${folder}/${childId}.webp`]);
  const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  const { error: uerr } = await supabase.from('child_profiles').update({ avatar_path: path }).eq('id', childId);
  if (uerr) throw uerr;
  return path;
}
async function saveChild(v, file) {
  const name = String(v.name || '').trim().slice(0, 40);
  if (!name) throw new Error('Please enter a name.');
  const age = Math.min(12, Math.max(1, parseInt(v.age, 10) || 5));
  const animal = AN[v.animal] ? v.animal : 'bunny';
  const pronoun = ['she', 'he', 'they'].includes(v.pronoun) ? v.pronoun : 'they';
  const editingId = v._id || '';
  if (!editingId && !state.consent) {
    const err = new Error('Please confirm you are the parent or guardian before adding a child.');
    err.consent = true;
    throw err;
  }
  const payload = {
    name,
    age,
    interests: parseInterests(v.interests),
    avatar_key: animal,
    preferred_language: safeLang(v.language),
    preferred_accent: (v.accent || '').slice(0, 32) || null,
    preferred_voice: (v.voice || '').trim().slice(0, 64) || null
  };
  let res;
  if (editingId) res = await supabase.from('child_profiles').update(payload).eq('id', editingId).select('id, name, age, interests, avatar_key, avatar_path, preferred_language, preferred_accent, preferred_voice').single();
  else res = await supabase.from('child_profiles').insert(payload).select('id, name, age, interests, avatar_key, avatar_path, preferred_language, preferred_accent, preferred_voice').single();
  if (res.error) throw res.error;
  let row = res.data;
  if (file && file.size) {
    const path = await uploadAvatar(row.id, file);
    row = { ...row, avatar_path: path };
  } else if (editingId && v.clear_avatar && row.avatar_path) {
    await supabase.storage.from('avatars').remove([row.avatar_path]);
    const cleared = await supabase.from('child_profiles').update({ avatar_path: null }).eq('id', row.id).select('id, name, age, interests, avatar_key, avatar_path, preferred_language, preferred_accent, preferred_voice').single();
    if (cleared.error) throw cleared.error;
    row = cleared.data;
  }
  rememberPronoun(row.id, pronoun);
  const view = hydrateChild(row, pronoun);
  const prev = state.children.find(c => c.id === row.id);
  if (!file && prev?.avatarUrl && view.avatar_path === prev.avatar_path) view.avatarUrl = prev.avatarUrl;
  const idx = state.children.findIndex(c => c.id === row.id);
  if (idx >= 0) state.children[idx] = view;
  else state.children.push(view);
  if (view.avatar_path && !view.avatarUrl) await signAvatars();
  if (state.profile && (state.profile.onboarding_state === 'new' || state.profile.onboarding_state === 'consent_pending')) {
    await supabase.from('profiles').update({ onboarding_state: 'profiles_created' }).eq('id', uid());
    state.profile.onboarding_state = 'profiles_created';
  }
  state.editing = null;
  return view;
}
async function deleteChild(id) {
  const c = state.children.find(x => x.id === id);
  if (c?.avatar_path) await supabase.storage.from('avatars').remove([c.avatar_path]);
  const { error } = await supabase.from('child_profiles').delete().eq('id', id);
  if (error) throw error;
  state.children = state.children.filter(x => x.id !== id);
  state.stories = state.stories.filter(s => s.cid !== id);
  if (state.editing === id) state.editing = null;
}
async function persistStory(view) {
  const audience = view.mode === 'adult' ? 'adult' : 'kid';
  const pages = view.pages || [];
  if (audience === 'kid' && SCARY_RE.test(String(view.topic || ''))) {
    const err = new Error('That story cannot be saved for a child. MoonBerry keeps ghost and scary tales out of kids mode.');
    err.kidSafety = true;
    throw err;
  }
  const minutes = Math.max(1, Math.min(120, +view.minutes || 5));
  if (minutes > maxMinutes()) { upgrade('longer_stories'); return null; }
  const meta = {
    scene: view.scene || 'bedroom',
    animal: view.animal || null,
    lesson: view.lesson || null,
    mood: view.mood || null,
    friend: (view.friend || '').slice(0, 80) || null,
    pronoun: view.pronoun || null,
    heroName: view.cn || null,
    listenerName: audience === 'adult' ? (view.cn || null) : null,
    listenerInterests: audience === 'adult' ? (view.listenerInterests || '').slice(0, 200) : null,
    interests: (view.interests || '').slice(0, 200) || null,
    childAge: view.childAge || null,
    scenes: pages.map(p => p.scene || view.scene || 'bedroom'),
    remix: !!view.remix
  };
  const row = {
    audience,
    title: String(view.title || 'Bedtime story').trim().slice(0, 200) || 'Bedtime story',
    body: pages.map(p => p.text || '').join(PAGE_SEP).slice(0, 100000) || 'Goodnight.',
    topic: String(audience === 'adult' ? (view.genre || view.topic || 'nature') : (view.topic || 'space')).slice(0, 64),
    length_minutes: minutes,
    language: safeLang(view.language),
    voice: view.voice ? String(view.voice).slice(0, 64) : null,
    source: view.audio ? 'studio' : view.ai ? 'ai' : 'template',
    content_rating: audience === 'kid' ? 'kids' : 'general',
    is_scary: audience === 'adult' && (view.genre === 'ghost' || view.topic === 'ghost'),
    studio_track_key: view.audio || null,
    generation_metadata: meta
  };
  if (audience === 'kid' && view.cid && /^[0-9a-f-]{36}$/i.test(view.cid)) row.child_profile_id = view.cid;
  const { data, error } = await supabase.from('stories').insert(row).select('id, child_profile_id, audience, title, body, topic, length_minutes, language, voice, source, is_favorite, studio_track_key, generation_metadata, listen_count, created_at').single();
  if (error) {
    if (isUpgrade(error)) { upgrade('longer_stories'); return null; }
    if (isKidSafety(error)) {
      const err = new Error('That story cannot be saved for a child. MoonBerry keeps ghost and scary tales out of kids mode.');
      err.kidSafety = true;
      throw err;
    }
    throw error;
  }
  const saved = storyFromRow(data);
  state.stories.unshift(saved);
  if (state.profile && state.profile.onboarding_state !== 'completed') {
    supabase.from('profiles').update({ onboarding_state: 'completed' }).eq('id', uid());
    state.profile.onboarding_state = 'completed';
  }
  return saved;
}
async function joinWaitlist(email, feature) {
  const allowed = ['longer_stories', 'premium', 'family', 'android_app', 'ios_app', 'ai_surprise'];
  const { error } = await supabase.from('waitlist_signups').insert({
    email: String(email || '').trim().slice(0, 254),
    feature: allowed.includes(feature) ? feature : 'premium',
    source: 'web',
    locale: browserLocale().slice(0, 16)
  });
  if (error && !isDuplicate(error)) throw error;
}
async function removeOwnedFiles(bucket) {
  const root = uid();
  if (!root) return;
  const paths = [];
  async function walk(dir, depth) {
    if (depth > 6) return;
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(bucket).list(dir, { limit: 100, offset });
      if (error) throw error;
      const batch = data || [];
      if (!batch.length) break;
      for (const item of batch) {
        const path = `${dir}/${item.name}`;
        const folder = item.id == null && item.metadata == null;
        if (folder) await walk(path, depth + 1);
        else paths.push(path);
      }
      if (batch.length < 100) break;
      offset += batch.length;
    }
  }
  await walk(root, 0);
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabase.storage.from(bucket).remove(paths.slice(i, i + 100));
    if (error) throw error;
  }
}
async function deleteAccount() {
  await removeOwnedFiles('avatars');
  await removeOwnedFiles('user-audio');
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  try { await supabase.auth.signOut({ scope: 'local' }); } catch (e) {}
  clearAccount();
  try { sessionStorage.setItem('mb_flash', 'Your account has been deleted.'); } catch (e) {}
}

function nav() {
  const u = me();
  const mode = u ? state.mode : 'kids';
  $('#nav').innerHTML = `<a href="#/" style="text-decoration:none" aria-label="MoonBerry home"><span class="brand"><img src="assets/logo-mark.svg" alt="" width="30" height="34"><span class="wm"><span class="m1">Moon</span><span class="m2">Berry</span></span></span></a><div class="row">${u ? `<div class="toggle" role="group" aria-label="Story mode"><button data-act="mode" data-m="kids" class="${mode === 'kids' ? 'on' : ''}">For my child</button><button data-act="mode" data-m="adult" class="${mode === 'adult' ? 'on' : ''}">For me</button></div>` : ''}${u ? `<a href="#/app">My stories</a><a href="#/account">Account</a><button class="btn ghost" data-act="logout">Log out</button>` : `<a href="#/login">Log in</a><a class="btn" href="#/signup">Start free</a>`}</div>`;
}
const tryBtn = `<a class="btn ghost" href="#/try">Try a free 5-minute story</a>`;
const KTOP = Story.KID_TOPICS, AGEN = Story.ADULT_GENRES;
const opts = (o, sel) => Object.entries(o).map(([k, v]) => `<option value="${k}" ${k == sel ? 'selected' : ''}>${esc(v)}</option>`).join('');
const L2 = a => Object.fromEntries(a.map(x => [x, x[0].toUpperCase() + x.slice(1)]));
const words = s => (s.pages || []).reduce((n, p) => n + String(p.text || '').split(/\s+/).filter(Boolean).length, 0);
const estMin = s => Math.max(1, Math.round(words(s) / (s.mode === 'adult' ? 113 : 130)));
const KLEN = [5, 10, 15], ALENS = [5, 10, 20, 30];
function lenSel(name, list, sel) {
  const max = maxMinutes();
  let chosen = +sel || list[0];
  if (!list.includes(chosen) || chosen > max) chosen = list.find(m => m <= max) || list[0];
  return `<select name="${name}" data-len>${list.map(m => `<option value="${m}" ${m === chosen ? 'selected' : ''} ${m > max ? 'data-locked="1"' : ''}>${m} minutes${m > max ? ' 🔒 Premium' : (max <= 5 ? ' · Free' : ' · included')}</option>`).join('')}</select>`;
}
function planBox() {
  const e = state.ent || freeEnt();
  const name = e.plan === 'family' ? 'Family' : e.plan === 'premium' ? 'Premium' : 'Free';
  return `<div class="card plan"><div class="row" style="justify-content:space-between;align-items:center"><div><span class="badge ${e.is_premium ? 'gold' : ''}">${e.is_premium ? '★ ' : ''}${esc(name)} plan</span> <span class="muted">${e.is_premium ? `Stories up to ${e.max_story_minutes} minutes · ${e.max_child_profiles} child profiles.` : `Stories up to ${e.max_story_minutes} minutes · ${e.max_child_profiles} child profiles. Longer stories are Premium.`}</span></div><button class="btn ghost" type="button" data-act="upgrade" data-feature="premium">See plans</button></div></div>`;
}
function aiBtn(form) {
  if (state.ent && state.ent.ai_surprise === false) return '<p class="muted">AI Surprise is not included on your plan.</p>';
  return `<button type="button" class="btn ai-btn" style="width:100%;margin-top:8px" data-act="ai" data-f="${form}">✨ AI Surprise story <span class="muted" style="font-size:12px">· free · 5 min · new every time</span></button>`;
}
function upgrade(feature) {
  const feat = feature || 'premium';
  if ($('#modal')) return;
  const email = state.session?.user?.email ? esc(state.session.user.email) : '';
  const d = document.createElement('div');
  d.id = 'modal';
  d.innerHTML = `<div class="mbg" data-act="mclose"></div><div class="mbox" role="dialog" aria-modal="true" aria-labelledby="mt"><button class="mx" data-act="mclose" aria-label="Close">×</button><span class="badge gold">🔒 Premium</span><h2 id="mt">${feat === 'family' ? 'More child profiles are part of a higher plan' : 'Longer stories are part of Premium'}</h2><p class="muted">Free includes stories up to ${maxMinutes()} minutes and ${childCap()} child profiles. Premium and Family are launching soon, and no payment is taken today.</p><div class="grid"><div class="card price hl"><h3>Premium</h3><p><b>US$5.99 / month</b> <span class="muted">(launching soon)</span></p><ul><li>10, 15, 20 and 30-minute stories</li><li>Every kids topic and adult genre</li><li>Studio voices (planned)</li><li>Sleep timer and bedtime mode</li></ul></div><div class="card price"><h3>Family</h3><p><b>US$9.99 / month</b> <span class="muted">(launching soon)</span></p><ul><li>Everything in Premium</li><li>A profile for every child</li><li>Shared family library</li></ul></div></div><form data-form="wait" data-feature="${esc(feat)}" id="waitf"><label>Email for the waitlist<input type="email" name="email" required maxlength="120" placeholder="you@example.com" value="${email}"></label><div class="row"><button class="btn">Join the waitlist</button><button type="button" class="btn ghost" data-act="mclose">Maybe later</button></div><p class="muted" style="font-size:13px">We only store your email and which feature you asked about. No card, no payment.</p></form></div>`;
  document.body.appendChild(d);
  setTimeout(() => d.querySelector('input,button')?.focus(), 30);
}
function library(list) {
  const items = [...list].sort((a, b) => (b.fav - a.fav) || (b.created - a.created));
  if (!items.length) return '<h2>Story library</h2><p class="muted">No stories yet. Create your first one above.</p>';
  return `<h2>Story library</h2><div class="grid">${items.map(s => `<div class="card" style="margin:0"><a style="text-decoration:none;color:inherit" href="#/story/${s.id}">${art(s.pages[1]?.scene || s.scene, s.animal)}<h3>${s.fav ? '⭐ ' : ''}${esc(s.title)}</h3><p class="muted">${s.ai ? '<span class="badge gold">AI</span> ' : s.remix ? '<span class="badge">Remix</span> ' : ''}${s.audio ? '<span class="badge">Studio</span> ' : ''}For ${esc(s.cn)} · ${esc(s.mode === 'adult' ? (AGEN[s.genre] || s.genre || '') : ((KTOP[s.topic] || '') + (s.lesson ? ' · ' + s.lesson : '')))} · ⏱ ~${estMin(s)} min · ${s.pages.length} pages${s.listen_count ? ` · listened ${s.listen_count}×` : ''}</p></a><div class="row" style="margin-top:8px"><button type="button" class="btn ghost danger" data-act="delstory" data-id="${esc(s.id)}">Delete</button></div></div>`).join('')}</div>`;
}
function pendingBanner() {
  const p = readJSON(sessionStorage, 'mb_pending');
  if (!p?.title) return '';
  return `<div class="banner"><p style="margin:0 0 8px">You made “${esc(p.title)}” before it was saved.</p><button type="button" class="btn" data-act="savepending">Save it to my library</button> <button type="button" class="btn ghost" data-act="droppending">Discard</button></div>`;
}
function consentForm() {
  return `<h2>A parent's OK</h2><p class="muted">MoonBerry keeps a profile for your child only after a parent or guardian agrees. We store a nickname, age, interests, language, and an optional avatar. You can delete everything later from Account.</p><p class="muted">Please read the <a href="#/privacy">Privacy Policy</a> (version ${CONSENT_VERSION}).</p><form data-form="consent"><label class="check"><input type="checkbox" name="adult" required><span>I am this child's parent or legal guardian, and I am 18 or older.</span></label><label class="check"><input type="checkbox" name="policy" required><span>I agree to that privacy policy for this child's profile.</span></label><button class="btn" style="width:100%">Save my consent</button></form>`;
}
function childForm(c) {
  const editing = !!c;
  return `<h2>${editing ? 'Edit child' : (state.children.length ? 'Add a child' : 'Add your child')}</h2><form data-form="child"><input type="hidden" name="_id" value="${editing ? esc(c.id) : ''}"><label>Name<input name="name" required maxlength="40" value="${editing ? esc(c.name) : ''}" autocomplete="off"></label><div class="row"><label style="flex:1">Age<input type="number" name="age" min="1" max="12" value="${editing ? c.age : 5}" required></label><label style="flex:1">Pronoun<select name="pronoun">${['she', 'he', 'they'].map(p => `<option value="${p}" ${editing && c.pronoun === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label></div><label>Interests (comma separated)<input name="interests" maxlength="200" value="${editing ? esc(c.interests) : ''}" placeholder="space, dinosaurs, drawing"></label><label>Favourite animal<select name="animal">${opts(L2(Object.keys(AN)), editing ? c.animal : 'cat')}</select></label><label>Story language<select name="language">${LANGS.map(([k, v]) => `<option value="${k}" ${(editing ? c.language : 'en') === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label><label>Preferred voice<select name="voice" id="cvoice" data-sel="${esc(editing ? c.voice : '')}"><option value="">Device default</option></select></label><label>Avatar image, optional<input type="file" name="avatar" accept="image/png,image/jpeg,image/webp"></label>${editing && c.avatarUrl ? `<img class="avatar" alt="" src="${esc(c.avatarUrl)}">` : ''}${editing && c.avatar_path ? '<label class="check"><input type="checkbox" name="clear_avatar" value="1"><span>Remove avatar image</span></label>' : ''}<button class="btn${editing ? '' : ' ghost'}" style="width:100%">${editing ? 'Save changes' : 'Add child'}</button>${editing ? '<button type="button" class="btn ghost" data-act="canceledit" style="margin-top:8px">Cancel</button>' : ''}</form><p class="muted" style="font-size:13px">A nickname is enough. An avatar is optional and only you can see it.</p>`;
}
function childPanel() {
  const editing = state.editing ? state.children.find(x => x.id === state.editing) : null;
  const list = state.children.map(ch => `<div class="prow"><div class="row">${ch.avatarUrl ? `<img class="avatar" alt="" src="${esc(ch.avatarUrl)}">` : `<span style="font-size:28px" aria-hidden="true">${AN[ch.animal] || '🐰'}</span>`}<p><b>${esc(ch.name)}</b> <span class="muted">${ch.age} · ${esc(ch.pronoun)} · ${esc(ch.language)}</span><br><span class="muted">${esc(ch.interests || 'No interests yet')}</span></p></div><div class="row"><button type="button" class="btn ghost" data-act="editchild" data-id="${esc(ch.id)}">Edit</button><button type="button" class="btn ghost danger" data-act="delchild" data-id="${esc(ch.id)}">Delete</button></div></div>`).join('');
  if (!state.consent) return consentForm() + (list ? `<div class="plist">${list}</div>` : '');
  if (!editing && state.children.length >= childCap()) {
    return `<h2>Child profiles</h2><p class="muted">Your ${esc(state.ent?.plan || 'free')} plan includes ${childCap()} child profiles. Join the waitlist and we will say when you can add more.</p><button type="button" class="btn" data-act="upgrade" data-feature="family">Join the waitlist</button><div class="plist">${list}</div>`;
  }
  return childForm(editing) + (list ? `<div class="plist">${list}</div>` : '');
}
function studioShelf() {
  const rows = state.mode === 'adult' ? STUDIO_ADULT : STUDIO_KIDS;
  return `<h2>Studio voices</h2><p class="muted">Recorded samples read with Kokoro, an open-source neural voice. They play from this website. Save a copy if you want it in your library.</p><div class="grid">${rows.map(([k, t, g]) => `<button type="button" class="card" data-act="studio" data-k="${k}"><span class="tag">${esc(g)}</span><h3>${esc(t)}</h3><p class="muted">🎙 Studio narration · about 5 minutes</p></button>`).join('')}</div>`;
}
function listenerList() {
  if (!state.listeners.length) return '';
  return `<div class="plist">${state.listeners.map(l => `<div class="prow"><p><b>${esc(l.name)}</b> <span class="muted">· ${esc(l.mood || 'calm')}${l.interests ? ' · ' + esc(l.interests) : ''}</span></p>${l.fromStory ? '' : `<button type="button" class="btn ghost" data-act="dellistener" data-id="${esc(l.id)}">Remove</button>`}</div>`).join('')}</div>`;
}

const V = {};
const FAQ = [
  ['Is it safe for children?', 'Kids mode only offers gentle topics. Ghost and horror genres cannot be chosen or generated there, and the library refuses to store a scary story on a child profile. Every kids story ends calmly.'],
  ['How are stories made?', 'MoonBerry composes each story from a hand-written library of arcs, settings and endings, personalised with the details you give it. You can also try an optional in-browser AI surprise: it downloads a model to your device and, if that cannot run, falls back to the same template engine.'],
  ['Where is my data stored?', 'Your account, child profiles and saved stories are stored in your MoonBerry account, hosted in the EU. A story you try before signing up stays in this browser until you save it. We never require a photo of your child.'],
  ['Which voices are used for narration?', 'MoonBerry uses the voices built into your browser. A few sample stories also include recorded studio voices. You can choose a voice and speed in the reader.'],
  ['Does it cost anything?', 'Early access is free, including 5-minute stories. Premium and Family plans are planned; no payments are taken today. Longer stories ask you to join a waitlist instead of unlocking a preview.'],
  ['Is there anything for parents?', 'Yes. After you sign in, switch to “For me” for grown-up sleep stories. Those stories are not shown in kids mode.']
].map(q => `<details><summary>${q[0]}</summary><p class="muted">${q[1]}</p></details>`).join('');
V.landing = () => {
  let stars = '';
  for (let i = 0; i < 90; i++) stars += `<i class="star" style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${(Math.random() * 3).toFixed(2)}s;opacity:${(.3 + Math.random() * .7).toFixed(2)}"></i>`;
  const flash = (() => { try { const t = sessionStorage.getItem('mb_flash'); if (!t) return ''; sessionStorage.removeItem('mb_flash'); return `<div class="banner">${esc(t)}</div>`; } catch (e) { return ''; } })();
  return `${flash}<section class="hero"><div class="sky"><div class="layer" data-depth="10">${stars}</div><div class="layer" data-depth="25"><div class="moon"></div></div><div class="layer" data-depth="40"><div class="cloud" style="top:30%;width:180px;animation-duration:70s"></div><div class="cloud" style="top:58%;width:240px;animation-duration:95s;animation-delay:-40s"></div><div class="cloud" style="top:75%;width:140px;animation-duration:60s;animation-delay:-20s"></div></div><div class="shoot" id="shoot"></div></div>
<div class="hero-in">${mascot}<h1>Bedtime stories where<br>your child is <em style="color:var(--gold)">the hero</em></h1><p style="font-size:19px" class="muted">${APP} creates a brand-new illustrated bedtime story every night, starring your child, their favourite things and a gentle lesson you choose. Then it reads it aloud, so bedtime is calm, cosy and something you share.</p><div class="row" style="justify-content:center"><a class="btn" href="#/signup">Create your child's first story free</a>${tryBtn}</div><p class="muted" style="font-size:13px;margin-top:14px">No card needed · Works on any phone · Early access</p></div></section>
<section class="section reveal"><span class="tag">For kids</span><h2>Adventures where your child is the hero</h2><p class="muted">18 gentle topics, picked automatically from your child's interests or chosen by you, plus a lesson for tonight: kindness, bravery, sharing, honesty, patience, friendship or a calm bedtime routine. Never scary.</p><div class="grid">${Object.entries(KTOP).map(([k, v]) => `<div class="card gcard"><div class="ic">${KI[k]}</div><h3>${esc(v)}</h3></div>`).join('')}</div></section>
<section class="section"><h2 class="center reveal">How it works</h2><div class="grid">${[['🧒', 'Create a profile', 'Add your child: name, age, interests and favourite animal.'], ['🎨', "Choose tonight's story", 'Let us match a topic to their interests, or pick one, plus a lesson for tonight.'], ['🌙', 'Read or listen', 'Illustrated pages, narrated aloud, in a dark, calm bedtime mode.']].map((s, i) => `<div class="card reveal" style="transition-delay:${i * .15}s"><div style="font-size:34px">${s[0]}</div><h3>${i + 1}. ${s[1]}</h3><p class="muted">${s[2]}</p></div>`).join('')}</div></section>
<section class="section reveal"><h2>A peek inside tonight's story</h2><div class="card"><div class="grid"><div id="sampleart"></div><div><h3 id="sampletitle"></h3><p class="page type" id="typer" style="font-size:18px;min-height:8em"></p></div></div></div></section>
<section class="section"><h2 class="center reveal">Everything bedtime needs</h2><div class="grid">${[['🔊', 'Read-aloud narration', 'Choose a voice and speed; the sentence being read is highlighted.'], ['🌙', 'Bedtime mode', 'A dark, distraction-free reader that is easy on sleepy eyes.'], ['⏲️', 'Sleep timer', 'Narration fades out after 5, 10 or 20 minutes.'], ['🔗', 'Share a story', 'Send a read-only link to grandparents and friends.'], ['👨‍👩‍👧', 'Multiple profiles', 'Each child gets their own profile, stories and library.'], ['🛡️', 'Safe for kids', 'Kids mode never offers ghost or scary genres, and stories end calmly.']].map(f => `<div class="card reveal"><div style="font-size:28px">${f[0]}</div><h3>${f[1]}</h3><p class="muted">${f[2]}</p></div>`).join('')}</div></section>
<section class="section reveal"><h2>Why bedtime stories matter</h2><div class="grid"><div class="card"><h3>Connection</h3><p class="muted">A shared story is a few quiet minutes of closeness at the end of the day.</p></div><div class="card"><h3>Routine</h3><p class="muted">Paediatric guidance, such as from the <a href="https://www.aap.org/" target="_blank" rel="noopener">American Academy of Pediatrics</a>, encourages a consistent bedtime routine, and reading together is a classic part of one.</p></div><div class="card"><h3>Winding down</h3><p class="muted">A calm story in a parent's voice, or ours, replaces screens at bedtime and gives busy little minds something gentle to follow.</p></div></div></section>
<section class="section reveal" id="pricing"><h2 class="center">Simple pricing <span class="muted" style="font-size:15px">(planned, payments not yet live)</span></h2><div class="grid"><div class="card price"><h3>Free</h3><p><b>$0</b></p><p class="muted">Unlimited 5-minute stories starring your child · read-aloud · family library</p></div><div class="card price hl"><span class="tag">Most popular</span><h3>Premium</h3><p><b>US$5.99 / month</b></p><p class="muted">Longer 10 and 15-minute bedtime adventures · studio voices for little listeners (planned)</p></div><div class="card price"><h3>Family</h3><p><b>US$9.99 / month</b></p><p class="muted">Everything in Premium · a profile for every child · stories to share with grandparents</p></div></div></section>
<section class="section reveal"><h2>Questions</h2>${FAQ}</section>
<section class="section center reveal"><h2>Tonight's story is waiting</h2><p class="muted">Create one in under a minute. Or try a free story with no account.</p><div class="row" style="justify-content:center"><a class="btn" href="#/signup">Start free</a>${tryBtn}</div></section>`;
};
V.auth = (mode, err) => `<div class="card" style="max-width:440px;margin:30px auto"><h2>${mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}<form data-form="${mode}">${mode === 'signup' ? `<label>Your name<input name="name" required maxlength="80" autocomplete="name"></label><label>Who are the stories for?</label><div class="chips"><label><input type="radio" name="mode" value="kids" ${(localStorage.mtmode || 'kids') !== 'adult' ? 'checked' : ''}><span>🧒 For my child</span></label><label><input type="radio" name="mode" value="adult" ${localStorage.mtmode === 'adult' ? 'checked' : ''}><span>🌙 For me (adult)</span></label></div>` : ''}<label>Email<input type="email" name="email" required maxlength="120" autocomplete="email"></label><label>Password<input type="password" name="password" required minlength="10" maxlength="200" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}"></label>${mode === 'signup' ? '<p class="muted" style="font-size:12px;margin-top:-6px">At least 10 characters, with a letter and a number.</p>' : ''}<button class="btn" style="width:100%">${mode === 'signup' ? 'Sign up' : 'Log in'}</button></form>${mode === 'login' ? '<p class="muted" style="text-align:center"><a href="#/forgot">Forgot your password?</a></p>' : ''}<p class="muted" style="text-align:center">${mode === 'signup' ? 'Have an account? <a href="#/login">Log in</a>' : 'New here? <a href="#/signup">Sign up</a>'}</p><p class="muted" style="font-size:12px;text-align:center">Your library is saved to your MoonBerry account. <a href="#/try">Try a free story without an account.</a></p></div>`;
V.checkEmail = email => `<div class="card" style="max-width:480px;margin:30px auto"><h2>Check your email</h2><p>We sent a confirmation link to <b>${esc(email)}</b>. Open it in this browser and MoonBerry will bring you back signed in.</p><p class="muted">If you open the link on another device, come back here and log in after confirming.</p><button class="btn" type="button" data-act="resend">Resend email</button> <a href="#/login">I have confirmed — log in</a></div>`;
V.forgot = (err, sent) => `<div class="card" style="max-width:440px;margin:30px auto"><h2>Reset your password</h2>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}${sent ? '<p class="ok">If an account exists for that email, a reset link is on its way. Open it in this browser.</p>' : `<form data-form="forgot"><label>Email<input type="email" name="email" required maxlength="120" autocomplete="email"></label><button class="btn" style="width:100%">Send reset link</button></form>`}<p class="muted" style="text-align:center"><a href="#/login">Back to log in</a></p></div>`;
V.reset = err => `<div class="card" style="max-width:440px;margin:30px auto"><h2>Choose a new password</h2>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}${state.session ? `<form data-form="reset"><label>New password<input type="password" name="password" required minlength="10" autocomplete="new-password"></label><label>Confirm<input type="password" name="confirm" required minlength="10" autocomplete="new-password"></label><p class="muted" style="font-size:12px;margin-top:-6px">At least 10 characters, with a letter and a number.</p><button class="btn" style="width:100%">Update password</button></form>` : '<p class="muted">Open the reset link from your email, or <a href="#/forgot">request a new one</a>.</p>'}</div>`;
V.try = err => `<div class="card" style="max-width:640px;margin:20px auto"><h2>Try a free story</h2><p class="muted">No account needed. This makes one gentle 5-minute story and reads it aloud. Sign up if you want to keep it.</p>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}<p class="muted"><a href="#/studio/s1">Hear a recorded studio sample</a> instead.</p><form data-form="try"><label>Child's name<input name="name" required maxlength="40" placeholder="A nickname is fine"></label><div class="row"><label style="flex:1">Age<input type="number" name="age" min="1" max="12" value="5" required></label><label style="flex:1">Pronoun<select name="pronoun"><option>she</option><option>he</option><option>they</option></select></label></div><label>Interests (comma separated)<input name="interests" maxlength="100" placeholder="space, drawing, rabbits"></label><label>Favourite animal<select name="animal">${opts(L2(Object.keys(AN)), 'cat')}</select></label><label>Topic</label><div class="chips"><label><input type="radio" name="topic" value="auto" checked><span>✨ Based on interests</span></label>${Object.entries(KTOP).map(([t, v]) => `<label><input type="radio" name="topic" value="${t}"><span>${KI[t] || ''} ${esc(v)}</span></label>`).join('')}</div><label>Lesson<select name="lesson">${opts(L2(Story.LESSONS))}</select></label><p class="muted">Length: 5 minutes · Free</p><button class="btn" style="width:100%">✨ Create my free story</button></form></div>`;
V.account = err => {
  const note = takeNotice();
  const e = state.ent || freeEnt();
  const name = e.plan === 'family' ? 'Family' : e.plan === 'premium' ? 'Premium' : 'Free';
  return `<h1 style="font-size:34px">Account</h1>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}${note ? `<p class="ok" role="status">${esc(note)}</p>` : ''}<div class="grid"><div class="card"><h2>Profile</h2><form data-form="profile"><label>Your name<input name="name" required maxlength="80" value="${esc(state.profile?.display_name || '')}" autocomplete="name"></label><label>Email<input value="${esc(state.session?.user?.email || '')}" disabled></label><label class="check"><input type="checkbox" name="marketing" ${state.profile?.marketing_consent ? 'checked' : ''}><span>Email me when Premium launches. No payment emails.</span></label><button class="btn">Save profile</button></form></div><div class="card"><h2>Password</h2><form data-form="password"><label>New password<input type="password" name="password" required minlength="10" autocomplete="new-password"></label><label>Confirm<input type="password" name="confirm" required minlength="10" autocomplete="new-password"></label><button class="btn">Update password</button></form><p class="muted">Or <a href="#/forgot">email me a reset link</a>.</p></div></div><div class="card"><h2>Plan</h2><p><span class="badge ${e.is_premium ? 'gold' : ''}">${esc(name)}</span> ${e.is_premium ? `Stories up to ${e.max_story_minutes} minutes · ${e.max_child_profiles} child profiles.` : `Up to ${e.max_story_minutes} minute stories and ${e.max_child_profiles} child profiles. Payments are not live yet.`}</p><button type="button" class="btn ghost" data-act="upgrade" data-feature="premium">See plans</button></div><div class="card"><h2>Delete account</h2><p class="muted">This removes your login, child profiles, saved stories, and any avatars or audio you uploaded. It cannot be undone.</p><form data-form="deleteacct"><label>Type DELETE to confirm<input name="confirm" required autocomplete="off"></label><button class="btn danger">Delete my account</button></form></div>`;
};
V.app = (u, msg) => {
  const note = takeNotice();
  const err = [state.loadError, msg].filter(Boolean).map(t => `<p class="err" role="alert">${esc(t)}</p>`).join('') + (note ? `<p class="ok" role="status">${esc(note)}</p>` : '') + pendingBanner();
  if (u.mode === 'adult') {
    const L = u.listeners;
    return `<h1 style="font-size:34px">Good evening, ${esc(u.name || 'friend')} 🌙</h1>${err}${planBox()}<div class="grid"><div class="card"><h2>Tonight's sleep story</h2>${L.length ? `<form data-form="astory"><label>Listener<select name="lid">${L.map(l => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('')}</select></label><label>Genre<select name="genre">${opts(AGEN)}</select></label><label>Mood<select name="mood">${opts({ calm: 'Calm', cosy: 'Cosy', wistful: 'Wistful' }, L[0].mood)}</select></label><label>Length${lenSel('length', ALENS, L[0].length)}</label><button class="btn" style="width:100%">✨ Create sleep story</button>${aiBtn('astory')}</form>` : '<p class="muted">Create your listener profile first →</p>'}</div>
<div class="card"><h2>${L.length ? 'Add a listener' : 'Your listener profile'}</h2><form data-form="listener"><label>Name<input name="name" required maxlength="40" value="${L.length ? '' : esc(u.name || '')}"></label><label>Interests (comma separated)<input name="interests" maxlength="100" placeholder="the sea, old libraries, jazz"></label><label>Preferred mood<select name="mood">${opts({ calm: 'Calm', cosy: 'Cosy', wistful: 'Wistful' })}</select></label><label>Preferred length${lenSel('length', ALENS, 5)}</label><button class="btn ghost" style="width:100%">Save listener</button></form>${listenerList()}<p class="muted" style="font-size:13px">Listener names stay on this device and are also remembered on each sleep story you save.</p></div></div>${library(u.stories.filter(s => s.mode === 'adult'))}${studioShelf()}`;
  }
  const k = u.children;
  return `<h1 style="font-size:34px">Goodnight, ${esc(u.name || 'friend')} 🌙</h1>${err}${planBox()}
<div class="grid"><div class="card" id="create"><h2>Tonight's story</h2>${k.length ? `<form data-form="story"><label>Child<select name="cid">${k.map(c => `<option value="${esc(c.id)}">${esc(c.name)} (${c.age})</option>`).join('')}</select></label><label>Topic</label><div class="chips">${'<label><input type="radio" name="topic" value="auto" checked><span>✨ Based on interests</span></label>' + Object.entries(KTOP).map(([t, v]) => `<label><input type="radio" name="topic" value="${t}"><span>${KI[t] || ''} ${esc(v)}</span></label>`).join('')}</div><label>Lesson<select name="lesson">${opts(L2(Story.LESSONS))}</select></label><label>Length${lenSel('length', KLEN, 5)}</label><label>Bring along (optional)<input name="friend" maxlength="40" placeholder="e.g. little brother Adam, or our dog Max"></label><button class="btn" style="width:100%">✨ Create story</button>${aiBtn('story')}</form>` : '<p class="muted">Add a child first →</p>'}</div>
<div class="card">${childPanel()}</div></div>${library(u.stories.filter(s => s.mode !== 'adult'))}${studioShelf()}`;
};
V.reader = (s, pub) => {
  const guest = !pub && !s.saved;
  const actions = pub
    ? `<p class="muted">A personalised story made with ${APP}. <a href="#/signup">Make one of your own →</a></p>`
    : guest
      ? `<div class="banner"><p style="margin:0 0 8px">${state.session ? 'This sample is not in your library yet.' : 'This story stays on this device until you leave. Create a free account to keep it.'}</p><button type="button" class="btn" data-act="keep">💾 Save to my library</button>${state.session ? '' : ' <a href="#/signup">Sign up</a>'}</div><div class="row" style="margin-top:14px"><button class="btn ghost" data-act="share" id="share">🔗 Copy share link</button><a href="${state.session ? '#/app' : '#/'}">← ${state.session ? 'Library' : 'Home'}</a></div>`
      : `<div class="row" style="margin-top:14px"><button class="btn ghost" data-act="fav">${s.fav ? '★ Unfavourite' : '☆ Favourite'}</button><button class="btn ghost" data-act="share" id="share">🔗 Copy share link</button><button class="btn ghost danger" data-act="delstory" data-id="${esc(s.id)}">Delete</button><a href="#/app">← Library</a></div>`;
  return `<div class="card"><span class="tag">${esc(s.mode === 'adult' ? (AGEN[s.genre] || 'Story') : (KTOP[s.topic] || 'Story'))}</span><h1 style="font-size:32px">${esc(s.title)}</h1><p class="muted">⏱ About ${estMin(s)} minutes read aloud · ${s.pages.length} pages${s.listen_count ? ` · listened ${s.listen_count}×` : ''}</p>${s.pages.map((p, i) => `<div class="pg" ${i ? 'hidden' : ''}>${art(p.scene, s.animal)}<p class="page">${esc(p.text).split(/(?<=[.!?…]["”]?)\s+/).map(x => `<span class="sn">${x}</span>`).join(' ')}</p><p class="muted">Page ${i + 1} of ${s.pages.length}</p></div>`).join('')}
<div class="row"><button class="btn ghost" data-act="prev">← Back</button><button class="btn" data-act="play" id="play">▶ Read aloud</button><button class="btn ghost" data-act="next">Next →</button><button class="btn ghost" data-act="bed">🌙 Bedtime mode</button></div>
<div class="row" style="margin-top:10px"><label style="flex:2;min-width:200px">Voice<span class="row" style="gap:6px;flex-wrap:nowrap"><select id="voice" style="flex:1"></select><button type="button" class="btn ghost vprev" data-act="vprev" aria-label="Preview voice">▶</button></span></label><label style="flex:1;min-width:100px">Speed<select id="rate"><option value=".7">Slow</option><option value=".85" selected>Gentle</option><option value="1">Normal</option></select></label><label style="flex:1;min-width:110px">Sleep timer<select id="timer"><option value="0">Off</option><option value="5">5 min</option><option value="10">10 min</option><option value="20">20 min</option><option value="30">30 min</option></select></label></div><p class="muted hint" style="font-size:13px">${s.audio ? '🎙 This story has <b>Studio voices</b>, recorded with an open-source neural voice. Pick one in the Voice list. ' : ''}For the most natural browser voices, use Microsoft Edge or Chrome. Stories are written in English; other-language voices read them with that accent.</p>
${actions}</div>`;
};

const PAGES = {
  about: ['About MoonBerry', `<p>MoonBerry is an early-access app that creates personalised bedtime stories. For children, the child becomes the hero of a gentle adventure with a lesson chosen by their parent. For adults, MoonBerry offers slow, calming sleep stories across genres from history to mythology.</p><p>We started MoonBerry in Malaysia because bedtime is one of the few moments in a busy day that families share, and we wanted to make it a little more magical, in any language and any home.</p>`],
  privacy: ['Privacy Policy', `<p><i>Draft, early access. Last updated November 2026.</i></p><h2>What we collect</h2><p>When you create an account we store your email address and a display name. Your password is handled by our authentication provider; this website never keeps the password itself. If you ask for product news, we store that choice and the time you gave it.</p><p>Saved stories, favourites and listening progress are stored in your account. If you join a waitlist, we store your email and which feature you asked about. A story you try before signing up stays in this browser until you save it or leave.</p><h2>Children's data</h2><p>We only create a child profile after a parent or guardian confirms they are an adult and agrees to this policy. We ask for a first name or nickname, an age between 1 and 12, interests, a story language, and an optional voice preference. An avatar image is optional. We do not ask for a child's school, precise location, or a recording of their voice. Please use a nickname if you prefer.</p><p>Child profiles, stories and uploaded files are visible only to the parent account that created them.</p><h2>Where it is stored</h2><p>Account data is stored with Supabase in the EU (Frankfurt) and protected by row-level security. Studio narration that ships with MoonBerry is served from this website.</p><h2>Shared stories</h2><p>When you share a story, its text is encoded inside the link itself. Anyone with the link can read that story, so share it only with people you trust.</p><h2>Your choices</h2><p>You can delete a child profile (and the stories saved for them), delete a single story, or delete your whole account from the Account page. Deleting the account removes your login, profiles, stories and uploaded files. A waitlist email may remain, no longer linked to the account.</p><p>We follow applicable laws, including Malaysia's PDPA and the EU GDPR.</p><h2>Contact</h2><p>Questions? See our <a href="#/contact">contact page</a>.</p>`],
  terms: ['Terms of Use', `<p><i>Draft, early access. Last updated November 2026.</i></p><p>By using MoonBerry you agree to these terms. MoonBerry is provided "as is" during early access, without warranties, and features may change.</p><h2>Use by families</h2><p>Accounts are for adults aged 18 or over. Before a child profile is saved, the parent or guardian confirms they are an adult and agrees to the privacy policy. Parents and guardians choose and supervise the stories their children hear. Kids mode does not offer ghost or scary stories.</p><h2>Content</h2><p>Stories are generated automatically from templates, or optionally by an in-browser model on your device. We design them to be gentle and age-appropriate, but please review stories before reading them to your child. Historical and religious stories are simplified retellings for relaxation, not academic or theological sources.</p><h2>Payments</h2><p>No payments are taken during early access. Planned pricing is shown for information only. Story lengths and profile counts beyond the free plan are not unlocked by any preview control.</p><h2>Acceptable use</h2><p>Don't misuse the service, attempt to break it, or share links containing other people's private information.</p>`],
  contact: ['Contact us', `<p>We'd love to hear from you: ideas, bugs, or the story your child asked for twice.</p><p>Email: <a href="mailto:hello@moonberry.app">hello@moonberry.app</a></p><p>Founder: Mike, based in Malaysia 🇲🇾</p>`],
  faq: ['Frequently asked questions', FAQ]
};

let cur = null, pg = 0, playing = false, timerEnd = 0, listenHandle = null;
const show = n => { const P = document.querySelectorAll('.pg'); pg = Math.max(0, Math.min(P.length - 1, n)); P.forEach((p, k) => p.hidden = k !== pg); };
const VQ = v => { const n = v.name; let s = 0; if (/natural|neural/i.test(n)) s += 60; if (/online/i.test(n)) s += 40; if (/premium|enhanced/i.test(n)) s += 35; if (/google/i.test(n)) s += 30; if (/siri/i.test(n)) s += 30; if (/compact|espeak|legacy|eloquence|\bsuper\b|novelty|whisper|zarvox|bells|bubbles|cellos|organ|jester|bahh|boing|trinoids|albert|bad news|good news|wobble/i.test(n)) s -= 60; if (!v.localService) s += 5; return s; };
const LN = (() => { try { return new Intl.DisplayNames(['en'], { type: 'language' }); } catch (e) { return null; } })();
const RN = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { return null; } })();
const langLabel = l => { const [a, b] = String(l || 'en').replace('_', '-').split('-'); let n = a; try { n = LN ? LN.of(a) : a; } catch (e) {} let r = ''; try { r = b && RN ? RN.of(b.toUpperCase()) : b || ''; } catch (e) { r = b || ''; } if (a === 'zh' && b) r = { CN: 'Mandarin, China', TW: 'Taiwan', HK: 'Cantonese, Hong Kong' }[b.toUpperCase()] || r; return n + (r ? ' (' + r + ')' : ''); };
const SAMPLE = { en: 'Hello. Snuggle in, and I will read you a gentle story tonight.', ms: 'Selamat malam. Mari kita dengar cerita sebelum tidur.', id: 'Selamat malam. Ayo dengarkan cerita sebelum tidur.', zh: '晚安。让我们一起听一个温柔的睡前故事吧。', es: 'Buenas noches. Acurrúcate, te leeré un cuento tranquilo.', fr: 'Bonne nuit. Installe-toi, je vais te lire une douce histoire.', de: 'Gute Nacht. Kuschel dich ein, ich lese dir eine ruhige Geschichte vor.', ja: 'おやすみなさい。やさしいお話を読みますね。', hi: 'शुभ रात्रि। आइए एक प्यारी सी कहानी सुनें।', ta: 'இனிய இரவு. ஒரு அமைதியான கதை கேட்போம்.', ar: 'تصبح على خير. لنستمع إلى قصة هادئة.', pt: 'Boa noite. Aconchegue-se, vou ler uma história tranquila.', it: 'Buonanotte. Mettiti comodo, ti leggo una storia dolce.', ko: '잘 자요. 포근한 이야기를 읽어 줄게요.' };
let MAN = null;
async function manifest() { if (MAN) return MAN; try { MAN = await (await fetch('assets/audio/manifest.json')).json(); } catch (e) { MAN = {}; } return MAN; }
function vlist() { return window.speechSynthesis ? speechSynthesis.getVoices() : []; }
function fillProfileVoices() {
  const sel = $('#cvoice');
  if (!sel) return;
  const selected = sel.dataset.sel || '';
  const vs = vlist().slice().sort((a, b) => VQ(b) - VQ(a));
  sel.innerHTML = '<option value="">Device default</option>' + vs.map(v => {
    const value = v.voiceURI.length <= 64 ? v.voiceURI : v.name.slice(0, 64);
    return `<option value="${esc(value)}" data-lang="${esc(v.lang || '')}" data-name="${esc(v.name)}">${esc(langLabel(v.lang || 'en'))} · ${esc(v.name.replace(/^Microsoft /, '').replace(/ - .*$/, ''))}</option>`;
  }).join('');
  if (selected) {
    const hit = [...sel.options].find(o => o.value === selected || o.dataset.name === selected);
    if (hit) sel.value = hit.value;
  }
}
async function voices() {
  const sel = $('#voice');
  if (!sel) return;
  const vs = vlist(), groups = {};
  vs.forEach(v => { const k = langLabel(v.lang || 'en-US'); (groups[k] = groups[k] || []).push(v); });
  const want = (cur && cur.language) || navigator.language || 'en-US';
  const order = Object.keys(groups).sort((a, b) => { const ea = /^English/.test(a), eb = /^English/.test(b); return eb - ea || a.localeCompare(b); });
  let html = '';
  const st = cur && cur.audio ? (await manifest())[cur.audio] : null;
  if (st && st.w === words(cur)) html += `<optgroup label="🎙 Studio voices (recorded)">${st.voices.map((x, i) => `<option value="studio:${i}">${esc(x.label)}</option>`).join('')}</optgroup>`;
  html += order.map(g => `<optgroup label="${esc(g)}">${groups[g].sort((a, b) => VQ(b) - VQ(a)).map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name.replace(/^Microsoft /, '').replace(/ - .*$/, ''))}${VQ(v) >= 30 ? ' ★' : ''}</option>`).join('')}</optgroup>`).join('');
  sel.innerHTML = html || '<option value="">Default voice</option>';
  const saved = localStorage.mtvoice;
  let pickv = null;
  const pref = cur?.voice && vs.find(v => v.voiceURI === cur.voice || v.name === cur.voice);
  if (st && st.w === words(cur) && !(saved && saved.indexOf('studio:') !== 0 && vs.some(v => v.voiceURI === saved) && localStorage.mtvoicemanual)) pickv = 'studio:0';
  else if (pref) pickv = pref.voiceURI;
  else if (saved && vs.some(v => v.voiceURI === saved)) pickv = saved;
  else {
    const en = vs.filter(v => /^en/i.test(v.lang));
    const same = en.filter(v => v.lang.replace('_', '-').toLowerCase() === String(want).toLowerCase());
    const pool = (same.length && VQ([...same].sort((a, b) => VQ(b) - VQ(a))[0]) >= 30) ? same : (en.length ? en : vs);
    const best = [...pool].sort((a, b) => VQ(b) - VQ(a))[0];
    if (best) pickv = best.voiceURI;
  }
  if (pickv) sel.value = pickv;
}
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => { voices(); fillProfileVoices(); };
const curVoice = () => vlist().find(v => v.voiceURI === $('#voice')?.value);
function vpreview() {
  const val = $('#voice')?.value || '';
  if (val.startsWith('studio:')) { const a = new Audio(studioFile(+val.slice(7))); a.play().catch(() => {}); setTimeout(() => a.pause(), 6000); return; }
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const v = curVoice();
  const u = new SpeechSynthesisUtterance(SAMPLE[(v?.lang || 'en').slice(0, 2)] || SAMPLE.en);
  if (v) { u.voice = v; u.lang = v.lang; }
  u.rate = .9;
  speechSynthesis.speak(u);
}
let AU = null;
const studioFile = i => { const st = MAN && cur && MAN[cur.audio]; return st ? 'assets/audio/' + st.voices[i].file : ''; };
function listenPosition() {
  if (AU && Number.isFinite(AU.currentTime) && AU.currentTime > 0) return Math.round(AU.currentTime);
  if (!cur?.pages?.length) return 0;
  return Math.min(86400, Math.round(((pg + 1) / cur.pages.length) * Math.max(1, estMin(cur)) * 60));
}
function trackStart() {
  if (!supabase || !state.session || !cur || listenHandle) return;
  const saved = !!(cur.saved && cur.id);
  const studio = !saved && !!cur.audio;
  if (!saved && !studio) return;
  const payload = {
    platform: 'web',
    position_seconds: 0,
    duration_seconds: Math.max(1, Math.min(86400, estMin(cur) * 60)),
    completed: false
  };
  if (saved) {
    payload.story_id = cur.id;
    if (cur.mode !== 'adult' && cur.cid) payload.child_profile_id = cur.cid;
  } else payload.studio_track_key = cur.audio;
  const handle = { id: null, done: false, storyId: saved ? cur.id : null, pos: 0, completed: false };
  listenHandle = handle;
  supabase.from('listening_sessions').insert(payload).select('id').single().then(({ data, error }) => {
    if (error || !data) { if (listenHandle === handle) listenHandle = null; return; }
    handle.id = data.id;
    if (handle.storyId) {
      const s = state.stories.find(x => x.id === handle.storyId);
      if (s) s.listen_count = (s.listen_count || 0) + 1;
      if (cur && cur.id === handle.storyId) cur.listen_count = (cur.listen_count || 0) + 1;
    }
    if (handle.done) flushListen(handle);
  });
}
function flushListen(handle) {
  if (!handle?.id) return;
  supabase.from('listening_sessions').update({
    position_seconds: Math.max(0, Math.min(86400, handle.pos || 0)),
    completed: !!handle.completed,
    ended_at: new Date().toISOString()
  }).eq('id', handle.id);
}
function finishListen(completed, pos) {
  const handle = listenHandle;
  if (!handle || handle.done) return;
  handle.done = true;
  handle.completed = !!completed;
  handle.pos = pos || 0;
  if (listenHandle === handle) listenHandle = null;
  if (handle.id) flushListen(handle);
}
function stopPlay(completed = false) {
  const was = playing;
  playing = false;
  const pos = listenPosition();
  if (window.speechSynthesis) speechSynthesis.cancel();
  if (AU) AU.pause();
  const b = $('#play');
  if (b) b.textContent = '▶ Read aloud';
  document.querySelectorAll('.hl-s').forEach(e => e.classList.remove('hl-s'));
  if (was || (listenHandle && !listenHandle.done)) finishListen(!!completed, pos);
}
function hl(p, si) {
  if (p !== pg) show(p);
  const box = document.querySelectorAll('.pg')[pg];
  if (!box) return;
  const S = box.querySelectorAll('.sn');
  document.querySelectorAll('.hl-s').forEach(e => e.classList.remove('hl-s'));
  if (S[si]) { S[si].classList.add('hl-s'); S[si].scrollIntoView({ block: 'center', behavior: RM ? 'auto' : 'smooth' }); }
}
function playStudio(i) {
  const st = MAN[cur.audio], Vce = st.voices[i];
  if (!AU || AU._f !== Vce.file) {
    if (AU) AU.pause();
    AU = new Audio('assets/audio/' + Vce.file);
    AU._f = Vce.file;
    const st0 = Vce.t.findIndex(x => x[0] === pg);
    if (st0 > 0) AU.currentTime = Vce.t[st0][2];
    AU.ontimeupdate = () => {
      if (timerEnd && Date.now() > timerEnd) { timerEnd = 0; return stopPlay(false); }
      const c = AU.currentTime;
      let k = 0;
      for (let j = 0; j < Vce.t.length; j++) { if (Vce.t[j][2] <= c) k = j; else break; }
      const x = Vce.t[k];
      if (x && AU._k !== k) { AU._k = k; hl(x[0], x[1]); }
    };
    AU.onended = () => stopPlay(true);
  }
  AU.play().catch(() => stopPlay(false));
}
function seekStudio() {
  if (AU && MAN && cur && cur.audio) {
    const Vce = MAN[cur.audio].voices.find(x => x.file === AU._f);
    const j = Vce && Vce.t.findIndex(x => x[0] === pg);
    if (j >= 0) { AU.currentTime = Vce.t[j][2] + 0.01; AU._k = -1; }
  }
}
function say(si = 0) {
  const P = document.querySelectorAll('.pg');
  const box = P[pg];
  if (!box) return stopPlay(false);
  const S = box.querySelectorAll('.sn');
  if (timerEnd && Date.now() > timerEnd) { timerEnd = 0; return stopPlay(false); }
  if (si >= S.length) {
    if (playing && pg < P.length - 1) { show(pg + 1); return setTimeout(() => playing && say(0), cur.mode === 'adult' ? 1100 : 650); }
    return stopPlay(true);
  }
  hl(pg, si);
  const txt = S[si].textContent.replace(/🌙/g, ''), dlg = /["“”]/.test(txt), last = pg >= P.length - 2, adult = cur.mode === 'adult';
  const u = new SpeechSynthesisUtterance(txt);
  const v = curVoice();
  if (v) { u.voice = v; u.lang = v.lang; }
  let rate = +($('#rate')?.value || .85) * (adult ? .92 : 1);
  if (dlg && !adult) rate *= 1.04;
  if (last) rate *= .9;
  u.rate = Math.max(.5, rate * (0.98 + ((si * 37) % 5) / 100));
  u.pitch = dlg ? (adult ? 1.03 : 1.1) : (last ? .95 : 1);
  const pause = (adult ? 500 : 260) + (/[,;:]\s*$|…$/.test(txt) ? 150 : 0) + (last ? 350 : 0) + (/\?$/.test(txt) ? 120 : 0);
  u.onend = () => { if (playing) setTimeout(() => playing && say(si + 1), pause); };
  speechSynthesis.speak(u);
}
function homeFx() {
  if (RM) return;
  const L = [...document.querySelectorAll('.sky .layer')];
  const mv = (x, y) => L.forEach(l => { const d = +l.dataset.depth; l.style.transform = `translate(${x * d}px,${y * d + scrollY * d / 60}px)`; });
  onmousemove = e => mv(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5);
  onscroll = () => mv(0, 0);
  const sh = $('#shoot');
  clearInterval(window._sh);
  window._sh = setInterval(() => { const s = $('#shoot'); if (!s) return clearInterval(window._sh); s.style.top = (5 + Math.random() * 30) + '%'; s.classList.remove('go'); void s.offsetWidth; s.classList.add('go'); }, 6000);
  document.querySelectorAll('.gcard').forEach(c => { c.onmousemove = e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `translateY(-6px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`; }; c.onmouseleave = () => c.style.transform = ''; });
}
function reveal() {
  const els = document.querySelectorAll('.reveal');
  if (RM || !('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('in'));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  els.forEach(e => io.observe(e));
}
function typer() {
  const s = Story.generate({ child: { name: 'Mia', age: 5, interests: 'stars', animal: 'owl', pronoun: 'she' }, topic: 'space', lesson: 'kindness', length: 'short', seed: 'land' });
  $('#sampleart').innerHTML = art('space', 'owl');
  $('#sampletitle').textContent = s.title;
  const t = s.pages[0].text + ' ' + s.pages[1].text, el = $('#typer');
  if (!el) return;
  if (RM) { el.textContent = t; return; }
  let i = 0;
  clearInterval(window._ty);
  window._ty = setInterval(() => { if (!document.body.contains(el)) return clearInterval(window._ty); el.textContent = t.slice(0, ++i); if (i >= t.length) clearInterval(window._ty); }, 28);
}
function paint(html, opts) {
  const A = $('#app');
  const recovery = state.recovery && !location.hash.startsWith('#/reset')
    ? '<div class="banner">Choose a new password to finish resetting your account. <a href="#/reset">Reset password</a></div>' : '';
  A.innerHTML = recovery + html;
  if (opts && opts.voice) voices();
  if ($('#cvoice')) fillProfileVoices();
  if ($('.sky')) { homeFx(); reveal(); if ($('#typer')) typer(); }
}
function showApp(msg) {
  const u = me();
  if (!u) { location.hash = '#/login'; return; }
  paint(V.app(u, msg || ''));
}

async function route() {
  const n = ++routeGen;
  stopPlay(false);
  AU = null;
  $('#modal')?.remove();
  const h = location.hash.slice(1) || '/';
  if (AID && !AID.saved && h !== '/ai') {
    if (AID.text.trim() && !confirm('Discard this unsaved AI story?')) { history.replaceState(null, '', '#/ai'); renderAI(); return; }
    aiStop();
    AID = null;
  }
  document.body.classList.remove('bed');
  if (!state.ready) { $('#app').innerHTML = '<p class="muted">Loading MoonBerry…</p>'; return; }
  nav();
  const A = $('#app');
  pg = 0;
  window.scrollTo(0, 0);
  onmousemove = null;
  onscroll = null;
  A.style.animation = 'none';
  void A.offsetWidth;
  A.style.animation = '';
  document.title = 'MoonBerry · Bedtime stories where your child is the hero';
  let m;
  if (m = h.match(/^\/s\/(.+)$/)) {
    try { cur = await unpack(m[1]); if (n !== routeGen) return; paint(V.reader(cur, true), { voice: true }); }
    catch (e) { paint('<h2>This story link looks broken.</h2><a href="#/">Go home</a>'); }
    return;
  }
  if (m = h.match(/^\/(about|privacy|terms|contact|faq)$/)) {
    const [t, b] = PAGES[m[1]];
    document.title = t + ' · ' + APP;
    paint(`<div class="prose"><h1 style="font-size:38px">${t}</h1>${b}</div>`);
    return;
  }
  if (h === '/signup' || h === '/login') {
    if (state.session && !state.recovery) { location.hash = '#/app'; return; }
    paint(V.auth(h.slice(1), takeNotice()));
    return;
  }
  if (h === '/forgot') { paint(V.forgot('', false)); return; }
  if (h === '/reset') { paint(V.reset('')); return; }
  if (h === '/check-email') { paint(V.checkEmail(state.pendingEmail || 'your inbox')); return; }
  if (h === '/') { paint(V.landing()); return; }
  if (h === '/try') {
    if (state.session) { location.hash = '#/app'; return; }
    paint(V.try(''));
    return;
  }
  if (h === '/guest') {
    const view = readJSON(sessionStorage, 'mb_guest');
    if (!view?.pages) { location.hash = '#/try'; return; }
    cur = view;
    paint(V.reader(cur, false), { voice: true });
    return;
  }
  if (m = h.match(/^\/studio\/([as]\d)$/)) {
    const key = m[1];
    const adult = key.startsWith('a');
    if (adult && (!state.session || state.mode !== 'adult')) {
      paint(`<div class="card" style="max-width:640px;margin:20px auto"><h2>That story is for grown-ups</h2><p>Ghost stories and other sleep tales stay in “For me”, after you log in. Kids mode only plays gentle adventures.</p><p><a class="btn" href="${state.session ? '#/app' : '#/signup'}">${state.session ? 'Back to my stories' : 'Create a free account'}</a></p></div>`);
      return;
    }
    cur = studioStory(key);
    paint(V.reader(cur, false), { voice: true });
    return;
  }
  if (!state.session) { location.hash = '#/login'; return; }
  if (!state.profile && h !== '/account') {
    paint(`<div class="card"><h2>We could not open your library</h2><p class="err" role="alert">${esc(state.loadError || 'Your account is still being set up.')}</p><button class="btn" type="button" data-act="retry">Try again</button></div>`);
    return;
  }
  if (h === '/account') { paint(state.profile ? V.account('') : `<div class="card"><p class="err">${esc(state.loadError || 'Account not ready.')}</p><button class="btn" type="button" data-act="retry">Try again</button></div>`); return; }
  if (h === '/app') { showApp(''); return; }
  if (h === '/ai') { if (!AID) { location.hash = '#/app'; return; } renderAI(); return; }
  if (m = h.match(/^\/story\/([0-9a-fA-F-]{10,})$/)) {
    cur = state.stories.find(s => s.id === m[1]) || null;
    if (cur && state.mode !== 'adult' && cur.mode === 'adult') {
      paint('<div class="card"><h2>This is a grown-up sleep story</h2><p class="muted">Switch to “For me” to open it. It stays hidden in kids mode, including ghost and spooky tales.</p><a href="#/app">Back to the library</a></div>');
      return;
    }
    paint(cur ? V.reader(cur, false) : '<h2>Story not found</h2><a href="#/app">Back</a>', { voice: true });
    return;
  }
  paint('<h2>Page not found</h2><a href="#/">Home</a>');
}

async function setMode(next) {
  const adult = next === 'adult';
  const prev = state.mode;
  state.mode = adult ? 'adult' : 'kids';
  try { localStorage.mtmode = state.mode; } catch (e) {}
  if (state.profile) {
    state.profile.adult_mode_enabled = adult;
    const { error } = await supabase.from('profiles').update({ adult_mode_enabled: adult }).eq('id', uid());
    if (error) {
      state.mode = prev;
      state.profile.adult_mode_enabled = prev === 'adult';
      alert(friendly(error));
    }
  }
  if (location.hash.startsWith('#/app') || location.hash.startsWith('#/story') || location.hash.startsWith('#/studio')) {
    if (!location.hash.startsWith('#/app')) location.hash = '#/app';
    else route();
  } else route();
}
async function savePending() {
  const view = readJSON(sessionStorage, 'mb_pending');
  if (!view) return;
  if (!state.session) { location.hash = '#/signup'; return; }
  if (view.mode !== 'adult' && !view.audio) {
    if (!state.consent) {
      state.notice = 'Confirm you are the parent or guardian, then save the story.';
      state.wantPending = true;
      if (location.hash !== '#/app') location.hash = '#/app';
      else showApp('');
      return;
    }
    let child = state.children.find(c => c.name.toLowerCase() === String(view.cn || '').toLowerCase());
    if (!child) {
      if (state.children.length >= childCap()) {
        state.notice = 'This account is at its child-profile limit, so the story is still waiting.';
        upgrade('family');
        return;
      }
      child = await saveChild({
        name: view.cn || 'My child',
        age: view.childAge || 5,
        pronoun: view.pronoun || 'they',
        interests: view.interests || '',
        animal: view.animal || 'bunny',
        language: view.language || 'en',
        voice: '',
        accent: ''
      }, null);
    }
    view.cid = child.id;
    view.pronoun = child.pronoun;
  }
  const saved = await persistStory(view);
  if (!saved) return;
  try { sessionStorage.removeItem('mb_pending'); sessionStorage.removeItem('mb_guest'); } catch (e) {}
  state.wantPending = false;
  location.hash = '#/story/' + saved.id;
}
async function keepCurrent() {
  if (!cur) return;
  if (!state.session) {
    try { sessionStorage.setItem('mb_pending', JSON.stringify(cur)); } catch (e) {}
    location.hash = '#/signup';
    return;
  }
  if (cur.saved) { location.hash = '#/story/' + cur.id; return; }
  if (cur.mode !== 'adult' && !cur.cid && cur.cn && !cur.audio) {
    try { sessionStorage.setItem('mb_pending', JSON.stringify(cur)); } catch (e) {}
    return savePending();
  }
  const saved = await persistStory(cur);
  if (saved) location.hash = '#/story/' + saved.id;
}
async function removeStory(id) {
  if (!id || !confirm('Delete this story? This cannot be undone.')) return;
  const { error } = await supabase.from('stories').delete().eq('id', id);
  if (error) return alert(friendly(error));
  state.stories = state.stories.filter(s => s.id !== id);
  if (cur && cur.id === id) cur = null;
  if (location.hash.startsWith('#/story/')) location.hash = '#/app';
  else route();
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act;
  if (a === 'upgrade') return upgrade(b.dataset.feature || 'premium');
  if (a === 'mclose') { $('#modal')?.remove(); return; }
  if (a === 'vprev') return vpreview();
  if (a === 'studio') { location.hash = '#/studio/' + b.dataset.k; return; }
  if (a === 'ai') return aiStart(b.closest('form'));
  if (a === 'aisave') return aiSave();
  if (a === 'aiagain') { if (AID && !AID.saved && AID.text.trim() && !confirm('Discard this story and write another?')) return; return aiRun(AID.opt); }
  if (a === 'logout') {
    state.authLock = true;
    try { await supabase.auth.signOut(); } catch (err) {}
    clearAccount();
    state.authLock = false;
    location.hash = '#/';
    return;
  }
  if (a === 'mode') return setMode(b.dataset.m);
  if (a === 'retry') { await refreshAccount(); return route(); }
  if (a === 'resend') {
    const unlock = lock(b, 'Sending…');
    const { error } = await supabase.auth.resend({ type: 'signup', email: state.pendingEmail, options: { emailRedirectTo: siteUrl() } });
    unlock();
    if (error) alert(friendly(error));
    else alert('Sent again. Check your inbox.');
    return;
  }
  if (a === 'editchild') { state.editing = b.dataset.id; return route(); }
  if (a === 'canceledit') { state.editing = null; return route(); }
  if (a === 'delchild') {
    if (!confirm('Delete this child and the stories saved for them?')) return;
    try { await deleteChild(b.dataset.id); route(); }
    catch (err) { alert(friendly(err)); }
    return;
  }
  if (a === 'dellistener') {
    state.listeners = state.listeners.filter(l => l.id !== b.dataset.id);
    storeListeners();
    return route();
  }
  if (a === 'savepending') {
    const unlock = lock(b, 'Saving…');
    try { await savePending(); }
    catch (err) { unlock(); if (isUpgrade(err)) upgrade('family'); else alert(friendly(err)); }
    return;
  }
  if (a === 'droppending') {
    try { sessionStorage.removeItem('mb_pending'); } catch (err) {}
    return route();
  }
  if (a === 'keep') {
    const unlock = lock(b, 'Saving…');
    try { await keepCurrent(); }
    catch (err) { unlock(); alert(friendly(err)); }
    return;
  }
  if (a === 'prev' || a === 'next') { show(pg + (a === 'prev' ? -1 : 1)); if (playing) { if (AU && !AU.paused) seekStudio(); else { speechSynthesis.cancel(); say(0); } } }
  if (a === 'bed') document.body.classList.toggle('bed');
  if (a === 'play') {
    const val = $('#voice')?.value || '';
    if (playing) return stopPlay(false);
    const tm = +$('#timer').value;
    timerEnd = tm ? Date.now() + tm * 60000 : 0;
    playing = true;
    b.textContent = '⏸ Pause';
    trackStart();
    if (val.startsWith('studio:') && MAN && cur && cur.audio) return playStudio(+val.slice(7));
    if (!window.speechSynthesis) { stopPlay(false); return alert('Read-aloud is not supported in this browser'); }
    say(0);
    return;
  }
  if (a === 'fav') {
    if (!cur?.saved) return;
    const next = !cur.fav;
    const { error } = await supabase.from('stories').update({ is_favorite: next }).eq('id', cur.id);
    if (error) return alert(friendly(error));
    cur.fav = next;
    const s = state.stories.find(x => x.id === cur.id);
    if (s) s.fav = next;
    b.textContent = next ? '★ Unfavourite' : '☆ Favourite';
    return;
  }
  if (a === 'delstory') return removeStory(b.dataset.id || cur?.id);
  if (a === 'share') {
    const { id, fav, cid, saved, listen_count, avatarUrl, ...pub } = cur;
    const url = location.href.split('#')[0] + '#/s/' + await pack(pub);
    let i = document.getElementById('shareurl');
    if (!i) { i = document.createElement('input'); i.id = 'shareurl'; i.readOnly = true; i.setAttribute('aria-label', 'Share link'); b.parentNode.after(i); }
    i.value = url;
    i.select();
    try { await navigator.clipboard.writeText(url); b.textContent = '✓ Link copied'; }
    catch (err) { b.textContent = 'Copy the link below'; }
  }
});

document.addEventListener('submit', async e => {
  const f = e.target;
  if (!f?.dataset?.form) return;
  e.preventDefault();
  const t = f.dataset.form;
  const v = Object.fromEntries(new FormData(f));
  const btn = f.querySelector('button:not([type]), button[type="submit"]');
  const unlock = lock(btn, t === 'story' || t === 'astory' || t === 'try' ? 'Writing your story…' : 'Please wait…');
  const fail = msg => { unlock(); const box = f.parentNode?.querySelector('.err'); if (box) box.remove(); f.insertAdjacentHTML('afterbegin', `<p class="err" role="alert">${esc(msg)}</p>`); };
  try {
    if (t === 'signup' || t === 'login') {
      const email = String(v.email || '').trim().toLowerCase();
      const pwErr = t === 'signup' ? passwordProblem(v.password) : (!v.password ? 'Enter your password.' : '');
      if (pwErr) return fail(pwErr);
      state.authLock = true;
      try {
        if (t === 'signup') {
          const mode = v.mode === 'adult' ? 'adult' : 'kids';
          try { localStorage.mtmode = mode; } catch (err) {}
          const { data, error } = await supabase.auth.signUp({
            email, password: v.password,
            options: { emailRedirectTo: siteUrl(), data: { display_name: String(v.name || '').trim().slice(0, 80), locale: browserLocale() } }
          });
          if (error) return fail(friendly(error));
          if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return fail('That email is already registered. Try logging in.');
          if (!data.session) { state.pendingEmail = email; location.hash = '#/check-email'; return; }
          state.session = data.session;
          await refreshAccount();
          location.hash = '#/app';
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: v.password });
        if (error) return fail(friendly(error));
        state.session = data.session;
        await refreshAccount();
        location.hash = '#/app';
      } finally {
        state.authLock = false;
      }
      return;
    }
    if (t === 'forgot') {
      const email = String(v.email || '').trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() });
      if (error) return fail(friendly(error));
      paint(V.forgot('', true));
      return;
    }
    if (t === 'reset' || t === 'password') {
      const pwErr = passwordProblem(v.password);
      if (pwErr) return fail(pwErr);
      if (v.password !== v.confirm) return fail('Those passwords do not match.');
      const { error } = await supabase.auth.updateUser({ password: v.password });
      if (error) return fail(friendly(error));
      state.recovery = false;
      state.notice = 'Your password is updated.';
      if (!state.profile) await refreshAccount();
      location.hash = '#/account';
      return;
    }
    if (t === 'consent') {
      await giveConsent();
      state.notice = 'Thank you. You can add your child now.';
      if (state.wantPending) { await savePending(); return; }
      showApp('');
      return;
    }
    if (t === 'child') {
      const voiceOpt = f.querySelector('[name="voice"]')?.selectedOptions?.[0];
      v.accent = voiceOpt?.dataset?.lang || '';
      v.clear_avatar = f.elements.clear_avatar?.checked ? '1' : '';
      const file = f.elements.avatar?.files?.[0] || null;
      try {
        await saveChild(v, file);
      } catch (err) {
        unlock();
        if (isUpgrade(err)) return upgrade('family');
        return showApp(friendly(err));
      }
      state.notice = v._id ? 'Child profile saved.' : 'Child profile added.';
      showApp('');
      return;
    }
    if (t === 'profile') {
      const name = String(v.name || '').trim().slice(0, 80);
      if (!name) return fail('Please enter your name.');
      const on = !!f.elements.marketing?.checked;
      const patch = { display_name: name, marketing_consent: on };
      if (on) patch.marketing_consent_at = state.profile.marketing_consent_at || new Date().toISOString();
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid());
      if (error) return fail(friendly(error));
      state.profile.display_name = name;
      state.profile.marketing_consent = on;
      if (on) state.profile.marketing_consent_at = patch.marketing_consent_at;
      state.notice = 'Profile saved.';
      paint(V.account(''));
      nav();
      return;
    }
    if (t === 'deleteacct') {
      if (String(v.confirm || '') !== 'DELETE') return fail('Type DELETE in capital letters to confirm.');
      await deleteAccount();
      location.hash = '#/';
      return;
    }
    if (t === 'listener') {
      const n = String(v.name || '').trim().slice(0, 40);
      if (!n) return fail('Please enter a name.');
      const length = Math.min(30, Math.max(5, +v.length || 5));
      state.listeners = state.listeners.filter(l => l.fromStory || l.name.toLowerCase() !== n.toLowerCase());
      state.listeners.push({ id: rid(), name: n, interests: String(v.interests || '').slice(0, 100), mood: v.mood || 'calm', length });
      storeListeners();
      showApp('');
      return;
    }
    if (t === 'wait') {
      await joinWaitlist(v.email, f.dataset.feature || 'premium');
      f.outerHTML = '<p class="thanks">✨ You are on the list. We will email you when this launches. No payment was taken.</p>';
      return;
    }
    if (t === 'try') {
      const who = { name: String(v.name || '').trim().slice(0, 40), age: Math.min(12, Math.max(1, +v.age || 5)), interests: String(v.interests || '').slice(0, 100), animal: AN[v.animal] ? v.animal : 'cat', pronoun: ['she', 'he', 'they'].includes(v.pronoun) ? v.pronoun : 'they', language: 'en' };
      if (!who.name) return fail('Please enter a name.');
      const topic = KTOP[v.topic] ? v.topic : (Story.matchTopic(who.interests) || 'space');
      const gen = Story.generate({ child: who, topic, lesson: v.lesson, length: 5 });
      const view = viewFromGenerated(gen, who, { topic, lesson: v.lesson, length: 5, friend: '' });
      try { sessionStorage.setItem('mb_guest', JSON.stringify(view)); } catch (err) { return fail('This browser could not keep the story. Allow site storage and try again.'); }
      location.hash = '#/guest';
      return;
    }
    if (t === 'story' || t === 'astory') {
      const u = me();
      if (!u) return;
      if (+v.length > maxMinutes()) { unlock(); upgrade('longer_stories'); return; }
      let who, gen, extra;
      if (t === 'story') {
        const c = u.children.find(c => c.id === v.cid);
        if (!c) return fail('Add a child first.');
        const topic = KTOP[v.topic] ? v.topic : (Story.matchTopic(c.interests) || 'space');
        if (SCARY_RE.test(topic)) return fail('That topic is not available for children.');
        who = c;
        gen = Story.generate({ child: engineChild(c), topic, lesson: v.lesson, length: +v.length || 5, friend: String(v.friend || '').trim().slice(0, 40) });
        extra = { topic, lesson: v.lesson, length: +v.length || 5, friend: String(v.friend || '').trim().slice(0, 40) };
      } else {
        const l = u.listeners.find(c => c.id === v.lid);
        if (!l) return fail('Add a listener first.');
        const genre = AGEN[v.genre] ? v.genre : 'nature';
        who = l;
        gen = Story.generate({ child: engineChild(l), mode: 'adult', genre, length: +v.length || 5, mood: v.mood });
        extra = { mode: 'adult', genre, length: +v.length || 5, mood: v.mood };
      }
      const view = viewFromGenerated(gen, who, extra);
      const saved = await persistStory(view);
      if (saved) location.hash = '#/story/' + saved.id;
      else unlock();
      return;
    }
  } catch (err) {
    if (isUpgrade(err)) { unlock(); upgrade(t === 'child' ? 'family' : 'longer_stories'); return; }
    if (t === 'story' || t === 'astory' || t === 'child' || t === 'consent' || t === 'try') {
      unlock();
      if (me()) showApp(friendly(err));
      else paint(V.try(friendly(err)));
      return;
    }
    fail(friendly(err));
  }
});

document.addEventListener('change', e => {
  const s = e.target;
  if (s.matches && s.matches('select[data-len]')) {
    const o = s.selectedOptions[0];
    if (o && o.dataset.locked) {
      const max = maxMinutes();
      const ok = [...s.options].map(x => +x.value).filter(n => n <= max);
      s.value = String(ok[0] || 5);
      upgrade('longer_stories');
    }
  }
  if (s.id === 'voice') {
    if (playing) stopPlay(false);
    AU = null;
    if (!s.value.startsWith('studio:')) { localStorage.mtvoice = s.value; localStorage.mtvoicemanual = 1; }
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#modal')?.remove(); });

/* ---------- AI Surprise story (in-browser WebLLM, keyless) ---------- */
const AI_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', AI_MB = '~1 GB';
const KID_BAN = /\b(ghosts?|haunt\w*|horror|blood\w*|kill\w*|dead|death|die[sd]?|dying|monsters?|demons?|zombies?|skulls?|weapons?|guns?|knife|knives|scream\w*|terrif\w*|nightmares?|devil|witch(es)?|creepy|spooky|evil|murder\w*|corpse|grave(yard)?s?)\b/i;
const SPARKS = ['a map that only appears in moonlight', 'a lost button that wants to go home', 'a cloud that hums', 'a door no bigger than a teacup', 'a tiny lighthouse', 'a library on the back of a turtle', 'a firefly who forgot how to glow', 'a bridge made of rainbows', 'a sleepy comet', 'a picnic at midnight', 'a whispering seashell', 'a kite that pulls towards the stars', 'a lantern festival', 'a river of warm milk', 'a snow globe that opens', 'a choir of crickets'];
const ASPARK = ['a letter found in an old coat', 'a train that runs only after midnight', 'a garden kept by a stranger', 'an old radio playing a song from long ago', 'a lighthouse keeper\'s logbook', 'a rowing boat on a mirror-still lake', 'an inn at the edge of the map', 'a key with no lock', 'a late-night bookshop', 'a clock that runs slow', 'a field of night-blooming flowers', 'a candle that never burns down'];
var AID = null, ENG = null, ENGP = null;
async function hasGPU() { try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch (e) { return false; } }
function aiStop() { try { ENG && ENG.interruptGenerate(); } catch (e) {} if (AID) AID.stop = true; }
function aiStart(f) {
  if (!f) return;
  const v = Object.fromEntries(new FormData(f)), u = me(), adult = f.dataset.form === 'astory';
  if (!u) return;
  const prof = adult ? u.listeners.find(x => x.id === v.lid) : u.children.find(x => x.id === v.cid);
  if (!prof) return;
  const opt = adult
    ? { mode: 'adult', genre: AGEN[v.genre] ? v.genre : 'nature', mood: v.mood, length: 5 }
    : { mode: 'kids', topic: KTOP[v.topic] ? v.topic : (Story.matchTopic(prof.interests) || Object.keys(KTOP).filter(k => k !== 'bible' && k !== 'holidays')[Math.floor(Math.random() * 15)]), lesson: v.lesson, length: 5, friend: (v.friend || '').trim().slice(0, 40) };
  opt.prof = prof;
  aiRun(opt);
}
function prompts(o) {
  const p = o.prof, r = Math.random;
  if (o.mode === 'adult') {
    const sp = ASPARK[Math.floor(r() * ASPARK.length)];
    return {
      sys: `You are a gentle sleep-story narrator for adults. Write slow, calming, beautifully descriptive bedtime stories in second person ("you"). The genre is strictly: ${AGEN[o.genre]}. Keep it soothing: no gore, no shocks, no cliffhangers. ${o.genre === 'ghost' ? 'Ghost stories must be atmospheric and comforting, never frightening or violent. ' : ''}${o.genre === 'bible' || o.genre === 'history' ? 'Stay faithful to the well-known story or historical facts; do not invent quotations. ' : ''}Write in plain prose paragraphs separated by blank lines. No headings, no lists, no markdown. Occasionally invite the listener to breathe slowly. End by guiding the listener gently into sleep.`,
      user: `Write a brand-new ${AGEN[o.genre]} sleep story of about 700 words for ${p.name}${p.interests ? `, who enjoys ${p.interests}` : ''}. Mood: ${o.mood || 'calm'}. Include this element somewhere: ${sp}. Put the title on the first line as "Title: ..." and then the story.`
    };
  }
  const age = +p.age || 5, lesson = o.lesson || 'kindness';
  const sp = SPARKS[Math.floor(r() * SPARKS.length)];
  return {
    sys: `You are a warm children's bedtime storyteller. Write gentle, age-appropriate stories for a ${age}-year-old, with ${age <= 5 ? 'very simple words and short sentences' : 'simple, vivid language'}. Strictly no scary content: no ghosts, monsters, villains, violence, injury, death, danger or nightmares. Keep everything cosy, kind and safe. Write in plain paragraphs separated by blank lines. No headings, no lists, no markdown. Include some dialogue and sensory details. End with the child calm, safe in bed and drifting off to sleep.`,
    user: `Write a brand-new bedtime story of about 700 words. Topic (stay strictly on it): ${KTOP[o.topic]}. Hero: ${p.name}, age ${age}${p.pronoun && p.pronoun !== 'they' ? ` (${p.pronoun === 'he' ? 'a boy' : 'a girl'})` : ''}, who loves ${p.interests || 'adventures'}. Sidekick: a friendly ${p.animal || 'bunny'}.${o.friend ? ` Also bring along: ${o.friend}.` : ''} Gentle lesson: ${lesson}. Include: ${sp}. Shape: cosy opening, a journey, two or three small encounters, a gentle challenge solved with ${lesson}, a happy resolution, then a slow, sleepy wind-down. Put the title on the first line as "Title: ..." and then the story.`
  };
}
function clean(o, txt) { let t = txt.replace(/[*#_`]+/g, ''); if (o.mode !== 'adult') t = t.split(/(?<=[.!?])\s+/).filter(s => !KID_BAN.test(s)).join(' ').replace(/ ?\n ?/g, '\n'); return t; }
function parseAI(o, txt) {
  let title = '', body = clean(o, txt);
  const m = body.match(/^\s*Title:\s*(.+)\n/i);
  if (m) { title = m[1].trim().replace(/^["“]|["”]$/g, ''); body = body.slice(m[0].length); }
  const paras = body.split(/\n\s*\n|\n/).map(s => s.trim()).filter(Boolean);
  return { title: title || (o.mode === 'adult' ? 'A Quiet Night' : `${o.prof.name}'s Surprise Story`), paras };
}
function renderAI() {
  const A = $('#app'), o = AID.opt, { title, paras } = parseAI(o, AID.text);
  const w = AID.text.split(/\s+/).filter(Boolean).length, done = AID.done;
  A.innerHTML = `<div class="card"><span class="badge ${AID.kind === 'ai' ? 'gold' : ''}">${AID.kind === 'ai' ? '✨ AI story' : '🔀 Remix (template engine, not AI)'}</span> <span class="tag">${esc(o.mode === 'adult' ? AGEN[o.genre] : KTOP[o.topic])}</span>
 ${AID.note ? `<p class="muted" style="font-size:13px">${esc(AID.note)}</p>` : ''}
 <div id="aiprog" ${AID.prog == null ? 'hidden' : ''}><p class="muted">Downloading AI model (first time only, ${AI_MB}). It is cached in your browser for next time.</p><div class="bar"><i style="width:${Math.round((AID.prog || 0) * 100)}%"></i></div><p class="muted" id="aiptxt" style="font-size:12px">${esc(AID.ptxt || '')}</p></div>
 <h1 style="font-size:30px" id="aititle">${esc(title)}</h1><p class="muted" id="aimeta">${done ? `⏱ About ${Math.max(1, Math.round(w / (o.mode === 'adult' ? 113 : 130)))} minutes read aloud · ${w} words` : `Writing… ${w} words`}</p>
 <div id="aitext" class="aitext">${paras.map(p => `<p class="page">${esc(p)}</p>`).join('')}${done ? '' : '<span class="caret"></span>'}</div>
 <div class="row" style="margin-top:14px">${done ? `${AID.saved ? `<a class="btn" href="#/story/${AID.saved}">Open in reader →</a>` : '<button class="btn" data-act="aisave">💾 Save to library</button>'}<button class="btn ghost" data-act="aiagain">✨ Try another</button>` : '<button class="btn ghost" data-act="aiagain" disabled>Writing…</button>'}<a href="#/app">← Back</a></div>
 ${done && !AID.saved ? '<p class="muted" style="font-size:13px">Not saved yet. Unsaved stories are discarded when you leave this page.</p>' : ''}</div>`;
}
var _rq = 0;
const reRender = () => { if (_rq) return; _rq = requestAnimationFrame(() => { _rq = 0; if (location.hash === '#/ai' && AID) renderAI(); }); };
async function engine(onp) {
  if (ENG) return ENG;
  if (!ENGP) ENGP = (async () => { const W = await import('https://esm.run/@mlc-ai/web-llm'); ENG = await W.CreateMLCEngine(AI_MODEL, { initProgressCallback: onp }); return ENG; })();
  try { return await ENGP; } catch (e) { ENGP = null; throw e; }
}
async function aiRun(o) {
  aiStop();
  const my = { opt: o, text: '', done: false, saved: null, kind: 'ai', prog: null };
  AID = my;
  location.hash !== '#/ai' ? location.hash = '#/ai' : renderAI();
  if (!(await hasGPU())) return remix(my, 'Your browser or device does not support WebGPU, which in-browser AI needs (try desktop Chrome or Edge). Here is a freshly remixed story from our template engine instead.');
  let E;
  try { E = await engine(p => { if (AID !== my) return; my.prog = p.progress; my.ptxt = p.text; reRender(); }); }
  catch (e) { return remix(my, 'The AI model could not load on this device (' + String(e.message || e).slice(0, 80) + '). Here is a freshly remixed template story instead.'); }
  if (AID !== my) return;
  my.prog = null;
  const P = prompts(o);
  const msgs = [{ role: 'system', content: P.sys }, { role: 'user', content: P.user }];
  try {
    for (let round = 0; round < 3 && !my.stop; round++) {
      const st = await E.chat.completions.create({ messages: msgs, stream: true, temperature: .9, top_p: .95, max_tokens: 1100 });
      let part = '';
      for await (const ch of st) {
        if (my.stop || AID !== my) break;
        const d = ch.choices[0]?.delta?.content || '';
        part += d; my.text += d; reRender();
      }
      const w = my.text.split(/\s+/).length;
      if (w >= 650 || my.stop) break;
      msgs.push({ role: 'assistant', content: part }, { role: 'user', content: `Continue the same story seamlessly from where it stopped (no title, no recap) for about ${700 - w} more words, then finish with a calm, sleepy ending.` });
      my.text += '\n\n';
    }
  } catch (e) { if (!my.text.trim()) return remix(my, 'The AI had trouble writing this time, so here is a freshly remixed template story instead.'); }
  if (AID !== my) return;
  my.done = true;
  renderAI();
}
function remix(my, note) {
  if (AID !== my) return;
  const o = my.opt;
  my.kind = 'remix';
  my.note = note;
  my.prog = null;
  const s = Story.generate({ child: o.prof, ...o, remix: true, seed: 'remix' + Math.random() + Date.now() });
  my.tpl = s;
  my.text = 'Title: ' + s.title + '\n' + s.pages.map(p => p.text).join('\n\n');
  my.done = true;
  renderAI();
}
async function aiSave() {
  const u = me();
  if (!u || !AID || !AID.done || AID.saved) return;
  const o = AID.opt, { title, paras } = parseAI(o, AID.text);
  if (!paras.length) return alert('This story came out empty. Please try another.');
  const tpl = AID.tpl || Story.generate({ child: o.prof, ...o, seed: 'scene' });
  const pages = AID.tpl ? tpl.pages : paras.map((text, i) => ({ text, scene: o.mode === 'adult' ? tpl.scene : (i === 0 || i === paras.length - 1 ? 'bedroom' : tpl.scene) }));
  const view = viewFromGenerated({ ...tpl, title, pages, mode: o.mode, minutes: 5 }, o.prof, { ai: AID.kind === 'ai', remix: AID.kind === 'remix', friend: o.friend, length: 5, mode: o.mode });
  view.ai = AID.kind === 'ai';
  view.remix = AID.kind === 'remix';
  try {
    const saved = await persistStory(view);
    if (!saved) return;
    AID.saved = saved.id;
    renderAI();
  } catch (e) { alert(friendly(e)); }
}
window.addEventListener('beforeunload', e => { if (AID && !AID.saved && AID.text.trim()) { e.preventDefault(); e.returnValue = ''; } });

async function boot() {
  try { localStorage.removeItem('mt'); localStorage.removeItem('mtwait'); } catch (e) {}
  if (!state.ent) state.ent = freeEnt();
  const arrivedSearch = location.search;
  const arrivedHash = location.hash;
  let createClient;
  try {
    ({ createClient } = await import(SUPABASE_JS));
  } catch (e) {
    $('#app').innerHTML = '<div class="card"><h2>MoonBerry could not reach account services</h2><p class="muted">Check your connection and refresh. You can still read the pages linked in the footer.</p></div>';
    nav();
    return;
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true
    }
  });
  supabase.auth.onAuthStateChange((event, session) => {
    state.session = session;
    if (event === 'PASSWORD_RECOVERY') state.recovery = true;
    if (!booted || state.authLock) return;
    if (event === 'TOKEN_REFRESHED') return;
    setTimeout(async () => {
      if (state.authLock) return;
      if (event === 'SIGNED_OUT') { clearAccount(); if (!location.hash || location.hash === '#/app') location.hash = '#/'; return; }
      if (event === 'PASSWORD_RECOVERY') { location.hash = '#/reset'; return; }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await refreshAccount();
        if (event === 'SIGNED_IN' && /#\/(login|signup|check-email|forgot)/.test(location.hash)) location.hash = '#/app';
        else route();
      }
    }, 0);
  });
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  await loadPlans();
  if (state.session) await refreshAccount();
  else state.ent = freeEnt();
  state.ready = true;
  const arrived = arrivedSearch + '&' + arrivedHash;
  if (/[?&]code=|access_token|type=recovery|type=signup|error_description/.test(arrived)) {
    const q = new URLSearchParams(arrivedSearch);
    const h = new URLSearchParams(arrivedHash.startsWith('#/') ? '' : arrivedHash.replace(/^#/, ''));
    const desc = q.get('error_description') || h.get('error_description') || '';
    if (desc) state.notice = decodeURIComponent(desc.replace(/\+/g, ' '));
    history.replaceState(null, '', location.pathname);
    if (state.recovery || /type=recovery/.test(arrived)) {
      state.recovery = true;
      location.hash = '#/reset';
    } else if (state.session) location.hash = '#/app';
    else location.hash = '#/login';
  }
  booted = true;
  addEventListener('hashchange', () => { route(); });
  await route();
}
boot();
