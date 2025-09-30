import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import { Users, Shield, Trash2, Edit, Crown, UserCheck, Plus, X, Eye, EyeOff } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

interface Permission {
  value: string;
  label: string;
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    permissions: [] as string[]
  });

  // Check if current user has permission to access this page
  const hasAccess = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  useEffect(() => {
    if (hasAccess) {
      loadUsers();
      if (currentUser?.role === 'admin') {
        loadPermissions();
      }
    }
  }, [hasAccess]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await usersApi.getPermissions();
      setAvailablePermissions(response.data);
    } catch (err: any) {
      console.error('Failed to load permissions:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.create(createFormData);
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        permissions: []
      });
      setShowCreateForm(false);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleRoleUpdate = async (userId: string, role: string) => {
    try {
      await usersApi.updateRole(userId, { role, permissions: newPermissions });
      setEditingUser(null);
      setNewPermissions([]);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setNewPermissions(user.permissions || []);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewRole('');
    setNewPermissions([]);
  };

  const handlePermissionToggle = (permission: string) => {
    setNewPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await usersApi.delete(userId);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-purple-600" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <UserCheck className="h-4 w-4 text-green-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

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
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        </div>
        <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create User Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Create New User</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {availablePermissions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Permissions
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {availablePermissions.map((permission) => (
                        <label key={permission.value} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={createFormData.permissions.includes(permission.value)}
                            onChange={() => {
                              const newPermissions = createFormData.permissions.includes(permission.value)
                                ? createFormData.permissions.filter(p => p !== permission.value)
                                : [...createFormData.permissions, permission.value];
                              setCreateFormData(prev => ({ ...prev, permissions: newPermissions }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
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

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>
          
          {users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Security
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser?._id === user._id ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="user">User</option>
                              <option value="manager">Manager</option>
                              {currentUser?.role === 'admin' && (
                                <option value="admin">Admin</option>
                              )}
                            </select>
                            </div>
                            {currentUser?.role === 'admin' && availablePermissions.length > 0 && (
                              <div className="max-h-24 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                                <div className="text-xs font-medium text-gray-700 mb-1">Additional Permissions:</div>
                                {availablePermissions.map((permission) => (
                                  <label key={permission.value} className="flex items-center space-x-1 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={newPermissions.includes(permission.value)}
                                      onChange={() => handlePermissionToggle(permission.value)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>{permission.label}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleRoleUpdate(user._id, newRole)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(user.role)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {user.permissions && user.permissions.length > 0 ? (
                            <div className="space-y-1">
                              {user.permissions.slice(0, 2).map((permission) => (
                                <div key={permission} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {permission.replace(':', ': ').replace('_', ' ')}
                                </div>
                              ))}
                              {user.permissions.length > 2 && (
                                <div className="text-xs text-gray-400">
                                  +{user.permissions.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Role-based only</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.twoFactorEnabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          {currentUser?.role === 'admin' && user._id !== currentUser._id && (
                            <>
                              <button
                                onClick={() => handleStartEdit(user)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit role"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;