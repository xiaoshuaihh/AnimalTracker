import { regions, areas, legacyAreaIds, categories, kinds, samples, sampleVisits, eventRoles, achievementsFor } from './data.js';
import { createMap, renderSightings, destroyMap } from './map.js';

const paths = {
  paw: '<ellipse cx="6.5" cy="9" rx="2" ry="2.7" transform="rotate(-24 6.5 9)"/><ellipse cx="10" cy="5.8" rx="1.7" ry="2.5"/><ellipse cx="14" cy="5.8" rx="1.7" ry="2.5"/><ellipse cx="17.5" cy="9" rx="2" ry="2.7" transform="rotate(24 17.5 9)"/><path d="M12 11c-2 0-3 2-4.5 3.1C4.1 16.5 6.7 20 9.4 19c1.7-.7 3.5-.7 5.2 0 2.7 1 5.3-2.5 1.9-4.9C15 13 14 11 12 11Z"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
  book: '<path d="M12 6c-3-3-7-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2v15z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  cat: '<path d="M4 12V4l5 4h6l5-4v8c0 4-3 7-8 7s-8-3-8-7Z"/><path d="M9 13h.01m6 0h.01m-4 3h2"/>',
  dog: '<path d="M8 5h8l4 2 1 7-5 1v3a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3l-5-1 1-7zM9 12h.01m6 0h.01m-4 3h2"/>',
  bird: '<path d="M16 7c-2 0-3.7 1.1-4.5 2.8L3 8l4.2 5L4 17h8c3.8 0 6.8-2.6 6.8-6.5L22 9l-3.7-.7A3.7 3.7 0 0 0 16 7Z"/><path d="M16 10h.01M12 17l-1 3"/>',
  snake: '<path d="M3 19h12a4 4 0 1 0 0-8H8a3 3 0 0 1 0-6h8m-1-2 5 2-5 2z"/>',
  event: '<path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01"/>',
  video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3"/>',
  mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3"/>',
  text: '<path d="M4 6h16M12 6v13m-3 0h6"/>',
  window: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16M8 4v4m8 2v4m-5 2v4"/>',
  person: '<circle cx="12" cy="8" r="3"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  leaf: '<path d="M20 4c-7 0-14 1-15 8-1 5 4 8 8 6 6.4-3 7-10 7-14ZM4 20l10-10"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  close: '<path d="m6 6 12 12m0-12L6 18"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="3"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  home: '<path d="m3 10.5 9-7.5 9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-6v6H4.5A1.5 1.5 0 0 1 3 20Z"/>',
  discover: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
};

function icon(name) {
  return '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (paths[name] || paths.paw) + '</svg>';
}

const main = document.querySelector('#main');
const modal = document.querySelector('#modal');
const toast = document.querySelector('#announcement');
const plusMenu = document.querySelector('#plus-menu');
const plusButton = document.querySelector('[data-action=plus-menu]');
const animalIcons = { 猫: 'cat', 狗: 'dog', 鸟类: 'bird', 蛇: 'snake' };
const state = {
  animals: [...samples], visits: [...sampleVisits], bookmarks: [], signedIn: false, username: '', nickname: '', avatar: '', ai: false,
  area: '', filter: '', species: '', mapFloating: false, mapPos: null, allVisits: false, loadError: '',
  events: null, eventError: '', eventLoading: false,
  me: undefined, meError: '', person: null, personError: '', fundraisers: [],
  permissions: {}, onboarding: false, collectionExpanded: false, achievementsExpanded: false,
};
let exploreMap = null;
let profileMap = null;
let formState = null;
let toastTimer;
const esc = text => String(text ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
// crypto.randomUUID 仅在安全上下文（HTTPS 或 localhost）可用；经局域网 IP 用 HTTP 访问时退回自实现。
const randomId = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
  const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
  return (char === 'x' ? r : (r & 3 | 8)).toString(16);
});
const options = values => values.map(([value, name]) => `<option value="${esc(value)}">${esc(name)}</option>`).join('');
const findAnimal = id => state.animals.find(animal => animal.id === id);
// 解析任意地点记录：预置小类、自定义地点（custom: 前缀）或旧版 id。
const areaInfo = id => {
  if (!id) return { id: '', name: '未记录地点', x: null, y: null, region: null };
  if (id.startsWith('custom:')) {
    const parts = id.slice(7).split(':');
    return parts.length > 1
      ? { id, name: parts.slice(1).join(':').trim(), x: null, y: null, region: parts[0], custom: true }
      : { id, name: id.slice(7).trim(), x: null, y: null, region: 'other', custom: true };
  }
  const spot = areas.find(item => item.id === id) || areas.find(item => item.id === legacyAreaIds[id]);
  if (spot) return { ...spot };
  const prefix = id.split('-')[0];
  const region = ['upper','lower','middle','lake','other'].includes(prefix) ? prefix : null;
  return { id, name: id, x: null, y: null, region };
};
const findArea = id => areaInfo(id);
// 用于按小类过滤记录：旧 id 归一到新小类，自定义地点返回 null（不参与地图过滤）。
const areaKey = id => id.startsWith('custom:') ? null : (legacyAreaIds[id] || id);
const regionOf = id => regions.find(region => region.id === id);
const sightingSpecies = visit => findAnimal(visit.animal_id)?.species || visit.species;
const isEvent = visit => visit.kind !== kinds[0];
const categoryIcon = name => Object.hasOwn(animalIcons, name) ? animalIcons[name] : 'paw';
const categoryNames = () => [...new Set([...categories, ...state.animals.map(animal => animal.category), ...state.visits.map(visit => visit.category)])];
const formatDate = date => new Intl.DateTimeFormat('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'Asia/Shanghai' }).format(new Date(date));
const personHandle = () => /^#person\/([a-z0-9_-]{3,24})$/.exec(location.hash)?.[1];
const selectedTab = () => personHandle() ? 'person' :
  ['home','animals','discover','mine','events'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';

async function api(path, body) {
  const multipart = body instanceof FormData;
  const result = await fetch('/api/' + path, body ? {
    method: 'POST', ...(multipart ? {body} : {headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}),
  } : undefined);
  const data = await result.json();
  if (!result.ok) {
    if (result.status === 401 && !path.startsWith('auth/')) {
      state.signedIn = false;
      state.username = '';
      showLogin();
    }
    throw new Error(data.error || '操作失败，请稍后重试。');
  }
  return data;
}

async function refresh() {
  try {
    const data = await api('bootstrap');
    Object.assign(state, data, {
      animals: [...data.animals, ...samples],
      visits: [...data.visits, ...sampleVisits].sort((a, b) => b.observed_at.localeCompare(a.observed_at)),
      loadError: '',
    });
  } catch {
    state.loadError = '暂时无法同步校园观察，页面仍可浏览示例记录。';
  }
  if (state.signedIn && state.me === undefined) await loadMe();
  if (state.signedIn && !state.username) await loadAccount();
  render();
  if (selectedTab() === 'events') await loadEvents();
  if (selectedTab() === 'mine') queryPermissionStates();
  offerPermissions();
}

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toastTimer = setTimeout(() => { toast.textContent = ''; }, 4100);
}

function picture(photo, alt, className = '') {
  if (!photo) return `<span class="no-photo ${className}" aria-label="暂无照片">${icon('paw')}</span>`;
  return `<img class="${className}" src="${esc(photo)}" alt="${esc(alt)}" decoding="async">`;
}

function button(label, iconName, action, style = 'outline', value = '') {
  return `<button type="button" class="button ${style}" data-action="${action}" data-value="${esc(value)}">${icon(iconName)}${label}</button>`;
}

const formatInfo = {
  photo: ['照片','camera'],
  video: ['视频','video'],
  audio: ['录音','mic'],
  text: ['文字','text'],
};

function visitFormat(visit) {
  if (visit.photo) return 'photo';
  if (visit.media_type?.startsWith('video/')) return 'video';
  if (visit.media_type?.startsWith('audio/')) return 'audio';
  return 'text';
}

function formatMark(format, compact = false) {
  const [label, symbol] = formatInfo[format];
  return `<span class="format-mark" data-format="${format}" aria-label="${label}" title="${label}">${icon(symbol)}${compact ? '' : label}</span>`;
}

function visitAttachment(visit, title) {
  const format = visitFormat(visit);
  if (format === 'photo') return picture(visit.photo, title, 'profile-photo');
  if (format === 'video') return `<video class="observation-video" controls playsinline preload="metadata" src="${esc(visit.media)}" aria-label="观察视频"></video>`;
  if (format === 'audio') return `<audio class="observation-audio" controls preload="metadata" src="${esc(visit.media)}" aria-label="观察录音"></audio>`;
  return '';
}

function mapView(visits, { profile = false } = {}) {
  const floating = !profile && state.mapFloating;
  const position = floating && state.mapPos ? `left:${state.mapPos.x}px;top:${state.mapPos.y}px` : '';
  const handle = floating ? `<div class="float-handle" data-action="map-drag"><span class="grip" aria-hidden="true">⠿</span>
    <strong>校园足迹地图</strong><span class="float-hint">拖动移动</span>
    <button type="button" class="text-button float-restore" data-action="map-toggle" aria-label="还原完整地图">${icon('expand')}还原</button></div>` : '';
  const zoomButtons = `<div class="zoom"><button data-action="zoom-in" aria-label="放大地图">+</button><button data-action="zoom-out" aria-label="缩小地图">−</button></div>`;
  const tools = profile ? '' : `<div class="map-tools">${floating ? '' : zoomButtons}
    ${floating ? '' : `<button type="button" class="map-tool-button" data-action="map-toggle" aria-label="缩成小窗" title="缩成小窗">${icon('window')}</button>`}
  </div>`;
  return `<div class="map-frame${floating ? ' floating' : ''}" style="${position}" aria-label="校园足迹地图">
    ${handle}
    <div class="map-slot"><div class="map-host" data-map="${profile ? 'profile' : 'explore'}"></div></div>
    ${tools}
    ${profile || floating ? '' : '<div class="map-caption"><span>底图：OpenFreeMap · © OpenStreetMap</span><span>标记为大致位置</span></div>'}
  </div>`;
}

function pinElement(spot, records, selected, profile) {
  const formats = [...new Set(records.map(visitFormat))];
  const types = formats.map(format => formatInfo[format][0]).join('、');
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'map-pin';
  const regionPin = spot.id.startsWith('region-loose-');
  element.dataset.action = profile ? 'profile-point' : regionPin ? 'visit' : 'area';
  element.dataset.value = regionPin ? records[0].id : spot.id;
  element.dataset.visit = records[0].id;
  element.setAttribute('aria-pressed', String(selected));
  element.setAttribute('aria-label', `${selected ? spot.name + '，' : ''}${records.length} 条目击记录：${types}`);
  const region = regionOf(spot.region);
  element.innerHTML = `<span class="pin-formats" style="--pc:${region?.color || '#56765d'}">${formats.map(format => formatMark(format, true)).join('')}</span>
    ${selected ? `<small>${esc(spot.name)}</small>` : ''}`;
  return element;
}

function trackPoints(visits) {
  const individuals = new Map();
  for (const visit of visits.slice().reverse()) {
    if (!visit.animal_id) continue;
    const points = individuals.get(visit.animal_id) ?? [];
    const area = findArea(visit.area);
    if (area?.lng != null && points.at(-1)?.id !== area.id) points.push(area);
    individuals.set(visit.animal_id, points);
  }
  return [...individuals.values()].filter(points => points.length > 1);
}

function speciesFor(category) {
  return [...new Set([...state.animals, ...state.visits.map(visit => ({...visit, species:sightingSpecies(visit)}))]
    .filter(item => (!category || item.category === category) && item.species)
    .map(item => item.species))].sort((a,b) => a.localeCompare(b,'zh-CN'));
}

function filteredVisits() {
  return state.visits.filter(visit => (!state.filter || visit.category === state.filter)
    && (!state.species || sightingSpecies(visit) === state.species));
}

function animalCard(animal) {
  const saved = state.bookmarks.includes(animal.id);
  const count = state.visits.filter(visit => visit.animal_id === animal.id).length;
  return `<article class="animal-card">
    <button type="button" class="card-open" data-action="animal" data-value="${esc(animal.id)}">
      ${picture(animal.photo, animal.name, 'cover')}
      <span class="pill card-tag">${esc(animal.category)}${animal.demo ? ' · 示例' : ''}</span>
      <span class="card-body" style="display:block"><strong>${esc(animal.name)}</strong><small>${esc(animal.species || '物种待确认')} · ${count} 次观察</small></span>
    </button>
    <button type="button" class="save-button" aria-label="${saved ? '取消收藏' : '收藏'}${esc(animal.name)}" aria-pressed="${saved}" data-action="bookmark" data-value="${esc(animal.id)}">${icon('bookmark')}</button>
  </article>`;
}

function feedRow(visit) {
  const animal = findAnimal(visit.animal_id);
  const title = animal?.name ?? (visit.species || visit.category);
  return `<button class="feed-row" data-action="visit" data-value="${esc(visit.id)}">
    ${visit.photo ? picture(visit.photo, title) : `<span class="no-photo">${icon(formatInfo[visitFormat(visit)][1])}</span>`}
    <span><strong>${esc(title)}${visit.demo ? ' <span class="pill">示例</span>' : ''}</strong><small>${formatDate(visit.observed_at)}</small></span>
    ${formatMark(visitFormat(visit))}
  </button>`;
}

function home() {
  const filtered = filteredVisits();
  const visible = filtered.filter(visit => !state.area || areaKey(visit.area) === state.area);
  const displayed = state.allVisits ? visible : visible.slice(0, 3);
  const species = speciesFor(state.filter);
  const chips = [['','全部','filter'], ...categoryNames().map(name => [name,name,categoryIcon(name)])];
  const mapHint = state.species ? '虚线连接同一个体按时间排列的目击点。' : '点击标记查看地点和记录，地图可缩放、拖动。';
  return `${state.loadError ? `<p class="empty" role="status">${esc(state.loadError)} <button class="text-button" data-action="refresh">重试</button></p>` : ''}
  <div class="explore-grid">
    <section class="panel">
      <div class="panel-header"><div><h2>校园足迹地图</h2><p>${mapHint}</p></div></div>
      <div class="chips" aria-label="筛选动物类别">${chips.map(([key,name,symbol]) => `<button class="chip" data-action="filter" data-value="${esc(key)}" aria-pressed="${state.filter === key}">${icon(symbol)}${esc(name)}</button>`).join('')}</div>
      <div class="species-filter"><label for="map-species">物种</label><select id="map-species">
        <option value="">全部物种</option>${species.map(name => `<option value="${esc(name)}"${state.species === name ? ' selected' : ''}>${esc(name)}</option>`).join('')}
      </select></div>
      ${state.mapFloating ? `<div class="map-placeholder"><span class="placeholder-icon">${icon('map')}</span><span>地图已缩为小窗，拖动小窗标题栏可以移动位置。</span><button class="text-button" data-action="map-toggle">${icon('expand')}还原完整地图</button></div>` : mapView(filtered)}
      ${filtered.length ? '' : '<p class="empty map-empty">当前筛选暂无目击点。</p>'}
    </section>
    <section class="panel">
      <div class="panel-header feed-heading"><div><h2>${state.area ? esc(findArea(state.area).name) : '最新观察'}</h2><p>${state.area ? visible.length + ' 条区域记录' : '按观察时间排序'}</p></div>${state.area ? '<button class="text-button" data-action="area" data-value="">清除地点</button>' : icon('clock')}</div>
      <div class="feed-list" aria-live="polite">${displayed.length ? displayed.map(feedRow).join('') : '<p class="empty">这个范围内暂无观察。</p>'}</div>
      ${visible.length > 3 ? `<div class="feed-footer"><button class="text-button" data-action="more">${state.allVisits ? '收起观察记录' : '查看全部观察'}</button></div>` : ''}
    </section>
  </div>
  ${state.mapFloating ? mapView(filtered) : ''}`;
}

function animalsPage() {
  return `<section class="page-title"><h1>动物档案</h1><p>查找校园动物，看看它们在哪些地方被观察到。</p></section>
    <div class="section-header"><label class="field"><span>搜索档案</span><input id="animal-search" type="search" placeholder="名称、类别或物种"></label>${button('新增动物','plus','new-animal','primary')}</div>
    <section class="card-grid" id="all-animals">${state.animals.map(animalCard).join('')}</section>`;
}

function discoverRow(visit) {
  const animal = findAnimal(visit.animal_id);
  const title = animal?.name ?? (sightingSpecies(visit) || visit.category);
  const author = visit.demo ? `<span class="author"><span class="author-avatar">${icon('paw')}</span><span class="author-name">示例记录</span></span>`
    : `<span class="author"><span class="author-avatar">${visit.author_avatar ? `<img src="${esc(visit.author_avatar)}" alt="作者头像">` : icon('person')}</span><span class="author-name">${esc(visit.author || '观察者')}</span></span>`;
  const attachment = visit.photo ? `<img class="discover-photo" src="${esc(visit.photo)}" alt="${esc(title)}" loading="lazy">`
    : visit.media_type?.startsWith('video/') ? `<video class="observation-video" controls preload="metadata" src="${esc(visit.media)}"></video>`
    : visit.media_type?.startsWith('audio/') ? `<audio class="observation-audio" controls preload="metadata" src="${esc(visit.media)}"></audio>` : '';
  return `<article class="discover-card">
    <header class="discover-head">${author}<time>${formatDate(visit.observed_at)}</time></header>
    ${visit.note ? `<p class="discover-note">${esc(visit.note)}</p>` : ''}
    ${attachment}
    <footer class="discover-foot">
      <span class="pill">${icon(categoryIcon(visit.category))}${esc(visit.category)}${sightingSpecies(visit) ? ' · ' + esc(sightingSpecies(visit)) : ''}</span>
      <span class="discover-area">${icon('pin')}${esc(findArea(visit.area)?.name || '未知地点')}</span>
      ${formatMark(visitFormat(visit), true)}
      ${animal ? `<button class="text-button" data-action="animal" data-value="${esc(animal.id)}">${icon('book')}查看档案</button>` : ''}
    </footer>
  </article>`;
}

function discoverPage() {
  const visits = [...state.visits].sort((a, b) => b.observed_at.localeCompare(a.observed_at));
  return `<section class="page-title discover-title"><div><h1>发现</h1><p>校园动物观察动态，按时间顺序展示。</p></div>
    <a class="button outline" href="#events">${icon('event')}特殊事件</a></section>
    ${state.loadError ? `<p class="empty" role="status">${esc(state.loadError)} <button class="text-button" data-action="refresh">重试</button></p>` : ''}
    <div class="discover-feed">${visits.length ? visits.map(discoverRow).join('') : '<p class="empty">暂无观察记录。</p>'}</div>`;
}

const COLLECTION_PAGE = 6;

function minePage() {
  const mine = state.visits.filter(visit => visit.mine);
  const encountered = new Set(mine.map(visit => visit.animal_id).filter(Boolean));
  const saved = new Set(state.bookmarks);
  const personal = state.animals.filter(animal => saved.has(animal.id) || encountered.has(animal.id));
  const achievements = achievementsFor(mine.map(visit => ({...visit, species:sightingSpecies(visit)})), state.bookmarks);
  const unlockedCount = achievements.filter(([, , , unlocked]) => unlocked).length;
  const personalVisible = state.collectionExpanded ? personal : personal.slice(0, COLLECTION_PAGE);
  const badgesVisible = state.achievementsExpanded ? achievements : achievements.slice(0, COLLECTION_PAGE);
  const account = state.signedIn ? `<section class="panel mine-panel">
    <div class="panel-header"><div><h2>账号</h2><p>当前登录：<strong>${esc(state.username)}</strong></p></div>
      <button type="button" class="text-button" data-action="logout">退出登录</button></div>
    <div class="account-body">
      <span class="account-avatar">${state.avatar ? `<img src="${esc(state.avatar)}" alt="我的头像">` : icon('person')}</span>
      <div class="account-info"><strong>${esc(state.nickname || state.username)}</strong><small>用户名 ${esc(state.username)}</small></div>
      <div class="account-actions">
        <button class="button outline" data-action="edit-nickname">修改昵称</button>
        <button class="button outline" data-action="change-avatar">更换头像</button>
      </div>
    </div>
  </section>` : '<div class="collection-banner"><strong>登录后记录观察、收藏档案并管理设备权限</strong>' + button('登录','person','login','primary') + '</div>';
  const collection = !state.signedIn ? '<div class="collection-banner"><strong>登录后查看你的图鉴</strong>' + button('登录','person','login','primary') + '</div>' : `
    <section class="mine-section"><div class="section-header"><div><h2>相遇与收藏</h2><p>${personal.length} 份动物档案 · ${mine.length} 条日常观察 · ${saved.size} 份收藏</p></div></div>
      ${personalVisible.length ? `<div class="card-grid">${personalVisible.map(animalCard).join('')}</div>` : '<p class="empty">图鉴还是空的。记录相遇或从动物档案收藏一只动物。</p>'}
      ${personal.length > COLLECTION_PAGE ? `<div class="expand-row"><button class="text-button" data-action="collection-expand">${state.collectionExpanded ? '收起档案' : '展开全部 ' + personal.length + ' 份档案'}</button></div>` : ''}
    </section>
    <section class="mine-section"><div class="section-header"><div><h2>成就墙</h2><p>已解锁 ${unlockedCount} / ${achievements.length}</p></div></div>
      <div class="achievements">${badgesVisible.map(([, title, description, unlocked, symbol]) => `<article class="achievement ${unlocked ? 'unlocked' : ''}">
        <span class="medal">${icon(symbol)}${unlocked ? '' : '<span class="medal-question" aria-hidden="true">?</span>'}</span><strong>${unlocked ? title : '待解锁'}</strong><p>${description}</p>
      </article>`).join('')}</div>
      ${achievements.length > COLLECTION_PAGE ? `<div class="expand-row"><button class="text-button" data-action="achievements-expand">${state.achievementsExpanded ? '收起成就' : '展开全部成就'}</button></div>` : ''}
    </section>`;
  const permissions = `<section class="panel mine-panel">
    <div class="panel-header"><div><h2>设备权限</h2><p>可以按需授权，浏览器会显示相应的权限请求。</p></div></div>
    ${permissionCards()}</section>`;
  // 管理员模式：为管理员预留的隐藏入口，当前版本不显示。
  // 后续可在此渲染 <section class="panel mine-panel"><div class="panel-header"><div><h2>管理员模式</h2><p>审核与数据管理。</p></div></div></section>
  return `<section class="page-title"><h1>我的</h1></section>
  ${account}
  <h2 class="mine-group-title">我的图鉴</h2>${collection}
  <h2 class="mine-group-title">设备权限</h2>${permissions}`;
}

const statusLabels = { pending: '待审核', approved: '已通过', rejected: '未通过', revoked: '已撤销' };
const eventStatements = `<ul class="event-statements">
  <li>本页用于留存疑似动物受伤情况。记录来自个人目击，现场情况与原因有待核实，请勿猜测或转发。</li>
  <li>如有人身风险、交通隐患或动物急需帮助，请先联系校园安保或相关管理人员。提交此表不会通知救援人员。</li>
  <li>请在安全距离记录事实，避免触碰、追逐动物或进入车道。上传前请移除可辨认的人脸、车牌与个人信息。</li>
  <li>记录仅本人及通过审核的动物保护协会成员、校级相关管理人员可查看。请勿截图、外传或用于其他目的。</li>
</ul>`;

function eventsPage() {
  const data = state.events;
  const application = data?.application;
  const filtered = data?.events || [];
  const account = !state.signedIn
    ? '<div class="collection-banner"><strong>登录后记录及查看你提交的事件</strong>' + button('登录','person','login','primary') + '</div>'
    : `<div class="section-header">
      <div><h2>${data?.canViewAll ? '已授权的事件记录' : '我的事件记录'}</h2>
      ${application ? `<p>查看权限 · ${statusLabels[application.status]} · ${esc(eventRoles[application.role])}</p>` : ''}</div>
      <div class="event-actions">
        ${data && (!application || ['rejected','revoked'].includes(application.status)) ? button('申请查看权限','lock','event-apply') : ''}
        ${data?.canReview ? button('审核申请','book','event-review-list') : ''}
      </div>
    </div>
    ${state.eventLoading ? '<p class="empty" role="status">正在加载事件记录…</p>' : ''}
    ${state.eventError ? `<p class="error" role="alert">${esc(state.eventError)} <button class="text-button" data-action="events-refresh">重试</button></p>` : ''}
    ${data && !state.eventError ? `<section class="panel event-list">${filtered.length ? filtered.map(visit => `
      <button class="event-row" data-action="event-visit" data-value="${esc(visit.id)}">
        <span class="event-marker">${icon('event')}</span>
        <span><strong>${esc(visit.kind)}<span class="pill">待核实</span></strong>
        <small>${esc(visit.category)} · ${esc(findArea(visit.area)?.name)} · ${formatDate(visit.observed_at)}</small></span>
        ${visit.mine ? '<small>本人提交</small>' : ''}
      </button>`).join('') : '<p class="empty">暂无可查看的事件记录。</p>'}</section>` : ''}`;
  return `<section class="page-title event-title"><div><h1>特殊事件</h1><p>记录鸟撞、车辆碰撞等疑似动物受伤事件。</p></div>
    ${state.signedIn ? button('记录特殊事件','plus','event-record','primary') : ''}
  </section>
  <aside class="event-notice"><h2>${icon('info')} 记录与查看说明</h2>${eventStatements}</aside>
  ${account}`;
}

async function loadEvents() {
  if (!state.signedIn || state.eventLoading) return;
  state.eventLoading = true;
  state.eventError = '';
  if (selectedTab() === 'events') render();
  try {
    state.events = await api('events');
  } catch (error) {
    state.events = null;
    state.eventError = error.message;
  } finally {
    state.eventLoading = false;
    if (selectedTab() === 'events') render();
  }
}

function eventApplication() {
  showDialog('申请查看特殊事件', `<form class="form" id="event-application">
    <label class="field"><span>申请身份</span><select name="role" required>
      ${options([['','请选择身份'],...Object.entries(eventRoles)])}</select></label>
    <label class="field"><span>所属协会、部门或岗位</span><input name="affiliation" maxlength="120" required placeholder="请填写可供审核员核实的组织名称"></label>
    <label class="field"><span>校内邮箱</span><input name="campusEmail" type="email" maxlength="120" autocomplete="email" required></label>
    <p class="hint">申请信息仅用于权限审核。请勿填写证件号码、电话或上传证明材料。</p>
    <label class="checkline"><input type="checkbox" name="acknowledged" required>我确认申请信息真实，并仅为校园动物保护工作使用记录。</label>
    <p class="error" role="alert" hidden></p><div class="form-actions"><button class="button primary" type="submit">提交申请</button></div>
  </form>`);
}

async function submitApplication(form) {
  const fields = Object.fromEntries(new FormData(form));
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;
  try {
    await api('events/apply', {role:fields.role, affiliation:fields.affiliation, campusEmail:fields.campusEmail, acknowledged:!!fields.acknowledged});
    if (form.isConnected) modal.close();
    await loadEvents();
    notify('权限申请已提交。');
  } catch (error) {
    formError(form,error.message);
  } finally {
    submit.disabled = false;
  }
}

async function showEventReview() {
  showDialog('特殊事件权限审核', '<p class="empty" role="status">正在加载申请…</p>');
  const opening = modal.querySelector('.empty');
  try {
    const { applications } = await api('events/review');
    if (!modal.open || !opening.isConnected) return;
    showDialog('特殊事件权限审核', applications.length ? `<div class="review-list">${applications.map(application => `<article>
      <strong>${esc(eventRoles[application.role])} · ${statusLabels[application.status]}</strong>
      <p>${esc(application.affiliation)} · ${esc(application.campus_email)}</p><p class="hint">${application.identity_match ? '校内邮箱与登录账号一致' : '请通过校内渠道核对邮箱和身份'}</p><p class="hint">申请时间 ${formatDate(application.submitted_at)}</p>
      ${application.own_request ? '<p class="hint">本人申请由其他审核员处理。</p>' : application.status === 'pending' ? `<div class="event-actions">
        ${button('通过','star','event-approve','primary',application.request_id)}
        ${button('驳回','close','event-reject','outline',application.request_id)}</div>` : application.status === 'approved' ?
        button('撤销查看权限','lock','event-revoke','outline',application.request_id) : ''}
    </article>`).join('')}</div>` : '<p class="empty">暂无申请。</p>', '请核实申请人的实际成员或岗位身份后再处理。');
  } catch (error) {
    if (modal.open && opening.isConnected) opening.textContent = error.message;
  }
}

async function decideApplication(decision, id, trigger) {
  const wording = {approve:'通过此申请', reject:'驳回此申请', revoke:'撤销此账号的查看权限'};
  if (!window.confirm('确定' + wording[decision] + '？')) return;
  trigger.disabled = true;
  try {
    await api('events/review', {decision, id});
    if (trigger.isConnected) await showEventReview();
    notify('审核结果已保存。');
  } catch (error) {
    notify(error.message);
  } finally {
    trigger.disabled = false;
  }
}

async function showEvent(id) {
  showDialog('特殊事件详情', '<p class="empty" role="status">正在核验查看权限…</p>');
  const loading = modal.querySelector('.empty');
  try {
    const { event } = await api('events/' + id);
    if (modal.open && loading.isConnected) showEventDetail(event);
  } catch (error) {
    if (modal.open && loading.isConnected) loading.textContent = error.message;
  }
}

function showEventDetail(visit) {
  showDialog(visit.kind, `<div class="profile-facts">
    <p><strong>地点</strong>　${esc(findArea(visit.area)?.name)}</p>
    <p><strong>时间</strong>　${formatDate(visit.observed_at)}</p>
    <p><strong>动物</strong>　${esc(visit.category)}${visit.species ? ' · ' + esc(visit.species) : ''}</p>
    <p><strong>目击情况</strong>　${esc(visit.note || '暂无备注')}</p>
    </div>${visit.photo ? `<details class="event-photo"><summary>查看照片（可能含受伤画面）</summary>${picture(visit.photo,'事件记录照片','profile-photo')}</details>` : ''}
    <p class="hint">个人提交，情况待核实。请勿截屏或转发。</p>`, '受限事件记录');
}

const permissionItems = {
  camera: ['拍照','camera','相机'],
  video: ['录像','video','相机和麦克风'],
  microphone: ['录音','mic','麦克风'],
  geolocation: ['定位','target','位置信息'],
};
const permissionText = { granted: '已允许', denied: '未允许，请在浏览器站点设置修改', prompt: '可在使用时授权' };
let avatarDraft = '';
let avatarPreview = 0;
let avatarPending = false;

function permissionCards() {
  return `<div class="permission-grid">${Object.entries(permissionItems).map(([key,[title,symbol,resource]]) => `
    <div class="permission-row"><div>${icon(symbol)}<span><strong>${title}</strong><small data-permission-status="${key}">${permissionText[state.permissions[key]] || resource}</small></span></div>
    ${state.permissions[key] === 'granted' ? `<button class="button" disabled aria-disabled="true">${icon('star')}已授权</button>` : button('开启','plus','permission','outline',key)}</div>`).join('')}</div>`;
}

function refreshPermissionLabels() {
  document.querySelectorAll('[data-permission-status]').forEach(label => {
    const key = label.dataset.permissionStatus;
    label.textContent = permissionText[state.permissions[key]] || permissionItems[key][2];
  });
}

async function queryPermissionStates() {
  if (!navigator.permissions?.query) return;
  await Promise.all(['camera','microphone','geolocation'].map(async name => {
    try {
      const status = await navigator.permissions.query({name});
      state.permissions[name] = status.state;
    } catch {
      // Some browsers expose these prompts without a queryable status.
    }
  }));
  const {camera, microphone} = state.permissions;
  if (camera === 'granted' && microphone === 'granted') state.permissions.video = 'granted';
  else if (camera === 'denied' || microphone === 'denied') state.permissions.video = 'denied';
  else if (camera || microphone) state.permissions.video = 'prompt';
  refreshPermissionLabels();
}

async function requestPermission(kind, trigger) {
  trigger.disabled = true;
  try {
    if (kind === 'geolocation') {
      if (!navigator.geolocation) throw new Error('当前浏览器没有提供定位。');
      await new Promise((resolve,reject) => navigator.geolocation.getCurrentPosition(resolve,reject,{timeout:10000}));
    } else {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('当前浏览器或页面无法请求相机或麦克风权限。');
      const stream = await navigator.mediaDevices.getUserMedia({ video:kind !== 'microphone', audio:kind !== 'camera' });
      for (const track of stream.getTracks()) track.stop();
    }
    state.permissions[kind] = 'granted';
    notify('已允许使用' + permissionItems[kind][0] + '。');
  } catch (error) {
    if (error.name === 'NotAllowedError' || error.code === 1) state.permissions[kind] = 'denied';
    notify(state.permissions[kind] === 'denied' ? '权限未开启，可在浏览器的站点设置修改。' : error.message || '暂时无法获得设备权限。');
  } finally {
    trigger.disabled = false;
    refreshPermissionLabels();
    queryPermissionStates();
  }
}

function offerPermissions() {
  if (state.local || state.onboarding || modal.open || !state.signedIn || ['mine','person'].includes(selectedTab())) return;
  try {
    if (localStorage.getItem('wildlife-device-intro')) return;
    localStorage.setItem('wildlife-device-intro','1');
  } catch {
    // The dialog is still offered once for this page.
  }
  state.onboarding = true;
  showDialog('开启观察所需的权限', `<p class="hint">可按需授权。以后也可以在设置中开启。</p>${permissionCards()}
    <div class="form-actions">${button('稍后设置','close','close')}</div>`);
  queryPermissionStates();
}

async function loadMe() {
  try {
    state.me = (await api('me')).profile;
    state.meError = '';
  } catch (error) {
    state.meError = error.message;
  }
}

async function loadAccount() {
  try {
    const data = await api('auth/me');
    state.signedIn = data.signedIn;
    state.username = data.username || '';
    state.nickname = data.nickname || '';
    state.avatar = data.avatar || '';
  } catch {
    state.username = '';
  }
}

function profileAvatar(profile) {
  return profile?.avatar ? picture(profile.avatar,'个人头像','person-avatar') : `<span class="person-avatar avatar-placeholder">${icon('person')}</span>`;
}

async function setAvatar(file, form) {
  const version = ++avatarPreview;
  avatarDraft = '';
  form.elements.avatarConsent.checked = false;
  form.elements.avatarConsent.required = false;
  form.querySelector('#avatar-confirm').hidden = true;
  if (!file) return;
  try {
    avatarPending = true;
    const photo = await preparePhoto(file,400);
    if (version !== avatarPreview || !form.isConnected) return;
    const avatar = form.querySelector('.person-avatar');
    avatar.outerHTML = picture(photo,'待保存的头像','person-avatar');
    avatarDraft = photo;
    form.elements.avatarConsent.required = true;
    form.querySelector('#avatar-confirm').hidden = false;
    if (form.elements.removeAvatar) form.elements.removeAvatar.checked = false;
    formError(form,'');
  } catch {
    if (version === avatarPreview && form.isConnected) formError(form,'无法读取头像，请尝试 JPEG、PNG 或 WebP 照片。');
  } finally {
    if (version === avatarPreview) avatarPending = false;
  }
}

async function savePerson(form) {
  if (avatarPending) return formError(form,'头像正在处理，请稍等。');
  const data = new FormData(form);
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;
  try {
    const badges = data.getAll('badges');
    const result = await api('me',{
      handle: data.get('handle'), avatar: avatarDraft, avatarConsent: !!data.get('avatarConsent'),
      removeAvatar: !!data.get('removeAvatar'), badges,
    });
    state.me = result.profile;
    avatarDraft = '';
    if (selectedTab() === 'settings') render();
    notify('个人主页已保存。');
  } catch (error) {
    formError(form,error.message);
  } finally {
    submit.disabled = false;
  }
}

async function loadPerson() {
  const handle = personHandle();
  if (!handle) return;
  state.person = null;
  state.personError = '';
  render();
  try {
    const result = await api('people/' + handle);
    if (personHandle() !== handle) return;
    state.person = result.profile;
  } catch (error) {
    if (personHandle() !== handle) return;
    state.personError = error.message;
  }
  render();
}

function personPage() {
  const profile = state.person;
  if (!profile) return `<p class="empty" role="status">${esc(state.personError || '正在加载个人主页…')}</p>`;
  const shown = new Set(profile.badges);
  return `<section class="page-title person-title">${profileAvatar(profile)}<div><h1>@${esc(profile.handle)}</h1><p>个人主页</p></div></section>
    <section><div class="section-header"><h2>展示成就</h2></div>
    ${shown.size ? `<div class="achievements">${achievementsFor([],[]).filter(([id]) => shown.has(id)).map(([,title,description,,symbol]) =>
      `<article class="achievement unlocked"><span class="medal">${icon(symbol)}</span><strong>${title}</strong><p>${description}</p></article>`).join('')}</div>` :
      '<p class="empty">这位观察者暂未展示成就。</p>'}</section>`;
}

function catFundraiser(animal) {
  if (animal.category !== '猫') return '';
  const products = state.fundraisers.filter(item => item.animalId === animal.id);
  const money = new Intl.NumberFormat('zh-CN', {style:'currency',currency:'CNY'});
  return `<section class="fundraiser"><h3>校园动物义卖</h3>${products.length ?
    `<p class="hint">本栏义卖所得全部用于改善校园动物生活。</p><ul>${products.map(item => `<li><span>
      <strong>${esc(item.title)}</strong><small>${esc(money.format(item.priceCents / 100))}</small></span>
      <a class="button outline" href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">购买链接</a></li>`).join('')}</ul>` :
    '<p class="hint">暂无已核实的义卖商品。义卖开放后，所得将全部用于改善校园动物生活。</p>'}</section>`;
}

function render() {
  const active = selectedTab();
  for (const tab of document.querySelectorAll('[data-tab]')) {
    if (tab.dataset.tab === active) tab.setAttribute('aria-current','page');
    else tab.removeAttribute('aria-current');
  }
  const search = document.querySelector('#animal-search')?.value ?? '';
  // 探索页地图容器跨渲染保留，避免反复重建地图引擎。
  const preserved = main.querySelector('.map-host[data-map=explore]');
  main.innerHTML = active === 'animals' ? animalsPage() : active === 'discover' ? discoverPage() : active === 'mine' ? minePage() : active === 'events' ? eventsPage() : active === 'person' ? personPage() : home();
  if (preserved) {
    const slot = main.querySelector('.map-slot');
    if (slot) slot.replaceChildren(preserved);
  }
  const host = main.querySelector('.map-host[data-map=explore]');
  if (host) {
    exploreMap = createMap(host, exploreMap);
    exploreMap?.resize?.();
    renderSightings(exploreMap, filteredVisits(), {
      selectedArea: state.area,
      tracks: state.species ? trackPoints(filteredVisits()) : [],
      pinBuilder: pinElement,
    });
  }
  const searchBox = document.querySelector('#animal-search');
  if (searchBox && search) {
    searchBox.value = search;
    filterAnimals(search);
  }
}

function filterAnimals(text) {
  const query = text.trim().toLowerCase();
  const matches = state.animals.filter(animal => [animal.name, animal.category, animal.species, animal.features].some(value => value.toLowerCase().includes(query)));
  document.querySelector('#all-animals').innerHTML = matches.length ? matches.map(animalCard).join('') : '<p class="empty">没有匹配的档案。</p>';
}

function showDialog(title, content, subtitle = '') {
  modal.innerHTML = `<div class="dialog-inner"><header class="dialog-head"><div><h2 id="dialog-title">${esc(title)}</h2>
    ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div><button type="button" class="close" aria-label="关闭" data-action="close">${icon('close')}</button></header>${content}</div>`;
  if (!modal.open) modal.showModal();
}

function accountDialog(mode = 'login') {
  const register = mode === 'register';
  return `<form class="form" id="auth-form" data-mode="${mode}">
    <label class="field"><span>用户名</span><input name="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_\\-]{3,24}" autocomplete="username" placeholder="3–24 位字母、数字、下划线或连字符" autofocus></label>
    <label class="field"><span>密码</span><input type="password" name="password" required minlength="8" maxlength="128" autocomplete="${register ? 'new-password' : 'current-password'}"></label>
    ${register ? '<p class="hint">注册后即可记录观察、收藏档案并编辑个人主页。</p>' : ''}
    <p class="error" role="alert" hidden></p>
    <div class="form-actions">
      <button class="button primary" type="submit">${register ? '注册' : '登录'}</button>
      <button type="button" class="text-button" data-action="auth-switch" data-value="${register ? 'login' : 'register'}">${register ? '已有账号？登录' : '没有账号？注册'}</button>
    </div>
  </form>`;
}

function showLogin(mode = 'login') {
  showDialog(mode === 'register' ? '注册账号' : '登录', accountDialog(mode), '登录后你的图鉴、收藏和记录会与账号关联。');
}

function togglePlusMenu() {
  const open = !plusMenu.hidden;
  plusMenu.hidden = open;
  plusButton.setAttribute('aria-expanded', String(!open));
}

function closePlusMenu() {
  plusMenu.hidden = true;
  plusButton.setAttribute('aria-expanded', 'false');
}

async function submitAuth(form) {
  const mode = form.dataset.mode;
  const submit = form.querySelector('button[type=submit]');
  const errorEl = form.querySelector('.error');
  submit.disabled = true;
  try {
    const data = await api('auth/' + mode, {
      username: form.elements.username.value.trim().toLowerCase(),
      password: form.elements.password.value,
    });
    state.signedIn = true;
    state.username = data.username;
    state.nickname = data.nickname || data.username;
    state.avatar = data.avatar || '';
    state.me = undefined;
    state.meError = '';
    if (form.isConnected) modal.close();
    await refresh();
    notify(mode === 'register' ? '注册成功，欢迎加入。' : '登录成功。');
  } catch (error) {
    errorEl.hidden = false;
    errorEl.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
}

async function logout() {
  try { await api('auth/logout', {}); } catch {}
  state.signedIn = false;
  state.username = '';
  state.nickname = '';
  state.avatar = '';
  state.me = undefined;
  state.bookmarks = [];
  state.events = null;
  await refresh();
  notify('已退出登录。');
}

function showNicknameDialog() {
  showDialog('修改昵称', `<form class="form" id="nickname-form">
    <label class="field"><span>昵称</span><input name="nickname" required maxlength="24" value="${esc(state.nickname || state.username)}" autocomplete="off" placeholder="1–24 个字符，允许与他人相同"></label>
    <p class="error" role="alert" hidden></p>
    <div class="form-actions"><button class="button primary" type="submit">保存昵称</button></div>
  </form>`, '昵称会显示在你的观察记录和发现动态中。');
}

async function submitNickname(form) {
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;
  try {
    const data = await api('auth/account', { nickname: form.elements.nickname.value.trim() });
    state.nickname = data.nickname;
    state.avatar = data.avatar;
    if (form.isConnected) modal.close();
    notify('昵称已保存。');
    render();
  } catch (error) {
    formError(form, error.message);
  } finally {
    submit.disabled = false;
  }
}

let accountAvatarDraft = '';
let accountAvatarVersion = 0;

function showAvatarDialog() {
  accountAvatarDraft = '';
  showDialog('更换头像', `<form class="form" id="account-form">
    <div class="avatar-field">
      <span class="person-avatar avatar-placeholder">${state.avatar ? `<img src="${esc(state.avatar)}" alt="当前头像">` : icon('person')}</span>
      <label class="field"><span>上传头像</span><input type="file" accept="image/*" id="account-avatar-file"></label>
    </div>
    <label class="checkline" id="account-avatar-confirm" hidden><input type="checkbox" name="avatarConsent">我确认新头像可以公开显示。</label>
    ${state.avatar ? '<label class="checkline"><input type="checkbox" name="removeAvatar">移除当前头像</label>' : ''}
    <p class="error" role="alert" hidden></p>
    <div class="form-actions"><button class="button primary" type="submit">保存头像</button></div>
  </form>`, '头像会显示在你的记录和发现动态中。');
}

async function setAccountAvatar(file, form) {
  const version = ++accountAvatarVersion;
  accountAvatarDraft = '';
  form.elements.avatarConsent.checked = false;
  form.elements.avatarConsent.required = false;
  form.querySelector('#account-avatar-confirm').hidden = true;
  if (!file) return;
  try {
    const photo = await preparePhoto(file, 400);
    if (version !== accountAvatarVersion || !form.isConnected) return;
    const avatar = form.querySelector('.person-avatar');
    avatar.innerHTML = `<img src="${esc(photo)}" alt="待保存的头像">`;
    accountAvatarDraft = photo;
    form.elements.avatarConsent.required = true;
    form.querySelector('#account-avatar-confirm').hidden = false;
    if (form.elements.removeAvatar) form.elements.removeAvatar.checked = false;
    formError(form, '');
  } catch {
    if (version === accountAvatarVersion && form.isConnected) formError(form, '无法读取头像，请尝试 JPEG、PNG 或 WebP 照片。');
  }
}

async function submitAvatar(form) {
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;
  try {
    const data = await api('auth/account', {
      avatar: accountAvatarDraft,
      avatarConsent: !!form.elements.avatarConsent.checked,
      removeAvatar: !!form.elements.removeAvatar?.checked,
    });
    state.nickname = data.nickname;
    state.avatar = data.avatar;
    if (form.isConnected) modal.close();
    notify(data.avatar ? '头像已更新。' : '头像已移除。');
    render();
  } catch (error) {
    formError(form, error.message);
  } finally {
    submit.disabled = false;
  }
}

function showAnimal(animal) {
  if (!animal) return;
  const visits = state.visits.filter(visit => visit.animal_id === animal.id);
  const normal = visits.filter(visit => !isEvent(visit));
  const tracks = trackPoints(normal);
  const saved = state.bookmarks.includes(animal.id);
  showDialog(animal.name, `
    ${picture(animal.photo, animal.name, 'profile-photo')}
    <div class="profile-facts">
      <p><strong>类别和物种</strong>　${esc(animal.category)} · ${esc(animal.species || '待确认')}</p>
      <p><strong>外观特征</strong>　${esc(animal.features || '待补充')}</p>
      <p><strong>性格</strong>　${esc(animal.personality || '待观察')}</p>
      <p><strong>喜好</strong>　${esc(animal.likes || '待观察')}</p>
    </div>
    <div class="profile-actions">${button(saved ? '取消收藏' : '加入我的图鉴','bookmark','bookmark','outline',animal.id)}
      ${button('记录这只动物','plus','record','primary',animal.id)}
      ${animal.editable ? button('编辑档案','book','edit','outline',animal.id) : ''}</div>
    ${normal.length ? `<div class="profile-map"><h3>活动足迹</h3><p class="hint">虚线按目击时间连接区域。</p>${mapView(normal, {profile:true})}</div>` : ''}
    ${catFundraiser(animal)}
    <h3>观察记录</h3><ul class="timeline">${visits.map(visit => `<li>
      <button class="text-button" data-action="visit" data-value="${esc(visit.id)}">${esc(findArea(visit.area)?.name)} · ${formatDate(visit.observed_at)}</button>
      ${formatMark(visitFormat(visit), true)} <span>${esc(isEvent(visit) ? visit.kind : visit.note || '日常观察')}${visit.demo ? '（示例）' : ''}</span>
    </li>`).join('')}</ul>`, animal.demo ? '示例档案' : '动物档案');
  const host = modal.querySelector('.map-host[data-map=profile]');
  if (host) {
    if (profileMap) { destroyMap(profileMap); profileMap = null; }
    profileMap = createMap(host);
    renderSightings(profileMap, normal, { profile: true, tracks, pinBuilder: pinElement });
  }
}

function showVisit(visit) {
  if (!visit) return;
  const animal = findAnimal(visit.animal_id);
  const title = isEvent(visit) ? visit.kind : (animal?.name || visit.species || visit.category);
  showDialog(title, `
    ${visitAttachment(visit, title)}
    <div class="profile-facts"><p>${formatMark(visitFormat(visit))}</p><p><strong>地点</strong>　${esc(findArea(visit.area)?.name)}</p>
      <p><strong>时间</strong>　${formatDate(visit.observed_at)}</p>
      <p><strong>观察类型</strong>　${esc(visit.kind)}</p>
      <p><strong>动物</strong>　${esc(visit.category)}${sightingSpecies(visit) ? ' · ' + esc(sightingSpecies(visit)) : ''}</p>
      <p><strong>观察备注</strong>　${esc(visit.note || '暂无备注')}</p></div>
    ${animal ? button('查看动物档案','book','animal','primary',animal.id) : ''}
  `, visit.demo ? '示例观察' : '校园观察');
}

function showEdit(animal) {
  if (!animal?.editable) return;
  showDialog('编辑动物档案', `<form class="form" id="edit-profile" data-id="${esc(animal.id)}">
    <label class="field"><span>名称</span><input name="name" value="${esc(animal.name)}" required maxlength="40"></label>
    <label class="field"><span>物种（选填）</span><input name="species" value="${esc(animal.species)}" maxlength="60" list="edit-species"><datalist id="edit-species">${options(speciesFor(animal.category).map(name => [name,name]))}</datalist></label>
    <label class="field"><span>外观特征</span><input name="features" value="${esc(animal.features)}" maxlength="180"></label>
    <label class="field"><span>性格</span><textarea name="personality" maxlength="140">${esc(animal.personality)}</textarea></label>
    <label class="field"><span>喜好</span><textarea name="likes" maxlength="140">${esc(animal.likes)}</textarea></label>
    <p class="error" role="alert" hidden></p><div class="form-actions"><button class="button primary">保存档案</button></div>
  </form>`);
}

function localDateInput() {
  const now = new Date();
  return new Date(now - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function showRecord(preselected, mode = 'observation') {
  const incident = mode === 'incident';
  const create = mode === 'animal';
  if (!state.signedIn) return showLogin();
  const selected = findAnimal(preselected);
  formState = { id: randomId(), photo:'', format:incident || create ? 'photo' : 'text', imageVersion:0, pending:false, autoChoice:false };
  showDialog(incident ? '记录特殊事件' : create ? '新增动物' : '记录校园观察', `<form class="form" id="record-form" data-mode="${mode}">
    ${incident ? `<div class="event-notice inline-notice"><h3>提交前请阅读</h3>${eventStatements}</div>
    <label class="checkline"><input name="eventConsent" type="checkbox" required>我已阅读说明，并按目击事实提交。</label>` : ''}
    ${create ? '<label class="field"><span>动物名称</span><input name="name" maxlength="40" placeholder="例如：橘子" required></label>' : ''}
    ${!incident && !create ? `<fieldset class="record-formats"><legend>记录方式</legend><div>
      ${Object.entries(formatInfo).map(([format,[label,symbol]]) => `<label>
        <input type="radio" name="format" value="${format}" ${format === 'text' ? 'checked' : ''}>
        <span>${icon(symbol)}${label}</span></label>`).join('')}</div></fieldset>` : ''}
    <div class="upload" id="photo-upload" ${incident || create ? '' : 'hidden'}>
      <span class="label">动物照片</span>
      <div class="upload-actions">
        ${button('从相册选择','plus','choose-photo')}
        ${button('拍照','camera','take-photo')}
      </div>
      <input id="choose-photo" type="file" accept="image/*" hidden>
      <input id="take-photo" type="file" accept="image/*" capture="environment" hidden>
      <img id="photo-preview" class="preview" alt="待提交的动物照片" hidden>
      <p id="photo-status" class="hint" role="status">照片会移除相机定位信息。请避开可辨认的人脸、车牌和敏感点位。</p>
      <label class="checkline" id="photo-consent-row" hidden><input name="photoConsent" type="checkbox">${incident ? '我确认这张照片可供有权限的人员查看。' : '我确认这张照片可公开展示。'}</label>
      ${!incident && !create && state.ai ? '<label class="checkline"><input name="aiConsent" type="checkbox">允许将处理后的照片发送给 AI 进行识别。</label>' : ''}
      <p class="hint" id="ai-status" role="status"></p>
    </div>
    ${!incident && !create ? `<div class="upload" id="av-upload" hidden>
      <div class="upload-actions">
        <button class="button outline" type="button" data-action="choose-media">${icon('plus')}<span id="choose-media-label">上传文件</span></button>
        <button class="button outline" type="button" data-action="start-media">${icon('mic')}<span id="start-media-label">开始录制</span></button>
        <button class="button primary" type="button" data-action="stop-media" hidden>停止录制</button>
      </div>
      <input type="file" id="media-file" hidden>
      <video id="live-video" class="av-preview" autoplay playsinline muted hidden aria-label="录像预览"></video>
      <video id="preview-video" class="av-preview" controls playsinline hidden aria-label="待提交视频"></video>
      <audio id="preview-audio" class="av-preview" controls hidden aria-label="待提交录音"></audio>
      <p class="hint" id="media-status" role="status"></p>
      <label class="checkline" id="media-consent-row" hidden><input name="mediaConsent" type="checkbox">我确认文件可公开展示，且不含可识别的个人影像、声音或定位信息。</label>
    </div>` : ''}
    ${create ? '' : `<div class="field-pair">
      ${incident ? `<label class="field"><span>事件类型</span><select name="kind">${options(kinds.slice(1).map(kind => [kind,kind === '车辆碰撞' ? '车辆碰撞（如猫被车撞）' : kind]))}</select></label>` : ''}
      <label class="field"><span>观察时间</span><input type="datetime-local" name="observedAt" value="${localDateInput()}" required></label>
    </div>
    <div class="field-pair">
      <label class="field"><span>校园区域</span><select name="region" required>${options([['','请选择区域'],...regions.map(region => [region.id,region.name])])}</select></label>
      <label class="field"><span>具体地点</span><select name="area" required>${options([['','请选择地点'],...(regionOf('upper')?.spots || []).map(spot => [spot.id,spot.name])])}</select></label>
    </div>
    <label class="field" id="custom-area" hidden><span>自行填写地点</span><input name="customArea" maxlength="20" placeholder="例如：上园健身房"></label>
    <div class="upload-actions">${button('使用当前位置','target','locate')}</div>
    <p id="location-status" class="hint" role="status">浏览器会请求定位授权，记录中仅保存你确认的区域。选择「其它地点」可自行填写。</p>
    `}
    <div class="field-pair">
      <label class="field"><span>动物类别</span><select name="category" ${create ? 'required' : ''}>${options([[create ? '' : '待确认',create ? '请选择类别' : '待确认'], ...categoryNames().filter(name => name !== '待确认').map(category => [category,category]),['__custom','新增类别…']])}</select></label>
      <label class="field"><span>物种（选填）</span><input name="species" maxlength="60" list="species-options" placeholder="选择或输入物种"><datalist id="species-options"></datalist></label>
    </div>
    <label class="field" id="custom-category" hidden><span>新类别名称</span><input name="customCategory" maxlength="30" placeholder="例如：松鼠"></label>
    ${incident ? '' : `<label class="field"><span>外观特征（选填）</span><input name="features" maxlength="180" placeholder="例如：白色下巴，橘色虎斑"></label>
    `}
    ${!incident && !create ? `<fieldset><legend>关联动物档案</legend>
      <div class="match-options">
        <label><input type="radio" name="matchMode" value="unknown" checked>暂不确定个体，只保存观察</label>
        <label><input type="radio" name="matchMode" value="existing">确认是已记录的动物</label>
        <label><input type="radio" name="matchMode" value="new">遇到新个体，提交时建立档案</label>
      </div>
      <p class="hint" id="suggested-matches" role="status"></p>
      <label class="field" id="existing-animal" hidden><span>选择档案</span><select name="animalId">${options([['','请选择档案'],...state.animals.map(animal => [animal.id, animal.name + ' · ' + animal.category + (animal.demo ? '（示例）' : '')])])}</select></label>
      <label class="field" id="new-animal" hidden><span>动物昵称（选填）</span><input name="name" maxlength="40" placeholder="例如：橘子"></label>
    </fieldset>
    ` : ''}
    ${create ? `<div class="field-pair">
      <label class="field"><span>性格（选填）</span><input name="personality" maxlength="140"></label>
      <label class="field"><span>喜好（选填）</span><input name="likes" maxlength="140"></label>
    </div>` : `<label class="field"><span id="observation-note-label">${incident ? '目击情况（选填）' : '观察文字'}</span><textarea name="note" maxlength="400" ${incident ? '' : 'required'} placeholder="${incident ? '请只填写你实际看到的情况' : '它在做什么？'}"></textarea></label>`}
    <p class="error" role="alert" hidden></p>
    <div class="form-actions"><button type="button" class="button outline" data-action="close">取消</button><button class="button primary" type="submit">${incident ? '提交事件' : create ? '建立档案' : '发布观察'}</button></div>
  </form>`, create ? '先建立档案，之后可为这只动物补充目击记录。' : '');

  const form = document.querySelector('#record-form');
  if (state.area && form.elements.area) {
    const spot = findArea(state.area);
    if (spot.region && spot.id && !spot.custom) {
      form.elements.region.value = spot.region;
      updateArea(form);
      form.elements.area.value = spot.id;
      updateAreaCustom(form);
    }
  }
  if (selected) {
    form.elements.matchMode.value = 'existing';
    form.elements.animalId.value = selected.id;
    form.elements.category.value = selected.category;
    form.elements.species.value = selected.species;
    form.elements.features.value = selected.features;
    updateMatch(form);
  }
  if (incident) form.elements.category.value = '鸟类';
  updateCategory(form);
}

function updateMatch(form) {
  const mode = form.elements.matchMode.value;
  form.querySelector('#existing-animal').hidden = mode !== 'existing';
  form.elements.animalId.required = mode === 'existing';
  form.querySelector('#new-animal').hidden = mode !== 'new';
}

function updateCategory(form) {
  const custom = form.elements.category.value === '__custom';
  form.querySelector('#custom-category').hidden = !custom;
  form.elements.customCategory.required = custom;
  form.querySelector('#species-options').innerHTML = options(speciesFor(custom ? form.elements.customCategory.value : form.elements.category.value).map(name => [name,name]));
}

function updateArea(form) {
  const region = regionOf(form.elements.region.value);
  form.elements.area.innerHTML = options([['','请选择地点'], ...(region?.spots || []).map(spot => [spot.id, spot.name])]);
  updateAreaCustom(form);
}

function updateAreaCustom(form) {
  const spot = form.elements.area.value ? areas.find(item => item.id === form.elements.area.value) : null;
  const custom = !!spot?.custom;
  form.querySelector('#custom-area').hidden = !custom;
  form.elements.customArea.required = custom;
}

async function preparePhoto(file, limit = 1200) {
  if (!file.type.startsWith('image/') || file.size > 20_000_000) throw new Error('请选择一张小于 20 MB 的图片。');
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, limit / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', .79);
  } finally {
    URL.revokeObjectURL(source);
  }
}

async function setPhoto(form, file) {
  if (!file) return;
  const session = formState;
  const version = ++session.imageVersion;
  const status = form.querySelector('#photo-status');
  const preview = form.querySelector('#photo-preview');
  const consent = form.querySelector('#photo-consent-row');
  status.textContent = '正在处理并移除照片元数据…';
  session.photo = '';
  session.pending = true;
  preview.hidden = true;
  consent.hidden = true;
  form.elements.photoConsent.checked = false;
  form.elements.photoConsent.required = false;
  form.querySelector('#ai-status').textContent = '';
  form.querySelector('#suggested-matches').textContent = '';
  try {
    const photo = await preparePhoto(file);
    if (session !== formState || version !== session.imageVersion) return;
    session.photo = photo;
    preview.src = photo;
    preview.hidden = false;
    consent.hidden = false;
    form.elements.photoConsent.checked = false;
    form.elements.photoConsent.required = true;
    status.textContent = form.dataset.mode === 'incident' ? '照片已处理，请确认可供有权限的人员查看。' : '照片已处理，请确认可公开展示。';
  } catch (error) {
    if (session !== formState || version !== session.imageVersion) return;
    status.textContent = error.message.startsWith('请') ? error.message : '无法读取这张照片，请尝试 JPEG、PNG 或 WebP。';
  } finally {
    if (session === formState && version === session.imageVersion) session.pending = false;
  }
  if (session === formState && version === session.imageVersion && form.elements.aiConsent?.checked) runIdentification(form);
}

async function runIdentification(form) {
  const session = formState;
  if (!session?.photo || !form.elements.aiConsent?.checked) return;
  const status = form.querySelector('#ai-status');
  session.identification?.abort();
  const controller = new AbortController();
  session.identification = controller;
  const version = session.imageVersion;
  const snapshot = [form.elements.category.value, form.elements.species.value, form.elements.features.value, form.elements.matchMode.value];
  status.textContent = '正在识别动物类别、物种和外观…';
  try {
    const response = await fetch('/api/identify', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({photo:session.photo}), signal:controller.signal,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    if (session !== formState || version !== session.imageVersion || session.identification !== controller) return;
    const fields = [form.elements.category, form.elements.species, form.elements.features];
    if (result.certainty !== 'none') {
      const values = [result.category, result.species, result.features];
      fields.forEach((field, index) => {
        if (field.value !== snapshot[index] || (index === 0 && field.value !== '待确认') || (index !== 0 && field.value)) return;
        let value = values[index];
        if (index === 0 && !Array.from(field.options).some(option => option.value === value)) {
          field.add(new Option(value, value), field.options[field.options.length - 1]);
        }
        field.value = value;
      });
    }
    const suggested = result.candidates.map(findAnimal).filter(Boolean);
    if (suggested.length) {
      form.querySelector('#suggested-matches').textContent = '可能的已记录动物：' + suggested.map(animal => animal.name).join('、') + '。请核对后选择档案。';
    } else if (result.certainty === 'high' && result.category !== '待确认' && snapshot[3] === 'unknown' && !session.autoChoice
      && form.elements.matchMode.value === 'unknown' && form.dataset.mode === 'observation') {
      form.elements.matchMode.value = 'new';
      updateMatch(form);
      form.querySelector('#suggested-matches').textContent = '没有找到相似档案，已预选建立新档案。你可以修改。';
    }
    status.textContent = result.certainty === 'high' ? '已填入 AI 建议，请确认后发布。' :
      result.certainty === 'low' ? 'AI 识别有疑问，请核对或手动填写。' : '照片里的动物不够清楚，请手动填写或换一张照片。';
  } catch (error) {
    if (error.name !== 'AbortError' && session === formState && version === session.imageVersion && session.identification === controller) status.textContent = error.message || '识别失败，请手动填写。';
  }
}

const haversine = (lat1, lon1, lat2, lon2) => {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function locate(form, trigger) {
  const status = form.querySelector('#location-status');
  if (!navigator.geolocation) {
    status.textContent = '浏览器没有提供定位，请手动选择区域。';
    return;
  }
  trigger.disabled = true;
  status.textContent = '正在获取当前位置…';
  navigator.geolocation.getCurrentPosition(({coords}) => {
    if (!form.isConnected) return;
    trigger.disabled = false;
    const ranked = areas.filter(spot => spot.lng != null).map(spot => ({
      spot,
      distance: haversine(coords.latitude, coords.longitude, spot.lat, spot.lng),
    })).sort((a, b) => a.distance - b.distance);
    const best = ranked[0];
    if (best && best.distance <= 420 && coords.accuracy <= 160) {
      const spot = best.spot;
      form.elements.region.value = spot.region;
      updateArea(form);
      form.elements.area.value = spot.id;
      updateAreaCustom(form);
      status.textContent = '已建议「' + spot.name + '」，请核对或手动修改。';
    } else {
      status.textContent = '已获取设备位置，无法可靠匹配校园区域。请手动选择。';
    }
  }, () => {
    if (!form.isConnected) return;
    trigger.disabled = false;
    status.textContent = '无法取得定位，请手动选择校园区域。';
  }, {enableHighAccuracy:true, timeout:8500, maximumAge:30000});
}

function setObservationFormat(form) {
  const session = formState;
  const format = form.elements.format.value;
  session.format = format;
  session.imageVersion++;
  session.pending = false;
  session.identification?.abort();
  session.photo = '';
  stopCapture(session, true);
  setAttachment(form,null);
  form.querySelector('#photo-upload').hidden = format !== 'photo';
  form.querySelector('#av-upload').hidden = format !== 'video' && format !== 'audio';
  const hasFile = form.querySelector('#media-file');
  hasFile.accept = format === 'video' ? 'video/*,.mov,.mp4,.webm' : 'audio/*,.m4a,.ogg,.wav,.mp3,.webm';
  hasFile.value = '';
  form.querySelector('#choose-media-label').textContent = format === 'video' ? '上传视频' : '上传录音';
  form.querySelector('#start-media-label').textContent = format === 'video' ? '开始录像' : '开始录音';
  form.querySelector('#media-status').textContent = '';
  form.querySelector('#photo-preview').hidden = true;
  form.querySelector('#photo-consent-row').hidden = true;
  form.elements.photoConsent.required = false;
  form.elements.photoConsent.checked = false;
  if (form.elements.aiConsent) form.elements.aiConsent.checked = false;
  form.querySelector('#ai-status').textContent = '';
  form.querySelector('#suggested-matches').textContent = '';
  form.elements.note.required = format === 'text';
  form.querySelector('#observation-note-label').textContent = format === 'text' ? '观察文字' : '活动情况（选填）';
}

function setAttachment(form,file) {
  const session = formState;
  const status = form.querySelector('#media-status');
  const consent = form.querySelector('#media-consent-row');
  if (session.mediaUrl) URL.revokeObjectURL(session.mediaUrl);
  session.mediaUrl = '';
  session.file = null;
  for (const player of form.querySelectorAll('.av-preview')) {
    player.hidden = true;
    player.removeAttribute('src');
  }
  consent.hidden = true;
  form.elements.mediaConsent.required = false;
  form.elements.mediaConsent.checked = false;
  if (!file) return;
  const types = {
    mp4:session.format === 'video' ? 'video/mp4' : 'audio/mp4',
    mov:'video/quicktime', webm:session.format + '/webm', m4a:'audio/mp4', wav:'audio/wav', ogg:'audio/ogg', mp3:'audio/mpeg',
  };
  const fallback = types[file.name?.split('.').at(-1)?.toLowerCase()];
  if ((!file.type || file.type === 'application/octet-stream') && fallback) {
    file = new File([file],file.name,{type:fallback});
  }
  if (!file.size || file.size > 25 * 1024 * 1024) {
    status.textContent = '请选择不超过 25 MB 的文件。';
    return;
  }
  if (!file.type.startsWith(session.format + '/')) {
    status.textContent = session.format === 'video' ? '请选择视频文件。' : '请选择音频文件。';
    return;
  }
  session.file = file;
  session.mediaUrl = URL.createObjectURL(file);
  const player = form.querySelector('#preview-' + session.format);
  player.src = session.mediaUrl;
  player.hidden = false;
  consent.hidden = false;
  form.elements.mediaConsent.required = true;
  status.textContent = file.name || '录制已完成。';
}

function stopCapture(session, discard = false) {
  session.captureVersion = (session.captureVersion || 0) + 1;
  const capture = session.capture;
  if (!capture) return;
  capture.discard ||= discard;
  clearTimeout(capture.timer);
  if (capture.recorder.state !== 'inactive') capture.recorder.stop();
  for (const track of capture.stream.getTracks()) track.stop();
}

async function startCapture(form, trigger) {
  const session = formState;
  const format = session.format;
  const status = form.querySelector('#media-status');
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    status.textContent = '当前浏览器无法在网页内录制，请使用设备录制后上传。';
    return;
  }
  const version = (session.captureVersion || 0) + 1;
  session.captureVersion = version;
  trigger.disabled = true;
  status.textContent = '等待设备权限…';
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio:true, video:format === 'video' ? { facingMode:{ ideal:'environment' }, width:{ideal:720}, height:{ideal:480} } : false,
    });
    if (session !== formState || version !== session.captureVersion) {
      trigger.disabled = false;
      for (const track of stream.getTracks()) track.stop();
      return;
    }
    const candidates = format === 'video' ? ['video/webm;codecs=vp8,opus','video/mp4','video/webm'] : ['audio/webm;codecs=opus','audio/mp4','audio/ogg'];
    const mimeType = candidates.find(type => MediaRecorder.isTypeSupported?.(type));
    const recorder = new MediaRecorder(stream,{...(mimeType ? {mimeType} : {}),videoBitsPerSecond:1_200_000,audioBitsPerSecond:96_000});
    const capture = {stream,recorder,discard:false};
    session.capture = capture;
    const chunks = [];
    const live = form.querySelector('#live-video');
    const stop = form.querySelector('[data-action=stop-media]');
    setAttachment(form,null);
    if (format === 'video') {
      live.srcObject = stream;
      live.hidden = false;
    }
    stop.hidden = false;
    recorder.addEventListener('dataavailable', event => { if (event.data.size) chunks.push(event.data); });
    recorder.addEventListener('stop', () => {
      clearTimeout(capture.timer);
      for (const track of stream.getTracks()) track.stop();
      if (session.capture !== capture) return;
      session.capture = null;
      live.srcObject = null;
      live.hidden = true;
      stop.hidden = true;
      trigger.disabled = false;
      if (!capture.discard && session === formState && form.isConnected) {
        const actual = (recorder.mimeType || chunks[0]?.type || '').split(';')[0];
        const ext = actual.split('/')[1] || (format === 'video' ? 'webm' : 'mp4');
        setAttachment(form,new File(chunks,format === 'video' ? '现场录像.' + ext : '现场录音.' + ext,{type:actual}));
      }
    },{once:true});
    recorder.addEventListener('error', () => {
      stopCapture(session,true);
      status.textContent = '录制未完成，可以重试或上传已有文件。';
    },{once:true});
    recorder.start();
    capture.timer = setTimeout(() => stopCapture(session), format === 'video' ? 45_000 : 90_000);
    status.textContent = format === 'video' ? '正在录像，最长 45 秒。' : '正在录音，最长 90 秒。';
  } catch (error) {
    if (stream) for (const track of stream.getTracks()) track.stop();
    trigger.disabled = false;
    if (session !== formState || version !== session.captureVersion) return;
    status.textContent = error.name === 'NotAllowedError' ? '设备权限未开启，请到设置中授权，或上传已有文件。' : '当前无法录制，请上传已有文件。';
  }
}

function formError(form, message) {
  const element = form.querySelector('.error');
  element.hidden = !message;
  element.textContent = message;
}

async function saveObservation(form) {
  const session = formState;
  if (!session) return;
  if (session.pending) return formError(form, '照片正在处理，请稍等。');
  if (session.capture) return formError(form, '请先停止录制。');
  const fields = Object.fromEntries(new FormData(form));
  const category = fields.category === '__custom' ? fields.customCategory.trim() : fields.category;
  if (fields.category === '__custom' && !category) return formError(form, '请填写新的类别名称。');
  if (fields.format === 'photo' && !session.photo) return formError(form,'请添加一张照片。');
  if (['video','audio'].includes(fields.format) && !session.file) return formError(form,'请先上传文件或完成录制。');
  const chosen = findArea(fields.area);
  const customName = chosen.custom ? (fields.customArea || '').trim() : '';
  if (chosen.custom && !customName) return formError(form, '请填写具体地点。');
  const area = chosen.custom ? 'custom:' + chosen.region + ':' + customName : fields.area;
  const match = fields.matchMode === 'existing' ? fields.animalId : fields.matchMode;
  if (match === 'new' && category === '待确认') return formError(form, '请先确认新动物的类别，或选择暂不确定个体。');
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;
  formError(form, '');
  try {
    const incident = form.dataset.mode === 'incident';
    const create = form.dataset.mode === 'animal';
    const record = {
      id:session.id, area, kind:incident ? fields.kind : kinds[0], category, species:fields.species, features:fields.features,
      match, name:fields.name, note:fields.note, photo:session.photo, photoConsent:!!fields.photoConsent,
      observedAt:fields.observedAt ? new Date(fields.observedAt).toISOString() : undefined,
      eventConsent:!!fields.eventConsent, personality:fields.personality, likes:fields.likes,
      mediaConsent:!!fields.mediaConsent, format:fields.format,
    };
    let body = record;
    if (session.file) {
      body = new FormData();
      body.set('record',JSON.stringify(record));
      body.set('file',session.file);
    }
    const {id, animalId} = await api(incident ? 'events' : create ? 'animals' : 'observations',body);
    if (modal.open && formState === session) modal.close();
    if (incident) {
      await loadEvents();
      notify('事件已提交，仅本人和获授权人员可查看。');
    } else if (create) {
      await refresh();
      if (!modal.open) showAnimal(findAnimal(id));
      notify('动物档案已建立。');
    } else {
      state.area = chosen.custom ? '' : fields.area;
      state.filter = '';
      state.species = '';
      state.allVisits = false;
      location.hash = 'home';
      await refresh();
      notify(animalId === id ? '观察已发布，并建立了动物档案。' : animalId ? '观察已发布，已更新动物档案。' : '观察已发布。');
    }
  } catch (error) {
    formError(form, error.message);
  } finally {
    submit.disabled = false;
  }
}

async function saveProfile(form) {
  const submit = form.querySelector('button');
  submit.disabled = true;
  try {
    await api('profile', {id:form.dataset.id, ...Object.fromEntries(new FormData(form))});
    await refresh();
    if (form.isConnected) showAnimal(findAnimal(form.dataset.id));
    notify('动物档案已更新。');
  } catch (error) {
    formError(form, error.message);
  } finally {
    submit.disabled = false;
  }
}

async function toggleBookmark(id, trigger) {
  if (!state.signedIn) return showLogin();
  const saved = !state.bookmarks.includes(id);
  trigger.disabled = true;
  try {
    await api('bookmark', {animalId:id, saved});
    state.bookmarks = saved ? [...state.bookmarks, id] : state.bookmarks.filter(item => item !== id);
    render();
    if (modal.open && trigger.isConnected) showAnimal(findAnimal(id));
    notify(saved ? '已加入我的图鉴。' : '已取消收藏。');
  } catch (error) {
    notify(error.message);
  } finally {
    trigger.disabled = false;
  }
}

// —— 地图交互：小窗悬浮（缩放与平移由 MapLibre 原生处理） ——

function toggleFloatingMap() {
  state.mapFloating = !state.mapFloating;
  if (state.mapFloating) state.mapPos = null;
  render();
  exploreMap?.resize?.();
  if (state.mapFloating) placeFloatingMap();
}

function placeFloatingMap() {
  const frame = main.querySelector('.map-frame.floating');
  if (!frame) return;
  const rect = frame.getBoundingClientRect();
  state.mapPos = {
    x: Math.max(12, Math.min(window.innerWidth - rect.width - 12, window.innerWidth - rect.width - 40)),
    y: Math.max(80, Math.min(window.innerHeight - rect.height - 12, window.innerHeight - rect.height - 40)),
  };
  frame.style.left = state.mapPos.x + 'px';
  frame.style.top = state.mapPos.y + 'px';
}

document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const { action, value } = trigger.dataset;
  if (action !== 'plus-menu') closePlusMenu();
  switch (action) {
    case 'record': showRecord(value); break;
    case 'permission': requestPermission(value, trigger); break;
    case 'load-me': loadMe().then(render); break;
    case 'login': showLogin(); break;
    case 'auth-switch': showLogin(value); break;
    case 'logout': logout(); break;
    case 'plus-menu': togglePlusMenu(); break;
    case 'edit-nickname': showNicknameDialog(); break;
    case 'change-avatar': showAvatarDialog(); break;
    case 'collection-expand': state.collectionExpanded = !state.collectionExpanded; render(); break;
    case 'achievements-expand': state.achievementsExpanded = !state.achievementsExpanded; render(); break;
    case 'close': modal.close(); break;
    case 'filter': state.filter = value; state.species = ''; state.area = ''; state.allVisits = false; render(); break;
    case 'new-animal': showRecord('', 'animal'); break;
    case 'profile-point': showVisit(state.visits.find(visit => visit.id === trigger.dataset.visit)); break;
    case 'event-record': showRecord('', 'incident'); break;
    case 'event-visit': showEvent(value); break;
    case 'event-apply': eventApplication(); break;
    case 'event-review-list': showEventReview(); break;
    case 'events-refresh': loadEvents(); break;
    case 'event-approve':
    case 'event-reject':
    case 'event-revoke': decideApplication(action.slice(6), value, trigger); break;
    case 'area': state.area = state.area === value ? '' : value; state.allVisits = false; render(); break;
    case 'more': state.allVisits = !state.allVisits; render(); break;
    case 'refresh': refresh(); break;
    case 'zoom-in': exploreMap?.zoomIn(); break;
    case 'zoom-out': exploreMap?.zoomOut(); break;
    case 'map-toggle': toggleFloatingMap(); break;
    case 'animal': showAnimal(findAnimal(value)); break;
    case 'visit': showVisit(state.visits.find(visit => visit.id === value)); break;
    case 'edit': showEdit(findAnimal(value)); break;
    case 'bookmark': toggleBookmark(value, trigger); break;
    case 'choose-media': document.querySelector('#media-file')?.click(); break;
    case 'start-media': startCapture(document.querySelector('#record-form'),trigger); break;
    case 'stop-media': stopCapture(formState); break;
    case 'choose-photo':
    case 'take-photo': document.getElementById(action)?.click(); break;
    case 'locate': locate(document.querySelector('#record-form'), trigger); break;
  }
  if (['filter','area','more'].includes(action) && document.activeElement === document.body) {
    [...main.querySelectorAll('[data-action]')].find(el => el.dataset.action === action && el.dataset.value === value)?.focus({preventScroll:true});
  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'animal-search') filterAnimals(event.target.value);
});
document.addEventListener('change', event => {
  const field = event.target;
  if (field.id === 'avatar-file') { setAvatar(field.files[0], field.form); return; }
  if (field.id === 'account-avatar-file') { setAccountAvatar(field.files[0], field.form); return; }
  if (field.id === 'map-species') {
    state.species = field.value;
    state.area = '';
    state.allVisits = false;
    render();
    document.querySelector('#map-species')?.focus({preventScroll:true});
    return;
  }
  const form = field.closest('#record-form');
  if (!form) return;
  if (field.id === 'media-file') { stopCapture(formState,true); setAttachment(form,field.files[0]); field.value = ''; return; }
  if (field.name === 'format') { setObservationFormat(form); return; }
  if (field.type === 'file') { setPhoto(form, field.files[0]); field.value = ''; }
  if (field.name === 'matchMode') { formState.autoChoice = true; updateMatch(form); }
  if (field.name === 'category' || field.name === 'customCategory') updateCategory(form);
  if (field.name === 'region') updateArea(form);
  if (field.name === 'area') updateAreaCustom(form);
  if (field.name === 'kind' && form.dataset.mode === 'incident') {
    if (field.value === '鸟撞' && form.elements.category.value === '待确认') form.elements.category.value = '鸟类';
    if (field.value !== '鸟撞' && form.elements.category.value === '鸟类') form.elements.category.value = '待确认';
    updateCategory(form);
  }
  if (field.name === 'aiConsent') {
    if (field.checked) runIdentification(form);
    else {
      formState.identification?.abort();
      form.querySelector('#ai-status').textContent = '';
    }
  }
});
// 拖动小窗标题栏移动悬浮地图。
document.addEventListener('pointerdown', event => {
  const handle = event.target.closest('.float-handle');
  if (!handle || event.target.closest('button')) return;
  const frame = handle.closest('.map-frame');
  const startX = event.clientX;
  const startY = event.clientY;
  const originX = state.mapPos?.x ?? frame.offsetLeft;
  const originY = state.mapPos?.y ?? frame.offsetTop;
  handle.classList.add('dragging');
  const move = moveEvent => {
    const rect = frame.getBoundingClientRect();
    state.mapPos = {
      x: Math.max(4, Math.min(originX + moveEvent.clientX - startX, window.innerWidth - rect.width - 4)),
      y: Math.max(4, Math.min(originY + moveEvent.clientY - startY, window.innerHeight - rect.height - 4)),
    };
    frame.style.left = state.mapPos.x + 'px';
    frame.style.top = state.mapPos.y + 'px';
  };
  const up = () => {
    handle.classList.remove('dragging');
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
  event.preventDefault();
});

// 窗口尺寸变化时把小窗收回可视范围，并让地图引擎重算尺寸。
window.addEventListener('resize', () => {
  exploreMap?.resize?.();
  if (!state.mapFloating || !state.mapPos) return;
  const frame = main.querySelector('.map-frame.floating');
  if (!frame) return;
  const rect = frame.getBoundingClientRect();
  state.mapPos = {
    x: Math.max(4, Math.min(state.mapPos.x, window.innerWidth - rect.width - 4)),
    y: Math.max(4, Math.min(state.mapPos.y, window.innerHeight - rect.height - 4)),
  };
  frame.style.left = state.mapPos.x + 'px';
  frame.style.top = state.mapPos.y + 'px';
});

document.addEventListener('submit', event => {
  if (!['record-form','edit-profile','event-application','person-settings','auth-form','nickname-form','account-form'].includes(event.target.id)) return;
  event.preventDefault();
  if (event.target.id === 'record-form') saveObservation(event.target);
  else if (event.target.id === 'person-settings') savePerson(event.target);
  else if (event.target.id === 'event-application') submitApplication(event.target);
  else if (event.target.id === 'auth-form') submitAuth(event.target);
  else if (event.target.id === 'nickname-form') submitNickname(event.target);
  else if (event.target.id === 'account-form') submitAvatar(event.target);
  else saveProfile(event.target);
});
modal.addEventListener('close', () => {
  if (profileMap) { destroyMap(profileMap); profileMap = null; }
  if (!formState) return;
  formState.identification?.abort();
  stopCapture(formState,true);
  if (formState.mediaUrl) URL.revokeObjectURL(formState.mediaUrl);
  formState = null;
});
window.addEventListener('hashchange', () => {
  closePlusMenu();
  avatarDraft = '';
  avatarPending = false;
  avatarPreview++;
  if (selectedTab() === 'events') { state.events = null; loadEvents(); }
  if (selectedTab() === 'settings') queryPermissionStates();
  if (selectedTab() === 'person') { loadPerson(); window.scrollTo(0,0); return; }
  render();
  window.scrollTo(0, 0);
});
render();
refresh();
if (selectedTab() === 'person') loadPerson();
