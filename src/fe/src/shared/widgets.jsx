import { getColor } from '../shared/colors';


function ModeTab({ modes, mode, setMode }) {
  function switchMode(e) {
    setMode(e.currentTarget.getAttribute('data-mode'));
  }

  return (
    <div className="h-10 bg-slate-100 items-center justify-center inline-flex w-full">
      { Object.entries(modes).map(([key, value]) => (
        <button key={ key } className={`btn normal-case min-h-fit h-9 rounded m-0.5 ${ mode === key?('bg-slate-600 text-white font-bold'):('bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200')}`} onClick={ switchMode } data-mode={ key }>{ value }</button>
        ))}
    </div>
  )
}


function hash(input) {
  var hash_ = 0,
    i, chr;
  if (input.length === 0) return hash_;
  for (i = 0; i < input.length; i++) {
    chr = input.charCodeAt(i);
    hash_ = ((hash << 5) - hash_) + chr;
    hash_ |= 0; // Convert to 32bit integer
  }
  return hash_;
}


function AutoAvatar({ name, width, height, margin, textSize, styledTextSize }) {
  const gradientPairLight = [
    ['from-stone-50', 'to-stone-50'],
    ['from-red-50', 'to-red-50'],
    ['from-orange-50', 'to-orange-50'],
    ['from-amber-50', 'to-amber-50'],
    ['from-yellow-50', 'to-yellow-50'],
    ['from-lime-50', 'to-lime-50'],
    ['from-green-50', 'to-green-50'],
    ['from-emerald-50', 'to-emerald-50'],
    ['from-teal-50', 'to-teal-50'],
    ['from-cyan-50', 'to-cyan-50'],
    ['from-sky-50', 'to-sky-50'],
    ['from-blue-50', 'to-blue-50'],
    ['from-indigo-50', 'to-indigo-50'],
    ['from-violet-50', 'to-violet-50'],
    ['from-purple-50', 'to-purple-50'],
    ['from-fuchsia-50', 'to-fuchsia-50'],
    ['from-pink-50', 'to-pink-50'],
    ['from-rose-50', 'to-rose-50'],

    ['from-stone-100', 'to-stone-100'],
    ['from-red-100', 'to-red-100'],
    ['from-orange-100', 'to-orange-100'],
    ['from-amber-100', 'to-amber-100'],
    ['from-yellow-100', 'to-yellow-100'],
    ['from-lime-100', 'to-lime-100'],
    ['from-green-100', 'to-green-100'],
    ['from-emerald-100', 'to-emerald-100'],
    ['from-teal-100', 'to-teal-100'],
    ['from-cyan-100', 'to-cyan-100'],
    ['from-sky-100', 'to-sky-100'],
    ['from-blue-100', 'to-blue-100'],
    ['from-indigo-100', 'to-indigo-100'],
    ['from-violet-100', 'to-violet-100'],
    ['from-purple-100', 'to-purple-100'],
    ['from-fuchsia-100', 'to-fuchsia-100'],
    ['from-pink-100', 'to-pink-100'],
    ['from-rose-100', 'to-rose-100'],

    ['from-stone-200', 'to-stone-200'],
    ['from-red-200', 'to-red-200'],
    ['from-orange-200', 'to-orange-200'],
    ['from-amber-200', 'to-amber-200'],
    ['from-yellow-200', 'to-yellow-200'],
    ['from-lime-200', 'to-lime-200'],
    ['from-green-200', 'to-green-200'],
    ['from-emerald-200', 'to-emerald-200'],
    ['from-teal-200', 'to-teal-200'],
    ['from-cyan-200', 'to-cyan-200'],
    ['from-sky-200', 'to-sky-200'],
    ['from-blue-200', 'to-blue-200'],
    ['from-indigo-200', 'to-indigo-200'],
    ['from-violet-200', 'to-violet-200'],
    ['from-purple-200', 'to-purple-200'],
    ['from-fuchsia-200', 'to-fuchsia-200'],
    ['from-pink-200', 'to-pink-200'],
    ['from-rose-200', 'to-rose-200'],

    ['from-stone-300', 'to-stone-300'],
    ['from-red-300', 'to-red-300'],
    ['from-orange-300', 'to-orange-300'],
    ['from-amber-300', 'to-amber-300'],
    ['from-yellow-300', 'to-yellow-300'],
    ['from-lime-300', 'to-lime-300'],
    ['from-green-300', 'to-green-300'],
    ['from-emerald-300', 'to-emerald-300'],
    ['from-teal-300', 'to-teal-300'],
    ['from-cyan-300', 'to-cyan-300'],
    ['from-sky-300', 'to-sky-300'],
    ['from-blue-300', 'to-blue-300'],
    ['from-indigo-300', 'to-indigo-300'],
    ['from-violet-300', 'to-violet-300'],
    ['from-purple-300', 'to-purple-300'],
    ['from-fuchsia-300', 'to-fuchsia-300'],
    ['from-pink-300', 'to-pink-300'],
    ['from-rose-300', 'to-rose-300'],
  ];
  const gradientPairDark = [
    ['from-stone-400', 'to-stone-400'],
    ['from-red-400', 'to-red-400'],
    ['from-orange-400', 'to-orange-400'],
    ['from-amber-400', 'to-amber-400'],
    ['from-yellow-400', 'to-yellow-400'],
    ['from-lime-400', 'to-lime-400'],
    ['from-green-400', 'to-green-400'],
    ['from-emerald-400', 'to-emerald-400'],
    ['from-teal-400', 'to-teal-400'],
    ['from-cyan-400', 'to-cyan-400'],
    ['from-sky-400', 'to-sky-400'],
    ['from-blue-400', 'to-blue-400'],
    ['from-indigo-400', 'to-indigo-400'],
    ['from-violet-400', 'to-violet-400'],
    ['from-purple-400', 'to-purple-400'],
    ['from-fuchsia-400', 'to-fuchsia-400'],
    ['from-pink-400', 'to-pink-400'],
    ['from-rose-400', 'to-rose-400'],

    ['from-stone-500', 'to-stone-500'],
    ['from-red-500', 'to-red-500'],
    ['from-orange-500', 'to-orange-500'],
    ['from-amber-500', 'to-amber-500'],
    ['from-yellow-500', 'to-yellow-500'],
    ['from-lime-500', 'to-lime-500'],
    ['from-green-500', 'to-green-500'],
    ['from-emerald-500', 'to-emerald-500'],
    ['from-teal-500', 'to-teal-500'],
    ['from-cyan-500', 'to-cyan-500'],
    ['from-sky-500', 'to-sky-500'],
    ['from-blue-500', 'to-blue-500'],
    ['from-indigo-500', 'to-indigo-500'],
    ['from-violet-500', 'to-violet-500'],
    ['from-purple-500', 'to-purple-500'],
    ['from-fuchsia-500', 'to-fuchsia-500'],
    ['from-pink-500', 'to-pink-500'],
    ['from-rose-500', 'to-rose-500'],

    ['from-stone-600', 'to-stone-600'],
    ['from-red-600', 'to-red-600'],
    ['from-orange-600', 'to-orange-600'],
    ['from-amber-600', 'to-amber-600'],
    ['from-yellow-600', 'to-yellow-600'],
    ['from-lime-600', 'to-lime-600'],
    ['from-green-600', 'to-green-600'],
    ['from-emerald-600', 'to-emerald-600'],
    ['from-teal-600', 'to-teal-600'],
    ['from-cyan-600', 'to-cyan-600'],
    ['from-sky-600', 'to-sky-600'],
    ['from-blue-600', 'to-blue-600'],
    ['from-indigo-600', 'to-indigo-600'],
    ['from-violet-600', 'to-violet-600'],
    ['from-purple-600', 'to-purple-600'],
    ['from-fuchsia-600', 'to-fuchsia-600'],
    ['from-pink-600', 'to-pink-600'],
    ['from-rose-600', 'to-rose-600'],

    ['from-stone-700', 'to-stone-700'],
    ['from-red-700', 'to-red-700'],
    ['from-orange-700', 'to-orange-700'],
    ['from-amber-700', 'to-amber-700'],
    ['from-yellow-700', 'to-yellow-700'],
    ['from-lime-700', 'to-lime-700'],
    ['from-green-700', 'to-green-700'],
    ['from-emerald-700', 'to-emerald-700'],
    ['from-teal-700', 'to-teal-700'],
    ['from-cyan-700', 'to-cyan-700'],
    ['from-sky-700', 'to-sky-700'],
    ['from-blue-700', 'to-blue-700'],
    ['from-indigo-700', 'to-indigo-700'],
    ['from-violet-700', 'to-violet-700'],
    ['from-purple-700', 'to-purple-700'],
    ['from-fuchsia-700', 'to-fuchsia-700'],
    ['from-pink-700', 'to-pink-700'],
    ['from-rose-700', 'to-rose-700'],
  ];

  if (!name)
    name = '/';
  var nameHash = Math.abs(hash(name));
  var baseColors = ['', ''];
  var textColor = 'text-white';
  if (nameHash % 2 === 0) {
    baseColors[0] = gradientPairDark[nameHash % gradientPairDark.length][0];
    baseColors[1] = gradientPairDark[gradientPairDark.length - nameHash % gradientPairDark.length - 1][1];
  } else {
    baseColors[0] = gradientPairLight[nameHash % gradientPairLight.length][0];
    baseColors[1] = gradientPairLight[gradientPairLight.length - nameHash % gradientPairLight.length - 1][1];
    textColor = 'text-slate-500'
  }

  var shortChars = '';
  var charCount = 2;
  for (var i = 0; i < name.length; i++) {
    var char = name.charAt(i);
    if (/[0-9A-Z\/<>]/.test(char))
      shortChars += char;
    if (shortChars.length >= charCount)
      break
  }
  if (shortChars.length < charCount)
    shortChars = name.substr(0, charCount);
  var styledText1 = '', styledText2 = '';
  var nameSplit = name.split(' ');
  if (nameSplit.length >= 2) {
    styledText1 = nameSplit[nameSplit.length - 1];
    styledText2 = nameSplit[nameSplit.length - 2];
  }

  return (
    <div className={`m-${margin} rounded-lg bg-gradient-to-br relative ${textSize} text-center font-black overflow-hidden shrink-0 ${baseColors[0]} ${baseColors[1]} ${textColor}`} style={{ width: width + 'rem', height: height + 'rem', lineHeight: height + 'rem'}}>
      { shortChars }
      <span className={`absolute text-white opacity-20 left-1/3 -top-1/4 font-normal ${styledTextSize}`}>{styledText1}</span>
      <span className={`absolute text-white opacity-20 right-1/3 -bottom-1/4 font-normal ${styledTextSize}`}>{styledText2}</span>
    </div>
  )
}


function Tag({ label, color, onClick }) {
  return (
    <button className="rounded-full text-sm mr-2 text-white font-bold inline-block" style={{backgroundColor: color, paddingLeft: '0.55rem', paddingRight: '0.55rem', paddingTop: '0.05rem', paddingBottom: '0.05rem'}} onClick={ onClick }><i className="icon-tag mr-1"/>{label}</button>
  )
}


function renderTableStructure(table, index, tableBoxHL, highlightTableBox, resetHighlightTableBox, refHL) {
  var renderedHead = [];
  var renderedBody = [];
  for (var k = 0; k < table[0].length; k++) {
    var col = table[0][k];
    renderedHead.push(<th key={ index + '_0_' + k }>{col}</th>);
  }
  for (var j = 1; j < table.length; j++) {
    var row = table[j];
    var rendered_row = [];
    for (var k = 0; k < row.length; k++) {
      var col = row[k];
      rendered_row.push(<td key={ index + '_' + j + '_' + k } className="px-2 py-1">{col}</td>);
    }
    renderedBody.push(<tr className="odd:bg-white" key={ index + '_' + j }>{rendered_row}</tr>);
  }
  return (<table key={index} className="table-fixed mb-2 border" data-tablebox-index={index} style={{backgroundColor: getColor(index, index == tableBoxHL?0.25:0.0625), borderColor: getColor(index, index == tableBoxHL?0.65:0.1625) }} onMouseEnter={highlightTableBox} onMouseLeave={resetHighlightTableBox} ref={ index == tableBoxHL?refHL:null }><thead><tr style={{ backgroundColor: getColor(index, index == tableBoxHL?0.65:0.1625) }}>{renderedHead}</tr></thead><tbody>{renderedBody}</tbody></table>);
}


function renderTextStructure(content, index, textBoxHL, highlightTextBox, resetHighlightTextBox, refHL) {
  return (<p key={index} className="text-sm mb-2 py-1 px-2 border rounded italic" data-textbox-index={index} style={{ backgroundColor: getColor(index, index == textBoxHL?0.25:0.0625), borderColor: getColor(index, index == textBoxHL?0.65:0.1625) }} onMouseEnter={highlightTextBox} onMouseLeave={resetHighlightTextBox} ref={ index == textBoxHL?refHL:null }>{content}</p>)
}


export {
  ModeTab,
  AutoAvatar,
  Tag,
  renderTableStructure,
  renderTextStructure,
}
