import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../services/api';
import { Package, Plus, Calendar, Hash, Tag } from 'lucide-react';

const AddInventory: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    expiryDate: '',
    category: 'vegetables',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const units = ['kg', 'g', 'lb', 'oz', 'l', 'ml', 'pcs', 'boxes'];
  const categories = [
    'vegetables',
    'fruits', 
    'meat',
    'dairy',
    'grains',
    'beverages',
    'spices',
    'other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
      };

      await inventoryApi.create(submitData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        quantity: '',
        unit: 'kg',
        expiryDate: '',
        category: 'vegetables',
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add inventory item');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add Inventory Item</h1>
        </div>
        <p className="text-gray-600">Add new items to your restaurant inventory</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            ✓ Inventory item added successfully! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="e.g., Fresh Tomatoes, Chicken Breast"
              />
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  required
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                id="unit"
                name="unit"
                required
                value={formData.unit}
                onChange={handleInputChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                required
                min={today}
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>{loading ? 'Adding...' : 'Add Item'}</span>
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventory;