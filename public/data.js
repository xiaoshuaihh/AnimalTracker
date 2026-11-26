export const categories = ['猫', '狗', '鸟类', '蛇'];
export const kinds = ['日常观察', '鸟撞', '车辆碰撞', '其他疑似受伤事件'];

export const eventRoles = {
  animal_welfare: '动物保护协会成员',
  campus_management: '校级相关管理人员',
};

export const areas = [
  { id: 'lake', name: '神仙湖', x: 38, y: 29 },
  { id: 'library', name: '图书馆', x: 56, y: 55 },
  { id: 'college', name: '书院区', x: 73, y: 66 },
  { id: 'teaching', name: '教学区', x: 21, y: 61 },
  { id: 'sports', name: '运动场', x: 76, y: 29 },
  { id: 'garden', name: '校园绿道', x: 44, y: 76 },
];

export const samples = [
  { id: 'demo-orange', name: '橘子', category: '猫', species: '家猫', features: '橘色虎斑，白色下巴', personality: '下午常独自晒太阳。', likes: '图书馆外的石阶和太阳。', photo: '/assets/cat.jpg', demo: true },
  { id: 'demo-bulbul', name: '小红帽', category: '鸟类', species: '红耳鹎', features: '黑色冠羽，眼后有红斑', personality: '多在枝头活动。', likes: '树冠茂密的湖边。', photo: '/assets/bird.jpg', demo: true },
  { id: 'demo-bulbul-white', name: '白头鹎观察档案', category: '鸟类', species: '白头鹎', features: '后头部有白斑，背部略带绿色', personality: '', likes: '', photo: '', demo: true },
  { id: 'demo-dog', name: '布丁', category: '狗', species: '家犬', features: '浅棕色背部，白色胸口', personality: '平时在安静的地方休息。', likes: '书院外的草地。', photo: '/assets/dog.jpg', demo: true },
];

export const sampleVisits = [
  { id: 'demo-visit-1', animal_id: 'demo-orange', category: '猫', species: '家猫', area: 'library', kind: '日常观察', note: '午后在石阶上晒太阳。', photo: '/assets/cat.jpg', observed_at: '2026-11-25T06:32:00.000Z', demo: true },
  { id: 'demo-visit-2', animal_id: 'demo-bulbul', category: '鸟类', species: '红耳鹎', area: 'lake', kind: '日常观察', note: '在湖边的树枝上鸣叫。', photo: '/assets/bird.jpg', observed_at: '2026-11-25T01:15:00.000Z', demo: true },
  { id: 'demo-visit-3', animal_id: 'demo-dog', category: '狗', species: '家犬', area: 'college', kind: '日常观察', note: '在草坪边休息。', photo: '/assets/dog.jpg', observed_at: '2026-11-24T08:42:00.000Z', demo: true },
  { id: 'demo-visit-4', animal_id: 'demo-orange', category: '猫', species: '家猫', area: 'teaching', kind: '日常观察', note: '从步道旁经过。', photo: '/assets/cat.jpg', observed_at: '2026-11-23T04:30:00.000Z', demo: true },
  { id: 'demo-visit-5', animal_id: 'demo-bulbul', category: '鸟类', species: '红耳鹎', area: 'sports', kind: '日常观察', note: '停在运动场外围树枝上。', photo: '/assets/bird.jpg', observed_at: '2026-11-22T03:15:00.000Z', demo: true },
  { id: 'demo-visit-6', animal_id: 'demo-dog', category: '狗', species: '家犬', area: 'garden', kind: '日常观察', note: '沿绿道缓慢走过。', photo: '/assets/dog.jpg', observed_at: '2026-11-21T09:03:00.000Z', demo: true },
  { id: 'demo-visit-7', animal_id: 'demo-bulbul-white', category: '鸟类', species: '白头鹎', area: 'teaching', kind: '日常观察', note: '从教学楼旁的树丛飞过。', photo: '', observed_at: '2026-11-23T02:10:00.000Z', demo: true },
  { id: 'demo-visit-8', animal_id: 'demo-bulbul-white', category: '鸟类', species: '白头鹎', area: 'garden', kind: '日常观察', note: '在绿道旁的树枝停留。', photo: '', observed_at: '2026-11-20T08:20:00.000Z', demo: true },
];

export function achievementsFor(visits, bookmarks, now = new Date()) {
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Shanghai' });
  const day = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'Asia/Shanghai' });
  const catDays = new Set(visits.filter(visit => visit.category === '猫' && year.format(new Date(visit.observed_at)) === year.format(now))
    .map(visit => day.format(new Date(visit.observed_at))));
  const days = new Set(visits.map(visit => day.format(new Date(visit.observed_at))));
  const categories = new Set(visits.map(visit => visit.category));
  const species = new Set(visits.filter(visit => visit.species).map(visit => JSON.stringify([visit.category, visit.species])));
  const regions = new Set(visits.map(visit => visit.area));
  const frequency = new Map();
  for (const visit of visits) {
    if (visit.animal_id) frequency.set(visit.animal_id, (frequency.get(visit.animal_id) || 0) + 1);
  }
  return [
    ['first', '首次相遇', '记录第一条日常观察。', visits.length > 0, 'star'],
    ['cat', '猫咪来客', '记录一次校园猫咪观察。', categories.has('猫'), 'cat'],
    ['bird', '鸟鸣入册', '记录一次鸟类观察。', categories.has('鸟类'), 'bird'],
    ['dog', '狗狗邻居', '记录一次犬类观察。', categories.has('狗'), 'dog'],
    ['snake', '蛇口逃生', '从安全距离记录一次蛇类目击。', categories.has('蛇'), 'snake'],
    ['cat-year', '年度猫咪', '在同一年里，三天各记录至少一次猫咪观察。', catDays.size >= 3, 'cat'],
    ['regular', '眼熟的朋友', '记录同一只动物至少三次。', [...frequency.values()].some(count => count >= 3), 'paw'],
    ['walker', '散步地图', '在三个不同校园区域记录观察。', regions.size >= 3, 'map'],
    ['collector', '集邮入门', '收藏三个不同的动物档案。', new Set(bookmarks).size >= 3, 'bookmark'],
    ['journal', '三日观察笔记', '在三个不同的日期记录观察。', days.size >= 3, 'clock'],
    ['species', '辨认高手', '累计记录五种已注明物种的动物。', species.size >= 5, 'leaf'],
    ['observer', '校园观察员', '累计记录十条日常观察。', visits.length >= 10, 'book'],
  ];
}
