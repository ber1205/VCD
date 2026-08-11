// dub-quality-analysis 图表
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var warn = style.getPropertyValue('--warn').trim();
  var ok = style.getPropertyValue('--ok').trim();

  // RMS 数据: 60 个 250ms 窗口 (dBFS, -120=静音)
  var rms = [
    -120,-120,-77.6,-60.6,-25.2,-32.4,-41.5,-22.7,-55.6,-22.2,
    -25.4,-30.4,-112.7,-19.8,-17.3,-13.5,-14.3,-11.0,-12.5,-14.1,
    -10.9,-14.2,-13.5,-14.8,-16.3,-120,-120,-120,-120,-29.5,
    -33.4,-26.1,-120,-120,-33.6,-120,-84.0,-27.2,-28.3,-23.9,
    -42.6,-120,-27.6,-59.1,-81.7,-24.6,-30.8,-30.3,-22.0,-19.9,
    -32.2,-76.8,-104.5,-120,-120,-120,-120,-120,-120,-120
  ];
  var times = rms.map(function (_, i) { return (i * 0.25).toFixed(2); });

  // 图1: RMS 曲线
  var c1 = echarts.init(document.getElementById('chart-rms'), null, { renderer: 'svg' });
  c1.setOption({
    animation: false,
    grid: { left: 55, right: 20, top: 25, bottom: 35 },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      formatter: function (p) {
        var v = p[0].value;
        return '时间 ' + p[0].axisValue + 's · RMS ' + v.toFixed(1) + 'dB' + (v <= -100 ? '（完全静音）' : '');
      }
    },
    xAxis: { type: 'category', data: times, name: '时间(s)', axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, interval: 5 } },
    yAxis: { type: 'value', name: 'dBFS', min: -130, max: 0, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
    series: [{
      type: 'line',
      data: rms,
      smooth: false,
      symbol: 'none',
      lineStyle: { width: 2, color: accent2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: accent2 + '55' }, { offset: 1, color: accent2 + '05' }]
        }
      },
      markArea: {
        silent: true,
        itemStyle: { color: 'transparent' },
        data: [
          [{ name: '连续真实语音', xAxis: '1.00', itemStyle: { color: ok + '18' } }, { xAxis: '6.25' }],
          [{ name: '完全静音', xAxis: '6.25', itemStyle: { color: accent + '22' } }, { xAxis: '7.25' }],
          [{ name: '断续缺失', xAxis: '7.25', itemStyle: { color: warn + '22' } }, { xAxis: '12.75' }],
          [{ name: '尾部静音', xAxis: '12.75', itemStyle: { color: accent + '22' } }, { xAxis: '15.00' }]
        ]
      }
    }]
  });
  window.addEventListener('resize', function () { c1.resize(); });

  // 图2: 柱状图（红=静音）
  var c2 = echarts.init(document.getElementById('chart-bars'), null, { renderer: 'svg' });
  c2.setOption({
    animation: false,
    grid: { left: 55, right: 20, top: 25, bottom: 35 },
    tooltip: { trigger: 'axis', appendToBody: true, formatter: function (p) { return '时间 ' + p[0].axisValue + 's · RMS ' + p[0].value.toFixed(1) + 'dB'; } },
    xAxis: { type: 'category', data: times, name: '时间(s)', axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted, interval: 5 } },
    yAxis: { type: 'value', name: 'dBFS', min: -130, max: 0, axisLine: { lineStyle: { color: rule } }, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule, type: 'dashed' } } },
    series: [{
      type: 'bar',
      data: rms.map(function (v) { return v; }),
      itemStyle: {
        color: function (p) { return p.value <= -100 ? accent : accent2; },
        opacity: function (p) { return p.value <= -100 ? 0.55 : 0.9; }
      }
    }]
  });
  window.addEventListener('resize', function () { c2.resize(); });
})();
