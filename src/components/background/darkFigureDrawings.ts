// Figure drawings adapted from the user-supplied dual-sided point-cloud demo.
// These canvases supply the particle silhouettes and shading.
export function buildExoSuitCanvas() {
  const c = document.createElement('canvas');
  c.width = 540;
  c.height = 920;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const context: CanvasRenderingContext2D = ctx;
  context.clearRect(0, 0, c.width, c.height);

  function drawShadedPoly(points: number[][], c0: string, c1: string, c2: string, c3 = '#101014', stroke: string | number = '#060608', width: number | string = 2, direction = 'diag') {
    const strokeCol = typeof stroke === 'number' ? '#060608' : stroke;
    const lw = typeof stroke === 'number' ? stroke : Number(width);
    const dir = typeof width === 'string' ? width : direction;
    context.save();
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) context.lineTo(points[i][0], points[i][1]);
    context.closePath();

    let minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
    for (const [px, py] of points) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const grad = dir === 'horiz'
      ? context.createLinearGradient(minX, (minY + maxY) * 0.5, maxX, (minY + maxY) * 0.5)
      : context.createLinearGradient(minX, minY, maxX, maxY);
    grad.addColorStop(0.0, c0);
    grad.addColorStop(0.32, c1);
    grad.addColorStop(0.72, c2);
    grad.addColorStop(1.0, c3);

    context.fillStyle = grad;
    context.fill();
    if (lw > 0) {
      context.lineWidth = lw;
      context.strokeStyle = strokeCol;
      context.stroke();
    }
    context.restore();
  }

  function drawSeamLine(pts: number[][], col = '#070709', lw = 1.8) {
    context.save();
    context.beginPath();
    context.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) context.lineTo(pts[i][0], pts[i][1]);
    context.strokeStyle = col;
    context.lineWidth = lw;
    context.stroke();
    context.restore();
  }

  // --- A. LEGS (Heroic Contrapposto Stance) ---
  // Viewer's Left Leg (Forward weight-bearing leg)
  // Upper thigh red/titanium inner structure
  drawShadedPoly([[214, 438], [254, 444], [228, 608], [182, 594]], '#94a3b8', '#475569', '#1e293b', '#09090b', 2.2);
  // Sculpted Gold Outer Thigh Plate (Bright metallic luminance)
  drawShadedPoly([
    [190, 448], [222, 462], [234, 520], [216, 594],
    [188, 598], [168, 535], [174, 474]
  ], '#ffffff', '#f8fafc', '#94a3b8', '#334155', 2.2, 'horiz');
  // Inner Thigh Gold Accent Strip
  drawShadedPoly([[228, 495], [248, 488], [238, 578], [220, 586]], '#f8fafc', '#cbd5e1', '#475569', '#09090b', 1.8);
  // Thigh Mechanical Seam Lines
  drawSeamLine([[182, 488], [212, 505], [204, 584]], '#09090b', 1.8);
  drawSeamLine([[172, 536], [224, 548]], '#e2e8f0', 1.2);

  // Left Mechanical Knee Joint & Sculpted Patella Cap
  drawShadedPoly([[174, 592], [224, 596], [218, 646], [170, 642]], '#ffffff', '#cbd5e1', '#334155', '#09090b', 2.4);
  drawShadedPoly([[182, 602], [214, 604], [210, 634], [180, 632]], '#f8fafc', '#94a3b8', '#1e293b', '#09090b', 1.6);

  // Left Lower Shin Greave & Calf
  drawShadedPoly([
    [168, 638], [218, 642], [204, 745], [178, 838],
    [142, 834], [148, 725]
  ], '#e2e8f0', '#94a3b8', '#334155', '#09090b', 2.4, 'horiz');
  // Shin Center Ridge Highlight
  drawSeamLine([[188, 646], [176, 740], [162, 830]], '#ffffff', 2.2);
  drawSeamLine([[152, 718], [198, 726]], '#09090b', 1.8);

  // Left Armored Boot with Toe Articulation Ridges
  drawShadedPoly([
    [138, 832], [178, 836], [182, 874], [164, 892],
    [118, 892], [114, 872]
  ], '#cbd5e1', '#64748b', '#1e293b', '#09090b', 2.4);
  for (let ty = 852; ty <= 876; ty += 8) {
    drawSeamLine([[122, ty], [174, ty + 2]], '#ffffff', 1.3);
  }

  // Viewer's Right Leg (Stepped back & angled outward)
  drawShadedPoly([[284, 444], [336, 438], [358, 594], [306, 606]], '#94a3b8', '#475569', '#1e293b', '#09090b', 2.2);
  // Right Sculpted Gold Outer Thigh Plate
  drawShadedPoly([
    [312, 460], [344, 448], [362, 480], [366, 545],
    [344, 600], [314, 592], [302, 522]
  ], '#ffffff', '#f8fafc', '#94a3b8', '#334155', 2.2, 'horiz');
  // Inner Thigh Accent
  drawShadedPoly([[288, 488], [308, 496], [314, 584], [296, 576]], '#f8fafc', '#cbd5e1', '#475569', '#09090b', 1.8);
  drawSeamLine([[346, 488], [322, 508], [330, 586]], '#09090b', 1.8);

  // Right Knee Cap
  drawShadedPoly([[308, 596], [356, 594], [358, 644], [312, 646]], '#ffffff', '#cbd5e1', '#334155', '#09090b', 2.4);
  drawShadedPoly([[318, 604], [348, 602], [350, 632], [320, 634]], '#f8fafc', '#94a3b8', '#1e293b', '#09090b', 1.6);

  // Right Shin Greave
  drawShadedPoly([
    [312, 642], [360, 640], [374, 735], [378, 824],
    [340, 828], [324, 738]
  ], '#cbd5e1', '#64748b', '#1e293b', '#09090b', 2.4, 'horiz');
  drawSeamLine([[336, 648], [348, 740], [356, 822]], '#f8fafc', 2.0);

  // Right Armored Boot (angled outward to viewer's right)
  drawShadedPoly([
    [338, 822], [378, 820], [418, 846], [416, 864],
    [364, 868], [334, 858]
  ], '#cbd5e1', '#64748b', '#1e293b', '#09090b', 2.4);
  for (let tx = 368; tx <= 398; tx += 9) {
    drawSeamLine([[tx, 834], [tx - 6, 862]], '#ffffff', 1.3);
  }

  // --- B. PELVIS, HIP JOINTS & ARTICULATED ABDOMEN ---
  drawShadedPoly([[214, 412], [326, 412], [312, 466], [270, 482], [228, 466]], '#cbd5e1', '#64748b', '#18181b', '#09090b', 2.4);
  // Hip Mechanical Ball-Joint Housings
  drawShadedPoly([[192, 424], [222, 428], [218, 456], [188, 450]], '#94a3b8', '#475569', '#0f172a', '#09090b', 2.0);
  drawShadedPoly([[318, 428], [348, 424], [352, 450], [322, 456]], '#94a3b8', '#475569', '#0f172a', '#09090b', 2.0);

  // 4 Segmented Abdominal Plates with Specular Center Ridge
  for (let r = 0; r < 4; r++) {
    const yTop = 310 + r * 26;
    const inset = r * 5;
    drawShadedPoly([
      [204 + inset, yTop], [336 - inset, yTop],
      [330 - inset, yTop + 23], [210 + inset, yTop + 23]
    ], '#f1f5f9', '#94a3b8', '#334155', '#09090b', 2.2, 'horiz');
    // Center Ab Vertical Crease
    drawSeamLine([[270, yTop + 2], [270, yTop + 21]], '#1e293b', 1.6);
  }

  // Flank Gold Rib Inlays (Left & Right oblique armor plates)
  drawShadedPoly([[184, 304], [208, 314], [224, 408], [202, 404]], '#ffffff', '#e2e8f0', '#64748b', '#09090b', 2.0);
  drawShadedPoly([[356, 304], [332, 314], [316, 408], [338, 404]], '#ffffff', '#e2e8f0', '#64748b', '#09090b', 2.0);
  // Rib Vent Slats
  for (let ry = 324; ry <= 376; ry += 14) {
    drawSeamLine([[188, ry], [206, ry + 5]], '#09090b', 2.0);
    drawSeamLine([[352, ry], [334, ry + 5]], '#09090b', 2.0);
  }

  // --- C. SCULPTED CHEST CUIRASS, COLLARBONE VENTS & ARC REACTOR ---
  drawShadedPoly([
    [172, 192], [228, 166], [312, 166], [368, 192],
    [354, 306], [270, 326], [186, 306]
  ], '#f8fafc', '#cbd5e1', '#334155', '#09090b', 2.8, 'horiz');

  // Collarbone Silver/Titanium Shoulder Straps & Glowing Shoulder Vents
  drawShadedPoly([[202, 174], [234, 164], [244, 196], [210, 204]], '#ffffff', '#cbd5e1', '#475569', '#09090b', 1.8);
  drawShadedPoly([[338, 174], [306, 164], [296, 196], [330, 204]], '#ffffff', '#cbd5e1', '#475569', '#09090b', 1.8);

  // Pectoral Lower Sculpted Crease & Center Sternum Line
  drawSeamLine([[184, 264], [244, 286], [296, 286], [356, 264]], '#09090b', 2.6);
  drawSeamLine([[186, 260], [244, 282], [296, 282], [354, 260]], '#ffffff', 1.4);
  drawSeamLine([[270, 264], [270, 322]], '#09090b', 2.2);

  // Iconic Rounded-Triangle Chest Arc Reactor with Inner Bezel
  context.save();
  // Outer metallic housing
  context.beginPath();
  context.moveTo(246, 224);
  context.lineTo(294, 224);
  context.quadraticCurveTo(300, 228, 296, 236);
  context.lineTo(276, 266);
  context.quadraticCurveTo(270, 271, 264, 266);
  context.lineTo(244, 236);
  context.quadraticCurveTo(240, 228, 246, 224);
  context.closePath();
  context.fillStyle = '#334155';
  context.fill();
  context.lineWidth = 2.6;
  context.strokeStyle = '#09090b';
  context.stroke();

  // Glowing White Core
  context.beginPath();
  context.moveTo(251, 229);
  context.lineTo(289, 229);
  context.lineTo(272, 260);
  context.lineTo(268, 260);
  context.closePath();
  context.fillStyle = '#ffffff';
  context.shadowColor = '#ffffff';
  context.shadowBlur = 18;
  context.fill();
  context.restore();

  // --- D. LAYERED PAULDRONS, ARMS, GAUNTLETS & CLENCHED FISTS ---
  // Left Arm (Viewer's Left)
  // Layered Shoulder Pauldron
  drawShadedPoly([[128, 212], [184, 184], [182, 256], [122, 252]], '#ffffff', '#cbd5e1', '#334155', '#09090b', 2.4);
  drawSeamLine([[134, 226], [180, 212]], '#09090b', 2.0);
  // Gold Bicep & Tricep Armor Plates
  drawShadedPoly([[124, 252], [174, 256], [162, 344], [112, 336]], '#ffffff', '#f1f5f9', '#64748b', '#09090b', 2.2, 'horiz');
  drawSeamLine([[146, 256], [136, 340]], '#09090b', 2.0);
  // Elbow Mechanical Hinge
  drawShadedPoly([[110, 336], [158, 342], [152, 366], [104, 360]], '#94a3b8', '#475569', '#0f172a', '#09090b', 2.0);
  // Forearm Gauntlet with Dorsal Fin Plate
  drawShadedPoly([[102, 360], [152, 366], [136, 466], [86, 456]], '#e2e8f0', '#94a3b8', '#1e293b', '#09090b', 2.4, 'horiz');
  drawShadedPoly([[82, 412], [106, 416], [98, 472], [76, 464]], '#cbd5e1', '#64748b', '#18181b', '#09090b', 1.8);
  // Left Clenched Armored Fist & Knuckle Ridges
  drawShadedPoly([[82, 456], [134, 466], [138, 504], [108, 514], [78, 496]], '#f1f5f9', '#94a3b8', '#1e293b', '#09090b', 2.4);
  for (let kx = 92; kx <= 124; kx += 10) {
    drawSeamLine([[kx, 482], [kx + 2, 508]], '#09090b', 1.8);
  }

  // Right Arm (Viewer's Right)
  drawShadedPoly([[356, 184], [412, 212], [418, 252], [358, 256]], '#ffffff', '#cbd5e1', '#334155', '#09090b', 2.4);
  drawSeamLine([[360, 212], [406, 226]], '#09090b', 2.0);
  drawShadedPoly([[366, 256], [416, 252], [428, 336], [378, 344]], '#ffffff', '#f1f5f9', '#64748b', '#09090b', 2.2, 'horiz');
  drawSeamLine([[394, 256], [404, 340]], '#09090b', 2.0);
  drawShadedPoly([[382, 342], [430, 336], [436, 360], [388, 366]], '#94a3b8', '#475569', '#0f172a', '#09090b', 2.0);
  drawShadedPoly([[388, 366], [438, 360], [454, 456], [404, 466]], '#e2e8f0', '#94a3b8', '#1e293b', '#09090b', 2.4, 'horiz');
  drawShadedPoly([[434, 416], [458, 412], [464, 464], [442, 472]], '#cbd5e1', '#64748b', '#18181b', '#09090b', 1.8);
  // Right Clenched Armored Fist & Knuckle Ridges
  drawShadedPoly([[406, 466], [458, 456], [462, 496], [432, 514], [402, 504]], '#f1f5f9', '#94a3b8', '#1e293b', '#09090b', 2.4);
  for (let kx = 416; kx <= 448; kx += 10) {
    drawSeamLine([[kx, 482], [kx - 2, 508]], '#09090b', 1.8);
  }

  // --- E. MECHANICAL NECK COLLAR & HYPER-DETAILED SCULPTED HELMET ---
  // Neck Tendons & Collar Ring
  drawShadedPoly([[234, 146], [306, 146], [316, 178], [224, 178]], '#94a3b8', '#475569', '#0f172a', '#09090b', 2.2);
  drawSeamLine([[248, 150], [254, 176]], '#ffffff', 1.5);
  drawSeamLine([[292, 150], [286, 176]], '#ffffff', 1.5);
  drawSeamLine([[270, 152], [270, 176]], '#09090b', 2.0);

  drawIronManHelmet(context);

  return c;
}

function drawIronManHelmet(context: CanvasRenderingContext2D) {
  const fill = (shape: string, paint: string | CanvasGradient, outline?: string, width = 1.5) => {
    const path = new Path2D(shape);
    context.fillStyle = paint;
    context.fill(path);
    if (outline) {
      context.strokeStyle = outline;
      context.lineWidth = width;
      context.stroke(path);
    }
  };
  const gradient = (x: number, y: number, endX: number, endY: number, stops: [number, string][]) => {
    const paint = context.createLinearGradient(x, y, endX, endY);
    stops.forEach(([position, color]) => paint.addColorStop(position, color));
    return paint;
  };

  context.save();
  context.lineJoin = 'round';
  // Deep red crown and temples form one continuous outer shell.
  fill('M216 56 Q221 30 245 24 Q270 17 295 24 Q319 30 324 56 L328 103 L315 132 L300 151 L286 163 H254 L240 151 L225 132 L212 103 Z',
    gradient(217, 60, 324, 116, [[0, '#a52b22'], [.28, '#dc4438'], [.48, '#801712'], [.77, '#550f10'], [1, '#bb3025']]), '#360c0e', 2.5);
  fill('M216 68 L223 62 L224 112 L220 121 L214 110 Z', '#ce4939', '#561411');
  fill('M324 68 L317 62 L316 112 L320 121 L326 110 Z', '#9d291e', '#561411');

  // The notch in the gold brow exposes the red center of the crown.
  fill('M226 47 L249 39 L255 74 Q270 79 285 74 L291 39 L314 47 L317 91 L313 106 L304 115 L296 139 L286 145 H254 L244 139 L236 115 L227 106 L223 91 Z',
    gradient(223, 80, 317, 100, [[0, '#93601c'], [.18, '#d7a248'], [.44, '#f9d991'], [.60, '#ffe7ab'], [.81, '#c09852'], [1, '#7b4d1d']]), '#4c1e12', 2.2);
  fill('M248 72 L255 74 Q270 79 285 74 L292 72 L289 84 Q270 88 251 84 Z', '#edba67');

  // Angled cheek planes lead down to the seam above the gold chin.
  fill('M227 106 L244 111 L255 133 L253 141 L244 138 L236 115 Z', '#a76f2d');
  fill('M313 106 L296 111 L285 133 L287 141 L296 138 L304 115 Z', '#82511f');
  fill('M244 111 L260 116 H280 L296 111 L285 133 H255 Z',
    gradient(240, 112, 300, 138, [[0, '#d4a358'], [.55, '#e1b778'], [1, '#a77231']]));
  fill('M245 137 L255 132 H285 L295 137 L290 145 L283 141 H257 L250 146 Z', '#3e2117');
  fill('M250 147 L258 142 H282 L290 147 L283 153 H257 Z', '#e1b46e', '#77421e');
  fill('M240 144 L251 153 L257 158 H283 L289 153 L300 144 L289 161 L282 165 H258 L251 161 Z', '#99251c', '#491015');

  // Separate black sockets and cyan-white slits remain readable as particles.
  fill('M227 91 L240 96 L266 99 L264 109 L242 108 L229 103 Z', '#28201a');
  fill('M313 91 L300 96 L274 99 L276 109 L298 108 L311 103 Z', '#28201a');
  const eye = gradient(0, 93, 0, 109, [[0, '#3485b3'], [.48, '#91e3ff'], [.74, '#effcff'], [1, '#a4e9ff']]);
  fill('M231 95 L242 99 L263 102 L261 106 L243 105 L233 101 Z', eye, '#356a83', 1);
  fill('M309 95 L298 99 L277 102 L279 106 L297 105 L307 101 Z', eye, '#356a83', 1);
  context.restore();
}

// =========================================================================
// 2. BACK SIDE ULTRA-DETAILED PROCEDURAL GENERATOR: DOCTOR DOOM
//    (Peaked hood folds, gaunt iron mask with
//     deep eye sockets, nose bridge & grille mouth, twin medallion clasps &
//     chain, quilted square cuirass, belt buckle, tunic tabs & greaves)
// =========================================================================
export function buildDoctorDoomCanvas() {
  const c = document.createElement('canvas');
  c.width = 560;
  c.height = 920;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const context: CanvasRenderingContext2D = ctx;
  context.clearRect(0, 0, c.width, c.height);

  function drawPoly(points: number[][], c0: string, c1: string, c2: string, c3 = '#0d0d10', stroke: string | number = '#060608', width: number | string = 2, direction = 'diag') {
    const strokeCol = typeof stroke === 'number' ? '#060608' : stroke;
    const lw = typeof stroke === 'number' ? stroke : Number(width);
    const dir = typeof width === 'string' ? width : direction;
    context.save();
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) context.lineTo(points[i][0], points[i][1]);
    context.closePath();

    let minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
    for (const [px, py] of points) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    const grad = dir === 'horiz'
      ? context.createLinearGradient(minX, (minY + maxY) * 0.5, maxX, (minY + maxY) * 0.5)
      : context.createLinearGradient(minX, minY, maxX, maxY);
    grad.addColorStop(0.0, c0);
    grad.addColorStop(0.35, c1);
    grad.addColorStop(0.75, c2);
    grad.addColorStop(1.0, c3);
    context.fillStyle = grad;
    context.fill();
    if (lw > 0) {
      context.lineWidth = lw;
      context.strokeStyle = strokeCol;
      context.stroke();
    }
    context.restore();
  }

  function drawLine(pts: number[][], col = '#070709', lw = 1.8) {
    context.save();
    context.beginPath();
    context.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) context.lineTo(pts[i][0], pts[i][1]);
    context.strokeStyle = col;
    context.lineWidth = lw;
    context.stroke();
    context.restore();
  }

  // --- A. WIDE BILLOWING DRAPED CAPE WITH FABRIC FOLDS ---
  drawPoly([
    [172, 178], [388, 178], [456, 315], [496, 808],
    [392, 824], [280, 806], [134, 814], [42, 728], [126, 310]
  ], '#94a3b8', '#475569', '#1e293b', '#09090b', 2.6);

  // Outer Cape Rim Highlights & Deep Drapery Creases
  drawLine([[128, 312], [46, 726], [134, 812]], '#e2e8f0', 2.4);
  drawLine([[454, 316], [492, 806], [392, 822]], '#cbd5e1', 2.4);

  const capeFolds = [
    [[144, 295], [88, 728]],
    [[164, 320], [124, 798]],
    [[184, 345], [160, 804]],
    [[396, 295], [426, 812]],
    [[422, 310], [464, 806]]
  ];
  for (const [p1, p2] of capeFolds) {
    drawLine([p1, p2], '#cbd5e1', 2.0);
    drawLine([[p1[0] + 4, p1[1]], [p2[0] + 4, p2[1]]], '#09090b', 1.8);
  }

  // --- B. ARMORED LEGS, RIDGED KNEE PADS, RIVETED GREAVES & BOOTS ---
  // Left Leg (Viewer's Left)
  drawPoly([[204, 520], [260, 520], [252, 616], [194, 616]], '#475569', '#1e293b', '#0f172a', '#060608', 2.0);
  // Left Horizontal-Segmented Knee Guard
  drawPoly([[188, 602], [252, 602], [250, 658], [186, 658]], '#f8fafc', '#94a3b8', '#334155', '#09090b', 2.4, 'horiz');
  for (let ky = 616; ky <= 644; ky += 14) {
    drawLine([[190, ky], [250, ky]], '#09090b', 2.0);
    drawLine([[192, ky + 2], [248, ky + 2]], '#ffffff', 1.2);
  }
  // Left Vertical-Ribbed Shin Greave with Side Rivets
  drawPoly([[184, 656], [248, 656], [234, 846], [172, 846]], '#e2e8f0', '#64748b', '#1e293b', '#09090b', 2.4, 'horiz');
  drawLine([[206, 662], [194, 840]], '#ffffff', 2.2);
  drawLine([[226, 662], [214, 840]], '#ffffff', 2.2);
  for (let ry = 682; ry <= 816; ry += 32) {
    drawLine([[182, ry], [238, ry]], '#09090b', 2.0);
    // Metallic rivets
    context.fillStyle = '#ffffff';
    context.fillRect(190, ry - 4, 4, 4);
    context.fillRect(228, ry - 4, 4, 4);
  }
  // Left Armored Sabaton Boot
  drawPoly([[158, 840], [232, 840], [234, 876], [122, 878], [124, 858]], '#cbd5e1', '#64748b', '#1e293b', '#09090b', 2.4);
  drawLine([[142, 856], [228, 856]], '#ffffff', 1.4);

  // Right Leg (Viewer's Right)
  drawPoly([[292, 520], [350, 520], [358, 616], [298, 616]], '#475569', '#1e293b', '#0f172a', '#060608', 2.0);
  // Right Horizontal-Segmented Knee Guard
  drawPoly([[300, 602], [364, 602], [366, 658], [302, 658]], '#f8fafc', '#94a3b8', '#334155', '#09090b', 2.4, 'horiz');
  for (let ky = 616; ky <= 644; ky += 14) {
    drawLine([[302, ky], [364, ky]], '#09090b', 2.0);
    drawLine([[304, ky + 2], [362, ky + 2]], '#ffffff', 1.2);
  }
  // Right Vertical-Ribbed Shin Greave
  drawPoly([[306, 656], [370, 656], [392, 846], [330, 846]], '#e2e8f0', '#64748b', '#1e293b', '#09090b', 2.4, 'horiz');
  drawLine([[328, 662], [348, 840]], '#ffffff', 2.2);
  drawLine([[348, 662], [368, 840]], '#ffffff', 2.2);
  for (let ry = 682; ry <= 816; ry += 32) {
    drawLine([[314, ry], [378, ry]], '#09090b', 2.0);
    context.fillStyle = '#ffffff';
    context.fillRect(318, ry - 4, 4, 4);
    context.fillRect(366, ry - 4, 4, 4);
  }
  // Right Armored Sabaton Boot
  drawPoly([[330, 840], [394, 840], [416, 878], [332, 878]], '#cbd5e1', '#64748b', '#1e293b', '#09090b', 2.4);
  drawLine([[336, 856], [404, 856]], '#ffffff', 1.4);

  // --- C. PLEATED TUNIC SKIRT FLAPS & QUILTED THIGH ARMOR ---
  // Left Pleated Skirt Flap
  drawPoly([[202, 412], [254, 412], [238, 554], [172, 538]], '#cbd5e1', '#64748b', '#1e293b', '#09090b', 2.2);
  drawLine([[226, 416], [204, 544]], '#09090b', 1.8);
  drawLine([[230, 416], [208, 544]], '#ffffff', 1.2);

  // Right Quilted Metallic Thigh Plate + Pleated Outer Flap (Exact match to image_35b0c5.jpg)
  drawPoly([[296, 412], [348, 412], [380, 538], [312, 554]], '#ffffff', '#cbd5e1', '#475569', '#09090b', 2.2);
  // Quilted grid on right thigh plate
  for (let gy = 432; gy <= 528; gy += 18) {
    drawLine([[302, gy], [366, gy + 8]], '#1e293b', 1.6);
  }
  drawLine([[326, 416], [346, 544]], '#1e293b', 1.8);
  drawLine([[346, 416], [368, 538]], '#1e293b', 1.8);

  // Center Vertical Tunic Tab with Double Seam
  drawPoly([[244, 412], [306, 412], [314, 576], [236, 576]], '#e2e8f0', '#94a3b8', '#334155', '#09090b', 2.4);
  drawLine([[275, 416], [275, 572]], '#09090b', 2.2);
  drawLine([[278, 416], [278, 572]], '#ffffff', 1.2);

  // --- D. QUILTED SQUARE-GRID CHEST CUIRASS & GREEN TUNIC LAPELS ---
  // Outer Tunic Torso Frame
  drawPoly([[194, 192], [356, 192], [342, 384], [208, 384]], '#94a3b8', '#475569', '#1e293b', '#09090b', 2.4);
  // Center Quilted Metallic Armor Panel (Bright silver/white square grid)
  drawPoly([[218, 204], [332, 204], [322, 376], [228, 376]], '#ffffff', '#e2e8f0', '#64748b', '#09090b', 2.4, 'horiz');

  // Individual Quilted Grid Lines & Specular Highlights
  for (let gx = 240; gx <= 312; gx += 22) {
    drawLine([[gx, 206], [gx, 374]], '#09090b', 2.0);
    drawLine([[gx + 2, 208], [gx + 2, 372]], '#ffffff', 1.1);
  }
  for (let gy = 226; gy <= 356; gy += 22) {
    drawLine([[220, gy], [328, gy]], '#09090b', 2.0);
    drawLine([[222, gy + 2], [326, gy + 2]], '#ffffff', 1.1);
  }

  // --- E. HEAVY UTILITY BELT & CIRCULAR RING BUCKLE ---
  drawPoly([[202, 372], [348, 372], [348, 416], [202, 416]], '#475569', '#1e293b', '#09090b', '#000000', 2.4);
  // Belt horizontal stitching lines
  drawLine([[204, 378], [346, 378]], '#94a3b8', 1.2);
  drawLine([[204, 410], [346, 410]], '#94a3b8', 1.2);
  // Side Belt Loops & Clasp Detail
  drawPoly([[216, 370], [234, 370], [234, 418], [216, 418]], '#cbd5e1', '#64748b', '#1e293b', '#09090b', 1.8);
  // Circular Silver Buckle Ring (Offset slightly left-of-center as in image_35b0c5.jpg)
  context.save();
  context.beginPath();
  context.arc(252, 394, 20, 0, Math.PI * 2);
  context.fillStyle = '#0f172a';
  context.fill();
  context.lineWidth = 3.8;
  context.strokeStyle = '#ffffff';
  context.stroke();
  context.restore();

  // --- F. SEGMENTED METALLIC ARMS, GOLD BICEP BAND & CLENCHED FISTS ---
  // Left Arm (Viewer's Left - bent upward with clenched fist)
  drawPoly([[160, 210], [204, 200], [190, 314], [146, 306]], '#cbd5e1', '#64748b', '#18181b', '#09090b', 2.4);
  for (let ay = 228; ay <= 292; ay += 16) {
    drawLine([[152, ay], [196, ay + 4]], '#09090b', 2.0);
    drawLine([[154, ay + 2], [194, ay + 6]], '#ffffff', 1.1);
  }
  // Left Forearm & Gauntlet
  drawPoly([[144, 306], [186, 318], [134, 388], [96, 364]], '#e2e8f0', '#64748b', '#0f172a', '#09090b', 2.4);
  // Left Clenched Fist
  drawPoly([[72, 342], [116, 340], [124, 386], [78, 392]], '#ffffff', '#94a3b8', '#1e293b', '#09090b', 2.4);
  for (let fy = 352; fy <= 376; fy += 8) {
    drawLine([[76, fy], [112, fy]], '#09090b', 1.8);
  }

  // Right Arm (Viewer's Right - with bright gold bicep band & raised clenched fist)
  drawPoly([[346, 200], [392, 212], [412, 312], [364, 318]], '#cbd5e1', '#64748b', '#18181b', '#09090b', 2.4);
  for (let ay = 228; ay <= 292; ay += 16) {
    drawLine([[354, ay + 4], [398, ay]], '#09090b', 2.0);
  }
  // Prominent Gold Bicep Armband (Bright specular double ring)
  drawPoly([[358, 258], [406, 250], [409, 266], [361, 274]], '#ffffff', '#f8fafc', '#94a3b8', '#09090b', 2.0);
  drawLine([[360, 265], [407, 257]], '#09090b', 1.6);

  // Right Forearm & Gauntlet
  drawPoly([[366, 316], [412, 308], [442, 372], [392, 384]], '#e2e8f0', '#64748b', '#0f172a', '#09090b', 2.4);
  // Right Clenched Fist
  drawPoly([[392, 338], [442, 336], [448, 382], [398, 388]], '#ffffff', '#94a3b8', '#1e293b', '#09090b', 2.4);
  for (let fy = 348; fy <= 372; fy += 8) {
    drawLine([[398, fy], [438, fy]], '#09090b', 1.8);
  }

  // --- G. DRAPED CLOAK COWL, TWIN ENGRAVED MEDALLIONS & CHAIN ---
  drawPoly([
    [168, 168], [275, 192], [382, 168],
    [404, 218], [275, 232], [148, 218]
  ], '#cbd5e1', '#64748b', '#1e293b', '#09090b', 2.4);
  // Cowl Neck Scarf Folds
  drawLine([[196, 176], [275, 198], [354, 176]], '#ffffff', 2.0);
  drawLine([[182, 196], [275, 216], [368, 196]], '#09090b', 2.0);

  // Heavy Metallic Chain Links across Upper Chest
  context.save();
  context.strokeStyle = '#09090b';
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(212, 206);
  context.quadraticCurveTo(275, 232, 338, 204);
  context.stroke();

  context.strokeStyle = '#ffffff';
  context.lineWidth = 4.5;
  context.setLineDash([7, 4]);
  context.beginPath();
  context.moveTo(212, 206);
  context.quadraticCurveTo(275, 232, 338, 204);
  context.stroke();
  context.restore();

  // Twin Circular Cloak Clasps with Cross/Crest Engravings
  for (const cx of [208, 336]) {
    context.save();
    context.beginPath();
    context.arc(cx, 204, 20, 0, Math.PI * 2);
    context.fillStyle = '#f8fafc';
    context.fill();
    context.lineWidth = 2.6;
    context.strokeStyle = '#09090b';
    context.stroke();

    // Inner Bezel Ring & Engraved Cross Motif
    context.beginPath();
    context.arc(cx, 204, 12, 0, Math.PI * 2);
    context.lineWidth = 1.8;
    context.stroke();

    context.beginPath();
    context.moveTo(cx - 8, 204); context.lineTo(cx + 8, 204);
    context.moveTo(cx, 196); context.lineTo(cx, 212);
    context.stroke();
    context.restore();
  }

  // --- H. DRAMATIC PEAKED HOOD & HYPER-DETAILED IRON MASK ---
  // Outer Peaked Hood with Dramatic Rim Lighting
  drawPoly([
    [252, 32], [298, 32], [336, 78], [356, 156],
    [275, 184], [194, 156], [214, 78]
  ], '#e2e8f0', '#64748b', '#1e293b', '#09090b', 2.8, 'horiz');
  // Hood Outer Fold Lines
  drawLine([[254, 36], [218, 82], [202, 152]], '#ffffff', 2.2);
  drawLine([[296, 36], [332, 82], [348, 152]], '#cbd5e1', 2.0);

  // Deep Dark Shadow Recess Inside Hood
  drawPoly([
    [254, 46], [296, 46], [320, 86], [322, 148],
    [275, 164], [228, 148], [230, 86]
  ], '#121216', '#060608', '#000000', '#000000', 1.5);

  // Sculpted Iron Faceplate Mask (High-detail planes matching image_35b0c5.jpg)
  drawPoly([
    [248, 56], [275, 52], [302, 56],
    [308, 110], [294, 148], [256, 148], [242, 110]
  ], '#ffffff', '#cbd5e1', '#475569', '#1e293b', 2.4, 'horiz');

  // Forehead Plate Seam & Rivets
  drawLine([[250, 72], [275, 76], [300, 72]], '#09090b', 2.0);
  context.fillStyle = '#09090b';
  context.fillRect(256, 62, 3, 3);
  context.fillRect(274, 60, 3, 3);
  context.fillRect(291, 62, 3, 3);

  // Furrowed Heavy Brow Ridges
  drawLine([[246, 82], [272, 90], [278, 90], [304, 82]], '#09090b', 3.0);
  drawLine([[248, 80], [272, 87]], '#ffffff', 1.4);
  drawLine([[302, 80], [278, 87]], '#ffffff', 1.4);

  // Deep Recessed Dark Eye Sockets & Intense Piercing Eyes
  context.save();
  context.fillStyle = '#050507';
  context.beginPath();
  context.moveTo(248, 86); context.lineTo(271, 91); context.lineTo(268, 102); context.lineTo(249, 98); context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(302, 86); context.lineTo(279, 91); context.lineTo(282, 102); context.lineTo(301, 98); context.closePath();
  context.fill();

  // Intense Glinting Eyes inside sockets
  context.fillStyle = '#ffffff';
  context.shadowColor = '#ffffff';
  context.shadowBlur = 8;
  context.fillRect(253, 92, 12, 4);
  context.fillRect(285, 92, 12, 4);
  context.restore();

  // Prominent Sculpted Metallic Nose Bridge & Nasal Wing Planes
  drawPoly([
    [271, 90], [279, 90], [283, 114], [275, 117], [267, 114]
  ], '#ffffff', '#e2e8f0', '#64748b', '#334155', '#09090b', 1.6);

  // Gaunt Sculpted Cheekbone Planes & Nasolabial Folds
  drawLine([[245, 104], [262, 112], [256, 136]], '#09090b', 2.2);
  drawLine([[305, 104], [288, 112], [294, 136]], '#09090b', 2.2);
  drawLine([[247, 106], [260, 114]], '#ffffff', 1.3);
  drawLine([[303, 106], [290, 114]], '#ffffff', 1.3);

  // Grimacing Metallic Mouth Grille with Vertical Teeth/Vent Bars
  drawPoly([
    [259, 121], [291, 121], [293, 137], [257, 137]
  ], '#18181b', '#09090b', '#000000', '#000000', '#09090b', 2.0);
  // Vertical Teeth / Vent Grille Bars
  context.strokeStyle = '#ffffff';
  context.lineWidth = 1.8;
  for (let mx = 263; mx <= 287; mx += 4.8) {
    context.beginPath();
    context.moveTo(mx, 122);
    context.lineTo(mx, 136);
    context.stroke();
  }
  // Horizontal Mouth Split
  drawLine([[258, 129], [292, 129]], '#09090b', 1.6);

  // Segmented Chin Plate & Jawline Rivets
  drawLine([[260, 142], [290, 142]], '#09090b', 1.8);
  context.fillStyle = '#09090b';
  context.fillRect(252, 126, 3, 3);
  context.fillRect(295, 126, 3, 3);
  context.fillRect(262, 144, 3, 3);
  context.fillRect(285, 144, 3, 3);

  return c;
}
