import Constants from 'expo-constants';
import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Platform,
  Pressable,
  Text,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import { FAB, TextInput, Button } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";

const { BACKEND_URL } = Constants.expoConfig?.extra || {};

type Category = {
  id: number;
  name: string;
};

type Task = {
  id: number;
  userId: number;
  categoryId: number;
  code: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  dueDate: string;
  createdAt: string | null;
  category: {
    name: string;
  };
};

export default function TaskScreen({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  //Control save and update in one view using this prop
  const [action, setAction] = useState("");
  const [taskCode, setTaskCode] = useState("");
  // Add state for selected tab
  const [selectedTab, setSelectedTab] = useState<string>("All");
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/categories/list`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCategories(res.data.data || []);
      } catch (err: any) {
        console.error("Failed to load categories:", err.message);
      }
    };
    fetchCategories();
  }, []);
  // Fetch svaed tasks
  const fetchTasks = async () => {
    try {
      const tasksRes = await axios.get(
        `${BACKEND_URL}/tasks/list`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTasks(tasksRes.data.data || []);
    } catch (error: any) {
      console.error("Failed to load tasks:", error.message);
    }
  };
  useEffect(() => {
    fetchTasks();
  }, []);

  // Toast functions
  const showToast = (error: any, type: "success" | "error") => {
    let message = "";
    if (Array.isArray(error)) {
      message = error.map((item: any) => item.message).join("\n");
    } else if (typeof error === "string") {
      message = error;
    }
    setToast({ message, type });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToast(null);
      });
    }, 3000);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(false);
    setDueDate(currentDate);
  };
  //
  const handleEdit = (task: Task) => {
    setAction("Edit");
    setTaskCode(task.code);
    // Populate modal with task values
    setDescription(task.description);
    setDueDate(new Date(task.dueDate));
    setSelectedCategory(task.category.name);
    // Open modal to edit
    setModalVisible(true);
  };

  const handleDelete = async (task: Task) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.description}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const taskSaveResponse = await axios.patch(
                `${BACKEND_URL}/tasks/update/cancel/${task.code}`,
                { actionType: "cancel" },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (taskSaveResponse.data.success) {
                fetchTasks();
                clearDisplayInputs();
                setModalVisible(false);
                showToast(
                  taskSaveResponse.data.message || "Task deleted successfully!",
                  "success"
                );
              }
            } catch (error: any) {
              showToast(
                error?.response?.data?.message ||
                  "Failed to delete task. Please try again.",
                "error"
              );
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (task: Task) => {
    if (task.status == "pending") {
      const payload = {
        startDate: new Date(),
      };
      const taskSaveResponse = await axios.patch(
        `${BACKEND_URL}/tasks/update/start/${task.code}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (taskSaveResponse.data.success) {
        fetchTasks();
        clearDisplayInputs();
        setModalVisible(false);
        showToast(
          taskSaveResponse.data.message || "Task started successfully!",
          "success"
        );
      }
    } else {
      const payload = {
        endDate: new Date(),
      };
      const taskSaveResponse = await axios.patch(
        `${BACKEND_URL}/tasks/update/complete/${task.code}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (taskSaveResponse.data.success) {
        fetchTasks();
        clearDisplayInputs();
        setModalVisible(false);
        showToast(
          taskSaveResponse.data.message || "Task completed successfully!",
          "success"
        );
      }
    }
  };
  //handle logout
  const handleLogout = async () => {
    onLogout();
  };
  //
  const displayModal = async () => {
    setAction("New");
    clearDisplayInputs();
    setModalVisible(true);
  };
  const clearDisplayInputs = () => {
    setSelectedCategory("");
    setDueDate(new Date());
    setDescription("");
    setTaskCode("");
  };
  //
  const handleSubmit = async () => {
    try {
      if (action == "Edit") {
        const payload = {
          category: selectedCategory,
          dueDate,
          description,
        };
        const taskSaveResponse = await axios.patch(
          `${BACKEND_URL}/tasks/update/details/${taskCode}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (taskSaveResponse.data.success) {
          fetchTasks();
          clearDisplayInputs();
          setModalVisible(false);
          showToast(
            taskSaveResponse.data.message || "Task updated successfully!",
            "success"
          );
        }
      } else {
        const payload = {
          category: selectedCategory,
          dueDate,
          description,
        };
        const taskSaveResponse = await axios.post(
          `${BACKEND_URL}/tasks/create`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (taskSaveResponse.data.success) {
          fetchTasks();
          clearDisplayInputs();
          setModalVisible(false);
          showToast(
            taskSaveResponse.data.message || "Task created successfully!",
            "success"
          );
        }
      }
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          "Failed to save task. Please try again.",
        "error"
      );
    }
  };

  // Filter tasks by selected tab/category
  const filteredTasks =
    selectedTab === "All"
      ? tasks
      : tasks.filter((task) => task.category.name === selectedTab);

  return (
    <View style={styles.container}>
      {/* Toast Notification for non-modal actions */}
      {toast && !modalVisible && (
        <Animated.View
          style={[
            styles.toast,
            styles[`toast${toast.type === "success" ? "Success" : "Error"}`],
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, selectedTab === "All" && styles.tabActive]}
          onPress={() => setSelectedTab("All")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "All" && styles.tabTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.tab, selectedTab === cat.name && styles.tabActive]}
            onPress={() => setSelectedTab(cat.name)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === cat.name && styles.tabTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* Modal for Add/Edit Task */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Toast Notification for modal actions */}
          {toast && modalVisible && (
            <Animated.View
              style={[
                styles.toast,
                styles[
                  `toast${toast.type === "success" ? "Success" : "Error"}`
                ],
                { opacity: fadeAnim },
              ]}
            >
              <Text style={styles.toastText}>{toast.message}</Text>
            </Animated.View>
          )}
          <View style={styles.modalView}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {action == "Edit" ? "Edit Task" : "Create New Task"}
              </Text>

              {/* Category Radio Buttons */}
              <Text style={styles.label}>Category</Text>
              <View style={styles.radioContainer}>
                {categories.map((cat, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.radioButton,
                      selectedCategory === cat.name &&
                        styles.radioButtonSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        selectedCategory === cat.name &&
                          styles.radioCircleSelected,
                      ]}
                    >
                      {selectedCategory === cat.name && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.radioText,
                        selectedCategory === cat.name &&
                          styles.radioTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Due Date Picker */}
              <Text style={styles.label}>Due Date</Text>
              <Pressable onPress={() => setShowDatePicker(true)}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateText}>
                    {dueDate.toLocaleDateString()}
                  </Text>
                  <Text style={styles.dateIcon}>📅</Text>
                </View>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                />
              )}

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Enter task description..."
                placeholderTextColor="#888"
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                style={styles.descriptionInput}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>
                  {action == "Edit" ? "Update Task" : "Create Task"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* FAB for new task */}
      <FAB icon="plus" style={styles.fab} onPress={displayModal} color="#fff" />
      {/* Task List */}
      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        {filteredTasks.map((task) => (
          <View key={task.id} style={styles.newTaskCard}>
            {/* Category label */}
            <View style={styles.cardHeader}>
              <View style={styles.rowCenter}>
                <Text style={styles.dueDateIcon}>📅</Text>
                <Text style={styles.dueDateText}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.categoryPill}>{task.category.name}</Text>
              <Text
                style={[
                  styles.statusPill,
                  task.status === "completed" && styles.statusCompleted,
                  task.status === "in_progress" && styles.statusInProgress,
                  task.status === "cancelled" && styles.statusCancelled,
                  task.status === "pending" && styles.statusPending,
                ]}
              >
                {task.status == "in_progress"
                  ? "In Progress"
                  : task.status == "completed"
                  ? "Completed"
                  : task.status == "cancelled"
                  ? "Cancelled"
                  : "Pending"}
              </Text>
            </View>
            {/* Description */}
            <Text style={styles.taskTitle}>{task.description}</Text>
            {/* Due Date */}
            <View style={styles.actionContainer}>
              {task.status !== "completed" && (
                <Pressable
                  onPress={() => handleToggleStatus(task)}
                  style={[
                    styles.modernButton,
                    task.status === "in_progress"
                      ? styles.completeButton
                      : styles.startButton,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      task.status === "in_progress" && styles.buttonTextLight,
                    ]}
                  >
                    {task.status === "in_progress" ? "Complete" : "Start"}
                  </Text>
                </Pressable>
              )}
              {task.status !== "completed" && (
                <Pressable
                  onPress={() => handleEdit(task)}
                  style={[styles.modernButton, styles.editButton]}
                >
                  <Text style={[styles.buttonText, styles.buttonTextLight]}>
                    Edit
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => handleDelete(task)}
                style={[styles.modernButton, styles.deleteButton]}
              >
                <Text style={[styles.buttonText, styles.buttonTextLight]}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskList: {
    padding: 16,
    paddingBottom: 100, // leave space for FAB
  },
  taskActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  icon: {
    fontSize: 20,
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  taskDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff9800",
  },
  taskDescription: {
    fontSize: 16,
    color: "#444",
    marginTop: 4,
  },

  fab: {
    position: "absolute",
    bottom: 50,
    right: 24,
    backgroundColor: "#6200ee",
    zIndex: 1000,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    maxHeight: "75%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  dropdownItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  selectedText: {
    marginTop: 8,
    fontStyle: "italic",
    color: "#555",
  },
  input: {
    width: "100%",
    marginTop: 12,
  },
  submitButton: {
    marginTop: 20,
  },
  label: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#e0e0e0",
  },
  tabActive: {
    backgroundColor: "#6200ee",
  },
  tabText: {
    color: "#333",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  newTaskCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: "#e3e3fa",
    color: "#6200ee",
    fontWeight: "bold",
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusPill: {
    fontSize: 13,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#eee",
    color: "#888",
  },
  statusCompleted: {
    backgroundColor: "#7CFC00",
    color: "white",
  },
  statusInProgress: {
    backgroundColor: "#4CBB17",
    color: "white",
  },
  statusCancelled: {
    backgroundColor: "#f8d7da",
    color: "#c62828",
  },
  statusPending: {
    backgroundColor: "orange",
    color: "white",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDateIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  dueDateText: {
    fontSize: 14,
    color: "#555",
  },
  iconBtn: {
    fontSize: 20,
    marginLeft: 16,
    color: "#888",
  },
  actionButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  modernButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  startButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  completeButton: {
    backgroundColor: "#28a745",
  },
  editButton: {
    backgroundColor: "#007bff",
  },
  deleteButton: {
    backgroundColor: "#f16345",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
  },
  buttonTextLight: {
    color: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#dc3545",
    borderRadius: 6,
    borderWidth: 1,
    color: "#FFFFFF",
    borderColor: "#e9ecef",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Modal styles
  radioContainer: {
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  radioButtonSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: "#2196f3",
    backgroundColor: "#2196f3",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  radioText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  radioTextSelected: {
    color: "#2196f3",
    fontWeight: "600",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  dateIcon: {
    fontSize: 18,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#fafafa",
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 20,
    minHeight: 100,
    maxHeight: 200,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6c757d",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#007aff",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // Toast styles
  toast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    left: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: "#4CAF50",
  },
  toastError: {
    backgroundColor: "#F44336",
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
