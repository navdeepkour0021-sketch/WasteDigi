import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryApi, wasteApi, InventoryItem, WasteLog } from '../services/api';
import AIAssistant from '../components/AIAssistant';
import SecuritySettings from '../components/SecuritySettings';
import WasteReport from '../components/WasteReport';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  FileText,
  Users as UsersIcon,
  BarChart3
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
  const [allWasteLogs, setAllWasteLogs] = useState<WasteLog[]>([]);
  const [alerts, setAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAllData, setShowAllData] = useState(false);

  // Check user permissions
  const canViewAnalytics = user?.role === 'manager' || user?.role === 'admin';
  const canManageUsers = user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const requests = [
        inventoryApi.getAll(),
        inventoryApi.getAlerts(),
        wasteApi.getAll()
      ];

      // If admin, load all data from all users
      if (isAdmin) {
        requests.push(
          inventoryApi.getAll(true), // Get all inventory items
          wasteApi.getAll(true)      // Get all waste logs
        );
      }

      const results = await Promise.all(requests);
      const [inventoryRes, alertsRes, wasteRes] = results;
      
      setInventory(inventoryRes.data);
      setAlerts(alertsRes.data);
      setAllWasteLogs(wasteRes.data);
      
      if (isAdmin) {
        setAllInventory(results[3].data); // All inventory from admin endpoint
        setAllWasteLogs(results[4].data); // All waste logs from admin endpoint
      }
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowReport(!showReport)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span>Monthly Report</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAllData(!showAllData)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <BarChart3 className="h-5 w-5" />
              <span>All Data</span>
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Monthly Waste Report */}
      {showReport && (
        <WasteReport 
          wasteLogs={allWasteLogs} 
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Admin All Data View */}
      {showAllData && isAdmin && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">All System Data</h2>
                  <p className="text-sm text-gray-600">Complete overview of all users' data</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllData(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* System Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Inventory Items</p>
                    <p className="text-2xl font-bold text-blue-900">{allInventory.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Total Waste Logs</p>
                    <p className="text-2xl font-bold text-red-900">{allWasteLogs.length}</p>
                  </div>
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Active Items</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {allInventory.filter(item => item.status === 'active').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Categories</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {new Set(allInventory.map(item => item.category)).size}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Inventory */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Inventory Items</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {allInventory.slice(0, 10).map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">{item.quantity} {item.unit} • {item.category}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'active' ? 'bg-green-100 text-green-800' :
                        item.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Waste Logs */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Waste Logs</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {allWasteLogs.slice(0, 10).map((log) => (
                    <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{log.itemName}</p>
                        <p className="text-sm text-gray-600">{log.quantity} {log.unit}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 capitalize">
                        {log.reason.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
                {isAdmin ? 'My Active Items' : 'Active Items'}
                {user?.role && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                    {user.role}
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold text-gray-900">{activeItems.length}</p>
              {isAdmin && (
                <p className="text-xs text-gray-500 mt-1">
                  System Total: {allInventory.filter(item => item.status === 'active').length}
                </p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isAdmin ? 'My Expiry Alerts' : 'Expiry Alerts'}
              </p>
              <p className="text-2xl font-bold text-red-600">{alerts.length}</p>
              {isAdmin && (
                <p className="text-xs text-gray-500 mt-1">
                  System Total: {allInventory.filter(item => {
                    const threeDaysFromNow = new Date();
                    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
                    return item.status === 'active' && new Date(item.expiryDate) <= threeDaysFromNow;
                  }).length}
                </p>
              )}
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isAdmin ? 'My Categories' : 'Total Categories'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(activeItems.map(item => item.category)).size}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isAdmin ? (
                  `System Total: ${new Set(allInventory.map(item => item.category)).size}`
                ) : (
                  `Permissions: ${user?.role === 'admin' ? 'Full Access' : 
                                user?.role === 'manager' ? 'Management Access' : 'Basic Access'}`
                )}
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