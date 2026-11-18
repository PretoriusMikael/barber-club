/*!
 * Intelligent Enquiry System — embed loader.
 *
 *   <script src="https://YOUR-APP/widget.js" data-tenant="your-slug" async></script>
 *
 * Optional: data-position="left", data-label="Ask us", data-color="#0f766e".
 *
 * Everything runs in an iframe served by the app, so the host site's CSS and
 * JavaScript cannot break the widget, and the widget cannot touch the host page.
 * Plain ES2017, no dependencies: it has to run on any client website.
 */
(function () {
  "use strict";
  if (window.__enquiryWidgetLoaded) return;
  window.__enquiryWidgetLoaded = true;

  // currentScript is null when the tag was injected dynamically (Next <Script>, tag managers).
  var script = document.currentScript || document.querySelector('script[src*="widget.js"][data-tenant]');
  if (!script) return;
  var tenant = script.getAttribute("data-tenant");
  if (!tenant || !/^[a-z0-9][a-z0-9-]{2,47}$/.test(tenant)) return;

  var appOrigin = new URL(script.src, location.href).origin;
  var left = script.getAttribute("data-position") === "left";
  var label = script.getAttribute("data-label") || "Chat with us";
  var color = script.getAttribute("data-color") || "#111827";
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) color = "#111827";

  var side = left ? "left" : "right";
  var open = false;
  var iframe = null;

  var button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-haspopup", "dialog");
  button.setAttribute("aria-expanded", "false");
  button.style.cssText =
    "position:fixed;bottom:20px;" + side + ":20px;z-index:2147483000;padding:12px 18px;border:0;" +
    "border-radius:999px;background:" + color + ";color:#fff;font:600 15px system-ui,sans-serif;" +
    "box-shadow:0 6px 24px rgba(0,0,0,.18);cursor:pointer;";

  function frameStyle() {
    var small = window.matchMedia("(max-width: 480px)").matches;
    return small
      ? "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483001;background:#fff;"
      : "position:fixed;bottom:84px;" + side + ":20px;width:380px;height:min(620px,calc(100vh - 110px));" +
        "border:0;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.22);z-index:2147483001;background:#fff;";
  }

  function toggle(next) {
    open = typeof next === "boolean" ? next : !open;
    if (open && !iframe) {
      iframe = document.createElement("iframe");
      iframe.title = label;
      iframe.setAttribute("role", "dialog");
      iframe.src = appOrigin + "/embed/" + encodeURIComponent(tenant) + "?page=" + encodeURIComponent(location.href.slice(0, 500));
      document.body.appendChild(iframe);
    }
    if (iframe) iframe.style.cssText = frameStyle() + (open ? "" : "display:none;");
    button.setAttribute("aria-expanded", String(open));
    button.style.display = open && window.matchMedia("(max-width: 480px)").matches ? "none" : "";
  }

  button.addEventListener("click", function () { toggle(); });
  window.addEventListener("message", function (event) {
    if (event.origin !== appOrigin || !event.data || event.data.type !== "enquiry:close") return;
    toggle(false);
    button.focus();
  });
  window.addEventListener("resize", function () { if (iframe) iframe.style.cssText = frameStyle() + (open ? "" : "display:none;"); });

  if (document.body) document.body.appendChild(button);
  else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(button); });
})();
