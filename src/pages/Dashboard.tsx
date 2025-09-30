import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryApi, InventoryItem } from '../services/api';
import AIAssistant from '../components/AIAssistant';
import SecuritySettings from '../components/SecuritySettings';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  Settings
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Check user permissions
  const canViewAnalytics = user?.role === 'manager' || user?.role === 'admin';
  const canManageUsers = user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, alertsRes] = await Promise.all([
        inventoryApi.getAll(),
        inventoryApi.getAlerts()
      ]);
      setInventory(inventoryRes.data);
      setAlerts(alertsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await inventoryApi.update(id, { status: status as any });
      loadData(); // Reload data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item');
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', color: 'red', label: 'Expired' };
    if (diffDays <= 1) return { status: 'critical', color: 'red', label: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}` };
    if (diffDays <= 3) return { status: 'warning', color: 'yellow', label: `Expires in ${diffDays} days` };
    return { status: 'good', color: 'green', label: `Expires in ${diffDays} days` };
  };

  const activeItems = inventory.filter(item => item.status === 'active');
  const totalValue = activeItems.length;

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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Monitor your inventory and track waste efficiently</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecuritySettings />
          {canViewAnalytics && (
            <AIAssistant />
          )}
        </div>
      )}

      {/* AI Assistant for managers and admins */}
      {!showSettings && canViewAnalytics && (
        <AIAssistant />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Items
                {user?.role && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                    {user.role}
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold text-gray-900">{activeItems.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiry Alerts</p>
              <p className="text-2xl font-bold text-red-600">{alerts.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(activeItems.map(item => item.category)).size}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Permissions: {user?.role === 'admin' ? 'Full Access' : 
                            user?.role === 'manager' ? 'Management Access' : 'Basic Access'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Expiry Alerts</h2>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {alerts.length}
              </span>
            </div>
            <div className="space-y-3">
              {alerts.map((item) => {
                const expiry = getExpiryStatus(item.expiryDate);
                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit} • {item.category}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">{expiry.label}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(item._id, 'expired')}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Mark as expired"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(item._id, 'consumed')}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Mark as consumed"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Inventory List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Inventory</h2>
          
          {activeItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active inventory items</p>
              <p className="text-sm text-gray-400 mt-1">Add your first inventory item to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeItems.map((item) => {
                    const expiry = getExpiryStatus(item.expiryDate);
                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {expiry.status === 'critical' || expiry.status === 'expired' ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : expiry.status === 'warning' ? (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm font-medium ${
                              expiry.color === 'red' ? 'text-red-600' : 
                              expiry.color === 'yellow' ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {expiry.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStatusChange(item._id, 'expired')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Mark as expired"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(item._id, 'consumed')}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Mark as consumed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;