# Next Steps 🛡️

> **The Single Source of Truth for Your Family's Financial Legacy.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📖 Overview

**Next Steps** is a high-security, AI-powered financial record-keeping application designed to help families organize their critical financial data—assets, debts, insurance, and trusts—in one centralized, accessible location. 

In times of crisis, families often struggle to find account numbers, policy details, or trust documents. **Next Steps** solves this by providing a "Digital Vault" that ensures your loved ones have the information they need when they need it most.

---

## ✨ Key Features

- **🏦 Comprehensive Asset Tracking**: Log bank accounts, real estate, investments, and more with detailed metadata.
- **💳 Debt Management**: Keep a clear view of mortgages, credit cards, and loans to ensure nothing is overlooked.
- **🛡️ Insurance Repository**: Centralize life, health, and property insurance policies with representative contact info.
- **📜 Family Trust Management**: Securely record trust types, trustees, and successor details.
- **🤖 AI Financial Advisor (Pro)**: A context-aware chatbot powered by Google Gemini that answers complex financial planning questions based on *your* specific data.
- **📊 Professional Reporting**: Generate and print clean, investor-ready financial summaries.
- **🤝 Secure Access Sharing (Pro)**: Invite family members or trusted advisors with granular permissions (Read/Edit).
- **📥 Data Portability**: Export your entire financial history to Excel or JSON for local backups.

---

## 🛠️ Tech Stack

- **Frontend**: React 18+ with Vite for lightning-fast builds.
- **Styling**: Tailwind CSS for a modern, responsive "Silicon Valley" aesthetic.
- **Backend**: Firebase (Authentication & Firestore) for real-time sync and secure data storage.
- **AI Engine**: Google Gemini API (@google/genai) for personalized financial insights.
- **Icons**: Lucide React for consistent, high-quality iconography.
- **Animations**: Framer Motion for smooth, professional transitions.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- A Firebase Project
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/next-steps.git
   cd next-steps
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_key
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Privacy

We take data security seriously. 
- **End-to-End Auth**: Powered by Firebase Authentication.
- **Firestore Rules**: Strict server-side security rules ensure users can only access their own data or data explicitly shared with them.
- **Privacy First**: AI Advisor context is processed securely and never stored for training purposes.

---

## 🗺️ Roadmap

- [ ] **Mobile App**: Native iOS and Android versions using React Native.
- [ ] **Document Upload**: Securely store PDF copies of deeds and policies.
- [ ] **Legacy Trigger**: Automated "Dead Man's Switch" to release access to beneficiaries after a period of inactivity.
- [ ] **Bank Sync**: Plaid integration for real-time balance updates.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for families everywhere.
</p>
