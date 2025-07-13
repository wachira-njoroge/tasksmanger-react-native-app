import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";

type Props = {
  onLogin: (token: string) => void;
};

export default function AuthScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async () => {
    try {
      const url =
        mode === "login"
          ? `${process.env.BACKEND_URL}/users/login`
          : `${process.env.BACKEND_URL}/users/signUp`;
        
      const validPassword = () => {
        if (mode === "login") return password;
        if (password === confirmPassword) return password;
        else throw new Error("Passwords do not match");
      }      

      const payload =
        mode === "login" ? { username, password } : { username, password:validPassword() };

      const res = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if(mode === "login"){
        const token = res.data.data.accessToken;

        if (token) onLogin(token);
        else throw new Error("No token returned")
      }else{
        //display toast message
        Alert.alert("Success", res.data.message);
        //set mode to login
        setMode("login");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || err.message);
    }
  };

  return (
    <View style={styles.bgContainer}>
      <Text style={styles.appTitle}>Tasks Manager</Text>
      <View style={styles.card}>
        <Text style={styles.title}>
          {mode === "login" ? "Login" : "Register"}
        </Text>

        <TextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholderTextColor="#888"
        />

        {mode === "login" && (
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#888"
            />
        )}

        {mode === "register" && (
          <>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#888"
            />

            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#888"
            />
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {mode === "login" ? "Login" : "Register"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.toggleText}>
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <Text
            style={styles.toggleLink}
            onPress={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Log in"}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bgContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#222",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    width: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    alignItems: "stretch",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#222",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#007aff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  toggleText: {
    marginTop: 10,
    textAlign: "center",
    color: "#444",
    fontSize: 15,
  },
  toggleLink: {
    color: "#007aff",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
