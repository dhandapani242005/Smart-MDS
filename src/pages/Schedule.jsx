import React, { useState, useEffect } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { database } from '../firebase/firebase';
import { MdSchedule, MdExpandMore, MdExpandLess, MdTune, MdClose, MdAdd, MdEdit } from 'react-icons/md';
import {
    FaTrashAlt, FaClock, FaEdit, FaSun, FaCloudSun, FaMoon,
    FaCalendarAlt, FaTag, FaPills, FaRedo,
    FaTimesCircle, FaCheckCircle, FaSyringe,
} from 'react-icons/fa';

const BOXES = [1, 2, 3, 4, 5, 6];
const DAYS_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const REPEAT_OPTIONS = [
    { value: 'daily', label: 'Every Day' },
    { value: 'alternate', label: 'Alternate Days' },
    { value: 'weekdays', label: 'Weekdays Only' },
    { value: 'weekends', label: 'Weekends Only' },
    { value: 'weekly', label: 'Once a Week' },
    { value: 'custom', label: 'Custom Days' },
];

const COLOR_TAGS = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#06b6d4', label: 'Teal' },
    { value: '#f97316', label: 'Orange' },
    { value: '#ec4899', label: 'Pink' },
];

const PRESETS = [
    { label: 'Morning', icon: <FaSun />, time: '09:00', color: '#F59E0B' },
    { label: 'Afternoon', icon: <FaCloudSun />, time: '13:00', color: '#2563EB' },
    { label: 'Evening', icon: <FaCloudSun />, time: '18:00', color: '#f97316' },
    { label: 'Night', icon: <FaMoon />, time: '21:00', color: '#6366F1' },
];

const formatTo12Hr = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

const parseBoxes = (boxes) => {
    if (Array.isArray(boxes)) return boxes.map(String);
    if (typeof boxes === 'string') return boxes.split(',').map((b) => b.trim()).filter(Boolean);
    return [];
};

const EMPTY_FORM = {
    hour: 9,
    minute: 0,
    period: 'AM',
    selectedBoxes: [],
    isActive: true,
    // Optional fields
    label: '',
    note: '',
    doseCount: 1,
    repeatMode: 'daily',
    customDays: [],
    startDate: '',
    endDate: '',
    colorTag: '#3b82f6',
};

const Schedule = () => {
    const [schedules, setSchedules] = useState({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editKey, setEditKey] = useState(null);
    const [showOptional, setShowOptional] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });

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

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setEditKey(null);
        setShowForm(false);
        setShowOptional(false);
    };

    const applyPreset = (preset) => {
        const [h, m] = preset.time.split(':').map(Number);
        const p = h >= 12 ? 'PM' : 'AM';
        setForm((prev) => ({
            ...prev,
            hour: h > 12 ? h - 12 : h === 0 ? 12 : h,
            minute: m,
            period: p,
        }));
    };

    const openEditForm = (key) => {
        const s = schedules[key];
        if (!s) return;
        const [h24, m] = (s.time || '08:00').split(':').map(Number);
        const p = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        setForm({
            hour: h12,
            minute: m,
            period: p,
            selectedBoxes: parseBoxes(s.boxes).map(Number),
            isActive: s.active !== false,
            label: s.label || '',
            note: s.note || '',
            doseCount: s.doseCount || 1,
            repeatMode: s.repeatMode || 'daily',
            customDays: s.customDays || [],
            startDate: s.startDate || '',
            endDate: s.endDate || '',
            colorTag: s.colorTag || '#3b82f6',
        });
        setEditKey(key);
        setShowForm(true);
        // Auto-open optional panel if any optional data exists
        if (s.label || s.note || s.doseCount > 1 || s.repeatMode !== 'daily' ||
            s.startDate || s.endDate) {
            setShowOptional(true);
        }
    };

    const toggleBox = (box) => {
        setField('selectedBoxes', form.selectedBoxes.includes(box)
            ? form.selectedBoxes.filter((b) => b !== box)
            : [...form.selectedBoxes, box]);
    };

    const toggleCustomDay = (day) => {
        setField('customDays', form.customDays.includes(day)
            ? form.customDays.filter((d) => d !== day)
            : [...form.customDays, day]);
    };

    const get24Hr = () => {
        let h24 = form.hour;
        if (form.period === 'AM' && h24 === 12) h24 = 0;
        if (form.period === 'PM' && h24 !== 12) h24 += 12;
        return `${String(h24).padStart(2, '0')}:${String(form.minute).padStart(2, '0')}`;
    };

    const scrollHour = (delta) => {
        setField('hour', (() => {
            const next = form.hour + delta;
            if (next > 12) return 1;
            if (next < 1) return 12;
            return next;
        })());
    };

    const scrollMinute = (delta) => {
        setField('minute', (() => {
            const next = form.minute + delta;
            if (next >= 60) return 0;
            if (next < 0) return 55;
            return next;
        })());
    };

    const buildData = () => {
        const timeStr = get24Hr();
        const data = {
            time: timeStr,
            boxes: form.selectedBoxes.join(','),
            active: form.isActive,
        };
        // Only write optional fields if they carry a meaningful value
        if (form.label.trim()) data.label = form.label.trim();
        if (form.note.trim()) data.note = form.note.trim();
        if (form.doseCount > 1) data.doseCount = Number(form.doseCount);
        if (form.repeatMode !== 'daily') data.repeatMode = form.repeatMode;
        if (form.repeatMode === 'custom' && form.customDays.length > 0)
            data.customDays = form.customDays;
        if (form.startDate) data.startDate = form.startDate;
        if (form.endDate) data.endDate = form.endDate;
        if (form.colorTag !== '#3b82f6') data.colorTag = form.colorTag;
        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.selectedBoxes.length === 0) return;
        const data = buildData();

        if (editKey) {
            await set(ref(database, `schedule_runtime/${editKey}`), data);
            await push(ref(database, 'logs'), {
                type: 'schedule', action: 'Update',
                message: `Schedule updated for ${formatTo12Hr(data.time)}`,
                detail: `Boxes: ${data.boxes}${data.label ? ' · ' + data.label : ''}`,
                timestamp: Date.now(),
            });
        } else {
            const existingKeys = Object.keys(schedules);
            let slotNum = 1;
            while (existingKeys.includes(`slot${slotNum}`)) slotNum++;
            await set(ref(database, `schedule_runtime/slot${slotNum}`), data);
            await push(ref(database, 'logs'), {
                type: 'schedule', action: 'Add',
                message: `New schedule added for ${formatTo12Hr(data.time)}`,
                detail: `Boxes: ${data.boxes}${data.label ? ' · ' + data.label : ''}`,
                timestamp: Date.now(),
            });
        }
        resetForm();
    };

    const handleDelete = async (key) => {
        const s = schedules[key];
        await remove(ref(database, `schedule_runtime/${key}`));
        if (s) {
            await push(ref(database, 'logs'), {
                type: 'schedule', action: 'Delete',
                message: `Schedule deleted for ${formatTo12Hr(s.time)}`,
                timestamp: Date.now(),
            });
        }
    };

    const handleToggleActive = async (key, currentActive) => {
        const s = schedules[key];
        await set(ref(database, `schedule_runtime/${key}/active`), !currentActive);
        if (s) {
            await push(ref(database, 'logs'), {
                type: 'schedule',
                action: !currentActive ? 'Activate' : 'Deactivate',
                message: `Schedule ${!currentActive ? 'activated' : 'deactivated'} for ${formatTo12Hr(s.time)}`,
                timestamp: Date.now(),
            });
        }
    };

    const scheduleEntries = Object.entries(schedules).sort(
        (a, b) => (a[1].time || '').localeCompare(b[1].time || '')
    );

    const getRepeatLabel = (s) => {
        if (!s.repeatMode || s.repeatMode === 'daily') return 'Every Day';
        const found = REPEAT_OPTIONS.find((o) => o.value === s.repeatMode);
        if (found) return found.label;
        return s.repeatMode;
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
                <p>Manage medication dispensing schedules with flexible timing options</p>
            </div>

            <div style={{ marginBottom: 20 }}>
                {!showForm ? (
                    <button
                        className="btn btn-primary"
                        onClick={() => { resetForm(); setShowForm(true); }}
                    >
                        <MdAdd /> Add Schedule
                    </button>
                ) : (
                    <button
                        className="btn btn-secondary"
                        onClick={resetForm}
                    >
                        <MdClose /> Cancel
                    </button>
                )}
            </div>

            {/* ======================================================
                ADD / EDIT FORM
            ====================================================== */}
            {showForm && (
                <form className="card schedule-form" onSubmit={handleSubmit}>
                    <h3 className="schedule-form-title">
                        {editKey
                            ? <><MdEdit style={{ marginRight: 8 }} />Edit Schedule</>
                            : <><MdAdd style={{ marginRight: 8 }} />New Schedule</>
                        }
                    </h3>

                    {/* Quick Presets */}
                    <label className="schedule-section-label">Quick Presets</label>
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

                    {/* ── Time Picker ── */}
                    <label className="schedule-section-label">Set Time</label>
                    <div className="time-picker">
                        <div className="time-picker-col">
                            <button type="button" className="time-arrow" onClick={() => scrollHour(1)}>▲</button>
                            <div className="time-display">{String(form.hour).padStart(2, '0')}</div>
                            <button type="button" className="time-arrow" onClick={() => scrollHour(-1)}>▼</button>
                        </div>
                        <div className="time-picker-sep">:</div>
                        <div className="time-picker-col">
                            <button type="button" className="time-arrow" onClick={() => scrollMinute(5)}>▲</button>
                            <div className="time-display">{String(form.minute).padStart(2, '0')}</div>
                            <button type="button" className="time-arrow" onClick={() => scrollMinute(-5)}>▼</button>
                        </div>
                        <div className="time-picker-period">
                            <button type="button" className={`period-btn ${form.period === 'AM' ? 'active' : ''}`} onClick={() => setField('period', 'AM')}>AM</button>
                            <button type="button" className={`period-btn ${form.period === 'PM' ? 'active' : ''}`} onClick={() => setField('period', 'PM')}>PM</button>
                        </div>
                    </div>

                    {/* ── Box Selection ── */}
                    <label className="schedule-section-label">Assign Boxes <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span></label>
                    <div className="box-checkboxes">
                        {BOXES.map((box) => (
                            <div
                                key={box}
                                className={`box-checkbox ${form.selectedBoxes.includes(box) ? 'selected' : ''}`}
                                onClick={() => toggleBox(box)}
                            >
                                Box {box}
                            </div>
                        ))}
                    </div>
                    {form.selectedBoxes.length === 0 && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: 6, fontWeight: 600 }}>
                            Please select at least one box.
                        </p>
                    )}

                    {/* ── Active Toggle ── */}
                    <div className="sched-toggle-row">
                        <span className="schedule-section-label" style={{ margin: 0 }}>Schedule Active</span>
                        <button
                            type="button"
                            className={`sched-toggle-btn ${form.isActive ? 'on' : 'off'}`}
                            onClick={() => setField('isActive', !form.isActive)}
                        >
                            {form.isActive ? <><FaCheckCircle /> Active</> : <><FaStopCircle /> Inactive</>}
                        </button>
                    </div>

                    {/* ══════════ OPTIONAL FIELDS PANEL ══════════ */}
                    <button
                        type="button"
                        className="optional-toggle-btn"
                        onClick={() => setShowOptional((v) => !v)}
                    >
                        <MdTune />
                        <span>Advanced / Optional Settings</span>
                        {showOptional ? <MdExpandLess /> : <MdExpandMore />}
                    </button>

                    {showOptional && (
                        <div className="optional-fields-panel">

                            {/* Label */}
                            <div className="opt-field-group">
                                <label className="opt-field-label">
                                    <FaTag /> Schedule Label
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <input
                                    type="text"
                                    className="opt-input"
                                    placeholder="e.g. Heart Medication, Blood Pressure Pill"
                                    value={form.label}
                                    onChange={(e) => setField('label', e.target.value)}
                                    maxLength={60}
                                />
                            </div>

                            {/* Note */}
                            <div className="opt-field-group">
                                <label className="opt-field-label">
                                    <FaSyringe /> Doctor's Note / Instructions
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <textarea
                                    className="opt-input opt-textarea"
                                    placeholder="e.g. Take after meals, with a full glass of water"
                                    value={form.note}
                                    onChange={(e) => setField('note', e.target.value)}
                                    rows={2}
                                    maxLength={200}
                                />
                            </div>

                            {/* Dose Count */}
                            <div className="opt-field-group">
                                <label className="opt-field-label">
                                    <FaPills /> Dose Count (tablets per dispense)
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <div className="dose-counter">
                                    <button type="button" className="dose-btn"
                                        onClick={() => setField('doseCount', Math.max(1, form.doseCount - 1))}>−</button>
                                    <span className="dose-value">{form.doseCount}</span>
                                    <button type="button" className="dose-btn"
                                        onClick={() => setField('doseCount', Math.min(20, form.doseCount + 1))}>+</button>
                                    <span className="dose-unit">tablet{form.doseCount !== 1 ? 's' : ''}</span>
                                </div>
                            </div>

                            {/* Repeat Mode */}
                            <div className="opt-field-group">
                                <label className="opt-field-label">
                                    <FaRedo /> Repeat Schedule
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <div className="repeat-chips">
                                    {REPEAT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`repeat-chip ${form.repeatMode === opt.value ? 'selected' : ''}`}
                                            onClick={() => setField('repeatMode', opt.value)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Days — show only when repeatMode = 'custom' */}
                                {form.repeatMode === 'custom' && (
                                    <div style={{ marginTop: 12 }}>
                                        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            Select Days:
                                        </p>
                                        <div className="days-checkboxes">
                                            {DAYS_FULL.map((day) => (
                                                <div
                                                    key={day}
                                                    className={`day-checkbox ${form.customDays.includes(day) ? 'selected' : ''}`}
                                                    onClick={() => toggleCustomDay(day)}
                                                >
                                                    {day.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>


                            {/* Date Range */}
                            <div className="opt-field-group">
                                <label className="opt-field-label">
                                    <FaCalendarAlt /> Active Date Range
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <div className="date-range-row">
                                    <div className="date-field">
                                        <span className="date-field-label">Start Date</span>
                                        <input
                                            type="date"
                                            className="opt-input"
                                            value={form.startDate}
                                            onChange={(e) => setField('startDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="date-range-arrow">→</div>
                                    <div className="date-field">
                                        <span className="date-field-label">End Date</span>
                                        <input
                                            type="date"
                                            className="opt-input"
                                            value={form.endDate}
                                            onChange={(e) => setField('endDate', e.target.value)}
                                            min={form.startDate || undefined}
                                        />
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                    Leave blank to run this schedule indefinitely.
                                </p>
                            </div>

                            {/* Color Tag */}
                            <div className="opt-field-group">
                                <label className="opt-field-label">
                                    <FaTag /> Color Tag
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <div className="color-tag-row">
                                    {COLOR_TAGS.map((c) => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            className={`color-swatch ${form.colorTag === c.value ? 'selected' : ''}`}
                                            style={{ background: c.value }}
                                            title={c.label}
                                            onClick={() => setField('colorTag', c.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="form-actions" style={{ marginTop: 28 }}>
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={form.selectedBoxes.length === 0}
                        >
                            {editKey ? 'Update Schedule' : 'Save Schedule'}
                        </button>
                    </div>
                </form>
            )}

            {/* ======================================================
                SCHEDULE LIST
            ====================================================== */}
            {scheduleEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><MdSchedule /></div>
                    <h3>No Schedules Yet</h3>
                    <p>Add a schedule to get started with medication reminders.</p>
                </div>
            ) : (
                <div className="schedule-list">
                    {scheduleEntries.map(([key, schedule]) => {
                        const boxList = parseBoxes(schedule.boxes);
                        const isItemActive = schedule.active !== false;
                        const accentColor = schedule.colorTag || '#3b82f6';

                        return (
                            <div
                                key={key}
                                className={`card schedule-card ${!isItemActive ? 'inactive' : ''}`}
                                style={{ borderLeft: `4px solid ${accentColor}` }}
                            >
                                <div className="schedule-card-left">
                                    {/* Time */}
                                    <div className="schedule-time" style={{ color: accentColor }}>
                                        <FaClock style={{ marginRight: 6, fontSize: '0.9rem' }} />
                                        {formatTo12Hr(schedule.time)}
                                    </div>

                                    {/* Label */}
                                    {schedule.label && (
                                        <div className="sched-label-pill" style={{ background: accentColor + '18', color: accentColor }}>
                                            <FaTag style={{ fontSize: '0.7rem' }} />
                                            {schedule.label}
                                        </div>
                                    )}

                                    {/* Boxes */}
                                    <div className="schedule-boxes">
                                        {boxList.map((box) => (
                                            <span key={box} className="schedule-box-tag" style={{ background: accentColor + '15', color: accentColor }}>
                                                Box {box}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Repeat mode */}
                                    {schedule.repeatMode && schedule.repeatMode !== 'daily' && (
                                        <span className="sched-meta-chip">
                                            <FaRedo style={{ fontSize: '0.65rem' }} />
                                            {getRepeatLabel(schedule)}
                                        </span>
                                    )}

                                    {/* Dose count */}
                                    {schedule.doseCount && schedule.doseCount > 1 && (
                                        <span className="sched-meta-chip">
                                            <FaPills style={{ fontSize: '0.65rem' }} />
                                            {schedule.doseCount} tablets
                                        </span>
                                    )}


                                    {/* Date range */}
                                    {(schedule.startDate || schedule.endDate) && (
                                        <span className="sched-meta-chip">
                                            <FaCalendarAlt style={{ fontSize: '0.65rem' }} />
                                            {schedule.startDate || '?'} → {schedule.endDate || '∞'}
                                        </span>
                                    )}

                                    {/* Active toggle */}
                                    <span
                                        className={`schedule-status-tag ${isItemActive ? 'active' : ''}`}
                                        onClick={() => handleToggleActive(key, isItemActive)}
                                    >
                                        {isItemActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {/* Note (below left block) */}
                                {schedule.note && (
                                    <div className="sched-note">{schedule.note}</div>
                                )}

                                <div className="schedule-card-actions">
                                    <button className="schedule-action-btn edit" onClick={() => openEditForm(key)} title="Edit">
                                        <FaEdit />
                                    </button>
                                    <button className="schedule-action-btn delete" onClick={() => handleDelete(key)} title="Delete">
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
