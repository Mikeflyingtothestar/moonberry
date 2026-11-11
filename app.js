/* MoonBerry app. Accounts and saved stories use Supabase; studio MP3s stay in /assets/audio. */
const APP = 'MoonBerry';
const SUPABASE_URL = 'https://jfmqmzapmgwsvvnowpzp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7PonXAFTBiy47PgTKvooOA_xddQXxoY';
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm';
const CONSENT_VERSION = '2026-11';
const POLICY_URL = 'https://mikeflyingtothestar.github.io/moonberry/#/privacy';
const PAGE_SEP = '\n\u001e\n';
const SCARY_RE = /ghost|horror|haunt|zombie|scary|monster|vampire|demon|creepy|spooky|nightmare/i;
const BILLING_ENABLED = false;
const LIB_PAGE = 50;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rid = () => Math.random().toString(36).slice(2, 10);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

const SC = { bedroom: ['#1b2550', '#F5C85A', '🛏️'], forest: ['#123b2e', '#9be37a', '🌲'], ocean: ['#0d3a5c', '#7fd3f7', '🐬'], space: ['#20134a', '#F5C85A', '🪐'], castle: ['#3b1d4a', '#f7a8c8', '🏰'], meadow: ['#2e4a22', '#ffe27a', '🌼'], jungle: ['#0f3d22', '#7ee3a0', '🌴'], dino: ['#24401f', '#c8e67a', '🦕'], city: ['#1c2350', '#ff9ad5', '🦸'], farm: ['#3a3218', '#ffd27a', '🐄'], dragon: ['#3e1b2a', '#ff9f6b', '🐉'], robot: ['#14324a', '#7af0e0', '🤖'], science: ['#1d2b55', '#a8f0ff', '🔭'], sports: ['#163d2a', '#fff07a', '⚽'], undersea: ['#062f45', '#5fe0d0', '🐙'], magic: ['#2a1650', '#d8a8ff', '🪄'], raya: ['#173a26', '#F5C85A', '🪔'], cny: ['#4a1414', '#ffcf5a', '🏮'], diwali: ['#3d1d0e', '#ffb347', '🪔'], xmas: ['#14304a', '#ff6b6b', '🎄'], bible: ['#2d2540', '#f3d9a4', '🕊️'], ghost: ['#1d2030', '#c9c3b0', '🕯️'], heaven: ['#3a3d6e', '#ffe9c4', '☁️'], history: ['#3a2a18', '#e6b86a', '🏛️'], meditation: ['#1d2448', '#b8c4ff', '🧘'], myth: ['#25184a', '#e0c27a', '🌕'], mystery: ['#2a2420', '#e8b46a', '🔎'], nature: ['#0f2f3a', '#8fd6c8', '🌊'], travel: ['#22234a', '#ffcf8a', '🌃'], scifi: ['#0b1a3a', '#7ab8ff', '🚀'], romance: ['#3a1f33', '#f7b2c4', '📚'], wisdom: ['#2b2a22', '#d8cf9a', '🍵'] };
const AN = { cat: '🐱', dog: '🐶', bunny: '🐰', turtle: '🐢', bear: '🐻', owl: '🦉', fox: '🦊', dinosaur: '🦕', unicorn: '🦄', dragon: '🐉', elephant: '🐘', penguin: '🐧' };
const KI = { dinosaurs: '🦖', space: '🪐', ocean: '🐬', knights: '🏰', superheroes: '🦸', farm: '🐄', fairytales: '📖', dragons: '🐉', robots: '🤖', bible: '🕊️', holidays: '🏮', science: '🔬', feelings: '💛', sports: '⚽', undersea: '🐙', jungle: '🐘', magic: '🪄', unicorns: '🦄' };
const TOPIC_ART = { dinosaurs: ['dino', 'dinosaur'], space: ['space', null], ocean: ['ocean', null], knights: ['castle', null], superheroes: ['city', null], farm: ['farm', null], fairytales: ['forest', null], dragons: ['dragon', 'dragon'], robots: ['robot', null], bible: ['bible', null], holidays: ['cny', null], science: ['science', null], feelings: ['meadow', null], sports: ['sports', null], undersea: ['undersea', null], jungle: ['jungle', 'elephant'], magic: ['magic', null], unicorns: ['meadow', 'unicorn'], ghost: ['ghost', null], heaven: ['heaven', null], history: ['history', null], meditation: ['meditation', null], myth: ['myth', null], mystery: ['mystery', null], nature: ['nature', null], travel: ['travel', null], scifi: ['scifi', null], romance: ['romance', null], wisdom: ['wisdom', null] };
const LANGS = [['en', 'English'], ['en-GB', 'English (UK)'], ['ms', 'Bahasa Melayu'], ['id', 'Bahasa Indonesia'], ['zh', 'Chinese'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['ja', 'Japanese'], ['hi', 'Hindi'], ['ta', 'Tamil'], ['ar', 'Arabic'], ['pt', 'Portuguese'], ['it', 'Italian'], ['ko', 'Korean']];
const MOODS = { calm: 'Calm', cosy: 'Cosy', wistful: 'Wistful' };
const KLEN = [5, 10, 15], ALENS = [5, 10, 20, 30];

let supabase = null;
let readyClient = null;
let booted = false;
let fromHash = false;
let routeGen = 0;
let adminGen = 0;
let lastFocus = null;
const state = {
  ready: false, session: null, profile: null, plans: [], ent: null, consent: null,
  children: [], stories: [], listeners: [], mode: 'kids', recovery: false,
  loadError: '', notice: '', editing: null, editingListener: null, authLock: false, pendingEmail: '',
  lib: { kid: [], adult: [] }, favs: { kid: [], adult: [] }, libCursor: {}, libMore: {},
  childFilter: '', studio: [], studioError: '', studioLoaded: false,
  isAdmin: false, adminChecked: false, reportStatus: '', reports: [], reportCursor: '', reportsMore: false
};

function localGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function localSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function sessionGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
function sessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
function sessionDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }
function errorBlob(error) { return `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''} ${error?.code || ''}`; }
function isUpgrade(error) { return /upgrade_required/i.test(errorBlob(error)); }
function isKidSafety(error) {
  if (!error) return false;
  if (error.kidSafety) return true;
  if (/kid[_-]safety/i.test(String(error.hint || ''))) return true;
  const m = errorBlob(error);
  if (/stories_kid_content_safe|kid[_-]safety|cannot be played on a child/i.test(m)) return true;
  return /ghost|scary/i.test(m) && /check|constraint|violates|not allowed|child/i.test(m);
}
function isListenerLimit(error) { return /limit_reached/i.test(String(error?.hint || '')); }
function isNotAdmin(error) {
  if (/not_admin/i.test(String(error?.hint || ''))) return true;
  return String(error?.code || '') === '42501' && /not_admin|admin_/i.test(errorBlob(error));
}
function isWaitRate(error) {
  return /rate_limited/i.test(String(error?.hint || '')) || /^too many/i.test(String(error?.message || ''));
}
function friendly(error) {
  if (!error) return 'Something went wrong. Please try again.';
  if (error.kidSafety && error.message) return error.message;
  if (isNotAdmin(error)) return 'That page is only for MoonBerry admins.';
  if (isKidSafety(error)) {
    if (/play|listening/i.test(errorBlob(error))) return 'That story cannot be played for a child. Ghost and scary tales stay in For me.';
    return 'That story cannot be saved for a child. MoonBerry keeps ghost and scary tales out of kids mode.';
  }
  if (isUpgrade(error)) return 'That is past the limit of your current plan.';
  if (isListenerLimit(error)) return 'You can save up to 10 listener profiles. Remove one to add another.';
  const msg = String(error.message || '');
  const code = String(error.code || error.error_code || '');
  const AUTH_CODES = {
    over_email_send_rate_limit: 'MoonBerry has sent too many sign-up emails in the last hour, so we could not send yours just now. Please try again in about an hour. (Email limit reached)',
    over_request_rate_limit: 'Too many attempts from this device. Please wait a few minutes and try again.',
    over_sms_send_rate_limit: 'Too many codes were sent. Please wait a while and try again.',
    email_address_invalid: 'That email address cannot be used. Please check it, or try another address.',
    email_address_not_authorized: 'Sign-up emails cannot be sent to that address yet. Please try again later or use another email.',
    email_exists: 'That email is already registered. Try logging in.',
    user_already_exists: 'That email is already registered. Try logging in.',
    email_not_confirmed: 'Confirm your email first (check your inbox), then log in.',
    invalid_credentials: 'That email and password do not match. If you forgot your password, use "Forgot password".',
    signup_disabled: 'New sign-ups are paused right now. Please try again later.',
    email_provider_disabled: 'Email sign-up is turned off right now. Please try again later.',
    weak_password: msg || 'That password is too weak. Use at least 10 characters with letters and numbers.',
    same_password: 'Your new password must be different from the old one.',
    captcha_failed: 'The security check failed. Please reload the page and try again.',
    otp_expired: 'That email link has expired or was already used. Log in, or ask for a new link.',
    flow_state_not_found: 'Your email is confirmed. Please log in to continue.',
    flow_state_expired: 'That link has expired. Please log in, or ask for a new link.',
    bad_code_verifier: 'Your email is confirmed. Please log in to continue.',
    session_not_found: 'Your session ended. Please log in again.',
    unexpected_failure: 'Our account service had a problem. Please try again in a minute.'
  };
  if (AUTH_CODES[code]) return AUTH_CODES[code];
  if (+error.status === 429 || /email rate limit/i.test(msg)) return AUTH_CODES[/email/i.test(msg) ? 'over_email_send_rate_limit' : 'over_request_rate_limit'];
  if (/Database error saving new user/i.test(msg)) return 'We could not create your account because of a server problem. Please try again shortly.';
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
  if (/foreign key|still referenced|violates foreign/i.test(msg)) return 'That could not be removed because a saved story is still linked to it.';
  if (/mime|content type|invalid_mime/i.test(msg)) return 'That file type is not allowed. Use a PNG, JPEG, or WebP image.';
  if (/exceeded the maximum|too large|413/i.test(msg)) return 'That file is too large.';
  if (/Cannot read|undefined is not|is not a function/i.test(msg)) return 'Something went wrong. Please reload and try again.';
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
function scrub(s) { return String(s ?? '').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email hidden]'); }
function formatNum(n) { try { return new Intl.NumberFormat('en').format(n); } catch (e) { return String(n); } }
function formatWhen(s) {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return scrub(s);
  try { return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(d); } catch (e) { return d.toISOString(); }
}
function humanKey(k) {
  const map = { signed_in_7d: 'Signed in, 7 days', signed_in_30d: 'Signed in, 30 days', active_7d: 'Active, 7 days', active_30d: 'Active, 30 days', last_7d: 'Last 7 days', last_30d: 'Last 30 days', child_profiles: 'Child profiles', listener_profiles: 'Listener profiles', parents_with_children: 'Parents with children', open_reports: 'Open reports' };
  if (map[k]) return map[k];
  return String(k).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
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
function uuidOk(id) { return /^[0-9a-f-]{36}$/i.test(String(id || '')); }
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
    plan: row.plan || 'free', status: row.status || 'active', is_premium: !!row.is_premium,
    max_story_minutes: Number.isFinite(mins) ? mins : 5,
    max_child_profiles: Number.isFinite(kids) ? kids : 2,
    ai_surprise: row.ai_surprise !== false,
    current_period_end: row.current_period_end || null,
    cancel_at_period_end: !!row.cancel_at_period_end
  };
}
function maxMinutes() { const n = Number(state.ent?.max_story_minutes); return Number.isFinite(n) && n > 0 ? n : 5; }
function childCap() { const n = Number(state.ent?.max_child_profiles); return Number.isFinite(n) ? n : 2; }
function isDuplicate(error) { return error?.code === '23505' || /duplicate key/i.test(`${error?.message || ''} ${error?.details || ''}`); }
function readJSON(storage, key) {
  try { const v = JSON.parse(storage.getItem(key) || 'null'); return v && typeof v === 'object' ? v : null; } catch (e) { return null; }
}
function takeNotice() { const t = state.notice; state.notice = ''; return t; }
function clearAccount() {
  adminGen++;
  state.session = null; state.profile = null; state.consent = null;
  state.children = []; state.stories = []; state.listeners = [];
  state.lib = { kid: [], adult: [] }; state.favs = { kid: [], adult: [] };
  state.libCursor = {}; state.libMore = {}; state.childFilter = '';
  state.ent = freeEnt(); state.recovery = false; state.editing = null; state.editingListener = null;
  state.loadError = ''; state.isAdmin = false; state.adminChecked = false;
  state.reports = []; state.reportCursor = ''; state.reportsMore = false;
}
function me() {
  if (!state.session || !state.profile) return null;
  return { email: state.session.user.email || '', name: state.profile.display_name || 'friend', mode: state.mode, children: state.children, listeners: state.listeners, stories: state.stories };
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
  for (let i = 0; i < 18; i++) st += `<circle cx="${(i * 137) % 400}" cy="${(i * 53) % 140}" r="${i % 3 + 1}" fill="#fff" opacity=".${adult ? 3 : 5 + i % 4}"/>`;
  const g = 'g' + rid();
  const mist = scene === 'ghost' ? '<rect y="150" width="400" height="60" fill="#c9c3b0" opacity=".12"/><rect y="175" width="400" height="40" fill="#fff" opacity=".07"/>' : '';
  return `<svg class="artsvg" viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(scene)} illustration"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#070a1a"/></linearGradient><radialGradient id="r${g}"><stop offset="0" stop-color="${acc}" stop-opacity=".45"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/></radialGradient></defs><rect width="400" height="260" fill="url(#${g})"/>${st}<circle cx="320" cy="60" r="70" fill="url(#r${g})"/><circle cx="320" cy="60" r="30" fill="${acc}" opacity=".9"/><circle cx="332" cy="52" r="26" fill="${bg}"/><path d="M0 210 Q100 170 200 205 T400 195 V260 H0Z" fill="${acc}" opacity=".22"/>${mist}<path d="M0 230 Q120 200 240 228 T400 220 V260 H0Z" fill="#070a1a" opacity=".6"/><text x="${adult ? 160 : 90}" y="${adult ? 205 : 200}" font-size="${adult ? 80 : 70}">${e}</text>${animal ? `<text x="230" y="215" font-size="56">${AN[animal] || '🐰'}</text>` : ''}</svg>`;
}
function cover(s) {
  if (!s) return '';
  const pair = TOPIC_ART[s.topic] || TOPIC_ART[s.genre] || null;
  const scene = s.loaded && s.scene ? (s.pages?.[1]?.scene || s.scene) : (pair ? pair[0] : (s.scene || 'bedroom'));
  const animal = s.mode === 'adult' ? null : (s.animal || (pair ? pair[1] : null));
  return art(scene, animal);
}
const mascot = `<img class="mascot" src="assets/logo-mark.svg" alt="" width="86" height="97">`;
function ico(path) { return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`; }
const I = {
  moon: ico('M15 3.2A8.2 8.2 0 1 0 20.8 14 6.4 6.4 0 0 1 15 3.2z'),
  book: ico('M6 4.5A2.5 2.5 0 0 1 8.5 2H20v18H8.5A2.5 2.5 0 0 0 6 22.5V4.5z'),
  spark: ico('M12 2.2 13.7 8 19.6 9.6 13.7 11.2 12 17l-1.7-5.8L4.4 9.6 10.3 8 12 2.2z'),
  clock: ico('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5v5.2l3.2 1.9-1 1.6L11 13V7h2z'),
  users: ico('M8 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 8 11zm8 0a2.6 2.6 0 1 0 0-5.2A2.6 2.6 0 0 0 16 11zM3.5 19.2c.4-2.6 2.4-4.2 4.5-4.2s4.1 1.6 4.5 4.2H3.5zm8.2-.2c-.2-1.8.2-3.2 1.2-4.2 1.2-.2 2.6.1 3.6 1.1 1 1 1.4 2.4 1.5 3.9h-6.3z'),
  shield: ico('M12 2.5 19 5.2v6.1c0 4.4-2.8 7.4-7 9.2-4.2-1.8-7-4.8-7-9.2V5.2L12 2.5z')
};
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

/* ===== Data layer: Supabase reads and writes. Keep UI out of these helpers. ===== */
function hydrateChild(row) {
  const animal = AN[row.avatar_key] ? row.avatar_key : 'bunny';
  const pronoun = ['she', 'he', 'they'].includes(row.pronoun) ? row.pronoun : 'they';
  return {
    id: row.id, name: row.name, age: row.age, pronoun,
    interests: (row.interests || []).join(', '), interestList: row.interests || [],
    animal, language: row.preferred_language || 'en', accent: row.preferred_accent || '',
    voice: row.preferred_voice || '', avatar_path: row.avatar_path || null, avatarUrl: ''
  };
}
function listenerFromRow(row) {
  return {
    id: row.id, name: row.name, interests: row.interests || '', mood: row.mood || 'calm',
    length: row.length_minutes || 5, voice: row.preferred_voice || '', language: row.preferred_language || 'en',
    created_at: row.created_at
  };
}
function excerptText(s) { return String(s || '').replace(/\u001e/g, ' ').replace(/\s+/g, ' ').trim(); }
function storyFromLibrary(row) {
  const adult = row.audience === 'adult';
  const pair = TOPIC_ART[row.topic] || null;
  return {
    id: row.id, saved: true, loaded: false, mode: adult ? 'adult' : 'kids', title: row.title,
    pages: null, excerpt: excerptText(row.body_excerpt), scene: pair ? pair[0] : (adult ? 'meditation' : 'bedroom'),
    animal: adult ? null : (pair ? pair[1] : null), topic: row.topic, genre: adult ? row.topic : undefined,
    lesson: '', minutes: row.length_minutes, cn: adult ? (listenerName(row.listener_profile_id) || 'you') : (row.child_name || 'your child'),
    cid: row.child_profile_id, lid: row.listener_profile_id || null, pronoun: null,
    language: row.language || 'en', voice: row.voice || '', friend: '', listenerInterests: '', interests: '',
    childAge: 5, fav: !!row.is_favorite, created: new Date(row.created_at).getTime(), createdAt: row.created_at,
    audio: row.studio_track_key || null, ai: row.source === 'ai', remix: false, source: row.source || '',
    listen_count: row.listen_count || 0, last_position_seconds: row.last_position_seconds || 0, last_completed: !!row.last_completed
  };
}
function applyStoryBody(view, body, meta) {
  meta = meta && typeof meta === 'object' ? meta : {};
  const texts = String(body || '').split(PAGE_SEP);
  const scenes = Array.isArray(meta.scenes) ? meta.scenes : [];
  view.pages = (texts.length ? texts : ['']).map((text, i) => ({ text, scene: scenes[i] || meta.scene || view.scene || 'bedroom' }));
  view.scene = meta.scene || view.pages[1]?.scene || view.pages[0]?.scene || view.scene || 'bedroom';
  view.animal = view.mode === 'adult' ? null : (meta.animal || view.animal || null);
  view.lesson = meta.lesson || view.lesson || '';
  view.mood = meta.mood || view.mood || '';
  view.pronoun = meta.pronoun || view.pronoun || null;
  view.friend = meta.friend || '';
  view.listenerInterests = meta.listenerInterests || '';
  view.interests = meta.interests || view.interests || '';
  view.childAge = meta.childAge || view.childAge || 5;
  view.remix = !!meta.remix;
  if (!view.cn && meta.heroName) view.cn = meta.heroName;
  if (view.mode === 'adult' && meta.listenerName) view.cn = meta.listenerName;
  view.loaded = true;
  return view;
}
function listenerName(id) { const l = (state.listeners || []).find(x => x.id === id); return l ? l.name : ''; }
function syncStories() {
  const map = new Map();
  const add = s => { if (!s) return; const prev = map.get(s.id); if (!prev || (s.loaded && !prev.loaded)) map.set(s.id, s); };
  for (const b of ['kid', 'adult']) { (state.lib?.[b] || []).forEach(add); (state.favs?.[b] || []).forEach(add); }
  state.stories = [...map.values()];
}
function dedupeStories(arr) {
  const map = new Map();
  (arr || []).forEach(s => { const prev = map.get(s.id); if (!prev || (s.loaded && !prev.loaded)) map.set(s.id, s); });
  return [...map.values()];
}
function rememberStory(view) {
  const bucket = view.mode === 'adult' ? 'adult' : 'kid';
  state.lib[bucket] = dedupeStories([view, ...(state.lib[bucket] || []).filter(s => s.id !== view.id)]);
  syncStories();
}
function forgetStory(id) {
  for (const b of ['kid', 'adult']) {
    state.lib[b] = (state.lib[b] || []).filter(s => s.id !== id);
    state.favs[b] = (state.favs[b] || []).filter(s => s.id !== id);
  }
  syncStories();
}
function viewFromGenerated(gen, who, extra) {
  extra = extra || {};
  const adult = (gen.mode || extra.mode) === 'adult';
  return {
    saved: false, loaded: true, mode: adult ? 'adult' : 'kids', title: gen.title, pages: gen.pages,
    scene: gen.scene, animal: adult ? null : (gen.animal || who.animal || null),
    topic: gen.topic || extra.topic || 'space', lesson: gen.lesson || extra.lesson || '',
    genre: gen.genre || extra.genre, mood: gen.mood || extra.mood || '', minutes: gen.minutes || +extra.length || 5,
    cn: who.name || 'friend', cid: adult ? null : (who.id || null), lid: adult ? (who.id && uuidOk(who.id) ? who.id : null) : null,
    pronoun: who.pronoun || null, language: who.language || 'en', voice: who.voice || '',
    friend: extra.friend || '', listenerInterests: adult ? (who.interests || '') : '', interests: who.interests || '',
    childAge: who.age || 5, fav: false, created: Date.now(), audio: extra.audio || null,
    ai: !!extra.ai, remix: !!extra.remix, listen_count: 0, last_position_seconds: 0, last_completed: false, excerpt: ''
  };
}
function engineChild(c) {
  return { name: c.name, age: c.age, interests: typeof c.interests === 'string' ? c.interests : (c.interestList || []).join(', '), animal: c.animal || 'bunny', pronoun: c.pronoun || 'they' };
}
function studioCast(key) {
  if (key === 's2' || key === 's4') return { name: 'Ethan', age: 7, interests: 'dinosaurs, football', animal: 'turtle', pronoun: 'he' };
  if (String(key).startsWith('s')) return { name: 'Aisha', age: 5, interests: 'space, drawing, rockets', animal: 'cat', pronoun: 'she' };
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
  const track = (state.studio || []).find(t => t.key === key);
  const adult = track ? (track.audience === 'adult' || track.is_scary) : String(key).startsWith('a');
  const used = spec || (adult
    ? { mode: 'adult', genre: (track && TOPIC_ART[track.category] ? track.category : 'nature'), length: 5, mood: 'calm' }
    : { topic: (track && Story.KID_TOPICS[track.category] ? track.category : 'space'), lesson: 'kindness', length: 5 });
  const gen = Story.generate({ child: who, ...used, seed: key });
  const view = viewFromGenerated(gen, who, { ...used, audio: key });
  view.saved = false;
  return view;
}
function trackIsAdult(key) {
  const t = (state.studio || []).find(x => x.key === key);
  if (t) return t.audience === 'adult' || !!t.is_scary;
  return String(key).startsWith('a');
}
async function loadPlans() {
  const { data, error } = await supabase.from('plan_features').select('plan, display_name, max_story_minutes, max_child_profiles, price_usd_monthly, ai_surprise');
  if (!error && data) state.plans = data;
  if (!state.session) state.ent = freeEnt();
}
async function loadStudio() {
  if (!supabase) return;
  const { data, error } = await supabase.from('studio_tracks').select('key, audience, title, category, is_scary, voices, sort_order').order('sort_order', { ascending: true }).order('key', { ascending: true });
  state.studioLoaded = true;
  if (error) { state.studioError = friendly(error); state.studio = []; return; }
  state.studio = data || [];
  state.studioError = '';
}
async function signAvatars() {
  await Promise.all(state.children.map(async c => {
    if (!c.avatar_path) return;
    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(c.avatar_path, 3600);
    if (!error && data?.signedUrl) c.avatarUrl = data.signedUrl;
  }));
}
async function migrateLegacy() {
  if (!uid()) return;
  try {
    const raw = localGet('mb_pronouns');
    if (raw) {
      const m = JSON.parse(raw);
      if (m && typeof m === 'object') {
        for (const [id, p] of Object.entries(m)) {
          if (!uuidOk(id) || !['she', 'he', 'they'].includes(p)) continue;
          await supabase.from('child_profiles').update({ pronoun: p }).eq('id', id);
        }
      }
      localStorage.removeItem('mb_pronouns');
    }
  } catch (e) {}
  const key = 'mb_listeners_' + uid();
  let raw = null;
  try { raw = localGet(key); } catch (e) { raw = null; }
  if (!raw) return;
  let ok = true;
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      for (const l of arr) {
        if (!l || l.fromStory || !String(l.name || '').trim()) continue;
        const length = [5, 10, 20, 30].includes(+l.length) ? +l.length : 5;
        const { error } = await supabase.from('listener_profiles').insert({
          name: String(l.name).trim().slice(0, 40),
          interests: String(l.interests || '').trim().slice(0, 200) || null,
          mood: ['calm', 'cosy', 'wistful'].includes(l.mood) ? l.mood : 'calm',
          length_minutes: length,
          preferred_language: 'en'
        });
        if (error && !isDuplicate(error)) {
          if (isListenerLimit(error)) break;
          ok = false;
          break;
        }
      }
    }
  } catch (e) { ok = false; }
  if (ok) { try { localStorage.removeItem(key); } catch (e) {} }
}
async function loadListeners() {
  if (!uid()) { state.listeners = []; return; }
  const { data, error } = await supabase.from('listener_profiles').select('id, name, interests, mood, length_minutes, preferred_voice, preferred_language, created_at').order('created_at', { ascending: true });
  if (error) throw error;
  state.listeners = (data || []).map(listenerFromRow);
}
async function loadLibrary(audience, opts) {
  opts = opts || {};
  const bucket = audience === 'adult' ? 'adult' : 'kid';
  const args = { p_audience: bucket === 'adult' ? 'adult' : 'kid', p_limit: LIB_PAGE };
  if (bucket === 'kid' && state.childFilter) args.p_child_profile_id = state.childFilter;
  if (opts.more && state.libCursor[bucket]) args.p_before = state.libCursor[bucket];
  const jobs = [supabase.rpc('get_my_library', args)];
  if (!opts.more) {
    const favArgs = { p_audience: args.p_audience, p_limit: LIB_PAGE, p_favorites_only: true };
    if (args.p_child_profile_id) favArgs.p_child_profile_id = args.p_child_profile_id;
    jobs.push(supabase.rpc('get_my_library', favArgs));
  }
  const [page, fav] = await Promise.all(jobs);
  if (page.error) throw page.error;
  const rows = (page.data || []).map(storyFromLibrary);
  state.lib[bucket] = opts.more ? dedupeStories([...(state.lib[bucket] || []), ...rows]) : rows;
  if (fav) {
    if (fav.error) throw fav.error;
    state.favs[bucket] = (fav.data || []).map(storyFromLibrary);
  }
  const data = page.data || [];
  state.libCursor[bucket] = data.length ? data[data.length - 1].created_at : (opts.more ? state.libCursor[bucket] : null);
  state.libMore[bucket] = data.length === LIB_PAGE;
  syncStories();
}
async function findStory(id) {
  let s = state.stories.find(x => x.id === id);
  if (s) return s;
  for (const audience of ['kid', 'adult']) {
    let before = null;
    for (let i = 0; i < 8; i++) {
      const args = { p_audience: audience, p_limit: LIB_PAGE };
      if (before) args.p_before = before;
      const { data, error } = await supabase.rpc('get_my_library', args);
      if (error || !data?.length) break;
      const hit = data.map(storyFromLibrary).find(x => x.id === id);
      if (hit) { state.lib[audience] = dedupeStories([...(state.lib[audience] || []), hit]); syncStories(); return state.stories.find(x => x.id === id) || hit; }
      if (data.length < LIB_PAGE) break;
      before = data[data.length - 1].created_at;
    }
  }
  return null;
}
async function hydrateStory(view) {
  if (!view || (view.pages && view.loaded)) return view;
  const { data, error } = await supabase.from('stories').select('body, generation_metadata').eq('id', view.id).single();
  if (error) throw error;
  const copies = [];
  for (const b of ['kid', 'adult']) copies.push(...(state.lib[b] || []), ...(state.favs[b] || []));
  copies.forEach(s => { if (s.id === view.id) applyStoryBody(s, data.body, data.generation_metadata); });
  if (!copies.some(s => s.id === view.id)) applyStoryBody(view, data.body, data.generation_metadata);
  syncStories();
  return state.stories.find(s => s.id === view.id) || view;
}
async function refreshAdminFlag() {
  const gen = ++adminGen;
  if (!state.session || !supabase) { state.isAdmin = false; state.adminChecked = true; return; }
  const { data, error } = await supabase.rpc('is_admin');
  if (gen !== adminGen) return;
  state.adminChecked = true;
  state.isAdmin = !error && data === true;
}
async function refreshAccount() {
  if (!state.session) { clearAccount(); return; }
  const id = uid();
  await migrateLegacy();
  let profile = null, profileError = null;
  for (let i = 0; i < 4; i++) {
    const res = await supabase.from('profiles').select('id, display_name, locale, timezone, marketing_consent, marketing_consent_at, onboarding_state, adult_mode_enabled').eq('id', id).maybeSingle();
    profileError = res.error; profile = res.data;
    if (profile || profileError) break;
    await new Promise(r => setTimeout(r, 350 * (i + 1)));
  }
  const [ent, cons, kids] = await Promise.all([
    supabase.rpc('get_my_entitlements'),
    supabase.from('parental_consents').select('id, withdrawn_at, consent_version, consented_at').order('consented_at', { ascending: false }),
    supabase.from('child_profiles').select('id, name, age, interests, pronoun, avatar_key, avatar_path, preferred_language, preferred_accent, preferred_voice, created_at').order('created_at', { ascending: true })
  ]);
  state.profile = profile;
  state.loadError = '';
  const failed = profileError || ent.error || cons.error || kids.error;
  if (!profile) state.loadError = friendly(profileError || { message: 'Your account is still being set up. Wait a moment and try again.' });
  else if (failed) state.loadError = friendly(failed);
  applyEnt(Array.isArray(ent.data) ? ent.data[0] : ent.data);
  state.consent = (cons.data || []).find(c => !c.withdrawn_at) || null;
  state.children = (kids.data || []).map(hydrateChild);
  try { await loadListeners(); } catch (e) { state.loadError = state.loadError || friendly(e); state.listeners = []; }
  try {
    await Promise.all([loadLibrary('kid'), loadLibrary('adult'), signAvatars()]);
  } catch (e) { state.loadError = state.loadError || friendly(e); }
  state.mode = profile?.adult_mode_enabled ? 'adult' : 'kids';
  if (profile && profile.onboarding_state === 'new' && localGet('mtmode') === 'adult' && !profile.adult_mode_enabled) {
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
  try { await refreshAdminFlag(); } catch (e) { state.isAdmin = false; state.adminChecked = true; }
}
async function giveConsent() {
  const { error } = await supabase.from('parental_consents').insert({
    consent_version: CONSENT_VERSION, policy_url: POLICY_URL, method: 'checkbox_attestation',
    parent_is_adult_attested: true, user_agent: (navigator.userAgent || '').slice(0, 500) || null
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
const CHILD_COLS = 'id, name, age, interests, pronoun, avatar_key, avatar_path, preferred_language, preferred_accent, preferred_voice';
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
    name, age, pronoun, interests: parseInterests(v.interests), avatar_key: animal,
    preferred_language: safeLang(v.language),
    preferred_accent: (v.accent || '').slice(0, 32) || null,
    preferred_voice: (v.voice || '').trim().slice(0, 64) || null
  };
  let res;
  if (editingId) res = await supabase.from('child_profiles').update(payload).eq('id', editingId).select(CHILD_COLS).single();
  else res = await supabase.from('child_profiles').insert(payload).select(CHILD_COLS).single();
  if (res.error) throw res.error;
  let row = res.data;
  if (file && file.size) {
    const path = await uploadAvatar(row.id, file);
    row = { ...row, avatar_path: path };
  } else if (editingId && v.clear_avatar && row.avatar_path) {
    await supabase.storage.from('avatars').remove([row.avatar_path]);
    const cleared = await supabase.from('child_profiles').update({ avatar_path: null }).eq('id', row.id).select(CHILD_COLS).single();
    if (cleared.error) throw cleared.error;
    row = cleared.data;
  }
  const view = hydrateChild(row);
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
  for (const b of ['kid', 'adult']) {
    state.lib[b] = (state.lib[b] || []).filter(s => s.cid !== id);
    state.favs[b] = (state.favs[b] || []).filter(s => s.cid !== id);
  }
  syncStories();
  if (state.editing === id) state.editing = null;
}
async function saveListener(v) {
  const name = String(v.name || '').trim().slice(0, 40);
  if (!name) throw new Error('Please enter a name.');
  const mood = MOODS[v.mood] ? v.mood : 'calm';
  const length = ALENS.includes(+v.length) ? +v.length : 5;
  const payload = {
    name, interests: String(v.interests || '').trim().slice(0, 200) || null, mood, length_minutes: length,
    preferred_language: safeLang(v.language || 'en'),
    preferred_voice: String(v.voice || '').trim().slice(0, 64) || null
  };
  const editing = v._id && uuidOk(v._id) ? v._id : '';
  const q = supabase.from('listener_profiles');
  const res = editing
    ? await q.update(payload).eq('id', editing).select('id, name, interests, mood, length_minutes, preferred_voice, preferred_language, created_at').single()
    : await q.insert(payload).select('id, name, interests, mood, length_minutes, preferred_voice, preferred_language, created_at').single();
  if (res.error) throw res.error;
  const view = listenerFromRow(res.data);
  const idx = state.listeners.findIndex(l => l.id === view.id);
  if (idx >= 0) state.listeners[idx] = view; else state.listeners.push(view);
  state.editingListener = null;
  return view;
}
async function deleteListener(id) {
  const { error } = await supabase.from('listener_profiles').delete().eq('id', id);
  if (error) throw error;
  state.listeners = state.listeners.filter(l => l.id !== id);
  if (state.editingListener === id) state.editingListener = null;
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
    scene: view.scene || 'bedroom', animal: view.animal || null, lesson: view.lesson || null, mood: view.mood || null,
    friend: (view.friend || '').slice(0, 80) || null, pronoun: view.pronoun || null, heroName: view.cn || null,
    listenerName: audience === 'adult' ? (view.cn || null) : null,
    listenerInterests: audience === 'adult' ? (view.listenerInterests || '').slice(0, 200) : null,
    interests: (view.interests || '').slice(0, 200) || null, childAge: view.childAge || null,
    scenes: pages.map(p => p.scene || view.scene || 'bedroom'), remix: !!view.remix
  };
  const row = {
    audience, title: String(view.title || 'Bedtime story').trim().slice(0, 200) || 'Bedtime story',
    body: pages.map(p => p.text || '').join(PAGE_SEP).slice(0, 100000) || 'Goodnight.',
    topic: String(audience === 'adult' ? (view.genre || view.topic || 'nature') : (view.topic || 'space')).slice(0, 64),
    length_minutes: minutes, language: safeLang(view.language), voice: view.voice ? String(view.voice).slice(0, 64) : null,
    source: view.audio ? 'studio' : view.ai ? 'ai' : 'template',
    content_rating: audience === 'kid' ? 'kids' : 'general',
    is_scary: audience === 'adult' && (view.genre === 'ghost' || view.topic === 'ghost'),
    studio_track_key: view.audio || null, generation_metadata: meta
  };
  if (audience === 'kid' && view.cid && uuidOk(view.cid)) row.child_profile_id = view.cid;
  if (audience === 'adult' && view.lid && uuidOk(view.lid)) row.listener_profile_id = view.lid;
  const { data, error } = await supabase.from('stories').insert(row).select('id, created_at, is_favorite, listen_count, child_profile_id, listener_profile_id').single();
  if (error) {
    if (isUpgrade(error)) { upgrade('longer_stories'); return null; }
    if (isKidSafety(error)) {
      const err = new Error('That story cannot be saved for a child. MoonBerry keeps ghost and scary tales out of kids mode.');
      err.kidSafety = true;
      throw err;
    }
    throw error;
  }
  const saved = { ...view, id: data.id, saved: true, loaded: true, createdAt: data.created_at, created: new Date(data.created_at).getTime(), fav: !!data.is_favorite, listen_count: data.listen_count || 0, cid: data.child_profile_id || view.cid || null, lid: audience === 'adult' ? (data.listener_profile_id || view.lid || null) : null };
  rememberStory(saved);
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
    source: 'web', locale: browserLocale().slice(0, 16)
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
  sessionSet('mb_flash', 'Your account has been deleted.');
}

/* ===== Interface ===== */
const KTOP = Story.KID_TOPICS, AGEN = Story.ADULT_GENRES;
const opts = (o, sel) => Object.entries(o).map(([k, v]) => `<option value="${esc(k)}" ${k == sel ? 'selected' : ''}>${esc(v)}</option>`).join('');
const L2 = a => Object.fromEntries(a.map(x => [x, x[0].toUpperCase() + x.slice(1)]));
const words = s => (s?.pages || []).reduce((n, p) => n + String(p.text || '').split(/\s+/).filter(Boolean).length, 0);
const estMin = s => (s?.pages?.length ? Math.max(1, Math.round(words(s) / (s.mode === 'adult' ? 113 : 130))) : Math.max(1, +s?.minutes || 1));
function lenSel(name, list, sel) {
  const max = maxMinutes();
  let chosen = +sel || list[0];
  if (!list.includes(chosen) || chosen > max) chosen = list.find(m => m <= max) || list[0];
  return `<select name="${name}" data-len aria-label="Story length">${list.map(m => `<option value="${m}" ${m === chosen ? 'selected' : ''} ${m > max ? 'data-locked="1"' : ''}>${m} minutes${m > max ? ' · Premium' : (max <= 5 ? ' · Free' : ' · included')}</option>`).join('')}</select>`;
}
function brandLink(href) {
  return `<a class="brand" href="${href}" aria-label="MoonBerry home"><img src="assets/logo-mark.svg" alt="" width="28" height="32"><span class="wm"><span class="m1">Moon</span><span class="m2">Berry</span></span></a>`;
}
function modeToggle(mode) {
  return `<div class="toggle" role="group" aria-label="Story mode"><button type="button" data-act="mode" data-m="kids" class="${mode === 'kids' ? 'on' : ''}" aria-pressed="${mode === 'kids'}"><span class="wide-label">For my child</span><span class="narrow-label">Kids</span></button><button type="button" data-act="mode" data-m="adult" class="${mode === 'adult' ? 'on' : ''}" aria-pressed="${mode === 'adult'}"><span class="wide-label">For me</span><span class="narrow-label">For me</span></button></div>`;
}
function nav() {
  const u = me();
  const mode = u ? state.mode : 'kids';
  const h = location.hash || '#/';
  const app = !!(u && /^#\/(app|account|story|ai|studio|admin)/.test(h));
  document.body.classList.toggle('in-app', app);
  document.body.classList.toggle('mode-adult', !!(u && mode === 'adult'));
  document.body.classList.toggle('mode-kids', !(u && mode === 'adult'));
  const cur = href => (h === href || (href === '#/app' && (h.startsWith('#/story') || h.startsWith('#/studio') || h.startsWith('#/ai'))) || (href === '#/admin' && h.startsWith('#/admin'))) ? ' aria-current="page"' : '';
  const admin = u && state.isAdmin ? `<a href="#/admin"${cur('#/admin')}>Admin</a>` : '';
  if (app) {
    $('#nav').innerHTML = `${brandLink('#/app')}<div class="nav-links"><a href="#/app"${cur('#/app')}>Library</a><a href="#/account"${cur('#/account')}>Account</a><a href="#/">Home</a>${admin}</div><div class="nav-tools">${modeToggle(mode)}<button type="button" class="btn ghost" data-act="logout">Log out</button></div><div class="dock"><a href="#/app"${cur('#/app')}>Library</a><a href="#/account"${cur('#/account')}>Account</a>${admin}</div>`;
    return;
  }
  const tools = u
    ? `${modeToggle(mode)}<a href="#/app">My stories</a><a href="#/account">Account</a>${admin}<button type="button" class="btn ghost" data-act="logout">Log out</button>`
    : `<a href="#/login">Log in</a><a class="btn" href="#/signup">Start free</a>`;
  const links = u ? '' : `<button type="button" class="linkish" data-act="jump" data-target="how">How it works</button><button type="button" class="linkish" data-act="jump" data-target="pricing">Pricing</button><a href="#/faq">FAQ</a>`;
  $('#nav').innerHTML = `${brandLink('#/')}<div class="nav-links">${links}</div><div class="nav-tools">${tools}</div>`;
}
function planBox() {
  const e = state.ent || freeEnt();
  const name = e.plan === 'family' ? 'Family' : e.plan === 'premium' ? 'Premium' : 'Free';
  return `<div class="card plan"><div class="row" style="justify-content:space-between"><div><span class="badge ${e.is_premium ? 'gold' : ''}">${esc(name)} plan</span> <span class="muted">${e.is_premium ? `Stories up to ${e.max_story_minutes} minutes · ${e.max_child_profiles} child profiles.` : `Stories up to ${e.max_story_minutes} minutes · ${e.max_child_profiles} child profiles. Longer stories are on the Premium waitlist.`}</span></div><button class="btn ghost" type="button" data-act="upgrade" data-feature="premium">See plans</button></div></div>`;
}
function aiBtn(form) {
  if (state.ent && state.ent.ai_surprise === false) return '<p class="muted">AI Surprise is not included on your plan.</p>';
  return `<button type="button" class="btn ai-btn" data-act="ai" data-f="${form}">${I.spark} AI Surprise story <span class="muted" style="font-weight:500"> · free · 5 min</span></button>`;
}
function openModal(inner) {
  closeModal();
  lastFocus = document.activeElement;
  const d = document.createElement('div');
  d.id = 'modal';
  d.innerHTML = inner;
  document.body.appendChild(d);
  d.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    const nodes = [...d.querySelectorAll('button, a[href], input, select, textarea')].filter(el => !el.disabled);
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  setTimeout(() => d.querySelector('input, button')?.focus(), 30);
}
function closeModal() {
  const m = $('#modal');
  if (!m) return;
  m.remove();
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  lastFocus = null;
}
function upgrade(feature) {
  const feat = feature || 'premium';
  const plan = feat === 'family' || feat === 'premium' ? feat : '';
  if (BILLING_ENABLED && plan) {
    if (!state.session) { location.hash = '#/login'; return; }
    const btn = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    const unlock = lock(btn, 'Opening checkout…');
    supabase.functions.invoke('create-checkout-session', { body: { plan } }).then(({ data, error }) => {
      if (error) throw error;
      if (data?.url) { location.assign(data.url); return; }
      throw new Error('Checkout did not return a link.');
    }).catch(err => { unlock(); alert(friendly(err)); });
    return;
  }
  if ($('#modal')) return;
  const email = state.session?.user?.email ? esc(state.session.user.email) : '';
  openModal(`<div class="mbg" data-act="mclose"></div><div class="mbox" role="dialog" aria-modal="true" aria-labelledby="mt"><button class="mx" type="button" data-act="mclose" aria-label="Close">×</button><span class="badge gold">Waitlist</span><h2 id="mt">${feat === 'family' ? 'More child profiles are part of Family' : 'Longer stories are part of Premium'}</h2><p class="muted">Free includes stories up to ${maxMinutes()} minutes and ${childCap()} child profiles. Premium and Family are launching soon, and no payment is taken today.</p><div class="grid"><div class="card price hl"><h3>Premium</h3><p><b>US$5.99 / month</b> <span class="muted">(launching soon)</span></p><ul><li>10, 15, 20 and 30-minute stories</li><li>Every kids topic and adult genre</li><li>Studio voices (planned)</li><li>Sleep timer and bedtime mode</li></ul></div><div class="card price"><h3>Family</h3><p><b>US$9.99 / month</b> <span class="muted">(launching soon)</span></p><ul><li>Everything in Premium</li><li>A profile for every child</li><li>Shared family library</li></ul></div></div><form data-form="wait" data-feature="${esc(feat)}"><label>Email for the waitlist<input type="email" name="email" required maxlength="120" autocomplete="email" placeholder="you@example.com" value="${email}"></label><div class="row"><button class="btn" type="submit">Join the waitlist</button><button type="button" class="btn ghost" data-act="mclose">Maybe later</button></div><p class="muted">We only store your email and which feature you asked about. No card, no payment.</p></form></div>`);
}
function storyCard(s) {
  const kind = s.ai ? '<span class="badge gold">AI</span> ' : s.remix ? '<span class="badge">Remix</span> ' : '';
  const studio = s.audio ? '<span class="badge">Studio</span> ' : '';
  const topic = s.mode === 'adult' ? (AGEN[s.genre] || AGEN[s.topic] || s.genre || s.topic || '') : ((KTOP[s.topic] || s.topic || '') + (s.lesson ? ' · ' + s.lesson : ''));
  const resume = s.last_position_seconds > 5 && !s.last_completed ? ` · ${Math.max(1, Math.round(s.last_position_seconds / 60))} min in` : '';
  return `<article class="story-card"><a class="story-link" href="#/story/${esc(s.id)}">${cover(s)}<h3>${s.fav ? '★ ' : ''}${esc(s.title)}</h3><p class="muted clamp">${kind}${studio}For ${esc(s.cn)} · ${esc(topic)} · ${estMin(s)} min${s.listen_count ? ` · listened ${s.listen_count}×` : ''}${resume}</p>${s.excerpt ? `<p class="muted clamp">${esc(s.excerpt)}</p>` : ''}</a><button type="button" class="btn ghost danger" data-act="delstory" data-id="${esc(s.id)}">Delete</button></article>`;
}
function libraryBlock(audience) {
  const list = state.lib?.[audience] || [];
  const favs = (state.favs?.[audience] || []).filter(s => s.fav);
  const filter = audience === 'kid' && state.children.length ? `<label>Show<select id="childfilter" aria-label="Filter by child"><option value="">All children</option>${state.children.map(c => `<option value="${esc(c.id)}" ${state.childFilter === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>` : '';
  const favShelf = favs.length ? `<h2>Favourites</h2><div class="shelf" tabindex="0" aria-label="Favourite stories">${favs.map(storyCard).join('')}</div>` : '';
  const grid = list.length ? `<div class="grid">${list.map(storyCard).join('')}</div>` : '<p class="muted empty">No stories yet. Create the first one above.</p>';
  const more = state.libMore?.[audience] ? `<p><button type="button" class="btn ghost" data-act="morelib" data-aud="${audience}">Load more</button></p>` : '';
  return `<div class="lib-head"><h2>Story library</h2>${filter}</div>${favShelf}<h2>${favs.length ? 'Recent' : ''}</h2>${grid}${more}`;
}
function pendingBanner() {
  const p = readJSON(sessionStorage, 'mb_pending');
  if (!p?.title) return '';
  return `<div class="banner"><p>You made “${esc(p.title)}” before it was saved.</p><button type="button" class="btn" data-act="savepending">Save it to my library</button> <button type="button" class="btn ghost" data-act="droppending">Discard</button></div>`;
}
function consentForm() {
  return `<h2>A parent's OK</h2><p class="muted">MoonBerry keeps a profile for your child only after a parent or guardian agrees. We store a nickname, age, pronoun, interests, language, and an optional avatar. You can delete everything later from Account.</p><p class="muted">Please read the <a href="#/privacy">Privacy Policy</a> (version ${CONSENT_VERSION}).</p><form data-form="consent"><label class="check"><input type="checkbox" name="adult" required><span>I am this child's parent or legal guardian, and I am 18 or older.</span></label><label class="check"><input type="checkbox" name="policy" required><span>I agree to that privacy policy for this child's profile.</span></label><button class="btn" type="submit">Save my consent</button></form>`;
}
function childForm(c) {
  const editing = !!c;
  return `<h2>${editing ? 'Edit child' : (state.children.length ? 'Add a child' : 'Add your child')}</h2><form data-form="child"><input type="hidden" name="_id" value="${editing ? esc(c.id) : ''}"><label>Name<input name="name" required maxlength="40" value="${editing ? esc(c.name) : ''}" autocomplete="off"></label><div class="row"><label style="flex:1">Age<input type="number" name="age" min="1" max="12" value="${editing ? c.age : 5}" required inputmode="numeric"></label><label style="flex:1">Pronoun<select name="pronoun">${['she', 'he', 'they'].map(p => `<option value="${p}" ${(editing ? c.pronoun : 'they') === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label></div><label>Interests, comma separated<input name="interests" maxlength="200" value="${editing ? esc(c.interests) : ''}" placeholder="space, dinosaurs, drawing"></label><label>Favourite animal<select name="animal">${opts(L2(Object.keys(AN)), editing ? c.animal : 'cat')}</select></label><label>Story language<select name="language">${LANGS.map(([k, v]) => `<option value="${k}" ${(editing ? c.language : 'en') === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label><label>Preferred voice<select name="voice" data-voices data-sel="${esc(editing ? c.voice : '')}"><option value="">Device default</option></select></label><label>Avatar image, optional<input type="file" name="avatar" accept="image/png,image/jpeg,image/webp"></label>${editing && c.avatarUrl ? `<img class="avatar" alt="" width="42" height="42" data-child="${esc(c.id)}" src="${esc(c.avatarUrl)}">` : ''}${editing && c.avatar_path ? '<label class="check"><input type="checkbox" name="clear_avatar" value="1"><span>Remove avatar image</span></label>' : ''}<button class="btn" type="submit">${editing ? 'Save changes' : 'Add child'}</button>${editing ? ' <button type="button" class="btn ghost" data-act="canceledit">Cancel</button>' : ''}</form><p class="muted">A nickname is enough. An avatar is optional and only you can see it.</p>`;
}
function childPanel() {
  const editing = state.editing ? state.children.find(x => x.id === state.editing) : null;
  const list = state.children.map(ch => `<div class="prow"><div class="row">${ch.avatarUrl ? `<img class="avatar" alt="" width="42" height="42" data-child="${esc(ch.id)}" src="${esc(ch.avatarUrl)}">` : `<span class="avatar ph" aria-hidden="true">${AN[ch.animal] || '🐰'}</span>`}<p><b>${esc(ch.name)}</b><br><span class="muted">${ch.age} · ${esc(ch.pronoun)} · ${esc(ch.language)}${ch.interests ? ' · ' + esc(ch.interests) : ''}</span></p></div><div class="row"><button type="button" class="btn ghost" data-act="editchild" data-id="${esc(ch.id)}">Edit</button><button type="button" class="btn ghost danger" data-act="delchild" data-id="${esc(ch.id)}">Delete</button></div></div>`).join('');
  if (!state.consent) return consentForm() + (list ? `<div class="plist">${list}</div>` : '');
  if (!editing && state.children.length >= childCap()) return `<h2>Child profiles</h2><p class="muted">Your ${esc(state.ent?.plan || 'free')} plan includes ${childCap()} child profiles. Join the waitlist and we will say when you can add more.</p><button type="button" class="btn" data-act="upgrade" data-feature="family">Join the waitlist</button><div class="plist">${list}</div>`;
  return childForm(editing) + (list ? `<div class="plist">${list}</div>` : '');
}
function catLabel(c, adult) { return adult ? (AGEN[c] || c) : (KTOP[c] || c); }
function studioShelf() {
  const adult = state.mode === 'adult';
  const rows = (state.studio || []).filter(t => adult ? t.audience === 'adult' : (t.audience === 'kid' && !t.is_scary));
  const body = state.studioError ? `<p class="err" role="alert">${esc(state.studioError)}</p>` : (!rows.length ? '<p class="muted">Studio stories will appear here when the catalogue is available.</p>' : `<div class="shelf" tabindex="0" aria-label="Studio stories">${rows.map(t => `<button type="button" class="studio-card card" data-act="studio" data-k="${esc(t.key)}"><span class="tag">${esc(catLabel(t.category, adult))}</span><h3>${esc(t.title)}</h3><p class="muted">Studio narration · about 5 minutes</p></button>`).join('')}</div>`);
  return `<div class="lib-head"><h2>Studio voices</h2></div><p class="muted">Recorded samples read with Kokoro, an open-source neural voice. They play from this website. Save a copy if you want it in your library.</p>${body}`;
}
function listenerForm(l) {
  const editing = !!l;
  return `<h2>${editing ? 'Edit listener' : (state.listeners.length ? 'Add a listener' : 'Your listener profile')}</h2><form data-form="listener"><input type="hidden" name="_id" value="${editing ? esc(l.id) : ''}"><label>Name<input name="name" required maxlength="40" value="${editing ? esc(l.name) : (state.listeners.length ? '' : esc(me()?.name || ''))}" autocomplete="nickname"></label><label>Interests, comma separated<input name="interests" maxlength="200" value="${editing ? esc(l.interests) : ''}" placeholder="the sea, old libraries, jazz"></label><label>Preferred mood<select name="mood">${opts(MOODS, editing ? l.mood : 'calm')}</select></label><label>Preferred length${lenSel('length', ALENS, editing ? l.length : 5)}</label><label>Story language<select name="language">${LANGS.map(([k, v]) => `<option value="${k}" ${(editing ? l.language : 'en') === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label><label>Preferred voice<select name="voice" data-voices data-sel="${esc(editing ? l.voice : '')}"><option value="">Device default</option></select></label><button class="btn ghost" type="submit">${editing ? 'Save listener' : 'Save listener'}</button>${editing ? ' <button type="button" class="btn ghost" data-act="cancellistener">Cancel</button>' : ''}</form><p class="muted">Listener profiles are saved to your account. You can keep up to 10.</p>`;
}
function listenerList() {
  if (!state.listeners.length) return '';
  return `<div class="plist">${state.listeners.map(l => `<div class="prow"><p><b>${esc(l.name)}</b><br><span class="muted">${esc(l.mood || 'calm')} · ${esc(l.language || 'en')}${l.interests ? ' · ' + esc(l.interests) : ''}</span></p><div class="row"><button type="button" class="btn ghost" data-act="editlistener" data-id="${esc(l.id)}">Edit</button><button type="button" class="btn ghost" data-act="dellistener" data-id="${esc(l.id)}">Remove</button></div></div>`).join('')}</div>`;
}
const V = {};
const FAQ = [
  ['Is it safe for children?', 'Kids mode only offers gentle topics. Ghost and horror genres cannot be chosen or generated there, and the library refuses to store a scary story on a child profile. Every kids story ends calmly.'],
  ['How are stories made?', 'MoonBerry composes each story from a hand-written library of arcs, settings and endings, personalised with the details you give it. You can also try an optional in-browser AI surprise: it downloads a model to your device and, if that cannot run, falls back to the same template engine.'],
  ['Where is my data stored?', 'Your account, child profiles, listener profiles and saved stories are stored in your MoonBerry account, hosted in the EU. A story you try before signing up stays in this browser until you save it. We never require a photo of your child.'],
  ['Which voices are used for narration?', 'MoonBerry uses the voices built into your browser. A few sample stories also include recorded studio voices. You can choose a voice and speed in the player.'],
  ['Does it cost anything?', 'Early access is free, including 5-minute stories. Premium (US$5.99) and Family (US$9.99) are planned; no payments are taken today. Longer stories ask you to join a waitlist instead of unlocking a preview.'],
  ['Is there anything for parents?', 'Yes. After you sign in, switch to “For me” for grown-up sleep stories. Those stories are not shown in kids mode.']
].map(q => `<details><summary>${q[0]}</summary><p class="muted">${q[1]}</p></details>`).join('');
V.landing = () => {
  let stars = '';
  for (let i = 0; i < 48; i++) stars += `<i class="star" style="left:${(i * 37) % 100}%;top:${(i * 17) % 100}%;animation-delay:${((i % 7) * .35).toFixed(2)}s"></i>`;
  const note = takeNotice();
  const flash = (() => { const t = sessionGet('mb_flash'); if (!t) return ''; sessionDel('mb_flash'); return `<div class="banner" role="status">${esc(t)}</div>`; })();
  const flashed = `${note ? `<div class="banner" role="status">${esc(note)}</div>` : ''}${flash}`;
  const topics = Object.entries(KTOP).map(([k, v]) => `<article class="topic-card gcard"><div class="ic" aria-hidden="true">${KI[k] || '✦'}</div><h3>${esc(v)}</h3></article>`).join('');
  return `${flashed}<section class="hero"><div class="sky" aria-hidden="true"><div class="layer" data-depth="6">${stars}</div><div class="layer" data-depth="12"><div class="moon"></div></div><div class="layer" data-depth="18"><div class="cloud" style="top:22%;width:180px;animation-duration:80s"></div><div class="cloud" style="top:62%;width:220px;animation-duration:110s;animation-delay:-40s"></div></div><div class="shoot" id="shoot"></div></div>
<div class="hero-grid"><div class="hero-copy"><p class="eyebrow">Bedtime, personally</p><h1>Stories where your child is <em>the hero</em></h1><p class="lede">${APP} writes a gentle, illustrated bedtime story starring your child, then reads it aloud. Five quiet minutes. No card. No scary surprises.</p><div class="cta-row"><a class="btn" href="#/signup">Create a free story</a><a class="btn ghost" href="#/try">Try a 5-minute story</a></div><ul class="hero-points"><li>Free stories are 5 minutes</li><li>Read aloud on any phone</li><li>Parent consent before a profile</li></ul></div>
<div class="hero-stage"><div class="glass-story">${mascot}<p class="eyebrow">Tonight’s story</p><h2 style="font-size:1.6rem">Mia and the Twinkling Galaxy</h2><p class="muted">A soft adventure about kindness, read in a calm voice while the moon keeps watch.</p></div></div></div></section>
<section class="proof" aria-label="What families can count on"><article><strong>Parent first</strong><span class="muted">A child profile starts only after a guardian agrees.</span></article><article><strong>Gentle endings</strong><span class="muted">Kids mode never offers ghost or scary tales.</span></article><article><strong>EU accounts</strong><span class="muted">Profiles and stories are stored in Frankfurt.</span></article><article><strong>$0 to begin</strong><span class="muted">Unlimited 5-minute stories during early access.</span></article></section>
<section class="section" id="how"><h2>How bedtime works</h2><div class="grid steps"><article class="card"><p class="step-no">01</p><h3>Add your child</h3><p class="muted">A nickname, age, pronoun, interests and a favourite animal. A photo is optional.</p></article><article class="card"><p class="step-no">02</p><h3>Choose tonight</h3><p class="muted">Match a topic to their interests, or pick one, plus a lesson such as kindness or bravery.</p></article><article class="card"><p class="step-no">03</p><h3>Read or listen</h3><p class="muted">Illustrated pages, a steady voice, and a player that stays within reach.</p></article></div></section>
<section class="section" id="topics"><div class="lib-head"><div><p class="eyebrow">For kids</p><h2>Eighteen gentle worlds</h2></div></div><p class="muted">Picked from your child’s interests, or chosen by you. Every one ends calmly.</p><div class="shelf" tabindex="0" aria-label="Story topics">${topics}</div></section>
<section class="section" id="sample"><h2>A peek inside</h2><div class="card"><div class="grid"><div id="sampleart"></div><div><h3 id="sampletitle"></h3><p class="page" id="typer"></p></div></div></div></section>
<section class="section"><h2>Everything a bedtime needs</h2><div class="grid"><article class="card"><div class="feature-ic">${I.spark}</div><h3>Read aloud</h3><p class="muted">Pick a voice and a speed. The sentence being read is highlighted.</p></article><article class="card"><div class="feature-ic">${I.moon}</div><h3>Bedtime mode</h3><p class="muted">A darker, quieter reader for sleepy eyes.</p></article><article class="card"><div class="feature-ic">${I.clock}</div><h3>Sleep timer</h3><p class="muted">Narration stops after 5, 10, 20 or 30 minutes.</p></article><article class="card"><div class="feature-ic">${I.book}</div><h3>A library</h3><p class="muted">Favourites, listen counts and a place to return tomorrow.</p></article><article class="card"><div class="feature-ic">${I.users}</div><h3>Every child</h3><p class="muted">Each profile keeps its own language, voice and stories.</p></article><article class="card"><div class="feature-ic">${I.shield}</div><h3>Safe for kids</h3><p class="muted">Grown-up sleep stories, including ghost tales, stay in For me.</p></article></div></section>
<section class="section"><h2>Why the last minutes matter</h2><div class="grid"><article class="card"><h3>Connection</h3><p class="muted">A shared story is a few quiet minutes together at the end of the day.</p></article><article class="card"><h3>Routine</h3><p class="muted">Paediatric guidance, including from the <a href="https://www.aap.org/" target="_blank" rel="noopener">American Academy of Pediatrics</a>, encourages a consistent bedtime. Reading together belongs in one.</p></article><article class="card"><h3>Winding down</h3><p class="muted">A calm story replaces the last scroll and gives a busy mind something gentle to follow.</p></article></div></section>
<section class="section" id="pricing"><h2>Simple pricing</h2><p class="muted">Planned prices. No payment is taken today. Premium and Family are waitlists.</p><div class="grid"><article class="card price"><h3>Free</h3><p><b>$0</b></p><p class="muted">5-minute stories starring your child, read aloud, saved to a small library.</p><ul><li>2 child profiles</li><li>Kids topics and lessons</li><li>Browser voices</li></ul><a class="btn" href="#/signup">Start free</a></article><article class="card price hl"><span class="tag gold">Most loved</span><h3>Premium</h3><p><b>US$5.99</b> <span class="muted">/ month</span></p><p class="muted">Longer bedtime adventures, when payments open.</p><ul><li>Stories past 5 minutes</li><li>Every topic and adult genre</li><li>Sleep timer and bedtime mode</li></ul><button type="button" class="btn" data-act="upgrade" data-feature="premium">Join the waitlist</button></article><article class="card price"><h3>Family</h3><p><b>US$9.99</b> <span class="muted">/ month</span></p><p class="muted">Premium, plus room for every child.</p><ul><li>Everything in Premium</li><li>More child profiles</li><li>Stories to share with grandparents</li></ul><button type="button" class="btn ghost" data-act="upgrade" data-feature="family">Join the waitlist</button></article></div></section>
<section class="section" id="questions"><h2>Questions</h2>${FAQ}</section>
<section class="section center"><h2>Tonight’s story is waiting</h2><p class="lede" style="margin-inline:auto">Create one in under a minute, or listen to a free story with no account.</p><div class="cta-row" style="justify-content:center"><a class="btn" href="#/signup">Start free</a><a class="btn ghost" href="#/try">Try a 5-minute story</a></div></section>`;
};
V.auth = (mode, err) => {
  const adult = localGet('mtmode') === 'adult';
  return `<div class="card narrow"><p class="eyebrow">${mode === 'signup' ? 'Create an account' : 'Welcome back'}</p><h1 style="font-size:2rem">${mode === 'signup' ? 'Start free' : 'Log in'}</h1>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}<form data-form="${mode}">${mode === 'signup' ? `<label>Your name<input name="name" required maxlength="80" autocomplete="name"></label><p class="muted" style="margin-bottom:6px">Who are the stories for?</p><div class="chips" role="radiogroup" aria-label="Who are the stories for"><label><input type="radio" name="mode" value="kids" ${adult ? '' : 'checked'}><span>For my child</span></label><label><input type="radio" name="mode" value="adult" ${adult ? 'checked' : ''}><span>For me</span></label></div>` : ''}<label>Email<input type="email" name="email" required maxlength="120" autocomplete="email"></label><label>Password<input type="password" name="password" required minlength="10" maxlength="200" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}"></label>${mode === 'signup' ? '<p class="muted">At least 10 characters, with a letter and a number.</p>' : ''}<button class="btn" type="submit">${mode === 'signup' ? 'Sign up' : 'Log in'}</button></form>${mode === 'login' ? '<p class="muted center"><a href="#/forgot">Forgot your password?</a></p>' : ''}<p class="muted center">${mode === 'signup' ? 'Have an account? <a href="#/login">Log in</a>' : 'New here? <a href="#/signup">Sign up</a>'}</p><p class="muted center"><a href="#/try">Try a free story without an account.</a></p></div>`;
};
V.checkEmail = email => `<div class="card narrow"><h1 style="font-size:2rem">Check your email</h1><p>We sent a confirmation link to <b>${esc(email)}</b>. Open it in this browser and MoonBerry will bring you back signed in.</p><p class="muted">If you open the link on another device, come back here and log in after confirming.</p><button class="btn" type="button" data-act="resend">Resend email</button> <a href="#/login">I have confirmed, log in</a></div>`;
V.forgot = (err, sent) => `<div class="card narrow"><h1 style="font-size:2rem">Reset your password</h1>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}${sent ? '<p class="ok" role="status">If an account exists for that email, a reset link is on its way. Open it in this browser.</p>' : `<form data-form="forgot"><label>Email<input type="email" name="email" required maxlength="120" autocomplete="email"></label><button class="btn" type="submit">Send reset link</button></form>`}<p class="muted"><a href="#/login">Back to log in</a></p></div>`;
V.reset = err => `<div class="card narrow"><h1 style="font-size:2rem">Choose a new password</h1>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}${state.session ? `<form data-form="reset"><label>New password<input type="password" name="password" required minlength="10" autocomplete="new-password"></label><label>Confirm<input type="password" name="confirm" required minlength="10" autocomplete="new-password"></label><p class="muted">At least 10 characters, with a letter and a number.</p><button class="btn" type="submit">Update password</button></form>` : '<p class="muted">Open the reset link from your email, or <a href="#/forgot">request a new one</a>.</p>'}</div>`;
V.try = err => `<div class="card narrow"><p class="eyebrow">No account needed</p><h1 style="font-size:2rem">Try a free story</h1><p class="muted">One gentle 5-minute story, read aloud. Sign up if you want to keep it.</p>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}<p class="muted"><a href="#/studio/s1">Hear a recorded studio sample</a> instead.</p><form data-form="try"><label>Child's name<input name="name" required maxlength="40" placeholder="A nickname is fine" autocomplete="off"></label><div class="row"><label style="flex:1">Age<input type="number" name="age" min="1" max="12" value="5" required inputmode="numeric"></label><label style="flex:1">Pronoun<select name="pronoun"><option>she</option><option>he</option><option>they</option></select></label></div><label>Interests, comma separated<input name="interests" maxlength="100" placeholder="space, drawing, rabbits"></label><label>Favourite animal<select name="animal">${opts(L2(Object.keys(AN)), 'cat')}</select></label><p id="topic-label">Topic</p><div class="chips" role="radiogroup" aria-labelledby="topic-label"><label><input type="radio" name="topic" value="auto" checked><span>Based on interests</span></label>${Object.entries(KTOP).map(([t, v]) => `<label><input type="radio" name="topic" value="${t}"><span>${KI[t] || ''} ${esc(v)}</span></label>`).join('')}</div><label>Lesson<select name="lesson">${opts(L2(Story.LESSONS))}</select></label><p class="muted">Length: 5 minutes · Free</p><button class="btn" type="submit">Create my free story</button></form></div>`;
V.account = err => {
  const note = takeNotice();
  const e = state.ent || freeEnt();
  const name = e.plan === 'family' ? 'Family' : e.plan === 'premium' ? 'Premium' : 'Free';
  return `<header class="page-head"><p class="eyebrow">Settings</p><h1>Account</h1></header>${err ? `<p class="err" role="alert">${esc(err)}</p>` : ''}${note ? `<p class="ok" role="status">${esc(note)}</p>` : ''}<div class="grid"><div class="card"><h2>Profile</h2><form data-form="profile"><label>Your name<input name="name" required maxlength="80" value="${esc(state.profile?.display_name || '')}" autocomplete="name"></label><label>Email<input value="${esc(state.session?.user?.email || '')}" disabled autocomplete="email"></label><label class="check"><input type="checkbox" name="marketing" ${state.profile?.marketing_consent ? 'checked' : ''}><span>Email me when Premium launches. No payment emails.</span></label><button class="btn" type="submit">Save profile</button></form></div><div class="card"><h2>Password</h2><form data-form="password"><label>New password<input type="password" name="password" required minlength="10" autocomplete="new-password"></label><label>Confirm<input type="password" name="confirm" required minlength="10" autocomplete="new-password"></label><button class="btn" type="submit">Update password</button></form><p class="muted">Or <a href="#/forgot">email me a reset link</a>.</p></div></div><div class="card"><h2>Plan</h2><p><span class="badge ${e.is_premium ? 'gold' : ''}">${esc(name)}</span> ${e.is_premium ? `Stories up to ${e.max_story_minutes} minutes · ${e.max_child_profiles} child profiles.` : `Up to ${e.max_story_minutes}-minute stories and ${e.max_child_profiles} child profiles. Payments are not live yet.`}</p><button type="button" class="btn ghost" data-act="upgrade" data-feature="premium">See plans</button></div><div class="card"><h2>Delete account</h2><p class="muted">This removes your login, child profiles, listener profiles, saved stories, and any avatars or audio you uploaded. It cannot be undone.</p><form data-form="deleteacct"><label>Type DELETE to confirm<input name="confirm" required autocomplete="off"></label><button class="btn danger" type="submit">Delete my account</button></form></div>`;
};
V.app = (u, msg) => {
  const note = takeNotice();
  const err = [state.loadError, msg].filter(Boolean).map(t => `<p class="err" role="alert">${esc(t)}</p>`).join('') + (note ? `<p class="ok" role="status">${esc(note)}</p>` : '') + pendingBanner();
  if (u.mode === 'adult') {
    const L = u.listeners;
    const editing = state.editingListener ? L.find(x => x.id === state.editingListener) : null;
    return `<header class="page-head"><p class="eyebrow">For me</p><h1>Good evening, ${esc(u.name || 'friend')}</h1><p class="lede">Slow stories for when the house is quiet.</p></header>${err}${planBox()}<div class="layout-2"><section class="card" id="create" aria-labelledby="create-h"><h2 id="create-h">Tonight’s sleep story</h2>${L.length ? `<form data-form="astory"><label>Listener<select name="lid">${L.map(l => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('')}</select></label><label>Genre<select name="genre">${opts(AGEN)}</select></label><label>Mood<select name="mood">${opts(MOODS, L[0].mood)}</select></label><label>Length${lenSel('length', ALENS, L[0].length)}</label><button class="btn" type="submit">Create sleep story</button>${aiBtn('astory')}</form>` : '<p class="muted">Create a listener profile first.</p>'}</section><section class="card">${listenerForm(editing)}${listenerList()}</section></div>${libraryBlock('adult')}${studioShelf()}`;
  }
  const k = u.children;
  return `<header class="page-head"><p class="eyebrow">Library</p><h1>Goodnight, ${esc(u.name || 'friend')}</h1><p class="lede">A gentle story, with your child as the hero.</p></header>${err}${planBox()}<div class="layout-2"><section class="card" id="create" aria-labelledby="create-h"><h2 id="create-h">Tonight’s story</h2>${k.length ? `<form data-form="story"><label>Child<select name="cid">${k.map(c => `<option value="${esc(c.id)}">${esc(c.name)} (${c.age})</option>`).join('')}</select></label><p id="topic-label">Topic</p><div class="chips" role="radiogroup" aria-labelledby="topic-label"><label><input type="radio" name="topic" value="auto" checked><span>Based on interests</span></label>${Object.entries(KTOP).map(([t, v]) => `<label><input type="radio" name="topic" value="${t}"><span>${KI[t] || ''} ${esc(v)}</span></label>`).join('')}</div><label>Lesson<select name="lesson">${opts(L2(Story.LESSONS))}</select></label><label>Length${lenSel('length', KLEN, 5)}</label><label>Bring along, optional<input name="friend" maxlength="40" placeholder="little brother Adam, or our dog Max"></label><button class="btn" type="submit">Create story</button>${aiBtn('story')}</form>` : '<p class="muted">Add a child first.</p>'}</section><section class="card">${childPanel()}</section></div>${libraryBlock('kid')}${studioShelf()}`;
};
V.reader = (s, pub) => {
  const guest = !pub && !s.saved;
  const resume = !pub && s.last_position_seconds > 5 && !s.last_completed ? `<button type="button" class="btn ghost" data-act="resume">Resume</button>` : '';
  const actions = pub
    ? `<p class="muted">A story made with ${APP}. <a href="#/signup">Make one of your own</a></p>`
    : guest
      ? `<div class="banner"><p>${state.session ? 'This sample is not in your library yet.' : 'This story stays on this device until you leave. Create a free account to keep it.'}</p><button type="button" class="btn" data-act="keep">Save to my library</button>${state.session ? '' : ' <a href="#/signup">Sign up</a>'}</div><div class="row"><button type="button" class="btn ghost" data-act="share" id="share">Copy share link</button><a href="${state.session ? '#/app' : '#/'}">${state.session ? 'Library' : 'Home'}</a></div>`
      : `<div class="row">${resume}<button type="button" class="btn ghost" data-act="fav">${s.fav ? '★ Unfavourite' : '☆ Favourite'}</button><button type="button" class="btn ghost" data-act="share" id="share">Copy share link</button><button type="button" class="btn ghost danger" data-act="delstory" data-id="${esc(s.id)}">Delete</button><a href="#/app">Library</a></div>`;
  return `<article class="card"><span class="tag">${esc(s.mode === 'adult' ? (AGEN[s.genre] || AGEN[s.topic] || 'Story') : (KTOP[s.topic] || 'Story'))}</span><h1 style="font-size:clamp(1.8rem,4vw,2.4rem)">${esc(s.title)}</h1><p class="muted">About ${estMin(s)} minutes read aloud · ${s.pages.length} pages${s.listen_count ? ` · listened ${s.listen_count}×` : ''}</p>${(s.pages || []).map((p, i) => `<div class="pg" ${i ? 'hidden' : ''}>${art(p.scene, s.animal)}<p class="page">${esc(p.text).split(/(?<=[.!?…]["”]?)\s+/).map(x => `<span class="sn">${x}</span>`).join(' ')}</p><p class="muted">Page ${i + 1} of ${s.pages.length}</p></div>`).join('')}<p class="muted">Playback stays in the bar at the bottom of the screen. ${s.audio ? 'This story includes studio voices. Pick one in the Voice list. ' : ''}For the most natural browser voices, use Microsoft Edge or Chrome.</p>${actions}</article>`;
};
function cellText(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'number') return formatNum(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return scrub(JSON.stringify(v)).slice(0, 160);
  return scrub(v);
}
function objectTable(rows) {
  const keys = [...new Set(rows.flatMap(r => Object.keys(r || {})))].slice(0, 6);
  if (!keys.length) return '<p class="muted">None yet.</p>';
  return `<div class="scroll-x"><table class="admin-table"><thead><tr>${keys.map(k => `<th>${esc(humanKey(k))}</th>`).join('')}</tr></thead><tbody>${rows.slice(0, 14).map(r => `<tr>${keys.map(k => `<td>${esc(cellText(r[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function jsonPanel(value, depth) {
  if (depth > 4 || value == null) return value == null ? '<p class="muted">Nothing recorded yet.</p>' : '';
  if (typeof value === 'number') return `<p class="stat-n">${esc(formatNum(value))}</p>`;
  if (typeof value === 'string' || typeof value === 'boolean') return `<p>${esc(cellText(value))}</p>`;
  if (Array.isArray(value)) {
    if (!value.length) return '<p class="muted">None yet.</p>';
    if (value.every(v => v && typeof v === 'object' && !Array.isArray(v))) {
      const series = value.every(v => Object.values(v).filter(x => typeof x === 'number').length === 1);
      if (series && value.length > 2) {
        const nums = value.map(v => Object.values(v).find(x => typeof x === 'number') || 0);
        const max = Math.max(1, ...nums);
        return `<div class="bars" aria-hidden="true">${nums.map(n => `<div class="bar-col"><span style="height:${Math.max(4, Math.round(n / max * 72))}px"></span></div>`).join('')}</div>${objectTable(value)}`;
      }
      return objectTable(value);
    }
    return value.slice(0, 12).map(v => `<div class="card">${jsonPanel(v, depth + 1)}</div>`).join('');
  }
  const entries = Object.entries(value);
  const nums = entries.filter(([, v]) => typeof v === 'number');
  const leaves = entries.filter(([, v]) => v == null || typeof v !== 'object');
  const nest = entries.filter(([, v]) => v && typeof v === 'object');
  return `<div class="stat-grid">${nums.map(([k, v]) => `<article class="stat"><p class="eyebrow">${esc(humanKey(k))}</p><p class="stat-n">${esc(formatNum(v))}</p></article>`).join('')}</div>${leaves.filter(([, v]) => typeof v !== 'number').map(([k, v]) => `<p class="kv"><span>${esc(humanKey(k))}</span><b>${esc(cellText(v))}</b></p>`).join('')}${nest.map(([k, v]) => `<h3>${esc(humanKey(k))}</h3>${jsonPanel(v, depth + 1)}`).join('')}`;
}
function asObj(data) {
  if (data == null) return null;
  if (typeof data === 'string') { try { return JSON.parse(data); } catch (e) { return null; } }
  return data;
}
function adminErrorCard(title, error) {
  if (!error) return '';
  if (isNotAdmin(error)) return `<section class="card"><h2>${esc(title)}</h2><p class="muted">This section is for full admins. Report review is available to moderators.</p></section>`;
  return `<section class="card"><h2>${esc(title)}</h2><p class="err" role="alert">${esc(friendly(error))}</p></section>`;
}
function snapshotBlurb(snap) {
  if (!snap) return '';
  if (typeof snap === 'string') return scrub(snap).slice(0, 240);
  if (typeof snap === 'object') {
    const bits = [snap.title, snap.topic || snap.genre, snap.audience].filter(Boolean);
    if (bits.length) return bits.map(scrub).join(' · ');
    return scrub(JSON.stringify(snap)).slice(0, 240);
  }
  return '';
}
function reportsHtml(rows) {
  if (!rows.length) return '<p class="muted">No reports in this queue.</p>';
  return rows.map(r => `<article class="card report"><div class="row"><span class="badge">${esc(r.reason || 'report')}</span><span class="badge">${esc(r.status || '')}</span><span class="muted">${esc(formatWhen(r.created_at))}</span></div>${r.details ? `<p>${esc(r.details)}</p>` : ''}<p class="muted">${r.studio_track_key ? 'Studio ' + esc(r.studio_track_key) : (r.story_id ? 'Story ' + esc(String(r.story_id).slice(0, 8)) : 'No story id')} ${snapshotBlurb(r.story_snapshot) ? '· ' + esc(snapshotBlurb(r.story_snapshot)) : ''}</p>${r.resolution_note ? `<p class="muted">Note: ${esc(r.resolution_note)}</p>` : ''}${r.status === 'resolved' || r.status === 'dismissed' ? '' : `<form data-form="resolve" data-id="${esc(r.id)}"><label>Resolution note<textarea name="note" required maxlength="500" placeholder="What you decided"></textarea></label><div class="row"><button class="btn" type="submit" name="status" value="resolved">Resolve</button><button class="btn ghost" type="submit" name="status" value="reviewing">Mark reviewing</button><button class="btn ghost danger" type="submit" name="status" value="dismissed">Dismiss</button></div></form>`}</article>`).join('');
}
function adminPage(ov, reps, maint) {
  const note = takeNotice();
  const overview = ov.error ? adminErrorCard('Overview', ov.error) : `<section><h2>Overview</h2><p class="muted">Counts only. No names or email addresses.</p>${jsonPanel(asObj(ov.data), 0)}</section>`;
  const queue = reps.error ? adminErrorCard('Reports', reps.error) : `<section><div class="lib-head"><h2>Reports</h2><label>Queue<select id="report-status" aria-label="Report queue">${[['', 'Open and reviewing'], ['open', 'Open'], ['reviewing', 'Reviewing'], ['resolved', 'Resolved'], ['dismissed', 'Dismissed']].map(([v, l]) => `<option value="${v}" ${state.reportStatus === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>${reportsHtml(state.reports || [])}${state.reportsMore ? '<p><button type="button" class="btn ghost" data-act="morereports">Load more</button></p>' : ''}</section>`;
  const care = maint.error ? adminErrorCard('Maintenance', maint.error) : `<section><h2>Maintenance</h2><p class="muted">Recent upkeep and orphan file counts. Files are not deleted from here.</p>${jsonPanel(asObj(maint.data), 0)}</section>`;
  return `<header class="page-head"><p class="eyebrow">Admin</p><h1>MoonBerry overview</h1><p class="lede">A quiet look at the service. Refreshed just now.</p></header>${note ? `<p class="ok" role="status">${esc(note)}</p>` : ''}${overview}${queue}${care}`;
}

const PAGES = {
  about: ['About MoonBerry', `<p>MoonBerry is an early-access app that creates personalised bedtime stories. For children, the child becomes the hero of a gentle adventure with a lesson chosen by their parent. For adults, MoonBerry offers slow, calming sleep stories across genres from history to mythology.</p><p>We started MoonBerry in Malaysia because bedtime is one of the few moments in a busy day that families share, and we wanted to make it a little more magical, in any language and any home.</p>`],
  privacy: ['Privacy Policy', `<p><i>Draft, early access. Last updated November 2026.</i></p><h2>What we collect</h2><p>When you create an account we store your email address and a display name. Your password is handled by our authentication provider; this website never keeps the password itself. If you ask for product news, we store that choice. The time you gave it is recorded by the server.</p><p>Saved stories, favourites and listening progress are stored in your account. Adult listener profiles (a name, interests, mood, story length, language and an optional voice) are stored in your account, up to 10. If you join a waitlist, we store your email and which feature you asked about. A story you try before signing up stays in this browser until you save it or leave.</p><h2>Children's data</h2><p>We only create a child profile after a parent or guardian confirms they are an adult and agrees to this policy. We ask for a first name or nickname, an age between 1 and 12, a pronoun, interests, a story language, and an optional voice preference. An avatar image is optional. We do not ask for a child's school, precise location, or a recording of their voice. Please use a nickname if you prefer.</p><p>Child profiles, listener profiles, stories and uploaded files are visible only to the parent account that created them.</p><h2>Where it is stored</h2><p>Account data is stored with Supabase in the EU (Frankfurt) and protected by row-level security. Studio narration that ships with MoonBerry is served from this website.</p><h2>Shared stories</h2><p>When you share a story, its text is encoded inside the link itself. Anyone with the link can read that story, so share it only with people you trust.</p><h2>Your choices</h2><p>You can delete a child profile (and the stories saved for them), delete a listener profile, delete a single story, or delete your whole account from the Account page. Deleting the account removes your login, profiles, stories and uploaded files. A waitlist email may remain, no longer linked to the account.</p><p>We follow applicable laws, including Malaysia's PDPA and the EU GDPR.</p><h2>Contact</h2><p>Questions? See our <a href="#/contact">contact page</a>.</p>`],
  terms: ['Terms of Use', `<p><i>Draft, early access. Last updated November 2026.</i></p><p>By using MoonBerry you agree to these terms. MoonBerry is provided "as is" during early access, without warranties, and features may change.</p><h2>Use by families</h2><p>Accounts are for adults aged 18 or over. Before a child profile is saved, the parent or guardian confirms they are an adult and agrees to the privacy policy. Parents and guardians choose and supervise the stories their children hear. Kids mode does not offer ghost or scary stories.</p><h2>Content</h2><p>Stories are generated automatically from templates, or optionally by an in-browser model on your device. We design them to be gentle and age-appropriate, but please review stories before reading them to your child. Historical and religious stories are simplified retellings for relaxation, not academic or theological sources.</p><h2>Payments</h2><p>No payments are taken during early access. Planned pricing is shown for information only. Story lengths and profile counts beyond the free plan are not unlocked by any preview control.</p><h2>Acceptable use</h2><p>Don't misuse the service, attempt to break it, or share links containing other people's private information.</p>`],
  contact: ['Contact us', `<p>We'd love to hear from you: ideas, bugs, or the story your child asked for twice.</p><p>Email: <a href="mailto:hello@moonberry.app">hello@moonberry.app</a></p><p>Founder: Mike, based in Malaysia.</p>`],
  faq: ['Frequently asked questions', FAQ]
};

let cur = null, pg = 0, playing = false, timerEnd = 0, listenHandle = null;
let fxMove = null, fxScroll = null;
const show = n => {
  const P = document.querySelectorAll('.pg');
  pg = Math.max(0, Math.min(Math.max(P.length - 1, 0), n));
  P.forEach((p, k) => { p.hidden = k !== pg; });
  const fill = $('#np-fill');
  const label = $('#np-page');
  if (P.length && fill) fill.style.width = ((pg + 1) / P.length * 100) + '%';
  if (label && P.length) label.textContent = `Page ${pg + 1} of ${P.length}`;
};
const VQ = v => { const n = v.name; let s = 0; if (/natural|neural/i.test(n)) s += 60; if (/online/i.test(n)) s += 40; if (/premium|enhanced/i.test(n)) s += 35; if (/google/i.test(n)) s += 30; if (/siri/i.test(n)) s += 30; if (/compact|espeak|legacy|eloquence|\bsuper\b|novelty|whisper|zarvox|bells|bubbles|cellos|organ|jester|bahh|boing|trinoids|albert|bad news|good news|wobble/i.test(n)) s -= 60; if (!v.localService) s += 5; return s; };
const LN = (() => { try { return new Intl.DisplayNames(['en'], { type: 'language' }); } catch (e) { return null; } })();
const RN = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { return null; } })();
const langLabel = l => { const [a, b] = String(l || 'en').replace('_', '-').split('-'); let n = a; try { n = LN ? LN.of(a) : a; } catch (e) {} let r = ''; try { r = b && RN ? RN.of(b.toUpperCase()) : b || ''; } catch (e) { r = b || ''; } if (a === 'zh' && b) r = { CN: 'Mandarin, China', TW: 'Taiwan', HK: 'Cantonese, Hong Kong' }[b.toUpperCase()] || r; return n + (r ? ' (' + r + ')' : ''); };
const SAMPLE = { en: 'Hello. Snuggle in, and I will read you a gentle story tonight.', ms: 'Selamat malam. Mari kita dengar cerita sebelum tidur.', id: 'Selamat malam. Ayo dengarkan cerita sebelum tidur.', zh: '晚安。让我们一起听一个温柔的睡前故事吧。', es: 'Buenas noches. Acurrúcate, te leeré un cuento tranquilo.', fr: 'Bonne nuit. Installe-toi, je vais te lire une douce histoire.', de: 'Gute Nacht. Kuschel dich ein, ich lese dir eine ruhige Geschichte vor.', ja: 'おやすみなさい。やさしいお話を読みますね。', hi: 'शुभ रात्रि। आइए एक प्यारी सी कहानी सुनें।', ta: 'இனிய இரவு. ஒரு அமைதியான கதை கேட்போம்.', ar: 'تصبح على خير. لنستمع إلى قصة هادئة.', pt: 'Boa noite. Aconchegue-se, vou ler uma história tranquila.', it: 'Buonanotte. Mettiti comodo, ti leggo una storia dolce.', ko: '잘 자요. 포근한 이야기를 읽어 줄게요.' };
let MAN = null;
async function manifest() { if (MAN) return MAN; try { MAN = await (await fetch('assets/audio/manifest.json')).json(); } catch (e) { MAN = {}; } return MAN; }
function vlist() { return window.speechSynthesis ? speechSynthesis.getVoices() : []; }
function fillProfileVoices() {
  document.querySelectorAll('select[data-voices]').forEach(sel => {
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
  });
}
async function voices() {
  const sel = $('#voice');
  if (!sel || !cur) return;
  const vs = vlist(), groups = {};
  vs.forEach(v => { const k = langLabel(v.lang || 'en-US'); (groups[k] = groups[k] || []).push(v); });
  const want = (cur && cur.language) || navigator.language || 'en-US';
  const order = Object.keys(groups).sort((a, b) => { const ea = /^English/.test(a), eb = /^English/.test(b); return eb - ea || a.localeCompare(b); });
  let html = '';
  const st = cur && cur.audio ? (await manifest())[cur.audio] : null;
  if (st && st.w === words(cur)) html += `<optgroup label="Studio voices">${st.voices.map((x, i) => `<option value="studio:${i}">${esc(x.label)}</option>`).join('')}</optgroup>`;
  html += order.map(g => `<optgroup label="${esc(g)}">${groups[g].sort((a, b) => VQ(b) - VQ(a)).map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name.replace(/^Microsoft /, '').replace(/ - .*$/, ''))}${VQ(v) >= 30 ? ' ★' : ''}</option>`).join('')}</optgroup>`).join('');
  sel.innerHTML = html || '<option value="">Default voice</option>';
  const saved = localGet('mtvoice');
  let pickv = null;
  const pref = cur?.voice && vs.find(v => v.voiceURI === cur.voice || v.name === cur.voice);
  if (st && st.w === words(cur) && !(saved && saved.indexOf('studio:') !== 0 && vs.some(v => v.voiceURI === saved) && localGet('mtvoicemanual'))) pickv = 'studio:0';
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
if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', () => { voices(); fillProfileVoices(); });
const curVoice = () => vlist().find(v => v.voiceURI === $('#voice')?.value);
function vpreview() {
  const val = $('#voice')?.value || '';
  if (val.startsWith('studio:')) { const a = new Audio(studioFile(+val.slice(7))); a.play().catch(() => {}); setTimeout(() => { a.pause(); a.src = ''; }, 6000); return; }
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
  const payload = { platform: 'web', position_seconds: 0, duration_seconds: Math.max(1, Math.min(86400, estMin(cur) * 60)), completed: false };
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
function setPlayUi(on) {
  const b = $('#play');
  if (!b) return;
  b.classList.toggle('is-on', !!on);
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.setAttribute('aria-label', on ? 'Pause narration' : 'Read aloud');
  const label = b.querySelector('.np-label');
  if (label) label.textContent = on ? 'Pause' : 'Play';
}
function announce(msg) { const n = $('#live'); if (n) n.textContent = msg; }
function stopPlay(completed = false) {
  const was = playing;
  playing = false;
  const pos = listenPosition();
  if (window.speechSynthesis) speechSynthesis.cancel();
  if (AU) AU.pause();
  setPlayUi(false);
  document.querySelectorAll('.hl-s').forEach(e => e.classList.remove('hl-s'));
  if (was) announce(completed ? 'Finished' : 'Paused');
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
  const st = MAN && MAN[cur.audio];
  const Vce = st && st.voices[i];
  if (!Vce) { stopPlay(false); announce('That studio voice is not available.'); return; }
  if (!AU || AU._f !== Vce.file) {
    if (AU) { AU.pause(); AU.src = ''; }
    AU = new Audio('assets/audio/' + Vce.file);
    AU._f = Vce.file;
    const resume = Number(cur && cur._resumeAt);
    if (resume > 0) { try { AU.currentTime = resume; } catch (e) {} cur._resumeAt = 0; }
    else {
      const st0 = Vce.t.findIndex(x => x[0] === pg);
      if (st0 > 0) AU.currentTime = Vce.t[st0][2];
    }
    AU.ontimeupdate = () => {
      if (!playing) return;
      if (timerEnd && Date.now() > timerEnd) { timerEnd = 0; return stopPlay(false); }
      const c = AU.currentTime;
      let k = 0;
      for (let j = 0; j < Vce.t.length; j++) { if (Vce.t[j][2] <= c) k = j; else break; }
      const x = Vce.t[k];
      if (x && AU._k !== k) { AU._k = k; hl(x[0], x[1]); }
    };
    AU.onended = () => stopPlay(true);
    AU.onerror = () => { stopPlay(false); announce('The studio recording could not be played.'); };
  }
  const started = AU.play();
  if (started && started.catch) started.catch(() => stopPlay(false));
}
function seekStudio() {
  if (AU && MAN && cur && cur.audio) {
    const Vce = MAN[cur.audio].voices.find(x => x.file === AU._f);
    const j = Vce && Vce.t.findIndex(x => x[0] === pg);
    if (j >= 0) { try { AU.currentTime = Vce.t[j][2] + 0.01; } catch (e) {} AU._k = -1; }
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
function clearHomeFx() {
  if (fxMove) removeEventListener('mousemove', fxMove);
  if (fxScroll) removeEventListener('scroll', fxScroll);
  fxMove = fxScroll = null;
  clearInterval(window._sh);
}
function homeFx() {
  clearHomeFx();
  if (RM) return;
  const L = [...document.querySelectorAll('.sky .layer')];
  let lastX = 0, lastY = 0;
  const mv = () => L.forEach(l => { const d = +l.dataset.depth || 0; l.style.transform = `translate3d(${lastX * d}px,${lastY * d}px,0)`; });
  fxMove = e => { lastX = e.clientX / innerWidth - .5; lastY = e.clientY / innerHeight - .5; mv(); };
  fxScroll = () => mv();
  addEventListener('mousemove', fxMove, { passive: true });
  addEventListener('scroll', fxScroll, { passive: true });
  clearInterval(window._sh);
  window._sh = setInterval(() => { const s = $('#shoot'); if (!s) return clearInterval(window._sh); s.style.top = (5 + Math.random() * 30) + '%'; s.classList.remove('go'); void s.offsetWidth; s.classList.add('go'); }, 7000);
}
function typer() {
  const s = Story.generate({ child: { name: 'Mia', age: 5, interests: 'stars', animal: 'owl', pronoun: 'she' }, topic: 'space', lesson: 'kindness', length: 'short', seed: 'land' });
  const artBox = $('#sampleart');
  const title = $('#sampletitle');
  const el = $('#typer');
  if (!artBox || !title || !el) return;
  artBox.innerHTML = art('space', 'owl');
  title.textContent = s.title;
  const t = s.pages[0].text + ' ' + s.pages[1].text;
  if (RM) { el.textContent = t; return; }
  let i = 0;
  clearInterval(window._ty);
  window._ty = setInterval(() => { if (!document.body.contains(el)) return clearInterval(window._ty); el.textContent = t.slice(0, ++i); if (i >= t.length) clearInterval(window._ty); }, 18);
}
function consumeJump() {
  const id = sessionGet('mb_jump');
  if (!id) return;
  sessionDel('mb_jump');
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }));
}
function shellSync(isReader) {
  const adultRead = !!(isReader && cur && cur.mode === 'adult');
  document.body.classList.toggle('reading-adult', adultRead);
  const bar = $('#player');
  if (!bar) return;
  if (isReader && cur && cur.pages) {
    bar.hidden = false;
    document.body.classList.add('has-player');
    const kicker = $('#np-kicker'), title = $('#np-title'), sub = $('#np-sub'), artbox = $('#np-art');
    if (kicker) kicker.textContent = cur.mode === 'adult' ? 'For me' : 'For my child';
    if (title) title.textContent = cur.title || 'Story';
    if (sub) sub.textContent = cur.cn ? 'For ' + cur.cn : '';
    if (artbox) artbox.innerHTML = cover(cur);
    setPlayUi(playing);
    show(pg);
    const bed = $('#np-bed');
    if (bed) bed.setAttribute('aria-pressed', document.body.classList.contains('bed') ? 'true' : 'false');
  } else if (!playing) {
    bar.hidden = true;
    document.body.classList.remove('has-player');
  }
}
function focusMain() {
  const h = $('#app')?.querySelector('h1, h2');
  if (!h) return;
  if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
  h.focus({ preventScroll: true });
}
function paint(html, opts) {
  const A = $('#app');
  const recovery = state.recovery && !location.hash.startsWith('#/reset')
    ? '<div class="banner">Choose a new password to finish resetting your account. <a href="#/reset">Reset password</a></div>' : '';
  A.innerHTML = recovery + html;
  if (opts && opts.voice) voices();
  if ($('select[data-voices]')) fillProfileVoices();
  clearHomeFx();
  if ($('.sky')) { homeFx(); if ($('#typer')) typer(); consumeJump(); }
  shellSync(!!(opts && opts.voice));
  if (fromHash) { fromHash = false; focusMain(); }
}
function showApp(msg) {
  const u = me();
  if (!u) { location.hash = '#/login'; return; }
  paint(V.app(u, msg || ''));
}
function isPublic(hash) {
  const h = hash || '#/';
  if (h === '#' || h === '#/' || h === '') return true;
  return /^#\/(about|privacy|terms|contact|faq|try|login|signup|forgot|check-email|reset|guest)(\b|$)/.test(h) || /^#\/studio\/s\d+$/.test(h) || h.startsWith('#/s/');
}
async function renderAdmin(n, more) {
  if (!more) state.reports = [];
  const args = { p_limit: 30 };
  if (state.reportStatus) args.p_status = state.reportStatus;
  if (more && state.reportCursor) args.p_before = state.reportCursor;
  if (!more) paint('<header class="page-head"><p class="eyebrow">Admin</p><h1>Overview</h1><p class="muted">Loading counts…</p></header>');
  const [ov, reps, maint] = await Promise.all([
    supabase.rpc('admin_get_overview'),
    supabase.rpc('admin_list_reports', args),
    supabase.rpc('admin_get_maintenance')
  ]);
  if (n !== routeGen) return;
  const batch = reps.error ? [] : (reps.data || []);
  state.reports = more ? state.reports.concat(batch) : batch;
  state.reportsMore = !reps.error && batch.length === 30;
  state.reportCursor = batch.length ? batch[batch.length - 1].created_at : state.reportCursor;
  paint(adminPage(ov, reps, maint));
  document.title = 'Admin · ' + APP;
}
async function route() {
  const n = ++routeGen;
  try { await draw(n); }
  catch (err) {
    if (n !== routeGen) return;
    paint(`<div class="card narrow"><h1>Something went wrong</h1><p class="err" role="alert">${esc(friendly(err))}</p><p><button class="btn" type="button" data-act="reload">Reload</button></p></div>`);
  }
}
async function draw(n) {
  stopPlay(false);
  if (AU) { AU.pause(); AU.src = ''; AU = null; }
  closeModal();
  const h = location.hash.slice(1) || '/';
  if (AID && !AID.saved && h !== '/ai') {
    if (AID.text.trim() && !confirm('Discard this unsaved AI story?')) { history.replaceState(null, '', '#/ai'); renderAI(); return; }
    aiStop();
    AID = null;
  }
  document.body.classList.remove('bed');
  shellSync(false);
  if (!state.ready) { $('#app').innerHTML = '<p class="muted boot-note">Loading MoonBerry…</p>'; return; }
  nav();
  pg = 0;
  window.scrollTo(0, 0);
  clearHomeFx();
  document.title = 'MoonBerry · Bedtime stories where your child is the hero';
  let m;
  if (m = h.match(/^\/s\/(.+)$/)) {
    try { cur = await unpack(m[1]); if (n !== routeGen) return; document.title = (cur.title || 'Story') + ' · ' + APP; paint(V.reader(cur, true), { voice: true }); }
    catch (e) { paint('<div class="card narrow"><h1>This story link looks broken.</h1><p><a class="btn" href="#/">Go home</a></p></div>'); }
    return;
  }
  if (m = h.match(/^\/(about|privacy|terms|contact|faq)$/)) {
    const [t, b] = PAGES[m[1]];
    document.title = t + ' · ' + APP;
    paint(`<article class="prose"><h1 style="font-size:clamp(2rem,4vw,2.6rem)">${t}</h1>${b}</article>`);
    return;
  }
  if (h === '/signup' || h === '/login') {
    if (state.session && !state.recovery) { location.hash = '#/app'; return; }
    document.title = (h === '/signup' ? 'Sign up' : 'Log in') + ' · ' + APP;
    paint(V.auth(h.slice(1), takeNotice()));
    return;
  }
  if (h === '/forgot') { document.title = 'Reset password · ' + APP; paint(V.forgot('', false)); return; }
  if (h === '/reset') { document.title = 'New password · ' + APP; paint(V.reset('')); return; }
  if (h === '/check-email') { paint(V.checkEmail(state.pendingEmail || 'your inbox')); return; }
  if (h === '/') {
    const root = document.getElementById('home-root');
    if (root && !root.dataset.live) {
      root.dataset.live = '1';
      const note = takeNotice();
      const saved = sessionGet('mb_flash');
      if (saved) sessionDel('mb_flash');
      const msg = note || saved;
      if (msg) root.insertAdjacentHTML('afterbegin', `<div class="banner" role="status">${esc(msg)}</div>`);
      const shelf = root.querySelector('#topics .shelf');
      if (shelf && !shelf.children.length) {
        shelf.innerHTML = Object.entries(KTOP).map(([k, v]) => `<article class="topic-card gcard"><div class="ic" aria-hidden="true">${KI[k] || ''}</div><h3>${esc(v)}</h3></article>`).join('');
      }
      homeFx();
      if ($('#typer')) typer();
      shellSync(false);
      consumeJump();
      if (fromHash) { fromHash = false; focusMain(); }
      return;
    }
    paint(V.landing());
    return;
  }
  if (h === '/try') {
    if (state.session) { location.hash = '#/app'; return; }
    document.title = 'Try a free story · ' + APP;
    paint(V.try(''));
    return;
  }
  if (h === '/guest') {
    const view = readJSON(sessionStorage, 'mb_guest');
    if (!view?.pages) { location.hash = '#/try'; return; }
    cur = view;
    document.title = (cur.title || 'Story') + ' · ' + APP;
    paint(V.reader(cur, false), { voice: true });
    return;
  }
  if (m = h.match(/^\/studio\/([A-Za-z0-9_-]{1,32})$/)) {
    const key = m[1];
    if (!state.studioLoaded && supabase) { try { await loadStudio(); } catch (e) {} if (n !== routeGen) return; }
    const adult = trackIsAdult(key);
    if (adult && (!state.session || state.mode !== 'adult')) {
      paint(`<div class="card narrow"><h1>That story is for grown-ups</h1><p>Ghost stories and other sleep tales stay in For me, after you log in. Kids mode only plays gentle adventures.</p><p><a class="btn" href="${state.session ? '#/app' : '#/signup'}">${state.session ? 'Back to my stories' : 'Create a free account'}</a></p></div>`);
      return;
    }
    cur = studioStory(key);
    document.title = (cur.title || 'Studio') + ' · ' + APP;
    paint(V.reader(cur, false), { voice: true });
    return;
  }
  if (m = h.match(/^\/story\/([0-9a-fA-F-]{10,})$/)) {
    if (!state.session) { location.hash = '#/login'; return; }
    let s = state.stories.find(x => x.id === m[1]) || null;
    if (!s) s = await findStory(m[1]);
    if (n !== routeGen) return;
    if (s && state.mode !== 'adult' && s.mode === 'adult') {
      paint('<div class="card narrow"><h1>This is a grown-up sleep story</h1><p class="muted">Switch to For me to open it. It stays hidden in kids mode, including ghost and spooky tales.</p><p><a class="btn" href="#/app">Back to the library</a></p></div>');
      return;
    }
    if (s && !s.pages) {
      try { s = await hydrateStory(s); } catch (e) { paint(`<div class="card narrow"><h1>Could not open that story</h1><p class="err" role="alert">${esc(friendly(e))}</p><p><a href="#/app">Back</a></p></div>`); return; }
      if (n !== routeGen) return;
    }
    cur = s;
    if (cur) document.title = (cur.title || 'Story') + ' · ' + APP;
    paint(cur && cur.pages ? V.reader(cur, false) : '<div class="card narrow"><h1>Story not found</h1><p><a href="#/app">Back</a></p></div>', { voice: !!cur });
    return;
  }
  if (!['/app', '/account', '/ai', '/admin'].includes(h)) {
    paint('<div class="card narrow"><h1>Page not found</h1><p class="muted">That link does not match a MoonBerry page.</p><p><a class="btn" href="#/">Home</a></p></div>');
    return;
  }
  if (!state.session) { location.hash = '#/login'; return; }
  if (h === '/admin') {
    if (!state.adminChecked) await refreshAdminFlag();
    if (n !== routeGen) return;
    if (!state.isAdmin) {
      state.notice = 'That page is only for MoonBerry admins.';
      location.hash = '#/';
      return;
    }
    await renderAdmin(n, false);
    return;
  }
  if (!state.profile && h !== '/account') {
    paint(`<div class="card narrow"><h1>We could not open your library</h1><p class="err" role="alert">${esc(state.loadError || 'Your account is still being set up.')}</p><button class="btn" type="button" data-act="retry">Try again</button></div>`);
    return;
  }
  if (h === '/account') {
    document.title = 'Account · ' + APP;
    paint(state.profile ? V.account('') : `<div class="card narrow"><p class="err">${esc(state.loadError || 'Account not ready.')}</p><button class="btn" type="button" data-act="retry">Try again</button></div>`);
    return;
  }
  if (h === '/app') { document.title = 'Library · ' + APP; showApp(''); return; }
  if (h === '/ai') { if (!AID) { location.hash = '#/app'; return; } renderAI(); return; }
  paint('<div class="card narrow"><h1>Page not found</h1><p><a class="btn" href="#/">Home</a></p></div>');
}

async function setMode(next) {
  const adult = next === 'adult';
  const prev = state.mode;
  state.mode = adult ? 'adult' : 'kids';
  localSet('mtmode', state.mode);
  if (state.profile) {
    state.profile.adult_mode_enabled = adult;
    const { error } = await supabase.from('profiles').update({ adult_mode_enabled: adult }).eq('id', uid());
    if (error) {
      state.mode = prev;
      state.profile.adult_mode_enabled = prev === 'adult';
      localSet('mtmode', state.mode);
      alert(friendly(error));
    }
  }
  if (/^#\/(app|story|studio|ai)/.test(location.hash)) {
    if (location.hash !== '#/app') location.hash = '#/app';
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
      child = await saveChild({ name: view.cn || 'My child', age: view.childAge || 5, pronoun: view.pronoun || 'they', interests: view.interests || '', animal: view.animal || 'bunny', language: view.language || 'en', voice: '', accent: '' }, null);
    }
    view.cid = child.id;
    view.pronoun = child.pronoun;
    view.lid = null;
  }
  const saved = await persistStory(view);
  if (!saved) return;
  sessionDel('mb_pending'); sessionDel('mb_guest');
  state.wantPending = false;
  location.hash = '#/story/' + saved.id;
}
async function keepCurrent() {
  if (!cur) return;
  if (!state.session) { try { sessionStorage.setItem('mb_pending', JSON.stringify(cur)); } catch (e) {} location.hash = '#/signup'; return; }
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
  forgetStory(id);
  if (cur && cur.id === id) cur = null;
  if (location.hash.startsWith('#/story/')) location.hash = '#/app';
  else route();
}
function goHash(dest) {
  if ((location.hash || '#/') === dest) route();
  else location.hash = dest;
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act;
  if (a === 'upgrade') return upgrade(b.dataset.feature || 'premium');
  if (a === 'mclose') return closeModal();
  if (a === 'vprev') return vpreview();
  if (a === 'studio') { location.hash = '#/studio/' + b.dataset.k; return; }
  if (a === 'ai') return aiStart(b.closest('form'));
  if (a === 'aisave') return aiSave();
  if (a === 'aiagain') { if (AID && !AID.saved && AID.text.trim() && !confirm('Discard this story and write another?')) return; return aiRun(AID.opt); }
  if (a === 'reload') { location.reload(); return; }
  if (a === 'jump') {
    const id = b.dataset.target;
    if ((location.hash || '#/') !== '#/' && location.hash !== '') { sessionSet('mb_jump', id); location.hash = '#/'; return; }
    document.getElementById(id)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    return;
  }
  if (a === 'logout') {
    state.authLock = true;
    try { if (supabase) await supabase.auth.signOut(); } catch (err) {}
    clearAccount();
    state.authLock = false;
    goHash('#/');
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
  if (a === 'editlistener') { state.editingListener = b.dataset.id; return route(); }
  if (a === 'cancellistener') { state.editingListener = null; return route(); }
  if (a === 'delchild') {
    if (!confirm('Delete this child and the stories saved for them?')) return;
    try { await deleteChild(b.dataset.id); route(); }
    catch (err) { alert(friendly(err)); }
    return;
  }
  if (a === 'dellistener') {
    if (!confirm('Remove this listener profile?')) return;
    try { await deleteListener(b.dataset.id); route(); }
    catch (err) { alert(friendly(err)); }
    return;
  }
  if (a === 'morelib') {
    const unlock = lock(b, 'Loading…');
    try { await loadLibrary(b.dataset.aud === 'adult' ? 'adult' : 'kid', { more: true }); route(); }
    catch (err) { unlock(); alert(friendly(err)); }
    return;
  }
  if (a === 'morereports') {
    try { await renderAdmin(routeGen, true); } catch (err) { alert(friendly(err)); }
    return;
  }
  if (a === 'savepending') {
    const unlock = lock(b, 'Saving…');
    try { await savePending(); }
    catch (err) { unlock(); if (isUpgrade(err)) upgrade('family'); else alert(friendly(err)); }
    return;
  }
  if (a === 'droppending') { sessionDel('mb_pending'); return route(); }
  if (a === 'keep') {
    const unlock = lock(b, 'Saving…');
    try { await keepCurrent(); }
    catch (err) { unlock(); alert(friendly(err)); }
    return;
  }
  if (a === 'prev' || a === 'next') {
    show(pg + (a === 'prev' ? -1 : 1));
    const studio = ($('#voice')?.value || '').startsWith('studio:');
    if (studio && AU) seekStudio();
    else if (playing) { speechSynthesis.cancel(); say(0); }
    return;
  }
  if (a === 'bed') {
    document.body.classList.toggle('bed');
    const on = document.body.classList.contains('bed');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    announce(on ? 'Bedtime mode on' : 'Bedtime mode off');
    return;
  }
  if (a === 'resume') {
    if (!cur?.pages?.length) return;
    const pos = +cur.last_position_seconds || 0;
    const total = Math.max(1, estMin(cur)) * 60;
    const idx = Math.min(cur.pages.length - 1, Math.max(0, Math.floor((pos / total) * cur.pages.length)));
    show(idx);
    if (pos > 0) cur._resumeAt = pos;
    if (!playing) $('#play')?.click();
    return;
  }
  if (a === 'play') {
    const val = $('#voice')?.value || '';
    if (playing) return stopPlay(false);
    const tm = +($('#timer')?.value || 0);
    timerEnd = tm ? Date.now() + tm * 60000 : 0;
    playing = true;
    setPlayUi(true);
    announce('Playing');
    trackStart();
    if (cur && cur.audio) {
      await manifest();
      const st = MAN && MAN[cur.audio];
      if (st && st.w === words(cur) && !val.startsWith('studio:')) {
        val = 'studio:0';
        if ($('#voice')) $('#voice').value = val;
      }
    }
    if (val.startsWith('studio:') && cur && cur.audio) return playStudio(+val.slice(7));
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
    for (const bucket of ['kid', 'adult']) {
      (state.lib[bucket] || []).forEach(s => { if (s.id === cur.id) s.fav = next; });
      (state.favs[bucket] || []).forEach(s => { if (s.id === cur.id) s.fav = next; });
    }
    b.textContent = next ? '★ Unfavourite' : '☆ Favourite';
    return;
  }
  if (a === 'delstory') return removeStory(b.dataset.id || cur?.id);
  if (a === 'share') {
    const { id, fav, cid, lid, saved, listen_count, avatarUrl, last_position_seconds, last_completed, excerpt, createdAt, source, loaded, ...pub } = cur;
    const url = location.href.split('#')[0] + '#/s/' + await pack(pub);
    let i = document.getElementById('shareurl');
    if (!i) { i = document.createElement('input'); i.id = 'shareurl'; i.readOnly = true; i.setAttribute('aria-label', 'Share link'); b.parentNode.after(i); }
    i.value = url;
    try { await navigator.clipboard.writeText(url); b.textContent = 'Link copied'; }
    catch (err) { b.textContent = 'Copy the link below'; }
  }
});

document.addEventListener('submit', async e => {
  const f = e.target;
  if (!f?.dataset?.form) return;
  e.preventDefault();
  const t = f.dataset.form;
  const v = Object.fromEntries(new FormData(f));
  const btn = e.submitter || f.querySelector('button[type="submit"], button:not([type])');
  const unlock = lock(btn, t === 'story' || t === 'astory' || t === 'try' ? 'Writing your story…' : 'Please wait…');
  const fail = msg => { unlock(); const old = f.querySelector(':scope > .err'); if (old) old.remove(); f.insertAdjacentHTML('afterbegin', `<p class="err" role="alert" tabindex="-1">${esc(msg)}</p>`); f.querySelector('.err')?.focus(); };
  try {
    if (!supabase && readyClient && t !== 'try') { try { await readyClient; } catch (err) { return fail('Account services are still loading. Please try again.'); } }
    if ((t === 'signup' || t === 'login')) {
      const email = String(v.email || '').trim().toLowerCase();
      const pwErr = t === 'signup' ? passwordProblem(v.password) : (!v.password ? 'Enter your password.' : '');
      if (pwErr) return fail(pwErr);
      state.authLock = true;
      try {
        if (t === 'signup') {
          const mode = v.mode === 'adult' ? 'adult' : 'kids';
          localSet('mtmode', mode);
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
      } finally { state.authLock = false; }
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
      try { await saveChild(v, file); }
      catch (err) { unlock(); if (isUpgrade(err)) return upgrade('family'); return showApp(friendly(err)); }
      state.notice = v._id ? 'Child profile saved.' : 'Child profile added.';
      showApp('');
      return;
    }
    if (t === 'listener') {
      try { await saveListener(v); }
      catch (err) {
        if (isListenerLimit(err)) return fail('You can save up to 10 listener profiles. Remove one to add another.');
        return fail(friendly(err));
      }
      state.notice = 'Listener saved.';
      showApp('');
      return;
    }
    if (t === 'profile') {
      const name = String(v.name || '').trim().slice(0, 80);
      if (!name) return fail('Please enter your name.');
      const on = !!f.elements.marketing?.checked;
      const patch = { display_name: name, marketing_consent: on };
      const { error } = await supabase.from('profiles').update(patch).eq('id', uid());
      if (error) return fail(friendly(error));
      state.profile.display_name = name;
      state.profile.marketing_consent = on;
      state.notice = 'Profile saved.';
      paint(V.account(''));
      nav();
      return;
    }
    if (t === 'deleteacct') {
      if (String(v.confirm || '') !== 'DELETE') return fail('Type DELETE in capital letters to confirm.');
      await deleteAccount();
      goHash('#/');
      return;
    }
    if (t === 'wait') {
      try { await joinWaitlist(v.email, f.dataset.feature || 'premium'); }
      catch (err) {
        if (isWaitRate(err)) return fail('Too many tries. Please wait a bit.');
        return fail(friendly(err));
      }
      f.outerHTML = '<p class="thanks" role="status">You are on the list. We will email you when this launches. No payment was taken.</p>';
      return;
    }
    if (t === 'resolve') {
      const note = String(v.note || '').trim();
      if (note.length < 2) return fail('Add a short resolution note.');
      const status = ['resolved', 'dismissed', 'reviewing', 'open'].includes(e.submitter?.value) ? e.submitter.value : 'resolved';
      const { error } = await supabase.rpc('admin_resolve_report', { p_report_id: f.dataset.id, p_resolution: note.slice(0, 500), p_status: status });
      if (error) {
        if (isNotAdmin(error)) return fail('You do not have permission to resolve reports.');
        return fail(friendly(error));
      }
      state.notice = 'Report updated.';
      await renderAdmin(routeGen, false);
      return;
    }
    if (t === 'try') {
      const who = { name: String(v.name || '').trim().slice(0, 40), age: Math.min(12, Math.max(1, +v.age || 5)), interests: String(v.interests || '').slice(0, 100), animal: AN[v.animal] ? v.animal : 'cat', pronoun: ['she', 'he', 'they'].includes(v.pronoun) ? v.pronoun : 'they', language: 'en' };
      if (!who.name) return fail('Please enter a name.');
      const topic = KTOP[v.topic] ? v.topic : (Story.matchTopic(who.interests) || 'space');
      if (SCARY_RE.test(topic)) return fail('That topic is not available for children.');
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
        if (SCARY_RE.test(topic) || SCARY_RE.test(String(v.topic || ''))) return fail('That topic is not available for children.');
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
    if (t === 'wait' && isWaitRate(err)) { unlock(); return fail('Too many tries. Please wait a bit.'); }
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
    if (AU) { AU.pause(); AU.src = ''; AU = null; }
    if (!s.value.startsWith('studio:')) { localSet('mtvoice', s.value); localSet('mtvoicemanual', '1'); }
  }
  if (s.id === 'childfilter') {
    state.childFilter = s.value;
    loadLibrary('kid').then(() => route()).catch(err => showApp(friendly(err)));
  }
  if (s.id === 'report-status') {
    state.reportStatus = s.value;
    state.reportCursor = '';
    renderAdmin(routeGen, false).catch(err => alert(friendly(err)));
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#modal')) { closeModal(); return; }
    if (document.body.classList.contains('bed')) { document.body.classList.remove('bed'); const bed = $('#np-bed'); if (bed) bed.setAttribute('aria-pressed', 'false'); }
    return;
  }
  const tag = e.target && e.target.tagName;
  if (/INPUT|TEXTAREA|SELECT/.test(tag || '') || e.target?.isContentEditable) return;
  if (e.target?.closest && e.target.closest('button, a, summary')) return;
  if (!document.body.classList.contains('has-player')) return;
  if (e.key === ' ' || e.key === 'k') { e.preventDefault(); $('#play')?.click(); }
  if (e.key === 'ArrowRight') { e.preventDefault(); document.querySelector('#player [data-act="next"]')?.click(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); document.querySelector('#player [data-act="prev"]')?.click(); }
});
document.addEventListener('error', ev => {
  const img = ev.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('avatar')) return;
  if (img.dataset.retried === '1') {
    const ph = document.createElement('span');
    ph.className = 'avatar ph';
    ph.setAttribute('aria-hidden', 'true');
    ph.textContent = '•';
    img.replaceWith(ph);
    return;
  }
  img.dataset.retried = '1';
  const c = state.children.find(x => x.id === img.dataset.child);
  if (!c?.avatar_path || !supabase) return;
  supabase.storage.from('avatars').createSignedUrl(c.avatar_path, 3600).then(({ data }) => {
    if (data?.signedUrl && img.isConnected) { c.avatarUrl = data.signedUrl; img.src = data.signedUrl; }
  });
}, true);

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
  shellSync(false);
  if (title) document.title = title + ' · ' + APP;
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
  document.documentElement.classList.add('js');
  try { localStorage.removeItem('mt'); localStorage.removeItem('mtwait'); } catch (e) {}
  if (!state.ent) state.ent = freeEnt();
  addEventListener('hashchange', () => { fromHash = true; route(); });
  const arrivedSearch = location.search;
  const arrivedHash = location.hash;
  const arrived = arrivedSearch + '&' + arrivedHash;
  const authReturn = /[?&]code=|access_token|type=recovery|type=signup|error_description/.test(arrived);
  const quick = !authReturn && isPublic(arrivedHash);
  if (quick) {
    state.ready = true;
    state.ent = freeEnt();
    try { await route(); } catch (e) {}
  }
  let createClient;
  readyClient = (async () => {
    ({ createClient } = await import(SUPABASE_JS));
    return createClient;
  })();
  try { createClient = await readyClient; }
  catch (e) {
    if (!quick) {
      $('#app').innerHTML = '<div class="card narrow"><h1>MoonBerry could not reach account services</h1><p class="muted">Check your connection and refresh. You can still read the pages linked in the footer.</p></div>';
      nav();
    } else {
      const note = document.createElement('div');
      note.className = 'banner';
      note.setAttribute('role', 'status');
      note.textContent = 'Account services are unreachable right now. You can still read the site and try a free story.';
      $('#app')?.prepend(note);
    }
    return;
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }
  });
  supabase.auth.onAuthStateChange((event, session) => {
    state.session = session;
    if (event === 'PASSWORD_RECOVERY') state.recovery = true;
    if (!booted || state.authLock) return;
    if (event === 'TOKEN_REFRESHED') return;
    setTimeout(async () => {
      if (state.authLock) return;
      if (event === 'SIGNED_OUT') {
        clearAccount();
        const hh = location.hash || '#/';
        if (hh === '#/' || hh === '#' || hh === '') route();
        else location.hash = '#/';
        return;
      }
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
  try { await loadStudio(); } catch (e) { state.studioError = friendly(e); }
  if (state.session) await refreshAccount();
  else state.ent = freeEnt();
  state.ready = true;
  let routedByHash = false;
  if (/[?&]code=|access_token|type=recovery|type=signup|error_description/.test(arrived)) {
    const q = new URLSearchParams(arrivedSearch);
    const h = new URLSearchParams(arrivedHash.startsWith('#/') ? '' : arrivedHash.replace(/^#/, ''));
    const desc = q.get('error_description') || h.get('error_description') || '';
    const errCode = q.get('error_code') || h.get('error_code') || '';
    const hadCode = q.has('code');
    const isSignup = /type=signup/.test(arrived) || hadCode;
    if (errCode || desc) state.notice = friendly({ code: errCode, message: decodeURIComponent(String(desc).replace(/\+/g, ' ')) });
    else if (state.session && isSignup && !state.recovery) state.notice = "You're confirmed! Welcome to MoonBerry.";
    else if (!state.session && hadCode && !/type=recovery/.test(arrived)) state.notice = 'Your email is confirmed. Please log in to continue.';
    history.replaceState(null, '', location.pathname);
    const beforeHash = location.hash;
    if (state.recovery || /type=recovery/.test(arrived)) { state.recovery = true; location.hash = '#/reset'; }
    else if (state.session) location.hash = '#/app';
    else location.hash = '#/login';
    routedByHash = location.hash !== beforeHash;
  }
  booted = true;
  if (!routedByHash) await route();
}
boot();
