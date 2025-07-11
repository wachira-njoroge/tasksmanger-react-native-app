import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

type Props = {
  onLogin: (token: string) => void;
};

export default function AuthScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    try {
      const url =
        mode === 'login'
          ? 'https://jollitycreameries.com/api/users/login'
          : 'https://jollitycreameries.com/api/users/signUp';

      const payload =
        mode === 'login'
          ? { username, password }
          : { username, password };

      const res = await axios.post(url, payload,{
        headers: {
            'Content-Type': 'application/json'
        }
      });
      const token = res.data.data.accessToken;
        
      if (token) onLogin(token);
      else throw new Error('No token returned');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === 'login' ? 'Login' : 'Register'}
      </Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      {mode === 'register' && (
        <TextInput
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />
      )}

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title={mode === 'login' ? 'Login' : 'Register'} onPress={handleSubmit} />

      <Text style={styles.toggle} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? "New here? Register" : "Already have an account? Log in"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 30, flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, marginBottom: 10, padding: 10, borderRadius: 5 },
  toggle: { marginTop: 20, textAlign: 'center', color: 'blue' },
});
