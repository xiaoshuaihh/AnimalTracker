// 校园足迹地图引擎：MapLibre GL JS + OpenFreeMap 矢量瓦片（无需 API Key）。
// 底图数据来自 OpenStreetMap，署名由 MapLibre 依据样式元数据自动显示。
import { regions, areas, legacyAreaIds } from './data.js';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const MAP_CENTER = [114.2095, 22.6905]; // [lng, lat] 校园大致中心
const MAP_ZOOM = 15.2;
const TRACK_COLORS = ['#225a4a', '#946337', '#586c94'];

// 与 app.js 一致的地点归一化：自定义地点不参与地图过滤。
const areaKey = id => typeof id !== 'string' || id.startsWith('custom:') ? null : (legacyAreaIds[id] || id);

// 解析地点所属区域：精确点位、旧版 id、或按前缀（upper/lower/middle/lake）推断。
const regionOfId = id => {
  if (typeof id !== 'string' || !id || id.startsWith('custom:')) return null;
  const target = legacyAreaIds[id] || id;
  const spot = areas.find(item => item.id === target);
  if (spot) return spot.region;
  const prefix = target.split('-')[0];
  return ['upper','lower','middle','lake','other'].includes(prefix) ? prefix : null;
};

// MapLibre v5 已移除 maplibregl.supported()，这里自行探测 WebGL 能力。
const webglSupported = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
};

export function createMap(container, existing = null) {
  if (existing && existing.getContainer() === container) return existing;
  if (existing) existing.remove();
  if (typeof maplibregl === 'undefined') {
    container.innerHTML = '<p class="empty">地图组件未能加载：请刷新页面或检查网络。</p>';
    return null;
  }
  if (!webglSupported()) {
    container.innerHTML = '<p class="empty">当前浏览器无法显示地图（不支持 WebGL），请换用较新的浏览器。</p>';
    return null;
  }
  let map;
  try {
    map = new maplibregl.Map({
      container,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      minZoom: 13.5,
      maxZoom: 19,
      attributionControl: { compact: true },
    });
  } catch {
    container.innerHTML = '<p class="empty">地图初始化失败：请换用支持 WebGL 的浏览器后重试。</p>';
    return null;
  }
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.on('error', () => {
    if (!map.loaded() && map.getContainer() === container) {
      map.remove();
      container.innerHTML = '<p class="empty">无法加载地图服务（OpenFreeMap），请检查网络后刷新重试。</p>';
    }
  });
  map.on('load', () => {
    if (!map.getSource('wildlife-tracks')) {
      map.addSource('wildlife-tracks', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'wildlife-track-lines',
        type: 'line',
        source: 'wildlife-tracks',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 3.5, 'line-opacity': .9, 'line-dasharray': [1, 1.6] },
      });
    }
    if (map._wildlifePendingTracks) {
      map.getSource('wildlife-tracks')?.setData(map._wildlifePendingTracks);
      map._wildlifePendingTracks = null;
    }
  });
  return map;
}

export function renderSightings(map, visits, { selectedArea = '', profile = false, tracks = [], pinBuilder } = {}) {
  if (!map) return;
  for (const marker of map._wildlifeMarkers || []) marker.remove();
  const markers = [];
  for (const region of regions) {
    if (!region.label) continue;
    const tag = document.createElement('span');
    tag.className = 'region-tag';
    tag.textContent = region.name;
    tag.style.setProperty('--c', region.color);
    markers.push(new maplibregl.Marker({ element: tag, interactive: false })
      .setLngLat([region.label.lng, region.label.lat]).addTo(map));
  }
  const mappedSpots = new Set();
  for (const spot of areas) {
    if (spot.lng == null) continue;
    const records = visits.filter(visit => areaKey(visit.area) === spot.id);
    if (!records.length) continue;
    mappedSpots.add(spot.id);
    const element = pinBuilder(spot, records, !profile && selectedArea === spot.id, profile);
    markers.push(new maplibregl.Marker({ element })
      .setLngLat([spot.lng, spot.lat]).addTo(map));
  }
  // 无法精确定位的记录（自定义地点、旧版或未收录的地点 id）归到所属区域的标签位置显示。
  const regionLoose = new Map();
  const collect = (regionId, visit, label) => {
    if (!regionLoose.has(regionId)) regionLoose.set(regionId, { visits: [], label });
    regionLoose.get(regionId).visits.push(visit);
  };
  for (const visit of visits) {
    const key = areaKey(visit.area);
    if (key !== null) {
      if (mappedSpots.has(key)) continue;
      const regionId = regionOfId(visit.area);
      if (regionId) collect(regionId, visit, '大致位置');
      continue;
    }
    if (visit.area?.startsWith('custom:')) {
      collect(visit.area.slice(7).split(':')[0] || 'other', visit, '自填地点');
    }
  }
  for (const [regionId, entry] of regionLoose) {
    const region = regions.find(item => item.id === regionId);
    if (!region?.label) continue;
    const spot = { id: 'region-loose-' + regionId, name: region.name + ' · ' + entry.label, lng: region.label.lng, lat: region.label.lat, region: regionId };
    const element = pinBuilder(spot, entry.visits, !profile && selectedArea === spot.id, profile);
    markers.push(new maplibregl.Marker({ element }).setLngLat([spot.lng, spot.lat]).addTo(map));
  }
  map._wildlifeMarkers = markers;
  const geojson = {
    type: 'FeatureCollection',
    features: tracks.map((route, index) => ({
      type: 'Feature',
      properties: { color: TRACK_COLORS[index % TRACK_COLORS.length] },
      geometry: { type: 'LineString', coordinates: route.map(point => [point.lng, point.lat]) },
    })),
  };
  const source = map.getSource('wildlife-tracks');
  if (source) source.setData(geojson);
  else map._wildlifePendingTracks = geojson;
}

export function destroyMap(map) {
  if (map) map.remove();
}
