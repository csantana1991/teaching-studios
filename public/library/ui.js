/* Verified image library. Counts come from /library/status.json. No placeholders. */
(function () {
  if (window.__imageLibraryMounted) return
  window.__imageLibraryMounted = true

  var css = document.createElement('style')
  css.textContent = [
    '#imgLibBar{position:fixed;left:0;right:0;bottom:0;width:100%;max-width:none;z-index:640;display:flex;gap:8px;align-items:center;box-sizing:border-box;background:#fff;padding:8px 12px 10px;border-top:1px solid #e5e7eb}',
    '#imgLibOpen{border:1px solid #1e3a8a;background:#1e3a8a;color:#fff;font:700 12px/1.2 system-ui,sans-serif;padding:8px 10px;border-radius:8px;cursor:pointer;flex:0 0 auto}',
    '#imgLibCount{display:flex;gap:4px;align-items:center;overflow-x:auto;flex:1 1 auto;max-width:none;min-height:52px;background:#fff;color:#111;border:0;border-radius:8px;padding:4px;font:600 11px/1.3 system-ui,sans-serif}',
    '#imgLibCount img{height:44px;width:62px;object-fit:cover;border-radius:4px;flex:0 0 auto;background:#e5e7eb}',
    '#imgLibPause{border:1px solid #1e3a8a;background:#1e3a8a;color:#fff;font:700 12px/1 system-ui,sans-serif;height:46px;padding:0 10px;border-radius:8px;cursor:pointer;flex:0 0 auto}',
    '#imgLibPrev:disabled,#imgLibNext:disabled{opacity:.35;cursor:default}',
    '#imgLibSheet{position:fixed;inset:0;z-index:70;background:#0b1220;color:#fff;display:none;flex-direction:column}',
    '#imgLibSheet.on{display:flex}',
    '#imgLibSheet header{display:flex;gap:8px;align-items:center;padding:10px;border-bottom:1px solid #334155}',
    '#imgLibSheet h2{margin:0;font:700 16px system-ui,sans-serif;flex:1}',
    '#imgLibSheet button,#imgLibSheet input,#imgLibSheet select{font:600 13px system-ui,sans-serif}',
    '#imgLibClose{border:1px solid #93c5fd;background:#1e3a8a;color:#fff;border-radius:8px;padding:8px 10px;cursor:pointer}',
    '#imgLibBody{overflow:auto;padding:10px 12px 28px;-webkit-overflow-scrolling:touch}',
    '#imgLibBody p{font:14px/1.45 system-ui,sans-serif;color:#e2e8f0}',
    '#imgLibStats{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}',
    '#imgLibStats span{border:1px solid #334155;border-radius:8px;padding:6px 8px;font:700 12px system-ui,sans-serif}',
    '#imgLibTable{width:100%;border-collapse:collapse;font:12px/1.35 system-ui,sans-serif}',
    '#imgLibTable th,#imgLibTable td{border-bottom:1px solid #1e293b;text-align:left;padding:6px 4px;vertical-align:top}',
    '#imgLibFind{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}',
    '#imgLibFind input,#imgLibFind select{background:#0f172a;color:#fff;border:1px solid #475569;border-radius:8px;padding:8px}',
    '#imgLibFind input{flex:1;min-width:140px}',
    '.imgCard{display:grid;grid-template-columns:96px 1fr;gap:8px;border:1px solid #334155;border-radius:10px;padding:8px;margin:8px 0}',
    '.imgCard img{width:96px;height:96px;object-fit:cover;background:#111;border-radius:6px}',
    '.imgCard b{font-size:13px}',
    '.imgCard small{display:block;color:#cbd5e1;margin-top:3px}',
    '#imgLibOffered{overflow-x:auto}',
    '#imgLibOffered td{vertical-align:top;white-space:normal;min-width:120px}',
    '.readCard{border:1px solid #334155;border-radius:10px;padding:10px;margin:10px 0;background:#0f172a}',
    '.readCard img{width:100%;max-height:280px;object-fit:contain;background:#000;border-radius:8px}',
    '.readCard h4{margin:8px 0 4px;font:700 16px system-ui,sans-serif;color:#fff}',
    '.readCard p{margin:0 0 6px;color:#fff}',
  ].join('')
  document.head.appendChild(css)

  var bar = document.createElement('div')
  bar.id = 'imgLibBar'
  bar.innerHTML = '<button type="button" id="imgLibOpen">Image library</button><span id="imgLibCount">Checking verified images…</span><button type="button" id="imgLibPause" hidden>Pause</button><button type="button" id="imgLibPrev" hidden aria-label="Previous 18 images">‹</button><button type="button" id="imgLibNext" hidden aria-label="Next 18 images">›</button>'
  var sheet = document.createElement('div')
  sheet.id = 'imgLibSheet'
  sheet.setAttribute('role', 'dialog')
  sheet.setAttribute('aria-label', 'Verified image library')
  sheet.innerHTML = [
    '<header><h2>Verified image library</h2><button type="button" id="imgLibClose">Close</button></header>',
    '<div id="imgLibBody"><p>Loading the ledger…</p></div>',
  ].join('')
  document.body.appendChild(bar)
  document.body.appendChild(sheet)

  var status = null
  var records = null
  var recordsError = ''

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' }[c]
    })
  }

  function paintCount() {
    var el = document.getElementById('imgLibCount')
    if (!el || el.querySelector('img')) return
    if (!status) {
      el.textContent = 'Image ledger unavailable'
      return
    }
    el.textContent =
      status.usableImages.toLocaleString() +
      ' verified images · target 33,000 not met · ' +
      (status.counts.series || 0).toLocaleString() +
      ' DICOM series not counted as images'
  }

  function sourceRows() {
    return (status.sources || [])
      .map(function (s) {
        return (
          '<tr><td><a href="' + esc(s.href) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></td>' +
          '<td>' + esc(s.usable) + '</td><td>' + esc(s.imported) + '</td><td>' + esc(s.restricted) + '</td>' +
          '<td>' + esc(s.failed) + '</td><td>' + esc(s.pending) + '</td><td>' + esc(s.duplicate) + '</td>' +
          '<td>' + esc(s.skipped) + '</td><td>' + esc(s.note) + ' ' + esc(s.licenseSummary) + '</td></tr>'
        )
      })
      .join('')
  }

  function paintSheet() {
    var body = document.getElementById('imgLibBody')
    if (!status) {
      body.innerHTML = '<p>The ledger did not load. Nothing was counted as a verified image.</p>'
      return
    }
    var t = status.totals || {}
    body.innerHTML = [
      '<p><b>' + esc(status.usableImages) + '</b> unique images can be shown. The 33,000 figure is not an image count. Gap: <b>' + esc(status.gap) + '</b>. ' + esc(status.gapReason) + '</p>',
      '<div id="imgLibStats">',
      '<span>Imported ' + esc(t.imported) + '</span>',
      '<span>Usable ' + esc(t.usable) + '</span>',
      '<span>Restricted ' + esc(t.restricted) + '</span>',
      '<span>Failed ' + esc(t.failed) + '</span>',
      '<span>Pending ' + esc(t.pending) + '</span>',
      '<span>Duplicate ' + esc(t.duplicate) + '</span>',
      '<span>Skipped ' + esc(t.skipped) + '</span>',
      '<span>Series ' + esc(status.counts.series) + '</span>',
      '<span>Frames not counted ' + esc(status.counts.framesNotCounted) + '</span>',
      '</div>',
      '<p>A series is one record. Its frames are not extra cases. A result is a case image only when you open it from a matching case. These rows are published references or dataset series, not the teaching-row patient.</p>',
      '<table id="imgLibTable"><thead><tr><th>Source</th><th>Usable</th><th>Imported</th><th>Restricted</th><th>Failed</th><th>Pending</th><th>Duplicate</th><th>Skipped</th><th>Access and license</th></tr></thead><tbody>',
      sourceRows(),
      '</tbody></table>',
      '<h3 style="font:700 15px system-ui,sans-serif;margin:16px 0 6px">Sources from your list</h3>',
      '<p>These links were checked. A download page is not the same as an image this app is allowed to show. None of the counts below were added to the verified total.</p>',
      '<div id="imgLibOffered"><p>Loading source list…</p></div>',
      '<div id="imgLibFind">',
      '<input id="imgLibQ" type="search" placeholder="Search the verified ledger" aria-label="Search the indexed library">',
      '<select id="imgLibKind" aria-label="Record kind"><option value="">All kinds</option><option value="image" selected>Images</option><option value="series">Series</option><option value="collection">Collections</option></select>',
      '<select id="imgLibMod" aria-label="Modality"><option value="">All modalities</option><option>CT</option><option>PT</option><option>DX</option><option>MR</option><option>NM</option></select>',
      '</div>',
      '<div id="imgLibHits"><p>' + (recordsError || 'Ledger search loads when you type.') + '</p></div>',
      '<h3 style="font:700 15px system-ui,sans-serif;margin:16px 0 6px">How to read an X-ray or CT</h3>',
      '<p>Each lesson uses one licensed image already in this library. The Google link searches that same diagnosis. Google does not allow those pictures to be copied into this app, so the search opens in a new tab.</p>',
      '<div id="imgLibRead"><p>Loading reading lessons…</p></div>',
      '<h3 style="font:700 15px system-ui,sans-serif;margin:16px 0 6px">Live search</h3>',
      '<p>Queries Open-i, Europe PMC, Wikimedia Commons, and the TCIA collection catalogue. Other sources are checked for reachability only. Nothing here is added to the verified count.</p>',
      '<div id="imgLibFind">',
      '<input id="imgLibLiveQ" type="search" placeholder="MUGA, Paget bone scan…" aria-label="Live search">',
      '<button type="button" id="imgLibLiveGo">Search</button>',
      '<button type="button" id="imgLibHealth">Check sources</button>',
      '</div>',
      '<p id="imgLibLiveStat">Idle</p>',
      '<div id="imgLibLiveHits"></div>',
      '<div id="imgLibHealthOut"></div>',
    ].join('')
    var q = document.getElementById('imgLibQ')
    var kind = document.getElementById('imgLibKind')
    var mod = document.getElementById('imgLibMod')
    function go() { runSearch(q.value, kind.value, mod.value) }
    q.addEventListener('input', go)
    kind.addEventListener('change', go)
    mod.addEventListener('change', go)
    runSearch('', 'image', '')
    var live = document.getElementById('imgLibLiveQ')
    var liveGo = document.getElementById('imgLibLiveGo')
    var health = document.getElementById('imgLibHealth')
    function runLive() { liveSearch(live.value) }
    liveGo.addEventListener('click', runLive)
    live.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') runLive() })
    health.addEventListener('click', checkHealth)
    paintReads()
    paintOffered()
  }

  function displaySrc(url) {
    if (/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(url)) return '/api/pmc/img?src=' + encodeURIComponent(url)
    return url
  }

  function paintOffered() {
    var box = document.getElementById('imgLibOffered')
    if (!box) return
    fetch('/library/offered-sources.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(function (rows) {
        var group = ''
        box.innerHTML = '<table><thead><tr><th>Source</th><th>What it is</th><th>In this app</th><th>Why</th></tr></thead><tbody>' +
          rows.map(function (row) {
            var head = row.group === group ? '' : (group = row.group, '<tr><td colspan="4"><b>' + esc(row.group) + '</b></td></tr>')
            return head + '<tr><td><a href="' + esc(row.href) + '" target="_blank" rel="noopener">' + esc(row.name) + '</a></td>' +
              '<td>' + esc(row.statedSize) + '</td><td>' + esc(row.access) + '</td><td>' + esc(row.why) + '</td></tr>'
          }).join('') + '</tbody></table>'
      })
      .catch(function (err) {
        box.innerHTML = '<p>The source list did not load (' + esc(err.message) + ').</p>'
      })
  }

  function paintReads() {
    var box = document.getElementById('imgLibRead')
    if (!box) return
    fetch('/library/read-lessons.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(function (lessons) {
        if (!Array.isArray(lessons) || !lessons.length) {
          box.innerHTML = '<p>No reading lessons are in the catalog.</p>'
          return
        }
        box.innerHTML = lessons.map(function (lesson) {
          var q = encodeURIComponent(lesson.query || lesson.label || 'radiology')
          return (
            '<article class="readCard">' +
            '<img alt="" src="' + esc(displaySrc(lesson.imageUrl)) + '">' +
            '<h4>' + esc(lesson.label) + '</h4>' +
            '<p>' + esc(lesson.how) + '</p>' +
            '<p><small>' + esc(lesson.license) + ' · ' + esc(lesson.title) + '</small></p>' +
            '<p><a href="' + esc(lesson.pageUrl) + '" target="_blank" rel="noopener">Open the source file</a>' +
            ' · <a href="https://www.google.com/search?tbm=isch&q=' + q + '" target="_blank" rel="noopener">Google Images: ' + esc(lesson.query) + '</a></p>' +
            '</article>'
          )
        }).join('')
      })
      .catch(function (err) {
        box.innerHTML = '<p>Reading lessons did not load (' + esc(err.message) + ').</p>'
      })
  }

  function hitCard(r) {
    var src = String(r.imageUrl || '')
    var img = r.loadStatus === 'verified' && (src.indexOf('https://') === 0 || src.indexOf('/library/') === 0)
      ? '<img alt="" src="' + esc(displaySrc(src)) + '">'
      : '<div style="width:96px;height:96px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;font-size:11px;text-align:center;padding:4px">No web image</div>'
    var role = r.kind === 'image' ? 'Published reference' : r.kind === 'series' ? 'DICOM series, not a case' : 'Collection'
    return (
      '<article class="imgCard">' + img + '<div><b>' + esc(r.title) + '</b>' +
      '<small>' + esc(role) + ' · ' + esc(r.kind) + (r.modality ? ' · ' + esc(r.modality) : '') +
      (r.bodyRegion ? ' · ' + esc(r.bodyRegion) : '') +
      (r.frameCount ? ' · ' + esc(r.frameCount) + ' frames (not counted as images)' : '') + '</small>' +
      '<small>' + esc(r.license) + '</small>' +
      '<small>' + esc(r.attribution) + '</small>' +
      '<small>Load: ' + esc(r.loadStatus) + ' · Use: ' + esc(r.permittedUse) + '</small>' +
      (r.diagnosis ? '<small>Source diagnosis: ' + esc(r.diagnosis) + '</small>' : '') +
      '<small><a href="' + esc(r.pageUrl) + '" target="_blank" rel="noopener">Open source</a>' +
      ' · <a href="https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(String(r.title || 'radiology') + ' radiology') + '" target="_blank" rel="noopener">Google Images for this finding</a></small></div></article>'
    )
  }

  function liveCard(hit) {
    var img = hit.permittedUse === 'display' && hit.imageUrl
      ? '<img alt="" src="' + esc(hit.imageUrl) + '">'
      : '<div style="width:96px;height:96px;display:flex;align-items:center;justify-content:center;background:#111;border-radius:6px;font-size:11px;text-align:center;padding:4px">Link only</div>'
    return (
      '<article class="imgCard">' + img + '<div><b>' + esc(hit.title) + '</b>' +
      '<small>' + esc(hit.sourceName || hit.source) + ' · ' + esc(hit.kind) + ' · ' + esc(hit.permittedUse) + '</small>' +
      '<small>' + esc(hit.license || 'license not stated') + '</small>' +
      '<small>' + esc(hit.licenseNote) + '</small>' +
      '<small>' + esc(hit.attribution) + '</small>' +
      '<small><a href="' + esc(hit.pageUrl) + '" target="_blank" rel="noopener">Open source</a></small></div></article>'
    )
  }

  var liveTimer = 0
  function liveSearch(query) {
    var stat = document.getElementById('imgLibLiveStat')
    var box = document.getElementById('imgLibLiveHits')
    if (!stat || !box) return
    var q = String(query || '').trim()
    if (q.length < 3) {
      stat.textContent = 'Type at least 3 characters. Nothing was sent.'
      box.innerHTML = ''
      return
    }
    stat.textContent = 'Searching'
    box.innerHTML = ''
    var ctrl = new AbortController()
    clearTimeout(liveTimer)
    liveTimer = setTimeout(function () { ctrl.abort() }, 15000)
    fetch('/api/library/search?q=' + encodeURIComponent(q), { signal: ctrl.signal })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(function (data) {
        clearTimeout(liveTimer)
        var sources = (data.sources || []).map(function (s) { return s.name + ' · ' + s.state }).join(' · ')
        var hits = data.results || []
        if (!hits.length) {
          stat.textContent = (data.state || 'empty') + ' · no results · not still searching'
          box.innerHTML = '<p>' + esc(sources) + '</p><p>' + esc(data.note || '') + '</p>'
          return
        }
        stat.textContent = (data.state || 'ok') + ' · ' + hits.length + ' shown · ' +
          ((data.counts && data.counts.displayableImages) || 0) + ' displayable · ' +
          ((data.counts && data.counts.linkOnly) || 0) + ' link-only · ' +
          ((data.counts && data.counts.duplicatesDropped) || 0) + ' duplicates dropped'
        box.innerHTML = '<p>' + esc(sources) + '</p><p>' + esc(data.note || '') + '</p>' + hits.map(liveCard).join('')
      })
      .catch(function (err) {
        clearTimeout(liveTimer)
        var timed = err && err.name === 'AbortError'
        stat.textContent = timed ? 'Timed out · not still searching' : 'Unavailable · not still searching'
        box.innerHTML = '<p>' + esc(timed ? 'The search timed out.' : (err && err.message) || 'Search failed.') + '</p>'
      })
  }

  function checkHealth() {
    var out = document.getElementById('imgLibHealthOut')
    var stat = document.getElementById('imgLibLiveStat')
    if (stat) stat.textContent = 'Checking sources'
    if (out) out.innerHTML = '<p>Checking…</p>'
    var ctrl = new AbortController()
    var timer = setTimeout(function () { ctrl.abort() }, 20000)
    fetch('/api/library/health', { signal: ctrl.signal })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(function (data) {
        clearTimeout(timer)
        if (stat) stat.textContent = 'Source check finished'
        var rows = (data.sources || []).map(function (s) {
          var label = s.state === 'ok' && s.search === 'api' ? 'search API responded' : s.state
          return '<tr><td>' + esc(s.name) + '</td><td>' + esc(label) + '</td><td>' + esc(s.latencyMs) + ' ms</td><td>' + esc(s.message) + '</td></tr>'
        }).join('')
        if (out) out.innerHTML = '<p>Checked ' + esc(data.checkedAt) + '. A page response is not a working search.</p><table id="imgLibTable"><thead><tr><th>Source</th><th>Result</th><th>Time</th><th>Note</th></tr></thead><tbody>' + rows + '</tbody></table>'
      })
      .catch(function (err) {
        clearTimeout(timer)
        if (stat) stat.textContent = err && err.name === 'AbortError' ? 'Source check timed out' : 'Source check failed'
        if (out) out.innerHTML = '<p>' + esc((err && err.message) || 'failed') + '</p>'
      })
  }

  function runSearch(query, kind, modality) {
    var box = document.getElementById('imgLibHits')
    if (!box) return
    if (!records) {
      box.innerHTML = '<p>Loading records…</p>'
      fetch('/library/records.json')
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
        .then(function (data) {
          records = Array.isArray(data) ? data : []
          runSearch(query, kind, modality)
        })
        .catch(function (err) {
          recordsError = 'Records did not load (' + err.message + ').'
          box.innerHTML = '<p>' + esc(recordsError) + '</p>'
        })
      return
    }
    var words = query.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1 })
    var hits = records.filter(function (r) {
      if (kind && r.kind !== kind) return false
      if (modality && r.modality !== modality) return false
      if (!words.length) return true
      var hay = [r.title, r.caption, r.diagnosis, r.modality, r.bodyRegion, r.attribution, r.license, r.source].join(' ').toLowerCase()
      return words.every(function (w) { return hay.indexOf(w) !== -1 })
    })
    hits.sort(function (a, b) {
      return (a.kind === 'image' ? 0 : 1) - (b.kind === 'image' ? 0 : 1)
    })
    var cap = kind === 'image' && !words.length ? 220 : 40
    var shown = hits.slice(0, cap)
    if (!shown.length) {
      box.innerHTML = '<p>No indexed record matches. The search is not still loading.</p>'
      return
    }
    box.innerHTML = '<p>' + shown.length + (hits.length > shown.length ? '+' : '') + ' shown of ' + hits.length + '. Not the same as a case match.</p>' + shown.map(hitCard).join('')
  }

  function lectureWords() {
    var said = document.getElementById('hjSaid')
    var ra = document.getElementById('raQ')
    var raw = (said && said.value) || (ra && ra.value) || ''
    if (!raw) {
      try { raw = new URLSearchParams(location.search).get('q') || '' } catch (e) {}
    }
    if (!raw) {
      var heads = document.querySelectorAll('h1,h2,h3')
      for (var i = 0; i < heads.length; i++) {
        var s = (heads[i].textContent || '').replace(/\s+/g, ' ').trim()
        if (s.length > 3 && s.length < 80) { raw = s; break }
      }
    }
    return raw.toLowerCase()
  }

  function rankKeys(words) {
    if (/ecg|ekg|electrocardiog|heart rate|qrs|rhythm/.test(words)) return ['electrocardiog', 'ecg', 'ekg', 'qrs', 'rhythm', 'heart rate', 'cardiac', 'tracing']
    if (/heart|cardiac|coronary/.test(words)) return ['heart', 'cardiac', 'coronary', 'myocard']
    if (/lung|chest|pulmon/.test(words)) return ['lung', 'chest', 'pulmon']
    if (/endometri|spleen|abdomen|pelvis|liver|hepatic|pancrea/.test(words)) return ['abdomen', 'pelvis', 'spleen', 'liver', 'kidney', 'pancrea']
    if (/brain|stroke|neuro/.test(words)) return ['brain', 'head', 'stroke', 'cerebr']
    return words.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) {
      return w.length > 3 && !/clinical|medicine|ninja|nerd|lecture|interpretation|introduction|image|library/.test(w)
    }).slice(0, 4)
  }

  function paintInline(rows) {
    var el = document.getElementById('imgLibCount')
    if (!el) return
    function rowReady(host) {
      if (!host) return false
      var imgs = host.querySelectorAll('img')
      if (!imgs.length) return false
      var loaded = 0
      imgs.forEach(function (img) { if (img.complete && img.naturalWidth > 0) loaded++ })
      var wide = imgs[0].getBoundingClientRect().width || 210
      var fit = Math.max(1, Math.floor(host.clientWidth / wide))
      return loaded >= fit && imgs.length > fit
    }
    var words = lectureWords()
    var medbHold = document.body.classList.contains('medb-full') || document.body.classList.contains('hj-full')
    var nowRank = Date.now()
    if (document.body.classList.contains('hj-full') && window.__imgLibWords && !rowReady(el)) words = window.__imgLibWords
    if (words !== window.__imgLibWords) {
      if (medbHold && window.__imgLibPicked && window.__imgLibPicked.length && nowRank - (window.__imgLibRanked || 0) < 20000) {
        words = window.__imgLibWords
      } else {
        window.__imgLibWords = words
        window.__imgLibPage = 0
        window.__imgLibRanked = nowRank
      }
    }
    var keys = rankKeys(words)
    var picked = (rows || []).map(function (r) {
      var src = String(r.imageUrl || '')
      if (!src || (r.loadStatus && r.loadStatus !== 'verified')) return null
      var hay = [r.title, r.caption, r.diagnosis, r.bodyRegion, r.modality, src].join(' ').toLowerCase()
      if (/calendar|factory|icon|logo|screenshot|keyboard/.test(hay)) return null
      var score = 0
      keys.forEach(function (k) { if (k && hay.indexOf(k) >= 0) score += /electrocardiog|qrs|rhythm|heart rate|^ecg$|^ekg$/.test(k) ? 8 : 3 })
      return score > 0 ? { row: r, score: score } : null
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score }).map(function (x) { return x.row })
    if (!picked.length) {
      picked = (rows || []).filter(function (r) {
        var hay = [r.title, r.caption, r.imageUrl].join(' ').toLowerCase()
        return r.imageUrl && !/calendar|factory|icon|logo/.test(hay)
      })
    }
    window.__imgLibPicked = picked
    var page = window.__imgLibPage || 0
    var pages = Math.max(1, Math.ceil(picked.length / 18))
    if (page >= pages) page = 0
    window.__imgLibPage = page
    var start = page * 18
    el.innerHTML = ''
    picked.slice(start, start + 18).forEach(function (r) {
      var img = document.createElement('img')
      img.alt = r.title || r.caption || 'Verified image'
      img.src = displaySrc(r.imageUrl)
      img.style.cursor = 'pointer'
      img.onclick = function (ev) {
        if (!document.body.classList.contains('medb-full')) return
        if (ev) { ev.preventDefault(); ev.stopPropagation() }
      }
      el.appendChild(img)
    })
    var pause = document.getElementById('imgLibPause')
    if (pause) {
      pause.hidden = picked.length <= 18
      if (document.body.classList.contains('hj-full')) pause.textContent = 'More images'
    }
    if (!el.children.length) el.textContent = 'No verified images for this lecture'
    if (!window.__imgLibTimer) {
      window.__imgLibTimer = setInterval(function () {
        if (document.body.classList.contains('hj-full')) return
        if (window.__imgLibPaused) return
        var list = window.__imgLibPicked || []
        var host = document.getElementById('imgLibCount')
        var hj = document.body.classList.contains('hj-full')
        if (hj && host) {
          var imgs = host.querySelectorAll('img')
          var loaded = 0
          imgs.forEach(function (img) { if (img.complete && img.naturalWidth > 0) loaded++ })
          var wide = imgs[0] ? (imgs[0].getBoundingClientRect().width || 210) : 210
          var fit = Math.max(1, Math.floor(host.clientWidth / wide))
          if (loaded < fit || list.length <= fit) return
        } else if (list.length <= 18) return
        var slow = document.body.classList.contains('medb-full') || hj
        var wait = document.body.classList.contains('medb-full') ? 22000 : (hj ? 30000 : (slow ? 16000 : 3500))
        var now = Date.now()
        if (now - (window.__imgLibFlipped || 0) < wait) return
        window.__imgLibFlipped = now
        var pages = Math.ceil(list.length / 18)
        window.__imgLibPage = ((window.__imgLibPage || 0) + 1) % pages
        var held = window.__imgLibWords
        window.__imgLibWords = held
        paintInline(window.__imgLibRows || [])
      }, 1000)
    }
  }

  function stepLib(dir) {
    window.__imgLibPage = (window.__imgLibPage || 0) + dir
    paintInline(window.__imgLibRows || [])
  }
  document.getElementById('imgLibPause').onclick = function (ev) {
    if (ev) ev.stopPropagation()
    if (document.body.classList.contains('hj-full')) {
      stepLib(1)
      this.textContent = 'More images'
      return
    }
    window.__imgLibPaused = !window.__imgLibPaused
    this.textContent = window.__imgLibPaused ? 'Play' : 'Pause'
  }

  function loadBest() {
    var file = window.__imgLibRows ? Promise.resolve(window.__imgLibRows) : fetch('/library/display-images.json').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
    return file.then(function (rows) {
      window.__imgLibRows = Array.isArray(rows) ? rows : []
      paintInline(window.__imgLibRows)
    })
  }
  document.getElementById('imgLibOpen').onclick = function (ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation() }
    var el = document.getElementById('imgLibCount')
    if (el) el.textContent = 'Loading images…'
    window.__imgLibPage = 0
    window.__imgLibWords = ''
    loadBest().catch(function () {
      if (el) el.textContent = 'Images did not load'
    })
  }
  setTimeout(function () { loadBest().catch(function () {}) }, 600)
  document.getElementById('imgLibClose').onclick = function () {
    sheet.classList.remove('on')
  }

  fetch('/library/status.json')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
    .then(function (data) { status = data; paintCount() })
    .catch(function () { paintCount() })
})()
