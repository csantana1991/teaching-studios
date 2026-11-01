(function () {
  var mods = [];
  function clean(s) {
    return String(s || "").replace(/\s+/g, " ").replace(/[<>"]/g, "").trim();
  }
  function catalog() {
    var frame = document.getElementById("medCatalogFrame");
    if (!frame) {
      frame = document.createElement("iframe");
      frame.id = "medCatalogFrame";
      frame.title = "Med-b catalog";
      frame.src = "/med";
      frame.setAttribute("style", "position:absolute;left:-9999px;width:800px;height:600px;border:0");
      document.body.appendChild(frame);
    }
    return frame;
  }
  function harvest() {
    if (mods.length >= 333) return;
    var frame = catalog();
    var doc;
    try { doc = frame.contentDocument; } catch (e) { return; }
    if (!doc) return;
    var seen = {};
    mods.forEach(function (m) { seen[m.href] = 1; });
    Array.prototype.forEach.call(doc.querySelectorAll("a[href*='/course/']"), function (a) {
      if (mods.length >= 333) return;
      var href = a.getAttribute("href") || "";
      if (!href || seen[href] || href.indexOf("/course/") < 0) return;
      var card = a.closest("article, li, section, div");
      var heading = card && card.querySelector("h1, h2, h3");
      var title = clean(heading ? heading.textContent : a.textContent);
      if (title.length < 4 || /open specialty|workspace/i.test(title)) return;
      seen[href] = 1;
      mods.push({ href: href, title: title.slice(0, 160) });
    });
  }
  function paint() {
    if (!document.body.classList.contains("hj-full") || !mods.length) return;
    var frame = document.getElementById("hjFrame");
    if (!frame) return;
    var doc;
    try { doc = frame.contentDocument; } catch (e) { return; }
    if (!doc) return;
    var list = doc.querySelector("ul.divide-y");
    if (!list || list.querySelector("[data-medb='1']")) return;
    var base = list.querySelectorAll("li").length;
    mods.forEach(function (m, n) {
      var num = base + n + 1;
      var li = doc.createElement("li");
      li.setAttribute("data-medb", "1");
      var link = doc.createElement("a");
      link.href = m.href;
      link.className = "flex items-start justify-between gap-3 py-4";
      link.innerHTML = "<span class='min-w-0'><span class='block font-serif text-lg leading-snug text-cream'>" + m.title + "</span><span class='mt-1 block text-sm text-dim'>Med-b lecture</span><span class='mt-1 block text-sm text-muted'>Module " + num + "</span></span><span class='shrink-0 text-right'><span class='block font-serif text-lg text-muted'>Play</span></span>";
      link.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openLecture(doc, m, num);
      });
      li.appendChild(link);
      list.appendChild(li);
    });
    Array.prototype.forEach.call(doc.querySelectorAll("p"), function (p) {
      if (/^\d+\s+programs?$/.test((p.textContent || "").trim())) p.textContent = (base + mods.length) + " programs";
    });
  }
  function openLecture(doc, m, num) {
    var host = doc.getElementById("medbLecture");
    if (!host) {
      host = doc.createElement("section");
      host.id = "medbLecture";
      host.setAttribute("style", "position:fixed;inset:0;z-index:80;overflow:auto;background:#141a17;color:#f6f1e8;padding:18px 16px 28px");
      doc.body.appendChild(host);
    }
    host.innerHTML = "<button type='button' id='medbBack' style='background:none;border:0;color:#8fd0c8;font:600 14px sans-serif;padding:0'>Back to the 241</button><p style='margin:14px 0 0;letter-spacing:.14em;text-transform:uppercase;color:#e7a598;font-size:12px'>Module " + num + " · Med-b</p><h1 style='margin:8px 0 14px;font-family:serif;font-size:28px;line-height:1.2'>" + m.title + "</h1><div id='medbYt' style='max-width:960px'><p style='color:#b7c4bc'>Opening the lecture...</p></div>";
    host.querySelector("#medbBack").onclick = function () { host.remove(); };
    var player = document.getElementById("medPlayFrame");
    if (!player) {
      player = document.createElement("iframe");
      player.id = "medPlayFrame";
      player.title = "Med-b lecture";
      player.setAttribute("style", "position:absolute;left:-9999px;width:900px;height:700px;border:0");
      document.body.appendChild(player);
    }
    player.onload = function () {
      var tries = 0;
      var timer = setInterval(function () {
        tries += 1;
        var pdoc;
        try { pdoc = player.contentDocument; } catch (e) { return; }
        if (!pdoc) return;
        var link = null;
        Array.prototype.forEach.call(pdoc.querySelectorAll("a[href*='/course/']"), function (a) {
          if (!link && a.getAttribute("href") === m.href) link = a;
        });
        if (link) {
          clearInterval(timer);
          link.click();
          pullVideo(player, host, m);
        } else if (tries > 30) clearInterval(timer);
      }, 400);
    };
    player.src = "/med?open=" + encodeURIComponent(m.href);
    try { window.postMessage({ source: "hj-caption", cc: true, text: m.title }, location.origin); } catch (e) {}
  }
  function pullVideo(player, host, m) {
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      var pdoc;
      try { pdoc = player.contentDocument; } catch (e) { return; }
      if (!pdoc) return;
      var v = pdoc.querySelector("iframe[src*='youtube.com/embed'],iframe[src*='youtube-nocookie.com/embed']");
      if (!v && tries < 30) return;
      clearInterval(timer);
      var slot = host.querySelector("#medbYt");
      if (!slot) return;
      if (!v) {
        slot.innerHTML = "<p style='color:#b7c4bc'>The module is on the list. Go back and open it again if the video is still loading.</p>";
        return;
      }
      var src = v.getAttribute("src") || "";
      var id = (src.match(/embed\/([^?&/]+)/) || [])[1] || "";
      slot.innerHTML = "<iframe id='hj-yt' title='Lecture' src='" + src + "' allow='autoplay; encrypted-media; picture-in-picture' allowfullscreen style='width:100%;aspect-ratio:16/9;border:0;background:#000;border-radius:10px'></iframe>";
      try { window.postMessage({ source: "hj-caption", cc: true, videoId: id, text: m.title }, location.origin); } catch (e) {}
    }, 500);
  }
  setInterval(function () { harvest(); paint(); }, 1200);
})();
