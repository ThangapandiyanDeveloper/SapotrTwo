# SAPOTR — landing page for SAPOTRs

Single-page site inviting people to become SAPOTRs (workers) on NZ’s
Last-Minute Staff Support Platform. Plain HTML, CSS and vanilla JavaScript — no
framework, no build step, no dependencies.

## Structure

    index.html      hero (5 banners), benefits, work types, safety, quotes,
                    growth, 3 steps, FAQ, CTA, footer · FAQPage + Organization JSON-LD
    styles.css      tokens, sections in page order, responsive, reduced motion
    script.js       hero carousel + Auckland map, reveals, count-up, tabs, FAQ
    assets/img/     web-ready crops and cut-outs made from "New Sapotr Images"

## Local preview

    python -m http.server 8000

Then open <http://localhost:8000>.

## How the hero works

- Five stacked banners, one cross-dissolve. Auto-advances (7–8 s per banner,
  11 s after a manual move); pauses on keyboard focus, drag, hovering the
  controls, when off screen, when the tab is hidden, or with the pause button.
- Swipe (touch or mouse drag), sideways trackpad scroll, arrows, dots, and
  ←/→/Home/End all navigate. With reduced motion there is no autoplay.
- Banner 1 is a drawn SVG of Auckland — no map API, no key. Pins sit on real
  suburbs; cards are placed around their pin only where they do not cover the
  copy, button or controls (`CARDS` / `PINS` in `script.js`).

## Assets

`assets/img/` is generated from the client’s `assets/New Sapotr Images`:
flat-background mascot shots were cut out to transparent WebP (cropped above
the shoes, which share the background colour), and the screenshot-style
banners were cropped to remove the carousel arrows baked into them.
WA0010 is unused because it shows a real hotel brand’s logo.

Events, Moving and Cleaning use Brand2’s earlier photos, as no new image
covers those categories.
