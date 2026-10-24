# 🍃 SharePlate — Good Food Deserves a Second Chance

**SharePlate is a food-sharing platform designed to connect people with surplus food to those who need it.** By making food donation and discovery easier, SharePlate aims to reduce food waste and encourage a more sustainable, compassionate community.

## 🌍 The Problem

A significant amount of edible food goes to waste while many people struggle to access sufficient food. Often, the challenge is connecting surplus food with people who can use it.

## 💡 Our Solution

SharePlate provides a digital platform where users can share surplus food, discover available food listings, and submit requests. By simplifying these interactions, the platform aims to make food sharing more accessible and reduce avoidable food waste.

## ✨ Key Features

* **🔐 User Authentication:** Register and log in to access the platform.
* **🍱 Donate Food:** Create food listings to share surplus food with others.
* **🔎 Find Food:** Explore available food listings.
* **📋 Listing Details:** View information about individual food listings.
* **🤝 Donation Requests:** Request available food and manage donation requests.
* **📊 Dashboard:** Access a centralized interface for relevant listing and request activity.
* **🌿 Responsive Design:** A modern interface designed for desktop, tablet, and mobile screens.

## 🛠️ Technology Stack

* **Frontend:** React and TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Backend and Database:** Supabase
* **Authentication:** Supabase Authentication
* **Version Control:** Git and GitHub

## 🚀 Getting Started

Follow these steps to run SharePlate locally.

### Prerequisites

* Node.js and npm
* Access to the configured Supabase backend and its required environment variables

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Apurvagit28/SharePlate.git
```

**2. Navigate to the project directory**

```bash
cd SharePlate
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a `.env.local` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the placeholder values with the appropriate URL and anon/publishable key for the configured Supabase project.

**Never commit `.env.local`, service-role keys, secret keys, or other private credentials to GitHub.** Ensure local environment files are excluded through `.gitignore`.

**5. Start the development server**

```bash
npm run dev
```

Open the local URL displayed in your terminal to access the application.

## 🎯 Our Mission

We believe that good food deserves a second chance. SharePlate aims to turn surplus food into an opportunity to help others by making food sharing simpler, more accessible, and more community-driven.

## 🔮 Future Scope

Potential future improvements include:

* Advanced food search and filtering
* Notifications for donation requests and status updates
* Improved donor and recipient profiles
* Food expiry and availability tracking
* Community impact reporting
* Location-based food discovery

## 🤝 Contributing

Contributions, suggestions, and ideas that help make food sharing more accessible are welcome.

## 📄 License

No license has been specified for this project yet.
