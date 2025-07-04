# SkillBridge – Learn. Earn. Rise. 🚀

A digital bridge where underskilled youth leap from passive potential to active professionals—using microlearning to build skills, verify them, and land microgigs in their own neighborhoods. Built for Africa, built to scale globally.

![SkillBridge Banner](https://via.placeholder.com/1200x300/3B82F6/FFFFFF?text=SkillBridge+-+Learn.+Earn.+Rise.)

## 🌟 Features

### 🧑‍🎓 For Learners
- **Microlearning Tracks**: Short courses like "HTML in 30 mins", "How to budget KES 5000"
- **Skill Badges**: Completed modules unlock verified skill badges
- **XP & Leveling System**: Gamified learning with points and level progression
- **Real-time Progress Tracking**: Detailed analytics on learning patterns
- **Quiz Validation**: Multi-format quizzes with automatic scoring
- **Certificate Generation**: Digital certificates for course completion

### 🧑‍🏭 For Businesses
- **Gig Marketplace**: Post microgigs with geolocation matching
- **Skill-based Matching**: Find workers based on verified skills and location
- **Application Management**: Review applications and manage gig workflow
- **Rating System**: Rate workers and build reputation profiles

### 🛠️ For Admins
- **Course Management**: Create and edit courses with quiz sets
- **Badge System**: Design and manage achievement badges
- **User Analytics**: Platform-wide insights and user management
- **Content Moderation**: Approve courses and manage platform quality

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
```
server/
├── models/           # MongoDB schemas with Mongoose
│   ├── User.js      # User model with XP, skills, location
│   ├── Course.js    # Course model with modules and quizzes
│   ├── Gig.js       # Gig model with geolocation
│   ├── Badge.js     # Badge model with criteria system
│   └── Progress.js  # Detailed progress tracking
├── routes/          # API endpoints
│   ├── auth.js      # Authentication & user management
│   ├── courses.js   # Course CRUD & enrollment
│   ├── gigs.js      # Gig marketplace & applications
│   ├── badges.js    # Badge management
│   └── admin.js     # Admin panel functionality
├── middleware/      # Authentication & validation
└── utils/           # Helper functions
```

### Frontend (React + Vite + Tailwind)
```
client/
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/       # Main application pages
│   ├── store/       # Zustand state management
│   ├── api/         # API configuration
│   └── utils/       # Helper functions
└── public/          # Static assets
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 5.0+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd skillbridge-app
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Install client dependencies**
```bash
cd ../client
npm install
```

4. **Environment Setup**

Create `server/.env` from `server/.env.example`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillbridge
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-random
CLIENT_URL=http://localhost:5173
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

5. **Start MongoDB**
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name skillbridge-mongo mongo:5.0
```

6. **Start the application**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

7. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- API Health: http://localhost:5000/api/health

## 📊 Database Schema

### User Model Features
- **Authentication**: JWT-based with role support (learner, business, admin)
- **Gamification**: XP points, levels, streaks, achievements
- **Skills & Badges**: Verified skill tracking with badge system
- **Geolocation**: MongoDB geospatial queries for nearby matching
- **Progress Tracking**: Detailed learning analytics

### Key MongoDB Operations
- **$geoNear**: Find gigs near user's coordinates
- **$lookup**: Map completed courses to earned badges
- **$facet**: Dashboard analytics with multiple aggregations
- **Compound Indexing**: Optimized queries on location, skills, and levels

## 🎯 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `PUT /auth/updatedetails` - Update profile

### Courses
- `GET /courses` - List courses with filtering
- `GET /courses/:id` - Get course details
- `POST /courses/:id/enroll` - Enroll in course
- `PUT /courses/:id/modules/:moduleId/progress` - Update progress
- `POST /courses/:id/quiz/attempt` - Submit quiz

### Gigs
- `GET /gigs` - List gigs with geolocation filtering
- `POST /gigs` - Create gig (business only)
- `POST /gigs/:id/apply` - Apply to gig
- `GET /gigs/location/nearby` - Find nearby gigs

### Badges & Progress
- `GET /badges` - List available badges
- `GET /badges/user/recommended` - Get recommended badges
- `GET /progress/analytics` - User learning analytics

## 🔧 Development Features

### Real-time Updates
- Socket.io integration for live gig notifications
- Real-time application status updates
- Live XP and level-up notifications

### Mobile-First Design
- Responsive Tailwind CSS components
- Touch-friendly interface
- Progressive Web App ready

### Performance Optimizations
- React Query for data caching
- MongoDB aggregation pipelines
- Geospatial indexing for location queries
- Image optimization and lazy loading

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd client
npm run test
```

## 📱 Mobile App (Future)
- React Native version planned
- Offline course content
- Push notifications for gig matches

## 🌍 Deployment

### Backend (Render/Railway)
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Frontend (Vercel/Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Database (MongoDB Atlas)
1. Create cluster
2. Add connection string to environment
3. Configure network access

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Roadmap

### Phase 1: MVP (Current)
- [x] User authentication & profiles
- [x] Course creation & enrollment
- [x] Gig marketplace
- [x] XP & badge system
- [x] Basic admin panel

### Phase 2: Enhanced Features
- [ ] Payment integration (M-Pesa, Stripe)
- [ ] Advanced analytics dashboard
- [ ] Mentor system
- [ ] Course certificates
- [ ] Mobile app

### Phase 3: Scale & Growth
- [ ] Multi-language support
- [ ] Advanced AI recommendations
- [ ] Enterprise features
- [ ] International expansion

## 📞 Support

For support, email support@skillbridge.co.ke or join our Slack community.

## 🎉 Built With Love for Africa

SkillBridge is designed specifically for the African market, addressing real challenges in skills development and employment. Our mission is to bridge the gap between potential and opportunity.

---

**🌟 Ready to start your SkillBridge journey? [Get Started Now](http://localhost:5173) 🌟**