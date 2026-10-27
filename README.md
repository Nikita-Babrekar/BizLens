# BizLens

BizLens is an AI-powered business analytics and decision-support web platform designed to help modern business owners and student entrepreneurs seamlessly manage datasets, track operational performance, and gain deep analytical insights through an intuitive interface.

---

## 🚀 Key Features

* **Secure Authentication:** Integrated Google OAuth (via Firebase) with enforced route protection to secure dashboard access.
* **User & Shop Management:** Automatically syncs authenticated user profiles to a dedicated database table and features an intuitive shop-naming and onboarding flow.
* **Smart Analytics & Forecasting:** Upload CSV datasets to inspect operational metrics, track historical uploads, and run automated forecasting tools.
* **Interactive AI Chatbot:** Engage with built-in assistant workflows to analyze dataset performance and query operational root-causes.
* **Data Export & Management:** Flexible data exporting features and instant one-click switching between historical CSV datasets.
* **Minimalist UI/UX:** Clean, modern sidebar navigation and a streamlined profile popover with integrated dark/light mode toggles.

---

## 🛠️ Tech Stack

* **Frontend:** 
  <p style="margin-top: 5px;">
    <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  </p>

* **Backend:** 
  <p style="margin-top: 5px;">
    <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  </p>

* **Database & Auth:** 
  <p style="margin-top: 5px;">
    <img src="https://img.shields.io/badge/SQLite-07405e?style=for-the-badge&logo=sqlite&logoColor=white" />
    <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  </p>

* **Data Science & Processing:** 
  <p style="margin-top: 5px;">
    <img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" />
    <img src="https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white" />
    <img src="https://img.shields.io/badge/Scikit_Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" />
  </p>

---

## 📁 Project Structure

```text
bizlens-main/
├── app/                  # Next.js frontend pages and API routes
├── backend/              # FastAPI backend application, routes, and business logic
├── components/           # Reusable UI components (ProfileDropdown, navigation, modals)
├── context/              # React Context providers (AuthContext, DatasetContext)
├── lib/                  # Utility functions, API clients, and Firebase configuration
├── public/               # Static assets and images
├── .env.local            # Local environment variables (Ignored in version control)
├── .gitignore            # Git exclusion rules
├── README.md             # Project documentation
└── package.json          # Frontend dependencies and scripts
```

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* Git

---

### 1. Setup Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a Python virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `backend/` directory and configure your environment variables:
```env
DATABASE_URL=sqlite:///./bizlens.db
```

5. Run the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### 2. Setup Frontend

1. Navigate back to the root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

---

## 🔒 Security & Privacy Notice
* Sensitive environment keys (`.env` and `.env.local`) and local development databases (`*.db`) are strictly excluded from version control via `.gitignore`. 
* Never push credentials or raw local databases to public repositories.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
