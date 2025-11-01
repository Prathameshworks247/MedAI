import React, { useState } from 'react';
import { Bell, Pill, Calendar, FileText, Trash2, Check, Settings } from 'lucide-react';
import { notifications as initialNotifications } from '../../data/dummyData';

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState('all');

  const getIcon = (type) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-5 h-5" />;
      case 'appointment':
        return <Calendar className="w-5 h-5" />;
      case 'test':
        return <FileText className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'medication':
        return 'bg-blue-100 text-blue-600';
      case 'appointment':
        return 'bg-green-100 text-green-600';
      case 'test':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h2>
        <p className="text-gray-600">Stay updated with your health reminders and alerts</p>
      </div>

      {/* Stats and Actions */}
      <div className="card mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-600 p-3 rounded-lg relative">
              <Bell className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {unreadCount} Unread Notification{unreadCount !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-gray-600">{notifications.length} total notifications</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button onClick={markAllAsRead} className="btn-secondary text-sm flex items-center">
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </button>
            <button className="btn-secondary text-sm flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('medication')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'medication'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Medication
          </button>
          <button
            onClick={() => setFilter('appointment')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'appointment'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setFilter('test')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              filter === 'test'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Test Results
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`card transition-all ${
                notif.read ? 'bg-white' : 'bg-blue-50 border-2 border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`${getColor(notif.type)} p-3 rounded-lg flex-shrink-0`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{notif.title}</h4>
                    {!notif.read && (
                      <span className="inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {notif.date} at {notif.time}
                    </p>
                    <div className="flex space-x-2">
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Settings */}
      <div className="card mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-sm font-semibold text-gray-900">Medication Reminders</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-sm font-semibold text-gray-900">Appointment Reminders</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-sm font-semibold text-gray-900">Test Result Updates</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="text-sm font-semibold text-gray-900">Health Tips</span>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

