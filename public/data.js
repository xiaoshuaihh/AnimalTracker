export const categories = ['猫', '狗', '鸟类', '蛇'];
export const kinds = ['日常观察', '鸟撞', '车辆碰撞', '其他疑似受伤事件'];

// 观察标签：每个动物类别有独立的一套标签，记录时可多选，也可新增自定义标签。
// 实际可选标签 = 这里的预设 + 该类别历史记录中出现过的标签。
export const tagPresets = {
  猫: ['白猫', '黑猫', '狸花猫', '橘猫', '三花猫', '奶牛猫', '玳瑁猫', '长毛猫', '短毛猫', '幼猫'],
  狗: ['白狗', '黑狗', '黄狗', '花狗', '卷毛狗', '大型犬', '小型犬', '幼犬'],
  鸟类: ['白羽', '黑羽', '彩色羽毛', '长尾', '猛禽', '水鸟', '幼鸟'],
  蛇: ['小蛇', '大蛇', '无毒蛇', '疑似毒蛇', '黑蛇', '花蛇'],
};

export const eventRoles = {
  animal_welfare: '动物保护协会成员',
  campus_management: '校级相关管理人员',
};

// 校园地点分为五大类：上园、下园、中园、神仙湖、其它（包括无定位）。
// 每个大类细分为小类，其中「其它地点」小类允许用户自行填写文字。
// lng/lat 为真实经纬度（WGS84），请对照地图调整；lng/lat 为 null 表示不在地图上显示标记。
export const regions = [
  {
    // 22.693859, 114.197430
    id: 'upper', name: '上园', color: '#7a9e6b', label: { lng: 114.197430, lat: 22.693859 },
    spots: [
      // 22.691869, 114.198041
      { id: 'upper-lingCollege', name: '道扬书院', lng: 114.198041, lat: 22.691869 },
      // 22.691812, 114.199528
      { id: 'upper-harmoniaCollege', name: '祥波书院', lng: 114.199528, lat: 22.691812 },
      // 22.693281, 114.198699
      { id: 'upper-deligentiaCollege', name: '学勤书院', lng: 114.198699, lat: 22.693281 },
      // 22.695016, 114.197674
      { id: 'upper-minervaCollege', name: '厚含书院', lng: 114.197674, lat: 22.695016 },
      // 22.694536, 114.196746
      { id: 'upper-duanCollege', name: '永平书院', lng: 114.196746, lat: 22.694536 },
      // 22.692940, 114.197629
      { id: 'upper-museCollege', name: '思廷书院', lng: 114.197629, lat: 22.692940 },
      // 22.694557, 114.195810
      { id: 'upper-teachersDorm', name: '教职工宿舍', lng: 114.195810, lat: 22.694557 },
      { id: 'upper-other', name: '其它地点（自行填写）', lng: null, lat: null, custom: true },
    ],
  },
  {
    // 22.691510, 114.208502
    id: 'lower', name: '下园', color: '#c08a4e', label: { lng: 114.208502, lat: 22.691510 },
    spots: [
      // 22.692324, 114.208223
      { id: 'lower-library', name: '新图书馆', lng: 114.208223, lat: 22.692324 },
      // 22.693205, 114.209379
      { id: 'lower-admin', name: '行政楼', lng: 114.209379, lat: 22.693205 },
      // 22.687950, 114.205858
      { id: 'lower-gym', name: '体育馆', lng: 114.205858, lat: 22.687950 },
      // 22.692758, 114.210561
      { id: 'lower-teachingA', name: '教学楼A', lng: 114.210561, lat: 22.692758 },
      // 22.691384, 114.207489
      { id: 'lower-studentCenter', name: '学生中心', lng: 114.207489, lat: 22.691384 },
      // 22.688712, 114.207289
      { id: 'lower-daoYuanBuilding', name: '道远楼', lng: 114.207289, lat: 22.688712 },
      { id: 'lower-other', name: '其它地点（自行填写）', lng: null, lat: null, custom: true },
    ],
  },
  {
    // 22.687282, 114.200589
    id: 'middle', name: '中园', color: '#6b8fa3', label: { lng: 114.200589, lat: 22.687282 },
    spots: [
      // 22.687905, 114.200445
      { id: 'middle-eighthCollege', name: '第八书院', lng: 114.200445, lat: 22.687905 },
      // 22.686955, 114.201169
      { id: 'middle-library', name: '音乐学院图书馆', lng: 114.201169, lat: 22.686955 },
      { id: 'middle-other', name: '其它地点（自行填写）', lng: null, lat: null, custom: true },
    ],
  },
  {
    // 22.688143, 114.195445
    id: 'lake', name: '神仙湖', color: '#4f9b9b', label: { lng: 114.195445, lat: 22.688143 },
    spots: [
      // 22.689127, 114.195327
      { id: 'lake-north', name: '神仙湖北', lng: 114.195327, lat: 22.689127 },
      // 22.687356, 114.195032
      { id: 'lake-south', name: '神仙湖南', lng: 114.195032, lat: 22.687356 },
      { id: 'lake-other', name: '其它地点（自行填写）', lng: null, lat: null, custom: true },
    ],
  },
  {
    id: 'other', name: '其它', color: '#8a8f94', label: null,
    spots: [
      { id: 'other-none', name: '无定位', lng: null, lat: null },
      { id: 'other-other', name: '其它地点（自行填写）', lng: null, lat: null, custom: true },
    ],
  },
];

// 扁平化的小类列表，供地图标记与服务端校验使用。
export const areas = regions.flatMap(region => region.spots.map(spot => ({ ...spot, region: region.id })));

// 旧版区域 id 到新小类 id 的映射，用于兼容已保存的记录。
export const legacyAreaIds = {
  library: 'lower-library',
  teaching: 'middle-teaching',
  college: 'upper-college',
  sports: 'lower-gym',
  garden: 'lake-garden',
  lake: 'lake-shore',
};

// 返回记录所属的大类 id（自定义地点归入「其它」）。
export const areaRegion = id => {
  if (typeof id !== 'string' || !id) return null;
  if (id.startsWith('custom:')) return 'other';
  const spot = areas.find(item => item.id === id) || areas.find(item => item.id === legacyAreaIds[id]);
  return spot ? spot.region : null;
};

export const samples = [
  { id: 'demo-orange', name: '橘子', category: '猫', species: '家猫', features: '橘色虎斑，白色下巴', personality: '下午常独自晒太阳。', likes: '图书馆外的石阶和太阳。', photo: '/assets/cat.jpg', demo: true },
  { id: 'demo-bulbul', name: '小红帽', category: '鸟类', species: '红耳鹎', features: '黑色冠羽，眼后有红斑', personality: '多在枝头活动。', likes: '树冠茂密的湖边。', photo: '/assets/bird.jpg', demo: true },
  { id: 'demo-bulbul-white', name: '白头鹎观察档案', category: '鸟类', species: '白头鹎', features: '后头部有白斑，背部略带绿色', personality: '', likes: '', photo: '', demo: true },
  { id: 'demo-dog', name: '布丁', category: '狗', species: '家犬', features: '浅棕色背部，白色胸口', personality: '平时在安静的地方休息。', likes: '书院外的草地。', photo: '/assets/dog.jpg', demo: true },
];

export const sampleVisits = [
  { id: 'demo-visit-1', animal_id: 'demo-orange', category: '猫', species: '家猫', area: 'lower-library', kind: '日常观察', note: '午后在石阶上晒太阳。', photo: '/assets/cat.jpg', observed_at: '2026-11-25T06:32:00.000Z', tags: ['橘猫', '短毛猫'], demo: true },
  { id: 'demo-visit-2', animal_id: 'demo-bulbul', category: '鸟类', species: '红耳鹎', area: 'lake-shore', kind: '日常观察', note: '在湖边的树枝上鸣叫。', photo: '/assets/bird.jpg', observed_at: '2026-11-25T01:15:00.000Z', tags: ['彩色羽毛'], demo: true },
  { id: 'demo-visit-3', animal_id: 'demo-dog', category: '狗', species: '家犬', area: 'upper-college', kind: '日常观察', note: '在草坪边休息。', photo: '/assets/dog.jpg', observed_at: '2026-11-24T08:42:00.000Z', tags: ['黄狗'], demo: true },
  { id: 'demo-visit-4', animal_id: 'demo-orange', category: '猫', species: '家猫', area: 'middle-teaching', kind: '日常观察', note: '从步道旁经过。', photo: '/assets/cat.jpg', observed_at: '2026-11-23T04:30:00.000Z', tags: ['橘猫'], demo: true },
  { id: 'demo-visit-5', animal_id: 'demo-bulbul', category: '鸟类', species: '红耳鹎', area: 'lower-gym', kind: '日常观察', note: '停在运动场外围树枝上。', photo: '/assets/bird.jpg', observed_at: '2026-11-22T03:15:00.000Z', tags: ['彩色羽毛', '长尾'], demo: true },
  { id: 'demo-visit-6', animal_id: 'demo-dog', category: '狗', species: '家犬', area: 'lake-garden', kind: '日常观察', note: '沿绿道缓慢走过。', photo: '/assets/dog.jpg', observed_at: '2026-11-21T09:03:00.000Z', tags: ['黄狗'], demo: true },
  { id: 'demo-visit-7', animal_id: 'demo-bulbul-white', category: '鸟类', species: '白头鹎', area: 'middle-teaching', kind: '日常观察', note: '从教学楼旁的树丛飞过。', photo: '', observed_at: '2026-11-23T02:10:00.000Z', tags: ['白羽'], demo: true },
  { id: 'demo-visit-8', animal_id: 'demo-bulbul-white', category: '鸟类', species: '白头鹎', area: 'lake-garden', kind: '日常观察', note: '在绿道旁的树枝停留。', photo: '', observed_at: '2026-11-20T08:20:00.000Z', tags: ['白羽'], demo: true },
];

export function achievementsFor(visits, bookmarks, now = new Date()) {
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Shanghai' });
  const day = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'Asia/Shanghai' });
  const catDays = new Set(visits.filter(visit => visit.category === '猫' && year.format(new Date(visit.observed_at)) === year.format(now))
    .map(visit => day.format(new Date(visit.observed_at))));
  const days = new Set(visits.map(visit => day.format(new Date(visit.observed_at))));
  const categories = new Set(visits.map(visit => visit.category));
  const species = new Set(visits.filter(visit => visit.species).map(visit => JSON.stringify([visit.category, visit.species])));
  const regions = new Set(visits.map(visit => areaRegion(visit.area)).filter(Boolean));
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
