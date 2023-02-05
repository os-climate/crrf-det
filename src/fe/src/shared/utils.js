import { useRef } from 'react';


// from: https://stackoverflow.com/a/54159564/108574
const useFocus = () => {
    const htmlElRef = useRef(null)
    const setFocus = () => {htmlElRef.current && htmlElRef.current.focus()}

    return [ htmlElRef, setFocus ] 
}


export { useFocus };
