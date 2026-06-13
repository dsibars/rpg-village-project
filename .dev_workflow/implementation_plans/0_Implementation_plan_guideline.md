Check docs

- first add docs (specs changes)
- then detail engine changes
- then detail presentation changes

Consider:
- Clean code (keep project structure, and logic when splitting responsabilities)
- Special care to i18n. analyse the en.js language file to understand translation key names patterns
- More special care to i18n: ensure that new translation keys if needed are defined, and which one we can remove: Avoid "ghosting" any translation on english
- More special care to i18n: ensure all languages are managed
- try to use domain folder style instead of the generic one
- always plan tests in the implementation