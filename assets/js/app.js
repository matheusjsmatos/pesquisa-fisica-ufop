/* ==========================================================================
   Portal de pesquisa do DEFIS/UFOP — lógica das páginas
   Lê window.DEFIS (gerado por scripts/build_site.py) e desenha cada página.
   ========================================================================== */
(function () {
  'use strict';
  const D = window.DEFIS;
  const PAGINA = document.body.dataset.page;
  const nf = new Intl.NumberFormat('pt-BR');
  const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
  let nomeRegiao = (c) => c;
  try { const dn = new Intl.DisplayNames(['pt-BR'], { type: 'region' }); nomeRegiao = (c) => { try { return dn.of(c) || c; } catch (e) { return c; } }; } catch (e) {}

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const semAcento = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  /* ------------------------------------------------------------ tema */
  const raiz = document.documentElement;
  try { const t = localStorage.getItem('defis-tema'); if (t) raiz.dataset.theme = t; } catch (e) {}

  /* ------------------------------------------------------------ cabeçalho e rodapé */
  const NAV = [
    ['index.html', 'Visão geral', 'inicio'],
    ['producao.html', 'Produção', 'producao'],
    ['formacao.html', 'Formação', 'formacao'],
    ['projetos.html', 'Projetos e prêmios', 'projetos'],
    ['colaboracao.html', 'Colaboração', 'colaboracao'],
    ['docentes.html', 'Docentes', 'docentes'],
    ['metodologia.html', 'Metodologia', 'metodologia'],
    ['relatorio/index.html', 'Relatório completo', 'relatorio'],
  ];
  function montaCasca() {
    const h = document.createElement('header');
    h.className = 'topo';
    h.innerHTML = `<a class="skip" href="#conteudo">Pular para o conteúdo</a>
      <div class="wrap">
        <a class="marca" href="index.html" aria-label="Pesquisa no Departamento de Física da UFOP — início"><span class="logo-ufop" aria-hidden="true"></span><span class="txt"><b>Física UFOP</b><span>Pesquisa</span></span></a>
        <button class="menu-btn" aria-expanded="false" aria-controls="menu">Menu</button>
        <nav class="menu" id="menu" aria-label="Seções do portal">
          ${NAV.map(([href, rot, id]) => `<a href="${href}"${id === PAGINA ? ' aria-current="page"' : ''}>${rot}</a>`).join('')}
        </nav>
        <button class="tema-btn" type="button" title="Alternar tema claro/escuro" aria-label="Alternar tema claro ou escuro">◐</button>
      </div>`;
    document.body.prepend(h);
    const btn = $('.menu-btn', h), menu = $('.menu', h);
    btn.addEventListener('click', () => { const a = menu.classList.toggle('aberto'); btn.setAttribute('aria-expanded', a); });
    $('.tema-btn', h).addEventListener('click', () => {
      const escuro = raiz.dataset.theme ? raiz.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      raiz.dataset.theme = escuro ? 'light' : 'dark';
      try { localStorage.setItem('defis-tema', raiz.dataset.theme); } catch (e) {}
      location.reload();
    });
    const f = document.createElement('footer');
    f.className = 'rodape';
    f.innerHTML = `<div class="wrap">
      <div><span class="logo-ufop" role="img" aria-label="UFOP"></span><b>Departamento de Física</b>Instituto de Ciências Exatas e Biológicas<br>Universidade Federal de Ouro Preto<br>
        <a href="${esc(D.meta.dept_url)}">${esc(D.meta.dept_url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></div>
      <div><b>Sobre os dados</b>Currículos Lattes processados pelo scriptLattes em ${esc(D.meta.processamento)}.
        Portal gerado em ${esc(D.meta.gerado)}. <a href="metodologia.html">Como os números são produzidos</a>.</div>
      <div><b>Contato</b>Correções nos dados devem ser feitas no próprio currículo Lattes; elas aparecem aqui na atualização seguinte.
        ${D.meta.contato ? `<br><a href="mailto:${esc(D.meta.contato)}">${esc(D.meta.contato)}</a>` : ''}</div>
    </div>`;
    document.body.append(f);
  }

  /* ------------------------------------------------------------ dados derivados */
  const DOC = D.docentes;
  const SEC = Object.fromEntries(D.secoes.map((s) => [s.c, s]));
  const total = (c) => (SEC[c] ? SEC[c].n : 0);
  const serie = (c) => (SEC[c] ? SEC[c].s : {});
  const ANO = D.meta.ano_corrente;
  const INI = D.meta.inicio_destaque;
  const somaSerie = (codes, de = 0, ate = 9999) => codes.reduce((t, c) => t + Object.entries(serie(c)).reduce((u, [a, n]) => u + (+a >= de && +a <= ate ? n : 0), 0), 0);
  const nomeCurto = (n) => { const p = n.split(' '); return p.length > 2 ? `${p[0]} ${p[p.length - 1]}` : n; };
  const rotBolsa = (b) => { const m = /N[íi]vel\s*([0-9A-Z]+)/.exec(b); return /Visitante/i.test(b) ? 'Pesquisador visitante CNPq' : m ? `Bolsa PQ ${m[1]}` : 'Bolsa CNPq'; };
  const iniciais = (n) => n.split(' ').filter((p) => p.length > 2).slice(0, 2).map((p) => p[0]).join('');
  const ARTIGOS = D.itens.filter((i) => i.t === 'PB0');
  const ROT = Object.fromEntries(D.secoes.map((s) => [s.c, s.r]));

  const COR = () => ({
    steel: css('--steel'), wine: css('--wine'), teal: css('--teal'), gold: css('--gold'), violet: css('--violet'),
    clay: css('--clay'), ink: css('--ink'), mid: css('--ink-mid'), soft: css('--ink-soft'), line: css('--line'), surface: css('--surface'),
  });
  const PALETA = () => { const c = COR(); return [c.steel, c.wine, c.teal, c.gold, c.violet, c.clay, c.soft]; };

  function chartDefaults() {
    if (!window.Chart) return;
    const c = COR();
    Chart.defaults.font.family = css('--f-sans');
    Chart.defaults.font.size = 12;
    Chart.defaults.color = c.mid;
    Chart.defaults.borderColor = c.line;
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
    Chart.defaults.plugins.legend.labels.boxHeight = 12;
    Chart.defaults.plugins.tooltip.backgroundColor = c.ink;
    Chart.defaults.plugins.tooltip.titleColor = c.surface;
    Chart.defaults.plugins.tooltip.bodyColor = c.surface;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.animation = matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 400 };
  }
  const graficos = {};
  function grafico(id, cfg) {
    const el = document.getElementById(id);
    if (!el || !window.Chart) return null;
    if (graficos[id]) graficos[id].destroy();
    graficos[id] = new Chart(el, cfg);
    return graficos[id];
  }
  const anos = (de, ate) => Array.from({ length: ate - de + 1 }, (_, k) => de + k);
  const escalaAnos = { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } };

  function barras(el, linhas, cor, fmt = (v) => nf.format(v)) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el) return;
    const max = Math.max(1, ...linhas.map((l) => l[1]));
    el.innerHTML = linhas.length ? `<div class="barras">${linhas.map(([rot, v, dica]) => `
      <div class="barra" ${dica ? `title="${esc(dica)}"` : ''}><span>${esc(rot)}</span>
        <span class="trilho"><i style="width:${(100 * v / max).toFixed(1)}%;background:${cor || 'var(--steel)'}"></i></span>
        <span class="v">${fmt(v)}</span></div>`).join('')}</div>` : '<p class="vazio">Dado em processo de atualização.</p>';
  }
  const selo = (tipo, txt) => `<span class="selo selo-${tipo}">${txt}</span>`;

  function opcoesDocentes(sel, rotuloTodos = 'Todos os docentes') {
    const ord = DOC.map((d, i) => [d.nome, i]).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
    sel.innerHTML = `<option value="">${rotuloTodos}</option>` + ord.map(([n, i]) => `<option value="${i}">${esc(n)}</option>`).join('');
  }
  function opcoesAnos(sel, de, ate, selecionado) {
    sel.innerHTML = anos(de, ate).map((a) => `<option${a === selecionado ? ' selected' : ''}>${a}</option>`).join('');
  }
  const params = new URLSearchParams(location.search);
  const anoMin = Math.min(...ARTIGOS.map((i) => i.a).filter(Boolean));

  function baixarCSV(nome, linhas) {
    const conteudo = '\ufeff' + linhas.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
    a.download = nome;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ======================================================================
     VISÃO GERAL
     ====================================================================== */
  function inicio() {
    const ser = serie('PB0');
    const anosS = Object.keys(ser).map(Number);
    const de = Math.min(...anosS), ate = Math.max(...anosS);
    const recorte = somaSerie(['PB0'], INI, ANO);
    $('#lede').textContent =
      `${D.meta.n_docentes} docentes do Departamento de Física da UFOP e o que registram em seus currículos Lattes: ` +
      `${nf.format(total('PB0'))} artigos em periódicos desde ${de}, ${nf.format(total('OC0') + total('OC1') + total('OC2') + total('OC3') + total('OC4') + total('OC5') + total('OC6'))} orientações concluídas ` +
      `e ${nf.format(total('Pj'))} projetos de pesquisa. Os números se atualizam a cada nova extração do scriptLattes.`;

    /* espectro: uma linha de emissão por ano, altura e brilho proporcionais aos artigos */
    const svg = d3.select('#espectro');
    const W = svg.node().getBoundingClientRect().width || 1000, H = svg.node().getBoundingClientRect().height || 170, mT = 14, mB = 26;
    svg.attr('viewBox', `0 0 ${W} ${H}`);
    const x = d3.scaleLinear().domain([de - .5, ate + .5]).range([0, W]);
    const max = d3.max(Object.values(ser));
    const y = d3.scaleLinear().domain([0, max]).range([H - mB, mT]);
    const cor = d3.scaleSequential(d3.interpolateRgbBasis(['#7a2b52', '#c0453f', '#e0a43a', '#f3e27a', '#7fd0a8', '#5aa7e6', '#8f7ff0'])).domain([de, ate]);
    const g = svg.append('g');
    anosS.forEach((a) => {
      const n = ser[a];
      g.append('line').attr('class', 'linha').attr('x1', x(a)).attr('x2', x(a)).attr('y1', H - mB).attr('y2', y(n))
        .attr('stroke', cor(a)).attr('stroke-width', Math.max(2, W / (ate - de + 1) * 0.38)).attr('stroke-linecap', 'butt')
        .attr('opacity', 0.35 + 0.65 * n / max).attr('data-ano', a);
    });
    if (anosS.includes(ANO) && W > 500) {
      g.append('text').attr('x', x(ANO)).attr('y', y(ser[ANO]) - 6).attr('text-anchor', 'middle').attr('fill', '#8796a3').attr('font-size', 10).text('em curso');
    }
    const eixo = svg.append('g').attr('class', 'eixo');
    anosS.filter((a) => (W < 500 ? a % 10 === 0 : a % 5 === 0) || a === de || a === ate).forEach((a) => {
      eixo.append('text').attr('x', x(a)).attr('y', H - 6).attr('text-anchor', 'middle').text(a);
    });
    const leitura = $('#espectroLeitura');
    const padrao = `Passe o cursor ou toque sobre uma linha. Pico: ${anosS.find((a) => ser[a] === max)}, com ${max} artigos.`;
    leitura.textContent = padrao;
    svg.append('rect').attr('class', 'alvo').attr('x', 0).attr('y', 0).attr('width', W).attr('height', H)
      .on('mousemove touchstart', (ev) => {
        const [mx] = d3.pointer(ev.touches ? ev.touches[0] : ev, svg.node());
        const a = Math.round(x.invert(mx));
        if (!ser[a]) return;
        g.selectAll('line').attr('opacity', function () { return +this.dataset.ano === a ? 1 : 0.18; });
        leitura.innerHTML = `<strong>${a}</strong> — ${ser[a]} artigos em periódicos${a === ANO ? ' (ano em curso, dados parciais)' : ''}`;
      })
      .on('mouseleave', () => { g.selectAll('line').attr('opacity', function () { const n = ser[this.dataset.ano]; return 0.35 + 0.65 * n / max; }); leitura.textContent = padrao; });
    $('#espectroTopo').innerHTML = `<span><strong>Artigos em periódicos por ano</strong>, ${de}–${ate}</span><span>${nf.format(recorte)} artigos desde ${INI}</span>`;

    const conc = ['OC0', 'OC1', 'OC2', 'OC3', 'OC4', 'OC5', 'OC6'], and = ['OA0', 'OA1', 'OA2', 'OA3', 'OA4', 'OA5', 'OA6'];
    const ativos = D.projetos.filter((p) => !p.fim && /andamento/i.test(p.sit)).length;
    const pq = DOC.filter((d) => d.bolsa).length;
    const it = D.intl;
    const nums = [
      [nf.format(recorte), `artigos em periódicos de ${INI} a ${ANO}`, `${nf.format(total('PB0'))} em todo o histórico`],
      [nf.format(somaSerie(conc, INI, ANO)), `orientações concluídas de ${INI} a ${ANO}`, `${nf.format(and.reduce((t, c) => t + total(c), 0))} em andamento`],
      [nf.format(ativos), 'projetos de pesquisa em andamento', `${nf.format(total('Pj'))} registrados no histórico`],
      [it.cobertos ? pct.format(Object.values(it.por_ano).reduce((t, v) => t + v[1], 0) / it.cobertos) : '—', 'dos artigos com coautoria internacional', 'base: artigos com DOI localizados na OpenAlex'],
      [nf.format(pq), 'docentes com bolsa do CNPq', 'produtividade em pesquisa e outras modalidades'],
      [nf.format(somaSerie(['Pm'], INI, ANO)), `prêmios e títulos de ${INI} a ${ANO}`, `${nf.format(total('Pm'))} no histórico`],
    ];
    $('#numeros').innerHTML = nums.map(([v, r, s]) => `<div><dd>${v}</dd><dt>${r}</dt><small>${s}</small></div>`).join('');

    /* produção por natureza */
    const grupos = [
      ['Artigos em periódicos', ['PB0', 'PB7']],
      ['Trabalhos em congressos', ['PB4', 'PB5', 'PB6']],
      ['Livros e capítulos', ['PB1', 'PB2']],
      ['Produção técnica', ['PT0', 'PT1', 'PT2', 'PT3', 'PT4', 'PT5']],
      ['Divulgação e outras', ['PB3', 'PB8', 'PB9']],
    ];
    const anosG = anos(Math.max(de, ANO - 19), ANO);
    const p = PALETA();
    grafico('cNatureza', {
      type: 'bar',
      data: { labels: anosG, datasets: grupos.map(([rot, cs], k) => ({ label: rot, data: anosG.map((a) => cs.reduce((t, c) => t + (serie(c)[a] || 0), 0)), backgroundColor: p[k], stack: 's' })) },
      options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } },
    });

    /* temas (OpenAlex) */
    barras('temas', it.subcampos.slice(0, 10).map(([s, n]) => [s, n]), 'var(--teal)');
    $('#temasNota').innerHTML = `Subárea principal atribuída pela OpenAlex a cada artigo (classificação em inglês). Base: ${nf.format(it.cobertos)} de ${nf.format(it.artigos)} artigos.`;

    /* atualização dos currículos */
    const hoje = new Date();
    const meses = DOC.map((d) => { const [dd, mm, aa] = (d.cv || '').split('/').map(Number); return aa ? (hoje - new Date(aa, mm - 1, dd)) / (30.44 * 864e5) : 999; });
    const ate6 = meses.filter((m) => m <= 6).length, ate12 = meses.filter((m) => m <= 12).length;
    $('#frescor').innerHTML = `
      <dl class="numeros" style="margin-top:0">
        <div><dd>${ate6}</dd><dt>de ${DOC.length} currículos atualizados nos últimos 6 meses</dt></div>
        <div><dd>${ate12}</dd><dt>de ${DOC.length} atualizados nos últimos 12 meses</dt></div>
        <div><dd>${esc(D.meta.processamento.split(' ')[0])}</dd><dt>data da extração dos dados do Lattes</dt></div>
      </dl>`;
  }

  /* ======================================================================
     PRODUÇÃO
     ====================================================================== */
  function producao() {
    const fDoc = $('#fDoc'), fDe = $('#fDe'), fAte = $('#fAte');
    opcoesDocentes(fDoc);
    opcoesAnos(fDe, anoMin, ANO, INI);
    opcoesAnos(fAte, anoMin, ANO, ANO);
    if (params.get('docente') && DOC.some((d) => d.id === params.get('docente'))) fDoc.value = DOC.findIndex((d) => d.id === params.get('docente'));

    function filtra(lista) {
      const dd = fDoc.value === '' ? null : +fDoc.value, de = +fDe.value, ate = +fAte.value;
      return lista.filter((i) => i.a >= de && i.a <= ate && (dd === null || i.m.includes(dd)));
    }

    function desenha() {
      const de = +fDe.value, ate = +fAte.value;
      const arts = filtra(ARTIGOS);
      const c = COR();
      const ax = anos(de, ate);
      const comOx = arts.filter((i) => i.ox);
      const intl = (i) => i.ox && i.ox.p.some((p) => p !== 'BR');
      grafico('cArtigos', {
        type: 'bar',
        data: { labels: ax, datasets: [
          { label: 'Com coautoria internacional', data: ax.map((a) => arts.filter((i) => i.a === a && intl(i)).length), backgroundColor: c.wine, stack: 's' },
          { label: 'Somente instituições brasileiras', data: ax.map((a) => arts.filter((i) => i.a === a && i.ox && !intl(i)).length), backgroundColor: c.steel, stack: 's' },
          { label: 'Sem DOI localizado na OpenAlex', data: ax.map((a) => arts.filter((i) => i.a === a && !i.ox).length), backgroundColor: c.line, stack: 's' },
        ] },
        options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { position: 'bottom' } } },
      });
      $('#artigosNota').innerHTML = `<strong>${nf.format(arts.length)}</strong> artigos únicos no recorte. Cada artigo conta uma vez, mesmo quando assinado por vários docentes. ` +
        (ate === ANO ? `${ANO} está em curso: a barra do ano é parcial.` : '');

      /* Qualis */
      const ordem = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'B5', 'C', 'NP', 'ND'];
      const q = ordem.map((k) => [k === 'ND' ? 'Não identificado' : k, arts.filter((i) => (i.q || 'ND') === k).length]).filter((l) => l[1]);
      grafico('cQualis', {
        type: 'bar',
        data: { labels: q.map((l) => l[0]), datasets: [{ data: q.map((l) => l[1]), backgroundColor: q.map((l) => (/^A/.test(l[0]) ? c.steel : /^B/.test(l[0]) ? c.teal : c.soft)) }] },
        options: { plugins: { legend: { display: false } }, scales: escalaAnos },
      });
      const a14 = arts.filter((i) => /^A/.test(i.q || '')).length;
      $('#qualisNota').innerHTML = `${pct.format(a14 / Math.max(1, arts.length))} dos artigos do recorte estão em periódicos A1–A4. Estrato atribuído pelo scriptLattes com a lista Qualis de periódicos de janeiro de 2023; "não identificado" indica periódico sem correspondência na lista.`;

      /* acesso aberto e citações */
      const ab = comOx.filter((i) => i.ox.ab).length;
      $('#abertos').innerHTML = `<dl class="numeros" style="margin-top:0">
        <div><dd>${comOx.length ? pct.format(ab / comOx.length) : '—'}</dd><dt>em acesso aberto</dt><small>${nf.format(ab)} de ${nf.format(comOx.length)} artigos localizados</small></div>
        <div><dd>${nf.format(comOx.reduce((t, i) => t + i.ox.c, 0))}</dd><dt>citações recebidas pelos artigos do recorte</dt><small>segundo a OpenAlex</small></div></dl>`;

      /* periódicos */
      const porVeic = {};
      arts.forEach((i) => {
        const k = (i.v || '—').toUpperCase();
        porVeic[k] = porVeic[k] || { n: 0, docs: new Set(), q: i.q, v: i.v };
        porVeic[k].n++; i.m.forEach((m) => porVeic[k].docs.add(m));
      });
      const top = Object.values(porVeic).sort((a, b) => b.n - a.n).slice(0, 20);
      $('#periodicos').innerHTML = top.map((p) => `<tr><td>${esc(p.v)}</td><td class="n">${p.n}</td><td class="n">${p.docs.size}</td><td>${p.q && p.q !== 'ND' ? `<span class="tag q">${p.q}</span>` : '<span class="tag">—</span>'}</td></tr>`).join('');

      /* tipos */
      const tipos = ['PB0', 'PB1', 'PB2', 'PB3', 'PB4', 'PB5', 'PB6', 'PB7', 'PB8', 'PB9', 'PT1', 'PT2', 'PT3', 'PT4', 'PT5', 'PAT', 'PA0'].filter((c) => SEC[c]);
      const dd = fDoc.value === '' ? null : +fDoc.value;
      barras('tipos', tipos.map((cc) => {
        const n = dd === null ? somaSerie([cc], de, ate) : D.itens.filter((i) => i.t === cc && i.a >= de && i.a <= ate && i.m.includes(dd)).length;
        return [ROT[cc], n];
      }).filter((l) => l[1]), 'var(--steel)');
      $('#tiposNota').innerHTML = dd === null ? 'Contagem de itens únicos por tipo no recorte.' :
        'Para um docente, os tipos sem lista no explorador (resumos, apresentações) não são filtrados: consulte a página do docente no relatório completo.';
      explorar(true);
    }

    /* explorador */
    const eBusca = $('#eBusca'), eTipo = $('#eTipo'), eQualis = $('#eQualis'), eOrdem = $('#eOrdem');
    const tiposEx = [...new Set(D.itens.map((i) => i.t))];
    eTipo.innerHTML = '<option value="">Todos os tipos</option>' + tiposEx.map((t) => `<option value="${t}">${esc(ROT[t])}</option>`).join('');
    let pagina = 0, atual = [];
    const POR = 25;
    function explorar(reset) {
      if (reset) pagina = 0;
      const termo = semAcento(eBusca.value.trim());
      const palavras = termo.split(/\s+/).filter(Boolean);
      atual = filtra(D.itens).filter((i) => (!eTipo.value || i.t === eTipo.value)
        && (!eQualis.value || (eQualis.value === 'A' ? /^A/.test(i.q || '') : (i.q || '') === eQualis.value))
        && (!palavras.length || palavras.every((p) => semAcento(`${i.ti} ${i.v || ''} ${i.au || ''} ${i.d || ''} ${i.m.map((m) => DOC[m].nome).join(' ')}`).includes(p))));
      const o = eOrdem.value;
      atual.sort((a, b) => (o === 'cit' ? ((b.ox?.c || 0) - (a.ox?.c || 0)) : o === 'antigo' ? a.a - b.a : b.a - a.a) || a.ti.localeCompare(b.ti));
      const ini = pagina * POR, fim = Math.min(atual.length, ini + POR);
      $('#eResumo').innerHTML = `<span>${nf.format(atual.length)} itens${atual.length ? ` — mostrando ${ini + 1} a ${fim}` : ''}</span>
        <button class="btn" id="eCsv" type="button">Baixar resultado (CSV)</button>`;
      $('#eCsv').onclick = () => baixarCSV('producao-defis.csv', [['Tipo', 'Ano', 'Título', 'Autores', 'Veículo', 'DOI', 'Qualis', 'Docentes DEFIS', 'Citações (OpenAlex)'],
        ...atual.map((i) => [ROT[i.t], i.a, i.ti, i.au, i.v, i.d, i.q, i.m.map((m) => DOC[m].nome).join(', '), i.ox ? i.ox.c : ''])]);
      $('#eLista').innerHTML = atual.length ? atual.slice(ini, fim).map((i) => `<li>
        <span class="tit">${esc(i.ti)}</span>
        ${i.au ? `<span class="aut">${esc(i.au)}</span>` : ''}
        <span class="meta"><span class="tag">${esc(ROT[i.t])}</span><span>${i.a || 's/ ano'}</span>${i.v ? `<span>${esc(i.v)}</span>` : ''}
          ${i.q && i.q !== 'ND' ? `<span class="tag q" title="Qualis periódicos (lista de jan/2023)">Qualis ${i.q}</span>` : ''}
          ${i.d ? `<a href="https://doi.org/${esc(i.d)}" target="_blank" rel="noopener">doi:${esc(i.d)}</a>` : ''}
          ${i.ox ? `<span title="Citações segundo a OpenAlex">${nf.format(i.ox.c)} citações</span>${i.ox.ab ? '<span class="tag">acesso aberto</span>' : ''}` : ''}</span>
        <span class="chips">${i.m.map((m) => `<a class="chip" href="docentes.html?docente=${DOC[m].id}">${esc(nomeCurto(DOC[m].nome))}</a>`).join('')}</span>
      </li>`).join('') : '<li class="vazio">Nenhum item com esses filtros. Amplie o período ou limpe a busca.</li>';
      const np = Math.ceil(atual.length / POR);
      $('#ePag').innerHTML = np > 1 ? `<button class="btn" ${pagina ? '' : 'disabled'} data-p="${pagina - 1}">Anterior</button>
        <span>Página ${pagina + 1} de ${np}</span><button class="btn" ${pagina < np - 1 ? '' : 'disabled'} data-p="${pagina + 1}">Próxima</button>` : '';
      $$('#ePag button').forEach((b) => b.addEventListener('click', () => { pagina = +b.dataset.p; explorar(false); $('#explorador').scrollIntoView(); }));
    }
    let t;
    eBusca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => explorar(true), 180); });
    [eTipo, eQualis, eOrdem].forEach((s) => s.addEventListener('change', () => explorar(true)));
    [fDoc, fDe, fAte].forEach((s) => s.addEventListener('change', () => {
      if (+fDe.value > +fAte.value) fAte.value = fDe.value;
      const u = new URL(location.href);
      fDoc.value === '' ? u.searchParams.delete('docente') : u.searchParams.set('docente', DOC[+fDoc.value].id);
      history.replaceState(null, '', u);
      desenha();
    }));
    desenha();
  }

  /* ======================================================================
     FORMAÇÃO
     ====================================================================== */
  function formacao() {
    const niveis = [['0', 'Pós-doutorado'], ['1', 'Doutorado'], ['2', 'Mestrado'], ['3', 'Especialização'], ['4', 'TCC de graduação'], ['5', 'Iniciação científica'], ['6', 'Outra natureza']];
    const p = PALETA();
    const c = COR();
    $('#formNumeros').innerHTML = niveis.filter(([k]) => total('OC' + k) || total('OA' + k)).map(([k, r]) =>
      `<div><dd>${nf.format(total('OC' + k))}</dd><dt>${r}: concluídas</dt><small>${nf.format(total('OA' + k))} em andamento</small></div>`).join('');

    const de = Math.max(anoMin, ANO - 19);
    const ax = anos(de, ANO);
    grafico('cConcluidas', {
      type: 'bar',
      data: { labels: ax, datasets: niveis.map(([k, r], i) => ({ label: r, data: ax.map((a) => serie('OC' + k)[a] || 0), backgroundColor: p[i % p.length], stack: 's' })) },
      options: { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } },
    });
    grafico('cGraduacao', {
      type: 'line',
      data: { labels: ax, datasets: [
        { label: 'Iniciação científica', data: ax.map((a) => serie('OC5')[a] || 0), borderColor: c.wine, backgroundColor: c.wine, tension: .25 },
        { label: 'TCC de graduação', data: ax.map((a) => serie('OC4')[a] || 0), borderColor: c.steel, backgroundColor: c.steel, tension: .25 },
        { label: 'Outra natureza (monitoria, PET, estágio…)', data: ax.map((a) => serie('OC6')[a] || 0), borderColor: c.gold, backgroundColor: c.gold, tension: .25 },
      ] },
      options: { scales: escalaAnos, plugins: { legend: { position: 'bottom' } } },
    });
    grafico('cAndamento', {
      type: 'bar',
      data: { labels: niveis.map((n) => n[1]), datasets: [{ data: niveis.map(([k]) => total('OA' + k)), backgroundColor: c.teal }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { grid: { display: false } } } },
    });

    function fomento() {
      const nivel = $('#fNivel').value, de = +$('#fDe').value;
      const ag = {};
      const codes = nivel ? ['OC' + nivel] : niveis.map(([k]) => 'OC' + k);
      // recalcula por ano a partir dos itens (ano, docentes) e agências agregadas por seção
      codes.forEach((cc) => {
        const o = D.orientacoes[cc]; if (!o) return;
        const totalSec = o.itens_ano_docentes.length || 1;
        const noRecorte = o.itens_ano_docentes.filter(([a]) => a >= de).length;
        Object.entries(o.agencias).forEach(([k, v]) => { ag[k] = (ag[k] || 0) + v * noRecorte / totalSec; });
      });
      const linhas = Object.entries(ag).map(([k, v]) => [k, Math.round(v)]).sort((a, b) => b[1] - a[1]);
      barras('fomento', linhas, 'var(--gold)');
    }
    const fNivel = $('#fNivel');
    fNivel.innerHTML = '<option value="">Todos os níveis</option>' + niveis.map(([k, r]) => `<option value="${k}">${r}</option>`).join('');
    fNivel.value = '5';
    opcoesAnos($('#fDe'), anoMin, ANO, anoMin);
    [fNivel, $('#fDe')].forEach((s) => s.addEventListener('change', fomento));
    fomento();
  }

  /* ======================================================================
     PROJETOS, PRÊMIOS E EVENTOS
     ====================================================================== */
  function projetos() {
    const P = D.projetos;
    const c = COR();
    const ativos = P.filter((p) => !p.fim && /andamento/i.test(p.sit));
    const de = Math.max(Math.min(...P.map((p) => p.ini || ANO)), ANO - 19);
    const ax = anos(de, ANO);
    $('#projNumeros').innerHTML = `
      <div><dd>${nf.format(ativos.length)}</dd><dt>projetos em andamento</dt></div>
      <div><dd>${nf.format(P.filter((p) => p.ini >= INI).length)}</dd><dt>projetos iniciados desde ${INI}</dt></div>
      <div><dd>${nf.format(ativos.filter((p) => p.fin.length).length)}</dd><dt>projetos em andamento com financiador declarado</dt></div>
      <div><dd>${nf.format(ativos.reduce((t, p) => t + Object.values(p.alunos || {}).reduce((u, v) => u + v, 0), 0))}</dd><dt>estudantes envolvidos nos projetos em andamento</dt></div>`;
    grafico('cProjAno', {
      type: 'bar',
      data: { labels: ax, datasets: [
        { label: 'Iniciados no ano', data: ax.map((a) => P.filter((p) => p.ini === a).length), backgroundColor: c.steel },
        { label: 'Ativos no ano', type: 'line', data: ax.map((a) => P.filter((p) => p.ini <= a && (!p.fim || p.fim >= a)).length), borderColor: c.wine, backgroundColor: c.wine, tension: .25 },
      ] },
      options: { scales: escalaAnos, plugins: { legend: { position: 'bottom' } } },
    });
    function financiadores() {
      const so = $('#finAtivos').checked;
      const base = so ? ativos : P.filter((p) => p.ini >= INI);
      const cont = {};
      base.forEach((p) => (p.fin.length ? p.fin : ['Sem financiador declarado']).forEach((f) => { cont[f] = (cont[f] || 0) + 1; }));
      barras('financiadores', Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 14), 'var(--gold)');
    }
    $('#finAtivos').addEventListener('change', financiadores);
    financiadores();
    const niv = {};
    ativos.forEach((p) => Object.entries(p.alunos || {}).forEach(([k, v]) => { niv[k] = (niv[k] || 0) + v; }));
    barras('alunosProj', Object.entries(niv).sort((a, b) => b[1] - a[1]), 'var(--teal)');

    /* lista de projetos */
    const pDoc = $('#pDoc'), pBusca = $('#pBusca'), pSit = $('#pSit');
    opcoesDocentes(pDoc);
    function lista() {
      const termo = semAcento(pBusca.value), dd = pDoc.value === '' ? null : +pDoc.value, sit = pSit.value;
      const r = P.filter((p) => (dd === null || p.m.includes(dd)) && (!sit || (sit === 'a' ? !p.fim && /andamento/i.test(p.sit) : !(!p.fim && /andamento/i.test(p.sit))))
        && (!termo || semAcento(p.ti + ' ' + p.fin.join(' ')).includes(termo))).sort((a, b) => (b.ini || 0) - (a.ini || 0));
      $('#pResumo').textContent = `${nf.format(r.length)} projetos`;
      $('#pLista').innerHTML = r.slice(0, 60).map((p) => `<li><span class="tit">${esc(p.ti)}</span>
        <span class="meta"><span>${p.ini || '?'}–${p.fim || 'atual'}</span><span class="tag">${esc(p.sit || 'situação não informada')}</span>
        ${p.fin.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}</span>
        <span class="chips">${p.m.map((m) => `<a class="chip" href="docentes.html?docente=${DOC[m].id}">${esc(nomeCurto(DOC[m].nome))}</a>`).join('')}</span></li>`).join('')
        + (r.length > 60 ? `<li class="vazio">Mostrando 60 de ${r.length}. Refine a busca ou veja a <a href="relatorio/Pj-0.html">lista completa no relatório</a>.</li>` : '')
        || '<li class="vazio">Nenhum projeto com esses filtros.</li>';
    }
    [pDoc, pSit].forEach((s) => s.addEventListener('change', lista));
    pBusca.addEventListener('input', lista);
    lista();

    /* prêmios */
    const prem = D.itens.filter((i) => i.t === 'Pm').sort((a, b) => b.a - a.a);
    $('#premios').innerHTML = prem.filter((i) => i.a >= INI).map((i) => `<li><span class="tit">${esc(i.ti)}</span>
      <span class="meta"><span>${i.a}</span></span><span class="chips">${i.m.map((m) => `<a class="chip" href="docentes.html?docente=${DOC[m].id}">${esc(nomeCurto(DOC[m].nome))}</a>`).join('')}</span></li>`).join('')
      || '<li class="vazio">Dado em processo de atualização.</li>';
    $('#premiosNota').innerHTML = `${prem.filter((i) => i.a >= INI).length} prêmios e títulos desde ${INI}. Inclui distinções recebidas por trabalhos de estudantes orientados, conforme registradas pelos docentes. <a href="relatorio/Pm-0.html">Histórico completo (${prem.length})</a>.`;

    /* eventos */
    grafico('cEventos', {
      type: 'line',
      data: { labels: ax, datasets: [
        { label: 'Participação em eventos', data: ax.map((a) => serie('Ep')[a] || 0), borderColor: c.steel, backgroundColor: c.steel, tension: .25 },
        { label: 'Organização de eventos', data: ax.map((a) => serie('Eo')[a] || 0), borderColor: c.gold, backgroundColor: c.gold, tension: .25 },
      ] },
      options: { scales: escalaAnos, plugins: { legend: { position: 'bottom' } } },
    });
  }

  /* ======================================================================
     COLABORAÇÃO: rede interna e internacionalização
     ====================================================================== */
  function colaboracao() {
    const c = COR();
    /* --- rede interna --- */
    const areas = [...new Set(DOC.map((d) => d.ga || 'Não informada'))].sort((a, b) => (a === 'Não informada') - (b === 'Não informada') || a.localeCompare(b));
    const corArea = Object.fromEntries(areas.map((a, i) => [a, PALETA()[i]]));
    const nos = DOC.map((d, i) => ({ i, nome: d.nome, area: d.ga || 'Não informada', grau: 0, peso: 0 }));
    const arestas = D.rede.arestas.map(([s, t, w]) => ({ source: s, target: t, w }));
    arestas.forEach((a) => { nos[a.source].grau++; nos[a.target].grau++; nos[a.source].peso += a.w; nos[a.target].peso += a.w; });
    const conectados = nos.filter((n) => n.grau).length;
    const N = nos.length;
    $('#redeNumeros').innerHTML = `
      <div><dd>${conectados} de ${N}</dd><dt>docentes com coautoria com outro docente do departamento</dt></div>
      <div><dd>${nf.format(arestas.length)}</dd><dt>pares de docentes que já publicaram juntos</dt></div>
      <div><dd>${pct.format(2 * arestas.length / (N * (N - 1)))}</dd><dt>densidade da rede (pares conectados entre todos os possíveis)</dt></div>`;
    const W = 900, H = 560;
    const svg = d3.select('#rede').attr('viewBox', `0 0 ${W} ${H}`);
    const wMax = d3.max(arestas, (a) => a.w) || 1;
    const sim = d3.forceSimulation(nos)
      .force('link', d3.forceLink(arestas).distance((a) => 170 - 60 * a.w / wMax).strength(0.35))
      .force('charge', d3.forceManyBody().strength(-420))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('x', d3.forceX(W / 2).strength(0.06)).force('y', d3.forceY(H / 2).strength(0.08))
      .force('col', d3.forceCollide((n) => 9 + Math.sqrt(n.peso) * 1.6 + 16));
    const gL = svg.append('g').attr('stroke', c.line_strong || css('--line-strong'));
    const linhas = gL.selectAll('line').data(arestas).join('line').attr('stroke-width', (a) => 0.8 + 5 * a.w / wMax).attr('stroke-opacity', 0.75);
    const rr = (n) => 7 + Math.sqrt(n.peso) * 1.6;
    const gN = svg.append('g');
    const nosG = gN.selectAll('g').data(nos).join('g').attr('tabindex', 0).attr('role', 'button').attr('aria-label', (n) => n.nome).style('cursor', 'pointer');
    nosG.append('circle').attr('r', rr).attr('fill', (n) => corArea[n.area]).attr('stroke', c.surface).attr('stroke-width', 2);
    nosG.append('text').text((n) => nomeCurto(n.nome)).attr('font-size', 11).attr('fill', c.ink).attr('text-anchor', 'middle').attr('dy', (n) => rr(n) + 13).attr('paint-order', 'stroke').attr('stroke', c.surface).attr('stroke-width', 3);
    nosG.call(d3.drag().on('start', (ev, n) => { if (!ev.active) sim.alphaTarget(0.3).restart(); n.fx = n.x; n.fy = n.y; })
      .on('drag', (ev, n) => { n.fx = ev.x; n.fy = ev.y; }).on('end', (ev, n) => { if (!ev.active) sim.alphaTarget(0); n.fx = null; n.fy = null; }));
    sim.on('tick', () => {
      nos.forEach((n) => { n.x = Math.max(30, Math.min(W - 30, n.x)); n.y = Math.max(20, Math.min(H - 30, n.y)); });
      linhas.attr('x1', (a) => a.source.x).attr('y1', (a) => a.source.y).attr('x2', (a) => a.target.x).attr('y2', (a) => a.target.y);
      nosG.attr('transform', (n) => `translate(${n.x},${n.y})`);
    });
    const info = $('#redeInfo'), sel = $('#redeFoco');
    opcoesDocentes(sel, 'Rede completa');
    function foco(i) {
      if (i === null || i === '') {
        nosG.attr('opacity', 1); linhas.attr('stroke', css('--line-strong')).attr('stroke-opacity', .75);
        info.textContent = 'Selecione um docente (no menu ou clicando no círculo) para destacar suas coautorias internas. Arraste os círculos para reorganizar.';
        sel.value = ''; return;
      }
      i = +i; sel.value = i;
      const viz = new Set([i]);
      arestas.forEach((a) => { if (a.source.i === i) viz.add(a.target.i); if (a.target.i === i) viz.add(a.source.i); });
      nosG.attr('opacity', (n) => (viz.has(n.i) ? 1 : 0.15));
      linhas.attr('stroke', (a) => (a.source.i === i || a.target.i === i ? c.wine : css('--line-strong'))).attr('stroke-opacity', (a) => (a.source.i === i || a.target.i === i ? 1 : 0.1));
      const lig = arestas.filter((a) => a.source.i === i || a.target.i === i).map((a) => [a.source.i === i ? a.target.i : a.source.i, a.w]).sort((a, b) => b[1] - a[1]);
      info.innerHTML = `<strong>${esc(DOC[i].nome)}</strong>: ${lig.length ? `coautoria com ${lig.map(([j, w]) => `${esc(nomeCurto(DOC[j].nome))} (${w})`).join(', ')}.` : 'sem coautoria interna registrada.'}`;
    }
    nosG.on('click', (ev, n) => foco(n.i)).on('keydown', (ev, n) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); foco(n.i); } });
    sel.addEventListener('change', () => foco(sel.value));
    $('#redeLegenda').innerHTML = areas.map((a) => `<span><i style="background:${corArea[a]}"></i>${esc(a)}</span>`).join('') + '<span>Tamanho do círculo: produções em coautoria interna. Espessura da linha: produções do par.</span>';
    foco(null);

    /* coautoria interna nos artigos por ano */
    const ax = anos(Math.max(anoMin, ANO - 19), ANO);
    grafico('cInterna', {
      type: 'line',
      data: { labels: ax, datasets: [{ label: 'Artigos com dois ou mais docentes do DEFIS', data: ax.map((a) => { const t = ARTIGOS.filter((i) => i.a === a); return t.length ? +(100 * t.filter((i) => i.m.length > 1).length / t.length).toFixed(1) : null; }), borderColor: c.steel, backgroundColor: c.steel, tension: .25 }] },
      options: { scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: (v) => v + '%' } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (t) => `${t.formattedValue}% dos artigos do ano` } } } },
    });

    /* --- formação no exterior (cache do Lattes) --- */
    const comForm = DOC.filter((d) => d.dout || d.posdoc);
    if (comForm.length) {
      $('#formacao-exterior').hidden = false;
      const fora = (x) => x && x.pais && !/^Brasil$/i.test(x.pais);
      const dExt = DOC.filter((d) => fora(d.dout)), pExt = DOC.filter((d) => (d.posdoc || []).some(fora));
      const algum = DOC.filter((d) => fora(d.dout) || (d.posdoc || []).some(fora));
      $('#extNumeros').innerHTML = `
        <div><dd>${algum.length} de ${DOC.length}</dd><dt>docentes com doutorado ou pós-doutorado no exterior</dt></div>
        <div><dd>${dExt.length}</dd><dt>com doutorado no exterior</dt></div>
        <div><dd>${pExt.length}</dd><dt>com pós-doutorado no exterior</dt></div>`;
      const pp = {}, ii = {};
      DOC.forEach((d) => {
        const ps = new Set();
        [d.dout, ...(d.posdoc || [])].filter(fora).forEach((x) => { ps.add(x.pais); ii[x.inst] = ii[x.inst] || { n: 0, pais: x.pais }; ii[x.inst].n++; });
        ps.forEach((p) => { pp[p] = (pp[p] || 0) + 1; });
      });
      barras('extPaises', Object.entries(pp).sort((a, b) => b[1] - a[1]), 'var(--violet)');
      $('#extInst').innerHTML = Object.keys(ii).length ? `<div class="barras">${Object.entries(ii).sort((a, b) => b[1].n - a[1].n).slice(0, 15)
        .map(([n, o]) => `<div class="barra" style="grid-template-columns:1fr auto"><span>${esc(n)} <span style="color:var(--ink-soft)">· ${esc(o.pais)}</span></span><span class="v">${o.n}</span></div>`).join('')}</div>` : '<p class="vazio">Nenhuma formação no exterior registrada.</p>';
      $('#extNota').innerHTML = `Informação lida em ${comForm.length} de ${DOC.length} currículos. Estágios curtos e doutorado-sanduíche não entram nesta contagem quando não aparecem como titulação ou pós-doutorado no Lattes.`;
    }

    /* --- internacionalização --- */
    const gDoc = $('#gDoc'), gDe = $('#gDe'), gAte = $('#gAte');
    opcoesDocentes(gDoc); opcoesAnos(gDe, anoMin, ANO, INI); opcoesAnos(gAte, anoMin, ANO, ANO);
    const topo = window.WORLD_110M;
    const paises = topojson.feature(topo, topo.objects.countries).features.filter((f) => f.id !== '010');
    const proj = d3.geoEqualEarth().fitSize([960, 470], { type: 'FeatureCollection', features: paises });
    const caminho = d3.geoPath(proj);
    const msvg = d3.select('#mapa').attr('viewBox', '0 0 960 470');
    const gp = msvg.append('g');
    const tip = document.createElement('div'); tip.className = 'tip'; document.body.append(tip);
    const num2a = {}; D.intl.paises.forEach(([a, , num]) => { if (num) num2a[num] = a; });
    const formas = gp.selectAll('path').data(paises).join('path').attr('class', 'pais').attr('d', caminho);

    function desenhaIntl() {
      const dd = gDoc.value === '' ? null : +gDoc.value, de = +gDe.value, ate = +gAte.value;
      const arts = ARTIGOS.filter((i) => i.ox && i.a >= de && i.a <= ate && (dd === null || i.m.includes(dd)));
      const cont = {};
      arts.forEach((i) => i.ox.p.forEach((p) => { cont[p] = (cont[p] || 0) + 1; }));
      const ext = Object.entries(cont).filter(([p]) => p !== 'BR');
      const max = Math.max(1, ...ext.map((e) => e[1]));
      const escala = d3.scaleSequentialLog(d3.interpolateRgb(css('--surface-2') === '' ? '#eee' : '#e8d3d9', c.wine)).domain([1, max]);
      formas.attr('fill', (f) => { const a = num2a[f.id]; if (a === 'BR') return c.steel; const n = cont[a]; return n ? escala(n) : css('--surface-2'); })
        .on('mousemove', (ev, f) => { const a = num2a[f.id]; const n = a ? cont[a] : 0; tip.style.opacity = 1; tip.style.left = ev.clientX + 12 + 'px'; tip.style.top = ev.clientY + 12 + 'px';
          tip.textContent = `${a ? nomeRegiao(a) : (f.properties.name || '')}: ${n ? n + (n > 1 ? ' artigos' : ' artigo') : 'nenhum artigo em coautoria'}`; })
        .on('mouseleave', () => { tip.style.opacity = 0; });
      const intl = arts.filter((i) => i.ox.p.some((p) => p !== 'BR')).length;
      $('#intlNumeros').innerHTML = `
        <div><dd>${arts.length ? pct.format(intl / arts.length) : '—'}</dd><dt>dos artigos com coautoria internacional</dt><small>${nf.format(intl)} de ${nf.format(arts.length)} artigos localizados</small></div>
        <div><dd>${nf.format(ext.length)}</dd><dt>países parceiros em coautorias</dt></div>
        <div><dd>${ext.length ? esc(nomeRegiao(ext.sort((a, b) => b[1] - a[1])[0][0])) : '—'}</dd><dt>país com mais artigos em coautoria</dt></div>`;
      $('#escalaMax').textContent = nf.format(max);
      barras('paises', ext.sort((a, b) => b[1] - a[1]).slice(0, 15).map(([p, n]) => [nomeRegiao(p), n]), 'var(--wine)');
      const ax2 = anos(de, ate);
      grafico('cIntlAno', {
        type: 'line',
        data: { labels: ax2, datasets: [{ label: '% com coautoria internacional', data: ax2.map((a) => { const t = arts.filter((i) => i.a === a); return t.length ? +(100 * t.filter((i) => i.ox.p.some((p) => p !== 'BR')).length / t.length).toFixed(1) : null; }), borderColor: c.wine, backgroundColor: c.wine, tension: .25, spanGaps: true }] },
        options: { scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' } } }, plugins: { legend: { display: false } } },
      });
    }
    [gDoc, gDe, gAte].forEach((s) => s.addEventListener('change', () => { if (+gDe.value > +gAte.value) gAte.value = gDe.value; desenhaIntl(); }));
    desenhaIntl();
    $('#instituicoes').innerHTML = D.intl.instituicoes.slice(0, 25).map(([n, k, p]) => `<tr><td>${esc(n)}</td><td>${esc(nomeRegiao(p))}</td><td class="n">${k}</td></tr>`).join('');
    $('#intlNota').innerHTML = `Países e instituições vêm das afiliações dos coautores registradas na <a href="https://openalex.org" target="_blank" rel="noopener">OpenAlex</a>, consultada pelo DOI de cada artigo. ` +
      `Cobertura: ${nf.format(D.intl.cobertos)} de ${nf.format(D.intl.artigos)} artigos (${nf.format(D.intl.artigos - D.intl.artigos_com_doi)} não têm DOI no Lattes). Coleta em ${esc(D.intl.coletado.split('-').reverse().join('/'))}.`;
  }

  /* ======================================================================
     DOCENTES
     ====================================================================== */
  function docentes() {
    const lista = $('#pessoas'), busca = $('#dBusca'), area = $('#dArea');
    const areas = [...new Set(DOC.map((d) => d.area).filter(Boolean))].sort();
    area.innerHTML = '<option value="">Todas as áreas</option>' + areas.map((a) => `<option>${esc(a)}</option>`).join('');
    const foto = (d, cls = 'foto') => d.foto ? `<img class="${cls}" src="${esc(d.foto)}" alt="" loading="lazy" width="64" height="76">` : `<span class="${cls}" aria-hidden="true">${esc(iniciais(d.nome))}</span>`;
    function desenha() {
      const t = semAcento(busca.value), a = area.value;
      const r = DOC.map((d, i) => [d, i]).filter(([d]) => (!a || d.area === a) && (!t || semAcento(d.nome + ' ' + d.bio).includes(t))).sort((x, y) => x[0].nome.localeCompare(y[0].nome, 'pt-BR'));
      $('#dResumo').textContent = `${r.length} de ${DOC.length} docentes`;
      lista.innerHTML = r.map(([d, i]) => `<button class="pessoa" type="button" data-i="${i}">${foto(d)}<span><b>${esc(d.nome)}</b>
        <span>${esc(d.area || d.ga || '')}</span>${d.bolsa ? `<span class="pq">${esc(rotBolsa(d.bolsa))}</span>` : ''}</span></button>`).join('') || '<p class="vazio">Nenhum docente com esse filtro.</p>';
      $$('.pessoa', lista).forEach((b) => b.addEventListener('click', () => abre(+b.dataset.i)));
    }
    const dlg = $('#dlg');
    function abre(i) {
      const d = DOC[i];
      const arts = ARTIGOS.filter((x) => x.m.includes(i));
      const sub = {}, pa = {};
      arts.forEach((x) => { if (x.ox) { if (x.ox.sc) sub[x.ox.sc] = (sub[x.ox.sc] || 0) + 1; x.ox.p.forEach((p) => { if (p !== 'BR') pa[p] = (pa[p] || 0) + 1; }); } });
      const top = (o, k) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map((e) => e[0]);
      const n = d.n || {};
      const conc = ['OC0', 'OC1', 'OC2', 'OC3', 'OC4', 'OC5', 'OC6'].reduce((t, c) => t + (n[c] || 0), 0);
      const and = ['OA0', 'OA1', 'OA2', 'OA3', 'OA4', 'OA5', 'OA6'].reduce((t, c) => t + (n[c] || 0), 0);
      dlg.innerHTML = `<div class="dlg">
        <div class="dlg-cab">${foto(d)}<div><h2 style="font-size:1.45rem">${esc(d.nome)}</h2>
          <p style="color:var(--ink-mid);font-size:.92rem;margin-top:.3rem">${esc([d.area, d.ga].filter(Boolean).join(' · '))}</p>
          ${d.bolsa ? `<span class="pq">Bolsa CNPq: ${esc(d.bolsa)}</span>` : ''}</div>
          <button class="fechar" type="button" aria-label="Fechar">×</button></div>
        ${d.bio ? `<div class="bio">${esc(d.bio)}</div>` : ''}
        <dl>
          <dt>Currículo Lattes</dt><dd><a href="http://lattes.cnpq.br/${d.id}" target="_blank" rel="noopener">lattes.cnpq.br/${d.id}</a> — atualizado em ${esc(d.cv || 'data não informada')}</dd>
          <dt>Registros no Lattes</dt><dd>${n.PB0 || 0} artigos em periódicos, ${conc} orientações concluídas, ${and} em andamento, ${n.Pj || 0} projetos</dd>
          ${d.dout ? `<dt>Doutorado</dt><dd>${esc(d.dout.inst)}${d.dout.pais ? `, ${esc(d.dout.pais)}` : ''}${d.dout.ano ? ` (${d.dout.ano})` : ''}</dd>` : ''}
          ${(d.posdoc || []).length ? `<dt>Pós-doutorado</dt><dd>${d.posdoc.map((p) => `${esc(p.inst)}${p.pais ? `, ${esc(p.pais)}` : ''}${p.ini ? ` (${p.ini}${p.fim && p.fim !== p.ini ? '–' + p.fim : ''})` : ''}`).join('; ')}</dd>` : ''}
          ${top(sub, 4).length ? `<dt>Temas frequentes</dt><dd>${top(sub, 4).map(esc).join('; ')}</dd>` : ''}
          ${top(pa, 6).length ? `<dt>Países coautores</dt><dd>${top(pa, 6).map((p) => esc(nomeRegiao(p))).join(', ')}</dd>` : ''}
          ${d.colab.length ? `<dt>Coautores no DEFIS</dt><dd>${d.colab.map(([j]) => `<a href="#" data-j="${j}">${esc(nomeCurto(DOC[j].nome))}</a>`).join(', ')}</dd>` : ''}
        </dl>
        <div class="links">
          <a class="btn btn-forte" href="producao.html?docente=${d.id}#explorador">Ver produção no portal</a>
          <a class="btn" href="relatorio/membro-${d.id}.html">Página no relatório scriptLattes</a>
          <a class="btn" href="colaboracao.html">Rede de colaboração</a>
        </div></div>`;
      $('.fechar', dlg).addEventListener('click', () => dlg.close());
      $$('[data-j]', dlg).forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); abre(+a.dataset.j); }));
      if (!dlg.open) dlg.showModal();
      const u = new URL(location.href); u.searchParams.set('docente', d.id); history.replaceState(null, '', u);
    }
    dlg.addEventListener('close', () => { const u = new URL(location.href); u.searchParams.delete('docente'); history.replaceState(null, '', u); });
    dlg.addEventListener('click', (ev) => { if (ev.target === dlg) dlg.close(); });
    busca.addEventListener('input', desenha); area.addEventListener('change', desenha);
    desenha();
    const pid = params.get('docente');
    if (pid) { const i = DOC.findIndex((d) => d.id === pid); if (i >= 0) abre(i); }
  }

  /* ======================================================================
     METODOLOGIA
     ====================================================================== */
  function metodologia() {
    $('#mFontes').innerHTML = `
      <tr><td>Currículos Lattes (CNPq)</td><td>Fonte primária de toda a produção, orientações, projetos e prêmios</td><td>${esc(D.meta.processamento)}</td><td>${selo('ok', 'Fonte oficial')}</td></tr>
      <tr><td>scriptLattes V9</td><td>Extração, deduplicação de itens e grafo de colaborações</td><td>${esc(D.meta.processamento)}</td><td>${selo('ok', 'Automático')}</td></tr>
      <tr><td>Qualis Periódicos (lista de jan/2023)</td><td>Estrato dos periódicos, atribuído pelo scriptLattes</td><td>—</td><td>${selo('pre', 'Referência histórica')}</td></tr>
      <tr><td>OpenAlex</td><td>Afiliações dos coautores, países, citações, acesso aberto e tema de cada artigo com DOI</td><td>${esc(D.intl.coletado.split('-').reverse().join('/'))}</td><td>${selo('pre', 'Complementar')}</td></tr>`;
    $('#mValidacao').innerHTML = D.secoes.map((s) => `<tr><td>${esc(s.o)}</td><td class="n">${nf.format(s.n)}</td></tr>`).join('');
    $('#mAlertas').innerHTML = D.meta.alertas_validacao ? selo('pre', `${D.meta.alertas_validacao} divergência(s) na conferência automática`) : selo('ok', 'Conferência automática sem divergências');
    const H = window.DEFIS_HIST || [];
    $('#mHistorico').innerHTML = H.slice().reverse().map((h) => `<tr><td>${esc(h.data.split('-').reverse().join('/'))}</td><td>${esc(h.processamento)}</td><td class="n">${h.docentes}</td>
      <td class="n">${nf.format(h.totais.PB0 || 0)}</td><td class="n">${nf.format(['OC0', 'OC1', 'OC2', 'OC3', 'OC4', 'OC5', 'OC6'].reduce((t, c) => t + (h.totais[c] || 0), 0))}</td><td class="n">${nf.format(h.totais.Pj || 0)}</td></tr>`).join('');
  }

  /* ------------------------------------------------------------ arranque */
  montaCasca();
  chartDefaults();
  const PAGS = { inicio, producao, formacao, projetos, colaboracao, docentes, metodologia };
  const iniciar = () => { try { PAGS[PAGINA] && PAGS[PAGINA](); } catch (e) { console.error(e); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
