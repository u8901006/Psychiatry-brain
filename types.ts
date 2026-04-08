
export interface Paper {
  id: string;
  title: string;
  journal: string;
  date: string;
  url?: string;
  abstract?: string;
  // AI Generated fields
  titleZh?: string;
  summary?: string;
  pico?: {
    p: string;
    i: string;
    c: string;
    o: string;
  };
  utility?: string;
  tags?: string[];
  isAnalyzed?: boolean;
}

export interface AnalysisResponse {
  titleZh: string;
  summary: string;
  pico: {
    p: string;
    i: string;
    c: string;
    o: string;
  };
  utility: string;
  tags: string[];
}

export enum Tab {
  FEED = 'FEED',
  ARCHITECTURE = 'ARCHITECTURE'
}

export enum JournalFilter {
  ALL = '所有期刊',
  // Top Tier / General Medicine with Psych
  NEJM = 'NEJM',
  LANCET = 'The Lancet',
  JAMA = 'JAMA',
  
  // Psychiatry Q1/Q2
  WORLD_PSYCH = 'World Psychiatry',
  JAMA_PSYCH = 'JAMA Psychiatry',
  LANCET_PSYCH = 'Lancet Psychiatry',
  MOL_PSYCH = 'Molecular Psychiatry',
  AM_J_PSYCH = 'Am J Psychiatry',
  BIO_PSYCH = 'Biological Psychiatry',
  NATURE_NEURO = 'Nature Neuroscience',
  PSYCH_MED = 'Psychological Medicine',
  J_CLIN_PSYCH = 'J Clinical Psychiatry',
  BRIT_J_PSYCH = 'Brit J Psychiatry',
  SCHIZ_BULL = 'Schizophrenia Bulletin',
  NEUROPSYCHOPHARMACOLOGY = 'Neuropsychopharmacology',
  J_CPP = 'J Child Psychol Psychiatry',
  ACTA_PSYCH_SCAND = 'Acta Psychiatr Scand',
  J_AFFECT_DISORDERS = 'Journal of Affective Disorders'
}

export enum TopicFilter {
  ALL = '所有主題',
  SCHIZOPHRENIA = '思覺失調症',
  DEPRESSION = '憂鬱症',
  BIPOLAR = '雙相情緒障礙 (躁鬱症)',
  ANXIETY = '焦慮障礙',
  PTSD = '創傷後壓力症候群',
  OCD = '強迫症',
  DISSOCIATION = '解離性障礙',
  ADDICTION = '成癮醫學',
  PAIN = '疼痛管理',
  PSYCHOTHERAPY = '心理治療研究',
  SUICIDE = '自殺防治',
  CHILD_ADOLESCENT = '兒童與青少年精神醫學',
  AUTISM = '自閉症 (Autism)',
  ADHD = '注意力不足過動症 (ADHD)'
}
