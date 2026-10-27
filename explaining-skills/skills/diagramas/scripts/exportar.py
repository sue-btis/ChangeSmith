#!/usr/bin/env python3
"""Exporta el diagrama a SVG autonomo y, opcionalmente, a PNG.

    python exportar.py diagrama.html salida.svg
    python exportar.py diagrama.html salida.svg --png salida.png
    python exportar.py diagrama.html salida.svg --png salida.png --scale 3

El SVG que produce es independiente del HTML: lleva la hoja de estilos y la
paleta clara resueltas adentro, asi que se abre en cualquier navegador, en
Figma o en Illustrator.  El PNG se rasteriza con Chrome o Edge en modo
headless, al doble de resolucion por defecto.

Requisitos del HTML de entrada:
  - un bloque <style> que contenga el comentario  /* ---------- diagram text ----------
    y termine antes de la regla  .foot {
  - un unico elemento <svg viewBox="0 0 W H"> ... </svg>
Ambos los cumple assets/plantilla.html.
"""

import argparse
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

# Paleta clara, resuelta sobre el elemento raiz del SVG para que el archivo
# se sostenga solo.  Debe coincidir con el bloque :root de la plantilla.
TOKENS = '''
    svg {
      --dg-bg:#FFFFFF; --dg-surface:#FFFFFF; --dg-ink:#16202E; --dg-ink2:#4C5A6E;
      --dg-rule:#C3D0E0; --navy:#14284B;
      --az-blue:#0F6CBD; --az-blue-d:#0A4D8C; --az-blue-l:#4FA1E3;
      --az-purple:#8661C5; --az-purple-d:#5C2E91; --az-purple-l:#B49BE0;
      --az-teal:#0F7B6C; --az-orange:#DE6B1F; --az-grey:#66748A;
      --font-sans:"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif;
      --font-disp:"Segoe UI Variable Display","Segoe UI Semibold","Segoe UI",sans-serif;
      background:#FFFFFF;
    }
'''

CSS_START = '/* ---------- diagram text ----------'
CSS_END = '.foot {'

BROWSERS = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
]


def find_browser():
    for name in ('google-chrome', 'chromium', 'chrome', 'msedge', 'microsoft-edge'):
        found = shutil.which(name)
        if found:
            return found
    for path in BROWSERS:
        if os.path.exists(path):
            return path
    return None


def build_svg(html_path):
    """Extrae el <svg> del HTML y lo devuelve como documento autonomo."""
    src = io.open(html_path, encoding='utf-8').read()

    try:
        css = src[src.index(CSS_START):src.index(CSS_END)].rstrip()
    except ValueError:
        sys.exit('No encontre el bloque de estilos del diagrama.\n'
                 'El HTML debe tener "%s" y terminar antes de "%s".'
                 % (CSS_START, CSS_END))

    match = re.search(r'<svg viewBox="0 0 (\d+) (\d+)".*?</svg>', src, re.S)
    if not match:
        sys.exit('No encontre un <svg viewBox="0 0 W H"> en el HTML.')

    width, height = match.group(1), match.group(2)
    body = match.group(0)
    inner = body[body.index('>') + 1: body.rindex('</svg>')]

    # href y xlink:href a la vez: los renderizadores viejos (Office) piden xlink
    inner = re.sub(r'<use href="#([\w-]+)"', r'<use xlink:href="#\1" href="#\1"', inner)

    return width, height, (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink"\n'
        '     viewBox="0 0 {w} {h}" width="{w}" height="{h}">\n'
        '  <style>{tokens}\n{css}\n  </style>\n'
        '  <rect x="0" y="0" width="{w}" height="{h}" fill="#FFFFFF"/>\n'
        '{inner}</svg>\n'
    ).format(w=width, h=height, tokens=TOKENS, css=css, inner=inner)


def render_png(svg_path, png_path, width, height, scale):
    browser = find_browser()
    if not browser:
        print('No encontre Chrome ni Edge; me quedo con el SVG.', file=sys.stderr)
        return False

    work = os.path.dirname(os.path.abspath(svg_path)) or '.'
    shim = os.path.join(work, '_shot.html')
    profile = tempfile.mkdtemp(prefix='diag-')

    io.open(shim, 'w', encoding='utf-8').write(
        '<!doctype html><meta charset="utf-8">'
        '<style>html,body{margin:0;padding:0;background:#fff}'
        'img{display:block;width:%spx;height:%spx}</style>'
        '<img src="%s">' % (width, height, os.path.basename(svg_path))
    )

    try:
        subprocess.run([
            browser, '--headless=new', '--disable-gpu', '--hide-scrollbars',
            '--user-data-dir=' + profile,
            '--default-background-color=ffffffff',
            '--force-device-scale-factor=%d' % scale,
            '--window-size=%s,%s' % (width, height),
            '--screenshot=' + os.path.abspath(png_path),
            urllib.request.pathname2url(os.path.abspath(shim)).join(('file:', '')),
        ], check=True, capture_output=True, timeout=180)
    except subprocess.CalledProcessError as err:
        print('El navegador fallo:\n%s' % err.stderr.decode('utf-8', 'replace')[-800:],
              file=sys.stderr)
        return False
    except subprocess.TimeoutExpired:
        print('El navegador no respondio a tiempo.', file=sys.stderr)
        return False
    finally:
        shutil.rmtree(profile, ignore_errors=True)
        if os.path.exists(shim):
            os.remove(shim)

    return os.path.exists(png_path)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('html', help='HTML del diagrama')
    ap.add_argument('svg', help='ruta del SVG a escribir')
    ap.add_argument('--png', help='ruta del PNG a escribir')
    ap.add_argument('--scale', type=int, default=2,
                    help='factor de resolucion del PNG (por defecto 2)')
    args = ap.parse_args()

    width, height, svg = build_svg(args.html)
    io.open(args.svg, 'w', encoding='utf-8').write(svg)
    print('SVG  %s  (%sx%s)' % (args.svg, width, height))

    if args.png:
        if render_png(args.svg, args.png, width, height, args.scale):
            print('PNG  %s  (%sx%s)'
                  % (args.png, int(width) * args.scale, int(height) * args.scale))
            print('\nRevisa el PNG antes de entregar: los solapamientos de texto '
                  'no se ven en el codigo y saltan en la imagen.')
        else:
            sys.exit(1)


if __name__ == '__main__':
    main()
