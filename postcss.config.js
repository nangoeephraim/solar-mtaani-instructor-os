// PostCSS configuration for PRISM OS
// This project uses CDN Tailwind (via <script> tag in index.html) for utility classes.
// We explicitly define an EMPTY PostCSS plugins array to prevent Vite from
// auto-detecting any stale tailwindcss package in node_modules and trying to
// use it as a PostCSS plugin, which causes the build to fail.
export default {
  plugins: []
};
