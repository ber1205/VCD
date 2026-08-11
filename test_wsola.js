// 验证 wsola.wasm 的 findBestOverlap 与 JS 版结果一致性
const fs = require('fs');
const wasmBuf = fs.readFileSync('D:/Program Files/Trae Code/VCD/vcd-app/frontend/worker/wsola/wsola.wasm');
const mod = new WebAssembly.Module(wasmBuf);
const inst = new WebAssembly.Instance(mod);
const exports = inst.exports;
const memory = exports.memory;

function wasmFindBestOverlap(segment, target, maxShift) {
  const segBytes = segment.length * 4;
  const targetBytes = target.length * 4;
  const needed = segBytes + targetBytes + 16;
  while (memory.buffer.byteLength < needed) memory.grow(1);
  const base = 8;
  new Float32Array(memory.buffer, base, segment.length).set(segment);
  const targetPtr = base + segBytes;
  new Float32Array(memory.buffer, targetPtr, target.length).set(target);
  return exports.findBestOverlap(base, segment.length, targetPtr, target.length, maxShift);
}

// JS 版 (两级搜索, 与 wasm 同算法) 参考实现
function jsFindBestOverlap(segment, target, maxShift) {
  const shiftRange = Math.min(maxShift, target.length - segment.length);
  if (shiftRange <= 0) return 0;
  let segmentEnergy = 0;
  for (let i = 0; i < segment.length; i++) segmentEnergy += segment[i] * segment[i];
  if (segmentEnergy < 1e-12) return Math.floor(shiftRange / 2);
  const COARSE_STEP = 8;
  let coarseBestShift = 0, coarseBestNcc = -Infinity;
  let coarseTargetEnergy = 0;
  for (let i = 0; i < segment.length && i < target.length; i++) coarseTargetEnergy += target[i] * target[i];
  for (let shift = 0; shift <= shiftRange; shift += COARSE_STEP) {
    let cc = 0;
    for (let i = 0; i < segment.length; i += 4) cc += segment[i] * target[shift + i];
    if (coarseTargetEnergy >= 1e-12) {
      const ncc = cc / Math.sqrt(segmentEnergy * coarseTargetEnergy);
      if (ncc > coarseBestNcc) { coarseBestNcc = ncc; coarseBestShift = shift; }
    }
    if (shift + segment.length < target.length) coarseTargetEnergy += target[shift + segment.length]**2 - target[shift]**2;
  }
  const fineStart = Math.max(0, coarseBestShift - COARSE_STEP);
  const fineEnd = Math.min(shiftRange, coarseBestShift + COARSE_STEP);
  let bestShift = 0, bestCorr = -Infinity;
  let fineTargetEnergy = 0;
  for (let i = 0; i < segment.length && fineStart + i < target.length; i++) fineTargetEnergy += target[fineStart + i]**2;
  for (let shift = fineStart; shift <= fineEnd; shift++) {
    let cc = 0;
    for (let i = 0; i < segment.length && shift + i < target.length; i++) cc += segment[i] * target[shift + i];
    if (fineTargetEnergy >= 1e-12) {
      const ncc = cc / Math.sqrt(segmentEnergy * fineTargetEnergy);
      if (ncc > bestCorr) { bestCorr = ncc; bestShift = shift; }
    }
    if (shift + segment.length < target.length) fineTargetEnergy += target[shift + segment.length]**2 - target[shift]**2;
  }
  return bestCorr === -Infinity ? 0 : bestShift;
}

// 测试: 合成带周期性的信号 (语音类似) + 随机噪声偏移
let pass = 0, fail = 0;
for (let trial = 0; trial < 50; trial++) {
  const segLen = 1536;
  const seg = new Float32Array(segLen);
  const freq = 100 + Math.random() * 300;
  for (let i = 0; i < segLen; i++) seg[i] = Math.sin(2 * Math.PI * freq * i / 16000) * (0.5 + 0.5 * Math.random());
  const trueShift = Math.floor(Math.random() * 400);
  const target = new Float32Array(segLen + 600);
  for (let i = 0; i < segLen; i++) target[trueShift + i] = seg[i] * 0.95;
  for (let i = 0; i < target.length; i++) target[i] += (Math.random() - 0.5) * 0.05;

  const w = wasmFindBestOverlap(seg, target, 512);
  const j = jsFindBestOverlap(seg, target, 512);
  // 两级搜索 + 增量可能引入 ±8 偏差 (粗搜步长), 允许 ±10 容差
  if (Math.abs(w - j) <= 10 && Math.abs(w - trueShift) <= 12) { pass++; }
  else { fail++; if (fail <= 3) console.log(`trial${trial}: wasm=${w} js=${j} true=${trueShift}`); }
}
console.log(`PASS=${pass}/50 FAIL=${fail}/50`);
// 无声段测试
const silent = new Float32Array(100);
const t2 = new Float32Array(300).fill(0.1);
console.log('silent wasm:', wasmFindBestOverlap(silent, t2, 100), 'js:', jsFindBestOverlap(silent, t2, 100));
