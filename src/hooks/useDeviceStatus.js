import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/firebase';

/**
 * Custom hook to monitor device online/offline status.
 * Device is considered online if lastSeen is within the last 10 seconds.
 */
const useDeviceStatus = () => {
    const [lastSeen, setLastSeen] = useState(null);
    const [serverOffset, setServerOffset] = useState(0);
    const [isOnline, setIsOnline] = useState(false);

    // Sync with Firebase server time offset
    useEffect(() => {
        const offsetRef = ref(database, '.info/serverTimeOffset');
        const unsubscribe = onValue(offsetRef, (snapshot) => {
            setServerOffset(snapshot.val() || 0);
        });
        return () => unsubscribe();
    }, []);

    // Subscribe to lastSeen in Firebase
    useEffect(() => {
        const deviceRef = ref(database, 'device/lastSeen');
        const unsubscribe = onValue(deviceRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Ensure timestamp is in milliseconds and handle Number conversion
                const numData = Number(data);
                const ts = numData > 9999999999 ? numData : numData * 1000;
                setLastSeen(ts);
            } else {
                setLastSeen(null);
            }
        }, (error) => {
            console.error('Firebase error reading device/lastSeen:', error);
        });

        return () => unsubscribe();
    }, []);

    // Update status based on lastSeen and current server time
    useEffect(() => {
        const checkStatus = () => {
            if (lastSeen) {
                // Adjust local time with server offset
                const nowServer = Date.now() + serverOffset;
                const diff = nowServer - lastSeen;

                // Using 15 seconds threshold for better reliability with 5s device heartbeat.
                // This accounts for small delays and ensures a smoother "Online" status.
                setIsOnline(diff <= 15000);
            } else {
                setIsOnline(false);
            }
        };

        checkStatus(); // Immediate check
        const timer = setInterval(checkStatus, 1000);
        return () => clearInterval(timer);
    }, [lastSeen, serverOffset]);

    return { isOnline, lastSeen };
};

export default useDeviceStatus;
