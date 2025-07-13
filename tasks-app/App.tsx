import React, { useState } from 'react';
import { View, Text } from 'react-native';
import AuthScreen from 'views/AuthScreen'
import TaskScreen from './views/TaskScreen';

export default function App() {
  const [token, setToken] = useState<string | null>(null);

  return token
    ? <TaskScreen token={token} onLogout={() => setToken(null)} />
    : <AuthScreen onLogin={setToken} />;
}
