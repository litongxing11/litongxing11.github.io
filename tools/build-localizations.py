#!/usr/bin/env python3
"""Build complete static language editions from English pages and a checked catalog."""
import argparse
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import posixpath
import re
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parent.parent
VERSION = '20261028-2'
ORIGIN = 'https://litongxing11.github.io/'
LANGUAGES = {'en': ('', 'English'), 'zh-Hans': ('zh', '简体中文'), 'fr': ('fr', 'Français')}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
CATALOG = json.loads((ROOT / 'i18n/translations.json').read_text())
MISSING = set()


def normalized(value):
    return re.sub(r'\s+', ' ', value).strip()


def translated(value, language):
    key = normalized(value)
    if language == 'en' or not re.search('[A-Za-z]', key):
        return value
    if key not in CATALOG or not CATALOG[key].get(language):
        MISSING.add(key)
        return value
    leading = value[:len(value) - len(value.lstrip())]
    trailing = value[len(value.rstrip()):]
    return leading + CATALOG[key][language] + trailing


def destination(page, language):
    folder = LANGUAGES[language][0]
    return posixpath.join(folder, page) if folder else page


def relative(target, page, language):
    parent = posixpath.dirname(destination(page, language)) or '.'
    return posixpath.relpath(target, parent)


def language_switch(page, language):
    links = []
    for code, (_, label) in LANGUAGES.items():
        href = relative(destination(page, code), page, language) + '?v=' + VERSION
        current = ' aria-current="page"' if code == language else ''
        links.append(f'<a href="{href}" data-language="{code}" lang="{code}" hreflang="{code}"{current}>{label}</a>')
    label = translated('Choose language', language)
    return f'<div class="language-switch" role="group" aria-label="{label}">' + ''.join(links) + '</div>'


def enhance_english(source, page):
    selector = language_switch(page, 'en')
    if 'class="header-controls"' in source:
        source = re.sub(r'<div class="language-switch".*?</div>', lambda _: selector, source, count=1, flags=re.S)
    else:
        source, count = re.subn(r'(<nav aria-label="Main navigation">.*?</nav>)', lambda m: '<div class="header-controls">' + m[1] + selector + '</div>', source, count=1, flags=re.S)
        if count != 1:
            raise ValueError('Missing main navigation: ' + page)
    source = source.replace('<nav aria-label="Main navigation">', '<nav id="main-navigation" aria-label="Main navigation">')
    if 'data-menu-toggle' not in source:
        menu = '<button class="menu-toggle" type="button" data-menu-toggle aria-controls="main-navigation" aria-expanded="false"><span class="menu-icon" aria-hidden="true"></span>Menu</button>'
        source = source.replace('<div class="header-controls">', menu + '<div class="header-controls">', 1)
    if 'language-preference.js' not in source:
        src = relative('language-preference.js', page, 'en') + '?v=' + VERSION
        source = source.replace('</head>', f'  <script src="{src}"></script>\n</head>', 1)
    document_titles = {
        'litong-xing-resume.pdf': ('Résumé · Litong (Tony) Xing', 'assets/previews/resume.jpg'),
        'differential-privacy-paper.pdf': ('Differential privacy research paper', 'assets/previews/differential-privacy-paper.jpg'),
        'csire-mako-poster.pdf': ('CSIRE Mako research poster', 'assets/photos/csire-mako-poster-preview.jpg'),
        'himcm-2025-paper.pdf': ('Sporting events research paper', 'assets/previews/sporting-events-paper.jpg'),
        'esports-bear-tank.pdf': ('E-sports Club · Bear Tank slides', 'assets/previews/esports-bear-tank.jpg'),
    }
    def document_link(match):
        tag = re.sub(r'\s+data-(?:document-title|preview-image)="[^"]*"', '', match.group())
        for filename, (title, image) in document_titles.items():
            if filename in tag:
                return tag[:-1] + ' data-document-title="' + html.escape(title, quote=True) + '" data-preview-image="' + relative(image, page, 'en') + '?v=' + VERSION + '">'
        return tag
    source = re.sub(r'<a\b[^>]*href="[^"]+\.pdf(?:[?#][^"]*)?"[^>]*>', document_link, source)
    source = re.sub(r'\s*<!-- site-tools:start -->.*?<!-- site-tools:end -->\s*', '', source, flags=re.S)
    tools = '''\n<!-- site-tools:start -->
<div class="reading-progress" aria-hidden="true"></div>
<div class="copy-toast" role="status" aria-live="polite"></div>
<dialog class="document-dialog" id="document-preview" aria-labelledby="document-title">
  <div class="document-toolbar"><div><p class="eyebrow">DOCUMENT</p><h2 id="document-title">Document preview</h2></div><button class="dialog-close" type="button" data-preview-close autofocus>Close <span aria-hidden="true">×</span></button></div>
  <p class="document-note">First-page preview · Original document in English.</p>
  <div class="document-canvas" tabindex="0" role="region" aria-label="Document preview"><img class="document-cover" alt="First page of this document"></div>
  <div class="document-actions"><a class="text-link" data-document-open href="" target="_blank" rel="noopener">Open PDF in a new tab ↗</a><a class="text-link" data-document-download href="" download>Download PDF ↓</a></div>
</dialog>
<!-- site-tools:end -->\n'''
    source = re.sub(r'\s*(<script src="(?:\.\./)?script\.js[^\"]*"></script>)', lambda m: tools + m.group(1), source, count=1)
    source = re.sub(r'\s*<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>\s*', '', source)
    metadata = '\n  <link rel="canonical" href="' + ORIGIN + page + '">'
    for code in LANGUAGES:
        metadata += f'\n  <link rel="alternate" hreflang="{code}" href="{ORIGIN + destination(page, code)}">'
    metadata += f'\n  <link rel="alternate" hreflang="x-default" href="{ORIGIN + page}">\n'
    return source.replace('</head>', metadata + '</head>', 1)


class Localizer(HTMLParser):
    def __init__(self, page, language):
        super().__init__(convert_charrefs=True)
        self.page, self.language = page, language
        self.output, self.stack = [], []
        self.raw_depth = 0

    def handle_decl(self, decl):
        self.output.append('<!' + decl + '>')

    def handle_comment(self, data):
        self.output.append('<!--' + data + '-->')

    def rewrite_url(self, value):
        url = urlsplit(value)
        if url.scheme or url.netloc or not url.path:
            return value
        target = posixpath.normpath(posixpath.join(posixpath.dirname(self.page), url.path))
        if target.endswith('.html'):
            target = destination(target, self.language)
        path = relative(target, self.page, self.language)
        return urlunsplit(('', '', path, url.query, url.fragment))

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        native = 'data-language' in attrs
        if tag in {'script', 'style', 'svg'}:
            self.raw_depth += 1
        if self.raw_depth:
            self.output.append(self.get_starttag_text())
        else:
            if tag == 'html':
                attrs['lang'] = self.language
            for name in ('alt', 'aria-label', 'title', 'data-document-title', 'data-copy-success', 'data-copy-error'):
                if attrs.get(name):
                    attrs[name] = translated(attrs[name], self.language)
            if tag == 'meta' and (attrs.get('name') == 'description' or attrs.get('property') in {'og:title', 'og:description'}):
                attrs['content'] = translated(attrs['content'], self.language)
            for name in ('href', 'src', 'data-preview-image'):
                if attrs.get(name):
                    attrs[name] = self.rewrite_url(attrs[name])
            if tag == 'script' and attrs.get('src'):
                attrs['src'] = self.rewrite_url(attrs['src'])
            if tag == 'link' and attrs.get('rel') == 'canonical':
                attrs['href'] = ORIGIN + destination(self.page, self.language)
            if native:
                code = attrs['data-language']
                attrs['href'] = relative(destination(self.page, code), self.page, self.language) + '?v=' + VERSION
                attrs.pop('aria-current', None)
                if code == self.language:
                    attrs['aria-current'] = 'page'
            if tag == 'a' and urlsplit(attrs.get('href', '')).path.endswith('.pdf'):
                attrs['hreflang'] = 'en'
            rendered = ''.join(' ' + key + ('' if val is None else '="' + html.escape(val, quote=True) + '"') for key, val in attrs.items())
            self.output.append('<' + tag + rendered + '>')
        if tag not in VOID:
            self.stack.append((tag, native))

    def handle_startendtag(self, tag, attrs):
        if self.raw_depth:
            self.output.append(self.get_starttag_text())
            return
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        self.output.append('</' + tag + '>')
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
        if tag in {'script', 'style', 'svg'}:
            self.raw_depth -= 1

    def handle_data(self, data):
        if self.raw_depth:
            self.output.append(data)
        else:
            native = any(flag for _, flag in self.stack)
            self.output.append(html.escape(data if native else translated(data, self.language), quote=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='Validate coverage and generated pages without writing.')
    check = parser.parse_args().check
    pages = sorted(ROOT.glob('*.html')) + sorted((ROOT / 'projects').glob('*.html'))
    outputs = {}
    for path in pages:
        page = path.relative_to(ROOT).as_posix()
        source = enhance_english(path.read_text(), page)
        outputs[path] = source
        for language in ('zh-Hans', 'fr'):
            localizer = Localizer(page, language)
            localizer.feed(source)
            output = ''.join(localizer.output)
            # External shared JavaScript must also move up one directory.
            output = re.sub(r'<script src="([^"]+)"', lambda m: '<script src="' + localizer.rewrite_url(m[1]) + '"', output)
            outputs[ROOT / destination(page, language)] = output
    if MISSING:
        raise SystemExit('Missing translations:\n' + '\n'.join(sorted(MISSING)))
    for path, output in outputs.items():
        if check:
            if not path.exists() or path.read_text() != output:
                raise SystemExit('Rebuild localized pages: ' + str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(output)
    print(f'{"Verified" if check else "Built"} {len(outputs)} pages in English, Simplified Chinese, and French; translation coverage is complete.')


if __name__ == '__main__':
    main()
