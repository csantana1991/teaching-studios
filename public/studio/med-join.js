(function () {
  var mods = [];
  var ready = false;
  function harvest() { return mods; }
  function clean(s) {
    return String(s || "").replace(/\s+/g, " ").replace(/[<>"]/g, "").trim();
  }
  function load() {
    if (ready) return;
    fetch("/studio/med-lectures.json")
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows) || rows.length < 333) return;
        mods = rows;
        ready = true;
      })
      .catch(function () {});
  }
  function paint() {
    if (!document.body.classList.contains("hj-full") || mods.length < 333) return;
    var frame = document.getElementById("hjFrame");
    if (!frame) return;
    var doc;
    try { doc = frame.contentDocument; } catch (e) { return; }
    if (!doc) return;
    if (!doc.documentElement.getAttribute("data-medb-click")) {
      doc.documentElement.setAttribute("data-medb-click", "1");
      doc.addEventListener("click", function (ev) {
        var btn = ev.target && ev.target.closest && ev.target.closest("[data-medb-id]");
        if (!btn) return;
        ev.preventDefault();
        ev.stopPropagation();
        var id = btn.getAttribute("data-medb-id");
        var m = mods.filter(function (row) { return row.id === id; })[0];
        if (m) openLecture(doc, m, btn.getAttribute("data-num") || "");
      }, true);
    }
    var list = doc.querySelector("ul.divide-y");
    if (!list || list.querySelector("[data-medb='1']")) return;
    var base = list.querySelectorAll("li").length;
    mods.forEach(function (m, n) {
      var num = base + n + 1;
      var count = (m.lectures || []).length;
      var li = doc.createElement("li");
      li.setAttribute("data-medb", "1");
      var link = doc.createElement("button");
      link.type = "button";
      link.setAttribute("data-medb-id", m.id);
      link.setAttribute("data-num", String(num));
      link.setAttribute("style", "display:flex;width:100%;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 0;background:none;border:0;color:inherit;text-align:left;cursor:pointer");
      link.innerHTML = "<span class='min-w-0'><span class='block font-serif text-lg leading-snug text-cream'>" + clean(m.title) + "</span><span class='mt-1 block text-sm text-dim'>Med-b · " + m.id + "</span><span class='mt-1 block text-sm text-muted'>" + num + " · " + count + " lecture" + (count === 1 ? "" : "s") + "</span></span><span class='shrink-0 text-right'><span class='block font-serif text-lg text-muted'>Play</span></span>";
      li.appendChild(link);
      list.appendChild(li);
    });
    Array.prototype.forEach.call(doc.querySelectorAll("p"), function (p) {
      if (/^\d+\s+programs?$/.test((p.textContent || "").trim())) p.textContent = (base + mods.length) + " programs";
    });
  }
  function tell(lesson, courseTitle) {
    var line = clean(lesson.title) + " in " + clean(courseTitle);
    if (line.length < 48) line += ". Public lecture for this module.";
    var id = String(lesson.videoId || "");
    var msg = { source: "hj-caption", cc: true, text: line };
    if (/^[A-Za-z0-9_-]{6,15}$/.test(id)) msg.videoId = id;
    try { window.postMessage(msg, location.origin); } catch (e) {}
  }
  function openLecture(doc, m, num) {
    var host = doc.getElementById("medbLecture");
    if (!host) {
      host = doc.createElement("section");
      host.id = "medbLecture";
      doc.body.appendChild(host);
    }
    host.setAttribute("style", "position:fixed;top:0;left:0;bottom:0;right:min(420px,36vw);z-index:30;overflow:auto;background:#141a17;color:#f6f1e8;padding:16px 18px 32px;box-sizing:border-box");
    var lectures = m.lectures || [];
    var items = lectures.map(function (l, i) {
      return "<button type='button' data-i='" + i + "' style='display:block;width:100%;text-align:left;margin:0 0 8px;padding:10px 12px;border-radius:10px;border:1px solid #2a3a34;background:#1c2622;color:#f6f1e8'>" + (i + 1) + ". " + clean(l.title) + "</button>";
    }).join("");
    host.innerHTML = "<button type='button' id='medbBack' style='background:none;border:0;color:#8fd0c8;font:600 14px sans-serif;padding:0'>Back to the list</button><p style='margin:14px 0 0;letter-spacing:.14em;text-transform:uppercase;color:#e7a598;font-size:12px'>Module " + num + " · " + m.id + " · " + lectures.length + " lectures</p><h1 style='margin:8px 0 14px;font-family:serif;font-size:28px;line-height:1.2'>" + clean(m.title) + "</h1><div id='medbYt'></div><div id='medbList' style='margin-top:14px'>" + (items || "<p>No lecture file.</p>") + "</div>";
    host.querySelector("#medbBack").onclick = function () { host.remove(); };
    function play(i) {
      var lesson = lectures[i];
      var slot = host.querySelector("#medbYt");
      if (!slot || !lesson) return;
      var src = lesson.url || "";
      if (src.indexOf("youtube.com") >= 0 || src.indexOf("youtu.be") >= 0) {
        slot.innerHTML = "<iframe title='Lecture' src='https://www.youtube-nocookie.com/embed/" + lesson.videoId + "?rel=0' allow='autoplay; encrypted-media; picture-in-picture' allowfullscreen style='width:100%;aspect-ratio:16/9;border:0;background:#000;border-radius:10px'></iframe>";
      } else {
        slot.innerHTML = "<video controls autoplay playsinline src='" + src + "' style='width:100%;aspect-ratio:16/9;background:#000;border-radius:10px'></video>";
      }
      tell(lesson, m.title);
    }
    Array.prototype.forEach.call(host.querySelectorAll("#medbList button"), function (btn) {
      btn.onclick = function () { play(Number(btn.getAttribute("data-i")) || 0); };
    });
    if (lectures.length) play(0);
  }
  load();
  setInterval(function () { load(); paint(); }, 1200);
})();
