export type Question = {
  id: string;
  territoryId: 'school' | 'restaurant' | 'airport';
  prompt: string;
  guide: string;
  choices: string[];
  answer: string;
  tip: string;
};
export const questions: Question[] = [
  {
    id: 'school-hello',
    territoryId: 'school',
    prompt: 'You meet your teacher in the morning. What do you say?',
    guide: '情境：早上遇到老師。請選出最合適的英文問候。',
    choices: ['Good morning!', 'Good night!', 'See you yesterday!'],
    answer: 'Good morning!',
    tip: '中午以前向人問候時，使用 “Good morning”。',
  },
  {
    id: 'school-pencil',
    territoryId: 'school',
    prompt: 'Choose the correct sentence.',
    guide: '請選出文法正確、表示「這是一枝鉛筆」的英文句子。',
    choices: ['This is a pencil.', 'These is a pencil.', 'This are pencils.'],
    answer: 'This is a pencil.',
    tip: '指一個靠近自己的單數物品時，使用 “This is”。',
  },
  {
    id: 'school-library',
    territoryId: 'school',
    prompt: 'Complete: “Where ___ the library?”',
    guide: '請選出適合填入空格的 be 動詞，完成詢問圖書館位置的句子。',
    choices: ['is', 'are', 'am'],
    answer: 'is',
    tip: '“The library” 是單數，因此搭配 “is”。',
  },
  {
    id: 'restaurant-table',
    territoryId: 'restaurant',
    prompt: 'You enter a restaurant. What do you say?',
    guide: '情境：你和朋友走進餐廳，想請服務人員安排兩人座位。',
    choices: ['A table for two, please.', 'Two tables yesterday.', 'I am a table.'],
    answer: 'A table for two, please.',
    tip: '需要幾人座位時，可說 “A table for two, please.”；please 讓語氣更有禮貌。',
  },
  {
    id: 'restaurant-order',
    territoryId: 'restaurant',
    prompt: 'Choose the polite way to order soup.',
    guide: '情境：你已經看好菜單，準備禮貌地向服務人員點一份湯。',
    choices: ['I would like the soup, please.', 'Soup is like me.', 'You are the soup.'],
    answer: 'I would like the soup, please.',
    tip: '點餐時使用 “I would like ...” 比直接命令更自然、禮貌。',
  },
  {
    id: 'restaurant-thanks',
    territoryId: 'restaurant',
    prompt: 'The server brings your meal. What do you say?',
    guide: '情境：服務人員把餐點送上桌，請選出合適的英文回應。',
    choices: ['Thank you.', 'Where is yesterday?', 'Good airport.'],
    answer: 'Thank you.',
    tip: '收到餐點或服務時，使用 “Thank you.” 表達感謝。',
  },
  {
    id: 'airport-passport',
    territoryId: 'airport',
    prompt: 'At check-in, the agent asks for your passport. What do you say?',
    guide: '情境：報到櫃檯人員向你索取護照，你要一邊遞出護照一邊回應。',
    choices: ['Here is my passport.', 'This passport are here.', 'My passport yesterday.'],
    answer: 'Here is my passport.',
    tip: '把物品遞給對方時，可用 “Here is ...” 表示「這是……／給你……」。',
  },
  {
    id: 'airport-gate',
    territoryId: 'airport',
    prompt: 'Complete: “Where ___ Gate 12?”',
    guide: '情境：你在機場找不到 12 號登機門，請完成詢問位置的句子。',
    choices: ['is', 'are', 'am'],
    answer: 'is',
    tip: '“Gate 12” 是單數地點，因此使用 “Where is ...?”。',
  },
  {
    id: 'airport-boarding',
    territoryId: 'airport',
    prompt: 'What does “Now boarding” mean?',
    guide: '情境：廣播提到你的航班並說 “Now boarding”。請選出正確意思。',
    choices: [
      'You can get on the plane now.',
      'The airport is closed.',
      'Your flight was yesterday.',
    ],
    answer: 'You can get on the plane now.',
    tip: '“Now boarding” 表示航班現在開始登機，可以前往登機門排隊。',
  },
];

export const questionById = (id: string) => questions.find((question) => question.id === id);
