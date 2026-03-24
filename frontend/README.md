# FinViz Pro - Frontend

A comprehensive personal finance analytics dashboard frontend built with React, TypeScript, and Tailwind CSS.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Development Guidelines](#development-guidelines)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Overview

FinViz Pro is a modern, responsive web application that helps users track, analyze, and optimize their personal finances. The frontend provides an intuitive interface for managing transactions, budgets, categories, and gaining financial insights through interactive visualizations.

## ✨ Features

### Core Functionality
- **User Authentication**: Secure login, registration, and session management with JWT
- **Transaction Management**: Create, edit, delete, and filter transactions
- **Category Organization**: Hierarchical categories with customizable colors and icons
- **Budget Planning**: Set and track spending limits with alert thresholds
- **Financial Analytics**: Interactive charts and insights for spending patterns
- **Report Generation**: Generate and export monthly/yearly financial reports
- **Data Import/Export**: CSV/JSON/Excel import/export capabilities
- **Dashboard Overview**: Real-time KPIs, spending trends, and financial insights

### UI/UX Features
- **Responsive Design**: Fully responsive layout for desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between light and dark mode (coming soon)
- **Interactive Charts**: Recharts library for beautiful data visualizations
- **Data Tables**: Sortable, filterable, and paginated tables
- **Real-time Notifications**: Toast notifications for user actions
- **Form Validation**: Comprehensive form validation with Yup

## 🛠️ Tech Stack

### Core
- **React 19.2.4** - UI library
- **TypeScript 4.9.5** - Type safety
- **React Router DOM 7.13.1** - Navigation
- **Tailwind CSS 3.4.19** - Styling

### State Management & Data
- **React Hook Form 7.71.2** - Form handling
- **Yup 1.7.1** - Schema validation
- **Axios 1.13.6** - HTTP client
- **React Query** (via Axios) - Data fetching

### Charts & Visualizations
- **Recharts 3.8.0** - Chart library
- **Date-fns 4.1.0** - Date manipulation

### UI Components
- **Headless UI 2.2.9** - Accessible UI components
- **Heroicons 2.2.0** - Icon library
- **React Data Table Component 7.7.0** - Advanced tables
- **React Hot Toast 2.6.0** - Toast notifications
- **React Dropzone 15.0.0** - File upload

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Tailwind CSS** - Utility-first CSS framework

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher (or yarn/pnpm)
- **Backend API**: Running FinViz Pro backend (see backend README)

## 🏗️ Installation

### Clone the Repository

```bash
# Change directory
cd FinViz/frontend

# Install dipendencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start server
npm start
```

### Working Test Users

| Username   | Password      | Role    | Status   |
|------------|---------------|---------|----------|
| admin      | `Admin123!@#` | admin   | active   |
| johndoe    | `John123!@#`  | user    | active   |
| janesmith  | `Jane123!@#`  | user    | active   |
| bobjohnson | `Bob123!@#`   | user    | inactive |


## 📜 Available Scripts

### Development

```bash
npm start              # Start development server
npm run build          # Build for production
```

### Code Quality

```bash
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run type-check     # Run TypeScript type checking
```

## 🎯 Development Guidelines

### Code Style

- Use TypeScript for all components
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error boundaries

### State Management

- Use React hooks for local state
- Use Context for global state (auth, theme)
- Use React Query for server state (coming soon)

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use custom classes in globals.css when needed

### API Integration
- All API calls go through the service layer
- Use Axios interceptors for auth token management
- Handle loading and error states consistently

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit changes (git commit -m 'Add amazing feature')
4. Push to branch (git push origin feature/amazing-feature)
5. Open a Pull Request

### Commit Convention

Use Conventional Commits:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📞 Contact

Project Lead: Raymond Oluoch
GitHub Issues: [Issue Tracker](https://github.com/rOluochKe/FinViz/issues)
Documentation: [Wiki](https://github.com/rOluochKe/FinViz/wiki)

Built with ❤️ for the IU International University Portfolio Project