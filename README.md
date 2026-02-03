Automated Structural Report Generator

A full-stack application that automates the generation of professional structural engineering reports. It accepts load data via Excel/CSV, performs structural analysis (or plots existing results), and generates a high-quality PDF report with vector-based Shear Force and Bending Moment diagrams using LaTeX.

🚀 Features

Dual Mode Engine:

Calculation Mode: Calculates Reactions, SFD, and BMD from raw point loads.

Plotting Mode: Automatically detects pre-calculated results (e.g., from Midas/SAP2000) and plots them directly.

Smart Column Mapping: Automatically detects columns like "Position", "Load", "Shear", or "Moment" regardless of exact naming (e.g., handles "Pos", "x", "Dist" equally).

Vector Graphics: Generates native TikZ/PGFPlots for infinite scalability and crisp printing.

Modern UI: A clean, wizard-based React interface for easy file uploads.

Robust Backend: Flask-based API with error handling for LaTeX compilation issues.

🛠️ Tech Stack

Frontend: React.js, Vite, Lucide-React

Backend: Python, Flask, Pandas, NumPy

Typesetting: PyLaTeX, LaTeX (MiKTeX/TeX Live)

📋 Prerequisites

Before running the project, ensure you have the following installed:

Python 3.8+

Node.js & npm (for the frontend)

LaTeX Distribution:

Windows: MiKTeX (Recommended)

Linux: TeX Live (sudo apt-get install texlive-full)

Mac: MacTeX

⚙️ Installation & Setup

1. Backend Setup (Flask)

Navigate to the root directory:

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask Server
python beam_analysis_report.py


The server will start at http://127.0.0.1:5000.

2. Frontend Setup (React)

Open a new terminal and navigate to the client folder:

cd client

# Install dependencies
npm install

# Start the Development Server
npm run dev


The UI will be accessible at http://localhost:5173 (or the port shown in your terminal).

📖 Usage Guide

Open the web interface (http://localhost:5173).

Step 1: Upload your Excel (.xlsx) or CSV (.csv) file.

Format A (Loads): Columns for Position (m) and Load (kN).

Format B (Results): Columns for x, Shear, and Moment.

Step 2: (Optional) Upload a beam diagram image. If skipped, a default schematic is generated.

Step 3: Review and click Generate PDF.

The system will process the data, compile the LaTeX code, and automatically download the Engineering_Report.pdf.

📂 Project Structure

BeamAnalysisProject/
├── beam_analysis_report.py   # Main Flask Backend & Logic
├── requirements.txt          # Python Dependencies
├── README.md                 # Project Documentation
├── .gitignore                # Git Ignore Rules
└── client/                   # React Frontend
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx           # Main UI Component
    │   └── ...
    ├── package.json
    └── ...


🤝 Contributing

Fork the repository.

Create your feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📄 License

This project is submitted for the Osdag Screening Task.
