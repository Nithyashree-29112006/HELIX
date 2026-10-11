// Default initial seed data for HELIX Clinical Workflow System

const DEFAULT_MEDICINES = [
  // Cardiology
  {
    id: 1,
    name: "Aspirin",
    power: "75mg",
    manufacturer: "Bayer",
    mrp: 25.50,
    branch: "Cardiology",
    stock: 120,
    visible: true
  },
  {
    id: 2,
    name: "Atorvastatin",
    power: "20mg",
    manufacturer: "Pfizer",
    mrp: 150.00,
    branch: "Cardiology",
    stock: 85,
    visible: true
  },
  {
    id: 3,
    name: "Metoprolol",
    power: "50mg",
    manufacturer: "AstraZeneca",
    mrp: 85.00,
    branch: "Cardiology",
    stock: 60,
    visible: true
  },
  {
    id: 4,
    name: "Clopidogrel",
    power: "75mg",
    manufacturer: "Sanofi",
    mrp: 110.00,
    branch: "Cardiology",
    stock: 45,
    visible: true
  },

  // Dermatology
  {
    id: 5,
    name: "Hydrocortisone Cream",
    power: "1%",
    manufacturer: "GSK",
    mrp: 45.00,
    branch: "Dermatology",
    stock: 50,
    visible: true
  },
  {
    id: 6,
    name: "Clotrimazole Ointment",
    power: "1%",
    manufacturer: "Bayer",
    mrp: 35.00,
    branch: "Dermatology",
    stock: 90,
    visible: true
  },
  {
    id: 7,
    name: "Betamethasone Cream",
    power: "0.1%",
    manufacturer: "Abbott",
    mrp: 55.00,
    branch: "Dermatology",
    stock: 40,
    visible: true
  },

  // General
  {
    id: 8,
    name: "Paracetamol",
    power: "500mg",
    manufacturer: "GSK",
    mrp: 15.00,
    branch: "General",
    stock: 250,
    visible: true
  },
  {
    id: 9,
    name: "Ibuprofen",
    power: "400mg",
    manufacturer: "Pfizer",
    mrp: 20.00,
    branch: "General",
    stock: 180,
    visible: true
  },
  {
    id: 10,
    name: "Amoxicillin",
    power: "500mg",
    manufacturer: "GSK",
    mrp: 120.00,
    branch: "General",
    stock: 95,
    visible: true
  },
  {
    id: 11,
    name: "Cetirizine",
    power: "10mg",
    manufacturer: "Bayer",
    mrp: 18.00,
    branch: "General",
    stock: 140,
    visible: true
  },
  {
    id: 12,
    name: "Pantoprazole",
    power: "40mg",
    manufacturer: "Sun Pharma",
    mrp: 65.00,
    branch: "General",
    stock: 110,
    visible: true
  },

  // Orthopedics
  {
    id: 13,
    name: "Calcium + Vit D3",
    power: "500mg",
    manufacturer: "Torrent",
    mrp: 80.00,
    branch: "Orthopedics",
    stock: 100,
    visible: true
  },
  {
    id: 14,
    name: "Diclofenac Gel",
    power: "1%",
    manufacturer: "Novartis",
    mrp: 65.00,
    branch: "Orthopedics",
    stock: 80,
    visible: true
  },

  // Pediatrics
  {
    id: 15,
    name: "Paracetamol Suspension",
    power: "120mg/5ml",
    manufacturer: "GSK",
    mrp: 38.00,
    branch: "Pediatrics",
    stock: 60,
    visible: true
  }
];

const DEFAULT_PATIENTS = [
  {
    id: 101,
    patientNumber: "P-101",
    patientName: "John Miller",
    age: 45,
    gender: "Male",
    contactNumber: "9876543210",
    weight: 74,
    height: 175,
    bloodPressure: "130/85",
    sugarLevel: "110 mg/dL",
    feverLevel: "98.6 °F",
    testsTaken: ["Blood Test"],
    allergies: "Penicillin",
    medicalHistory: "Mild hypertension",
    entryTime: Date.now() - 25 * 60 * 1000,
    status: "waiting",
    queuePosition: 1
  },
  {
    id: 102,
    patientNumber: "P-102",
    patientName: "Sarah Jenkins",
    age: 32,
    gender: "Female",
    contactNumber: "9123456780",
    weight: 58,
    height: 162,
    bloodPressure: "118/78",
    sugarLevel: "95 mg/dL",
    feverLevel: "101.4 °F",
    testsTaken: ["Urine Test"],
    allergies: "None reported",
    medicalHistory: "Acute fever & chills",
    entryTime: Date.now() - 55 * 60 * 1000,
    status: "sent_to_doctor",
    queuePosition: 2
  },
  {
    id: 103,
    patientNumber: "P-103",
    patientName: "Robert Brown",
    age: 62,
    gender: "Male",
    contactNumber: "9988776655",
    weight: 84,
    height: 168,
    bloodPressure: "150/95",
    sugarLevel: "165 mg/dL",
    feverLevel: "98.4 °F",
    testsTaken: ["ECG", "Blood Test"],
    allergies: "Sulfa drugs",
    medicalHistory: "Type 2 Diabetes, High BP",
    entryTime: Date.now() - 140 * 60 * 1000,
    status: "waiting",
    queuePosition: 3
  }
];

const DEFAULT_USERS = {
  doctor: { username: "doctor", role: "doctor", name: "Dr. Alexander Brooks", badge: "Doctor", color: "#6C5CE7" },
  nurse: { username: "nurse", role: "nurse", name: "Nurse Emily Davis", badge: "Nurse", color: "#00B894" },
  medical: { username: "medical", role: "medical", name: "Staff Michael Ross", badge: "Medical Staff", color: "#E17055" },
  admin: { username: "admin", role: "admin", name: "Admin Clara Vance", badge: "Administrator", color: "#5F27CD" }
};
