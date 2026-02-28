import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { database } from '../firebase/firebase';
import { MdSchedule } from 'react-icons/md';
import { FaPlus, FaTrashAlt, FaClock, FaEdit, FaTimes, FaSun, FaCloudSun, FaMoon } from 'react-icons/fa';

const BOXES = [1, 2, 3, 4, 5, 6];

const PRESETS = [
    { label: 'Morning', icon: <FaSun />, time: '09:00', color: '#F59E0B' },
    { label: 'Afternoon', icon: <FaCloudSun />, time: '13:00', color: '#2563EB' },
    { label: 'Night', icon: <FaMoon />, time: '21:00', color: '#6366F1' },
];

// Convert "HH:MM" 24hr to 12hr format
const formatTo12Hr = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

const Schedule = () => {
    const [schedules, setSchedules] = useState({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editKey, setEditKey] = useState(null);

    // Form state
    const [hour, setHour] = useState(9);
    const [minute, setMinute] = useState(0);
    const [period, setPeriod] = useState('AM');
    const [selectedBoxes, setSelectedBoxes] = useState([]);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        const schedulesRef = ref(database, 'schedule_runtime');
        const unsubscribe = onValue(schedulesRef, (snapshot) => {
            setSchedules(snapshot.val() || {});
            setLoading(false);
        }, (error) => {
            console.error('Firebase error reading schedule_runtime:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setHour(9);
        setMinute(0);
        setPeriod('AM');
        setSelectedBoxes([]);
        setIsActive(true);
        setEditKey(null);
        setShowForm(false);
    };

    const applyPreset = (preset) => {
        const [h, m] = preset.time.split(':').map(Number);
        const p = h >= 12 ? 'PM' : 'AM';
        setHour(h > 12 ? h - 12 : h === 0 ? 12 : h);
        setMinute(m);
        setPeriod(p);
    };

    const openEditForm = (key) => {
        const schedule = schedules[key];
        if (!schedule) return;

        const [h24, m] = (schedule.time || '08:00').split(':').map(Number);
        const p = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;

        setHour(h12);
        setMinute(m);
        setPeriod(p);
        setSelectedBoxes(parseBoxes(schedule.boxes).map(Number));
        setIsActive(schedule.active !== false);
        setEditKey(key);
        setShowForm(true);
    };

    const toggleBox = (box) => {
        setSelectedBoxes((prev) =>
            prev.includes(box)
                ? prev.filter((b) => b !== box)
                : [...prev, box]
        );
    };

    const get24Hr = () => {
        let h24 = hour;
        if (period === 'AM' && h24 === 12) h24 = 0;
        if (period === 'PM' && h24 !== 12) h24 += 12;
        return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedBoxes.length === 0) return;

        const timeStr = get24Hr();
        const data = {
            time: timeStr,
            boxes: selectedBoxes.join(','),
            active: isActive,
        };

        if (editKey) {
            // Update existing
            const scheduleRef = ref(database, `schedule_runtime/${editKey}`);
            await set(scheduleRef, data);

            // Log update
            await push(ref(database, 'logs'), {
                type: 'schedule',
                action: 'Update',
                message: `Schedule updated for ${formatTo12Hr(timeStr)}`,
                detail: `Assigned Boxes: ${data.boxes}`,
                timestamp: Date.now()
            });
        } else {
            // Create new slot
            const existingKeys = Object.keys(schedules);
            let slotNum = 1;
            while (existingKeys.includes(`slot${slotNum}`)) slotNum++;
            const scheduleRef = ref(database, `schedule_runtime/slot${slotNum}`);
            await set(scheduleRef, data);

            // Log addition
            await push(ref(database, 'logs'), {
                type: 'schedule',
                action: 'Add',
                message: `New schedule added for ${formatTo12Hr(timeStr)}`,
                detail: `Assigned Boxes: ${data.boxes}`,
                timestamp: Date.now()
            });
        }
        resetForm();
    };

    const handleDelete = async (key) => {
        const schedule = schedules[key];
        const scheduleRef = ref(database, `schedule_runtime/${key}`);
        await remove(scheduleRef);

        // Log deletion
        if (schedule) {
            await push(ref(database, 'logs'), {
                type: 'schedule',
                action: 'Delete',
                message: `Schedule deleted for ${formatTo12Hr(schedule.time)}`,
                timestamp: Date.now()
            });
        }
    };

    const handleToggleActive = async (key, currentActive) => {
        const scheduleRef = ref(database, `schedule_runtime/${key}/active`);
        await set(scheduleRef, !currentActive);

        // Log toggle
        const schedule = schedules[key];
        if (schedule) {
            await push(ref(database, 'logs'), {
                type: 'schedule',
                action: !currentActive ? 'Activate' : 'Deactivate',
                message: `Schedule ${!currentActive ? 'activated' : 'deactivated'} for ${formatTo12Hr(schedule.time)}`,
                timestamp: Date.now()
            });
        }
    };

    const parseBoxes = (boxes) => {
        if (Array.isArray(boxes)) return boxes;
        if (typeof boxes === 'string') {
            return boxes.split(',').map((b) => b.trim()).filter(Boolean);
        }
        return [];
    };

    const scheduleEntries = Object.entries(schedules).sort(
        (a, b) => (a[1].time || '').localeCompare(b[1].time || '')
    );

    const scrollHour = (delta) => {
        setHour((prev) => {
            const next = prev + delta;
            if (next > 12) return 1;
            if (next < 1) return 12;
            return next;
        });
    };

    const scrollMinute = (delta) => {
        setMinute((prev) => {
            const next = prev + delta;
            if (next >= 60) return 0;
            if (next < 0) return 55;
            return next;
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading schedules...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Schedule</h1>
                <p>Manage medication dispensing schedules</p>
            </div>

            <div style={{ marginBottom: 20 }}>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (showForm) resetForm();
                        else { resetForm(); setShowForm(true); }
                    }}
                >
                    <FaPlus /> {showForm ? 'Cancel' : 'Add Schedule'}
                </button>
            </div>

            {/* ======= Add / Edit Form ======= */}
            {showForm && (
                <form className="card schedule-form" onSubmit={handleSubmit}>
                    <h3 className="schedule-form-title">
                        {editKey ? 'Edit Schedule' : 'New Schedule'}
                    </h3>

                    {/* Quick Presets */}
                    <div className="schedule-presets">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                className="schedule-preset-btn"
                                style={{ '--preset-color': preset.color }}
                                onClick={() => applyPreset(preset)}
                            >
                                <span className="preset-icon">{preset.icon}</span>
                                <span className="preset-label">{preset.label}</span>
                                <span className="preset-time">{formatTo12Hr(preset.time)}</span>
                            </button>
                        ))}
                    </div>

                    {/* Custom Time Picker */}
                    <label className="schedule-section-label">Set Time</label>
                    <div className="time-picker">
                        <div className="time-picker-col">
                            <button type="button" className="time-arrow" onClick={() => scrollHour(1)}>▲</button>
                            <div className="time-display">{String(hour).padStart(2, '0')}</div>
                            <button type="button" className="time-arrow" onClick={() => scrollHour(-1)}>▼</button>
                        </div>
                        <div className="time-picker-sep">:</div>
                        <div className="time-picker-col">
                            <button type="button" className="time-arrow" onClick={() => scrollMinute(5)}>▲</button>
                            <div className="time-display">{String(minute).padStart(2, '0')}</div>
                            <button type="button" className="time-arrow" onClick={() => scrollMinute(-5)}>▼</button>
                        </div>
                        <div className="time-picker-period">
                            <button
                                type="button"
                                className={`period-btn ${period === 'AM' ? 'active' : ''}`}
                                onClick={() => setPeriod('AM')}
                            >AM</button>
                            <button
                                type="button"
                                className={`period-btn ${period === 'PM' ? 'active' : ''}`}
                                onClick={() => setPeriod('PM')}
                            >PM</button>
                        </div>
                    </div>

                    {/* Box Selection */}
                    <label className="schedule-section-label">Assign Boxes</label>
                    <div className="box-checkboxes">
                        {BOXES.map((box) => (
                            <div
                                key={box}
                                className={`box-checkbox ${selectedBoxes.includes(box) ? 'selected' : ''}`}
                                onClick={() => toggleBox(box)}
                            >
                                Box {box}
                            </div>
                        ))}
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions" style={{ marginTop: 24 }}>
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={selectedBoxes.length === 0}>
                            {editKey ? 'Update Schedule' : 'Save Schedule'}
                        </button>
                    </div>
                </form>
            )}

            {/* ======= Schedule List ======= */}
            {scheduleEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <MdSchedule />
                    </div>
                    <h3>No Schedules Yet</h3>
                    <p>Add a schedule to get started with medication reminders.</p>
                </div>
            ) : (
                <div className="schedule-list">
                    {scheduleEntries.map(([key, schedule]) => {
                        const boxList = parseBoxes(schedule.boxes);
                        const isItemActive = schedule.active !== false;
                        return (
                            <div key={key} className={`card schedule-card ${!isItemActive ? 'inactive' : ''}`}>
                                <div className="schedule-card-left">
                                    <div className="schedule-time">
                                        <FaClock style={{ marginRight: 6, fontSize: '0.9rem' }} />
                                        {formatTo12Hr(schedule.time)}
                                    </div>
                                    <div className="schedule-boxes">
                                        {boxList.map((box) => (
                                            <span key={box} className="schedule-box-tag">
                                                Box {box}
                                            </span>
                                        ))}
                                    </div>
                                    <span
                                        className={`schedule-status-tag ${isItemActive ? 'active' : ''}`}
                                        onClick={() => handleToggleActive(key, isItemActive)}
                                    >
                                        {isItemActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="schedule-card-actions">
                                    <button
                                        className="schedule-action-btn edit"
                                        onClick={() => openEditForm(key)}
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="schedule-action-btn delete"
                                        onClick={() => handleDelete(key)}
                                        title="Delete"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Schedule;
