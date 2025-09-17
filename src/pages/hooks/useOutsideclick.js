import {useEffect} from 'react'

const useOutsideclick = (ref,callback) => {
  useEffect(() => {
    const handleOutsideclick = (e) =>{
       if( ref.current && !ref.current.contains(e.target)){
        callback()
       }
    }
    document.addEventListener('mousedown',handleOutsideclick)
    return () => {
        document.removeEventListener('mousedown', handleOutsideclick)
    }
  }, [ref , callback])
  
}

export default useOutsideclick