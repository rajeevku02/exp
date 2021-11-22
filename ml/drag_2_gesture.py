from geometry import LineEq, LineSegment, dist

active = False
THRESHOLD_1 = 1.5
THRESHOLD_2 = 1.4

def bent_forward(pts):
    eq = LineEq(pts[0], pts[9])
    eq2 = eq.perp(pts[9])
    return eq2.crosses(pts[0], pts[10])

def thumb_middle_opposite(pts):
    eq = LineEq(pts[5], pts[6])
    return eq.crosses(pts[2], pts[10])

def thumb_corsses(pts):
    eq = LineEq(pts[5], pts[6])
    seg = LineSegment(pts[3], pts[4])
    it, _ = seg.intersect_eq(eq)
    return it

def deactivate_drag2():
    global active
    active = False

def check_drag_2(pts):
    bent = bent_forward(pts)
    opp = thumb_middle_opposite(pts)
    crosses = thumb_corsses(pts)
    print("bent: ", bent, ' opp:', opp, ' crosses:', crosses)
    d1 = dist(pts[4], pts[10])
    d2 = dist(pts[10], pts[11])
    factor = 100.0
    if d1 != 0:
        factor = d2 / d1
    global active
    if active:
        if factor < THRESHOLD_2:
            active = False
    else:
        if factor > THRESHOLD_1:
            active = True
    return active