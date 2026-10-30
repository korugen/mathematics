"""単元ページから検索・復習・ドリル用のデータを生成する。

出力:
  assets/data/patterns.js  … 全パターンの索引（検索・復習・ダッシュボード用）
  assets/data/drill.js     … 類題の問題と解答（パターン判定ドリル用）

単元ページを更新したら `python3 tools/build_data.py` を再実行する。
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# site.js の UNITS と同じ順序
UNITS = [
    "m1-numbers", "m1-logic", "m1-quadratic", "m1-trig", "m1-data",
    "ma-counting", "ma-probability", "ma-geometry", "ma-integer",
    "m2-proof", "m2-complex-eq", "m2-coord", "m2-trig", "m2-explog", "m2-calculus",
    "mb-sequence", "mb-stats", "mc-vector", "mc-curves", "mc-complex",
    "m3-limit", "m3-diff", "m3-integral", "m3-integral-app",
]


def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s)).strip()


def inner(html, start_pat):
    """start_pat に一致する開始タグから、対応する閉じタグまでの中身を返す。"""
    m = re.search(start_pat, html)
    if not m:
        return None
    tag = re.match(r"<(\w+)", m.group(0)).group(1)
    depth, i = 1, m.end()
    tok = re.compile(r"<(/?)%s\b[^>]*>" % tag)
    while depth:
        t = tok.search(html, i)
        if not t:
            return None
        depth += -1 if t.group(1) else 1
        i = t.end()
    return html[m.end():t.start()]


def dd_after(body, dt_text):
    """dl.map の中で、見出し dt_text の直後の dd の中身を返す（なければ空文字）。"""
    m = re.search(r"<dt[^>]*>%s</dt>\s*(?=<dd)" % re.escape(dt_text), body)
    return (inner(body[m.end():], r"<dd[^>]*>") or "") if m else ""


def no_figures(s):
    return re.sub(r"<figure\b.*?</figure>", "", s, flags=re.S)


def main():
    patterns, drill, refs = [], [], {}
    for u in UNITS:
        html = open(os.path.join(ROOT, "units", u + ".html"), encoding="utf-8").read()
        for m in re.finditer(r'<article class="pattern" id="([^"]+)" data-level="(\d)">', html):
            pid, lv = m.group(1), int(m.group(2))
            body = inner(html[m.start():], r'<article class="pattern"[^>]*>')
            h3 = re.search(r"<h3>(.*?)</h3>", body, re.S).group(1)
            num = re.search(r'<span class="pid">(.*?)</span>', h3)
            title = re.sub(r'<span class="pid">.*?</span>', "", h3).strip()
            trig = dd_after(body, "こう来たら") or ""
            patterns.append({"id": pid, "u": u, "lv": lv, "n": num.group(1) if num else "",
                             "t": title, "tr": strip_tags(trig)})
            for t in sorted(set(re.findall(r'thinking\.html#(t-[\w-]+)', body))):
                refs.setdefault(t, []).append(pid)
            prac = inner(body, r'<div class="practice">')
            if prac:
                q = inner(prac, r'<div class="problem">')
                sol = inner(prac, r'<details class="sol">')
                sol = re.sub(r"^\s*<summary>.*?</summary>\s*", "", sol or "", flags=re.S)
                sol = inner(sol, r'<div class="inner">') or sol
                drill.append({"id": pid, "u": u, "lv": lv, "t": title, "tr": trig.strip(),
                              "th": no_figures(dd_after(body, "こう考える")).strip(),
                              "q": (q or "").strip(), "a": sol.strip()})

    think = []
    th = open(os.path.join(ROOT, "thinking.html"), encoding="utf-8").read()
    for m in re.finditer(r'<article class="pattern" id="(t-[^"]+)">\s*<h3><span class="pid">.*?</span>(.*?)</h3>', th, re.S):
        body = inner(th[m.start():], r'<article class="pattern"[^>]*>')
        think.append({"id": m.group(1), "t": strip_tags(m.group(2)),
                      "tr": strip_tags(dd_after(body, "こんなとき") or "")})

    os.makedirs(os.path.join(ROOT, "assets", "data"), exist_ok=True)
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(ROOT, "assets", "data", "patterns.js"), "w", encoding="utf-8") as f:
        f.write("/* tools/build_data.py で生成。直接編集しない。 */\n")
        f.write("window.KAIHO_PATTERNS=" + dump(patterns) + ";\n")
        f.write("window.KAIHO_THINK=" + dump(think) + ";\n")
        f.write("window.KAIHO_THINK_REFS=" + dump(refs) + ";\n")
    with open(os.path.join(ROOT, "assets", "data", "drill.js"), "w", encoding="utf-8") as f:
        f.write("/* tools/build_data.py で生成。直接編集しない。 */\n")
        f.write("window.KAIHO_DRILL=" + dump(drill) + ";\n")
    print(f"patterns: {len(patterns)}  practice problems: {len(drill)}  thinking: {len(think)}  thinking refs: {sum(map(len, refs.values()))}")


if __name__ == "__main__":
    main()
