
const COLORS_BASE = [
  '31, 119, 180',
  '255, 127, 14',
  '44, 160, 44',
  '214, 39, 40',
  '148, 103, 189',
  '140, 86, 75',
  '227, 119, 194',
  '127, 127, 127',
  '188, 189, 34',
  '23, 190, 207',
];


export function getColor(index, opacity) {
  var color = COLORS_BASE[index % COLORS_BASE.length];
  if (opacity == 1)
    return 'rgb(' + color + ')';
  return 'rgba(' + color + ', ' + opacity + ')';
};
