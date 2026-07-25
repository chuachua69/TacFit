# TacFit — Google Play Store submission

Everything needed to publish TacFit to the Play Store. The app is a **TWA**
(Trusted Web Activity) — an Android wrapper around the live web app at
`https://tac-fit-nine.vercel.app/`, built with Bubblewrap.

**Status: the signed app bundle is already built.** →
`client/app/build/outputs/bundle/release/app-release.aab`

---

## ⚠️ READ FIRST — the assetlinks fingerprint gotcha (breaks the app if skipped)

A TWA only opens full-screen (no browser address bar) if
`https://tac-fit-nine.vercel.app/.well-known/assetlinks.json` lists the SHA-256
fingerprint of the key that **actually signed the installed app**.

When you enrol in **Play App Signing** (Google's default, recommended), Google
re-signs your app with *its own* key. So the fingerprint players need is
**Google's app-signing fingerprint**, which is different from the local
`android.keystore` fingerprint currently in the file.

**After you upload the AAB and create the app in Play Console:**
1. Play Console → your app → **Test and release → Setup → App integrity → App signing**.
2. Copy the **SHA-256 certificate fingerprint** under "App signing key certificate".
3. Add it to `client/public/.well-known/assetlinks.json` (keep the existing one too —
   an array of both is fine). Then redeploy (merge to `main`).
4. Verify `https://tac-fit-nine.vercel.app/.well-known/assetlinks.json` shows both.

If you skip this, the app installs and runs but shows a Chrome URL bar at the top.

---

## 0. One-time account setup (you must do — I can't)
- **Google Play Console account**: https://play.google.com/console — **US$25 one-time fee**.
  Register as a developer (individual is fine). Google now requires ID verification;
  can take a day or two, so start this first.

## 1. Create the app
Play Console → **Create app**:
- App name: **TacFit**
- Default language: **English (US)**
- App or game: **App**
- Free or paid: **Free**
- Tick the declarations (Play policies, US export laws).

## 2. Upload the bundle
- **Test and release → Production → Create new release** (or start with **Internal testing**
  to smoke-test on your own phone first — recommended, it's instant and avoids a rejected
  production release).
- **Play App Signing**: accept when prompted (default).
- Upload `client/app/build/outputs/bundle/release/app-release.aab`.
- Release name: `1 (1.0)`. Release notes: "First release."
- → then do the **assetlinks fingerprint** step above before rolling out.

## 3. Store listing (copy-paste below)

**App name:** `TacFit`

**Short description** (max 80 chars):
```
Tactical fitness test scorer + a 6-week training program that adapts to you.
```

**Full description** (max 4000 chars):
```
TacFit is a no-nonsense training tool for tactical, military, and functional-fitness athletes. It does two things and does them well: it scores your physical assessment, and it gives you a structured program to improve it.

THE 5-EVENT ASSESSMENT
Run the full tactical circuit or log single events. TacFit scores each event against a baseline, awards bonus points, and assigns you a tier — so you know exactly where you stand and what to beat next time.

A REAL 6-WEEK PROGRAM
Not a random pile of workouts. TacFit runs a structured 6-week periodization cycle — progressive phases that build strength, work capacity, and recovery, then retest at the end and recalibrate. Training weights are generated automatically from your 1RM (or 8RM — we convert it for you).

TRAIN, DON'T JUST READ
Every session runs like a proper workout: prescribed weights, RPE logging, rest timers, and a real EMOM timer. Mark sessions done or skipped — and see exactly what skipping costs you.

BUILT-IN RECOVERY GUARD
An anti-overtraining engine watches what you've logged and warns you when a session hits muscles that are still recovering — so you push hard without breaking down. Browse the full exercise library with live recovery status, and add your own custom exercises.

TRACK THE TREND
See your tier, your best result per event, your 6-week cycle progress, and a skip-impact breakdown that tells you what to do about it.

Sign in with Google to sync across devices, or use it fully offline — your call. No ads, no tracking.

Grab your gear. Let's get to work.
```

**App category:** Health & Fitness
**Tags:** fitness, workout, strength training, gym
**Contact email:** chuazhishengczs@gmail.com
**Privacy policy URL:** `https://tac-fit-nine.vercel.app/privacy.html`
  *(goes live once this branch is merged to main — see checklist bottom)*

## 4. Graphics (required)
| Asset | Spec | Status |
|-------|------|--------|
| App icon | 512×512 PNG | ✅ `client/store_icon.png` |
| Feature graphic | 1024×500 PNG | ✅ `client/store/screenshots/feature-graphic.png` |
| Phone screenshots | 2–8, min 320px side | ✅ 5 in `client/store/screenshots/` — all exactly 1080×1920 (9:16) |

Upload the phone screenshots in filename order; that's the order they appear in
the listing, and it's deliberate:

| File | Shows |
|------|-------|
| `01-wod-today.png` | Today's two sessions, ready to start |
| `02-wod-week.png` | The whole week — completed / skipped / upcoming |
| `03-test.png` | 5-event assessment + single-event training |
| `04-progress.png` | 6-week cycle bar, tier score, event bests, consistency |
| `05-exercises.png` | Exercise library with recovery status and F1–F4 fatigue ratings |

### Regenerating them
`scripts/shoot-store.mjs` drives the installed Chrome over the DevTools
Protocol (no puppeteer/playwright dependency) and renders at 540×960 @ dsf 2,
so output is exactly 1080×1920. It seeds a demo profile into localStorage
first — week 4 of 6, 34 logged sessions, a scored retest — with numbers that
satisfy the real scoring rules in `lib/scoring.js`, so nothing on screen
contradicts the app's own arithmetic.

```bash
npm run dev          # in client/, must be up first
node scripts/shoot-store.mjs
```

Note the seed deliberately logs nothing on *yesterday*: a day totalling >7
fatigue makes today a global recovery-cap day, which buries the exercise
library under identical red warnings.

## 5. Content rating
Fill the questionnaire (**Policy → App content → Content rating**). TacFit has no
objectionable content → it will come back **Everyone / PEGI 3**. Answer "No" to all
violence/sexual/drugs/gambling questions. Category: **Reference, News, or Educational**
or **Health & Fitness**.

## 6. Data safety form (**App content → Data safety**)
Declare honestly (matches the privacy policy):
- **Does your app collect or share user data?** → **Yes** (only if signed in).
- **Data types collected:**
  - *Personal info → Email address* — Collected, **not** shared. Purpose: Account
    management, App functionality. Not required (sign-in is optional).
  - *Personal info → Name* — Collected, not shared. Purpose: Account management.
  - *App activity / Other user-generated content* (your workout logs & entries) —
    Collected, not shared. Purpose: App functionality.
- **Is data encrypted in transit?** → **Yes** (HTTPS + Supabase TLS).
- **Can users request deletion?** → **Yes** (email request; stated in the policy).
- **No** advertising or analytics data collection.

## 7. Other required declarations
- **Target audience & content:** 13+ (not directed at children).
- **Ads:** contains no ads → declare **No ads**.
- **App access:** the app is behind Google sign-in, but reviewers can use it via the
  "Bypass Login" path is dev-only — so provide test instructions:
  *"Tap 'Continue with Google' to sign in; all features are free and unlocked."*
  (If review can't complete Google sign-in, temporarily re-enable a guest path — ask
  Claude to add one for review.)
- **Government app:** No.

## 8. Roll out
- Internal testing first (adds testers by email → instant install link) → confirm the
  app opens **without a URL bar** (proves assetlinks is correct) → then promote to
  **Production**. First production review typically 1–7 days.

---

## Rebuilding the AAB (only if you bump the version or change packageId)
Needs Java + Android SDK. From `client/`:
```bash
bubblewrap build          # regenerates + signs app-release.aab
```
Bump `appVersionCode` (integer, must increase every upload) and `appVersionName`
in `twa-manifest.json` first. The current bundle is versionCode 1 — fine for the
first upload; increment for every subsequent one.

## Pre-submit checklist
- [ ] Merge this branch to `main` so `privacy.html` is live at the URL above (verify it loads).
- [ ] Play Console account created + verified ($25 paid).
- [ ] AAB uploaded (internal testing track first).
- [ ] **assetlinks.json updated with Google's Play-signing SHA-256** + redeployed.
- [ ] Installed from internal track → opens full-screen, no URL bar.
- [ ] Store listing, graphics, content rating, data safety all filled.
- [ ] Promote to Production.
