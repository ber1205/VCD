// VCD Pipeline Deep Analysis — charts
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ===== 图 2-1 进度曲线 =====
  var elProgress = document.getElementById('chart-progress');
  if (elProgress) {
    var chart = echarts.init(elProgress, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'axis',
        appendToBody: true,
        formatter: function (ps) {
          var p = ps[0];
          return '任务开始后 ' + p.value[0] + ' 分钟 · 进度 ' + p.value[1] + '%' + (p.data.label ? '<br>' + p.data.label : '');
        }
      },
      grid: { left: 48, right: 20, top: 30, bottom: 40 },
      xAxis: {
        type: 'value',
        name: '分钟',
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, opacity: 0.5 } },
        max: 17
      },
      yAxis: {
        type: 'value',
        name: '进度 %',
        nameTextStyle: { color: muted, fontSize: 12 },
        min: 0, max: 100,
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, opacity: 0.5 } }
      },
      series: [{
        type: 'line',
        data: [
          [0.1, 4, { label: 'extract_audio 开始' }],
          [0.4, 4],
          [0.6, 6, { label: 'ASR 阶段' }],
          [0.8, 21, { label: '说话人分离' }],
          [1.0, 42, { label: 'B 波克隆 (跨语言预判)' }],
          [1.1, 55, { label: '55% 卡死开始' }],
          [5.0, 55],
          [11.0, 55],
          [11.2, 55],
          [11.3, 55, { label: '重入：克隆失败降级' }],
          [11.5, 56, { label: 'TTS 合成' }],
          [11.7, 58.3],
          [12.0, 65, { label: '对齐' }],
          [12.2, 76],
          [12.5, 86, { label: '校验' }],
          [12.7, 88, { label: '封装' }],
          [13.0, 97.4],
          [13.5, 98],
          [16.0, 98],
          [16.5, 100, { label: '完成' }]
        ],
        smooth: false,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: accent, width: 2.5 },
        itemStyle: { color: accent },
        markPoint: {
          data: [
            { coord: [11.0, 55], value: '55% 卡死 11 分钟', symbol: 'pin', symbolSize: 42, itemStyle: { color: accent2 }, label: { color: '#fff', fontSize: 10 } }
          ],
          label: { show: true, color: '#fff' }
        },
        markLine: {
          silent: true,
          data: [{ yAxis: 55, name: '55% 阈值' }],
          lineStyle: { color: accent2, type: 'dashed', opacity: 0.6 },
          label: { color: muted, formatter: '55%', position: 'insideEndTop' }
        }
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }

  // ===== 图 2-2 阶段耗时 =====
  var elStage = document.getElementById('chart-stage');
  if (elStage) {
    var chart2 = echarts.init(elStage, null, { renderer: 'svg' });
    chart2.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
      grid: { left: 120, right: 30, top: 20, bottom: 40 },
      xAxis: {
        type: 'value',
        name: '分钟',
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, opacity: 0.5 } }
      },
      yAxis: {
        type: 'category',
        data: ['完成(98%)', '封装(88%)', '校验(86%)', '对齐(65%)', 'TTS(56-58%)', '克隆+55%卡死', '说话人分离(21%)', 'ASR(6%)', '提取(4%)'],
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink, fontSize: 12 }
      },
      series: [{
        type: 'bar',
        data: [
          { value: 1.0, itemStyle: { color: accent } },
          { value: 0.8, itemStyle: { color: accent } },
          { value: 0.3, itemStyle: { color: accent } },
          { value: 0.5, itemStyle: { color: accent } },
          { value: 0.4, itemStyle: { color: accent2 } },
          { value: 11.2, itemStyle: { color: accent2 } },
          { value: 0.2, itemStyle: { color: accent } },
          { value: 0.2, itemStyle: { color: accent } },
          { value: 2.1, itemStyle: { color: accent } }
        ],
        barWidth: '55%',
        label: {
          show: true, position: 'right', color: muted, fontSize: 11,
          formatter: function (p) { return p.value + 'm'; }
        }
      }]
    });
    window.addEventListener('resize', function () { chart2.resize(); });
  }

  // ===== 图 8-2 修复后耗时预估 =====
  var elDur = document.getElementById('chart-duration');
  if (elDur) {
    var chart3 = echarts.init(elDur, null, { renderer: 'svg' });
    chart3.setOption({
      animation: false,
      tooltip: { trigger: 'axis', appendToBody: true, axisPointer: { type: 'shadow' } },
      legend: {
        data: ['提取分离', 'ASR+分析', 'B波', 'TTS合成', '对齐/混音/封装'],
        textStyle: { color: muted, fontSize: 12 },
        bottom: 0
      },
      grid: { left: 60, right: 25, top: 20, bottom: 55 },
      xAxis: {
        type: 'category',
        data: ['1m', '5m', '10m', '30m', '60m', '90m', '120m', '200m'],
        name: '视频时长',
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: ink },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '分钟',
        nameTextStyle: { color: muted, fontSize: 12 },
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted },
        splitLine: { lineStyle: { color: rule, opacity: 0.5 } }
      },
      series: [
        { name: '提取分离', type: 'bar', stack: 't', data: [2, 2, 3, 4, 5, 6, 7, 9], itemStyle: { color: accent + '66' } },
        { name: 'ASR+分析', type: 'bar', stack: 't', data: [1, 2, 3, 6, 10, 14, 18, 28], itemStyle: { color: accent2 + '88' } },
        { name: 'B波', type: 'bar', stack: 't', data: [2, 2, 3, 4, 5, 6, 7, 9], itemStyle: { color: accent } },
        { name: 'TTS合成', type: 'bar', stack: 't', data: [1, 3, 6, 18, 35, 50, 65, 110], itemStyle: { color: accent2 } },
        { name: '对齐/混音/封装', type: 'bar', stack: 't', data: [2, 2, 3, 4, 5, 6, 7, 9], itemStyle: { color: muted + '88' } }
      ]
    });
    window.addEventListener('resize', function () { chart3.resize(); });
  }
})();
