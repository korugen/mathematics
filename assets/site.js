/* 解法の地図 — 共通スクリプト
 * ・ヘッダー/ナビ/目次/前後リンクの自動生成
 * ・KaTeX による数式描画
 * ・パターンごとの自己判定と、間隔をあけた復習（ブラウザ内保存）
 * ・難易度フィルタ、ダッシュボード、復習リスト、検索、パターン判定ドリル
 */
(function () {
  "use strict";

  // ---- 単元一覧（ここが全ページ共通のマスターデータ） ----
  var UNITS = [
    { id: "m1-numbers",   subj: "数学I",   title: "数と式",               handai: 1, desc: "展開・因数分解・絶対値・平方根の扱い" },
    { id: "m1-logic",     subj: "数学I",   title: "集合と命題",           handai: 2, desc: "必要十分・対偶・背理法・「すべて/ある」" },
    { id: "m1-quadratic", subj: "数学I",   title: "2次関数",              handai: 2, desc: "最大最小・解の配置・文字定数の処理" },
    { id: "m1-trig",      subj: "数学I",   title: "図形と計量",           handai: 2, desc: "正弦定理・余弦定理・面積・空間図形" },
    { id: "m1-data",      subj: "数学I",   title: "データの分析",         handai: 1, desc: "平均・分散・相関係数・変量変換" },
    { id: "ma-counting",  subj: "数学A",   title: "場合の数",             handai: 2, desc: "和と積・順列組合せ・重複・漸化式で数える" },
    { id: "ma-probability", subj: "数学A", title: "確率",                 handai: 3, desc: "余事象・独立反復・条件付き確率・確率漸化式" },
    { id: "ma-geometry",  subj: "数学A",   title: "図形の性質",           handai: 1, desc: "チェバ・メネラウス・方べき・五心" },
    { id: "ma-integer",   subj: "数学A",   title: "整数の性質",           handai: 3, desc: "約数倍数・ユークリッド互除法・合同式・不定方程式" },
    { id: "m2-proof",     subj: "数学II",  title: "式と証明",             handai: 2, desc: "恒等式・剰余の定理・不等式証明" },
    { id: "m2-complex-eq", subj: "数学II", title: "複素数と方程式",       handai: 2, desc: "解と係数の関係・剰余の定理・高次方程式" },
    { id: "m2-coord",     subj: "数学II",  title: "図形と方程式",         handai: 3, desc: "直線・円・軌跡・領域・通過領域" },
    { id: "m2-trig",      subj: "数学II",  title: "三角関数",             handai: 2, desc: "加法定理・合成・置き換え・方程式の解の個数" },
    { id: "m2-explog",    subj: "数学II",  title: "指数関数・対数関数",   handai: 2, desc: "置き換え・大小比較・桁数・最高位の数" },
    { id: "m2-calculus",  subj: "数学II",  title: "微分法・積分法（数II）", handai: 2, desc: "接線・増減・3次関数・面積・1/6公式" },
    { id: "mb-sequence",  subj: "数学B",   title: "数列",                 handai: 3, desc: "和の計算・漸化式・数学的帰納法" },
    { id: "mb-stats",     subj: "数学B",   title: "統計的な推測",         handai: 1, desc: "確率変数・二項分布・正規分布・推定と検定" },
    { id: "mc-vector",    subj: "数学C",   title: "ベクトル",             handai: 3, desc: "平面・空間ベクトル・内積・交点・平面の方程式" },
    { id: "mc-curves",    subj: "数学C",   title: "平面上の曲線",         handai: 2, desc: "2次曲線・媒介変数・極座標" },
    { id: "mc-complex",   subj: "数学C",   title: "複素数平面",           handai: 3, desc: "極形式・ド・モアブル・回転・軌跡" },
    { id: "m3-limit",     subj: "数学III", title: "極限",                 handai: 3, desc: "数列・関数の極限・はさみうち・連続性" },
    { id: "m3-diff",      subj: "数学III", title: "微分法とその応用",     handai: 3, desc: "導関数・グラフ・不等式証明・方程式の実数解" },
    { id: "m3-integral",  subj: "数学III", title: "積分法（計算）",       handai: 3, desc: "置換・部分積分・定積分の性質・漸化式" },
    { id: "m3-integral-app", subj: "数学III", title: "積分法の応用",     handai: 3, desc: "面積・体積・回転体・区分求積・積分と不等式" }
  ];
  var UNIT_BY_ID = {};
  UNITS.forEach(function (u) { UNIT_BY_ID[u.id] = u; });
  var SUBJECTS = ["数学I", "数学A", "数学II", "数学B", "数学C", "数学III"];
  var LEVELS = { "1": "基礎", "2": "標準", "3": "阪大" };
  // 解けたあとに次の復習までに空ける日数（1回目→3日後、2回目→7日後、3回目で習得）
  var OK_INTERVALS = [3, 7];
  var OK_TO_MASTER = 3;

  var body = document.body;
  var root = body.getAttribute("data-root") || "";
  var unitId = body.getAttribute("data-unit");

  // ---- 日付 ----
  function ymd(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  function today() { return ymd(new Date()); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function md(s) { var p = s.split("-"); return (+p[1]) + "/" + (+p[2]); }

  // ---- 保存（使えない環境でも壊れないように） ----
  var STORE_KEY = "kaiho-map-v2";
  var OLD_KEY = "kaiho-map-progress-v1";
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  function write(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* noop */ }
  }
  var store = read(STORE_KEY);
  if (!store || typeof store !== "object" || !store.p) {
    store = { p: {} };
    var old = read(OLD_KEY);   // 旧形式（習得チェックのみ）を引き継ぐ
    if (old && typeof old === "object") {
      Object.keys(old).forEach(function (u) {
        Object.keys(old[u] || {}).forEach(function (pid) {
          store.p[pid] = { u: u, st: "m", ok: OK_TO_MASTER, last: today() };
        });
      });
    }
    write(STORE_KEY, store);
  }
  function rec(pid) { return store.p[pid] || null; }

  /** 自己判定を記録する。result は "ok"（見ないで解けた）/ "fail"（解けなかった）/ "reset" */
  function mark(pid, u, result) {
    if (result === "reset") { delete store.p[pid]; write(STORE_KEY, store); return null; }
    var r = store.p[pid] || { u: u, ok: 0 };
    // 「解けた」は1日1回だけ数える（同じ日に何度押しても間隔が空かないため）
    if (result === "ok" && r.okDay === today()) return r;
    r.u = u; r.last = today();
    if (result === "fail") {
      r.ok = 0; r.st = "r"; r.due = addDays(1); delete r.okDay;
    } else {
      r.okDay = today();
      r.ok = (r.ok || 0) + 1;
      if (r.ok >= OK_TO_MASTER) { r.st = "m"; delete r.due; }
      else { r.st = "r"; r.due = addDays(OK_INTERVALS[r.ok - 1]); }
    }
    store.p[pid] = r;
    write(STORE_KEY, store);
    updateNavBadge();
    return r;
  }
  function statusText(r) {
    if (!r) return "未着手";
    if (r.st === "m") return "習得済み";
    var left = OK_TO_MASTER - (r.ok || 0);
    var when = r.due <= today() ? "今日" : md(r.due);
    return "復習中：次回 " + when + "（習得まであと" + left + "回）";
  }
  function dueRecords() {
    var t = today(), out = [];
    Object.keys(store.p).forEach(function (pid) {
      var r = store.p[pid];
      if (r.st === "r" && r.due <= t) out.push(pid);
    });
    return out;
  }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function unitHref(u, pid) { return root + "units/" + u + ".html" + (pid ? "#" + pid : ""); }
  function stars(n) { return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n); }
  function lvBadge(lv) { return '<span class="lv lv' + lv + '">' + LEVELS[lv] + "</span>"; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ---- 数式 ----
  function renderMath(node) {
    if (typeof renderMathInElement !== "function") return;
    renderMathInElement(node || document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false,
      strict: false,
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "input"],
      macros: {
        "\\vec": "\\overrightarrow{#1}",
        "\\abs": "\\left|#1\\right|",
        "\\C": "{}_{#1}\\mathrm{C}_{#2}",
        "\\P": "{}_{#1}\\mathrm{P}_{#2}",
        "\\H": "{}_{#1}\\mathrm{H}_{#2}"
      }
    });
  }

  // ---- ヘッダー ----
  function buildHeader() {
    var h = el("header", { "class": "site-header" });
    h.innerHTML =
      '<a class="brand" href="' + root + 'index.html"><span class="brand-mark">∫</span>解法の地図</a>' +
      '<button class="menu-btn" aria-label="メニュー" aria-expanded="false">☰</button>' +
      '<nav class="site-nav">' +
      '<a href="' + root + 'index.html">単元一覧</a>' +
      '<a href="' + root + 'roadmap.html">ロードマップ</a>' +
      '<a href="' + root + 'thinking.html">発想の引き出し</a>' +
      '<a href="' + root + 'reverse.html">逆引き</a>' +
      '<a href="' + root + 'drill.html">ドリル</a>' +
      '<a href="' + root + 'review.html">復習<span class="nav-badge" hidden></span></a>' +
      '<a href="' + root + 'handai.html">阪大対策</a>' +
      '<form class="nav-search" action="' + root + 'search.html" role="search">' +
      '<input type="search" name="q" placeholder="検索（例：解の個数）" aria-label="サイト内検索"></form>' +
      '</nav>';
    body.insertBefore(h, body.firstChild);
    var btn = h.querySelector(".menu-btn"), nav = h.querySelector(".site-nav");
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    updateNavBadge();
  }
  function updateNavBadge() {
    var b = document.querySelector(".nav-badge");
    if (!b) return;
    var n = dueRecords().length;
    b.hidden = !n;
    b.textContent = n;
  }

  // ---- 自己判定ウィジェット ----
  function selfCheck(pid, u, onChange) {
    var box = el("div", { "class": "selfcheck" });
    box.innerHTML =
      '<span class="sc-status"></span>' +
      '<span class="sc-buttons">' +
      '<button type="button" class="sc-ok">○ 見ないで解けた</button>' +
      '<button type="button" class="sc-fail">✗ 解けなかった</button>' +
      '<button type="button" class="sc-reset" title="記録を消す">リセット</button></span>';
    function paint() {
      var r = rec(pid);
      box.querySelector(".sc-status").textContent = statusText(r);
      box.className = "selfcheck" + (r ? (r.st === "m" ? " is-m" : " is-r") : "");
      box.querySelector(".sc-reset").hidden = !r;
      if (onChange) onChange(r);
    }
    box.querySelector(".sc-ok").addEventListener("click", function () { mark(pid, u, "ok"); paint(); });
    box.querySelector(".sc-fail").addEventListener("click", function () { mark(pid, u, "fail"); paint(); });
    box.querySelector(".sc-reset").addEventListener("click", function () { mark(pid, u, "reset"); paint(); });
    paint();
    return box;
  }

  // ---- 単元ページの装飾 ----
  function decorateUnit() {
    var idx = -1;
    for (var i = 0; i < UNITS.length; i++) if (UNITS[i].id === unitId) idx = i;
    var u = UNITS[idx];
    var main = document.querySelector("main");
    if (!u || !main) return;

    main.insertBefore(el("div", { "class": "crumb" },
      '<a href="' + root + 'index.html">単元一覧</a> › ' + u.subj + " › " + u.title), main.firstChild);

    var patterns = Array.prototype.slice.call(main.querySelectorAll("article.pattern"));
    var tools = el("div", { "class": "unit-tools" });
    function updateMeter() {
      var m = 0, r = 0;
      patterns.forEach(function (a) {
        var x = rec(a.id);
        if (x && x.st === "m") m++; else if (x) r++;
      });
      var pct = patterns.length ? Math.round(m / patterns.length * 100) : 0;
      tools.querySelector(".meter-bar span").style.width = pct + "%";
      tools.querySelector(".meter-text").textContent =
        "習得 " + m + " / " + patterns.length + (r ? "　復習中 " + r : "");
    }

    patterns.forEach(function (a) {
      var lv = a.getAttribute("data-level") || "1";
      var h3 = a.querySelector("h3");
      if (h3) h3.appendChild(el("span", { "class": "lv lv" + lv, title: "難易度" }, LEVELS[lv] || lv));
      a.appendChild(selfCheck(a.id, unitId, function (r) {
        a.classList.toggle("is-mastered", !!r && r.st === "m");
        a.classList.toggle("is-review", !!r && r.st === "r");
        if (tools.parentNode) updateMeter();
      }));
    });

    tools.innerHTML =
      '<div class="filter" role="group" aria-label="絞り込み">表示：' +
      '<button data-f="all" class="on">すべて</button>' +
      '<button data-f="1">基礎</button><button data-f="2">標準</button><button data-f="3">阪大</button>' +
      '<button data-f="todo">未習得のみ</button></div>' +
      '<div class="meter"><span class="meter-bar"><span></span></span><span class="meter-text"></span></div>';
    main.insertBefore(tools, main.querySelector("section"));
    tools.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        tools.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        var f = b.getAttribute("data-f");
        function show(lv, pid) {
          if (f === "all") return true;
          if (f === "todo") { var r = rec(pid); return !(r && r.st === "m"); }
          return lv === f;
        }
        patterns.forEach(function (a) { a.hidden = !show(a.getAttribute("data-level"), a.id); });
        main.querySelectorAll("table.quick tr[data-level]").forEach(function (tr) {
          var link = tr.querySelector('a[href^="#"]');
          tr.hidden = !show(tr.getAttribute("data-level"), link ? link.getAttribute("href").slice(1) : "");
        });
      });
    });
    updateMeter();

    var toc = el("nav", { "class": "toc", "aria-label": "このページの目次" });
    var html = "<strong>このページの目次</strong><ol>";
    main.querySelectorAll("section[id] > h2").forEach(function (h2) {
      html += '<li><a href="#' + h2.parentNode.id + '">' + h2.textContent + "</a></li>";
    });
    toc.innerHTML = html + "</ol>";
    main.insertBefore(toc, tools.nextSibling);

    var pn = el("nav", { "class": "prevnext" });
    var prev = UNITS[idx - 1], next = UNITS[idx + 1];
    pn.innerHTML =
      (prev ? '<a class="prev" href="' + unitHref(prev.id) + '">← ' + prev.subj + "「" + prev.title + "」</a>" : "<span></span>") +
      (next ? '<a class="next" href="' + unitHref(next.id) + '">' + next.subj + "「" + next.title + "」 →</a>" : "<span></span>");
    main.appendChild(pn);

    document.title = u.title + "（" + u.subj + "）｜解法の地図";
  }

  // ---- 集計（patterns.js があるページで使う） ----
  function tally() {
    var P = window.KAIHO_PATTERNS || [];
    var per = {};
    UNITS.forEach(function (u) { per[u.id] = { total: 0, m: 0, r: 0, lv1todo: 0 }; });
    P.forEach(function (p) {
      var t = per[p.u]; if (!t) return;
      t.total++;
      var r = rec(p.id);
      if (r && r.st === "m") t.m++; else if (r) t.r++;
      if (p.lv === 1 && !(r && r.st === "m")) t.lv1todo++;
    });
    return per;
  }

  // ---- トップページ：単元グリッドとダッシュボード ----
  function buildUnitGrid() {
    var box = document.getElementById("unit-grid");
    if (!box) return;
    var per = tally();
    var html = "";
    SUBJECTS.forEach(function (s) {
      html += '<section class="subj"><h2>' + s + '</h2><div class="cards">';
      UNITS.filter(function (u) { return u.subj === s; }).forEach(function (u) {
        var t = per[u.id], pct = t.total ? Math.round(t.m / t.total * 100) : 0;
        html += '<a class="card" href="' + unitHref(u.id) + '">' +
          '<span class="card-title">' + u.title + '</span>' +
          '<span class="card-desc">' + u.desc + '</span>' +
          (t.total ? '<span class="card-bar" title="習得率"><span style="width:' + pct + '%"></span></span>' : "") +
          '<span class="card-meta"><span class="freq" title="阪大での重要度">阪大重要度 ' + stars(u.handai) + '</span>' +
          (t.total ? '<span class="done">' + t.m + " / " + t.total + (t.r ? '<span class="rv">（復習 ' + t.r + "）</span>" : "") + "</span>" : "") +
          "</span></a>";
      });
      html += "</div></section>";
    });
    box.innerHTML = html;
  }

  function buildDashboard() {
    var box = document.getElementById("dashboard");
    if (!box || !window.KAIHO_PATTERNS) return;
    var per = tally(), all = { total: 0, m: 0, r: 0 };
    Object.keys(per).forEach(function (k) { all.total += per[k].total; all.m += per[k].m; all.r += per[k].r; });
    var due = dueRecords().length;
    var started = all.m + all.r > 0;

    // 次にやること：復習 → 基礎の残っている最初の単元
    var next;
    if (due) next = '<a class="btn primary" href="' + root + 'review.html">今日の復習 ' + due + ' 問から始める</a>';
    else {
      var nu = UNITS.filter(function (u) { return per[u.id].lv1todo > 0; })[0];
      next = nu ? '<a class="btn primary" href="' + unitHref(nu.id) + '">次は「' + nu.title + '」の基礎パターン（残り ' + per[nu.id].lv1todo + '）</a>'
                : '<a class="btn primary" href="' + root + 'drill.html">パターン判定ドリルに挑戦する</a>';
    }
    var bars = SUBJECTS.map(function (s) {
      var t = 0, m = 0;
      UNITS.forEach(function (u) { if (u.subj === s) { t += per[u.id].total; m += per[u.id].m; } });
      var pct = t ? Math.round(m / t * 100) : 0;
      return '<div class="dash-row"><span class="dash-subj">' + s + '</span><span class="card-bar"><span style="width:' + pct + '%"></span></span><span class="dash-num">' + m + "/" + t + "</span></div>";
    }).join("");
    box.innerHTML =
      '<div class="dash-stats">' +
      '<div><b>' + all.m + '</b><span>習得したパターン</span></div>' +
      '<div><b>' + all.r + '</b><span>復習中</span></div>' +
      '<div><b>' + due + '</b><span>今日の復習</span></div>' +
      '<div><b>' + all.total + '</b><span>パターン＋演習</span></div></div>' +
      '<div class="dash-next">' + next + '<a class="btn" href="' + root + 'drill.html">パターン判定ドリル</a></div>' +
      '<div class="dash-bars">' + bars + "</div>" +
      (started ? "" : '<p class="prereq">記録はこのブラウザに保存されます。各パターンの「○ 見ないで解けた」「✗ 解けなかった」を押すと、ここに進み具合と復習の予定が表示されます。</p>');
  }

  // ---- 復習ページ ----
  function buildReview() {
    var box = document.getElementById("review-app");
    if (!box || !window.KAIHO_PATTERNS) return;
    var byId = {};
    window.KAIHO_PATTERNS.forEach(function (p) { byId[p.id] = p; });
    var t = today();
    var due = [], soon = [], mastered = 0;
    Object.keys(store.p).forEach(function (pid) {
      var r = store.p[pid], p = byId[pid];
      if (!p) return;
      if (r.st === "m") mastered++;
      else if (r.due <= t) due.push(pid);
      else soon.push(pid);
    });
    soon.sort(function (a, b) { return store.p[a].due < store.p[b].due ? -1 : 1; });
    function row(pid) {
      var p = byId[pid], u = UNIT_BY_ID[p.u], r = store.p[pid];
      return '<tr><td><a href="' + unitHref(p.u, pid) + '">' + p.t + "</a></td><td>" + u.title + " " + p.n +
        "</td><td>" + lvBadge(p.lv) + "</td><td>" + (r.due <= t ? "今日" : md(r.due)) + "</td></tr>";
    }
    function table(list) {
      return '<div class="table-wrap"><table class="reverse"><tr><th>パターン</th><th>単元</th><th>難易度</th><th>予定</th></tr>' +
        list.map(row).join("") + "</table></div>";
    }
    box.innerHTML =
      "<h2>今日の復習（" + due.length + "）</h2>" +
      (due.length
        ? '<p>例題と類題を、<b>何も見ずに</b>解き直してください。解けたら「○ 見ないで解けた」を押します。</p>' +
          '<p><a class="btn primary" href="' + root + 'drill.html?mode=due">ドリル形式で復習する</a></p>' + table(due)
        : "<p>今日の復習はありません。新しいパターンに進むか、ドリルに挑戦しましょう。</p>") +
      "<h2>これからの予定（" + soon.length + "）</h2>" +
      (soon.length ? table(soon) : "<p>予定はありません。</p>") +
      "<h2>記録</h2><p>習得済み " + mastered + " パターン。</p>" +
      '<p><button type="button" class="btn" id="export-btn">記録を書き出す</button> ' +
      '<label class="btn">記録を読み込む<input type="file" id="import-file" accept="application/json" hidden></label></p>' +
      '<p class="prereq">記録はこのブラウザだけに保存されます。別の端末に移すときや、ブラウザのデータを消す前に「書き出す」で保存してください。</p>';
    renderMath(box);
    document.getElementById("export-btn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(store)], { type: "application/json" });
      var a = el("a", { href: URL.createObjectURL(blob), download: "kaiho-map-record-" + today() + ".json" });
      document.body.appendChild(a); a.click(); a.remove();
    });
    document.getElementById("import-file").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return;
      f.text().then(function (txt) {
        try {
          var s = JSON.parse(txt);
          if (!s || !s.p) throw new Error("bad");
          store = s; write(STORE_KEY, store); location.reload();
        } catch (err) { alert("記録ファイルを読み込めませんでした。"); }
      });
    });
  }

  // ---- 検索ページ ----
  function buildSearch() {
    var box = document.getElementById("search-app");
    if (!box || !window.KAIHO_PATTERNS) return;
    var input = document.getElementById("search-input");
    var out = document.getElementById("search-results");
    var q0 = new URLSearchParams(location.search).get("q") || "";
    input.value = q0;
    function norm(s) { return String(s).toLowerCase().replace(/\\[a-z]+/g, " ").replace(/[{}()\\]/g, ""); }
    var items = window.KAIHO_PATTERNS.map(function (p) {
      var u = UNIT_BY_ID[p.u];
      return { kind: "p", p: p, text: norm(p.t + " " + p.tr + " " + u.title + " " + u.subj) };
    }).concat((window.KAIHO_THINK || []).map(function (t) {
      return { kind: "t", p: t, text: norm(t.t + " " + t.tr + " 発想") };
    }));
    function run() {
      var words = norm(input.value).split(/[\s　]+/).filter(Boolean);
      if (!words.length) { out.innerHTML = '<p class="prereq">キーワードを入力してください（例：「最大値 文字」「整数解」「回転体」「すべての」）。</p>'; return; }
      var hits = items.filter(function (it) { return words.every(function (w) { return it.text.indexOf(w) >= 0; }); });
      history.replaceState(null, "", "?q=" + encodeURIComponent(input.value));
      out.innerHTML = "<p>" + hits.length + " 件</p>" + (hits.length ? '<ul class="results">' + hits.slice(0, 200).map(function (it) {
        var p = it.p;
        if (it.kind === "t") return '<li><a href="' + root + "thinking.html#" + p.id + '"><b>発想：' + esc(p.t) + '</b></a><span class="res-sub">' + esc(p.tr) + "</span></li>";
        var u = UNIT_BY_ID[p.u];
        return '<li><a href="' + unitHref(p.u, p.id) + '"><b>' + p.t + "</b></a> " + lvBadge(p.lv) +
          '<span class="res-sub">' + u.subj + "「" + u.title + "」" + p.n + (p.tr ? "：" + esc(p.tr) : "") + "</span></li>";
      }).join("") + "</ul>" : "");
      renderMath(out);
    }
    var timer;
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 150); });
    run();
  }

  // ---- パターン判定ドリル ----
  function buildDrill() {
    var app = document.getElementById("drill-app");
    if (!app || !window.KAIHO_DRILL) return;
    var D = window.KAIHO_DRILL;
    var params = new URLSearchParams(location.search);
    var settings = app.querySelector(".drill-settings");
    var stage = app.querySelector(".drill-stage");
    if (params.get("mode") === "due") settings.querySelector('[name="mode"][value="due"]').checked = true;
    var queue = [], idx = 0, score = { done: 0, hit: 0 };

    function pool() {
      var subs = Array.prototype.map.call(settings.querySelectorAll('[name="subj"]:checked'), function (x) { return x.value; });
      var lvs = Array.prototype.map.call(settings.querySelectorAll('[name="lv"]:checked'), function (x) { return +x.value; });
      var mode = settings.querySelector('[name="mode"]:checked').value;
      var dueSet = {};
      dueRecords().forEach(function (pid) { dueSet[pid] = 1; });
      return D.filter(function (d) {
        var u = UNIT_BY_ID[d.u], r = rec(d.id);
        if (mode === "due") return !!dueSet[d.id];
        if (subs.indexOf(u.subj) < 0 || lvs.indexOf(d.lv) < 0) return false;
        if (mode === "todo") return !(r && r.st === "m");
        return true;
      });
    }
    // 選択肢：正解1つ＋紛らわしい別パターン3つ（同じ単元から最大2つ、残りは同じ科目。演習は除く）
    var ALL = (window.KAIHO_PATTERNS || D).filter(function (x) { return !/-h\d+$/.test(x.id); });
    function choicesFor(d) {
      var subj = UNIT_BY_ID[d.u].subj, used = {};
      used[d.t] = 1;
      function pick(list, n) {
        var out = [];
        shuffle(list.slice()).forEach(function (x) { if (out.length < n && !used[x.t]) { used[x.t] = 1; out.push(x); } });
        return out;
      }
      var sameUnit = pick(ALL.filter(function (x) { return x.u === d.u; }), 2);
      var rest = pick(ALL.filter(function (x) { return x.u !== d.u && UNIT_BY_ID[x.u].subj === subj; }), 3 - sameUnit.length);
      if (sameUnit.length + rest.length < 3) rest = rest.concat(pick(ALL, 3 - sameUnit.length - rest.length));
      return shuffle([d].concat(sameUnit, rest));
    }
    function show() {
      if (idx >= queue.length) {
        stage.innerHTML = '<div class="box"><p><b>おつかれさまでした。</b> ' + score.done + " 問中、パターンを正しく見抜けたのは " + score.hit + " 問でした。</p>" +
          '<p>見抜けなかった問題は「✗ 解けなかった」にしておくと、復習リストに入ります。</p>' +
          '<p><button type="button" class="btn primary" data-act="restart">もう一度出題する</button> <a class="btn" href="' + root + 'review.html">復習リストを見る</a></p></div>';
        stage.querySelector('[data-act="restart"]').addEventListener("click", start);
        return;
      }
      var d = queue[idx], u = UNIT_BY_ID[d.u];
      var ch = choicesFor(d);
      stage.innerHTML =
        '<div class="drill-progress">' + (idx + 1) + " / " + queue.length + "　" + lvBadge(d.lv) + "</div>" +
        '<div class="problem drill-q">' + d.q + "</div>" +
        '<div class="drill-step"><p class="drill-ask"><b>① この問題はどのパターン？</b> 問題文の「こう来たら」にあたる言葉を探して選ぼう。</p>' +
        '<div class="drill-choices">' + ch.map(function (c, i) {
          return '<button type="button" class="choice" data-i="' + i + '">' + c.t + '<span class="choice-unit">' + UNIT_BY_ID[c.u].title + "</span></button>";
        }).join("") + "</div></div>" +
        '<div class="drill-reveal" hidden>' +
        '<div class="box idea"><p class="drill-verdict"></p><p><b>' + u.subj + "「" + u.title + "」：" + d.t + '</b></p>' +
        '<p><span class="point">こう来たら：</span>' + d.tr + "</p>" +
        '<div><span class="point">こう考える：</span>' + d.th + "</div>" +
        '<p class="prereq"><a href="' + unitHref(d.u, d.id) + '" target="_blank" rel="noopener">このパターンの解説と例題を開く ↗</a></p></div>' +
        '<p class="drill-ask"><b>② 方針が分かったら、紙に最後まで解いてから答えを見よう。</b></p>' +
        '<details class="sol"><summary>答えと解き方の要点</summary><div class="inner">' + d.a + "</div></details>" +
        '<p class="drill-ask"><b>③ 自己判定</b>（記録は単元ページと共通です）</p><div class="drill-judge"></div>' +
        '<p><button type="button" class="btn primary" data-act="next">次の問題へ →</button></p></div>';
      renderMath(stage);
      stage.querySelectorAll(".choice").forEach(function (b) {
        b.addEventListener("click", function () {
          if (stage.querySelector(".drill-reveal").hidden === false) return;
          var pick = ch[+b.getAttribute("data-i")];
          var ok = pick.id === d.id || pick.t === d.t;
          score.done++; if (ok) score.hit++;
          stage.querySelectorAll(".choice").forEach(function (x) {
            var c = ch[+x.getAttribute("data-i")];
            if (c.id === d.id) x.classList.add("right");
            x.disabled = true;
          });
          if (!ok) b.classList.add("wrong");
          stage.querySelector(".drill-verdict").innerHTML = ok ? "○ 正解！ このパターンです。" : "✗ 正しくは次のパターンです。";
          stage.querySelector(".drill-reveal").hidden = false;
        });
      });
      stage.querySelector(".drill-judge").appendChild(selfCheck(d.id, d.u));
      stage.querySelector('[data-act="next"]').addEventListener("click", function () { idx++; show(); window.scrollTo(0, app.offsetTop - 70); });
    }
    function start() {
      var n = +settings.querySelector('[name="count"]').value || 10;
      queue = shuffle(pool()).slice(0, n);
      idx = 0; score = { done: 0, hit: 0 };
      if (!queue.length) {
        stage.innerHTML = '<p class="box note">条件に合う問題がありません。' +
          (settings.querySelector('[name="mode"]:checked').value === "due" ? "今日の復習はありません。" : "科目や難易度の選択を増やしてください。") + "</p>";
        return;
      }
      show();
    }
    settings.querySelector('[data-act="start"]').addEventListener("click", start);
    var countEl = settings.querySelector(".pool-count");
    function updateCount() { if (countEl) countEl.textContent = "対象 " + pool().length + " 問"; }
    settings.addEventListener("change", updateCount);
    updateCount();
  }

  // ---- 発想ページ：その発想を使うパターンの一覧を付ける ----
  function buildThinkingRefs() {
    var refs = window.KAIHO_THINK_REFS, P = window.KAIHO_PATTERNS;
    if (!refs || !P || !document.getElementById("t-graph")) return;
    var byId = {};
    P.forEach(function (p) { byId[p.id] = p; });
    Object.keys(refs).forEach(function (t) {
      var art = document.getElementById(t);
      if (!art) return;
      var list = refs[t].filter(function (pid) { return byId[pid]; });
      if (!list.length) return;
      var html = '<details class="refs"><summary>この発想を使うパターン（' + list.length + "）</summary><div class=\"inner\"><ul>" +
        list.map(function (pid) {
          var p = byId[pid], u = UNIT_BY_ID[p.u];
          return '<li><a href="' + unitHref(p.u, pid) + '">' + p.t + "</a> " + lvBadge(p.lv) + ' <span class="res-sub-inline">' + u.title + " " + p.n + "</span></li>";
        }).join("") + "</ul></div></details>";
      art.insertAdjacentHTML("beforeend", html);
    });
  }

  // 印刷するときは解答もすべて開く
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("details").forEach(function (d) { d.open = true; });
  });

  buildHeader();
  if (unitId) decorateUnit();
  buildUnitGrid();
  buildDashboard();
  buildReview();
  buildSearch();
  buildDrill();
  buildThinkingRefs();
  renderMath(document.body);
  window.KAIHO_UNITS = UNITS;
})();
