import { ModeTab } from '../shared/widgets';
import { AutoAvatar, Tag } from '../shared/widgets';
import { scn } from '../shared/styles';
import { getColor } from '../shared/colors';


export default function ProjectPreview({ detail }) {
  if (!detail)
    return (null)

  return (
    <div className="top-11 left-1/2 right-1 bottom-1 absolute overflow-auto">
      <div className="flex items-center justify-start">
        <AutoAvatar name={ detail.name } width={2} height={2} margin={2} textSize="text-lg" styledTextSize="text-lg" />
        <span className="text-lg text-slate-700 ml-3 mr-3">{detail.name} ({detail.segments_collected} segments in {Object.keys(detail.files).length} files)</span>
        <button className={scn.primaryButton}>Edit and Review</button>
      </div>
      <table className="table table-compact w-full">
        <thead>
          <tr>
            <th>(Path) Files</th>
            <th>Segments</th>
          </tr>
        </thead>
        <tbody>
        { Object.keys(detail.files).map((file, idx) => (
          <tr key={idx}>
            <td>{file}</td>
            <td>{detail.files[file]}</td>
          </tr>
        ))}
        </tbody>
      </table>
      <table className="table table-compact w-full">
        <thead>
          <tr>
            <th>Filters</th>
            <th>Labels</th>
          </tr>
        </thead>
        <tbody>
        { Object.keys(detail.filters).map((filter, idx) => (
          <tr key={idx}>
            <td>{filter}</td>
            <td className="whitespace-normal">
              { detail.filters[filter].map((label, idx) => (
                <Tag key={'label_' + idx} label={label} color={getColor(idx, 1)} />
              ))}
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  )
}