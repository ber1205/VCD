// VCD 7 项问题修复状态图表
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var ok = style.getPropertyValue('--ok').trim();
  var warn = style.getPropertyValue('--warn').trim();
  var bad = style.getPropertyValue('--bad').trim();

  // --- 图 1: 7 项问题修复状态 ---
  var el = document.getElementById('chart-status');
  if (el) {
    var chart = echarts.init(el, null, { renderer: 'svg' });
    var items = [
      { name: '① F0 链路', status: '部分修复', color: warn },
      { name: '② 重试计费', status: '部分修复', color: warn },
      { name: '③ 失败分类', status: '部分具备', color: warn },
      { name: '④ 克隆段分级', status: '未实现', color: bad },
      { name: '⑤ 多说话人并行', status: '部分实现', color: warn },
      { name: '⑥ Qwen 门控', status: '已实现', color: ok },
      { name: '⑦ 跨语言特征', status: '未实现', color: bad }
    ];
    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        formatter: function (p) {
          return '<b>' + p.name + '</b><br/>状态：' + p.data.status;
        }
      },
      grid: { left: 60, right: 40, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: items.map(function (i) { return i.name; }),
        axisLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontSize: 11, interval: 0 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        show: false,
        min: 0,
        max: 1
      },
      series: [{
        type: 'bar',
        data: items.map(function (i) {
          return {
            value: 1,
            name: i.name,
            status: i.status,
            itemStyle: { color: i.color, borderRadius: [6, 6, 0, 0] }
          };
        }),
        barWidth: 42,
        label: {
          show: true,
          position: 'top',
          formatter: function (p) { return p.data.status; },
          color: ink,
          fontSize: 11,
          fontWeight: 600
        }
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }
})();
