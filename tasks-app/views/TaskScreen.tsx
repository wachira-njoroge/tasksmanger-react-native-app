import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Platform,
  Pressable,
  Text,
} from "react-native";
import { FAB, TextInput, Button } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";

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

export default function TaskScreen({ token }: { token: string }) {
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "https://jollitycreameries.com/api/categories/list",
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
        "https://jollitycreameries.com/api/tasks/list",
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
    //
    const taskSaveResponse = await axios.patch(
      `https://jollitycreameries.com/api/tasks/update/cancel/${task.code}`,
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
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (task.status == "pending") {
      const payload = {
        startDate: new Date(),
      };
      const taskSaveResponse = await axios.patch(
        `https://jollitycreameries.com/api/tasks/update/start/${task.code}`,
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
      }
    } else {
      const payload = {
        endDate: new Date(),
      };
      const taskSaveResponse = await axios.patch(
        `https://jollitycreameries.com/api/tasks/update/complete/${task.code}`,
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
      }
    }
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
          `https://jollitycreameries.com/api/tasks/update/details/${taskCode}`,
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
        }
      } else {
        const payload = {
          category: selectedCategory,
          dueDate,
          description,
        };
        const taskSaveResponse = await axios.post(
          "https://jollitycreameries.com/api/tasks/create",
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
        }
      }
    } catch (error: any) {
      console.log("Error message :: ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {" "}
              {action == "Edit" ? "Edit Task" : "Save New Task"}
            </Text>

            {/* Category Dropdown */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.dropdown}>
              {categories.map((cat, index) => (
                <Pressable
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => setSelectedCategory(cat?.name)}
                >
                  <Text>{cat.name}</Text>
                </Pressable>
              ))}
              {selectedCategory ? (
                <Text style={styles.selectedText}>
                  Selected: {selectedCategory}
                </Text>
              ) : null}
            </View>

            {/* Due Date Picker */}
            <Text style={styles.label}>Due Date</Text>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <TextInput
                mode="outlined"
                value={dueDate.toDateString()}
                editable={false}
                style={styles.input}
              />
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
            <TextInput
              label="Description"
              mode="outlined"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
            >
              {action == "Edit" ? "Save Task Update" : "Save New Task"}
            </Button>
          </View>
        </View>
      </Modal>

      <FAB icon="plus" style={styles.fab} onPress={displayModal} color="#fff" />
      <View style={styles.taskList}>
        {tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            {/* Header: Date + Status */}
            <View style={styles.taskHeader}>
              <Text style={styles.taskDate}>
                Due Date: {new Date(task.dueDate).toDateString()}
              </Text>
              <Text
                style={[
                  styles.taskStatus,
                  task.status === "completed" && { color: "green" },
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
            <Text style={styles.taskDescription}>{task.description}</Text>

            {/* Action Buttons */}
            <View style={styles.taskActions}>
              <Pressable onPress={() => handleEdit(task)}>
                <Text style={styles.icon}>✏️</Text>
              </Pressable>

              {task.status !== "completed" && (
                <Pressable onPress={() => handleToggleStatus(task)}>
                  <Text style={styles.icon}>
                    {task.status === "in_progress" ? "⏹️" : "▶️"}
                  </Text>
                </Pressable>
              )}

              <Pressable onPress={() => handleDelete(task)}>
                <Text style={styles.icon}>🗑️</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20, 167, 252, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    minHeight: 450,
    justifyContent: "flex-start",
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
});
