import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck, FiImage } from 'react-icons/fi';
import './AdminMenuManager.css'; // We will create this css file as well

const AdminMenuManager = ({ setView }) => {
    const { user } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, available, unavailable

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        imageUrl: '',
        offerText: '',
        offerColor: '#ff4757',
        isAvailable: true
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/menu`);
            setItems(res.data);
            setLoading(false);
        } catch (err) {
            toast.error("Failed to load menu items");
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price || !formData.imageUrl || !formData.category) {
            toast.error("Please fill all required fields");
            return;
        }

        const payload = {
            ...formData,
            offerTag: formData.offerText ? { text: formData.offerText, color: formData.offerColor } : null,
            username: user.username // Auth check
        };

        // Remove flattened fields
        delete payload.offerText;
        delete payload.offerColor;

        try {
            if (editItem) {
                // Update
                await axios.put(`${API_BASE_URL}/api/admin/menu/${editItem._id}`, payload);
                toast.success("Item updated successfully");
            } else {
                // Create
                await axios.post(`${API_BASE_URL}/api/admin/menu`, payload);
                toast.success("Item created successfully");
            }
            setShowModal(false);
            fetchItems();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            await axios.delete(`${API_BASE_URL}/api/admin/menu/${id}`, {
                data: { username: user.username }
            });
            toast.success("Item deleted");
            fetchItems();
        } catch (err) {
            toast.error("Failed to delete item");
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditItem(item);
            setFormData({
                name: item.name,
                category: item.category,
                price: item.price,
                imageUrl: item.imageUrl,
                offerText: item.offerTag?.text || '',
                offerColor: item.offerTag?.color || '#ff4757',
                isAvailable: item.isAvailable
            });
        } else {
            setEditItem(null);
            setFormData({
                name: '',
                category: 'Burger', // Default
                price: '',
                imageUrl: '',
                offerText: '',
                offerColor: '#ff4757',
                isAvailable: true
            });
        }
        setShowModal(true);
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all'
            ? true
            : filter === 'available' ? item.isAvailable
                : !item.isAvailable;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="admin-menu-page fade-in">
            <div className="admin-header">
                <div>
                    <h1>Menu Manager</h1>
                    <p>Manage food items, prices and offers</p>
                </div>
                <button className="add-btn" onClick={() => openModal()}>
                    <FiPlus /> Add Item
                </button>
            </div>

            <div className="controls-bar">
                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-tabs">
                    {['all', 'available', 'unavailable'].map(f => (
                        <button
                            key={f}
                            className={filter === f ? 'active' : ''}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="menu-grid">
                {loading ? <div className="loading-spinner">Loading...</div> : filteredItems.map(item => (
                    <div key={item._id} className={`menu-card ${!item.isAvailable ? 'unavailable' : ''}`}>
                        <div className="img-wrapper">
                            <img src={item.imageUrl} alt={item.name} onError={(e) => e.target.src = 'https://via.placeholder.com/150'} />
                            {item.offerTag?.text && (
                                <span className="offer-badge" style={{ background: item.offerTag.color }}>
                                    {item.offerTag.text}
                                </span>
                            )}
                        </div>
                        <div className="card-details">
                            <div className="card-top">
                                <h3>{item.name}</h3>
                                <span className="category-tag">{item.category}</span>
                            </div>
                            <div className="price-row">
                                <span className="price">₹{item.price}</span>
                                <span className={`status-dot ${item.isAvailable ? 'online' : 'offline'}`}></span>
                            </div>
                            <div className="actions">
                                <button className="icon-btn edit" onClick={() => openModal(item)}>
                                    <FiEdit />
                                </button>
                                <button className="icon-btn delete" onClick={() => handleDelete(item._id)}>
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content fade-in-up">
                        <div className="modal-header">
                            <h2>{editItem ? 'Edit Item' : 'Add New Item'}</h2>
                            <button onClick={() => setShowModal(false)}><FiX /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Cheese Burger"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Burger">Burger</option>
                                        <option value="Noodles">Noodles</option>
                                        <option value="Biryani">Biryani</option>
                                        <option value="Rice">Rice</option>
                                        <option value="Mushroom">Mushroom</option>
                                        <option value="Kebab">Kebab</option>
                                        <option value="Kavaabu">Kavaabu</option>
                                        <option value="Pizza">Pizza</option>
                                        <option value="Starters">Starters</option>
                                        <option value="Dessert">Dessert</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Image URL</label>
                                <div className="url-input">
                                    <FiImage />
                                    <input
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="/images/burger.png or https://..."
                                    />
                                </div>
                            </div>

                            <label className="section-label">Offer & Availability</label>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Offer Text (Optional)</label>
                                    <input
                                        value={formData.offerText}
                                        onChange={e => setFormData({ ...formData, offerText: e.target.value })}
                                        placeholder="e.g. 20% OFF"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Offer Color</label>
                                    <input
                                        type="color"
                                        value={formData.offerColor}
                                        onChange={e => setFormData({ ...formData, offerColor: e.target.value })}
                                        style={{ height: '40px', padding: '2px' }}
                                    />
                                </div>
                            </div>

                            <div className="toggle-row">
                                <span>Available for Validation?</span>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <button className="save-btn" onClick={handleSave}>
                                <FiCheck /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMenuManager;
