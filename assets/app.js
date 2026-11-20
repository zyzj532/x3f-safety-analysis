/* X3-F 安全分析 · 交互脚本（按页取用，缺元素自动跳过） */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 阅读进度 / 回顶 ---------- */
  var bar = $('#progress'), topBtn = $('#top');
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    if (topBtn) topBtn.classList.toggle('show', window.scrollY > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (topBtn) topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- 章节高亮 ---------- */
  var cur = document.body.dataset.ch;
  if (cur) {
    $$('.side-nav a').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('href') === cur + '.html');
    });
  }

  /* ---------- 主题 ---------- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('x3f-theme'); } catch (e) {}
  if (saved) root.dataset.theme = saved;
  var themeBtn = $('#themeBtn');
  function toggleTheme() {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('x3f-theme', root.dataset.theme); } catch (e) {}
  }
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  /* ---------- 数字滚动 ---------- */
  function countUp(el) {
    var finalText = el.textContent;
    var target = parseFloat(el.dataset.count) || 0;
    var prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    var dur = 1000, t0 = null, done = false;
    function fin() { if (done) return; done = true; el.textContent = finalText; }
    function step(t) {
      if (done) return;
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - k, 3))) + suffix;
      if (k < 1) requestAnimationFrame(step); else fin();
    }
    requestAnimationFrame(step);
    setTimeout(fin, 1500);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.3 });
    $$('[data-count]').forEach(function (c) { cio.observe(c); });
  }

  /* ---------- 首页：三句话展开 ---------- */
  $$('.claim').forEach(function (c) {
    c.addEventListener('click', function () { c.classList.toggle('open'); });
  });

  /* ---------- 系统分解 ---------- */
  var PARTS = {
    air: {
      title: '飞行体 X3-F', role: '按航空器管理 · CCAR-21 专用条件',
      rows: [['构型', '六轴六桨双涵道，碳纤维机身与桨叶'],
             ['乘员', '2 座（1 名驾驶员 + 1 名乘客）'],
             ['冗余', '飞控 3 / 动力 2 / 供电 2 / 通信 2 / 操控 2（厂商口径）'],
             ['失效容限', '2 副旋翼失效仍可控（厂商口径，推定 3 副以上失控）'],
             ['重量级', '最大起飞重量 ≤960 kg（专用条件征求意见稿）'],
             ['审定', 'TC 2024-03-21 受理；专用条件征求意见中']]
    },
    dock: {
      title: '分合机构', role: '接口 · 两套体系都不覆盖的地带',
      rows: [['时间', '约 5 分钟完成分离 / 结合（设计值）'],
             ['安全职责', '地面可靠解锁，空中绝对锁死'],
             ['确认手段', '位置信号 + 载荷/位移双确认（推定做法）'],
             ['互锁', '飞行中禁止分离，优先级高于人工指令'],
             ['验证', '疲劳寿命、异物、误操作、公差累积'],
             ['风险', '到位信号早闭 → 带载起飞 / 空中分离']]
    },
    ground: {
      title: '陆行体', role: '按机动车管理',
      rows: [['驱动', '三轴六轮 6×6 + 后轮转向'],
             ['动力', '增程式混合动力，兼作移动补能站'],
             ['作用', '运输、收纳、充电、地面保障'],
             ['资质', 'C 照可驾驶（厂商口径）'],
             ['新增风险', '装载后重心升高、侧风面积增大'],
             ['边界', '同时受 GB 机动车法规与营地运行规则约束']]
    }
  };
  var specTitle = $('#specTitle');
  if (specTitle) {
    var specRole = $('#specRole'), specList = $('#specList');
    var selectPart = function (key) {
      $$('.part').forEach(function (p) {
        var on = p.dataset.part === key;
        p.classList.toggle('active', on);
        p.classList.toggle('dim', !on);
      });
      var d = PARTS[key];
      specTitle.textContent = d.title;
      specRole.textContent = d.role;
      specList.innerHTML = d.rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('');
    };
    $$('.part').forEach(function (p) { p.addEventListener('click', function () { selectPart(p.dataset.part); }); });
    selectPart('air');
  }

  /* ---------- 运行阶段 ---------- */
  var PHASES = [
    { n: '地面行驶', t: '数十分钟 · 占使用时间的大头', h: '陆行体电池、制动、重心与侧风稳定性', r: '这一段的风险完全按机动车计，但它由航空部件（飞行体）引起，法规归属模糊。' },
    { n: '分合 / 装载', t: '约 5 分钟 · 每架次必做', h: '锁未到位、误分离、异物、人员被夹', r: '全机唯一的两套体系交界面。STPA 里"到位信号早闭"就出在这里。' },
    { n: '起飞悬停', t: '1–3 分钟 · 失效最集中的阶段', h: '单点失效、低空风切变、地面人员暴露', r: '高度低、速度低，处置窗口最短；同时地面第三方暴露最大。' },
    { n: '爬升巡航', t: '占飞行时间的多数', h: '多单元失效、电池衰减、空域冲突', r: '高度换来了处置时间，但一旦失控，坠撞能量也最大。' },
    { n: '进近着陆', t: '2–5 分钟 · 第二高风险段', h: '下沉气流、侧风、重着陆、场地障碍', r: '与起飞对称，但乘员已疲劳、注意力下降，人因占比上升。' },
    { n: '收纳固定', t: '约 5 分钟', h: '机构误动作、夹伤、临时停放', r: '多数人认为"落地就安全了"，实际上机构和人员仍在风险里。' },
    { n: '补能与停放', t: '数小时 · 地面风险的长尾', h: '充电热失控、火灾、第三方靠近', r: '营地火灾的后果不比空中事故轻，却常被排除在"飞行安全"之外。' }
  ];
  var phDetail = $('#phDetail');
  if (phDetail) {
    var showPhase = function (i) {
      $$('.ph').forEach(function (e) { e.classList.toggle('on', +e.dataset.ph === i); });
      var d = PHASES[i];
      phDetail.innerHTML = '<h4>' + d.n + '</h4><div class="meta">' + d.t + '</div>' +
        '<div style="margin-bottom:5px"><b style="color:var(--ink2)">主要危害：</b>' + d.h + '</div>' +
        '<div><b style="color:var(--ink2)">判断：</b>' + d.r + '</div>';
    };
    $$('.ph').forEach(function (e) { e.addEventListener('click', function () { showPhase(+e.dataset.ph); }); });
    showPhase(2);
  }

  /* ---------- 表格筛选 ---------- */
  function bindFilter(chipsSel, rowSel) {
    var chips = $$(chipsSel + ' .chip');
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('on'); });
        chip.classList.add('on');
        var f = chip.dataset.filter;
        $$(rowSel).forEach(function (tr) {
          tr.style.display = (f === 'all' || tr.dataset.lv === f) ? '' : 'none';
        });
      });
    });
  }
  bindFilter('#fhaChips', '#fhaTable tbody tr');
  bindFilter('#ucaChips', '#ucaTable tbody tr');

  /* ---------- 证据可见度筛选 ---------- */
  var evChips = $$('#evChips .chip');
  if (evChips.length) {
    $$('#evTable tbody tr').forEach(function (tr) {
      var last = tr.lastElementChild.textContent || '';
      tr.dataset.lv = last.indexOf('未见') > -1 ? 'none' : 'seen';
    });
    evChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        evChips.forEach(function (c) { c.classList.remove('on'); });
        chip.classList.add('on');
        var f = chip.dataset.filter;
        $$('#evTable tbody tr').forEach(function (tr) {
          tr.style.display = (f === 'all' || tr.dataset.lv === f) ? '' : 'none';
        });
      });
    });
  }

  /* ---------- 故障树 ---------- */
  var FTA = {
    top: { k: 'TOP EVENT', t: '飞行中丧失可控推力 / 失控', p: [
        '这是所有灾难性路径的汇聚点，也是 10⁻⁹ 预算的最终去处。它不是一个"部件"，而是一组状态的集合：推力不足以维持飞行、或推力还在但姿态不可控。',
        '把它放在顶上，是为了逼出一个问题：下面四条支路，哪一条是单点？哪一条的"冗余"经不起共因？'
      ], rows: [['总目标', '≤10⁻⁹ / 飞行小时'], ['本页估算合计', '≈2.1×10⁻⁶'], ['差距', '三个数量级']] },
    a: { k: 'BRANCH A · AND', t: '推力单元失效 ≥3/6', p: [
        '六轴六桨、2 副失效仍可控 ⇒ 需要 3 副同时失效才失控。独立假设下按二项分布：C(6,3)λ³ ≈ 2.5×10⁻¹²，比目标低三个数量级。',
        '但"独立"是全部前提。同侧双失效、共用电源、同一批次的电机，都会把 AND 悄悄变成 OR。'
      ], rows: [['割集', '3 个单元（共 20 组）'], ['假设 λ', '5×10⁻⁵ / 小时'], ['估算', '2.5×10⁻¹² / 小时']] },
    b: { k: 'BRANCH B · OR', t: '能源丧失', p: [
        '电池热失控或母线短路，任何一处都能单独把推力清零——这是典型的单点失效，没有"表决"可救。',
        '缓解只能靠物理隔离（分区、熔断、热障）把概率压到 10⁻⁷ 以下，或者靠抛放/隔离把后果从"灾难"降到"危险"。'
      ], rows: [['割集', '单点（1 阶）'], ['假设 λ', '10⁻⁶ / 小时'], ['缓解后', '≈10⁻⁷ / 小时']] },
    c: { k: 'BRANCH C · 2oo3 + β', t: '飞控失效', p: [
        '2oo3 独立项是 3λ²。取 λ=10⁻⁴，仅这一项就有 3×10⁻⁸，已经比目标高 30 倍——所以单套飞控的可靠性必须做到 10⁻⁵ 量级，否则再多的表决也补不回来。',
        '更麻烦的是共因项 βλ：β=0.02 时是 2×10⁻⁶，直接主导全局。降低 β 只能靠相异软件、独立供电与独立时钟，不能靠"多装一套"。'
      ], rows: [['独立项', '3λ² = 3×10⁻⁸'], ['共因项', 'βλ = 2×10⁻⁶（β=0.02）'], ['结论', 'β 决定量级']] },
    d: { k: 'BRANCH D · OR', t: '结构与涵道失效', p: [
        '机臂断裂、桨叶脱落、涵道结构失效，通常源于疲劳、异物打伤或制造缺陷。它们不是"概率极低的随机故障"，而是"有明确诱因、可以被检查发现"的失效。',
        '所以这一支的关键证据不是概率计算，而是损伤容限设计 + 检查大纲 + 振动监测。'
      ], rows: [['割集', '单点 / 局部'], ['典型诱因', '疲劳、FOD、缺陷'], ['控制手段', '损伤容限 + 定期检查']] }
  };
  var ftaInfo = $('#ftaInfo');
  if (ftaInfo) {
    var showNode = function (id) {
      $$('.node').forEach(function (n) { n.classList.toggle('on', n.dataset.node === id); });
      var d = FTA[id];
      ftaInfo.innerHTML = '<div class="k">' + d.k + '</div><h4>' + d.t + '</h4>' +
        d.p.map(function (x) { return '<p>' + x + '</p>'; }).join('') +
        d.rows.map(function (r) { return '<div class="row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
    };
    $$('.node').forEach(function (n) { n.addEventListener('click', function () { showNode(n.dataset.node); }); });
    showNode('top');
  }

  /* ---------- β 滑杆 ---------- */
  var betaRange = $('#betaRange');
  if (betaRange) {
    var LAM = 1e-4, BATT = 1e-7, TARGET = 1e-9;
    var fmt = function (p) { return p.toExponential(1).replace('e-', '×10⁻').replace('e+', '×10'); };
    var mult = function (p) {
      var m = p / TARGET;
      if (m < 10) return m.toFixed(1) + '×';
      if (m < 1e5) return Math.round(m).toLocaleString('en-US') + '×';
      return p.toExponential(0).replace('e-', '×10⁻').replace('e+', '×10') + '×';
    };
    var updateBeta = function () {
      var t = betaRange.value / 100;
      var beta = Math.pow(10, -5 + t * (Math.log10(5e-2) + 5));
      var ind = 3 * LAM * LAM, cc = beta * LAM, sum = ind + cc, tot = sum + BATT;
      var set = function (id, v) { var e = $('#' + id); if (e) e.textContent = v; };
      set('bVal', beta >= 0.001 ? beta.toFixed(4) : beta.toExponential(1).replace('e-', '×10⁻'));
      set('vInd', fmt(ind)); set('mInd', mult(ind));
      set('vCc', fmt(cc)); set('mCc', mult(cc));
      set('vSum', fmt(sum)); set('mSum', mult(sum));
      set('vBat', fmt(BATT)); set('mBat', mult(BATT));
      set('vTot', fmt(tot)); set('mTot', mult(tot));
      var share = Math.round(cc / sum * 100);
      $('#betaShare').textContent = '共因占飞控总失效率 ' + share + '%';
      $('#betaFoot').textContent = '合计 ' + fmt(tot) + ' / 小时，是目标 10⁻⁹ 的 ' + mult(tot) +
        '。把 β 从 5×10⁻² 一路拉到 10⁻⁵，共因项会消失，但独立项 3λ² 仍停在 3×10⁻⁸ —— 这才是真正卡住 10⁻⁹ 的那道墙：单套设备的可靠性。';
    };
    betaRange.addEventListener('input', updateBeta);
    updateBeta();
  }

  /* ---------- 风险矩阵 ---------- */
  var HZ = [
    { id: 'H1', n: '空中分离', s: 4, p: 1, d: '分合锁在飞行中解锁，飞行体脱离', c: '双余度锁 + 飞行中互锁 + 到位双确认', r: '互锁失效是最难排除的路径；需专项 FMEA 与误操作试验' },
    { id: 'H2', n: '电池热失控', s: 4, p: 2, d: '单体短路蔓延至整包，推力归零并起火', c: '热障 / 熔断 / 独立舱 / BMS 预警', r: '缓解后仍是单点；毒烟与座舱完整性另需论证' },
    { id: 'H3', n: '飞控共因失效', s: 4, p: 1, d: '同源软件或共模电源同时打掉三套通道', c: '相异软件 + 独立供电 + 交叉比较', r: 'β 未公开前，冗余的独立性无法判断' },
    { id: 'H4', n: '重着陆 / 硬着陆', s: 3, p: 4, d: '下沉气流或侧风超限，触地过载超限', c: '包线保护 + 自动着陆限制 + 训练', r: '保护逻辑依赖传感器可信度' },
    { id: 'H5', n: '分合未锁到位', s: 3, p: 3, d: '带载起飞，锁止在振动中失效', c: '载荷/位移双确认 + 飞控互锁', r: '微动开关早闭是典型误报点' },
    { id: 'H6', n: '低空风切变', s: 3, p: 3, d: '起降段遭遇下沉气流，高度不可恢复', c: '风速限制 + 场地选址 + 气象窗口', r: '低空气象预报精度本身有限' },
    { id: 'H7', n: '地面第三方伤亡', s: 4, p: 2, d: '坠撞或掉件落在营地区域内的人员', c: '隔离空域 + 场地围界 + 航线避开人群', r: '第三方风险的控制完全依赖运行管理' },
    { id: 'H8', n: '营地充电火灾', s: 2, p: 3, d: '高倍率充电引发热失控，波及建筑', c: '充电监控 + 消防 + 间距', r: '地面火灾常被排除在"飞行安全"之外' },
    { id: 'H9', n: '数据链中断', s: 2, p: 4, d: '失去监视与远程干预能力', c: '双链路 + 自主返航', r: '对有人驾驶影响有限，对远程接管影响大' },
    { id: 'H10', n: '噪声扰民', s: 1, p: 5, d: '起降与低空通过时的持续噪声', c: '涵道降噪 + 航线避让 + 时段限制', r: '社区接受度可能比技术指标更早成为瓶颈' },
    { id: 'H11', n: '桨叶断裂击伤', s: 3, p: 2, d: '桨叶失效飞出，伤及地面人员', c: '涵道包容 + 损伤容限 + 检查', r: '涵道提供包容，但开口方向仍有暴露' }
  ];
  var SEV = { 1: 'D 轻微', 2: 'C 重大', 3: 'B 危险', 4: 'A 灾难' };
  var PROB = { 5: '频繁', 4: '可能', 3: '偶发', 2: '罕见', 1: '极罕见' };
  function riskClass(p, s) {
    var e = Math.max(p * s, s === 4 ? 13 : s === 3 ? 9 : 0);
    return e <= 4 ? 'r1' : e <= 8 ? 'r2' : e <= 12 ? 'r3' : e <= 16 ? 'r4' : 'r5';
  }
  var mx = $('#riskMatrix');
  if (mx) {
    var html = '<div class="hd"></div>';
    [1, 2, 3, 4].forEach(function (s) { html += '<div class="hd">' + SEV[s] + '</div>'; });
    for (var p = 5; p >= 1; p--) {
      html += '<div class="hd">' + PROB[p] + '</div>';
      [1, 2, 3, 4].forEach(function (s) {
        html += '<div class="cell ' + riskClass(p, s) + '" data-p="' + p + '" data-s="' + s + '"></div>';
      });
    }
    mx.innerHTML = html;
    var mxDetail = $('#mxDetail');
    var showHz = function (h, el) {
      $$('.dot').forEach(function (x) { x.classList.remove('on'); });
      if (el) el.classList.add('on');
      mxDetail.innerHTML = '<div class="mm">' + h.id + ' · 严重度 ' + SEV[h.s] + ' × 可能性 ' + PROB[h.p] +
        ' = 风险值 ' + (h.s * h.p) + '</div><h4>' + h.n + '</h4>' +
        '<div style="margin-bottom:5px"><b style="color:var(--ink2)">场景：</b>' + h.d + '</div>' +
        '<div style="margin-bottom:5px"><b style="color:var(--ink2)">现有屏障：</b>' + h.c + '</div>' +
        '<div><b style="color:var(--ink2)">残余：</b>' + h.r + '</div>';
    };
    HZ.forEach(function (h) {
      var cell = mx.querySelector('.cell[data-p="' + h.p + '"][data-s="' + h.s + '"]');
      if (!cell) return;
      var d = document.createElement('span');
      d.className = 'dot';
      d.textContent = h.id.slice(1);
      d.title = h.n;
      d.addEventListener('click', function (e) { e.stopPropagation(); showHz(h, d); });
      cell.appendChild(d);
    });
    showHz(HZ[0], mx.querySelector('.dot'));
  }

  /* ---------- 子系统标签 ---------- */
  function bindTabs() {
    var tabs = $$('.tab');
    if (!tabs.length) return;
    var panels = $$('.panel');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        panels.forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; });
      });
    });
  }
  bindTabs();

  /* ---------- 结论手风琴 ---------- */
  var concl = $('#concl');
  if (concl) {
    $$('.acc-h').forEach(function (h) {
      h.addEventListener('click', function () {
        var acc = h.parentElement;
        var isOpen = acc.classList.contains('open');
        $$('.acc', concl).forEach(function (a) {
          a.classList.remove('open');
          var b = a.querySelector('.acc-h');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) { acc.classList.add('open'); h.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* ---------- 来源搜索 ---------- */
  var si = $('#srcSearch');
  if (si) {
    var srcs = $$('#srcs li'), sc = $('#srcCount');
    var filterSrc = function () {
      var q = si.value.trim().toLowerCase(), n = 0;
      srcs.forEach(function (li) {
        var hit = !q || li.textContent.toLowerCase().indexOf(q) > -1;
        li.classList.toggle('gone', !hit);
        if (hit) n++;
      });
      sc.textContent = n + ' / ' + srcs.length;
    };
    si.addEventListener('input', filterSrc);
    filterSrc();
  }

  /* ---------- 键盘 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 't' || e.key === 'T') { if (themeBtn) themeBtn.click(); }
    if (e.key === 'ArrowLeft' && document.body.dataset.prev) location.href = document.body.dataset.prev;
    if (e.key === 'ArrowRight' && document.body.dataset.next) location.href = document.body.dataset.next;
  });
})();
