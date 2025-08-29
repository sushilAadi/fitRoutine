"use client";

import React, { useEffect, useState, useContext } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { GlobalContext } from '@/context/GloablContext';
import SecureComponent from '@/components/SecureComponent/[[...SecureComponent]]/SecureComponent';
import { Bell, BellDot, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
  const { user } = useContext(GlobalContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      try {
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef,
          where("userEmail", "==", user.primaryEmailAddress.emailAddress)
        );

        const querySnapshot = await getDocs(q);
        const notificationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by createdAt in descending order (newest first)
        const sortedNotifications = notificationsList.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        setNotifications(sortedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, "notifications", notification.id);
        await updateDoc(notificationRef, {
          isRead: true
        });
      }

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'enrollment':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'welcome':
        return <Bell className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <SecureComponent>
        <div className="flex items-center justify-center min-h-screen bg-tprimary">
          <div className="text-white">Loading notifications...</div>
        </div>
      </SecureComponent>
    );
  }

  return (
    <SecureComponent>
      <div className="min-h-screen bg-tprimary">
        <div className="sticky top-0 z-10 p-4 bg-tprimary">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-300">{unreadCount} unread notifications</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-lg ${
                filter === 'all' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm rounded-lg ${
                filter === 'unread' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 text-sm rounded-lg ${
                filter === 'read' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        <div className="p-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-16 h-16 mb-4 text-gray-500" />
              <h3 className="mb-2 text-lg font-medium text-white">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </h3>
              <p className="text-gray-400">
                {filter === 'all' 
                  ? 'Your notifications will appear here when you receive them.' 
                  : `You don't have any ${filter} notifications.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    notification.isRead
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-gray-700 border-blue-500 shadow-lg'
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium ${
                          notification.isRead ? 'text-gray-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <BellDot className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        notification.isRead ? 'text-gray-400' : 'text-gray-200'
                      }`}>
                        {notification.body}
                      </p>
                      
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SecureComponent>
  );
};

export default NotificationsPage;