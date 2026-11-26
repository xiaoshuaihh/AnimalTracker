const grounds = [
  [[0,0],[345,0],[317,54],[305,104],[164,151],[88,144],[0,112]],
  [[414,0],[970,0],[970,114],[870,117],[813,83],[728,86],[687,102],[530,72]],
  [[0,347],[128,344],[213,328],[360,348],[397,460],[0,460]],
  [[635,315],[734,263],[845,303],[970,261],[970,460],[554,460]],
  [[0,160],[93,181],[104,243],[0,304]],
  [[337,190],[446,172],[519,221],[490,265],[401,279],[333,241]],
];

const roads = [
  'M-40 317C72 305 114 258 186 234S320 204 411 230 514 293 611 264 756 211 825 242 887 276 1000 208',
  'M160 -20C162 61 209 106 215 163S182 224 183 264 249 327 242 467',
  'M627 -26C606 61 541 96 542 158S592 239 574 304 490 381 486 480',
  'M854 -25C854 86 809 114 817 165S864 230 874 282 823 398 887 478',
  'M-30 109C82 138 173 157 251 141S433 67 544 94 646 159 763 145 921 105 995 128',
  'M-25 367C60 363 119 337 196 335S373 361 469 329 560 316 636 332 757 367 849 337 911 325 1000 336',
  'M294 147C288 186 258 199 246 224S253 291 307 311 388 304 420 288',
  'M679 149C662 183 660 228 688 239S724 259 736 301 729 347 677 374',
];

const buildings = [
  [72,207,53,17,-15],[94,231,34,17,-15],[119,183,35,18,7],[126,273,37,17,-17],[174,292,38,17,22],
  [211,285,57,20,22],[250,257,43,17,-10],[266,281,48,19,13],[305,285,23,12,12],[130,321,41,13,-12],
  [341,164,65,18,-14],[394,148,51,15,-6],[443,164,35,22,19],[452,188,46,15,14],[498,203,35,13,31],
  [520,267,53,22,-19],[501,295,48,17,-14],[565,213,61,25,15],[620,211,34,17,-12],[618,183,35,26,-5],
  [551,117,46,20,19],[595,132,26,20,14],[628,164,32,16,-9],[656,273,47,18,-30],[689,287,50,22,12],
  [687,313,65,16,10],[761,292,48,19,25],[794,320,33,19,-8],[832,306,40,17,-21],[804,276,36,15,18],
  [742,209,60,17,-13],[758,184,36,15,-7],[891,162,48,22,-16],[912,191,40,17,-17],[920,311,43,15,-3],
  [282,374,43,16,11],[317,395,46,17,15],[379,336,38,15,1],[406,362,43,18,-12],[438,394,49,18,-7],
];

export function paintMap(canvas, tracks = []) {
  const c = canvas.getContext('2d');
  const w = 970;
  const h = 460;
  canvas.width = w * 2;
  canvas.height = h * 2;
  c.scale(2, 2);
  c.fillStyle = '#e8eee1';
  c.fillRect(0, 0, w, h);
  grounds.forEach((points, index) => {
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.fillStyle = ['#dae7ce', '#dfead4', '#d9e7ca', '#d4e3ca', '#dae7cf', '#dce8d3'][index];
    c.fill();
  });
  c.strokeStyle = '#c6d8ba';
  c.lineWidth = 1;
  for (let i = 0; i < 13; i++) {
    const d = i * 9;
    c.stroke(new Path2D(`M ${532 + d * 2} -30 C ${501 + d * 2} 70 ${651 + d} ${77 - d * .3} ${741 + d} ${80 - d * .58} S ${940 - d * .35} ${56 - d * .3} 990 ${116 - d}`));
    c.stroke(new Path2D(`M ${580 + d * 1.5} 470 C ${584 + d} ${345 + d * .4} ${722 + d} ${354 + d * .67} ${789 + d} ${375 + d * .5} S ${908 + d * .6} ${389 + d * .2} 990 ${343 + d * .75}`));
    c.stroke(new Path2D(`M -20 ${71 + d * .7} C ${60 + d} ${62 + d * .8} ${116 + d * .8} ${113 - d * .14} ${169 + d} ${39 - d * .5}`));
  }
  let random = 209;
  function next() {
    random = (random * 16807) % 2147483647;
    return random / 2147483647;
  }
  for (let i = 0; i < 260; i++) {
    const x = next() * w;
    const y = next() * h;
    const radius = 2 + next() * 4;
    if (y > 110 && y < 355 && x > 66 && x < 885) continue;
    c.beginPath();
    c.arc(x, y, radius, 0, 2 * Math.PI);
    c.fillStyle = i % 2 ? '#c4d9b995' : '#acc8a477';
    c.fill();
  }
  const lake = new Path2D('M231 83C254 45 312 39 360 56s64 40 94 33 32-26 63-11 32 42 12 56-78 5-101-1-25 9-65 12-54-19-85-19-58-16-47-43Z');
  c.strokeStyle = '#cce2d3';
  c.lineWidth = 12;
  c.stroke(lake);
  c.fillStyle = '#aacecc';
  c.fill(lake);
  c.strokeStyle = '#b7d7d3';
  c.lineWidth = 1.5;
  c.stroke(new Path2D('M250 86c38-40 97-42 150-12s83 25 118 19 M258 111c31 15 55 7 75 12s58 16 87 1'));
  c.lineCap = 'round';
  roads.forEach((road, i) => {
    const path = new Path2D(road);
    c.strokeStyle = '#d3dbcc';
    c.lineWidth = i < 2 ? 13 : 9;
    c.stroke(path);
    c.strokeStyle = i === 0 ? '#fcf8e8' : '#fcfdf8';
    c.lineWidth -= 3;
    c.stroke(path);
  });
  buildings.forEach(([x, y, width, height, rotation], i) => {
    c.save();
    c.translate(x, y);
    c.rotate(rotation * Math.PI / 180);
    c.fillStyle = i % 3 ? '#cbd7ca' : '#becfbf';
    c.fillRect(-width / 2, -height / 2, width, height);
    c.strokeStyle = '#afc0af';
    c.lineWidth = .65;
    c.strokeRect(-width / 2, -height / 2, width, height);
    c.restore();
  });
  c.save();
  c.translate(721, 105);
  c.rotate(-.12);
  c.fillStyle = '#abc8a9';
  c.beginPath();
  c.roundRect(-58,-28,116,56,27);
  c.fill();
  c.strokeStyle = '#e8f2df';
  c.lineWidth = 2;
  c.stroke();
  c.strokeRect(-36,-17,72,34);
  c.restore();
  tracks.forEach((route, index) => {
    c.beginPath();
    route.forEach(({x,y}, i) => i ? c.lineTo(w * x / 100,h * y / 100) : c.moveTo(w * x / 100,h * y / 100));
    c.strokeStyle = ['#225a4a', '#946337', '#586c94'][index % 3];
    c.lineWidth = 4;
    c.setLineDash([7, 8]);
    c.stroke();
  });
}
