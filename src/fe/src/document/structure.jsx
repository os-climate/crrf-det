export default function DocumentStructure({ pageNum }) {
  return (
    <div className="ml-2">
      <div className="h-9 bg-slate-100 items-center justify-center inline-flex w-full rounded-t-md">
        <button className="btn normal-case min-h-fit h-8 bg-slate-100 border-slate-100 text-slate-500 hover:bg-white hover:border-slate-200 m-0.5">Text</button>
        <button className="btn normal-case min-h-fit h-8 bg-slate-600 text-white font-bold rounded m-0.5">Tables</button>
      </div>
      <div className="absolute bottom-0 top-9 left-2 right-0 border border-slate-100 overflow-auto px-2 py-1">
        <div>we are at page { pageNum }</div>
     </div>
    </div>
  )
}