// VCD Pipeline Audit — chart logic
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var ok = style.getPropertyValue('--ok').trim();

  var baseOpt = {
    animation: false,
    textStyle: { color: ink, fontFamily: 'InstrumentSans' }
  };

  // ---- Chart 2: 清单 v3.0 实现程度 ----
  var elCheck = document.getElementById('chart-check');
  if (elCheck) {
    var chart = echarts.init(elCheck, null, { renderer: 'svg' });
    var items = [
      { name: 'B级 · 翻译+校对合并', v: 100 },
      { name: 'A级 · 人声分离统一', v: 100 },
      { name: 'B级 · 质量评分合并', v: 100 },
      { name: '环节数 16→10', v: 80 },
      { name: 'C级 · SRT 优先增强', v: 70 },
      { name: 'S级 · DeepSeek 5→1', v: 45 },
      { name: 'B级 · 人工校对恢复', v: 10 }
    ];
    chart.setOption(Object.assign({}, baseOpt, {
      grid: { left: 8, right: 40, top: 10, bottom: 8, containLabel: true },
      xAxis: { type: 'value', max: 100, axisLabel: { color: muted, formatter: '{value}%' }, splitLine: { lineStyle: { color: rule } } },
      yAxis: {
        type: 'category', data: items.map(function (d) { return d.name; }).reverse(),
        axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: ink }
      },
      series: [{
        type: 'bar', data: items.map(function (d) { return d.v; }).reverse(), barWidth: 18,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: function (p) {
            var v = p.value;
            return v >= 90 ? ok : v >= 50 ? accent2 : danger;
          }
        },
        label: { show: true, position: 'right', color: ink, formatter: '{c}%' }
      }],
      tooltip: { trigger: 'item', appendToBody: true, formatter: function (p) { return p.name + '：实现程度 ' + p.value + '%'; } }
    }));
    window.addEventListener('resize', function () { chart.resize(); });
  }

  // ---- Chart 3: 长视频各环节风险评分 ----
  var elRisk = document.getElementById('chart-risk');
  if (elRisk) {
    var chart = echarts.init(elRisk, null, { renderer: 'svg' });
    var risks = [
      { name: 'extract 人声分离', v: 9 },
      { name: 'Two-Pass Pass1', v: 9 },
      { name: 'Queue 渲染', v: 6 },
      { name: 'merge 混音', v: 6 },
      { name: '上传', v: 4 },
      { name: '时间轴对齐', v: 4 },
      { name: 'ASR 识别', v: 3 }
    ];
    chart.setOption(Object.assign({}, baseOpt, {
      grid: { left: 8, right: 30, top: 10, bottom: 8, containLabel: true },
      xAxis: { type: 'value', max: 10, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      yAxis: {
        type: 'category', data: risks.map(function (d) { return d.name; }),
        axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: ink }
      },
      series: [{
        type: 'bar', data: risks.map(function (d) { return d.v; }), barWidth: 18,
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: function (p) { return p.value >= 8 ? danger : p.value >= 5 ? accent2 : ok; }
        },
        label: { show: true, position: 'right', color: ink, formatter: '{c}' }
      }],
      tooltip: { trigger: 'item', appendToBody: true, formatter: function (p) { return p.name + '：风险 ' + p.value + '/10'; } }
    }));
    window.addEventListener('resize', function () { chart.resize(); });
  }

  // ---- Chart 4: 优化优先级 工作量 vs 收益 ----
  var elPrio = document.getElementById('chart-prio');
  if (elPrio) {
    var chart = echarts.init(elPrio, null, { renderer: 'svg' });
    chart.setOption(Object.assign({}, baseOpt, {
      grid: { left: 50, right: 20, top: 30, bottom: 40 },
      xAxis: {
        type: 'value', name: '工作量（相对）', nameTextStyle: { color: muted },
        axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } }
      },
      yAxis: {
        type: 'value', name: '收益（相对）', nameTextStyle: { color: muted },
        axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'scatter',
        data: [
          { value: [3, 10], name: 'P0 正确性修复' },
          { value: [5, 7], name: 'P1 成本与质量' },
          { value: [7, 4], name: 'P2 顶级听感' }
        ],
        symbolSize: 30,
        label: {
          show: true, position: 'top', color: ink,
          formatter: function (p) { return p.name; }
        },
        itemStyle: {
          color: function (p) {
            return p.name === 'P0 正确性修复' ? ok : p.name === 'P1 成本与质量' ? accent2 : accent;
          }
        }
      }],
      tooltip: { trigger: 'item', appendToBody: true, formatter: function (p) { return p.name + '<br/>工作量 ' + p.value[0] + ' / 收益 ' + p.value[1]; } }
    }));
    window.addEventListener('resize', function () { chart.resize(); });
  }
})();
