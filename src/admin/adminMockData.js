
export const initialComplaints = [
  {
    id: "CF001",
    title: "Broken classroom projector",
    description: "The projector in Room 301 is not working properly.",
    student: "Aarav Shah",
    category: "Classroom",
    location: "Room 301",
    department: "IT Support",
    priority: "High",
    status: "Pending",
    date: "2026-10-15"
  },
  {
    id: "CF002",
    title: "Water leakage near library",
    description: "Water is leaking from the ceiling near the library entrance.",
    student: "Priya Patil",
    category: "Maintenance",
    location: "Library",
    department: "Maintenance",
    priority: "High",
    status: "In Progress",
    date: "2026-10-16"
  },
  {
    id: "CF003",
    title: "Wi-Fi connectivity issue",
    description: "Students are unable to connect to campus Wi-Fi.",
    student: "Rahul Mehta",
    category: "Network",
    location: "Computer Lab",
    department: "IT Support",
    priority: "Medium",
    status: "Resolved",
    date: "2026-10-17"
  },
  {
    id: "CF004",
    title: "Damaged classroom benches",
    description: "Several benches in Room 204 require repairs.",
    student: "Neha Singh",
    category: "Infrastructure",
    location: "Room 204",
    department: "Unassigned",
    priority: "Medium",
    status: "Pending",
    date: "2026-10-18"
  },
  {
    id: "CF005",
    title: "Canteen cleanliness",
    description: "The canteen dining area needs regular cleaning.",
    student: "Rohan Fernandes",
    category: "Hygiene",
    location: "Canteen",
    department: "Housekeeping",
    priority: "Low",
    status: "Pending",
    date: "2026-10-19"
  }
];

export const departments = [
  "Unassigned",
  "IT Support",
  "Maintenance",
  "Housekeeping",
  "Administration",
  "Security"
];

export const statuses = [
  "Pending",
  "In Progress",
  "Resolved"
];
