#!/usr/bin/env python3
"""Set canonical/OG URLs and sitemap after the real GitHub Pages URL is known."""
from pathlib import Path
from urllib.parse import urlsplit
from xml.sax.saxutils import escape
import argparse,re
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('base_url', help='Example: https://OWNER.github.io/tsukinowa-website/')
args=parser.parse_args()
parts=urlsplit(args.base_url)
if parts.scheme!='https' or not parts.hostname or parts.query or parts.fragment:
 parser.error('Use a real HTTPS URL without a query or fragment.')
base=args.base_url.rstrip('/')+'/'
root=Path(__file__).resolve().parents[1]
urls=[]
for page in sorted(root.glob('*.html')):
 url=base+('' if page.name=='index.html' else page.name)
 text=page.read_text()
 canonical=f'<link rel="canonical" href="{escape(url, {chr(34): "&quot;"})}">'
 og=f'<meta property="og:url" content="{escape(url, {chr(34): "&quot;"})}">'
 text=re.sub(r'<!-- CANONICAL:.*?-->|<link rel="canonical"[^>]*>',lambda _:canonical,text)
 text=re.sub(r'<!-- OG_URL:.*?-->|<meta property="og:url"[^>]*>',lambda _:og,text)
 image=f'<meta property="og:image" content="{base}assets/images/og-preview.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="月輪合同会社 内装工事・原状回復のご案内（テスト公開）">'
 text=re.sub(r'<!-- OG_IMAGE:.*?-->|<meta property="og:image"[^>]*>(?:<meta property="og:image:(?:width|height|alt)"[^>]*>)*',lambda _:image,text)
 page.write_text(text)
 urls.append(url)
(root/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+escape(u)+'</loc></url>\n' for u in urls)+'</urlset>\n')
(root/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+base+'sitemap.xml\n')
print('Updated canonical, og:url, sitemap.xml, robots.txt for '+base)
