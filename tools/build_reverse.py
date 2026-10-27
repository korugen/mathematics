"""逆引き索引 reverse.html を生成する。

各単元ページからパターンのタイトルと難易度を読み取り、
下の CATEGORIES（目的 → パターンID）に従って並べる。
単元ページを更新したら `python3 tools/build_reverse.py` を再実行する。
"""
import html
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

UNIT_NAMES = {
    "m1-numbers": "数と式", "m1-logic": "集合と命題", "m1-quadratic": "2次関数",
    "m1-trig": "図形と計量", "m1-data": "データの分析", "ma-counting": "場合の数",
    "ma-probability": "確率", "ma-geometry": "図形の性質", "ma-integer": "整数の性質",
    "m2-proof": "式と証明", "m2-complex-eq": "複素数と方程式", "m2-coord": "図形と方程式",
    "m2-trig": "三角関数", "m2-explog": "指数・対数", "m2-calculus": "微積分（数II）",
    "mb-sequence": "数列", "mb-stats": "統計的な推測", "mc-vector": "ベクトル",
    "mc-curves": "平面上の曲線", "mc-complex": "複素数平面", "m3-limit": "極限",
    "m3-diff": "微分法（数III）", "m3-integral": "積分法（計算）",
    "m3-integral-app": "積分法の応用",
}
LEVELS = {"1": "基礎", "2": "標準", "3": "阪大"}

# (アンカーID, 見出し, 問題文に現れる言葉, 関連する発想ID, [パターンID...])
CATEGORIES = [
    ("max-min", "最大値・最小値を求めたい",
     "「最大値・最小値を求めよ」「〜を最小にする」「取りうる値の範囲」",
     ["t-graph", "t-subst", "t-fix", "t-inverse"],
     ["quad-p1", "quad-p4", "quad-p5", "quad-p6", "quad-p7", "quad-p8",
      "trig-p12", "trig-p13", "trig-p14", "exp-p9", "exp-p14", "exp-p15",
      "prf-p13", "prf-p14", "prf-p15", "prf-p16",
      "calc2-p7", "diff-p15", "tri1-p20", "vec-p8", "vec-p20", "crd-p15", "crd-p16",
      "crv-p7", "crv-p8", "cpx-p15", "num-p19", "intg-p19", "intg-p20", "calc2-p20"]),
    ("range", "値域・取りうる値の範囲を求めたい（存在条件）",
     "「〜の取りうる値の範囲を求めよ」「〜を満たす実数が存在する」",
     ["t-inverse", "t-rephrase"],
     ["quad-h1", "num-p12", "ceq-p5", "crd-p13", "exp-h2", "cpx-h1"]),
    ("num-solutions", "方程式の実数解の個数を調べたい",
     "「異なる実数解の個数を \\(a\\) の値で分類せよ」「解をもつ条件」",
     ["t-separate", "t-graph", "t-subst"],
     ["quad-p9", "quad-p11", "quad-p10", "calc2-p8", "calc2-p9", "diff-p16",
      "exp-p17", "trig-p15", "ceq-h2", "ceq-h3", "lim-p18"]),
    ("always", "「常に成り立つ」「ある \\(x\\) で成り立つ」条件を求めたい",
     "「すべての \\(x\\) について」「常に」「ある \\(x\\) が存在して」",
     ["t-forall", "t-separate"],
     ["quad-p12", "quad-p13", "calc2-p11", "logic-p7", "logic-p15", "diff-h3"]),
    ("inequality", "不等式を証明したい",
     "「〜\\(\\ge\\)〜を証明せよ」「等号が成り立つのはいつか」",
     ["t-difffunc", "t-bound", "t-integral-eval"],
     ["prf-p11", "prf-p12", "prf-p13", "prf-p15", "prf-p16", "prf-p4", "prf-h3",
      "calc2-p11", "diff-p17", "diff-p18", "diff-p19", "diff-p20", "diff-p21", "diff-p10",
      "seq-p16", "exp-p16", "inta-p17", "inta-p18"]),
    ("equation", "方程式・不等式を解きたい",
     "「〜を解け」",
     ["t-casework", "t-subst"],
     ["num-p7", "num-p8", "num-p14", "num-p15", "quad-p3", "tri1-p4", "trig-p4", "trig-p5",
      "trig-p6", "trig-p10", "exp-p2", "exp-p3", "exp-p7", "exp-p8", "ceq-p12", "ceq-p15",
      "cpx-p5"]),
    ("solution-location", "方程式の解の位置・解の条件を扱いたい",
     "「2つの解がともに正」「解の1つが〜」「解を \\(\\alpha,\\beta\\) とするとき」",
     ["t-graph", "t-rephrase"],
     ["quad-p10", "ceq-p5", "ceq-p6", "ceq-p7", "ceq-p14", "ceq-p16", "ceq-p17"]),
    ("integer-solution", "整数解・自然数の組を求めたい",
     "「〜を満たす整数（自然数）の組をすべて求めよ」",
     ["t-bound", "t-mod", "t-symmetry"],
     ["int-p9", "int-p10", "int-p11", "int-p12", "int-p3", "int-h1", "int-h2", "num-p16"]),
    ("divisible", "倍数・余り・割り切れることを示したい",
     "「〜は \\(m\\) の倍数であることを示せ」「〜を割った余りを求めよ」",
     ["t-mod", "t-induction"],
     ["int-p5", "int-p6", "int-p7", "int-p17", "int-p18", "int-p19", "int-p20", "int-p2",
      "prf-p3", "seq-p16"]),
    ("poly-remainder", "整式の余り・因数・恒等式を扱いたい",
     "「整式 \\(P(x)\\) を〜で割った余り」「恒等式となるように」",
     ["t-necessary", "t-rephrase"],
     ["prf-p5", "prf-p7", "prf-p8", "ceq-p8", "ceq-p9", "ceq-p10", "ceq-p11", "ceq-h1",
      "prf-h1"]),
    ("irrational", "無理数である・存在しない・無限にあることを示したい",
     "「無理数であることを示せ」「存在しないことを示せ」「無限に存在する」",
     ["t-contradiction", "t-mod"],
     ["logic-p10", "logic-p11", "logic-p12", "int-p14", "exp-p13", "logic-h1"]),
    ("logic", "必要条件・十分条件・命題を扱いたい",
     "「必要条件か十分条件か」「逆・裏・対偶」「少なくとも一方」",
     ["t-rephrase", "t-complement"],
     ["logic-p5", "logic-p6", "logic-p8", "logic-p9", "logic-p13", "logic-p14", "logic-h3"]),
    ("count", "場合の数を数えたい",
     "「何通りあるか」「〜の個数を求めよ」",
     ["t-complement", "t-recurrence", "t-experiment"],
     ["cnt-p1", "cnt-p2", "cnt-p5", "cnt-p6", "cnt-p7", "cnt-p8", "cnt-p9", "cnt-p10",
      "cnt-p11", "cnt-p12", "cnt-p13", "cnt-p14", "cnt-p15", "cnt-p17", "cnt-p18",
      "cnt-p19", "cnt-p4", "seq-p8"]),
    ("probability", "確率を求めたい",
     "「〜となる確率を求めよ」「\\(n\\) 回後に〜である確率」",
     ["t-complement", "t-recurrence", "t-symmetry"],
     ["prob-p1", "prob-p2", "prob-p3", "prob-p5", "prob-p6", "prob-p8", "prob-p9",
      "prob-p12", "prob-p13", "prob-p14", "prob-p15", "prob-p16", "prob-p17", "prob-p18"]),
    ("expectation", "期待値・分散を求めたい",
     "「期待値を求めよ」「分散・標準偏差を求めよ」",
     ["t-recurrence"],
     ["prob-p10", "prob-p11", "stat-p1", "stat-p2", "stat-p3", "stat-p4", "stat-p5",
      "stat-p6", "stat-p15", "stat-p16", "data-p4", "data-p5"]),
    ("sequence-general", "数列の一般項を求めたい（漸化式を解く）",
     "「一般項 \\(a_n\\) を求めよ」「漸化式で定められる数列」",
     ["t-recurrence", "t-experiment", "t-induction"],
     ["seq-p1", "seq-p3", "seq-p4", "seq-p9", "seq-p10", "seq-p11", "seq-p12", "seq-p13",
      "seq-p14", "seq-p15", "seq-p18", "seq-p20"]),
    ("sum", "和を求めたい・評価したい",
     "「\\(\\sum\\) を求めよ」「和の極限」「和を評価せよ」",
     ["t-integral-eval", "t-bound"],
     ["seq-p2", "seq-p5", "seq-p6", "seq-p7", "lim-p8", "lim-p9", "inta-p15", "inta-p16",
      "inta-p17", "inta-h2", "cpx-p17"]),
    ("induction", "「すべての自然数 \\(n\\) について」示したい",
     "「\\(n\\) が自然数のとき〜を示せ」",
     ["t-induction", "t-experiment"],
     ["seq-p16", "seq-p17", "seq-p18", "seq-p19", "int-p19", "trig-p16"]),
    ("limit", "極限を求めたい",
     "「\\(\\lim\\) を求めよ」「収束することを示せ」",
     ["t-bound", "t-integral-eval"],
     ["lim-p1", "lim-p2", "lim-p3", "lim-p4", "lim-p5", "lim-p6", "lim-p7", "lim-p12",
      "lim-p14", "lim-p15", "lim-p16", "lim-p19", "lim-p20", "diff-p4", "intg-p16",
      "inta-p19", "prob-p18", "lim-h3"]),
    ("locus", "軌跡・領域・通過領域を求めたい",
     "「点 P の軌跡を求めよ」「〜が通過する領域を図示せよ」",
     ["t-inverse", "t-fix", "t-coord"],
     ["crd-p10", "crd-p11", "crd-p12", "crd-p13", "crd-p14", "crd-p17", "crd-p18",
      "vec-p10", "vec-p11", "cpx-p11", "cpx-p12", "cpx-p13", "cpx-p14", "crv-p15", "crv-p10"]),
    ("tangent", "接線・接する条件を扱いたい",
     "「接線の方程式」「点から引いた接線」「2曲線が接する」",
     ["t-rephrase"],
     ["calc2-p2", "calc2-p3", "calc2-p4", "calc2-p10", "diff-p8", "diff-p9", "crd-p8",
      "crv-p6", "crv-p16", "diff-h1"]),
    ("area-volume", "面積・体積・長さを求めたい",
     "「囲まれた部分の面積」「回転してできる立体の体積」「曲線の長さ」",
     ["t-goal", "t-coord"],
     ["calc2-p16", "calc2-p17", "calc2-p18", "inta-p1", "inta-p2", "inta-p3", "inta-p4",
      "inta-p5", "inta-p6", "inta-p7", "inta-p8", "inta-p9", "inta-p10", "inta-p11",
      "inta-p12", "inta-p13", "inta-p14"]),
    ("integral-calc", "積分を計算したい",
     "「次の定積分を求めよ」",
     ["t-subst", "t-symmetry"],
     ["intg-p3", "intg-p4", "intg-p6", "intg-p7", "intg-p8", "intg-p9", "intg-p11",
      "intg-p12", "intg-p13", "intg-p14", "intg-p15", "calc2-p19"]),
    ("integral-function", "定積分で表された関数を扱いたい",
     "「\\(f(x)=\\cdots+\\int_0^1 f(t)\\,dt\\)」「\\(\\int_a^x f(t)\\,dt\\)」",
     ["t-subst"],
     ["calc2-p14", "calc2-p15", "intg-p17", "intg-p18", "intg-h2"]),
    ("triangle", "三角形の辺・角・面積を求めたい",
     "「三角形 ABC において」",
     ["t-goal", "t-coord"],
     ["tri1-p6", "tri1-p7", "tri1-p8", "tri1-p9", "tri1-p11", "tri1-p12", "tri1-p13",
      "tri1-p14", "tri1-p19", "geo-p2", "geo-p17", "vec-p9", "crd-p3"]),
    ("ratio-intersection", "比・交点の位置を求めたい",
     "「AP:PQ を求めよ」「直線の交点を P とするとき \\(\\vec{OP}\\) を表せ」",
     ["t-vector"],
     ["geo-p6", "geo-p7", "vec-p3", "vec-p4", "vec-p5", "vec-p14", "vec-h1"]),
    ("circle-geometry", "円の性質を使いたい",
     "「円に内接する」「接線」「4点が同一円周上」",
     ["t-goal"],
     ["geo-p8", "geo-p9", "geo-p10", "geo-p11", "geo-p12", "tri1-p14", "crd-p7", "crd-p9"]),
    ("space", "空間図形を扱いたい",
     "「四面体」「平面に下ろした垂線」「ねじれの位置」",
     ["t-vector", "t-coord"],
     ["tri1-p16", "tri1-p17", "tri1-p18", "geo-p14", "geo-p15", "vec-p13", "vec-p15",
      "vec-p16", "vec-p17", "vec-p18", "vec-p19", "vec-h2", "inta-p12"]),
    ("rotation", "回転・正三角形・角度を扱いたい",
     "「点を \\(\\theta\\) 回転」「正三角形となる」「\\(\\angle\\) の大きさ」",
     ["t-vector"],
     ["cpx-p8", "cpx-p9", "cpx-p10", "cpx-p18", "cpx-p19", "trig-p8", "vec-p6", "vec-p7"]),
    ("power", "大きな数・累乗を扱いたい",
     "「何桁の数か」「最高位の数字」「\\(a^n\\) の一の位」",
     ["t-mod"],
     ["exp-p11", "exp-p12", "exp-p10", "int-p7", "cpx-p4", "exp-h1", "seq-h1"]),
    ("data", "データ・統計を扱いたい",
     "「平均値・分散・相関係数」「推定・検定」",
     [],
     ["data-p1", "data-p2", "data-p6", "data-p7", "data-p9", "data-p10", "data-p11",
      "stat-p8", "stat-p9", "stat-p11", "stat-p12", "stat-p13"]),
]


def load_patterns():
    pats = {}
    for name in UNIT_NAMES:
        s = open(os.path.join(ROOT, "units", name + ".html"), encoding="utf-8").read()
        for m in re.finditer(r'<article class="pattern" id="([^"]+)" data-level="(\d)">\s*<h3>(.*?)</h3>', s, re.S):
            pid, lv, h3 = m.groups()
            num = re.search(r'<span class="pid">(.*?)</span>', h3)
            title = re.sub(r'<span class="pid">.*?</span>', "", h3).strip()
            pats[pid] = dict(unit=name, lv=lv, num=num.group(1) if num else "", title=title)
    return pats


THINK_NAMES = {}


def load_thinking():
    s = open(os.path.join(ROOT, "thinking.html"), encoding="utf-8").read()
    for m in re.finditer(r'<article class="pattern" id="(t-[^"]+)">\s*<h3><span class="pid">.*?</span>(.*?)</h3>', s, re.S):
        THINK_NAMES[m.group(1)] = re.sub(r"<[^>]+>", "", m.group(2)).strip()


def main():
    pats = load_patterns()
    load_thinking()
    missing = [p for c in CATEGORIES for p in c[4] if p not in pats]
    if missing:
        raise SystemExit("unknown pattern ids: " + ", ".join(missing))

    toc = "".join(f'<li><a href="#{a}">{h}</a></li>' for a, h, *_ in CATEGORIES)
    body = []
    for anchor, head, words, thinks, ids in CATEGORIES:
        rows = []
        for pid in ids:
            p = pats[pid]
            rows.append(
                f'<tr><td><a href="units/{p["unit"]}.html#{pid}">{p["title"]}</a></td>'
                f'<td>{UNIT_NAMES[p["unit"]]} {p["num"]}</td>'
                f'<td><span class="lv lv{p["lv"]}">{LEVELS[p["lv"]]}</span></td></tr>')
        think = ""
        if thinks:
            think = '<p class="prereq">使う発想：' + "、".join(
                f'<a href="thinking.html#{t}">{THINK_NAMES[t]}</a>' for t in thinks) + "</p>"
        body.append(
            f'<section id="{anchor}">\n<h2>{head}</h2>\n'
            f'<p class="trigger-words">こう来たら：{words}</p>\n{think}\n'
            f'<div class="table-wrap"><table class="reverse">'
            f'<tr><th>パターン</th><th>単元</th><th>難易度</th></tr>{"".join(rows)}</table></div>\n</section>')

    page = f"""<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>逆引き索引｜解法の地図</title>
<link rel="stylesheet" href="assets/katex/katex.min.css">
<link rel="stylesheet" href="assets/style.css">
<script defer src="assets/katex/katex.min.js"></script>
<script defer src="assets/katex/auto-render.min.js"></script>
<script defer src="assets/site.js"></script>
</head>
<body data-root="">
<main>
<!-- このファイルは tools/build_reverse.py で生成される。直接編集しない。 -->
<header class="unit-head">
  <h1>逆引き索引</h1>
  <p class="lead">「何をしたいか」から解法パターンを探す索引です。問題を読んで単元が分からないとき、方針が立たないときは、問題文の言葉に近い項目を探してください。同じ目的でも単元によって道具が違うので、<b>複数の単元のパターンを見比べる</b>と応用力がつきます。</p>
</header>
<nav class="toc" aria-label="目的の一覧"><strong>目的の一覧</strong><ol>{toc}</ol></nav>
{chr(10).join(body)}
</main>
<footer class="site-footer">解法の地図 — 高校数学 解法パターン対応表</footer>
</body>
</html>
"""
    open(os.path.join(ROOT, "reverse.html"), "w", encoding="utf-8").write(page)
    print("reverse.html:", len(CATEGORIES), "categories,", sum(len(c[4]) for c in CATEGORIES), "entries")


if __name__ == "__main__":
    main()
