"""Generate editable SVG illustrations for the README; no third-party packages."""
from html import escape
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'docs' / 'assets'
OUT.mkdir(parents=True, exist_ok=True)


def text(x, y, content, size=18, color='#cbd5e1', weight=400):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}">{escape(content)}</text>'


def rect(x, y, w, h, fill, radius=16, stroke='none'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>'


def svg(height, title, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="{height}" viewBox="0 0 1200 {height}" role="img"><title>{escape(title)}</title><g font-family="Arial, Helvetica, sans-serif">{body}</g></svg>\n'


body = rect(0, 0, 1200, 500, '#101e2b', 24)
body += '<circle cx="1120" cy="70" r="235" fill="#163a43"/><circle cx="1070" cy="45" r="155" fill="#1a4950"/>'
body += text(52, 65, 'AITrendPublisher', 22, '#f8fafc', 700)
body += rect(52, 102, 216, 30, '#214a4b', 15)
body += text(67, 122, 'THE LOCAL PUBLISHING DESK', 11, '#a7f3d0', 700)
body += text(52, 207, 'From signal', 66, '#f8fafc', 700)
body += text(52, 279, 'to story.', 66, '#8ee4c9', 700)
body += text(54, 327, 'AI news. Open-source discoveries.', 22)
body += text(54, 359, 'Articles with an editor in the loop.', 22)
body += text(54, 452, 'DISCOVER  /  DRAFT  /  REFINE  /  WECHAT DRAFT BOX', 13, '#8ee4c9', 700)
# A deliberately illustrated article card, not a fabricated screenshot.
body += rect(687, 88, 445, 340, '#f8fafc', 18)
body += rect(687, 88, 445, 45, '#e2e8f0', 18)
for x, color in [(709, '#f87171'), (727, '#fbbf24'), (745, '#34d399')]:
    body += f'<circle cx="{x}" cy="110" r="5" fill="{color}"/>'
body += text(774, 115, 'YOUR NEXT ARTICLE', 12, '#475569', 700)
body += rect(715, 158, 106, 23, '#d1fae5', 7)
body += text(728, 174, 'EDITOR REVIEW', 10, '#0f766e', 700)
body += text(715, 218, 'A discovery worth sharing', 25, '#172b3a', 700)
body += text(715, 251, 'Clear context. Your perspective.', 16, '#64748b')
for y, w in [(280, 375), (294, 352), (308, 286)]:
    body += rect(715, y, w, 5, '#d5dee5', 2)
body += rect(715, 345, 174, 46, '#0f766e', 10)
body += text(732, 374, 'Send to draft box  →', 15, '#ffffff', 700)
body += text(907, 373, 'You decide when.', 13, '#64748b')
body += text(997, 458, 'WORKFLOW ILLUSTRATION', 9, '#94a3b8')
(OUT / 'hero.svg').write_text(svg(500, 'AITrendPublisher — From signal to story', body))

body = rect(0, 0, 1200, 412, '#f3f7f8', 22)
body += text(40, 47, 'ONE ARTICLE. FOUR CLEAR STEPS.', 14, '#0f766e', 700)
body += text(40, 89, 'A publishing workflow you can follow', 32, '#152d3b', 700)
cards = [
    ('01', 'Find the signal', 'News sites', 'GitHub Trending + README', '#dbeafe', '#1d4ed8'),
    ('02', 'Prepare a draft', 'Mode-specific processing', 'Text + image providers', '#ede9fe', '#7c3aed'),
    ('03', 'Make it yours', 'Markdown + preview', 'Review, edit, refine', '#ccfbf1', '#0f766e'),
    ('04', 'Create a draft', 'WeChat draft box', 'Send from WeChat later', '#fef3c7', '#a16207'),
]
for i, (number, title, line1, line2, tint, ink) in enumerate(cards):
    x = 40 + i * 286
    body += rect(x, 124, 258, 185, '#ffffff', 14, '#dbe5e9')
    body += rect(x + 20, 143, 39, 31, tint, 8)
    body += text(x + 29, 165, number, 17, ink, 700)
    body += text(x + 20, 211, title, 21, '#152d3b', 700)
    body += text(x + 20, 247, line1, 15, '#526575')
    body += text(x + 20, 273, line2, 15, '#526575')
    if i < 3:
        body += text(x + 265, 223, '→', 23, '#69838d', 700)
body += rect(40, 331, 1116, 49, '#e2eeec', 10)
body += text(60, 361, 'UI: review before draft upload  ·  Deno + TypeScript  ·  Local-first  ·  Scheduled runs are opt-in', 16, '#365d59')
(OUT / 'workflow.svg').write_text(svg(412, 'Discover, prepare, edit, and create a WeChat draft', body))
print('Generated hero.svg and workflow.svg')
