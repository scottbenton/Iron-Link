// The heading offset now lives in the UI library, so the app and library
// share one context. This keeps the app's imports working until the
// migration's cleanup slice points them at "ui/components/HeadingOffset".
export * from "ui/components/HeadingOffset";
