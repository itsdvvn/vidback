# PageSpeed Insights Report
**Report Date:** May 13, 2026, 12:26:40 PM
**URL:** https://vidback.yudhisetiawan.my.id/
**Device:** Desktop / Mobile (Emulated Moto G Power)

## Overall Scores
* **Performance:** 96
* **Accessibility:** 90
* **Best Practices:** 100
* **SEO:** 91

---

## Performance Metrics
* **First Contentful Paint (FCP):** 0.9 s
* **Speed Index (SI):** 3.2 s
* **Largest Contentful Paint (LCP):** 2.6 s
* **Total Blocking Time (TBT):** 10 ms
* **Cumulative Layout Shift (CLS):** 0

*Values are estimated and may vary. Captured at May 13, 2026, 12:26 PM GMT+7. Initial page load. Emulated Moto G Power with Lighthouse 13.0.1. Slow 4G throttling. Single page session.*

---

## Insights & Diagnostics

### Legacy JavaScript
**Est savings:** 14 KiB
Polyfills and transforms enable older browsers to use new JavaScript features. However, many aren't necessary for modern browsers. Consider modifying your JavaScript build process to not transpile Baseline features, unless you know you must support older browsers.

* `...chunks/04p6trxw0v781.js` (vidback.yudhisetiawan.my.id)
* **Wasted bytes:** 13.5 KiB

### Render Blocking Requests
**Est savings:** 120 ms
Requests are blocking the page's initial render, which may delay LCP. Deferring or inlining can move these network requests out of the critical path.

| URL | Transfer Size | Duration |
|---|---|---|
| `...chunks/166-fpyl0m9ac.css` | 12.2 KiB | 160 ms |

### Network Dependency Tree
Maximum critical path latency: 1,792 ms
* `https://vidback.yudhisetiawan.my.id` - 955 ms, 10.14 KiB
* `...chunks/166-fpyl0m9ac.css` - 1,792 ms, 12.19 KiB

### Use Efficient Cache Lifetimes
**Est savings:** 4 KiB
A long cache lifetime can speed up repeat visits to your page.

| Request | Cache TTL | Transfer Size |
|---|---|---|
| `/beacon.min.js...` (static.cloudflareinsights.com) | 1d | 11 KiB |

### LCP Breakdown

| Subpart | Duration |
|---|---|
| Time to first byte | 0 ms |
| Element render delay | 1,860 ms |

### Reduce Unused JavaScript
**Est savings:** 25.3 KiB
Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.

| URL | Transfer Size | Est Savings |
|---|---|---|
| `...chunks/04p6trxw0v781.js` | 69.3 KiB | 25.3 KiB |

### Avoid Non-composited Animations
**27 animated elements found.**
Animations which are not composited can be janky and increase CLS. 
(Various CSS properties flagged: `border-bottom-color`, `border-left-color`, `border-right-color`, `color`, `border-top-color`).

### Avoid Long Main-thread Tasks
**1 long task found.**
Lists the longest tasks on the main thread, useful for identifying worst contributors to input delay.

| URL | Duration |
|---|---|
| `...chunks/04p6trxw0v781.js` | 68 ms |

---

## Accessibility (Score: 90)

### Failing Audits
* **Buttons do not have an accessible name:** When a button doesn't have an accessible name, screen readers announce it as "button", making it unusable for users who rely on screen readers.
    * *Failing Elements:* Various `<button>` tags including toggle theme, log in, get started, etc.

### Passed Audits
* `[aria-*]` attributes match their roles
* Document has a `<title>` element
* `<html>` element has a `[lang]` attribute
* Links have a discernible name
* Lists contain only `<li>` elements and script supporting elements
* Touch targets have sufficient size and spacing
* Heading elements appear in a sequentially-descending order
* Document has a main landmark

---

## Best Practices & Trust and Safety (Score: 100)

* **Ensure CSP is effective against XSS attacks:** No CSP found in enforcement mode (Severity: High)
* **Use a strong HSTS policy:** No HSTS header found (Severity: High)
* **Ensure proper origin isolation with COOP:** No COOP header found (Severity: High)
* **Mitigate DOM-based XSS with Trusted Types:** No Content-Security-Policy header with Trusted Types directive found (Severity: High)
* **Uses HTTPS:** Passed.
* **Avoids deprecated APIs:** Passed.
* **Avoids third-party cookies:** Passed.
* **Avoids requesting the geolocation permission on page load:** Passed.
* **Avoids requesting the notification permission on page load:** Passed.
* **Displays images with correct aspect ratio:** Passed.
* **Serves images with appropriate resolution:** Passed.
* **Page has the HTML doctype:** Passed.
