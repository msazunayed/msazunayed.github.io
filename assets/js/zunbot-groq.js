/* When ZunBot's built-in answers don't cover a question, ask Groq (via your proxy). */
(function () {
  var PROXY_URL = "https://zunbot-groq.YOUR-SUBDOMAIN.workers.dev"; // <- set after deploying worker.js
  if (/YOUR-SUBDOMAIN/.test(PROXY_URL)) return; // inactive until configured
  var body = document.getElementById("zbBody"), input = document.getElementById("zbInput");
  if (!body || !input) return;
  var pending = null, history = [];

  function grab() { var v = (input.value || "").trim(); if (v) pending = v; }
  document.addEventListener("submit", function (e) { if (e.target && e.target.id === "zbForm") grab(); }, true);
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("#zbSend")) grab(); }, true);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") grab(); }, true);

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function render(t) {
    t = t.replace(/【[^】]*】/g, "");
    return esc(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>").replace(/(https?:\/\/[^\s<)]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function ask(node, q) {
    node.innerHTML = '<span class="zb-typing"><span></span><span></span><span></span></span>';
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 20000);
    fetch(PROXY_URL, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal,
      body: JSON.stringify({ question: q, history: history })
    }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        var a = (d.answer || "").trim(); if (!a) throw 0;
        node.innerHTML = render(a);
        history.push({ role: "user", content: q }, { role: "assistant", content: a });
        history = history.slice(-6);
      })
      .catch(function () { node.innerHTML = "Apologies, I’m having trouble reaching my live search right now. Please try again shortly, or email Shakil directly at msazunayed@gmail.com."; })
      .then(function () { clearTimeout(t); body.scrollTop = body.scrollHeight; });
  }

  new MutationObserver(function () {
    var bots = body.querySelectorAll(".zb-msg.bot"), last = bots[bots.length - 1];
    if (!last || last.__grq || !pending) return;
    if (last.textContent.indexOf("not sure about that one") === -1) return;
    last.__grq = 1;
    var q = pending; pending = null;
    ask(last, q);
  }).observe(body, { childList: true, subtree: true, characterData: true });
})();
