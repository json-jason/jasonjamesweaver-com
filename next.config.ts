import type { NextConfig } from "next";

// Response headers for every page. This site is a folder of pre-built static
// files with no form, no login, no database and no server code, so none of
// these are load-bearing - they close off browser-level tricks rather than
// server ones. They cost nothing and a visitor who checks should find them.
const securityHeaders = [
  // Only load things this site actually serves.
  //
  // `unsafe-inline` is on scripts as well as styles, and that is a real
  // weakening worth being honest about: it is what makes a CSP stop most XSS,
  // and with it on, this policy does not. It is here because the framework
  // boots from an inline script (it sets `self.__next_r`); without it React
  // never hydrates and the village map renders as an empty frame. The
  // alternative - a per-request nonce - needs middleware, which would turn
  // this fully static site into a server-rendered one and reintroduce exactly
  // the component the recent critical advisory was about. Not worth it for a
  // site with no form, no login and no user input to inject through.
  //
  // The rest of the policy still earns its place: nothing can frame this site,
  // nothing can post a form from it, no plugins, and no <base> rewrite.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // Trust the declared content type. Stops a browser deciding a .webp is
  // really something executable.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Belt and braces with frame-ancestors above, for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the page address to other sites, but never the query string.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site asks for none of these, so refuse them on its behalf.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
