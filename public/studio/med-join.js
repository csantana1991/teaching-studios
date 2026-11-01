(function () {
  var mods = [];
  var ready = false;
  function clean(s) {
    return String(s || "").replace(/\s+/g, " ").replace(/[<>"]/g, "").trim();
  }
  function load() {
    if (ready) return;
    Promise.all([
      fetch("/api/trpc/content.catalog").then(function (r) { return r.json(); }),
      fetch("/api/trpc/content.media").then(function (r) { return r.json(); })
    ]).then(function (pair) {
      var courses = (((pair[0] || {}).result || {}).data || {}).json;
      var media = (((pair[1] || {}).result || {}).data || {}).json;
      courses = courses && courses.courses || [];
      var lessons = media && media.lessons || [];
      var by = {};
      lessons.forEach(function (lesson) {
        (lesson.courseIds || []).forEach(function (id) {
          (by[id] = by[id] || []).push(lesson);
        });
      });
      mods = courses.filter(function (c) { return c && c.programId === "med" && c.title; }).slice(0, 333).map(function (c) {
        var lectures = (by[c.id] || []).filter(function (l) { return l && l.videoUrl; });
        return { id: c.id, title: clean(c.title), lectures: lectures };
      });
      ready = mods.length === 333;
    }).catch(function () {});
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
      link.href = "#med-" + m.id;
      link.className = "flex items-start justify-between gap-3 py-4";
      link.innerHTML = "<span class='min-w-0'><span class='block font-serif text-lg leading-snug text-cream'>" + m.title + "</span><span class='mt-1 block text-sm text-dim'>Med-b · " + m.id + "</span><span class='mt-1 block text-sm text-muted'>Module " + num + " · " + m.lectures.length + " lecture" + (m.lectures.length === 1 ? "" : "s") + "</span></span><span class='shrink-0 text-right'><span class='block font-serif text-lg text-muted'>Play</span></span>";
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
  function videoSrc(url) {
    if (!url) return "";
    if (url.indexOf("http") === 0) return url;
    return "https://noardstudiomannus.vercel.app" + (url.charAt(0) === "/" ? url : "/" + url);
  }
  function openLecture(doc, m, num) {
    var host = doc.getElementById("medbLecture");
    if (!host) {
      host = doc.createElement("section");
      host.id = "medbLecture";
      host.setAttribute("style", "position:fixed;inset:0;z-index:80;overflow:auto;background:#141a17;color:#f6f1e8;padding:18px 16px 40px");
      doc.body.appendChild(host);
    }
    var items = m.lectures.map(function (l, i) {
      return "<button type='button' data-i='" + i + "' style='display:block;width:100%;text-align:left;margin:0 0 8px;padding:10px 12px;border-radius:10px;border:1px solid #2a3a34;background:#1c2622;color:#f6f1e8'>" + (i + 1) + ". " + clean(l.title) + "</button>";
    }).join("");
    host.innerHTML = "<button type='button' id='medbBack' style='background:none;border:0;color:#8fd0c8;font:600 14px sans-serif;padding:0'>Back to the 241</button><p style='margin:14px 0 0;letter-spacing:.14em;text-transform:uppercase;color:#e7a598;font-size:12px'>Module " + num + " · " + m.id + "</p><h1 style='margin:8px 0 14px;font-family:serif;font-size:28px;line-height:1.2'>" + m.title + "</h1><div id='medbYt' style='max-width:960px'></div><div id='medbList' style='max-width:960px;margin-top:14px'>" + (items || "<p style='color:#b7c4bc'>No lecture video is in this module yet.</p>") + "</div>";
    host.querySelector("#medbBack").onclick = function () { host.remove(); };
    function play(i) {
      var lesson = m.lectures[i];
      var slot = host.querySelector("#medbYt");
      if (!slot || !lesson) return;
      slot.innerHTML = "<video id='hj-yt' controls autoplay playsinline src='" + videoSrc(lesson.videoUrl) + "' style='width:100%;aspect-ratio:16/9;background:#000;border-radius:10px'></video>";
      try { window.postMessage({ source: "hj-caption", cc: true, text: lesson.title || m.title }, location.origin); } catch (e) {}
    }
    Array.prototype.forEach.call(host.querySelectorAll("#medbList button"), function (btn) {
      btn.onclick = function () { play(Number(btn.getAttribute("data-i")) || 0); };
    });
    if (m.lectures.length) play(0);
    try { window.postMessage({ source: "hj-caption", cc: true, text: m.title }, location.origin); } catch (e) {}
  }
  load();
  setInterval(function () { load(); paint(); }, 1200);
})();
