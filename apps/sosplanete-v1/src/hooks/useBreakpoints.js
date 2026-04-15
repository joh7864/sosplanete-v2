import { useEffect, useState} from 'react';
import { BREAKPOINTS, getBreakPoint} from '../utils/Breakpoints';

const useBreakpoints = () => {

    const [xsBreakPoint] = BREAKPOINTS;
    const [ breakPoint, setBreakPoint] = useState(xsBreakPoint);

    useEffect(() => {

        const resizeHandler = () => {
            const ww = document.documentElement.clientWidth || window.innerWidth;
            const currentBreakpoint = getBreakPoint(ww);
            setBreakPoint(currentBreakpoint);
        };

        resizeHandler();
        window.addEventListener('resize', resizeHandler);

        return () => window.removeEventListener('resize', resizeHandler);

    }, []);

    return breakPoint;
}

export default useBreakpoints;