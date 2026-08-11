// vcd-55-percent-stuck-analysis :: charts.js
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var ok = style.getPropertyValue('--ok').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // --- Chart: 7 个历史特性保留状态 ---
  var featEl = document.getElementById('chart-features');
  if (featEl) {
    var feat = echarts.init(featEl, null, { renderer: 'svg' });
    var features = [
      { name: 'v1.9.62 连续卡死熔断 failed', score: 1, note: '缺失' },
      { name: 'v1.9.59 Promise.all 并发 (17min→30s)', score: 2, note: '部分' },
      { name: 'v1.8.53 批处理 + R2 checkpoint 续传', score: 2, note: '部分' },
      { name: 'v1.9.43 聚合被动完成检查', score: 2, note: '部分' },
      { name: 'v1.10.26 每段进度更新', score: 3, note: '完整' },
      { name: 'v1.9.55 幂等表 + 消息去重', score: 3, note: '完整' },
      { name: 'v1.9.40 merge 3 次重试 + 失败标记', score: 3, note: '完整' }
    ];
    var names = features.map(function (f) { return f.name; });
    var scores = features.map(function (f) { return f.score; });
    var notes = features.map(function (f) { return f.note; });

    feat.setOption({
      animation: false,
      grid: { left: 8, right: 60, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        axisPointer: { type: 'shadow' },
        formatter: function (params) {
          var i = params[0].dataIndex;
          return names[i] + '<br/>保留度: ' + scores[i] + '/3（' + notes[i] + '）';
        }
      },
      xAxis: {
        type: 'value', min: 0, max: 3, interval: 1,
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'category',
        data: names.slice().reverse(),
        axisLabel: { color: ink, fontSize: 12, width: 260, overflow: 'truncate' },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      series: [{
        type: 'bar',
        data: scores.slice().reverse().map(function (s, i) {
          return {
            value: s,
            itemStyle: { color: s === 3 ? ok : (s === 2 ? accent2 : danger), borderRadius: [0, 4, 4, 0] }
          };
        }),
        barWidth: 18,
        label: {
          show: true,
          position: 'right',
          color: ink,
          fontSize: 12,
          fontWeight: 700,
          formatter: function (p) {
            var i = scores.length - 1 - p.dataIndex;
            return notes[i];
          }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: muted, type: 'dashed' },
          data: [{ xAxis: 3 }],
          label: { show: false }
        }
      }]
    });
    window.addEventListener('resize', function () { feat.resize(); });
  }

  // --- Chart: 熔断机制覆盖矩阵 ---
  var fuseEl = document.getElementById('chart-fuse');
  if (fuseEl) {
    var fuse = echarts.init(fuseEl, null, { renderer: 'svg' });
    var mechs = ['步骤安全网', '批内看门狗', 'pending 上限', '聚合超时熔断', 'send 有界重试', '进度滚动'];
    var rows = ['旧串行路径', '新块路径（修复前）', '新块路径（修复后）'];
    var data = [
      [0, 0, 1], [1, 0, 1], [2, 0, 1], [3, 0, 1], [4, 0, 1], [5, 0, 1],
      [0, 1, 1], [1, 1, 0], [2, 1, 0], [3, 1, 0], [4, 1, 0], [5, 1, 0],
      [0, 2, 1], [1, 2, 1], [2, 2, 1], [3, 2, 1], [4, 2, 1], [5, 2, 1]
    ];
    fuse.setOption({
      animation: false,
      grid: { left: 8, right: 30, top: 24, bottom: 70, containLabel: true },
      tooltip: {
        appendToBody: true,
        formatter: function (p) {
          var v = p.value;
          return mechs[v[0]] + ' · ' + rows[v[1]] + '<br/>' + (v[2] === 1 ? '✓ 有效' : '✗ 失效');
        }
      },
      xAxis: {
        type: 'category', data: mechs,
        axisLabel: { color: ink, fontSize: 11, interval: 0, rotate: 22 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'category', data: rows,
        axisLabel: { color: ink, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      visualMap: {
        min: 0, max: 1,
        show: false,
        inRange: { color: [bg2, ok] },
        outOfRange: { color: 'transparent' }
      },
      series: [{
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 700,
          color: ink,
          formatter: function (p) { return p.value[2] === 1 ? '✓' : '✗'; }
        },
        itemStyle: {
          borderColor: rule,
          borderWidth: 1,
          borderRadius: 4
        },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: accent + '55' } }
      }]
    });
    window.addEventListener('resize', function () { fuse.resize(); });
  }
})();
