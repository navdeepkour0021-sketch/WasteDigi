import React, { useState, useMemo } from 'react';
import { WasteLog } from '../services/api';
import { 
  FileText, 
  Calendar, 
  TrendingDown, 
  PieChart, 
  Download,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface WasteReportProps {
  wasteLogs: WasteLog[];
  onClose: () => void;
}

const WasteReport: React.FC<WasteReportProps> = ({ wasteLogs, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter waste logs by selected month
  const monthlyWasteLogs = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return wasteLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate.getFullYear() === year && logDate.getMonth() === month - 1;
    });
  }, [wasteLogs, selectedMonth]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalEntries = monthlyWasteLogs.length;
    const totalQuantity = monthlyWasteLogs.reduce((sum, log) => sum + log.quantity, 0);
    
    // Group by reason
    const reasonStats = monthlyWasteLogs.reduce((acc, log) => {
      const reason = log.reason;
      if (!acc[reason]) {
        acc[reason] = { count: 0, quantity: 0 };
      }
      acc[reason].count += 1;
      acc[reason].quantity += log.quantity;
      return acc;
    }, {} as Record<string, { count: number; quantity: number }>);

    // Group by item
    const itemStats = monthlyWasteLogs.reduce((acc, log) => {
      const item = log.itemName;
      if (!acc[item]) {
        acc[item] = { count: 0, quantity: 0, unit: log.unit };
      }
      acc[item].count += 1;
      acc[item].quantity += log.quantity;
      return acc;
    }, {} as Record<string, { count: number; quantity: number; unit: string }>);

    // Daily breakdown
    const dailyStats = monthlyWasteLogs.reduce((acc, log) => {
      const day = new Date(log.createdAt).getDate();
      if (!acc[day]) {
        acc[day] = { count: 0, quantity: 0 };
      }
      acc[day].count += 1;
      acc[day].quantity += log.quantity;
      return acc;
    }, {} as Record<number, { count: number; quantity: number }>);

    return {
      totalEntries,
      totalQuantity,
      reasonStats,
      itemStats,
      dailyStats
    };
  }, [monthlyWasteLogs]);

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      expired: 'bg-red-500',
      spoiled: 'bg-red-400',
      damaged: 'bg-orange-500',
      overstock: 'bg-yellow-500',
      preparation_waste: 'bg-blue-500',
      customer_return: 'bg-purple-500',
      other: 'bg-gray-500',
    };
    return colors[reason] || colors.other;
  };

  const formatReason = (reason: string) => {
    return reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const generateCSVData = () => {
    const headers = ['Date', 'Item Name', 'Quantity', 'Unit', 'Reason', 'Notes'];
    const rows = monthlyWasteLogs.map(log => [
      new Date(log.createdAt).toLocaleDateString(),
      log.itemName,
      log.quantity.toString(),
      log.unit,
      formatReason(log.reason),
      log.notes || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadReport = () => {
    const csvData = generateCSVData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waste-report-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Monthly Waste Report</h2>
              <p className="text-sm text-gray-600">Detailed analysis of waste patterns</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadReport}
              disabled={monthlyWasteLogs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">{monthName}</h3>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {monthlyWasteLogs.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No waste data for {monthName}</h3>
            <p className="text-gray-600">Select a different month or start logging waste entries.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Total Entries</p>
                    <p className="text-2xl font-bold text-red-900">{statistics.totalEntries}</p>
                  </div>
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Total Quantity</p>
                    <p className="text-2xl font-bold text-orange-900">{statistics.totalQuantity.toFixed(1)}</p>
                    <p className="text-xs text-orange-600">Mixed units</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Unique Items</p>
                    <p className="text-2xl font-bold text-blue-900">{Object.keys(statistics.itemStats).length}</p>
                  </div>
                  <PieChart className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Waste by Reason */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Waste by Reason</h4>
                <div className="space-y-3">
                  {Object.entries(statistics.reasonStats)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([reason, stats]) => (
                      <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${getReasonColor(reason)}`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{formatReason(reason)}</p>
                            <p className="text-sm text-gray-600">{stats.count} entries</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{stats.quantity.toFixed(1)}</p>
                          <p className="text-sm text-gray-600">total qty</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Top Wasted Items */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Most Wasted Items</h4>
                <div className="space-y-3">
                  {Object.entries(statistics.itemStats)
                    .sort((a, b) => b[1].quantity - a[1].quantity)
                    .slice(0, 8)
                    .map(([item, stats]) => (
                      <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item}</p>
                          <p className="text-sm text-gray-600">{stats.count} times wasted</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{stats.quantity.toFixed(1)} {stats.unit}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Daily Breakdown */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Daily Breakdown</h4>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: new Date(selectedMonth + '-01').getDate() }, (_, i) => i + 1).map(day => {
                  const dayStats = statistics.dailyStats[day];
                  const hasData = dayStats && dayStats.count > 0;
                  
                  return (
                    <div
                      key={day}
                      className={`p-2 text-center rounded-lg border ${
                        hasData 
                          ? 'bg-red-50 border-red-200 text-red-900' 
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      <div className="text-sm font-medium">{day}</div>
                      {hasData && (
                        <div className="text-xs mt-1">
                          {dayStats.count} entries
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Entries */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Entries</h4>
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {monthlyWasteLogs
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((log) => (
                      <div key={log._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{log.itemName}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(log.createdAt).toLocaleDateString()} • {formatReason(log.reason)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{log.quantity} {log.unit}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WasteReport;