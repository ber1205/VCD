// VCD 优化主线报告图表
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var warn = style.getPropertyValue('--warn').trim();

  // --- Chart: 注释债 Top5 ---
  var debtEl = document.getElementById('chart-debt');
  if (debtEl) {
    var chartDebt = echarts.init(debtEl, null, { renderer: 'svg' });
    chartDebt.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 24, top: 20, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'category',
        data: ['ai/clone.ts 149KB', 'tts.ts 77KB', 'audio-dsp.ts 192KB', 'translate.ts 79KB', 'queue-workers.ts 86KB'],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: ink, fontSize: 12 }
      },
      series: [{
        type: 'bar',
        data: [225, 181, 149, 98, 90],
        barWidth: 18,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: function (p) {
            var colors = [danger, danger, warn, accent2, accent];
            return colors[p.dataIndex];
          }
        },
        label: { show: true, position: 'right', color: muted, fontWeight: 600 }
      }]
    });
    window.addEventListener('resize', function () { chartDebt.resize(); });
  }

  // --- Chart: 版本节奏（8-16 21:00 → 8-17 12:00，每小时提交数）---
  var cadEl = document.getElementById('chart-cadence');
  if (cadEl) {
    var chartCad = echarts.init(cadEl, null, { renderer: 'svg' });
    chartCad.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 24, top: 20, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['21', '22', '23', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
        name: '时段（8-16 21:00 → 8-17 11:00）',
        nameTextStyle: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted }
      },
      yAxis: {
        type: 'value',
        name: '提交数',
        nameTextStyle: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'bar',
        data: [1, 1, 2, 1, 1, 1, 1, 4, 5, 4, 3, 4, 3, 2, 1],
        barWidth: '55%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: function (p) { return p.value >= 5 ? danger : (p.value >= 3 ? warn : accent); }
        },
        label: { show: true, position: 'top', color: muted, fontSize: 11 }
      }]
    });
    window.addEventListener('resize', function () { chartCad.resize(); });
  }
})();
