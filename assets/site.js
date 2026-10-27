/* 解法の地図 — 共通スクリプト
 * ・ヘッダー/ナビ/目次/前後リンクの自動生成
 * ・KaTeX による数式描画
 * ・パターンごとの「習得した」チェック（ブラウザ内保存）
 * ・難易度フィルタ
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
  var SUBJECTS = ["数学I", "数学A", "数学II", "数学B", "数学C", "数学III"];
  var LEVELS = { "1": "基礎", "2": "標準", "3": "阪大" };

  var body = document.body;
  var root = body.getAttribute("data-root") || "";
  var unitId = body.getAttribute("data-unit");
  var STORE_KEY = "kaiho-map-progress-v1";

  // ---- 保存（使えない環境でも壊れないように） ----
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { /* noop */ }
  }
  var progress = loadProgress();

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function unitHref(u) { return root + "units/" + u.id + ".html"; }
  function stars(n) { return "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n); }

  // ---- ヘッダー ----
  function buildHeader() {
    var h = el("header", { "class": "site-header" });
    h.innerHTML =
      '<a class="brand" href="' + root + 'index.html"><span class="brand-mark">∫</span>解法の地図</a>' +
      '<button class="menu-btn" aria-label="メニュー" aria-expanded="false">☰</button>' +
      '<nav class="site-nav">' +
      '<a href="' + root + 'index.html">単元一覧</a>' +
      '<a href="' + root + 'roadmap.html">学習ロードマップ</a>' +
      '<a href="' + root + 'thinking.html">発想の引き出し</a>' +
      '<a href="' + root + 'reverse.html">逆引き索引</a>' +
      '<a href="' + root + 'handai.html">阪大対策</a>' +
      '</nav>';
    body.insertBefore(h, body.firstChild);
    var btn = h.querySelector(".menu-btn"), nav = h.querySelector(".site-nav");
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---- 単元ページの装飾 ----
  function decorateUnit() {
    var idx = -1;
    for (var i = 0; i < UNITS.length; i++) if (UNITS[i].id === unitId) idx = i;
    var u = UNITS[idx];
    var main = document.querySelector("main");
    if (!u || !main) return;

    // パンくず
    var crumb = el("div", { "class": "crumb" },
      '<a href="' + root + 'index.html">単元一覧</a> › ' + u.subj + ' › ' + u.title);
    main.insertBefore(crumb, main.firstChild);

    // 難易度バッジ + 習得チェック
    var patterns = main.querySelectorAll("article.pattern");
    var p = progress[unitId] || {};
    Array.prototype.forEach.call(patterns, function (a) {
      var lv = a.getAttribute("data-level") || "1";
      var h3 = a.querySelector("h3");
      if (h3) {
        var b = el("span", { "class": "lv lv" + lv, title: "難易度" }, LEVELS[lv] || lv);
        h3.appendChild(b);
      }
      var id = a.id;
      var lab = el("label", { "class": "mastered" });
      var cb = el("input", { type: "checkbox" });
      cb.checked = !!p[id];
      if (cb.checked) a.classList.add("is-mastered");
      cb.addEventListener("change", function () {
        progress[unitId] = progress[unitId] || {};
        if (cb.checked) progress[unitId][id] = 1; else delete progress[unitId][id];
        a.classList.toggle("is-mastered", cb.checked);
        saveProgress(progress);
        updateMeter();
      });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(" 例題を何も見ずに解けた（習得）"));
      a.appendChild(lab);
    });

    // 難易度フィルタ + 進捗メーター
    var tools = el("div", { "class": "unit-tools" });
    tools.innerHTML =
      '<div class="filter" role="group" aria-label="難易度で絞り込み">表示：' +
      '<button data-f="all" class="on">すべて</button>' +
      '<button data-f="1">基礎</button><button data-f="2">標準</button><button data-f="3">阪大</button></div>' +
      '<div class="meter"><span class="meter-bar"><span></span></span><span class="meter-text"></span></div>';
    var firstSection = main.querySelector("section");
    main.insertBefore(tools, firstSection);
    tools.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        tools.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        var f = b.getAttribute("data-f");
        patterns.forEach(function (a) {
          a.hidden = !(f === "all" || a.getAttribute("data-level") === f);
        });
        main.querySelectorAll("table.quick tr[data-level]").forEach(function (tr) {
          tr.hidden = !(f === "all" || tr.getAttribute("data-level") === f);
        });
      });
    });
    function updateMeter() {
      var done = Object.keys(progress[unitId] || {}).length;
      var total = patterns.length;
      var pct = total ? Math.round(done / total * 100) : 0;
      tools.querySelector(".meter-bar span").style.width = pct + "%";
      tools.querySelector(".meter-text").textContent = "習得 " + done + " / " + total + "（" + pct + "%）";
    }
    updateMeter();

    // 目次（h2）
    var toc = el("nav", { "class": "toc", "aria-label": "このページの目次" });
    var html = "<strong>このページの目次</strong><ol>";
    main.querySelectorAll("section[id] > h2").forEach(function (h2) {
      html += '<li><a href="#' + h2.parentNode.id + '">' + h2.textContent + "</a></li>";
    });
    toc.innerHTML = html + "</ol>";
    main.insertBefore(toc, tools.nextSibling);

    // 前後リンク
    var pn = el("nav", { "class": "prevnext" });
    var prev = UNITS[idx - 1], next = UNITS[idx + 1];
    pn.innerHTML =
      (prev ? '<a class="prev" href="' + unitHref(prev) + '">← ' + prev.subj + "「" + prev.title + "」</a>" : "<span></span>") +
      (next ? '<a class="next" href="' + unitHref(next) + '">' + next.subj + "「" + next.title + "」 →</a>" : "<span></span>");
    main.appendChild(pn);

    document.title = u.title + "（" + u.subj + "）｜解法の地図";
  }

  // ---- トップページの単元グリッド ----
  function buildUnitGrid() {
    var box = document.getElementById("unit-grid");
    if (!box) return;
    var html = "";
    SUBJECTS.forEach(function (s) {
      html += '<section class="subj"><h2>' + s + '</h2><div class="cards">';
      UNITS.filter(function (u) { return u.subj === s; }).forEach(function (u) {
        var done = Object.keys(progress[u.id] || {}).length;
        html += '<a class="card" href="' + unitHref(u) + '">' +
          '<span class="card-title">' + u.title + '</span>' +
          '<span class="card-desc">' + u.desc + '</span>' +
          '<span class="card-meta"><span class="freq" title="阪大での重要度">阪大重要度 ' + stars(u.handai) + '</span>' +
          (done ? '<span class="done">習得 ' + done + '</span>' : "") + '</span></a>';
      });
      html += "</div></section>";
    });
    box.innerHTML = html;
  }

  // ---- 数式 ----
  function renderMath() {
    if (typeof renderMathInElement !== "function") return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false,
      strict: false,
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
      macros: {
        "\\vec": "\\overrightarrow{#1}",
        "\\abs": "\\left|#1\\right|",
        "\\C": "{}_{#1}\\mathrm{C}_{#2}",
        "\\P": "{}_{#1}\\mathrm{P}_{#2}",
        "\\H": "{}_{#1}\\mathrm{H}_{#2}"
      }
    });
  }

  buildHeader();
  if (unitId) decorateUnit();
  buildUnitGrid();
  renderMath();
  window.KAIHO_UNITS = UNITS;
})();
