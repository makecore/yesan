"""강의 노트(Markdown)를 사이트 페이지(HTML)로 바꾸는 스크립트.

사용법(저장소 맨 위 폴더에서):
    pip install markdown
    python3 tools/build_lecture.py

docs/lectures/ 아래 .md 파일을 고친 뒤 이 명령을 실행하면
lecture.html 이 다시 만들어집니다.
"""

import re
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "lectures" / "2026-11-budget-strategy.md"
OUT = ROOT / "lecture.html"

BADGES = {
    "[강의]": ("b-lec", "강의"),
    "[확인]": ("b-chk", "확인"),
    "[우리 기관]": ("b-org", "우리 기관"),
}

TEMPLATE = """<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="강의 정리 — 국가예산 편성과 전략적 예산 확보 방안 (국가예산 나침반)" />
    <title>강의 노트 · 국가예산 편성과 전략적 예산 확보 방안 — 국가예산 나침반</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&family=Space+Grotesk:wght@500;700&display=swap" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body class="lecture-page">
    <span id="top"></span>
    <a class="skip-link" href="#main">본문 바로가기</a>
    <header class="topbar">
      <a class="brand" href="index.html" aria-label="국가예산 나침반 처음으로"><span class="brand-mark" aria-hidden="true">N</span><span><strong>국가예산</strong> 나침반</span></a>
      <nav class="topnav" aria-label="주요 메뉴">
        <a href="index.html#calendar">일정·D-day</a>
        <a href="index.html#finder">규정 탐색기</a>
        <a href="index.html#checklist-section">체크리스트</a>
        <a href="index.html#library">자료실</a>
        <a href="lecture.html" aria-current="page">강의 노트</a>
      </nav>
      <button class="ghost-button" type="button" onclick="window.print()">인쇄·PDF</button>
    </header>

    <main id="main" class="section-shell lecture-layout">
      <aside class="lecture-toc" aria-label="목차">
        <p class="eyebrow">CONTENTS</p>
        {toc}
        <a class="text-link" href="docs/lectures/2026-11-budget-strategy.md">원본 마크다운 보기</a>
      </aside>
      <article class="lecture-body">
        <p class="eyebrow">LECTURE NOTE · 2026.11</p>
        {body}
      </article>
    </main>

    <footer class="footer section-shell">
      <div><strong>국가예산 나침반</strong><p>강의 녹취를 정리한 참고 자료입니다. 강사의 경험담·관행 설명이 포함되어 있으며 공식 지침이 아닙니다.</p></div>
      <div class="footer-meta"><span>정리 기준일 2026-11-09</span><a href="index.html">도구로 돌아가기</a><a href="#top">맨 위로 ↑</a></div>
    </footer>
  </body>
</html>
"""


def build() -> None:
    text = SRC.read_text(encoding="utf-8")
    md = markdown.Markdown(
        extensions=["tables", "fenced_code", "toc", "sane_lists"],
        extension_configs={"toc": {"toc_depth": "2-2"}},
    )
    body = md.convert(text)
    toc = md.toc

    # [강의]·[확인]·[우리 기관] 표시를 색 배지로 바꿉니다.
    for mark, (cls, label) in BADGES.items():
        badge = f'<span class="badge {cls}">{label}</span>'
        body = body.replace(f"<strong>{mark}</strong>", badge)  # 표시만 굵게 쓴 경우
        body = body.replace(f"<strong>{mark} ", f"{badge}<strong>")  # '**[강의] 제목**' 처럼 붙여 쓴 경우

    # 표는 좁은 화면에서 옆으로 밀어 볼 수 있게 감쌉니다.
    body = body.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
    # 외부 링크는 새 창으로 엽니다.
    body = re.sub(r'<a href="(https?://[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', body)

    OUT.write_text(TEMPLATE.replace("{toc}", toc).replace("{body}", body), encoding="utf-8")
    print(f"만들었습니다: {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(build())
