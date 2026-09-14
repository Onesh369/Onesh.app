# Onesh — Habits & Reading

Local habit tracker and reading shelf. Data stays in your browser.

```bash
npm install
npm run dev
```

Open http://localhost:5173/

- **Habits:** tap the circle to check a day. Calendar + Day / Week / Month / Year stats.
- **Reading:** title, author, year, pages, progress, rating, dates, format, genre, status.
- **Theme:** Auto follows morning (6:00–19:00) and night. Or lock Light / Night.

## Publish (website)

```bash
npm run build
```

Then deploy the `dist` folder:

- **Netlify:** drag `dist` onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the repo (build command `npm run build`, publish `dist`).
- **Vercel:** `npx vercel` from this folder, or import the repo at vercel.com.

The site is a PWA: on Android Chrome, use **Add to Home screen**.

## Android APK

1. Install [Android Studio](https://developer.android.com/studio).
2. Build and copy the web app into the Android project:

```bash
npm run android:sync
npm run android:open
```

3. In Android Studio: **Build → Build APK(s)** (or **Generate Signed App Bundle / APK** for Play Store).

The debug APK is usually at `android/app/build/outputs/apk/debug/app-debug.apk`.

Without Android Studio: publish the website first, then generate an APK at [pwabuilder.com](https://www.pwabuilder.com) from the live URL.
