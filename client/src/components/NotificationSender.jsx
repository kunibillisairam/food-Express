
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { toast } from 'react-hot-toast';

const NotificationSender = ({ userId = null }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [targetGroup, setTargetGroup] = useState(userId ? 'specific' : 'all');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title || !body) return toast.error("Please enter title and message.");

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/notifications/send`, {
                title,
                body,
                targetGroup,
                targetUserId: userId
            });

            if (res.data.success) {
                toast.success(`Sent to ${res.data.sentCount} devices!`);
                setTitle('');
                setBody('');
            } else {
                toast.error(res.data.message || "Failed to send.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to send notification.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSend}>
            {!userId && (
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Target Group</label>
                    <select
                        value={targetGroup}
                        onChange={(e) => setTargetGroup(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd' }}
                    >
                        <option value="all">Everyone (All Users)</option>
                        <option value="active">Active Users (Last 30 Days)</option>
                        <option value="inactive">Inactive Users</option>
                    </select>
                </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 🔥 Flash Sale!"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd' }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Message</label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="e.g. Get 50% off on all Burgers today!"
                    rows="4"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #ddd' }}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: loading ? '#ccc' : 'linear-gradient(45deg, #6c5ce7, #a55eea)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s'
                }}
            >
                {loading ? 'Sending...' : '🚀 Send Notification'}
            </button>
        </form>
    );
};

export default NotificationSender;
