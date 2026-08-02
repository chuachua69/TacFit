# TacFit — Google Play Store submission

Everything needed to publish TacFit to the Play Store. The app is a **TWA**
(Trusted Web Activity) — an Android wrapper around the live web app at
`https://tac-fit-nine.vercel.app/`, built with Bubblewrap.

## ⚠️ The bundle is NOT signed — sign it before uploading

This file previously claimed "the signed app bundle is already built". **That was
wrong**, and Play rejects the upload with *"All uploaded bundles must be
signed."* Verified 2026-07-30:

- `client/app/build/outputs/bundle/release/app-release.aab` contains **zero
  `META-INF/` entries** — a signed bundle has `MANIFEST.MF` + `.SF` + `.RSA`
  there, so this one was never signed.
- `client/app/build.gradle` has **no `signingConfigs` block at all**, so the
  Gradle `bundleRelease` task could only ever emit an unsigned bundle.
- `twa-manifest.json` points `signingKey.path` at `client/android.keystore`
  (alias `android`) — **that file does not exist on disk.** The keystore was
  removed when it was untracked from the public repo and never regenerated.

### Fix: make a keystore and sign (safe — the app has never been published)

A brand-new upload key is fine here: nothing has ever shipped, so no existing
install can break. Under Play App Signing the upload key is resettable anyway.

Bubblewrap's bundled JDK 17 has the tools (nothing is on PATH):
`C:\Users\chuaz\.bubblewrap\jdk_binary\jdk-17.0.11+9\bin\`

```powershell
$JB = "C:\Users\chuaz\.bubblewrap\jdk_binary\jdk-17.0.11+9\bin"
cd "C:\Users\chuaz\OneDrive\Desktop\AI_Workspace\TacFit\client"

# 1. Create the upload keystore (prompts for a password — pick one and KEEP it)
& "$JB\keytool.exe" -genkeypair -v -keystore android.keystore `
    -alias android -keyalg RSA -keysize 2048 -validity 10000

# 2. Sign the bundle
& "$JB\jarsigner.exe" -verbose -sigalg SHA256withRSA -digestalg SHA-256 `
    -keystore android.keystore `
    app\build\outputs\bundle\release\app-release.aab android

# 3. Verify — must print "jar verified"
& "$JB\jarsigner.exe" -verify app\build\outputs\bundle\release\app-release.aab
```

**Keep that password.** Losing it means generating a new upload key and asking
Google to reset it. `android.keystore` is gitignored (`*.keystore`) and must
never be committed — it was in the public repo once already.

Signed bundle to upload →
`client/app/build/outputs/bundle/release/app-release.aab`

---

## The assetlinks fingerprint — fixed 2026-08-02

A TWA only opens full-screen (no browser address bar) if
`https://tac-fit-nine.vercel.app/.well-known/assetlinks.json` lists the SHA-256
fingerprint of the key that **actually signed the installed app**.

Under **Play App Signing**, Google re-signs the app with *its own* key, so the
fingerprint that matters is Google's — not the local `android.keystore` one.
The file originally carried `2C:C2:9D:…`, the fingerprint of a keystore that was
deleted when it was untracked from the public repo. It matched nothing, so the
installed app showed a Chrome URL bar. Both current fingerprints:

| Key | SHA-256 | Signs |
|---|---|---|
| **Google app signing** (Play Console → Protected with Play → App signing) | `E9:AB:F4:40:…:04:03:D3` | every install from Play |
| **Upload key** (`client/android.keystore`) | `05:65:39:D2:…:23:A6:C5:F8` | locally-built/sideloaded APKs |

Only the first is needed for Play installs. The upload key is included so a
`bubblewrap build` APK sideloaded for testing also opens full-screen.

Getting the value again if the key ever changes: Play Console →
**Protected with Play → App signing** → the **Digital Asset Links JSON** panel at
the bottom prints the exact snippet. Use that, not the "Upload key certificate"
fingerprint further up the same page — they're different keys and mixing them up
is the usual cause of a stubborn URL bar.

Vercel serves `/.well-known/` as a static file, ahead of the catch-all SPA
rewrite in `client/vercel.json` — verified 200 `application/json`.

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

⚠️ The seed uses **fixed dates** anchored to the week it was written
(programme start Mon 2026-06-29, captured Sat 2026-07-25). Re-running it much
later drifts — and on a **Sunday** the WOD tab is a full rest day, so
`01-wod-today.png` would come out empty. If you re-shoot, bump the `WEEKS`
Mondays in `store-seed.js` so "today" lands Mon–Sat.

## 5. Content rating
Fill the questionnaire (**Policy → App content → Content rating**). TacFit has no
objectionable content → it will come back **Everyone / PEGI 3**. Answer "No" to all
violence/sexual/drugs/gambling questions. Category: **Reference, News, or Educational**
or **Health & Fitness**.

## 6. Data safety form (**App content → Data safety**)

⚠️ Corrected 2026-07-26. Two earlier answers here were wrong — read the reasons,
they both cut toward *under*-declaring, which is what Google enforces against.

**"We don't collect any data" is not true for TacFit.** Requiring Google sign-in
means you receive an email address and name. Separately, the app syncs
bodyweight, 1RMs and every workout log to Supabase. So:

- **Does your app collect or share user data?** → **Yes**
- **Data types collected** (all *collected*, none *shared*, all stored not ephemeral):

| Category | Type | Purpose | Required? |
|---|---|---|---|
| Personal info | Email address | Account management, App functionality | **Required** |
| Personal info | Name | Account management | **Required** |
| Health and fitness | **Fitness info** (bodyweight, 1RMs, workout logs) | App functionality | **Required** |

- **Is data encrypted in transit?** → **Yes** (HTTPS + Supabase TLS)
- **Can users request deletion?** → **Yes** (email request; stated in the policy)
- **Advertising ID** → **No.** Verified: `app/src/main/AndroidManifest.xml`
  declares only `POST_NOTIFICATIONS`, there is no `AD_ID` permission, and there
  is no ad or analytics SDK. (This declaration also clears the "advertising ID"
  warning Play shows on the release page for `targetSdkVersion 35`.)

### The two corrections
1. **Email/name are REQUIRED, not optional.** A production build has no guest
   path — `dev_bypass` is gated behind `import.meta.env.DEV` and Vite compiles
   the branch out — so a user cannot reach any screen without signing in.
   Declaring collection "optional" would be false.
2. **Workout data is "Health and fitness → Fitness info", not just "App
   activity".** Bodyweight and training logs are a sensitive category with its
   own disclosure rules; filing them as generic user-generated content
   under-declares them.

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
- [x] **assetlinks.json updated with Google's Play-signing SHA-256** + redeployed.
- [ ] Installed from internal track → opens full-screen, no URL bar.
- [ ] Store listing, graphics, content rating, data safety all filled.
- [ ] Promote to Production.
