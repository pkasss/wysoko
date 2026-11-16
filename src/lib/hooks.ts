import {useEffect, useState} from "react";

export function useNow() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        const updateTime = () => setCurrentTime(new Date());
        updateTime();

        const id = setInterval(updateTime, 1000);

        return () => clearInterval(id);
    }, []);

    return currentTime;
}