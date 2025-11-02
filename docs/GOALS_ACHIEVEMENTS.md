# 🏆 Goals & Achievements Guide

## Overview
The gamification system motivates sustainable behavior through goals, achievements, streaks, points, and levels.

---

## 🎯 Goals System

### Setting Goals

#### Weekly Goals
**Purpose:** Short-term carbon reduction targets

**How to Set:**
1. Go to Tracking → Goals tab
2. Click "Set New Goal"
3. Select "Weekly" type
4. Enter target (e.g., 5 kg CO₂e)
5. Click "Create Goal"

**Recommended Targets:**
- Beginner: 3-5 kg/week
- Intermediate: 5-10 kg/week
- Advanced: 10+ kg/week

**Period:** Monday 00:00 - Sunday 23:59

#### Monthly Goals
**Purpose:** Long-term carbon reduction targets

**Recommended Targets:**
- Beginner: 15-20 kg/month
- Intermediate: 20-40 kg/month
- Advanced: 40+ kg/month

**Period:** 1st of month 00:00 - Last day 23:59

### Tracking Progress

Goals display:
- **Target:** Total carbon to save (kg CO₂e)
- **Current:** Carbon saved so far
- **Progress %:** Visual progress bar
- **Remaining:** How much more to achieve goal

**Example:**
```
Weekly Goal: Save 5 kg CO₂e
Current Saved: 4.2 kg
Progress: 84%
Remaining: 0.8 kg
```

### Goal Notifications

You'll get insights when:
- ✅ **80%+ progress:** "Goal Almost Reached!"
- ✅ **100% complete:** "Goal Achieved! Set a new one!"
- ⚠️ **<50% mid-week:** "Increase eco-activities to reach goal"

---

## 🏅 Achievements System

### How Achievements Work

1. **Criteria-Based Unlocking**
   - Each achievement has specific criteria
   - System checks after every activity log
   - Auto-unlocks when criteria met
   - Rewards bonus points

2. **One-Time Unlocks**
   - Can't lose once earned
   - Permanent on profile
   - Shows unlock date

3. **Notification**
   - Toast notification appears
   - Shows achievement icon, name, description
   - Awards bonus points instantly

---

## 🎖️ Available Achievements

### 1. 🌱 Eco Newbie
**Description:** Logged your first activity
**Criteria:** `activities_count >= 1`
**Bonus Points:** 10
**Difficulty:** ⭐☆☆☆☆

**How to Unlock:**
- Log any activity (transportation, energy, food, or waste)
- Unlocks immediately on first log

---

### 2. 🔥 Week Warrior
**Description:** 7-day tracking streak
**Criteria:** `streak_days >= 7`
**Bonus Points:** 50
**Difficulty:** ⭐⭐⭐☆☆

**How to Unlock:**
- Log at least 1 activity every day for 7 consecutive days
- Streak resets if you miss a day

**Tips:**
- Set daily reminders
- Log morning commute consistently
- Track before bed if you forgot

---

### 3. ⭐ Month Master
**Description:** 30-day tracking streak
**Criteria:** `streak_days >= 30`
**Bonus Points:** 150
**Difficulty:** ⭐⭐⭐⭐☆

**How to Unlock:**
- Maintain daily logging for 30 days straight
- Most challenging achievement

**Tips:**
- Build habit first with Week Warrior
- Use calendar reminders
- Track multiple activities daily as backup

---

### 4. 💚 Carbon Saver
**Description:** Saved 10kg CO₂e
**Criteria:** `carbon_saved >= 10`
**Bonus Points:** 75
**Difficulty:** ⭐⭐⭐☆☆

**How to Unlock:**
- Accumulate 10 kg of negative carbon impact
- Focus on eco-friendly activities:
  - Biking instead of driving
  - Recycling waste
  - Using renewable energy
  - Eating plant-based meals

**Quick Math:**
```
Bike 5km daily (vs driving) = 0.96 kg/day saved
10 days of biking = 9.6 kg → Achievement!
```

---

### 5. ♻️ Recycling Hero
**Description:** Recycled 50 items
**Criteria:** `items_recycled >= 50`
**Bonus Points:** 100
**Difficulty:** ⭐⭐⭐⭐☆

**How to Unlock:**
- Log 50+ waste activities with "recycled" sub-type
- Each recycled item counts (bottles, cans, paper, etc.)

**Tracking Tips:**
- Log daily recycling
- Count items individually
- Use waste classifier for verification

---

### 6. 🚴 Commute Champion
**Description:** Used eco transport 20 times
**Criteria:** `eco_commutes >= 20`
**Bonus Points:** 80
**Difficulty:** ⭐⭐⭐☆☆

**How to Unlock:**
- Log 20 activities with eco-friendly transportation:
  - Bicycle
  - Walking
  - Public Bus
  - Train/Metro

**Example Timeline:**
```
Daily bike commute (to work + back) = 2 eco commutes
10 work days = 20 commutes → Achievement!
```

---

## 📊 Points System

### Earning Points

**Base Formula:**
```
Points = |carbon_impact| × 10
```

**Eco Bonus (2x Multiplier):**
```
If carbon_impact < 0:
  Points = Base Points × 2
```

**Minimum:** 2 points per activity (for tracking effort)

### Points Examples

| Activity | Carbon Impact | Base Points | Eco Bonus | Final Points |
|----------|---------------|-------------|-----------|--------------|
| Drive 10km | +1.92 kg | 19 | No | **19** |
| Bike 5km | 0 kg | 0 | Yes | **10** (2x of 5) |
| Recycle 1kg | -0.15 kg | 2 | Yes | **3** (2x of 1.5) |
| Beef 0.5kg | +13.5 kg | 135 | No | **135** |
| Vegetables 1kg | +2 kg | 20 | No | **20** |

### Points Uses

Points contribute to:
1. **Level Progression** - Unlock higher levels
2. **Leaderboards** (Coming Soon) - Compete with others
3. **Rewards** (Future) - Redeem for eco-products

---

## 📈 Levels System

### Level Tiers

| Level | Points Required | Badge |
|-------|----------------|-------|
| **Eco Beginner** | 0 - 99 | 🌱 |
| **Eco Explorer** | 100 - 499 | 🔍 |
| **Eco Enthusiast** | 500 - 999 | 💚 |
| **Eco Warrior** | 1000 - 2499 | ⚔️ |
| **Eco Champion** | 2500 - 4999 | 🏆 |
| **Eco Legend** | 5000+ | 👑 |

### Level Benefits

**Current:**
- Status display on profile
- Personalized insights
- Bragging rights!

**Coming Soon:**
- Exclusive achievements
- Bonus multipliers
- Premium features
- Community recognition

### Level-Up Strategy

**Fast Track (High Activity):**
```
Log 5-10 activities daily
Mix of high-impact (food) + eco-friendly (transport)
Aim for Eco Explorer in 1 week
```

**Steady Progress (Sustainable):**
```
Log 2-3 activities daily
Focus on consistency over quantity
Eco Enthusiast in 1 month
```

---

## 🔥 Streak System

### How Streaks Work

**Increment Criteria:**
- Log at least 1 activity today
- AND logged at least 1 activity yesterday

**Reset:**
- If 24+ hours pass without logging

**Visual Indicator:**
- 🔥 Fire emoji
- Streak count display
- Progress tracking

### Streak Milestones

| Days | Achievement | Bonus Points |
|------|-------------|--------------|
| 7 | Week Warrior | +50 |
| 30 | Month Master | +150 |
| 100 (Future) | Century Streak | +500 |
| 365 (Future) | Year Legend | +2000 |

### Maintaining Streaks

**Best Practices:**
1. ⏰ **Set Reminders** - Daily notification
2. 🌅 **Morning Routine** - Log breakfast or commute
3. 🌙 **Evening Backup** - Log before bed if forgot
4. 📱 **Mobile Friendly** - Access anywhere
5. 🔄 **Multiple Activities** - Track throughout day

**Recovery Tips:**
- Missed a day? Start fresh immediately
- Don't get discouraged
- Focus on new streak
- Learn from patterns

---

## 📊 Achievement Dashboard

### Viewing Achievements

**Location:** Dashboard → Achievements Section

**Display:**
- ✅ **Unlocked** - Green checkmark, unlock date, earned points
- 🔒 **Locked** - Gray, shows criteria, progress towards unlock

**Sorting:**
- By unlock date (newest first)
- By difficulty
- By category

---

## 🎮 Gamification Strategy Guide

### For Maximum Points

1. **Focus on High-Impact Activities**
   - Food tracking (meat = high points)
   - Long-distance transport
   - High energy usage

2. **Balance with Eco-Friendly**
   - Get 2x multiplier
   - Sustainable long-term

3. **Consistency > Intensity**
   - Daily streaks add up
   - Achievement bonuses compound

### For Maximum Impact (Eco-Focused)

1. **Prioritize Negative Carbon**
   - Bicycle everywhere
   - Recycle everything
   - Renewable energy

2. **Set Realistic Goals**
   - Start small (3-5 kg/week)
   - Increase gradually

3. **Track Eco Swaps**
   - Log BOTH old + new habit
   - See difference visually

---

## 🏁 Quick Start Guide

**Week 1: Build Habit**
1. Log daily commute (even if driving)
2. Track 1 meal per day
3. Log waste disposal
4. **Goal:** Eco Newbie + consistent logging

**Week 2: Eco Swaps**
1. Bike 1-2 days instead of driving
2. Try plant-based meal
3. Recycle everything possible
4. **Goal:** Week Warrior achievement

**Month 1: Optimization**
1. Set weekly goal (5 kg)
2. Review insights
3. Focus on biggest impact category
4. **Goal:** Eco Explorer level

**Month 2+: Mastery**
1. Set monthly goal (20 kg)
2. Unlock all achievements
3. Aim for Eco Enthusiast
4. **Goal:** Sustainable lifestyle!

---

## 🔗 Related Features
- **[Carbon Tracking](./CARBON_TRACKING.md)** - Log activities
- **[Insights Guide](./HOW_INSIGHTS_WORK.md)** - Get recommendations
- **[Dashboard](./DASHBOARD.md)** - View stats

---

**Start your journey to Eco Legend today!** 🌱👑
