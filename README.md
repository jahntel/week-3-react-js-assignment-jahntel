# React.js and Tailwind CSS Assignment - Week 3

[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=19890148&assignment_repo_type=AssignmentRepo)

A modern React application demonstrating component architecture, state management, API integration, and responsive design using Tailwind CSS.

## 🚀 Live Demo

**Deploy URL:** https://vercel.com/jahntels-projects/week-3-react-js-assignment-jahntel/A8wEMScWr9a3ocFFQoD1aT4vTXph

## 📸 Screenshots

![Home Page -
(_Screenshot 20250704-130551.png)
![Task Manager]( Screenshot_20250705-133249.png)
![Posts with API Integration]()

## ✨ Features Implemented

### ✅ Project Setup (Task 1)
- React application with Vite
- Tailwind CSS integration
- Proper project structure with organized folders
- React Router for navigation

### ✅ Component Architecture (Task 2)
- **Button Component**: Multiple variants (primary, secondary, danger) and sizes
- **Card Component**: Flexible container for content display
- **Navbar Component**: Navigation with active state indication
- **Footer Component**: Site footer with links
- **Layout Component**: Consistent page structure

### ✅ State Management and Hooks (Task 3)
- **TaskManager Component** with full CRUD operations:
  - Add new tasks
  - Mark tasks as completed/incomplete
  - Delete tasks
  - Filter tasks (All, Active, Completed)
- **React Hooks Used**:
  - `useState` for component state
  - `useEffect` for side effects and data persistence
  - `useContext` for theme management
  - Custom hook `useLocalStorageTasks` for task persistence

### ✅ API Integration (Task 4)
- Fetch data from JSONPlaceholder API
- Loading and error state handling
- Pagination implementation
- Search functionality
- Responsive grid layout for data display

### ✅ Styling with Tailwind CSS (Task 5)
- Fully responsive design (mobile, tablet, desktop)
- Dark/Light theme toggle with persistence
- Modern UI with hover effects and transitions
- Consistent color scheme and typography

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Context API + Hooks
- **API**: JSONPlaceholder (for demo posts)
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.jsx      # Button with variants and sizes
│   ├── Card.jsx        # Card container component
│   ├── Footer.jsx      # Site footer
│   ├── Layout.jsx      # Page layout wrapper
│   ├── Navbar.jsx      # Navigation component
│   └── TaskManager.jsx # Task management component
├── context/             # React context providers
│   └── ThemeContext.jsx # Theme state management
├── hooks/               # Custom React hooks
│   └── useLocalStorage.jsx # localStorage persistence hook
├── pages/               # Page components
│   ├── Home.jsx        # Landing page
│   ├── Posts.jsx       # API integration demo
│   └── Tasks.jsx       # Task management page
├── utils/               # Utility functions
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── Index.css           # Global styles and Tailwind imports
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd week-3-react-js-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

## 🎯 Usage

### Task Management
1. Navigate to the "Tasks" page
2. Add new tasks using the input field
3. Mark tasks as complete by clicking the checkbox
4. Filter tasks using the All/Active/Completed buttons
5. Delete tasks using the delete button

### Posts Browser
1. Navigate to the "Posts" page
2. Browse posts fetched from the API
3. Use the search bar to filter posts
4. Navigate between pages using pagination

### Theme Switching
- Click the theme toggle button (🌙/☀️) in the navbar
- Theme preference is automatically saved to localStorage

## 🌐 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Deploy with default settings

### Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to [Netlify](https://netlify.com)

### GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add deploy script to package.json
3. Run: `npm run deploy`

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS with dark mode support. Configuration is in `tailwind.config.js`.

### Vite
Vite configuration is in `vite.config.js` with React plugin enabled.

## 📋 Assignment Requirements Checklist

- [x] **Task 1**: Project Setup
  - [x] React with Vite
  - [x] Tailwind CSS configuration
  - [x] Project structure
  - [x] React Router setup

- [x] **Task 2**: Component Architecture
  - [x] Button component with variants
  - [x] Card component
  - [x] Navbar component
  - [x] Footer component
  - [x] Layout component
  - [x] Props usage for customization

- [x] **Task 3**: State Management and Hooks
  - [x] TaskManager with CRUD operations
  - [x] useState implementation
  - [x] useEffect for side effects
  - [x] useContext for theme management
  - [x] Custom hook for localStorage

- [x] **Task 4**: API Integration
  - [x] Fetch from JSONPlaceholder
  - [x] Loading and error states
  - [x] Pagination
  - [x] Search functionality

- [x] **Task 5**: Styling with Tailwind CSS
  - [x] Responsive design
  - [x] Dark/light theme toggle
  - [x] Utility classes usage
  - [x] Animations and transitions

## 🤝 Contributing

This is a student assignment project. For questions or feedback, please contact the instructor.

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Router Documentation](https://reactrouter.com/)

## 📄 License

This project is part of an educational assignment and is not licensed for commercial use. 
