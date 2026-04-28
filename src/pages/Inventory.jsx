import React, { useState, useEffect } from 'react';
import { ref, onValue, set, push } from 'firebase/database';
import { database } from '../firebase/firebase';
import { FaPlus, FaMinus, FaEdit, FaTimes, FaPills } from 'react-icons/fa';

const Inventory = () => {
    const [inventory, setInventory] = useState({});
    const [loading, setLoading] = useState(true);

    // Multi-step update state
    const [addModal, setAddModal] = useState(null); // stores boxKey
    const [addQuantity, setAddQuantity] = useState(1);
    const [confirmModal, setConfirmModal] = useState(false);

    // Reduction flow state
    const [reduceModal, setReduceModal] = useState(null); // stores boxKey
    const [reduceQuantity, setReduceQuantity] = useState(1);
    const [reduceReason, setReduceReason] = useState('');
    const [reduceConfirmModal, setReduceConfirmModal] = useState(false);

    useEffect(() => {
        const inventoryRef = ref(database, 'inventory');
        const unsubscribe = onValue(inventoryRef, (snapshot) => {
            setInventory(snapshot.val() || {});
            setLoading(false);
        }, (error) => {
            console.error('Firebase error reading inventory:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const getColorClass = (count) => {
        if (count > 10) return 'green';
        if (count >= 5) return 'yellow';
        return 'red';
    };

    const getBoxCount = (boxKey) => {
        const raw = inventory[boxKey];
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'object' && raw !== null) return raw.count || 0;
        return 0;
    };

    const updateCount = async (boxKey, delta) => {
        const currentCount = getBoxCount(boxKey);
        const newCount = Math.max(0, currentCount + delta);
        const boxRef = ref(database, `inventory/${boxKey}`);
        await set(boxRef, newCount);
    };

    const handleAddClick = (boxKey) => {
        setAddModal(boxKey);
        setAddQuantity(10); // Default to 10 as per user example
    };

    const handleQuantitySubmit = (e) => {
        e.preventDefault();
        if (addQuantity <= 0) return;
        setConfirmModal(true);
    };

    const handleConfirmUpdate = async () => {
        await updateCount(addModal, addQuantity);

        // Log to history
        const logData = {
            type: 'inventory',
            action: 'Add',
            message: `Added ${addQuantity} tablets to ${addModal.replace('box', 'Box ')}`,
            detail: `Manual Refill`,
            timestamp: Date.now()
        };
        await push(ref(database, 'logs'), logData);

        // Update last event status
        await set(ref(database, 'events'), {
            lastEvent: 'Inventory Updated',
            message: logData.message,
            timestamp: Date.now()
        });

        closeAddFlow();
    };

    const closeAddFlow = () => {
        setAddModal(null);
        setConfirmModal(false);
        setAddQuantity(1);
    };

    // Reduction Handlers
    const handleRemoveClick = (boxKey) => {
        setReduceModal(boxKey);
        setReduceQuantity(1);
        setReduceReason('');
    };

    const handleReduceSubmit = (e) => {
        e.preventDefault();
        if (reduceQuantity <= 0 || !reduceReason.trim()) return;
        setReduceConfirmModal(true);
    };

    const handleConfirmReduce = async () => {
        const currentCount = getBoxCount(reduceModal);
        const newCount = Math.max(0, currentCount - reduceQuantity);

        // Update Inventory
        const boxRef = ref(database, `inventory/${reduceModal}`);
        await set(boxRef, newCount);

        // Log to history
        const logData = {
            type: 'inventory',
            action: 'Reduce',
            message: `Removed ${reduceQuantity} tablets from ${reduceModal.replace('box', 'Box ')}`,
            detail: `Reason: ${reduceReason}`,
            timestamp: Date.now()
        };
        await push(ref(database, 'logs'), logData);

        // Update last event status
        await set(ref(database, 'events'), {
            lastEvent: 'Inventory Reduced',
            message: logData.message,
            lastBox: parseInt(reduceModal.replace('box', '')),
            timestamp: Date.now(),
            detail: logData.detail
        });

        closeReduceFlow();
    };

    const closeReduceFlow = () => {
        setReduceModal(null);
        setReduceConfirmModal(false);
        setReduceQuantity(1);
        setReduceReason('');
    };

    const boxes = [1, 2, 3, 4].map((num) => {
        const key = `box${num}`;
        return {
            key,
            number: num,
            count: getBoxCount(key),
        };
    });

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading inventory...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Inventory</h1>
                <p>Manage tablet counts in each medicine box</p>
            </div>

            <div className="inventory-grid">
                {boxes.map((box) => {
                    const colorClass = getColorClass(box.count);
                    return (
                        <div key={box.key} className={`card inventory-card ${colorClass}`}>
                            <div className="inventory-card-header">
                                <h3>Box {box.number}</h3>
                            </div>

                            <div className="inventory-card-count">
                                <span>{box.count}</span>
                                <small>tablets remaining</small>
                            </div>

                            <div className="inventory-card-actions">
                                <button
                                    className="inventory-btn remove"
                                    onClick={() => handleRemoveClick(box.key)}
                                    disabled={box.count <= 0}
                                >
                                    <FaMinus />
                                </button>
                                <button
                                    className="inventory-btn add"
                                    onClick={() => handleAddClick(box.key)}
                                >
                                    <FaPlus />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Step 1: Add Quantity Modal */}
            {addModal && !confirmModal && (
                <div className="modal-overlay" onClick={closeAddFlow}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Tablets to {addModal.replace('box', 'Box ')}</h2>
                            <button className="modal-close" onClick={closeAddFlow}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleQuantitySubmit}>
                            <div className="form-group">
                                <label style={{ marginBottom: 12, display: 'block' }}>
                                    How many tablets are now added?
                                </label>
                                <input
                                    type="number"
                                    value={addQuantity}
                                    onChange={(e) => setAddQuantity(parseInt(e.target.value) || 0)}
                                    min="1"
                                    autoFocus
                                    style={{ width: '100%', fontSize: '1.2rem', padding: '12px' }}
                                />
                            </div>
                            <div className="form-actions" style={{ marginTop: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={closeAddFlow}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Next
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Step 2: Add Confirmation Modal */}
            {confirmModal && (
                <div className="modal-overlay" onClick={closeAddFlow}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Addition</h2>
                            <button className="modal-close" onClick={closeAddFlow}>
                                <FaTimes />
                            </button>
                        </div>
                        <div style={{ padding: '10px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: 16 }}>
                                <FaPills />
                            </div>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                                Are you sure you want to add <strong>{addQuantity}</strong> tablets to <strong>{addModal.replace('box', 'Box ')}</strong>?
                            </p>
                            <p style={{ color: 'var(--text-muted)' }}>
                                New total will be {getBoxCount(addModal) + addQuantity} tablets.
                            </p>
                        </div>
                        <div className="form-actions" style={{ marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setConfirmModal(false)}>
                                Back
                            </button>
                            <button className="btn btn-primary" onClick={handleConfirmUpdate}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reduction Step 1: Quantity + Reason Modal */}
            {reduceModal && !reduceConfirmModal && (
                <div className="modal-overlay" onClick={closeReduceFlow}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Remove Tablets from {reduceModal.replace('box', 'Box ')}</h2>
                            <button className="modal-close" onClick={closeReduceFlow}>
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleReduceSubmit}>
                            <div className="form-group">
                                <label style={{ marginBottom: 10, display: 'block' }}>How many tablets are removed?</label>
                                <input
                                    type="number"
                                    value={reduceQuantity}
                                    onChange={(e) => setReduceQuantity(parseInt(e.target.value) || 0)}
                                    min="1"
                                    max={getBoxCount(reduceModal)}
                                    style={{ width: '100%', fontSize: '1.1rem' }}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: 20 }}>
                                <label style={{ marginBottom: 10, display: 'block' }}>Reason for removal <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <textarea
                                    value={reduceReason}
                                    onChange={(e) => setReduceReason(e.target.value)}
                                    placeholder="e.g., Damaged, manual dispensing, etc."
                                    style={{ width: '100%', minHeight: '80px', padding: '10px' }}
                                    required
                                />
                                <small style={{ color: 'var(--text-muted)' }}>This reason will be recorded in the activity logs.</small>
                            </div>
                            <div className="form-actions" style={{ marginTop: 24 }}>
                                <button type="button" className="btn btn-secondary" onClick={closeReduceFlow}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={!reduceReason.trim()}>
                                    Next
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reduction Step 2: Confirmation Modal */}
            {reduceConfirmModal && (
                <div className="modal-overlay" onClick={closeReduceFlow}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Removal</h2>
                            <button className="modal-close" onClick={closeReduceFlow}>
                                <FaTimes />
                            </button>
                        </div>
                        <div style={{ padding: '10px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: 16 }}>
                                <FaMinus />
                            </div>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 12 }}>
                                Removing <strong>{reduceQuantity}</strong> tablets from <strong>{reduceModal.replace('box', 'Box ')}</strong>
                            </p>
                            <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: 'var(--radius)', marginBottom: 16, textAlign: 'left' }}>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>REASON:</small>
                                <p style={{ fontSize: '0.92rem', fontWeight: 500 }}>"{reduceReason}"</p>
                            </div>
                            <p style={{ color: 'var(--text-muted)' }}>
                                New total will be {getBoxCount(reduceModal) - reduceQuantity} tablets.
                            </p>
                        </div>
                        <div className="form-actions" style={{ marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setReduceConfirmModal(false)}>
                                Back
                            </button>
                            <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={handleConfirmReduce}>
                                Confirm Removal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;

