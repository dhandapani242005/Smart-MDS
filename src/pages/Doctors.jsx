import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database } from '../firebase/firebase';
import ContactCard from '../components/ContactCard';
import { FaPlus, FaTimes, FaUserMd } from 'react-icons/fa';

const COUNTRY_CODES = [
    { code: '+91', name: 'India', iso: 'in' },
    { code: '+1', name: 'USA', iso: 'us' },
    { code: '+44', name: 'UK', iso: 'gb' },
    { code: '+1', name: 'Canada', iso: 'ca' },
    { code: '+61', name: 'Australia', iso: 'au' },
    { code: '+65', name: 'Singapore', iso: 'sg' },
    { code: '+971', name: 'UAE', iso: 'ae' },
    { code: '+49', name: 'Germany', iso: 'de' },
    { code: '+33', name: 'France', iso: 'fr' },
    { code: '+81', name: 'Japan', iso: 'jp' },
    { code: '+82', name: 'South Korea', iso: 'kr' },
    { code: '+86', name: 'China', iso: 'cn' },
    { code: '+7', name: 'Russia', iso: 'ru' },
    { code: '+55', name: 'Brazil', iso: 'br' },
    { code: '+52', name: 'Mexico', iso: 'mx' },
    { code: '+39', name: 'Italy', iso: 'it' },
    { code: '+34', name: 'Spain', iso: 'es' },
    { code: '+31', name: 'Netherlands', iso: 'nl' },
    { code: '+41', name: 'Switzerland', iso: 'ch' },
    { code: '+46', name: 'Sweden', iso: 'se' },
    { code: '+47', name: 'Norway', iso: 'no' },
    { code: '+45', name: 'Denmark', iso: 'dk' },
    { code: '+30', name: 'Greece', iso: 'gr' },
    { code: '+351', name: 'Portugal', iso: 'pt' },
    { code: '+353', name: 'Ireland', iso: 'ie' },
    { code: '+43', name: 'Austria', iso: 'at' },
    { code: '+32', name: 'Belgium', iso: 'be' },
    { code: '+48', name: 'Poland', iso: 'pl' },
    { code: '+90', name: 'Turkey', iso: 'tr' },
    { code: '+966', name: 'Saudi Arabia', iso: 'sa' },
    { code: '+972', name: 'Israel', iso: 'il' },
    { code: '+92', name: 'Pakistan', iso: 'pk' },
    { code: '+880', name: 'Bangladesh', iso: 'bd' },
    { code: '+94', name: 'Sri Lanka', iso: 'lk' },
    { code: '+66', name: 'Thailand', iso: 'th' },
    { code: '+84', name: 'Vietnam', iso: 'vn' },
    { code: '+62', name: 'Indonesia', iso: 'id' },
    { code: '+60', name: 'Malaysia', iso: 'my' },
    { code: '+63', name: 'Philippines', iso: 'ph' },
    { code: '+20', name: 'Egypt', iso: 'eg' },
    { code: '+27', name: 'South Africa', iso: 'za' },
    { code: '+234', name: 'Nigeria', iso: 'ng' },
    { code: '+254', name: 'Kenya', iso: 'ke' },
    { code: '+251', name: 'Ethiopia', iso: 'et' },
    { code: '+212', name: 'Morocco', iso: 'ma' },
    { code: '+213', name: 'Algeria', iso: 'dz' },
    { code: '+54', name: 'Argentina', iso: 'ar' },
    { code: '+57', name: 'Colombia', iso: 'co' },
    { code: '+56', name: 'Chile', iso: 'cl' },
    { code: '+64', name: 'New Zealand', iso: 'nz' },
    { code: '+852', name: 'Hong Kong', iso: 'hk' },
    { code: '+93', name: 'Afghanistan', iso: 'af' },
    { code: '+965', name: 'Kuwait', iso: 'kw' },
    { code: '+974', name: 'Qatar', iso: 'qa' },
];

const Doctors = () => {
    const [contacts, setContacts] = useState({});
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editKey, setEditKey] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        role: 'Doctor',
        countryCode: '+91',
        phone: '',
    });

    const [error, setError] = useState('');

    useEffect(() => {
        const contactsRef = ref(database, 'contacts');
        const unsubscribe = onValue(contactsRef, (snapshot) => {
            setContacts(snapshot.val() || {});
            setLoading(false);
        }, (error) => {
            console.error('Firebase error reading contacts:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', role: 'Doctor', countryCode: '+91', phone: '' });
        setEditKey(null);
        setShowForm(false);
        setError('');
    };

    const openEditForm = (key) => {
        const contact = contacts[key];
        if (contact) {
            // Attempt to parse country code from existing number
            const fullPhone = contact.phone || '';
            let matchedCode = '+91';
            let innerPhone = fullPhone;

            const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
            for (const c of sortedCodes) {
                if (fullPhone.startsWith(c.code)) {
                    matchedCode = c.code;
                    innerPhone = fullPhone.replace(c.code, '').trim();
                    break;
                }
            }

            setFormData({
                name: contact.name || '',
                role: contact.role || 'Doctor',
                countryCode: matchedCode,
                phone: innerPhone,
            });
            setEditKey(key);
            setShowForm(true);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            setError('Phone number must be exactly 10 digits');
            return;
        }

        const submitData = {
            name: formData.name,
            role: formData.role,
            phone: `${formData.countryCode} ${cleanPhone}`
        };

        if (editKey) {
            const contactRef = ref(database, `contacts/${editKey}`);
            await update(contactRef, submitData);
        } else {
            const contactsRef = ref(database, 'contacts');
            await push(contactsRef, { ...submitData, createdAt: Date.now() });
        }
        resetForm();
    };

    const handleDelete = async (key) => {
        const contactRef = ref(database, `contacts/${key}`);
        await remove(contactRef);
    };

    const contactEntries = Object.entries(contacts);
    const sortedCountries = [...COUNTRY_CODES].sort((a, b) => a.name.localeCompare(b.name));
    const selectedCountry = COUNTRY_CODES.find(c => c.code === formData.countryCode) || COUNTRY_CODES[0];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading contacts...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Doctors & Caretakers</h1>
                <p>Manage your healthcare contacts</p>
            </div>

            <div style={{ marginBottom: 20 }}>
                <button className="btn btn-primary" onClick={() => {
                    if (showForm) resetForm();
                    else setShowForm(true);
                }}>
                    <FaPlus /> {showForm ? 'Cancel' : 'Add Contact'}
                </button>
            </div>

            {/* Add / Edit Form - Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={resetForm}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editKey ? 'Edit Contact' : 'Add Contact'}</h2>
                            <button className="modal-close" onClick={resetForm}>
                                <FaTimes />
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                background: '#FEE2E2',
                                color: '#EF4444',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                fontSize: '0.9rem',
                                border: '1px solid #FECACA'
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="Dr. John Smith"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, role: e.target.value }))
                                    }
                                    style={{ width: '100%' }}
                                >
                                    <option value="Doctor">Doctor</option>
                                    <option value="Caretaker">Caretaker</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'var(--bg-secondary)',
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        height: '42px'
                                    }}>
                                        <img
                                            src={`/flags/${selectedCountry.iso}.png`}
                                            alt={selectedCountry.name}
                                            style={{ width: '24px', borderRadius: '2px' }}
                                        />
                                        <select
                                            value={formData.countryCode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                width: 'max-content',
                                                padding: 0,
                                                fontSize: '0.95rem'
                                            }}
                                        >
                                            {sortedCountries.map(c => (
                                                <option key={`${c.code}-${c.name}`} value={c.code}>
                                                    {c.code} ({c.name})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) {
                                                setFormData((prev) => ({ ...prev, phone: val }));
                                            }
                                        }}
                                        placeholder="9876543210"
                                        maxLength="10"
                                        required
                                        style={{ flexGrow: 1, height: '42px' }}
                                    />
                                </div>
                                <small style={{ color: 'var(--text-muted)' }}>Enter 10-digit mobile number.</small>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editKey ? 'Update Contact' : 'Save Contact'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Cards */}
            {contactEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FaUserMd />
                    </div>
                    <h3>No Contacts Yet</h3>
                    <p>Add a doctor or caretaker to get started.</p>
                </div>
            ) : (
                <div className="contacts-grid">
                    {contactEntries.map(([key, contact]) => (
                        <ContactCard
                            key={key}
                            contact={contact}
                            onEdit={() => openEditForm(key)}
                            onDelete={() => handleDelete(key)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Doctors;
