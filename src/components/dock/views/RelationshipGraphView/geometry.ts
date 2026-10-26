import { CARD_GAP, NODE_GAP } from './constants';

/**
 * Calculates exact perimeter anchor coordinate on the outer boundary of a target node
 * with an offset/margin, preventing arrowhead markers from clipping under cards or inverting.
 * Uses strict Ray-Box intersection for cards and Ray-Circle intersection for junctions.
 */
export function getPerimeterAnchor(
  from: { cx: number; cy: number },
  to: { cx: number; cy: number; isJunction: boolean },
  padding: number = 2,
  arrowOffset: number = 0
): { x: number; y: number } {
  let dx = from.cx - to.cx;
  let dy = from.cy - to.cy;
  let dist = Math.hypot(dx, dy);

  // If distance is negligible, clamp to minimal distance so vector never inverts
  if (dist < 0.0001) {
    dx = 1;
    dy = 0;
    dist = 1;
  }

  const ux = dx / dist;
  const uy = dy / dist;

  // Ray-Circle intersection for junction nodes
  if (to.isJunction) {
    const radius = 14 + padding;
    return {
      x: Math.round(to.cx + ux * (radius + arrowOffset)),
      y: Math.round(to.cy + uy * (radius + arrowOffset)),
    };
  }

  // Ray-Box intersection for rectangular Character Cards (exact 160x72px card)
  const effHalfW = 80 + padding;
  const effHalfH = 36 + padding;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Calculate hit parameter t along direction vector
  const tX = absDx > 0.00001 ? effHalfW / absDx : Infinity;
  const tY = absDy > 0.00001 ? effHalfH / absDy : Infinity;
  const tHit = Math.min(tX, tY);

  const intersectX = to.cx + dx * tHit;
  const intersectY = to.cy + dy * tHit;

  return {
    x: Math.round(intersectX + ux * arrowOffset),
    y: Math.round(intersectY + uy * arrowOffset),
  };
}

/**
 * Resolves boundary collision and minimum spacing between graph elements.
 * Shapes:
 * - Character Cards: Rectangles with dimensions 160x72px (hw = 80, hh = 36).
 * - Junction Nodes: Circles with radius 14px (hw = 14, hh = 14).
 * Spacing is measured uniformly from the exterior borders of elements rather than center-to-center.
 */
export function resolveNodeSeparation(
  curX: number,
  curY: number,
  isJuncCurrent: boolean,
  otherX: number,
  otherY: number,
  isJuncOther: boolean
): { x: number; y: number } {
  const gap = !isJuncCurrent && !isJuncOther ? CARD_GAP : NODE_GAP;

  const hwCurrent = isJuncCurrent ? 14 : 80;
  const hhCurrent = isJuncCurrent ? 14 : 36;
  const hwOther = isJuncOther ? 14 : 80;
  const hhOther = isJuncOther ? 14 : 36;

  let curCx = curX + hwCurrent;
  let curCy = curY + hhCurrent;
  const othCx = otherX + hwOther;
  const othCy = otherY + hhOther;

  // Case 1: Both are circular junction nodes (Radius 14px each)
  if (isJuncCurrent && isJuncOther) {
    let dx = curCx - othCx;
    let dy = curCy - othCy;
    let dist = Math.hypot(dx, dy);
    const minDist = 14 + 14 + gap;

    if (dist < minDist) {
      if (dist < 0.0001) {
        dx = 1;
        dy = 0;
        dist = 1;
      }
      curCx = othCx + (dx / dist) * minDist;
      curCy = othCy + (dy / dist) * minDist;
    }
    return {
      x: Math.round(curCx - 14),
      y: Math.round(curCy - 14),
    };
  }

  // Case 2: Dragged node is Junction (Circle r=14), Obstacle is Card (Box 160x72)
  if (isJuncCurrent && !isJuncOther) {
    const relX = curCx - othCx;
    const relY = curCy - othCy;

    const clampedX = Math.max(-80, Math.min(80, relX));
    const clampedY = Math.max(-36, Math.min(36, relY));

    const sepX = relX - clampedX;
    const sepY = relY - clampedY;
    const sepDist = Math.hypot(sepX, sepY);
    const targetDist = 14 + gap;

    if (sepDist < targetDist) {
      if (sepDist > 0.0001) {
        const factor = targetDist / sepDist;
        curCx = othCx + clampedX + sepX * factor;
        curCy = othCy + clampedY + sepY * factor;
      } else {
        const dRight = 80 - relX;
        const dLeft = relX - (-80);
        const dBottom = 36 - relY;
        const dTop = relY - (-36);
        const minD = Math.min(dRight, dLeft, dBottom, dTop);

        if (minD === dRight) curCx = othCx + 80 + targetDist;
        else if (minD === dLeft) curCx = othCx - 80 - targetDist;
        else if (minD === dBottom) curCy = othCy + 36 + targetDist;
        else curCy = othCy - 36 - targetDist;
      }
    }
    return {
      x: Math.round(curCx - 14),
      y: Math.round(curCy - 14),
    };
  }

  // Case 3: Dragged node is Card (Box 160x72), Obstacle is Junction (Circle r=14)
  if (!isJuncCurrent && isJuncOther) {
    const relX = othCx - curCx;
    const relY = othCy - curCy;

    const clampedX = Math.max(-80, Math.min(80, relX));
    const clampedY = Math.max(-36, Math.min(36, relY));

    const sepX = relX - clampedX;
    const sepY = relY - clampedY;
    const sepDist = Math.hypot(sepX, sepY);
    const targetDist = 14 + gap;

    if (sepDist < targetDist) {
      if (sepDist > 0.0001) {
        const factor = targetDist / sepDist;
        const newRelX = clampedX + sepX * factor;
        const newRelY = clampedY + sepY * factor;
        curCx = othCx - newRelX;
        curCy = othCy - newRelY;
      } else {
        const dRight = 80 - relX;
        const dLeft = relX - (-80);
        const dBottom = 36 - relY;
        const dTop = relY - (-36);
        const minD = Math.min(dRight, dLeft, dBottom, dTop);

        if (minD === dRight) curCx = othCx - 80 - targetDist;
        else if (minD === dLeft) curCx = othCx + 80 + targetDist;
        else if (minD === dBottom) curCy = othCy - 36 - targetDist;
        else curCy = othCy + 36 + targetDist;
      }
    }
    return {
      x: Math.round(curCx - 80),
      y: Math.round(curCy - 36),
    };
  }

  // Case 4: Both are Character Cards (160x72 each)
  const dx = curCx - othCx;
  const dy = curCy - othCy;
  const gapX = Math.abs(dx) - 160;
  const gapY = Math.abs(dy) - 72;

  // If outside corner diagonal threshold, no collision
  if (gapX > 0 && gapY > 0) {
    const cornerDist = Math.hypot(gapX, gapY);
    if (cornerDist < gap) {
      const scale = gap / (cornerDist || 0.0001);
      const newGapX = gapX * scale;
      const newGapY = gapY * scale;
      curCx = othCx + (dx >= 0 ? 1 : -1) * (160 + newGapX);
      curCy = othCy + (dy >= 0 ? 1 : -1) * (72 + newGapY);
    }
  } else if (gapX < gap && gapY < gap) {
    // Overlapping along flat edges, resolve along axis of least penetration
    const penX = gap - gapX;
    const penY = gap - gapY;

    if (penX < penY) {
      curCx = othCx + (dx >= 0 ? 1 : -1) * (160 + gap);
    } else {
      curCy = othCy + (dy >= 0 ? 1 : -1) * (72 + gap);
    }
  }

  return {
    x: Math.round(curCx - 80),
    y: Math.round(curCy - 36),
  };
}
