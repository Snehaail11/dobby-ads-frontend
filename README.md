# 📁 Dobby Ads - Frontend

React 19 frontend for the Dobby Ads application with modern UI and built-in AI assistant.

![React](https://img.shields.io/badge/React-19.x-61dafb) ![Vercel](https://img.shields.io/badge/Vercel-Deployed-000)

## 🚀 Features

- **Modern UI** - Clean dashboard with Inter font and CSS variables
- **Responsive** - Works on mobile and desktop
- **Folder Management** - Create, rename, delete nested folders
- **Image Upload** - Drag and drop or click to upload
- **Breadcrumb Navigation** - Easy folder navigation
- **Context Menus** - Right-click actions
- **Lightbox** - Full-screen image viewing
- **AI Chat Assistant** - Natural language commands
- **Loading States** - Visual feedback
- **Error Handling** - Toast notifications

## 🖥️ Live App

**URL:** https://dobby-ads-frontend.vercel.app

## 💻 Development

```bash
cd dobby-ads-frontend
npm install
npm start
```

Opens at http://localhost:3000

## 🔧 Build

```bash
npm run build
```

Builds to `build/` folder for production.

## 🤖 AI Assistant

Click the **🤖 AI** button in the header to open the chat.

### Available Commands

| Command | Example |
|---------|---------|
| Create folder | "Create folder Marketing" |
| List folders | "List folders" |
| Delete folder | "Delete folder Old" |

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.js    # Main dashboard
│   ├── Dashboard.css  # Dashboard styles
│   ├── AIChat.js      # AI chat assistant
│   ├── AIChat.css    # Chat styles
│   ├── Login.js      # Login/Signup
│   └── Login.css    # Login styles
├── context/
│   └── AuthContext.js # Authentication
├── services/
│   └── api.js       # API client
├── App.js          # Main app
├── App.css         # Global styles
└── index.js       # Entry point
```

## 🔗 API Connection

The frontend connects to: `https://dobby-ads-backend-fu75.onrender.com/api`

Update in `src/services/api.js` if using different backend.

## 📄 License

ISC - Dobby Ads Team