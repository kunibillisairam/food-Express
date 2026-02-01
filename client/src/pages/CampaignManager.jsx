import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import config from '../config';

export default function CampaignManager() {
    const [campaigns, setCampaigns] = useState([]);
    const [festivals, setFestivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);

    const [formData, setFormData] = useState({
        type: 'custom',
        title: '',
        emoji: '🎉',
        description: '',
        discountPercentage: 0,
        isActive: true,
        autoTrigger: false,
        foodCategories: [],
        startDate: '',
        endDate: '',
        festivalName: '',
        festivalDate: ''
    });

    useEffect(() => {
        fetchCampaigns();
        fetchFestivals();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/campaigns`);
            setCampaigns(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setLoading(false);
        }
    };

    const fetchFestivals = async () => {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/api/campaigns/festivals`);
            setFestivals(response.data);
        } catch (error) {
            console.error('Error fetching festivals:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCampaign) {
                await axios.put(`${config.API_BASE_URL}/api/campaigns/${editingCampaign._id}`, formData);
            } else {
                await axios.post(`${config.API_BASE_URL}/api/campaigns`, formData);
            }
            fetchCampaigns();
            resetForm();
        } catch (error) {
            console.error('Error saving campaign:', error);
            alert('Failed to save campaign: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this campaign?')) {
            try {
                await axios.delete(`${config.API_BASE_URL}/api/campaigns/${id}`);
                fetchCampaigns();
            } catch (error) {
                console.error('Error deleting campaign:', error);
                alert('Failed to delete campaign');
            }
        }
    };

    const handleSendNotification = async (id) => {
        if (confirm('Send notification to all users for this campaign?')) {
            try {
                await axios.post(`${config.API_BASE_URL}/api/campaigns/${id}/send`);
                alert('Notification sent successfully!');
                fetchCampaigns();
            } catch (error) {
                console.error('Error sending notification:', error);
                alert('Failed to send notification');
            }
        }
    };

    const handleEdit = (campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            type: campaign.type,
            title: campaign.title,
            emoji: campaign.emoji,
            description: campaign.description,
            discountPercentage: campaign.discountPercentage,
            isActive: campaign.isActive,
            autoTrigger: campaign.autoTrigger,
            foodCategories: campaign.foodCategories || [],
            startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
            endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',

            // New Fields
            scheduledTime: campaign.scheduledTime ? new Date(campaign.scheduledTime).toISOString().slice(0, 16) : '',
            startTime: campaign.startTime || '',
            endTime: campaign.endTime || '',

            festivalName: campaign.festivalName || '',
            festivalDate: campaign.festivalDate ? new Date(campaign.festivalDate).toISOString().split('T')[0] : ''
        });
        setShowCreateForm(true);
    };

    const resetForm = () => {
        setFormData({
            type: 'custom',
            title: '',
            emoji: '🎉',
            description: '',
            discountPercentage: 0,
            isActive: true,
            autoTrigger: false,
            foodCategories: [],
            startDate: '',
            endDate: '',
            scheduledTime: '',
            startTime: '',
            endTime: '',
            festivalName: '',
            festivalDate: ''
        });
        setEditingCampaign(null);
        setShowCreateForm(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFoodCategoriesChange = (e) => {
        const categories = e.target.value.split(',').map(c => c.trim()).filter(c => c);
        setFormData(prev => ({ ...prev, foodCategories: categories }));
    };

    return (
        <div className="campaign-manager">
            <div className="campaign-manager-header">
                <h1>🎯 Campaign Manager</h1>
                <button
                    className="btn-primary"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? '❌ Cancel' : '➕ Create Campaign'}
                </button>
            </div>

            {showCreateForm && (
                <motion.div
                    className="campaign-form-container"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h2>
                    <form onSubmit={handleSubmit} className="campaign-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Campaign Type*</label>
                                <select name="type" value={formData.type} onChange={handleInputChange} required>
                                    <option value="custom">Custom</option>
                                    <option value="happy_hour">Happy Hour (Daily)</option>
                                    <option value="friday">Friday (Weekend Deals)</option>
                                    <option value="monday">Monday (Healthy Food)</option>
                                    <option value="end_of_month">End of Month (Cashback)</option>
                                    <option value="festival">Festival</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Emoji*</label>
                                <input
                                    type="text"
                                    name="emoji"
                                    value={formData.emoji}
                                    onChange={handleInputChange}
                                    placeholder="🎉"
                                    maxLength={2}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Title*</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Weekend Special"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description*</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Get amazing discounts this weekend!"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Discount %</label>
                                <input
                                    type="number"
                                    name="discountPercentage"
                                    value={formData.discountPercentage}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="form-group">
                                <label>Food Categories (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.foodCategories.join(', ')}
                                    onChange={handleFoodCategoriesChange}
                                    placeholder="pizza, burgers, all"
                                />
                            </div>
                        </div>

                        {formData.type === 'custom' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        )}

                        {formData.type === 'festival' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Festival Name</label>
                                    <input
                                        type="text"
                                        name="festivalName"
                                        value={formData.festivalName}
                                        onChange={handleInputChange}
                                        placeholder="Diwali"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Festival Date</label>
                                    <input
                                        type="date"
                                        name="festivalDate"
                                        value={formData.festivalDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        )}

                        {formData.type === 'happy_hour' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Time (HH:MM)</label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={formData.startTime || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>End Time (HH:MM)</label>
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={formData.endTime || ''}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Scheduled Notification */}
                        <div className="form-group" style={{ marginTop: '1rem', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <label>📅 Schedule Notification (Optional)</label>
                            <small style={{ display: 'block', color: '#aaa', marginBottom: '5px' }}>
                                If set, notification will be sent automatically at this time.
                            </small>
                            <input
                                type="datetime-local"
                                name="scheduledTime"
                                value={formData.scheduledTime || ''}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-checkboxes">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <span>Active</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="autoTrigger"
                                    checked={formData.autoTrigger}
                                    onChange={handleInputChange}
                                />
                                <span>Auto-trigger notifications</span>
                            </label>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-submit">
                                {editingCampaign ? '💾 Update Campaign' : '✨ Create Campaign'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn-cancel">
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="campaigns-list">
                <h2>All Campaigns ({campaigns.length})</h2>
                {loading ? (
                    <p className="loading-text">Loading campaigns...</p>
                ) : campaigns.length === 0 ? (
                    <p className="empty-text">No campaigns created yet</p>
                ) : (
                    <div className="campaigns-grid">
                        {campaigns.map((campaign) => (
                            <motion.div
                                key={campaign._id}
                                className="campaign-card"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="campaign-card-header">
                                    <span className="campaign-card-emoji">{campaign.emoji}</span>
                                    <div className="campaign-card-badges">
                                        <span className={`badge badge-${campaign.type}`}>
                                            {campaign.type}
                                        </span>
                                        {campaign.isActive ? (
                                            <span className="badge badge-active">Active</span>
                                        ) : (
                                            <span className="badge badge-inactive">Inactive</span>
                                        )}
                                    </div>
                                </div>

                                <h3>{campaign.title}</h3>
                                <p className="campaign-card-description">{campaign.description}</p>

                                <div className="campaign-card-details">
                                    <div className="detail">
                                        <span className="detail-label">Discount:</span>
                                        <span className="detail-value">{campaign.discountPercentage}%</span>
                                    </div>
                                    {campaign.foodCategories && campaign.foodCategories.length > 0 && (
                                        <div className="detail">
                                            <span className="detail-label">Categories:</span>
                                            <span className="detail-value">{campaign.foodCategories.join(', ')}</span>
                                        </div>
                                    )}
                                    {campaign.lastTriggered && (
                                        <div className="detail">
                                            <span className="detail-label">Last triggered:</span>
                                            <span className="detail-value">
                                                {new Date(campaign.lastTriggered).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="campaign-card-actions">
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEdit(campaign)}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="btn-send"
                                        onClick={() => handleSendNotification(campaign._id)}
                                    >
                                        📢 Send
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(campaign._id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {festivals.length > 0 && (
                <div className="festivals-calendar">
                    <h2>📅 Festival Calendar 2026</h2>
                    <div className="festivals-grid">
                        {festivals.map((festival, index) => (
                            <div key={index} className="festival-card">
                                <span className="festival-emoji">{festival.emoji}</span>
                                <h4>{festival.name}</h4>
                                <p>{new Date(festival.date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
