import { useRef } from 'react';


// from: https://stackoverflow.com/a/54159564/108574
const useFocus = () => {
  const htmlElRef = useRef(null)
  const setFocus = () => {htmlElRef.current && htmlElRef.current.focus()}

  return [ htmlElRef, setFocus ] 
}


function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}


function formatDate(date) {
  return (new Date(date)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric'});
}


export { 
  useFocus,
  formatBytes,
  formatDate
};
