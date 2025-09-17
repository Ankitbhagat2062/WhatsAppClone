import React from 'react'
import useThemeStore from '../../store/themeStore';
import { MdDarkMode , MdOutlineDarkMode } from "react-icons/md";
const Theme = ({ className }) => {
    const { theme, setTheme } = useThemeStore();
    useThemeStore.subscribe((state) => {
        console.log("Theme store changed:", state);
    });
    React.useEffect(() => {
        const unsub = useThemeStore.subscribe((state) => {
            console.log("Theme store changed:", state);
        });
        return () => unsub();
    }, []);

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    setTheme(theme === 'light' ? 'dark' : 'light')
                }}
                className={`${className} px-3 py-1 rounded absolute top-0 left-4`}
            >
                { <MdDarkMode className={`${theme === 'dark' ? ' bg-gray-200 text-black' : ' bg-gray-600 text-white'}`}/>}
            </button>

        </div>
    )
}

export default Theme
