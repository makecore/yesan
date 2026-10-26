/*
 * 국가예산 나침반 — 기준 데이터
 * ------------------------------------------------------------
 * 법령·지침이 바뀌면 이 파일만 고치면 됩니다.
 * 각 항목의 basis(근거)와 checkedAt(확인일)을 함께 갱신하세요.
 *
 * 기준일: 2026-10-26 (국가법령정보센터 현행 원문 대조)
 */

const BASIS_DATE = '2026-10-26';

/* 자주 쓰는 원문 링크 */
const LINKS = {
  nfa: 'https://www.law.go.kr/법령/국가재정법',
  nfaDecree: 'https://www.law.go.kr/법령/국가재정법시행령',
  guide2027: 'https://www.mpb.go.kr/web/main/bbs/b_0005/2225',
  totalCost: 'https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000278998',
  egovPerf: 'https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000287088',
  egovConsult: 'https://www.mois.go.kr/frt/sub/a06/b04/eBizConsultativeGroup/screen.do',
  sw: 'https://www.law.go.kr/법령/소프트웨어진흥법',
  swSme: 'https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000274532',
  swForm: 'https://www.law.go.kr/LSW/flDownload.do?bylClsCd=200203&flNm=%5B%EB%B3%84%EC%A7%80+5%5D+%EC%86%8C%ED%94%84%ED%8A%B8%EC%9B%A8%EC%96%B4%EC%82%AC%EC%97%85+%EA%B3%BC%EC%97%85%EB%82%B4%EC%9A%A9+%EC%82%AC%EC%A0%84%EA%B2%80%ED%86%A0+%EC%9A%94%EC%B2%AD%EC%84%9C&flSeq=133870799',
  contract: 'https://www.law.go.kr/법령/국가를당사자로하는계약에관한법률',
  g2b: 'https://www.g2b.go.kr/',
  subsidy: 'https://www.law.go.kr/법령/보조금관리에관한법률',
  rd: 'https://www.law.go.kr/법령/국가연구개발혁신법',
  rdCost: 'https://www.law.go.kr/행정규칙/국가연구개발사업연구개발비사용기준',
  sciBasic: 'https://www.law.go.kr/법령/과학기술기본법',
};

/* 자료실 카드 */
const SOURCES = [
  { type: 'budget', label: 'BUDGET / LAW', title: '국가재정법', desc: '중기사업계획서·편성지침·예산요구서·국회 제출 기한, 예비타당성조사, 총사업비 관리의 기본 근거.', href: LINKS.nfa, cta: '국가법령정보센터' },
  { type: 'budget', label: 'BUDGET / GUIDE', title: '2027년도 예산안 편성 및 기금운용계획안 작성 세부지침', desc: '비목별 편성 기준과 단가. 기획예산처 예산기준과, 2026.7.20. 게시.', href: LINKS.guide2027, cta: '기획예산처 게시물' },
  { type: 'budget', label: 'BUDGET / SCALE', title: '총사업비 관리지침', desc: '2년 이상 대규모 사업의 단계별 총사업비 협의·변경 절차. 기획예산처 훈령, 2026.5.11. 발령.', href: LINKS.totalCost, cta: '지침 원문' },
  { type: 'budget', label: 'BUDGET / DECREE', title: '국가재정법 시행령', desc: '총사업비 관리 대상 범위(제21조) 등 법률의 세부 기준.', href: LINKS.nfaDecree, cta: '시행령 원문' },
  { type: 'digital', label: 'DIGITAL / GUIDE', title: '전자정부 성과관리 지침', desc: '정보화사업 사전협의 대상·제외사업·신청 시기. 행정안전부고시 제2026-63호, 2026.10.19.', href: LINKS.egovPerf, cta: '지침 원문' },
  { type: 'digital', label: 'DIGITAL / PROCESS', title: '정보화사업 사전협의제 운영', desc: '행정안전부의 사전협의 안내 페이지와 헬프데스크.', href: LINKS.egovConsult, cta: '행정안전부 안내' },
  { type: 'digital', label: 'DIGITAL / LAW', title: '소프트웨어 진흥법', desc: '사전협의(제47조), 대기업 참여제한(제48조), 과업심의위원회(제50조)의 법률 근거.', href: LINKS.sw, cta: '법률 원문' },
  { type: 'digital', label: 'DIGITAL / GUIDE', title: '중소 소프트웨어사업자의 사업 참여 지원에 관한 지침', desc: '대기업 참여 사업금액 하한(80억·40억·20억). 과학기술정보통신부고시 제2026-4호.', href: LINKS.swSme, cta: '고시 원문' },
  { type: 'digital', label: 'DIGITAL / FORM', title: 'SW사업 과업내용 사전검토 요청서', desc: '과업심의 전 사전검토에 쓰는 별지 서식.', href: LINKS.swForm, cta: '서식 내려받기' },
  { type: 'contract', label: 'CONTRACT / LAW', title: '국가를 당사자로 하는 계약에 관한 법률', desc: '입찰·계약·변경·검사·대가 지급의 기본 법령.', href: LINKS.contract, cta: '법률 원문' },
  { type: 'contract', label: 'CONTRACT / PRACTICE', title: '나라장터(국가종합전자조달)', desc: '발주·입찰·계약 단계 실무 시스템.', href: LINKS.g2b, cta: '나라장터 열기' },
  { type: 'transfer', label: 'TRANSFER / LAW', title: '보조금 관리에 관한 법률', desc: '예산계상 신청, 교부결정, 사업 변경, 실적보고·정산·반환.', href: LINKS.subsidy, cta: '법률 원문' },
  { type: 'transfer', label: 'R&D / LAW', title: '국가연구개발혁신법', desc: '국가 R&D의 기획·선정·협약·평가·성과관리 공통 기준.', href: LINKS.rd, cta: '법률 원문' },
  { type: 'transfer', label: 'R&D / GUIDE', title: '국가연구개발사업 연구개발비 사용기준', desc: '연구개발비 편성·사용·정산 기준.', href: LINKS.rdCost, cta: '기준 원문' },
];

/* 2026년에 바뀐 핵심 기준 (화면 상단 안내) */
const CHANGES = [
  { title: '예산은 기획예산처, 결산은 재정경제부', text: '정부조직 개편으로 국가재정법상 예산·기금 사무는 기획예산처장관, 결산 사무는 재정경제부장관이 맡습니다(제11조).', basis: '국가재정법 제11조' },
  { title: 'R&D는 예타 대상에서 제외', text: '국가연구개발사업 항목이 예비타당성조사 대상에서 삭제되었습니다. 별도 심사 절차를 확인하세요.', basis: '국가재정법 제38조제1항제3호 삭제(2026.2.10.)' },
  { title: 'SW 대기업 참여 하한 80억·40억', text: '매출 8천억원 이상 대기업은 80억원 이상, 미만 대기업은 40억원 이상 사업에만 참여할 수 있습니다.', basis: '과학기술정보통신부고시 제2026-4호 별표 1' },
  { title: '전자정부 성과관리 지침 개정', text: '정보화사업 사전협의 지침이 2026.10.19. 개정되었습니다. 대상·제외사업을 새 지침으로 확인하세요.', basis: '행정안전부고시 제2026-63호' },
];

/* 사업 성격 */
const TYPES = [
  { value: 'info', label: '정보화·SW' },
  { value: 'construction', label: '건설·토목' },
  { value: 'building', label: '건축(청사·서고 등)' },
  { value: 'rd', label: '국가 R&D' },
  { value: 'subsidy', label: '보조금·민간이전' },
  { value: 'culture', label: '문화·교육 등 일반' },
];

/*
 * 연간 법정 일정
 * - month: 1~12, day: 숫자 또는 'last'(말일)
 * - offsetFromNextYear: 다음 회계연도 개시일(1월 1일)로부터 며칠 전인지
 * - tags: 'all'은 모든 사업, 그 외는 해당 사업 성격을 선택했을 때만 표시
 */
const LEGAL_DEADLINES = [
  { id: 'midterm', month: 1, day: 31, title: '중기사업계획서 제출', who: '중앙관서 → 기획예산처', basis: '국가재정법 제28조', tags: ['all'], phase: 'plan' },
  { id: 'settle-dept', month: 2, day: 'last', title: '중앙관서결산보고서 제출(전년도분)', who: '중앙관서 → 재정경제부', basis: '국가재정법 제58조', tags: ['all'], phase: 'review' },
  { id: 'guideline', month: 3, day: 31, title: '예산안편성지침 통보', who: '기획예산처 → 중앙관서', basis: '국가재정법 제29조', tags: ['all'], phase: 'request' },
  { id: 'settle-nation', month: 4, day: 10, title: '국가결산보고서 감사원 제출', who: '재정경제부 → 감사원', basis: '국가재정법 제59조', tags: ['all'], phase: 'review' },
  { id: 'subsidy-request', month: 4, day: 30, title: '보조금 예산계상 신청 최종 한도일', who: '보조사업 희망자 → 중앙관서 (중앙관서가 이날 이전으로 제출일 지정)', basis: '보조금 관리에 관한 법률 제4조제4항', tags: ['subsidy'], phase: 'request' },
  { id: 'audit', month: 5, day: 20, title: '감사원 결산검사 결과 송부', who: '감사원 → 재정경제부', basis: '국가재정법 제60조', tags: ['all'], phase: 'review' },
  { id: 'request', month: 5, day: 31, title: '예산요구서 제출', who: '중앙관서 → 기획예산처', basis: '국가재정법 제31조', tags: ['all'], phase: 'request' },
  { id: 'settle-assembly', month: 5, day: 31, title: '국가결산보고서 국회 제출', who: '정부 → 국회', basis: '국가재정법 제61조', tags: ['all'], phase: 'review' },
  { id: 'submit', offsetFromNextYear: 120, title: '정부 예산안 국회 제출', who: '정부 → 국회 (회계연도 개시 120일 전)', basis: '국가재정법 제33조', tags: ['all'], phase: 'deliberation' },
  { id: 'resolve', offsetFromNextYear: 30, title: '국회 예산안 의결 기한', who: '국회 (회계연도 개시 30일 전)', basis: '헌법 제54조제2항', tags: ['all'], phase: 'deliberation' },
  { id: 'sw-exception', month: 12, day: 'last', title: 'SW 대기업 참여 예외 인정 요청', who: '발주기관 → 과학기술정보통신부 (사업 시행 전년도 12월 말)', basis: '중소 SW사업자 사업참여 지원 지침 제5조', tags: ['info'], phase: 'execute' },
];

/* 체크리스트 단계 */
const PHASES = [
  { id: 'plan', label: '기획' },
  { id: 'request', label: '요구·편성' },
  { id: 'deliberation', label: '심의·확정' },
  { id: 'execute', label: '집행' },
  { id: 'review', label: '성과·결산' },
];
