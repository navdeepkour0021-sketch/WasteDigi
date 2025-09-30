import React, { useState, useEffect } from 'react';
import { wasteApi, WasteLog } from '../services/api';
import { Trash2, Plus, Calendar, TrendingDown, AlertCircle } from 'lucide-react';

const WastePage: React.FC = () => {
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unit: 'kg',
    reason: 'expired',
    photoUrl: '',
    notes: '',
  });

  const units = ['kg', 'g', 'lb', 'oz', 'l', 'ml', 'pcs', 'boxes'];
  const reasons = [
    { value: 'expired', label: 'Expired' },
    { value: 'spoiled', label: 'Spoiled' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'overstock', label: 'Overstock' },
    { value: 'preparation_waste', label: 'Preparation Waste' },
    { value: 'customer_return', label: 'Customer Return' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    loadWasteLogs();
  }, []);

  const loadWasteLogs = async () => {
    try {
      setLoading(true);
      const response = await wasteApi.getAll();
      setWasteLogs(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load waste logs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
      };

      await wasteApi.create(submitData);

      // Reset form
      setFormData({
        itemName: '',
        quantity: '',
        unit: 'kg',
        reason: 'expired',
        photoUrl: '',
        notes: '',
      });

      setShowForm(false);
      loadWasteLogs(); // Reload logs
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add waste log');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this waste log?')) {
      return;
    }

    try {
      await wasteApi.delete(id);
      loadWasteLogs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete waste log');
    }
  };

  const getReasonColor = (reason: string) => {
    const colors: { [key: string]: string } = {
      expired: 'bg-red-100 text-red-800',
      spoiled: 'bg-red-100 text-red-800',
      damaged: 'bg-orange-100 text-orange-800',
      overstock: 'bg-yellow-100 text-yellow-800',
      preparation_waste: 'bg-blue-100 text-blue-800',
      customer_return: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[reason] || colors.other;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Waste Log</h1>
          </div>
          <p className="text-gray-600">Track and monitor food waste to improve efficiency</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Log Waste</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics */}
      {wasteLogs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Waste Entries</p>
                <p className="text-2xl font-bold text-gray-900">{wasteLogs.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Common Reason</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {(() => {
                    const reasonCounts = wasteLogs.reduce((acc, log) => {
                      acc[log.reason] = (acc[log.reason] || 0) + 1;
                      return acc;
                    }, {} as { [key: string]: number });

                    const mostCommon = Object.entries(reasonCounts)
                      .sort((a, b) => b[1] - a[1])[0]?.[0];

                    return mostCommon ? mostCommon.replace('_', ' ') : 'N/A';
                  })()}

                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {wasteLogs.filter(log => {
                    const logDate = new Date(log.createdAt);
                    const now = new Date();
                    return logDate.getMonth() === now.getMonth() &&
                      logDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Waste Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Log Waste Entry</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    required
                    value={formData.itemName}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="e.g., Expired Lettuce"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      required
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                      Unit *
                    </label>
                    <select
                      id="unit"
                      name="unit"
                      required
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    required
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  >
                    {reasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="photoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="photoUrl"
                    name="photoUrl"
                    value={formData.photoUrl}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Additional details about the waste..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {formLoading ? 'Adding...' : 'Log Waste'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Waste Logs List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Waste Entries</h2>

          {wasteLogs.length === 0 ? (
            <div className="text-center py-8">
              <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No waste entries recorded</p>
              <p className="text-sm text-gray-400 mt-1">Start logging waste to track patterns</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wasteLogs.map((log) => (
                <div
                  key={log._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{log.itemName}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(log.reason)}`}>
                          {log.reason.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">{log.quantity} {log.unit}</span> •
                        <span className="ml-1">{formatDate(log.createdAt)}</span>
                      </div>
                      {log.notes && (
                        <p className="text-sm text-gray-500 mb-2">{log.notes}</p>
                      )}
                      {log.photoUrl && (
                        <div className="mb-2">
                          <img
                            src={log.photoUrl}
                            alt="Waste evidence"
                            className="h-20 w-20 object-cover rounded-lg"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(log._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete waste log"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WastePage;