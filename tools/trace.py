"""Trace a flat-coloured picture (an anime cel, a poster) into SVG colour regions for a backdrop.

The picture is placed on the 1600 x 1000 backdrop canvas (uniform scale, an x/y offset), optionally faded toward a
ground colour across the conversation column (RULES.md, rule 1), reduced to a few colours, and every colour region is
traced into a polygon path (holes kept with even-odd). Paths are stacked from the most common colour up, each with a
thin stroke of its own colour so no seam shows between neighbours. Pure vector: the scene can animate (an embedded
raster image would stop every animation in it).

Needs Python with numpy and opencv (cv2). Use it from a scene's build script:

    from trace import trace_picture
    svg_body, stats = trace_picture('ref.png', scale=0.926, dx=-60, dy=0, colors=14, fade=(432, 1250, '#f4d6b4', 0.15))

Only trace art you may use. A scene traced from someone else's artwork is for your own use: keep it out of a public
repository (put it under private/, which .gitignore leaves out).
"""
import cv2
import numpy as np

W, H = 1600, 1000


def _hex(bgr):
    b, g, r = (int(v) for v in bgr)
    return f'#{r:02x}{g:02x}{b:02x}'


def place(path, scale, dx, dy, work=0.6, background=(0, 0, 0)):
    """The picture on the canvas at `work` resolution (BGR), uniform `scale`, offset (dx, dy) in canvas units."""
    src = cv2.imread(path, cv2.IMREAD_COLOR)
    if src is None:
        raise SystemExit(f'cannot read {path}')
    cw, ch = int(W * work), int(H * work)
    m = np.float32([[scale * work, 0, dx * work], [0, scale * work, dy * work]])
    return cv2.warpAffine(src, m, (cw, ch), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_REPLICATE)


def fade_band(img, x0, x1, ground_hex, keep, ramp=100, work=0.6):
    """Blend toward the ground colour between x0 and x1 (canvas units), leaving `keep` of the picture in the middle."""
    g = ground_hex.lstrip('#')
    ground = np.array([int(g[4:6], 16), int(g[2:4], 16), int(g[0:2], 16)], np.float32)
    xs = np.arange(img.shape[1], dtype=np.float32) / work
    w = np.ones_like(xs)  # weight of the picture
    inside = (xs >= x0) & (xs <= x1)
    w[inside] = keep
    up = (xs > x0 - 0) & (xs < x0 + ramp)
    w[up] = 1 - (1 - keep) * ((xs[up] - x0) / ramp)
    down = (xs > x1 - ramp) & (xs < x1)
    w[down] = 1 - (1 - keep) * ((x1 - xs[down]) / ramp)
    w = w[None, :, None]
    return (img.astype(np.float32) * w + ground * (1 - w)).clip(0, 255).astype(np.uint8)


def quantize(img, colors, blur=5):
    """k-means in Lab after a median blur (paper grain and noise make specks otherwise). Returns labels, BGR centres."""
    smooth = cv2.medianBlur(img, blur) if blur else img
    lab = cv2.cvtColor(smooth, cv2.COLOR_BGR2LAB).reshape(-1, 3).astype(np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)
    _, labels, centres = cv2.kmeans(lab, colors, None, criteria, 3, cv2.KMEANS_PP_CENTERS)
    centres_bgr = cv2.cvtColor(centres.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2BGR).reshape(-1, 3)
    return majority(labels.reshape(img.shape[:2]), colors), centres_bgr


def majority(labels, k, size=5):
    """Each pixel takes the most common label around it: thin slivers (anti-aliased edges) join a neighbour."""
    votes = np.stack([cv2.boxFilter((labels == i).astype(np.float32), -1, (size, size)) for i in range(k)])
    return votes.argmax(0).astype(np.int32)


def assign(img, centres_bgr, blur=3):
    """Labels for `img` against a fixed palette (nearest in Lab)."""
    smooth = cv2.medianBlur(img, blur) if blur else img
    lab = cv2.cvtColor(smooth, cv2.COLOR_BGR2LAB).reshape(-1, 1, 3).astype(np.float32)
    pal = cv2.cvtColor(centres_bgr.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_BGR2LAB).reshape(1, -1, 3).astype(np.float32)
    labels = ((lab - pal) ** 2).sum(-1).argmin(1).reshape(img.shape[:2]).astype(np.int32)
    return majority(labels, len(centres_bgr), 3)


def trace_labels(labels, centres, work=0.6, epsilon=1.1, min_area=18, seam=1.4, origin=(0, 0)):
    """One path per colour, most common colour first. Coordinates in canvas units (integers)."""
    order = np.argsort(-np.bincount(labels[labels >= 0].ravel(), minlength=len(centres)))
    k = 1 / work
    parts = []
    points = 0
    for idx in order:
        mask = (labels == idx).astype(np.uint8) * 255
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
        if hierarchy is None:
            continue
        d = []
        for c, h in zip(contours, hierarchy[0]):
            area = abs(cv2.contourArea(c))
            if area < min_area:
                continue
            poly = cv2.approxPolyDP(c, epsilon, True).reshape(-1, 2)
            if len(poly) < 3:
                continue
            ox, oy = origin
            pts = [(int(round(ox + x * k)), int(round(oy + y * k))) for x, y in poly]
            pts = [p for i, p in enumerate(pts) if i == 0 or p != pts[i - 1]]
            d.append('M' + 'L'.join(f'{x} {y}' for x, y in pts) + 'Z')
            points += len(pts)
        if d:
            col = _hex(centres[idx])
            parts.append(f'<path fill="{col}" stroke="{col}" stroke-width="{seam}" stroke-linejoin="round" fill-rule="evenodd" d="{"".join(d)}"/>')
    return ''.join(parts), {'colours': len(parts), 'points': points}


def trace_picture(path, scale, dx, dy, colors=14, work=0.6, epsilon=1.1, min_area=18, blur=5, rois=(), flat=None):
    """Place, quantize, trace; then detail passes. Returns (svg markup, stats).

    flat: (x0, x1, hex) a band filled with one colour before tracing, for the part a scene covers anyway.

    rois: (x, y, w, h, extra_colors, work) boxes in canvas units traced again at their own resolution, with the global
    palette plus `extra_colors` found inside the box, clipped to the box and drawn on top. Background inside a box
    keeps the global colours, so its edge does not show; a figure inside it gets colours of its own (hair, skin).
    """
    img = place(path, scale, dx, dy, work)
    if flat is not None:
        # a band the scene paints over anyway (the conversation column): one flat colour, so it costs no paths
        fx0, fx1, fhex = flat
        g = fhex.lstrip('#')
        img[:, int(fx0 * work):int(fx1 * work)] = (int(g[4:6], 16), int(g[2:4], 16), int(g[0:2], 16))
    labels, centres = quantize(img, colors, blur)
    body, stats = trace_labels(labels, centres, work, epsilon, min_area)
    out = [body]
    for i, (x, y, w, h, extra, rwork) in enumerate(rois):
        big = place(path, scale, dx, dy, rwork)
        x0, y0, x1, y1 = (int(v * rwork) for v in (x, y, x + w, y + h))
        crop = big[y0:y1, x0:x1]
        _, own = quantize(crop, extra, 3)
        palette = np.concatenate([centres, own])
        lab = assign(crop, palette)
        # Keep the detail pass only on the figure: pixels that took a colour of their own, and a small margin round
        # them. Everywhere else the global trace shows, so the box leaves no edge.
        figure = (lab >= len(centres)).astype(np.uint8)
        figure = cv2.morphologyEx(figure, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        keep = cv2.dilate(figure, np.ones((7, 7), np.uint8)).astype(bool)
        lab = np.where(keep, lab, -1)
        roi_body, roi_stats = trace_labels(lab, palette, rwork, epsilon, max(4, min_area // 3), origin=(x, y))
        out.append(f'<clipPath id="roi{i}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath><g clip-path="url(#roi{i})">{roi_body}</g>')
        stats[f'roi{i}'] = roi_stats
    markup = ''.join(out)
    stats['chars'] = len(markup)
    return markup, stats
