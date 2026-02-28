import React from 'react';
import { FaPhone, FaEdit, FaTrashAlt } from 'react-icons/fa';

const ContactCard = ({ contact, onEdit, onDelete }) => {
    const { name, role, phone } = contact;
    const initials = name
        ? name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '?';

    return (
        <div className="card card-elevated contact-card">
            <div className="contact-card-top">
                <div className="contact-avatar">{initials}</div>
                <div className="contact-info">
                    <h3>{name}</h3>
                    <div className="contact-role">{role}</div>
                </div>
            </div>

            <div className="contact-phone">
                <FaPhone style={{ fontSize: '0.8rem', transform: 'scaleX(-1)' }} />
                <span>{phone || 'No phone'}</span>
            </div>

            <div className="contact-actions">
                {phone && (
                    <a href={`tel:${phone.replace(/\s+/g, '')}`} className="contact-call-btn">
                        <FaPhone style={{ transform: 'scaleX(-1)' }} />
                        Call
                    </a>
                )}
                {onEdit && (
                    <button className="btn btn-icon btn-secondary" onClick={onEdit}>
                        <FaEdit />
                    </button>
                )}
                {onDelete && (
                    <button className="btn btn-icon btn-danger" onClick={onDelete}>
                        <FaTrashAlt />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ContactCard;
