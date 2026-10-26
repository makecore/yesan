/*
 * 국가예산 나침반 — 화면 동작
 * ------------------------------------------------------------
 * 1) 규정 탐색기: 입력값 → 적용 규정 카드
 * 2) 연간 일정·D-day: 법정기한 + 기관 내부 마감(직접 추가)
 * 3) 단계별 체크리스트: 입력값에 맞춘 할 일, 진행 상태 저장
 * 4) AI 작업지시서: 입력값을 정리한 프롬프트
 *
 * 저장은 이 브라우저(localStorage)에만 됩니다. 다른 사람·다른 기기와 공유되지 않습니다.
 */

/* ---------- 공통 도구 ---------- */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORE_KEYS = {
  finder: 'yesan.finder.v1',
  checklist: 'yesan.checklist.v1',
  custom: 'yesan.customDeadlines.v1',
};

function loadStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장할 수 없는 환경(사생활 보호 모드 등)에서는 조용히 넘어갑니다. */
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const fmtNumber = (n) => Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 1 });

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toISODate(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

function fromISODate(text) {
  const [y, m, d] = text.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function fmtDate(date, withYear = false) {
  const base = `${date.getMonth() + 1}.${date.getDate()}.(${WEEKDAYS[date.getDay()]})`;
  return withYear ? `${date.getFullYear()}.${base}` : base;
}

function dday(target, today) {
  const diff = Math.round((startOfDay(target) - startOfDay(today)) / 86400000);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

/* ---------- 입력 상태 ---------- */

const DEFAULT_STATE = {
  amount: 30,
  support: 30,
  annual: 10,
  stage: 'new',
  types: ['info'],
  multiYear: true,
};

let state = { ...DEFAULT_STATE, ...loadStore(STORE_KEYS.finder, {}) };

function readForm() {
  state = {
    amount: Math.max(0, Number($('#amount').value) || 0),
    support: Math.max(0, Number($('#supportAmount').value) || 0),
    annual: Math.max(0, Number($('#annualAmount').value) || 0),
    stage: $('input[name="stage"]:checked')?.value || 'new',
    types: $$('input[name="type"]:checked').map((el) => el.value),
    multiYear: $('#multiYear').checked,
  };
  saveStore(STORE_KEYS.finder, state);
}

function writeForm() {
  $('#amount').value = state.amount;
  $('#supportAmount').value = state.support;
  $('#annualAmount').value = state.annual;
  $$('input[name="stage"]').forEach((el) => { el.checked = el.value === state.stage; });
  $$('input[name="type"]').forEach((el) => { el.checked = state.types.includes(el.value); });
  $('#multiYear').checked = state.multiYear;
}

const has = (type) => state.types.includes(type);

/* ---------- 1) 규정 판정 ---------- */

/*
 * level
 *  must   : 모든 해당 사업이 반드시 확인
 *  likely : 입력값 기준 해당 가능성이 높음
 *  check  : 조건에 따라 달라지므로 확인 필요
 *  info   : 참고(해당 없음 판정 포함)
 */
const LEVEL_LABEL = { must: '필수', likely: '해당 가능성 높음', check: '확인 필요', info: '참고' };

function analyze() {
  const s = state;
  const isNew = s.stage === 'new';
  const big = s.amount >= 500 && s.support >= 300;
  const flags = {};
  const rules = [];

  rules.push({
    level: 'must', tag: '공통',
    title: '국가재정법 + 2027년도 편성 세부지침',
    text: '모든 재정사업은 국가재정법과 해당 연도 세부지침(기획예산처, 2026.7.20. 게시)의 비목별 기준·단가부터 대조합니다.',
    basis: '국가재정법 · 2027년도 세부지침', href: LINKS.guide2027,
  });

  rules.push({
    level: 'must', tag: '기획',
    title: '중기사업계획서 반영 (매년 1월 31일)',
    text: '향후 5개 회계연도 사업계획을 기획예산처에 제출합니다. 국립중앙도서관은 문화체육관광부 소속기관이므로 부처 내부 취합 마감이 법정기한보다 앞섭니다.',
    basis: '국가재정법 제28조', href: LINKS.nfa,
  });

  /* 예비타당성조사 (국가재정법 제38조) */
  const yetaCategory = has('construction') || has('building') || has('info');
  if (isNew && yetaCategory && big) {
    flags.yeta = true;
    rules.push({
      level: 'likely', tag: '예타',
      title: '예비타당성조사 대상 가능성 높음',
      text: `신규 사업이고 총사업비 500억원 이상·국고 300억원 이상이며 ${has('info') ? '정보화' : '건설공사 포함'} 사업에 해당합니다. 공공청사 신·증축, 법령에 따른 사업 등 면제 사유(제38조제2항)도 함께 검토하세요.`,
      basis: '국가재정법 제38조제1항제1호·제2호', href: LINKS.nfa,
    });
  } else if (isNew && has('culture') && s.amount >= 500 && s.support >= 500) {
    flags.yeta = true;
    rules.push({
      level: 'likely', tag: '예타',
      title: '예비타당성조사 대상 가능성 (문화·교육 등 일반 사업)',
      text: '문화·관광·교육 등 그 밖의 사업은 총사업비 500억원 이상이고 중기사업계획서상 재정지출이 500억원 이상인 신규 사업이 대상입니다.',
      basis: '국가재정법 제38조제1항제4호', href: LINKS.nfa,
    });
  } else if (isNew && (yetaCategory || has('culture')) && (s.amount >= 400 || s.support >= 240)) {
    rules.push({
      level: 'check', tag: '예타',
      title: '예타 기준에 근접',
      text: '현재는 기준 미만이지만 사업비가 늘어 기준을 넘으면 타당성재조사 대상이 됩니다. 산출근거를 보수적으로 관리하세요.',
      basis: '국가재정법 제38조, 제50조제2항제1호', href: LINKS.nfa,
    });
  }
  if (has('rd')) {
    rules.push({
      level: 'info', tag: 'R&D',
      title: 'R&D는 예타 대상에서 제외됨',
      text: '2026.2.10. 개정으로 국가연구개발사업이 예타 대상에서 빠졌습니다. 과학기술기본법 제12조의3에 따른 사업추진심사 등 별도 절차를 확인하세요.',
      basis: '국가재정법 제38조제1항제3호 삭제', href: LINKS.sciBasic,
    });
  }

  /* 총사업비 관리 (국가재정법 제50조, 시행령 제21조) */
  const tc1 = (has('construction') || has('info') || has('culture')) && big;
  const tc2 = (has('building') || has('rd')) && s.amount >= 200;
  if (tc1 || tc2) {
    if (s.multiYear) {
      flags.totalCost = true;
      rules.push({
        level: 'likely', tag: '총사업비',
        title: '총사업비 관리 대상 가능성 높음',
        text: `${tc2 ? '건축·연구개발 사업은 총사업비 200억원 이상' : '건설·정보화 등은 총사업비 500억원·국고 300억원 이상'}이면서 완성에 2년 이상 걸리는 사업입니다. 예타·설계·발주·시공 등 단계마다 기획예산처와 협의하고, 사업비 변경 시 조달청 사전검토를 거칩니다.${has('rd') ? ' 시설·장비 구축이 없는 R&D는 제외됩니다.' : ''}`,
        basis: '국가재정법 제50조, 시행령 제21조', href: LINKS.totalCost,
      });
    } else {
      rules.push({
        level: 'check', tag: '총사업비',
        title: '사업기간이 2년 이상이면 총사업비 관리 대상',
        text: '금액 기준은 충족합니다. 완성에 2년 이상 걸리는 사업이면 총사업비 관리 대상이 되므로 사업기간을 확정하세요.',
        basis: '국가재정법 제50조제1항', href: LINKS.totalCost,
      });
    }
  }

  /* 정보화·SW */
  if (has('info')) {
    if (isNew) {
      flags.consult = true;
      rules.push({
        level: 'likely', tag: '정보화',
        title: '정보화사업 사전협의 대상 (신규)',
        text: '중앙행정기관과 그 소속기관의 신규 정보화사업은 금액과 관계없이 대상입니다. 다만 보안 강화, API 개발, 빅데이터 분석 등 제외사업(지침 제4조제2항)에 해당하는지 확인하고, 발주 최소 30일 전에 신청합니다.',
        basis: '전자정부법 제67조, 전자정부 성과관리 지침 제4조·제13조', href: LINKS.egovPerf,
      });
    } else if (s.annual >= 10) {
      flags.consult = true;
      rules.push({
        level: 'likely', tag: '정보화',
        title: '정보화사업 사전협의 대상 (계속, 10억원 이상)',
        text: '중앙행정기관등의 계속사업은 사업금액 10억원 이상이면 대상입니다. 발주 최소 30일 전에 신청하며, 결과는 신청일로부터 30일 이내에 통보됩니다.',
        basis: '전자정부 성과관리 지침 제4조제2항제1호·제16조', href: LINKS.egovPerf,
      });
    } else {
      rules.push({
        level: 'info', tag: '정보화',
        title: '사전협의 제외 가능 (계속, 10억원 미만)',
        text: '중앙행정기관등의 10억원 미만 계속사업은 제외됩니다. 단, 해당 연도에 새로 정보화를 추진하는 부분이 있으면 대상입니다.',
        basis: '전자정부 성과관리 지침 제4조제2항', href: LINKS.egovPerf,
      });
    }

    rules.push({
      level: 'must', tag: 'SW',
      title: '과업심의위원회 · 요구사항 상세화 · 적정 사업기간',
      text: '과업내용을 확정하거나 변경할 때 과업심의위원회 심의를 거치고, 그 결과를 계약에 반영합니다.',
      basis: '소프트웨어 진흥법 제44조·제45조·제50조', href: LINKS.sw,
    });

    let bigco;
    if (s.annual >= 80) bigco = '사업금액 80억원 이상이므로 대기업 참여 하한 이상입니다(참여 가능).';
    else if (s.annual >= 40) bigco = '사업금액 40억~80억원 미만: 매출액 8천억원 이상 대기업은 참여할 수 없습니다.';
    else if (s.annual >= 20) bigco = '사업금액 20억~40억원 미만: 대기업은 참여할 수 없습니다. 중견기업에서 대기업이 된 지 5년이 지나지 않은 기업만 예외입니다.';
    else bigco = '사업금액 20억원 미만: 모든 대기업이 참여할 수 없습니다.';
    rules.push({
      level: 'must', tag: 'SW 금액',
      title: '대기업 참여제한 판정',
      text: `${bigco} 상호출자제한기업집단 소속 회사는 금액과 관계없이 제한됩니다. 사업금액은 추정가격에 부가세를 더한 금액이며, 입찰공고·제안요청서에 적용 여부를 적어야 합니다.`,
      basis: '소프트웨어 진흥법 제48조, 고시 제2026-4호 별표 1·제3조', href: LINKS.swSme,
    });
  }

  if (has('subsidy')) {
    rules.push({
      level: 'must', tag: '보조금',
      title: '보조금 관리에 관한 법률',
      text: '예산계상 신청(중앙관서가 4월 30일 이전으로 정한 날), 교부결정, 사업내용 변경, 실적보고·정산·반환까지 법률 절차를 따릅니다.',
      basis: '보조금 관리에 관한 법률 제4조 등', href: LINKS.subsidy,
    });
  }

  if (has('rd')) {
    rules.push({
      level: 'must', tag: 'R&D',
      title: '국가연구개발혁신법 + 연구개발비 사용기준',
      text: 'R&D는 일반 예산 규정에 더해 협약·평가·성과관리와 연구개발비 사용기준을 함께 적용합니다.',
      basis: '국가연구개발혁신법', href: LINKS.rd,
    });
  }

  if (!isNew) {
    rules.push({
      level: 'check', tag: '계속사업',
      title: '전년도 집행실적·성과평가 결과 반영',
      text: '집행률, 이월·불용 사유, 재정사업 성과평가 결과가 다음 연도 요구액 조정의 근거가 됩니다. 실적 자료를 먼저 정리하세요.',
      basis: '국가재정법 제8조(성과관리)', href: LINKS.nfa,
    });
  }

  rules.push({
    level: 'must', tag: '계약·집행',
    title: '국가계약법 · 조달 절차',
    text: '예산이 확정되어도 입찰·계약·검사·대가 지급은 국가계약법과 기관 계약규정, 조달청 절차를 따로 확인합니다.',
    basis: '국가를 당사자로 하는 계약에 관한 법률', href: LINKS.contract,
  });

  rules.push({
    level: 'must', tag: '성과·결산',
    title: '성과계획서 · 성과보고서',
    text: '예산요구서와 함께 성과계획서를, 결산과 함께 성과보고서를 냅니다. 사업내용·사업비와 성과지표가 맞물리게 작성하세요.',
    basis: '국가재정법 제8조', href: LINKS.nfa,
  });

  const order = { likely: 0, must: 1, check: 2, info: 3 };
  rules.sort((a, b) => order[a.level] - order[b.level]);
  return { rules, flags };
}

function stageLabel() {
  return state.stage === 'new' ? '신규' : '계속';
}

function typeLabels() {
  return TYPES.filter((t) => has(t.value)).map((t) => t.label);
}

function renderRules(result) {
  const { rules } = result;
  const types = typeLabels();
  const counts = rules.reduce((acc, r) => ({ ...acc, [r.level]: (acc[r.level] || 0) + 1 }), {});
  const summary = `
    <div class="result-summary">
      <div>
        <h3>${stageLabel()} · 총 ${fmtNumber(state.amount)}억원 · 국고 ${fmtNumber(state.support)}억원 · 당해연도 ${fmtNumber(state.annual)}억원</h3>
        <p>${types.length ? escapeHtml(types.join(' · ')) : '사업 성격 미선택'} · ${state.multiYear ? '2년 이상' : '단년도'}</p>
      </div>
      <div class="result-count" aria-label="점검 항목 ${rules.length}개">${rules.length}<small>개</small></div>
    </div>
    <div class="level-legend">
      ${['likely', 'must', 'check', 'info'].filter((l) => counts[l]).map((l) => `<span class="level level-${l}">${LEVEL_LABEL[l]} ${counts[l]}</span>`).join('')}
    </div>`;

  const cards = rules.map((r) => `
    <article class="result-card level-border-${r.level}">
      <div class="result-meta">
        <span class="level level-${r.level}">${LEVEL_LABEL[r.level]}</span>
        <span class="result-tag">${escapeHtml(r.tag)}</span>
      </div>
      <div>
        <h4>${escapeHtml(r.title)}</h4>
        <p>${escapeHtml(r.text)}</p>
        <p class="basis">근거: ${escapeHtml(r.basis)}</p>
      </div>
      <a href="${r.href}" target="_blank" rel="noopener">원문 ↗</a>
    </article>`).join('');

  $('#finderResults').innerHTML = summary + cards;
}

/* ---------- 2) 연간 일정·D-day ---------- */

let customDeadlines = loadStore(STORE_KEYS.custom, []);

function legalDate(item, year) {
  if (item.offsetFromNextYear) {
    const d = new Date(year + 1, 0, 1);
    d.setDate(d.getDate() - item.offsetFromNextYear);
    return d;
  }
  if (item.day === 'last') return new Date(year, item.month, 0);
  return new Date(year, item.month - 1, item.day);
}

function deadlineVisible(item) {
  return item.tags.includes('all') || item.tags.some((t) => has(t));
}

/* 올해·내년 법정기한 + 직접 추가한 기한을 날짜순으로 */
function allDeadlines(today) {
  const year = today.getFullYear();
  const list = [];
  [year, year + 1].forEach((y) => {
    LEGAL_DEADLINES.filter(deadlineVisible).forEach((item) => {
      list.push({ ...item, key: `${item.id}-${y}`, date: legalDate(item, y), kind: 'legal' });
    });
  });
  customDeadlines.forEach((c) => {
    list.push({ key: c.id, id: c.id, title: c.title, who: '기관 내부 마감', basis: '직접 추가', date: fromISODate(c.date), kind: 'custom' });
  });
  return list.sort((a, b) => a.date - b.date);
}

function renderUpcoming(today) {
  const upcoming = allDeadlines(today).filter((d) => startOfDay(d.date) >= startOfDay(today)).slice(0, 4);
  $('#upcomingList').innerHTML = upcoming.length
    ? upcoming.map((d) => `
      <li class="upcoming-item ${d.kind}">
        <span class="dday">${dday(d.date, today)}</span>
        <div>
          <strong>${escapeHtml(d.title)}</strong>
          <small>${fmtDate(d.date, true)} · ${escapeHtml(d.who)}</small>
        </div>
      </li>`).join('')
    : '<li class="empty">예정된 마감이 없습니다.</li>';
}

/* 이번 달부터 12개월(예: 2026.10 ~ 2027.9)을 보여줍니다. */
function renderTimeline(today) {
  const items = allDeadlines(today);
  const months = Array.from({ length: 12 }, (_, i) => new Date(today.getFullYear(), today.getMonth() + i, 1));
  const first = months[0];
  const last = months[11];
  $('#timelineYear').textContent = `${first.getFullYear()}.${first.getMonth() + 1} ~ ${last.getFullYear()}.${last.getMonth() + 1}`;
  $('#timeline').innerHTML = months.map((monthStart, index) => {
    const monthItems = items.filter((d) => d.date.getFullYear() === monthStart.getFullYear() && d.date.getMonth() === monthStart.getMonth());
    const isCurrent = index === 0;
    const showYear = index === 0 || monthStart.getMonth() === 0;
    return `
      <div class="month ${isCurrent ? 'current' : ''}">
        <div class="month-head"><span>${showYear ? `${monthStart.getFullYear()}.` : ''}${monthStart.getMonth() + 1}월</span>${isCurrent ? '<em>이번 달</em>' : ''}</div>
        <ul>
          ${monthItems.length ? monthItems.map((d) => {
            const past = startOfDay(d.date) < startOfDay(today);
            return `
              <li class="${d.kind} ${past ? 'done' : ''}">
                <span class="date">${d.date.getDate()}일</span>
                <div>
                  <b>${escapeHtml(d.title)}</b>
                  <small>${escapeHtml(d.basis)}${past ? '' : ` · ${dday(d.date, today)}`}</small>
                </div>
                ${d.kind === 'custom' ? `<button class="icon-button" type="button" data-remove="${escapeHtml(d.id)}" aria-label="${escapeHtml(d.title)} 삭제">×</button>` : ''}
              </li>`;
          }).join('') : '<li class="none">법정 일정 없음</li>'}
        </ul>
      </div>`;
  }).join('');
}

function renderCalendar() {
  const today = new Date();
  renderUpcoming(today);
  renderTimeline(today);
  $('#customCount').textContent = customDeadlines.length ? `직접 추가 ${customDeadlines.length}건` : '';
}

function addCustomDeadline(event) {
  event.preventDefault();
  const title = $('#customTitle').value.trim();
  const date = $('#customDate').value;
  if (!title || !date) return;
  customDeadlines.push({ id: `c${Date.now()}`, title: title.slice(0, 60), date });
  saveStore(STORE_KEYS.custom, customDeadlines);
  $('#customForm').reset();
  renderCalendar();
}

function removeCustomDeadline(id) {
  customDeadlines = customDeadlines.filter((c) => c.id !== id);
  saveStore(STORE_KEYS.custom, customDeadlines);
  renderCalendar();
}

/* 캘린더 파일(.ics): 아웃룩·아이폰·구글 캘린더로 가져올 수 있는 표준 일정 파일 */
function icsEscape(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function icsDate(date) {
  return toISODate(date).replaceAll('-', '');
}

function downloadIcs() {
  const today = new Date();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = allDeadlines(today).filter((d) => startOfDay(d.date) >= startOfDay(today));
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//makecore//yesan//KO', 'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:국가예산 나침반',
  ];
  events.forEach((d) => {
    const next = new Date(d.date);
    next.setDate(next.getDate() + 1);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${d.key}@yesan.makecore`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(d.date)}`,
      `DTEND;VALUE=DATE:${icsDate(next)}`,
      `SUMMARY:${icsEscape(`[예산] ${d.title}`)}`,
      `DESCRIPTION:${icsEscape(`${d.who} / 근거: ${d.basis}`)}`,
      'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(`7일 전: ${d.title}`)}`, 'END:VALARM',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yesan-deadlines-${toISODate(today)}.ics`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- 3) 단계별 체크리스트 ---------- */

let checked = loadStore(STORE_KEYS.checklist, {});

function buildChecklist(flags) {
  const isNew = state.stage === 'new';
  const items = [
    { id: 'p-goal', phase: 'plan', text: '정책 목표와 문제를 정의하고 사업 목적을 한 문장으로 정리' },
    { id: 'p-cost', phase: 'plan', text: '총사업비·국고·사업기간을 확정하고 산출근거(단가 × 수량) 작성' },
    { id: 'p-midterm', phase: 'plan', text: '중기사업계획서 반영 확인 (법정 1.31., 부처 내부 마감 우선)' },
    flags.yeta && { id: 'p-yeta', phase: 'plan', text: '예비타당성조사 대상 선정 신청 또는 면제 사유 검토', hint: '국가재정법 제38조' },
    has('rd') && { id: 'p-rd', phase: 'plan', text: 'R&D 사업추진심사 등 별도 심사 대상 여부 확인', hint: '과학기술기본법 제12조의3' },
    has('info') && isNew && { id: 'p-isp', phase: 'plan', text: 'ISP·ISMP(정보화 전략·상세계획) 수립 필요 여부 검토' },

    { id: 'r-guide', phase: 'request', text: '2027년도 세부지침의 비목·단가 기준과 산출근거 대조' },
    { id: 'r-request', phase: 'request', text: '예산요구서·사업설명자료 작성 (법정 5.31., 부처 내부 마감 우선)' },
    { id: 'r-perf', phase: 'request', text: '성과계획서의 성과지표·목표치 설정' },
    has('subsidy') && { id: 'r-subsidy', phase: 'request', text: '보조사업 예산계상 신청 접수·검토 (4.30. 이전 제출일 지정)', hint: '보조금법 제4조제4항' },
    flags.totalCost && { id: 'r-total', phase: 'request', text: '총사업비 협의 자료(사업계획·산출내역·공정관리) 준비', hint: '시행령 제21조제4항' },
    !isNew && { id: 'r-prev', phase: 'request', text: '전년도 집행실적·이월·불용 사유 정리' },

    { id: 'd-mpb', phase: 'deliberation', text: '기획예산처 심의 대응 자료(쟁점·감액 대응 논리) 준비' },
    { id: 'd-assembly', phase: 'deliberation', text: '국회 상임위·예결위 설명자료 준비' },
    { id: 'd-final', phase: 'deliberation', text: '확정 예산을 확인하고 사업계획 조정' },

    { id: 'e-assign', phase: 'execute', text: '예산 배정·재배정 확인' },
    has('info') && { id: 'e-task', phase: 'execute', text: '과업심의위원회 개최로 과업내용 확정', hint: 'SW진흥법 제50조' },
    flags.consult && { id: 'e-consult', phase: 'execute', text: '정보화사업 사전협의 신청 (발주 최소 30일 전)', hint: '성과관리 지침 제13조제4항' },
    has('info') && { id: 'e-bigco', phase: 'execute', text: '대기업 참여제한 적용 여부를 입찰공고·제안요청서에 명시', hint: '고시 제2026-4호 제3조제2항' },
    { id: 'e-contract', phase: 'execute', text: '입찰·계약 진행 (국가계약법, 조달청 의뢰 여부 결정)' },
    has('subsidy') && { id: 'e-grant', phase: 'execute', text: '보조금 교부결정 및 집행 점검' },
    flags.totalCost && { id: 'e-total', phase: 'execute', text: '설계·발주·시공 단계별 총사업비 협의, 변경 시 조달청 사전검토' },
    { id: 'e-inspect', phase: 'execute', text: '검사·검수 후 대가 지급' },

    { id: 'v-result', phase: 'review', text: '집행실적과 성과지표 실적 정리' },
    { id: 'v-report', phase: 'review', text: '성과보고서·결산 자료 제출 (부처 일정 확인)' },
    flags.consult && { id: 'v-consult', phase: 'review', text: '사업 종료 후 사전협의 결과 반영 내용 통보', hint: '성과관리 지침 제18조제3항' },
    has('subsidy') && { id: 'v-settle', phase: 'review', text: '보조금 실적보고·정산·반환 확인' },
    { id: 'v-next', phase: 'review', text: '다음 연도 개선 사항 정리' },
  ];
  return items.filter(Boolean);
}

let currentChecklist = [];

function renderChecklist(flags) {
  currentChecklist = buildChecklist(flags);
  const done = currentChecklist.filter((i) => checked[i.id]).length;
  const total = currentChecklist.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('#checkProgressText').textContent = `${done} / ${total} 완료 (${pct}%)`;
  $('#checkProgressBar').style.width = `${pct}%`;
  $('#checkProgressBar').parentElement.setAttribute('aria-valuenow', String(pct));

  $('#checklist').innerHTML = PHASES.map((phase, index) => {
    const items = currentChecklist.filter((i) => i.phase === phase.id);
    const phaseDone = items.filter((i) => checked[i.id]).length;
    return `
      <section class="phase ${phaseDone === items.length && items.length ? 'complete' : ''}">
        <header>
          <span class="phase-no">0${index + 1}</span>
          <h3>${phase.label}</h3>
          <span class="phase-count">${phaseDone}/${items.length}</span>
        </header>
        <ul>
          ${items.map((item) => `
            <li>
              <label class="check-item">
                <input type="checkbox" data-check="${item.id}" ${checked[item.id] ? 'checked' : ''} />
                <span class="box" aria-hidden="true"></span>
                <span class="label">${escapeHtml(item.text)}${item.hint ? `<small>${escapeHtml(item.hint)}</small>` : ''}</span>
              </label>
            </li>`).join('')}
        </ul>
      </section>`;
  }).join('');
}

function copyChecklist() {
  const lines = [`[예산 업무 체크리스트] ${stageLabel()} · ${typeLabels().join(', ') || '성격 미선택'}`];
  PHASES.forEach((phase) => {
    lines.push('', `■ ${phase.label}`);
    currentChecklist.filter((i) => i.phase === phase.id).forEach((i) => {
      lines.push(`${checked[i.id] ? '☑' : '☐'} ${i.text}${i.hint ? ` (${i.hint})` : ''}`);
    });
  });
  copyText(lines.join('\n'), $('#copyChecklist'));
}

/* ---------- 4) AI 작업지시서 ---------- */

function updatePrompt(result) {
  const { rules } = result;
  const types = typeLabels().join(', ') || '미정';
  const ruleLines = rules.map((r) => `- [${LEVEL_LABEL[r.level]}] ${r.title} (근거: ${r.basis})`).join('\n');
  $('#promptOutput').value = `당신은 국립중앙도서관(문화체육관광부 소속기관) 직원의 국가예산 사업 작성 보조자입니다.

[사업 기본정보]
- 사업명: (입력)
- 구분: ${stageLabel()}사업
- 사업 성격: ${types}
- 총사업비: ${fmtNumber(state.amount)}억원 / 국고지원액: ${fmtNumber(state.support)}억원
- 당해연도 사업비(발주 금액): ${fmtNumber(state.annual)}억원
- 사업기간: ${state.multiYear ? '2년 이상' : '단년도'}

[우선 검토할 기준] (규정 탐색기 결과, 기준일 ${BASIS_DATE})
${ruleLines}

[작성 요청]
1. 적용 법령·지침을 조문 번호와 원문 링크와 함께 표로 정리하세요.
2. 예비타당성조사·총사업비 관리·정보화 사전협의·대기업 참여제한 해당 여부를 근거와 함께 판정하세요.
3. 제출·심사·협의·위원회·결산 절차를 시간순 체크리스트로 작성하세요. 문화체육관광부 내부 마감이 법정기한보다 앞선다는 점을 반영하세요.
4. 공식 양식이 필요한 항목은 양식명, 제출기관, 제출시기, 필수 첨부자료를 정리하세요.
5. 확인되지 않은 사실·금액·기한은 추정하지 말고 "확인 필요"로 표시하세요.
6. 최종 제출 전 예산·계약·정보화 담당 부서에 확인할 질문 5개를 제시하세요.`;
}

/* ---------- 복사 ---------- */

async function copyText(text, button) {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = '복사됨';
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    button.textContent = ok ? '복사됨' : '복사 실패';
  }
  setTimeout(() => { button.textContent = original; }, 1400);
}

/* ---------- 자료실 ---------- */

function renderLibrary(filter = 'all') {
  $('#libraryGrid').innerHTML = SOURCES
    .filter((item) => filter === 'all' || item.type === filter)
    .map((item) => `
      <article class="library-card">
        <div class="library-type">${item.label}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.desc)}</p>
        <a href="${item.href}" target="_blank" rel="noopener">${escapeHtml(item.cta)} ↗</a>
      </article>`).join('');
}

function renderChanges() {
  $('#changesGrid').innerHTML = CHANGES.map((c) => `
    <article class="change-card">
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.text)}</p>
      <small>${escapeHtml(c.basis)}</small>
    </article>`).join('');
}

/* ---------- 전체 갱신 ---------- */

function refresh() {
  const result = analyze();
  renderRules(result);
  renderChecklist(result.flags);
  renderCalendar();
  updatePrompt(result);
}

function bindEvents() {
  $('#finderForm').addEventListener('submit', (event) => {
    event.preventDefault();
    readForm();
    refresh();
    $('#finderResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#finderForm').addEventListener('input', () => { readForm(); refresh(); });
  $('#finderForm').addEventListener('change', () => { readForm(); refresh(); });

  $$('.library-tab').forEach((tab) => tab.addEventListener('click', () => {
    $$('.library-tab').forEach((other) => {
      other.classList.toggle('active', other === tab);
      other.setAttribute('aria-selected', String(other === tab));
    });
    renderLibrary(tab.dataset.filter);
  }));

  $('#customForm').addEventListener('submit', addCustomDeadline);
  $('#timeline').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (button) removeCustomDeadline(button.dataset.remove);
  });
  $('#downloadIcs').addEventListener('click', downloadIcs);

  $('#checklist').addEventListener('change', (event) => {
    const box = event.target.closest('[data-check]');
    if (!box) return;
    if (box.checked) checked[box.dataset.check] = true;
    else delete checked[box.dataset.check];
    saveStore(STORE_KEYS.checklist, checked);
    renderChecklist(analyze().flags);
  });
  $('#resetChecklist').addEventListener('click', () => {
    checked = {};
    saveStore(STORE_KEYS.checklist, checked);
    renderChecklist(analyze().flags);
  });
  $('#copyChecklist').addEventListener('click', copyChecklist);

  $('#copyPrompt').addEventListener('click', () => copyText($('#promptOutput').value, $('#copyPrompt')));

  $('#resetButton').addEventListener('click', () => {
    state = { ...DEFAULT_STATE };
    saveStore(STORE_KEYS.finder, state);
    writeForm();
    refresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function init() {
  $('#basisDate').textContent = BASIS_DATE.replaceAll('-', '.');
  $('#footerBasisDate').textContent = BASIS_DATE.replaceAll('-', '.');
  writeForm();
  renderChanges();
  renderLibrary();
  bindEvents();
  refresh();
}

init();
