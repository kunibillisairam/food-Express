import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../config';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaCopy, FaPercentage, FaRupeeSign } from 'react-icons/fa';
import './CouponManager.css';

export default function CouponManager() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscountAmount: null,
        usageLimit: null,
        perUserLimit: 1,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        isActive: true,
        description: '',
        applicableCategories: []
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/coupons`);
            // Handle both [coupons] and { data: [coupons] } formats
            const couponsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
            setCoupons(Array.isArray(couponsData) ? couponsData : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Failed to load coupons');
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initialize Socket for Real-time Updates
        const socket = io(API_BASE_URL);

        socket.on('connect', () => {
            console.log('[CouponManager] Socket Connected:', socket.id);
        });

        socket.on('coupons-updated', () => {
            console.log('[CouponManager] Update received, refreshing...');
            fetchCoupons();
            // Optional: Toast is handled by the action initiator usually, 
            // but for multi-admin sync, a toast is nice.
            // toast('Coupon list updated', { icon: '🔄' });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.code || !formData.validUntil) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const submitData = {
                ...formData,
                maxDiscountAmount: formData.maxDiscountAmount || null,
                usageLimit: formData.usageLimit || null
            };

            if (editingCoupon) {
                await axios.put(`${API_BASE_URL}/api/coupons/${editingCoupon._id}`, submitData);
                toast.success('Coupon updated successfully!');
            } else {
                await axios.post(`${API_BASE_URL}/api/coupons`, submitData);
                toast.success('Coupon created successfully!');
            }

            fetchCoupons();
            resetForm();
        } catch (error) {
            console.error('Error saving coupon:', error);
            toast.error(error.response?.data?.error || 'Failed to save coupon');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;

        try {
            await axios.delete(`${API_BASE_URL}/api/coupons/${id}`);
            toast.success('Coupon deleted successfully!');
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to delete coupon';
            toast.error(errorMsg);
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscountAmount: coupon.maxDiscountAmount || '',
            usageLimit: coupon.usageLimit || '',
            perUserLimit: coupon.perUserLimit,
            validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
            validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
            isActive: coupon.isActive,
            description: coupon.description,
            applicableCategories: coupon.applicableCategories || []
        });
        setShowCreateForm(true);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: 0,
            minOrderAmount: 0,
            maxDiscountAmount: null,
            usageLimit: null,
            perUserLimit: 1,
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: '',
            isActive: true,
            description: '',
            applicableCategories: []
        });
        setEditingCoupon(null);
        setShowCreateForm(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleCouponStatus = async (coupon) => {
        try {
            await axios.put(`${API_BASE_URL}/api/coupons/${coupon._id}`, {
                ...coupon,
                isActive: !coupon.isActive
            });
            toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`);
            fetchCoupons();
        } catch (error) {
            console.error('Error toggling coupon status:', error);
            toast.error('Failed to update coupon status');
        }
    };

    const copyCouponCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('Coupon code copied!');
    };

    const getCouponStatus = (coupon) => {
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (!coupon.isActive) return { text: 'Inactive', color: '#6c757d' };
        if (now < validFrom) return { text: 'Scheduled', color: '#ffc107' };
        if (now > validUntil) return { text: 'Expired', color: '#dc3545' };
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return { text: 'Limit Reached', color: '#dc3545' };
        }
        return { text: 'Active', color: '#55efc4' };
    };

    return (
        <div className="coupon-manager">
            <div className="coupon-manager-header">
                <div>
                    <h1>🎟️ Coupon Manager</h1>
                    <p className="subtitle">Create and manage discount coupons for your customers</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? '❌ Cancel' : <><FaPlus /> Create Coupon</>}
                </button>
            </div>

            {showCreateForm && (
                <motion.div
                    className="coupon-form-container"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
                    <form onSubmit={handleSubmit} className="coupon-form">
                        {/* Row 1: Basic Info */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Coupon Code*</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="WELCOME50"
                                    required
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Discount Type*</label>
                                <select name="discountType" value={formData.discountType} onChange={handleInputChange} required>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Discount Value*</label>
                                <input
                                    type="number"
                                    name="discountValue"
                                    value={formData.discountValue}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                    placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                                />
                            </div>
                        </div>

                        {/* Row 2: Limits & Conditions */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Min Order Amount (₹)</label>
                                <input
                                    type="number"
                                    name="minOrderAmount"
                                    value={formData.minOrderAmount}
                                    onChange={handleInputChange}
                                    min="0"
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Max Discount (₹)</label>
                                <input
                                    type="number"
                                    name="maxDiscountAmount"
                                    value={formData.maxDiscountAmount || ''}
                                    onChange={handleInputChange}
                                    min="0"
                                    placeholder="Optional"
                                    disabled={formData.discountType !== 'percentage'}
                                />
                            </div>

                            <div className="form-group">
                                <label>Total Usage Limit</label>
                                <input
                                    type="number"
                                    name="usageLimit"
                                    value={formData.usageLimit || ''}
                                    onChange={handleInputChange}
                                    min="1"
                                    placeholder="Unlimited"
                                />
                            </div>
                        </div>

                        {/* Row 3: User Limits & Validity */}
                        <div className="form-row">
                            <div className="form-group">
                                <label>Per User Limit*</label>
                                <input
                                    type="number"
                                    name="perUserLimit"
                                    value={formData.perUserLimit}
                                    onChange={handleInputChange}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Valid From*</label>
                                <input
                                    type="date"
                                    name="validFrom"
                                    value={formData.validFrom}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Valid Until*</label>
                                <input
                                    type="date"
                                    name="validUntil"
                                    value={formData.validUntil}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Get 50% off on your first order!"
                                rows={3}
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
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-submit">
                                {editingCoupon ? '💾 Update Coupon' : '✨ Create Coupon'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn-cancel">
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <div className="coupons-list">
                <h2>All Coupons ({coupons.length})</h2>
                {loading ? (
                    <p className="loading-text">Loading coupons...</p>
                ) : !Array.isArray(coupons) || coupons.length === 0 ? (
                    <p className="empty-text">No coupons created yet</p>
                ) : (
                    <div className="coupons-grid">
                        {coupons.map((coupon) => {
                            const status = getCouponStatus(coupon);
                            return (
                                <motion.div
                                    key={coupon._id}
                                    className="coupon-card"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="coupon-card-header">
                                        <div className="coupon-code-section">
                                            <span className="coupon-code">{coupon.code}</span>
                                            <button
                                                className="copy-btn"
                                                onClick={() => copyCouponCode(coupon.code)}
                                                title="Copy code"
                                            >
                                                <FaCopy />
                                            </button>
                                        </div>
                                        <div className="coupon-badges">
                                            <span className="badge" style={{ backgroundColor: status.color }}>
                                                {status.text}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="coupon-discount">
                                        {coupon.discountType === 'percentage' ? (
                                            <>
                                                <FaPercentage className="discount-icon" />
                                                <span className="discount-value">{coupon.discountValue}% OFF</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaRupeeSign className="discount-icon" />
                                                <span className="discount-value">₹{coupon.discountValue} OFF</span>
                                            </>
                                        )}
                                    </div>

                                    {coupon.description && (
                                        <p className="coupon-description">{coupon.description}</p>
                                    )}

                                    <div className="coupon-details">
                                        {coupon.minOrderAmount > 0 && (
                                            <div className="detail">
                                                <span className="detail-label">Min Order:</span>
                                                <span className="detail-value">₹{coupon.minOrderAmount}</span>
                                            </div>
                                        )}
                                        {coupon.maxDiscountAmount && (
                                            <div className="detail">
                                                <span className="detail-label">Max Discount:</span>
                                                <span className="detail-value">₹{coupon.maxDiscountAmount}</span>
                                            </div>
                                        )}
                                        <div className="detail">
                                            <span className="detail-label">Usage:</span>
                                            <span className="detail-value">
                                                {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ''}
                                            </span>
                                        </div>
                                        <div className="detail">
                                            <span className="detail-label">Per User:</span>
                                            <span className="detail-value">{coupon.perUserLimit}x</span>
                                        </div>
                                        <div className="detail">
                                            <span className="detail-label">Valid Until:</span>
                                            <span className="detail-value">
                                                {new Date(coupon.validUntil).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="coupon-card-actions">
                                        <button
                                            className="btn-toggle"
                                            onClick={() => toggleCouponStatus(coupon)}
                                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {coupon.isActive ? <FaToggleOn /> : <FaToggleOff />}
                                        </button>
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(coupon)}
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(coupon._id)}
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
