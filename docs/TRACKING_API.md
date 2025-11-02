# EcoTrack Backend - Enhanced Tracking System API

## Overview
The tracking system now includes **smart carbon calculations**, **goal management**, **personalized insights**, and **gamified achievements**.

---

## 🎯 Key Features

### 1. Smart Carbon Calculations
Automatic carbon impact calculation based on activity type and amount using real-world emission factors.

### 2. Points & Gamification
Dynamic points system that rewards eco-friendly actions more heavily.

### 3. Goal Setting
Weekly/monthly carbon reduction goals with real-time progress tracking.

### 4. Personalized Insights
AI-generated tips and encouragement based on user behavior.

### 5. Achievements System
Unlock badges and earn bonus points for milestones (streaks, carbon saved, etc.).

---

## 📊 Carbon Emission Factors

### Transportation (per km)
- **Petrol Car**: 0.192 kg CO₂e
- **Diesel Car**: 0.171 kg CO₂e
- **Electric Car**: 0.053 kg CO₂e
- **Public Bus**: 0.089 kg CO₂e
- **Train/Metro**: 0.041 kg CO₂e
- **Bicycle/Walk**: 0.0 kg CO₂e

### Energy (per kWh)
- **Grid Electricity**: 0.233 kg CO₂e
- **Renewable Energy**: 0.0 kg CO₂e
- **Natural Gas**: 0.185 kg CO₂e

### Food (per kg)
- **Beef**: 27.0 kg CO₂e
- **Lamb**: 39.2 kg CO₂e
- **Chicken**: 6.9 kg CO₂e
- **Vegetables**: 2.0 kg CO₂e

### Waste (per kg)
- **Landfill**: +0.45 kg CO₂e
- **Recycled**: -0.15 kg CO₂e (carbon saved)
- **Composted**: -0.10 kg CO₂e (carbon saved)

---

## 🔌 API Endpoints

### **POST /api/tracking/log**
Log an activity with smart carbon calculation.

#### Smart Mode (Recommended)
```json
{
  "activity_type": "transportation",
  "sub_type": "car_petrol",
  "amount": 15.5,
  "unit": "km",
  "description": "Drove to work",
  "is_positive": false
}
```

**Response:**
```json
{
  "message": "Activity logged successfully",
  "activity": {
    "description": "Drove to work",
    "points_earned": 29,
    "carbon_impact": 2.976,
    "timestamp": "2025-11-02T10:30:00"
  },
  "stats": {
    "total_points": 1250,
    "carbon_saved": 45.2,
    "streak_days": 14,
    "weekly_progress": 85.5
  },
  "unlocked_achievements": [
    {
      "name": "Week Warrior",
      "description": "7-day tracking streak",
      "icon": "🔥",
      "points": 50
    }
  ]
}
```

#### Manual Mode (Backward Compatible)
```json
{
  "activity_type": "general",
  "description": "Recycled 5 bottles",
  "points_earned": 10,
  "carbon_impact": -0.75
}
```

#### Activity Types & Sub-Types

**Transportation:**
- `car_petrol`, `car_diesel`, `car_electric`
- `bus`, `train`, `bicycle`, `walk`
- `flight_short`, `flight_long`

**Energy:**
- `electricity_grid`, `electricity_renewable`
- `gas_heating`

**Food:**
- `beef`, `lamb`, `pork`, `chicken`, `fish`
- `vegetables`, `fruits`, `grains`

**Waste:**
- `general_waste`, `recycled`, `composted`
- `e_waste`

---

### **GET /api/tracking/history**
Get activity history with pagination.

**Query Parameters:**
- `limit` (default: 50): Number of activities to return

**Response:**
```json
{
  "activities": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user_id": "user_123",
      "activity_type": "transportation",
      "sub_type": "bicycle",
      "description": "Biked to work (5km)",
      "amount": 5,
      "unit": "km",
      "points_earned": 10,
      "carbon_impact": 0.0,
      "timestamp": "2025-11-02T08:00:00"
    }
  ],
  "count": 25
}
```

---

### **GET /api/user/insights**
Get personalized insights and recommendations.

**Response:**
```json
{
  "insights": [
    {
      "type": "success",
      "title": "Carbon Savings",
      "message": "You've saved 45.2kg CO2e! That's like planting 2.2 trees! 🌳",
      "icon": "💚"
    },
    {
      "type": "success",
      "title": "14-Day Streak!",
      "message": "Consistency is key! Keep tracking to stay accountable.",
      "icon": "🔥"
    },
    {
      "type": "tip",
      "title": "Transportation Tip",
      "message": "Consider carpooling, public transit, or biking for short trips to reduce emissions.",
      "icon": "🚲"
    }
  ]
}
```

**Insight Types:**
- `success`: Achievements and milestones
- `tip`: Actionable recommendations
- `info`: General information and progress updates

---

### **GET /api/user/achievements**
Get all achievements (locked and unlocked).

**Response:**
```json
{
  "achievements": [
    {
      "achievement_id": "first_steps",
      "name": "Eco Newbie",
      "description": "Logged your first activity",
      "icon": "🌱",
      "points": 10,
      "unlocked": true,
      "unlocked_at": "2025-10-15T10:00:00"
    },
    {
      "achievement_id": "week_warrior",
      "name": "Week Warrior",
      "description": "7-day tracking streak",
      "icon": "🔥",
      "points": 50,
      "unlocked": true,
      "unlocked_at": "2025-10-22T09:30:00"
    },
    {
      "achievement_id": "month_master",
      "name": "Month Master",
      "description": "30-day tracking streak",
      "icon": "⭐",
      "points": 150,
      "unlocked": false,
      "unlocked_at": null
    }
  ],
  "unlocked_count": 2
}
```

**Available Achievements:**
- 🌱 **Eco Newbie** (10 pts): Log first activity
- 🔥 **Week Warrior** (50 pts): 7-day streak
- ⭐ **Month Master** (150 pts): 30-day streak
- 💚 **Carbon Saver** (75 pts): Save 10kg CO₂e
- ♻️ **Recycling Hero** (100 pts): Recycle 50 items
- 🚴 **Commute Champion** (80 pts): 20 eco commutes

---

### **POST /api/user/goals**
Set a carbon reduction goal.

**Request:**
```json
{
  "goal_type": "weekly",
  "target_carbon_kg": 5.0,
  "deadline": "2025-12-31T00:00:00"
}
```

**Response:**
```json
{
  "message": "Goal set successfully",
  "goal": {
    "_id": "507f1f77bcf86cd799439011",
    "user_id": "user_123",
    "goal_type": "weekly",
    "target_carbon_kg": 5.0,
    "deadline": "2025-12-31T00:00:00",
    "created_at": "2025-11-02T10:00:00",
    "is_active": true
  }
}
```

**Goal Types:**
- `weekly`: Reset every Monday
- `monthly`: Reset on 1st of month

---

### **GET /api/user/goals**
Get active goals with progress.

**Response:**
```json
{
  "goals": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user_id": "user_123",
      "goal_type": "weekly",
      "target_carbon_kg": 5.0,
      "current_carbon_saved": 4.2,
      "progress_percent": 84.0,
      "remaining_carbon_kg": 0.8,
      "deadline": "2025-12-31T00:00:00",
      "is_active": true
    }
  ],
  "count": 1
}
```

---

## 📈 Carbon Endpoints (Enhanced)

### **GET /api/carbon/monthly**
Total carbon footprint for current month.

```json
{
  "monthly_carbon_kg": 45.2
}
```

### **GET /api/carbon/transportation**
Transportation carbon for current month.

```json
{
  "transportation_carbon_kg": 28.5
}
```

### **GET /api/carbon/energy**
Energy carbon for current month.

```json
{
  "energy_carbon_kg": 12.3
}
```

### **GET /api/carbon/food-waste**
Food and waste carbon for current month.

```json
{
  "food_waste_carbon_kg": 4.4
}
```

### **GET /api/carbon/trends**
6-month carbon trend data.

```json
{
  "trends": [
    {
      "month": "Jun 2025",
      "carbon_kg": 52.3
    },
    {
      "month": "Jul 2025",
      "carbon_kg": 48.1
    }
  ]
}
```

---

## 🎮 Points System

### Calculation Formula
```
Base Points = |carbon_impact| × 10

If eco-friendly action (carbon_impact < 0):
  Points = Base Points × 2

Minimum: 2 points for tracking
```

### Examples
- Drive 10km (petrol): `1.92 kg CO₂e → 19 points`
- Bike 5km: `0 kg CO₂e → 10 points` (eco bonus)
- Recycle 1kg: `-0.15 kg CO₂e → 3 points` (eco bonus)

---

## 🏆 Levels

| Level | Points Required |
|-------|----------------|
| Eco Beginner | 0 - 99 |
| Eco Explorer | 100 - 499 |
| Eco Enthusiast | 500 - 999 |
| Eco Warrior | 1000 - 2499 |
| Eco Champion | 2500 - 4999 |
| Eco Legend | 5000+ |

---

## 💡 Usage Examples

### Example 1: Log Daily Commute
```bash
curl -X POST http://127.0.0.1:8000/api/tracking/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "transportation",
    "sub_type": "bicycle",
    "amount": 8,
    "unit": "km",
    "description": "Biked to work"
  }'
```

### Example 2: Log Food Consumption
```bash
curl -X POST http://127.0.0.1:8000/api/tracking/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "food",
    "sub_type": "chicken",
    "amount": 0.2,
    "unit": "kg",
    "description": "Chicken dinner"
  }'
```

### Example 3: Log Recycling
```bash
curl -X POST http://127.0.0.1:8000/api/tracking/log \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "waste",
    "sub_type": "recycled",
    "amount": 2,
    "unit": "kg",
    "description": "Recycled plastic and paper",
    "is_positive": true
  }'
```

### Example 4: Set Weekly Goal
```bash
curl -X POST http://127.0.0.1:8000/api/user/goals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goal_type": "weekly",
    "target_carbon_kg": 5.0
  }'
```

---

## 🔄 Frontend Integration

### React/Next.js Example

```typescript
// Log an activity
const logActivity = async (activity: {
  activity_type: string;
  sub_type: string;
  amount: number;
  description: string;
}) => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('http://127.0.0.1:8000/api/tracking/log', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(activity),
  });
  
  const data = await response.json();
  
  // Show unlocked achievements
  if (data.unlocked_achievements?.length > 0) {
    data.unlocked_achievements.forEach((ach: any) => {
      showNotification(`🎉 Achievement Unlocked: ${ach.name}`, ach.description);
    });
  }
  
  return data;
};

// Get insights
const fetchInsights = async () => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch('http://127.0.0.1:8000/api/user/insights', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};
```

---

## 📝 Notes

### Carbon Impact Sign Convention
- **Positive (+)**: Carbon emitted (e.g., driving, eating meat)
- **Negative (-)**: Carbon saved/offset (e.g., recycling, renewable energy)

### Streak Calculation
- Resets if no activity logged for > 24 hours
- Increments by 1 each day an activity is logged
- Tracks via `last_activity_date` in user_stats

### Weekly Goal Period
- Starts Monday 00:00:00 UTC
- Ends Sunday 23:59:59 UTC
- Progress auto-calculated on each activity log

---

## 🚀 Best Practices

1. **Use Smart Mode** for automatic calculations
2. **Set Realistic Goals** (start with 3-5 kg/week)
3. **Track Daily** to maintain streaks
4. **Review Insights** regularly for personalized tips
5. **Celebrate Achievements** to stay motivated

---

**Last Updated:** November 2, 2025  
**API Version:** 3.0.0  
**Backend:** FastAPI + MongoDB + Perplexity AI
