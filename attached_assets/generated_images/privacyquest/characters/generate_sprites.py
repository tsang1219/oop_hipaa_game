"""
Generate chibi top-down RPG character spritesheets for PrivacyQuest.

Each spritesheet is 96x128 pixels:
  - 3 columns × 4 rows
  - Frame size: 32×32 pixels
  - Row 0: Walk Down  (facing camera) — idle, step-left, step-right
  - Row 1: Walk Left                  — idle, step-left, step-right
  - Row 2: Walk Right                 — idle, step-left, step-right
  - Row 3: Walk Up    (facing away)   — idle, step-left, step-right

Character design: Chibi top-down RPG (Zelda/Pokemon LTTP style)
  - Large head (10×10), compact body (8×6), short legs
  - Distinctive outfits by hospital role
  - Diverse skin tones across cast

License: Original work, created for PrivacyQuest (CC0)
"""

from PIL import Image, ImageDraw
import os

OUT = os.path.dirname(os.path.abspath(__file__))

# ── color helpers ────────────────────────────────────────────────────────────
def rgb(h: str):
    h = h.lstrip('#')
    r = int(h[0:2], 16); g = int(h[2:4], 16); b = int(h[4:6], 16)
    return (r, g, b, 255)

def rgba(h: str, a: int):
    c = rgb(h); return (c[0], c[1], c[2], a)

def darken(c, amount=40):
    return (max(0, c[0]-amount), max(0, c[1]-amount), max(0, c[2]-amount), c[3] if len(c)==4 else 255)

def lighten(c, amount=40):
    return (min(255, c[0]+amount), min(255, c[1]+amount), min(255, c[2]+amount), c[3] if len(c)==4 else 255)

# ── skin tones ───────────────────────────────────────────────────────────────
SKIN = {
    'pale':       rgb('FFE0BD'),
    'peach':      rgb('F5C5A3'),
    'tan':        rgb('D4956A'),
    'olive':      rgb('C68642'),
    'brown':      rgb('8D5524'),
    'dark':       rgb('5C3317'),
}

HAIR = {
    'blonde':     rgb('F5C542'),
    'auburn':     rgb('8B3A0F'),
    'black':      rgb('1C1C1C'),
    'brown':      rgb('5C3317'),
    'gray':       rgb('9E9E9E'),
    'white':      rgb('F0F0F0'),
    'red':        rgb('A0230A'),
    'dark_brown': rgb('3B1F0C'),
}

# Shared colors
OUTLINE  = rgb('1A1A2E')
EYE      = rgb('1A1A2E')
EYE_HL   = (255, 255, 255, 255)
MOUTH    = rgb('B06040')
BLUSH    = rgba('F48FB1', 180)
SHOE_DK  = rgb('111111')
SHOE_MED = rgb('333333')
PANTS_DK = rgb('1A252F')
BADGE    = rgb('F9CA24')
BADGE_DK = rgb('C09010')
STET_SILVER = rgb('AAAAAA')
STET_DARK   = rgb('555555')

# ── drawing helpers ──────────────────────────────────────────────────────────
def px(draw, x, y, c):
    if 0 <= x < 32 and 0 <= y < 32:
        draw.point([(x, y)], fill=c)

def rect(draw, x, y, w, h, c):
    if w <= 0 or h <= 0: return
    draw.rectangle([x, y, x+w-1, y+h-1], fill=c)

def hline(draw, x, y, w, c):
    rect(draw, x, y, w, 1, c)

def vline(draw, x, y, h, c):
    rect(draw, x, y, 1, h, c)

def outline_rect(draw, x, y, w, h, fill, edge=OUTLINE):
    rect(draw, x, y, w, h, fill)
    hline(draw, x, y, w, edge)           # top
    hline(draw, x, y+h-1, w, edge)       # bottom
    vline(draw, x, y, h, edge)           # left
    vline(draw, x+w-1, y, h, edge)       # right


# ────────────────────────────────────────────────────────────────────────────
#  FACING DOWN (front view)
# ────────────────────────────────────────────────────────────────────────────
def draw_down(draw, skin, hair, shirt, pant, shoe=SHOE_MED,
              badge=False, stet=False, coat=False, coat_c=None):
    """
    Chibi front view. walk=0 idle, 1 left step, 2 right step.
    Width: head 12px (x=10..21), body 10px (x=11..20)
    """
    # ── shadow (subtle oval below feet) ──
    hline(draw, 13, 30, 6, rgba('000000', 60))

    # ── SHOES ──
    # idle: both feet side by side at y=26
    rect(draw, 11, 26, 5, 3, shoe)
    rect(draw, 17, 26, 5, 3, shoe)
    px(draw, 11, 26, darken(shoe)); px(draw, 15, 26, darken(shoe))
    px(draw, 17, 26, darken(shoe)); px(draw, 21, 26, darken(shoe))
    px(draw, 11, 28, OUTLINE); px(draw, 15, 28, OUTLINE)
    px(draw, 17, 28, OUTLINE); px(draw, 21, 28, OUTLINE)

    # ── LEGS / PANTS ──
    rect(draw, 11, 21, 5, 5, pant)
    rect(draw, 17, 21, 5, 5, pant)
    vline(draw, 11, 21, 5, darken(pant))
    vline(draw, 15, 21, 5, darken(pant))
    vline(draw, 17, 21, 5, darken(pant))
    vline(draw, 21, 21, 5, darken(pant))
    hline(draw, 11, 21, 5, OUTLINE)
    hline(draw, 17, 21, 5, OUTLINE)

    # ── BODY / SHIRT ──
    outline_rect(draw, 11, 14, 10, 7, shirt)
    # shading sides and bottom
    vline(draw, 11, 14, 7, darken(shirt))
    vline(draw, 20, 14, 7, darken(shirt))
    hline(draw, 11, 20, 10, darken(shirt))

    # White coat overlay (doctor)
    if coat and coat_c:
        rect(draw, 11, 14, 3, 6, coat_c)   # left lapel
        rect(draw, 18, 14, 3, 6, coat_c)   # right lapel
        vline(draw, 11, 14, 6, darken(coat_c))
        vline(draw, 20, 14, 6, darken(coat_c))

    # Collar / neck
    rect(draw, 15, 14, 2, 2, skin)

    # Stethoscope
    if stet:
        px(draw, 13, 17, STET_SILVER)
        px(draw, 14, 17, STET_SILVER)
        px(draw, 15, 17, STET_SILVER)
        px(draw, 16, 18, STET_SILVER)
        px(draw, 16, 19, STET_DARK)

    # Badge/lanyard (clip on chest)
    if badge:
        rect(draw, 17, 15, 3, 2, BADGE)
        hline(draw, 17, 15, 3, BADGE_DK)
        px(draw, 19, 16, OUTLINE)

    # ── HEAD ──
    outline_rect(draw, 10, 3, 12, 11, skin)
    # Side shading
    vline(draw, 10, 4, 9, darken(skin))
    vline(draw, 21, 4, 9, darken(skin))
    hline(draw, 10, 13, 12, darken(skin))

    # Neck
    rect(draw, 14, 13, 4, 2, skin)
    px(draw, 14, 13, darken(skin)); px(draw, 17, 13, darken(skin))

    # ── HAIR ──
    # top strip + side wisps
    rect(draw, 10, 3, 12, 4, hair)
    hline(draw, 10, 3, 12, OUTLINE)
    px(draw, 10, 4, OUTLINE); px(draw, 21, 4, OUTLINE)
    # side hair strands down
    rect(draw, 10, 4, 2, 7, hair)
    rect(draw, 20, 4, 2, 7, hair)
    # small ear bumps
    px(draw, 10, 8, skin); px(draw, 21, 8, skin)
    px(draw, 9, 8, darken(skin)); px(draw, 22, 8, darken(skin))

    # ── EYES ──
    rect(draw, 13, 9, 2, 3, EYE)
    rect(draw, 18, 9, 2, 3, EYE)
    px(draw, 14, 9, EYE_HL)   # highlight top-right of eye
    px(draw, 19, 9, EYE_HL)
    # iris
    px(draw, 13, 10, lighten(EYE, 40))
    px(draw, 18, 10, lighten(EYE, 40))

    # Eyebrows
    hline(draw, 13, 8, 2, darken(hair))
    hline(draw, 18, 8, 2, darken(hair))

    # Nose
    px(draw, 16, 11, darken(skin))

    # Mouth (slight smile)
    px(draw, 14, 12, MOUTH)
    hline(draw, 15, 13, 2, MOUTH)
    px(draw, 17, 12, MOUTH)

    # Blush dots
    px(draw, 12, 11, BLUSH)
    px(draw, 19, 11, BLUSH)


def draw_down_walk(draw, skin, hair, shirt, pant, shoe=SHOE_MED,
                   badge=False, stet=False, coat=False, coat_c=None, step=1):
    """Walk frame: step=1 left foot forward, step=2 right foot forward."""
    # Shadow
    hline(draw, 13, 30, 6, rgba('000000', 60))

    # Legs with step
    if step == 1:
        # left leg forward (lower)
        rect(draw, 11, 20, 5, 6, pant)
        rect(draw, 17, 22, 5, 4, pant)
        rect(draw, 10, 26, 6, 3, shoe)
        rect(draw, 17, 26, 5, 3, shoe)
    else:
        # right leg forward
        rect(draw, 11, 22, 5, 4, pant)
        rect(draw, 17, 20, 5, 6, pant)
        rect(draw, 11, 26, 5, 3, shoe)
        rect(draw, 16, 26, 6, 3, shoe)

    # Leg outlines
    for lx, ly in [(11,20), (17,20)]:
        px(draw, lx, ly, OUTLINE)
    hline(draw, 11, 26, 5, OUTLINE)
    hline(draw, 17, 26, 5, OUTLINE)

    # Body
    outline_rect(draw, 11, 14, 10, 7, shirt)
    vline(draw, 11, 14, 7, darken(shirt))
    vline(draw, 20, 14, 7, darken(shirt))
    hline(draw, 11, 20, 10, darken(shirt))
    if coat and coat_c:
        rect(draw, 11, 14, 3, 6, coat_c)
        rect(draw, 18, 14, 3, 6, coat_c)
    rect(draw, 15, 14, 2, 2, skin)
    if stet:
        px(draw, 13, 17, STET_SILVER); px(draw, 15, 17, STET_SILVER)
        px(draw, 14, 17, STET_SILVER); px(draw, 14, 18, STET_SILVER)
    if badge:
        rect(draw, 17, 15, 3, 2, BADGE)
        hline(draw, 17, 15, 3, BADGE_DK)

    # Head (same as idle)
    outline_rect(draw, 10, 3, 12, 11, skin)
    vline(draw, 10, 4, 9, darken(skin))
    vline(draw, 21, 4, 9, darken(skin))
    hline(draw, 10, 13, 12, darken(skin))
    rect(draw, 14, 13, 4, 2, skin)
    rect(draw, 10, 3, 12, 4, hair)
    hline(draw, 10, 3, 12, OUTLINE)
    rect(draw, 10, 4, 2, 7, hair)
    rect(draw, 20, 4, 2, 7, hair)
    px(draw, 10, 8, skin); px(draw, 21, 8, skin)
    rect(draw, 13, 9, 2, 3, EYE); rect(draw, 18, 9, 2, 3, EYE)
    px(draw, 14, 9, EYE_HL); px(draw, 19, 9, EYE_HL)
    hline(draw, 13, 8, 2, darken(hair)); hline(draw, 18, 8, 2, darken(hair))
    px(draw, 16, 11, darken(skin))
    px(draw, 14, 12, MOUTH); hline(draw, 15, 13, 2, MOUTH); px(draw, 17, 12, MOUTH)
    px(draw, 12, 11, BLUSH); px(draw, 19, 11, BLUSH)


# ────────────────────────────────────────────────────────────────────────────
#  FACING UP (back view)
# ────────────────────────────────────────────────────────────────────────────
def draw_up(draw, skin, hair, shirt, pant, shoe=SHOE_MED,
            badge=False, stet=False, coat=False, coat_c=None):
    # Shadow
    hline(draw, 13, 30, 6, rgba('000000', 60))

    # Shoes
    rect(draw, 11, 26, 5, 3, shoe)
    rect(draw, 17, 26, 5, 3, shoe)
    hline(draw, 11, 28, 5, OUTLINE); hline(draw, 17, 28, 5, OUTLINE)

    # Legs
    rect(draw, 11, 21, 5, 5, pant); rect(draw, 17, 21, 5, 5, pant)
    vline(draw, 11, 21, 5, darken(pant)); vline(draw, 17, 21, 5, darken(pant))

    # Body back view
    outline_rect(draw, 11, 14, 10, 7, shirt)
    vline(draw, 20, 14, 7, darken(shirt))
    hline(draw, 11, 20, 10, darken(shirt))
    if coat and coat_c:
        # coat back shows as a full back panel
        outline_rect(draw, 11, 14, 10, 7, coat_c)
        vline(draw, 11, 14, 7, darken(coat_c))
        vline(draw, 20, 14, 7, darken(coat_c))

    # Neck
    rect(draw, 14, 13, 4, 2, skin)

    # Head back
    outline_rect(draw, 10, 3, 12, 11, skin)
    vline(draw, 21, 4, 9, darken(skin))
    hline(draw, 10, 13, 12, darken(skin))
    rect(draw, 14, 13, 4, 2, skin)

    # Hair (back view = more hair visible, covers more of head)
    rect(draw, 10, 3, 12, 6, hair)
    hline(draw, 10, 3, 12, OUTLINE)
    px(draw, 10, 4, OUTLINE); px(draw, 21, 4, OUTLINE)
    # longer side hair going down
    rect(draw, 10, 4, 2, 8, hair)
    rect(draw, 20, 4, 2, 8, hair)
    # back of hair at bottom (longer hair types)
    hline(draw, 12, 9, 8, hair)

    # Ear bumps (slightly visible from back)
    px(draw, 9, 8, darken(skin)); px(draw, 22, 8, darken(skin))

    # No face from behind — small cowlick detail instead
    px(draw, 15, 4, lighten(hair)); px(draw, 16, 4, lighten(hair))


def draw_up_walk(draw, skin, hair, shirt, pant, shoe=SHOE_MED,
                 badge=False, stet=False, coat=False, coat_c=None, step=1):
    hline(draw, 13, 30, 6, rgba('000000', 60))
    if step == 1:
        rect(draw, 11, 20, 5, 6, pant); rect(draw, 17, 22, 5, 4, pant)
        rect(draw, 10, 26, 6, 3, shoe); rect(draw, 17, 26, 5, 3, shoe)
    else:
        rect(draw, 11, 22, 5, 4, pant); rect(draw, 17, 20, 5, 6, pant)
        rect(draw, 11, 26, 5, 3, shoe); rect(draw, 16, 26, 6, 3, shoe)

    outline_rect(draw, 11, 14, 10, 7, shirt)
    vline(draw, 20, 14, 7, darken(shirt)); hline(draw, 11, 20, 10, darken(shirt))
    if coat and coat_c:
        outline_rect(draw, 11, 14, 10, 7, coat_c)
        vline(draw, 20, 14, 7, darken(coat_c))
    rect(draw, 14, 13, 4, 2, skin)

    outline_rect(draw, 10, 3, 12, 11, skin)
    vline(draw, 21, 4, 9, darken(skin)); hline(draw, 10, 13, 12, darken(skin))
    rect(draw, 14, 13, 4, 2, skin)
    rect(draw, 10, 3, 12, 6, hair)
    hline(draw, 10, 3, 12, OUTLINE)
    rect(draw, 10, 4, 2, 8, hair); rect(draw, 20, 4, 2, 8, hair)
    hline(draw, 12, 9, 8, hair)
    px(draw, 15, 4, lighten(hair)); px(draw, 16, 4, lighten(hair))


# ────────────────────────────────────────────────────────────────────────────
#  FACING LEFT (side view)
# ────────────────────────────────────────────────────────────────────────────
def draw_left(draw, skin, hair, shirt, pant, shoe=SHOE_MED,
              badge=False, stet=False, coat=False, coat_c=None):
    hline(draw, 13, 30, 6, rgba('000000', 60))

    # Back foot
    rect(draw, 14, 22, 4, 4, darken(pant))
    rect(draw, 13, 26, 5, 2, darken(shoe))

    # Body (wider side view for chibi: 8px wide)
    outline_rect(draw, 12, 14, 9, 7, shirt)
    vline(draw, 12, 14, 7, darken(shirt))
    vline(draw, 20, 14, 7, darken(shirt))
    hline(draw, 12, 20, 9, darken(shirt))
    if coat and coat_c:
        # front of coat visible
        rect(draw, 12, 14, 3, 6, coat_c)
        vline(draw, 12, 14, 6, darken(coat_c))
    if stet:
        # stethoscope tube going down from collar
        px(draw, 14, 16, STET_SILVER); px(draw, 13, 17, STET_SILVER)
        px(draw, 13, 18, STET_DARK)
    if badge:
        rect(draw, 17, 16, 2, 2, BADGE)
        hline(draw, 17, 16, 2, BADGE_DK)

    # Front foot (on top of body)
    rect(draw, 13, 21, 4, 5, pant)
    rect(draw, 11, 26, 6, 3, shoe)
    hline(draw, 11, 26, 6, OUTLINE); px(draw, 11, 28, OUTLINE); px(draw, 16, 28, OUTLINE)

    # Neck
    rect(draw, 14, 13, 4, 2, skin)
    px(draw, 14, 13, darken(skin))

    # Head (side profile left — left side visible)
    outline_rect(draw, 11, 3, 11, 11, skin)
    vline(draw, 11, 4, 9, darken(skin))
    hline(draw, 11, 13, 11, darken(skin))
    # nose protrusion (small bump on left)
    px(draw, 10, 10, skin)
    px(draw, 9, 10, darken(skin))   # nose outline
    rect(draw, 14, 13, 4, 2, skin)

    # Hair side profile
    rect(draw, 11, 3, 11, 5, hair)
    hline(draw, 11, 3, 11, OUTLINE)
    px(draw, 11, 4, OUTLINE)
    # hair back (left side hangs down a bit)
    rect(draw, 20, 4, 2, 7, hair)
    vline(draw, 21, 4, 7, OUTLINE)
    # slight forehead notch
    rect(draw, 11, 6, 2, 5, hair)
    vline(draw, 11, 6, 5, OUTLINE)

    # Ear
    rect(draw, 21, 7, 2, 3, skin)
    vline(draw, 21, 7, 3, darken(skin))

    # Eye (left profile — right eye shows from left view)
    rect(draw, 14, 8, 2, 3, EYE)
    px(draw, 15, 8, EYE_HL)
    px(draw, 14, 9, lighten(EYE, 50))
    hline(draw, 14, 7, 3, darken(hair))  # eyebrow

    # Nose (profile bump detail)
    px(draw, 12, 10, darken(skin))

    # Mouth
    px(draw, 13, 12, MOUTH); px(draw, 14, 12, MOUTH)

    # Blush
    px(draw, 14, 10, BLUSH)


def draw_left_walk(draw, skin, hair, shirt, pant, shoe=SHOE_MED,
                   badge=False, stet=False, coat=False, coat_c=None, step=1):
    hline(draw, 13, 30, 6, rgba('000000', 60))

    if step == 1:   # back leg back, front leg forward
        rect(draw, 14, 24, 4, 3, darken(pant))
        rect(draw, 14, 27, 5, 2, darken(shoe))
        rect(draw, 13, 19, 4, 7, pant)
        rect(draw, 11, 26, 6, 3, shoe)
    else:           # opposite
        rect(draw, 14, 19, 4, 7, darken(pant))
        rect(draw, 14, 26, 5, 3, darken(shoe))
        rect(draw, 13, 21, 4, 5, pant)
        rect(draw, 11, 26, 6, 3, shoe)

    # Body
    outline_rect(draw, 12, 14, 9, 7, shirt)
    vline(draw, 12, 14, 7, darken(shirt)); vline(draw, 20, 14, 7, darken(shirt))
    hline(draw, 12, 20, 9, darken(shirt))
    if coat and coat_c:
        rect(draw, 12, 14, 3, 6, coat_c)
        vline(draw, 12, 14, 6, darken(coat_c))
    if stet:
        px(draw, 14, 16, STET_SILVER); px(draw, 13, 17, STET_SILVER); px(draw, 13, 18, STET_DARK)
    if badge:
        rect(draw, 17, 16, 2, 2, BADGE); hline(draw, 17, 16, 2, BADGE_DK)

    hline(draw, 11, 26, 6, OUTLINE)
    rect(draw, 14, 13, 4, 2, skin); px(draw, 14, 13, darken(skin))

    # Head (same)
    outline_rect(draw, 11, 3, 11, 11, skin)
    vline(draw, 11, 4, 9, darken(skin)); hline(draw, 11, 13, 11, darken(skin))
    px(draw, 10, 10, skin); px(draw, 9, 10, darken(skin))
    rect(draw, 14, 13, 4, 2, skin)
    rect(draw, 11, 3, 11, 5, hair); hline(draw, 11, 3, 11, OUTLINE); px(draw, 11, 4, OUTLINE)
    rect(draw, 20, 4, 2, 7, hair); vline(draw, 21, 4, 7, OUTLINE)
    rect(draw, 11, 6, 2, 5, hair); vline(draw, 11, 6, 5, OUTLINE)
    rect(draw, 21, 7, 2, 3, skin); vline(draw, 21, 7, 3, darken(skin))
    rect(draw, 14, 8, 2, 3, EYE); px(draw, 15, 8, EYE_HL)
    hline(draw, 14, 7, 3, darken(hair))
    px(draw, 12, 10, darken(skin)); px(draw, 13, 12, MOUTH); px(draw, 14, 12, MOUTH)
    px(draw, 14, 10, BLUSH)


# ────────────────────────────────────────────────────────────────────────────
#  FACING RIGHT (side view mirror)
# ────────────────────────────────────────────────────────────────────────────
def draw_right(draw, skin, hair, shirt, pant, shoe=SHOE_MED,
               badge=False, stet=False, coat=False, coat_c=None):
    hline(draw, 13, 30, 6, rgba('000000', 60))

    # Back foot
    rect(draw, 14, 22, 4, 4, darken(pant))
    rect(draw, 14, 26, 5, 2, darken(shoe))

    # Body
    outline_rect(draw, 11, 14, 9, 7, shirt)
    vline(draw, 11, 14, 7, darken(shirt)); vline(draw, 19, 14, 7, darken(shirt))
    hline(draw, 11, 20, 9, darken(shirt))
    if coat and coat_c:
        rect(draw, 17, 14, 3, 6, coat_c)
        vline(draw, 19, 14, 6, darken(coat_c))
    if stet:
        px(draw, 17, 16, STET_SILVER); px(draw, 18, 17, STET_SILVER); px(draw, 18, 18, STET_DARK)
    if badge:
        rect(draw, 13, 16, 2, 2, BADGE); hline(draw, 13, 16, 2, BADGE_DK)

    # Front foot
    rect(draw, 15, 21, 4, 5, pant)
    rect(draw, 15, 26, 6, 3, shoe)
    hline(draw, 15, 26, 6, OUTLINE); px(draw, 15, 28, OUTLINE); px(draw, 20, 28, OUTLINE)

    # Neck
    rect(draw, 14, 13, 4, 2, skin); px(draw, 17, 13, darken(skin))

    # Head (side right)
    outline_rect(draw, 10, 3, 11, 11, skin)
    vline(draw, 20, 4, 9, darken(skin)); hline(draw, 10, 13, 11, darken(skin))
    px(draw, 21, 10, skin); px(draw, 22, 10, darken(skin))
    rect(draw, 14, 13, 4, 2, skin)

    # Hair
    rect(draw, 10, 3, 11, 5, hair); hline(draw, 10, 3, 11, OUTLINE)
    px(draw, 20, 4, OUTLINE)
    rect(draw, 10, 4, 2, 7, hair); vline(draw, 10, 4, 7, OUTLINE)
    rect(draw, 20, 6, 2, 5, hair); vline(draw, 21, 6, 5, OUTLINE)
    # Ear
    rect(draw, 9, 7, 2, 3, skin); vline(draw, 10, 7, 3, darken(skin))

    # Eye (right profile)
    rect(draw, 16, 8, 2, 3, EYE); px(draw, 16, 8, EYE_HL)
    px(draw, 17, 9, lighten(EYE, 50))
    hline(draw, 15, 7, 3, darken(hair))

    # Nose
    px(draw, 19, 10, darken(skin))

    # Mouth
    px(draw, 18, 12, MOUTH); px(draw, 17, 12, MOUTH)

    # Blush
    px(draw, 17, 10, BLUSH)


def draw_right_walk(draw, skin, hair, shirt, pant, shoe=SHOE_MED,
                    badge=False, stet=False, coat=False, coat_c=None, step=1):
    hline(draw, 13, 30, 6, rgba('000000', 60))

    if step == 1:
        rect(draw, 14, 24, 4, 3, darken(pant)); rect(draw, 14, 27, 5, 2, darken(shoe))
        rect(draw, 15, 19, 4, 7, pant); rect(draw, 15, 26, 6, 3, shoe)
    else:
        rect(draw, 14, 19, 4, 7, darken(pant)); rect(draw, 14, 26, 5, 3, darken(shoe))
        rect(draw, 15, 21, 4, 5, pant); rect(draw, 15, 26, 6, 3, shoe)

    outline_rect(draw, 11, 14, 9, 7, shirt)
    vline(draw, 11, 14, 7, darken(shirt)); vline(draw, 19, 14, 7, darken(shirt))
    hline(draw, 11, 20, 9, darken(shirt))
    if coat and coat_c:
        rect(draw, 17, 14, 3, 6, coat_c)
        vline(draw, 19, 14, 6, darken(coat_c))
    if stet:
        px(draw, 17, 16, STET_SILVER); px(draw, 18, 17, STET_SILVER); px(draw, 18, 18, STET_DARK)
    if badge:
        rect(draw, 13, 16, 2, 2, BADGE); hline(draw, 13, 16, 2, BADGE_DK)
    hline(draw, 15, 26, 6, OUTLINE)
    rect(draw, 14, 13, 4, 2, skin); px(draw, 17, 13, darken(skin))

    # Head (same as idle right)
    outline_rect(draw, 10, 3, 11, 11, skin)
    vline(draw, 20, 4, 9, darken(skin)); hline(draw, 10, 13, 11, darken(skin))
    px(draw, 21, 10, skin); px(draw, 22, 10, darken(skin))
    rect(draw, 14, 13, 4, 2, skin)
    rect(draw, 10, 3, 11, 5, hair); hline(draw, 10, 3, 11, OUTLINE); px(draw, 20, 4, OUTLINE)
    rect(draw, 10, 4, 2, 7, hair); vline(draw, 10, 4, 7, OUTLINE)
    rect(draw, 20, 6, 2, 5, hair); vline(draw, 21, 6, 5, OUTLINE)
    rect(draw, 9, 7, 2, 3, skin); vline(draw, 10, 7, 3, darken(skin))
    rect(draw, 16, 8, 2, 3, EYE); px(draw, 16, 8, EYE_HL)
    hline(draw, 15, 7, 3, darken(hair))
    px(draw, 19, 10, darken(skin)); px(draw, 18, 12, MOUTH); px(draw, 17, 12, MOUTH)
    px(draw, 17, 10, BLUSH)


# ── frame dispatcher ─────────────────────────────────────────────────────────
def make_frame(direction: str, walk: int, skin, hair, shirt, pant,
               shoe=SHOE_MED, badge=False, stet=False, coat=False, coat_c=None):
    frame = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(frame)
    kw = dict(skin=skin, hair=hair, shirt=shirt, pant=pant,
              shoe=shoe, badge=badge, stet=stet, coat=coat, coat_c=coat_c)

    if direction == 'down':
        if walk == 0:   draw_down(d, **kw)
        elif walk == 1: draw_down_walk(d, **kw, step=1)
        else:           draw_down_walk(d, **kw, step=2)
    elif direction == 'up':
        if walk == 0:   draw_up(d, **kw)
        elif walk == 1: draw_up_walk(d, **kw, step=1)
        else:           draw_up_walk(d, **kw, step=2)
    elif direction == 'left':
        if walk == 0:   draw_left(d, **kw)
        elif walk == 1: draw_left_walk(d, **kw, step=1)
        else:           draw_left_walk(d, **kw, step=2)
    elif direction == 'right':
        if walk == 0:   draw_right(d, **kw)
        elif walk == 1: draw_right_walk(d, **kw, step=1)
        else:           draw_right_walk(d, **kw, step=2)
    return frame


# ── spritesheet builder ──────────────────────────────────────────────────────
# Layout: 3 cols (idle, walk-a, walk-b) × 4 rows (down, left, right, up)
DIRECTIONS = ['down', 'left', 'right', 'up']
FRAME_W = 32; FRAME_H = 32; COLS = 3; ROWS = 4

def make_spritesheet(name: str, skin, hair, shirt, pant,
                     shoe=SHOE_MED, badge=False, stet=False,
                     coat=False, coat_c=None):
    sheet = Image.new('RGBA', (FRAME_W*COLS, FRAME_H*ROWS), (0, 0, 0, 0))
    for row_i, direction in enumerate(DIRECTIONS):
        for col_i in range(COLS):
            frame = make_frame(direction, col_i, skin, hair, shirt, pant,
                               shoe=shoe, badge=badge, stet=stet,
                               coat=coat, coat_c=coat_c)
            sheet.paste(frame, (col_i*FRAME_W, row_i*FRAME_H))
    out = os.path.join(OUT, f'{name}.png')
    sheet.save(out, 'PNG')
    print(f'  {name:25s} → {sheet.width}×{sheet.height}')
    return out


# ── character roster ─────────────────────────────────────────────────────────
def make_all():
    print('Generating PrivacyQuest character spritesheets...\n')
    os.makedirs(OUT, exist_ok=True)

    # Player: HIPAA trainee — blue shirt, has badge, pale skin, auburn hair
    make_spritesheet('player',
        skin=SKIN['pale'], hair=HAIR['auburn'],
        shirt=rgb('2980B9'), pant=rgb('3D5A73'),
        shoe=rgb('333366'), badge=True)

    # Receptionist: green scrubs, tan skin, dark_brown hair
    make_spritesheet('npc_receptionist',
        skin=SKIN['tan'], hair=HAIR['dark_brown'],
        shirt=rgb('1E8449'), pant=rgb('145A32'),
        shoe=rgb('2C2C2C'))

    # Nurse: blue scrubs, dark brown skin, black hair, stethoscope
    make_spritesheet('npc_nurse',
        skin=SKIN['brown'], hair=HAIR['black'],
        shirt=rgb('2E86C1'), pant=rgb('1A5276'),
        shoe=rgb('1A1A2E'), stet=True)

    # Doctor: teal scrubs under white coat, olive skin, gray hair, stet
    make_spritesheet('npc_doctor',
        skin=SKIN['olive'], hair=HAIR['gray'],
        shirt=rgb('17A589'), pant=rgb('0E6655'),
        shoe=rgb('222222'),
        coat=True, coat_c=rgb('F0F0F0'),
        stet=True)

    # IT Tech: dark polo, peach skin, dark brown hair
    make_spritesheet('npc_it_tech',
        skin=SKIN['peach'], hair=HAIR['dark_brown'],
        shirt=rgb('2C3E50'), pant=rgb('1A252F'),
        shoe=rgb('111111'))

    # Compliance Officer: navy uniform, dark skin, black hair
    make_spritesheet('npc_officer',
        skin=SKIN['dark'], hair=HAIR['black'],
        shirt=rgb('1B2631'), pant=rgb('0E1520'),
        shoe=rgb('080808'))

    # Boss/Director: purple suit, peach skin, white hair
    make_spritesheet('npc_boss',
        skin=SKIN['peach'], hair=HAIR['white'],
        shirt=rgb('7D3C98'), pant=rgb('4A235A'),
        shoe=rgb('1A0A25'))

    # General Staff: warm orange scrubs, tan skin, blonde hair
    make_spritesheet('npc_staff',
        skin=SKIN['tan'], hair=HAIR['blonde'],
        shirt=rgb('E67E22'), pant=rgb('A04000'),
        shoe=rgb('5D4037'))

    # Patient: hospital gown (light blue-gray), olive skin, red hair
    make_spritesheet('npc_patient',
        skin=SKIN['olive'], hair=HAIR['red'],
        shirt=rgb('AEC6CF'), pant=rgb('96A9B5'),
        shoe=rgb('C8D6E0'))

    # Visitor: warm yellow casual, brown skin, brown hair
    make_spritesheet('npc_visitor',
        skin=SKIN['brown'], hair=HAIR['brown'],
        shirt=rgb('D4AC0D'), pant=rgb('6B5535'),
        shoe=rgb('5C4220'))

    print('\nDone! 10 spritesheets generated.')
    print('Format: 96×128px  |  3 cols × 4 rows  |  32×32 frames')
    print('Row order: 0=down, 1=left, 2=right, 3=up')
    print('Col order: 0=idle, 1=walk-a, 2=walk-b')


if __name__ == '__main__':
    make_all()
