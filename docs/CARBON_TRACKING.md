# 📊 Carbon Tracking Guide

## Overview
The Carbon Tracking system helps you monitor and reduce your environmental footprint by logging daily activities and calculating their carbon impact.

---

## 🚀 Getting Started

### 1. Access Carbon Tracking
Navigate to **Tracking** from the main menu.

### 2. Dashboard Overview
You'll see:
- **Monthly Footprint** - Total carbon emissions this month
- **Category Breakdown** - Transportation, Energy, Food, Waste
- **Recent Activities** - Your last 20 logged activities
- **Goals Progress** - Track towards your reduction targets

---

## ✍️ Logging Activities (Smart Mode)

The smart mode automatically calculates carbon impact based on real-world emission factors.

### Step-by-Step

#### 1. Select Category
Choose from:
- 🚗 **Transportation** (driving, public transit, biking, walking, flights)
- ⚡ **Energy** (electricity, gas, renewable energy)
- 🍽️ **Food** (meat, vegetables, dairy, grains)
- ♻️ **Waste** (landfill, recycling, composting)

#### 2. Select Activity Type
Examples for Transportation:
- Petrol Car (0.192 kg CO₂e per km)
- Diesel Car (0.171 kg CO₂e per km)
- Electric Car (0.053 kg CO₂e per km)
- Public Bus (0.089 kg CO₂e per km)
- Train/Metro (0.041 kg CO₂e per km)
- Bicycle (0 kg CO₂e)
- Walking (0 kg CO₂e)

#### 3. Enter Amount
- For transportation: Distance in km
- For energy: Consumption in kWh
- For food: Weight in kg
- For waste: Weight in kg

#### 4. Add Description (Optional)
Example: "Drove to work via highway"

#### 5. Submit
- Click **"Log Activity"**
- System calculates carbon impact automatically
- Rewards points based on impact and eco-friendliness
- Updates your streak if daily logging

---

## 🔢 Carbon Calculation Examples

### Transportation
```
Activity: Petrol Car, 15 km
Carbon Impact: 15 × 0.192 = 2.88 kg CO₂e
Points: 29 points
```

```
Activity: Bicycle, 5 km
Carbon Impact: 5 × 0 = 0 kg CO₂e (eco-friendly!)
Points: 10 points (2x eco bonus)
```

### Energy
```
Activity: Grid Electricity, 10 kWh
Carbon Impact: 10 × 0.233 = 2.33 kg CO₂e
Points: 23 points
```

```
Activity: Solar Energy, 10 kWh
Carbon Impact: 10 × 0 = 0 kg CO₂e
Points: 20 points (2x eco bonus)
```

### Food
```
Activity: Beef, 0.5 kg
Carbon Impact: 0.5 × 27 = 13.5 kg CO₂e
Points: 135 points
```

```
Activity: Vegetables, 1 kg
Carbon Impact: 1 × 2 = 2 kg CO₂e
Points: 20 points
```

### Waste
```
Activity: Landfill, 2 kg
Carbon Impact: 2 × 0.45 = 0.9 kg CO₂e
Points: 9 points
```

```
Activity: Recycled, 2 kg
Carbon Impact: 2 × (-0.15) = -0.3 kg CO₂e (saved!)
Points: 6 points (2x eco bonus)
```

---

## 📈 Understanding Your Data

### Carbon Impact
- **Positive (+)**: Carbon emitted (e.g., driving, eating meat)
- **Negative (-)**: Carbon saved/offset (e.g., recycling, renewable energy)
- **Goal**: Maximize negative impact, minimize positive

### Points System
```
Base Points = |carbon_impact| × 10

If eco-friendly (carbon_impact < 0):
  Points = Base Points × 2

Minimum: 2 points for tracking
```

### Levels
| Level | Points Required |
|-------|----------------|
| Eco Beginner | 0 - 99 |
| Eco Explorer | 100 - 499 |
| Eco Enthusiast | 500 - 999 |
| Eco Warrior | 1000 - 2499 |
| Eco Champion | 2500 - 4999 |
| Eco Legend | 5000+ |

---

## 🎯 Setting Goals

### Weekly Goals
1. Click **"Goals"** tab
2. Select **"Weekly"** goal type
3. Enter target carbon reduction (kg CO₂e)
4. Example: "Save 5 kg CO₂e this week"
5. Track progress in real-time

### Monthly Goals
1. Select **"Monthly"** goal type
2. Enter larger target (e.g., 20 kg CO₂e)
3. Monitor throughout the month

### Goal Tips
- Start small: 3-5 kg/week is realistic
- Increase gradually as you build habits
- Focus on one category at a time
- Review insights for suggestions

---

## 🔥 Streaks

### How Streaks Work
- Log at least 1 activity per day
- Streak increments if activity logged within 24 hours
- Resets if you miss a day
- Longer streaks = higher achievements

### Streak Benefits
- Unlocks achievements (7-day, 30-day)
- Motivation to stay consistent
- Shows commitment to sustainability

---

## 🏆 Achievements

### Available Achievements
- 🌱 **Eco Newbie** (10 pts): Log your first activity
- 🔥 **Week Warrior** (50 pts): 7-day streak
- ⭐ **Month Master** (150 pts): 30-day streak
- 💚 **Carbon Saver** (75 pts): Save 10kg CO₂e
- ♻️ **Recycling Hero** (100 pts): Recycle 50 items
- 🚴 **Commute Champion** (80 pts): 20 eco commutes

Achievements unlock automatically when criteria are met!

---

## 💡 Pro Tips

### 1. Be Consistent
- Log activities daily
- Set reminders
- Make it a habit

### 2. Be Accurate
- Use actual measurements when possible
- Round to nearest km/kWh/kg
- Add detailed descriptions

### 3. Track Everything
- Morning commute
- Meals (especially meat/dairy)
- Energy usage
- Waste disposal

### 4. Review Insights
- Check personalized tips
- Act on recommendations
- Adjust habits based on data

### 5. Compete with Yourself
- Beat last week's score
- Reduce carbon month-over-month
- Aim for higher levels

---

## 📊 Viewing Your History

### Activity Feed
- Shows last 20 activities
- Sorted by most recent
- Displays: Type, Description, Impact, Points, Date

### Filtering (Coming Soon)
- By category
- By date range
- By impact (positive vs negative)

### Exporting Data (Coming Soon)
- Download CSV
- Generate monthly reports
- Share progress

---

## 🌍 Environmental Context

### Tree Equivalency
```
1 tree absorbs ~21 kg CO₂ per year
Your 45 kg saved = 2.1 trees planted! 🌳
```

### Real-World Comparisons
- 1 kg CO₂e = Charging phone 121 times
- 10 kg CO₂e = 1 gallon of gasoline
- 100 kg CO₂e = Round-trip flight (short distance)

---

## 🔗 Related Features
- **[Insights Guide](./HOW_INSIGHTS_WORK.md)** - Personalized recommendations
- **[Goals & Achievements](./GOALS_ACHIEVEMENTS.md)** - Gamification details
- **[API Reference](./TRACKING_API.md)** - For developers

---

**Start tracking today and make every action count!** 🌱
