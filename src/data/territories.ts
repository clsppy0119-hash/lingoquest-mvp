export const territoryIds = ['school', 'restaurant', 'airport'] as const;

export type TerritoryId = (typeof territoryIds)[number];

export type Territory = {
  id: TerritoryId;
  order: number;
  name: string;
  englishName: string;
  chapter: string;
  region: string;
  icon: string;
  enemyIcon: string;
  scenario: string;
  conquestBrief: string;
  patrolBrief: string;
  marchTime: string;
  prerequisiteId: TerritoryId | null;
  questionIds: string[];
};

export const territories: Territory[] = [
  {
    id: 'school',
    order: 1,
    name: '學校',
    englishName: 'School Lv.1',
    chapter: '第一領地',
    region: '東部戰區 · 地塊 01',
    icon: '⌂',
    enemyIcon: '⌂',
    scenario: '校園交流',
    conquestBrief: '學會早晨問候、介紹物品與詢問校園位置。',
    patrolBrief: '重做學校錯題，穩固最初的語言據點。',
    marchTime: '約 3 分鐘',
    prerequisiteId: null,
    questionIds: ['school-hello', 'school-pencil', 'school-library'],
  },
  {
    id: 'restaurant',
    order: 2,
    name: '餐廳',
    englishName: 'Restaurant Lv.1',
    chapter: '第二領地',
    region: '河谷戰區 · 地塊 02',
    icon: '♨',
    enemyIcon: '♨',
    scenario: '餐廳點餐',
    conquestBrief: '練習入座、禮貌點餐與回應服務人員。',
    patrolBrief: '重做餐廳錯題，確保點餐口令清楚有禮。',
    marchTime: '約 4 分鐘',
    prerequisiteId: 'school',
    questionIds: ['restaurant-table', 'restaurant-order', 'restaurant-thanks'],
  },
  {
    id: 'airport',
    order: 3,
    name: '機場',
    englishName: 'Airport Lv.1',
    chapter: '第三領地',
    region: '北境戰區 · 地塊 03',
    icon: '✈',
    enemyIcon: '✈',
    scenario: '機場報到',
    conquestBrief: '練習出示護照、詢問登機門與理解登機指示。',
    patrolBrief: '重做機場錯題，熟悉出發前的關鍵英文。',
    marchTime: '約 5 分鐘',
    prerequisiteId: 'restaurant',
    questionIds: ['airport-passport', 'airport-gate', 'airport-boarding'],
  },
];

export const territoryById = (id: string | null | undefined) =>
  territories.find((territory) => territory.id === id);

export const isTerritoryId = (value: unknown): value is TerritoryId =>
  typeof value === 'string' && territoryIds.includes(value as TerritoryId);
