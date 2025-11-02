# Tracking Page Backend Integration - Fixes Applied

## Problem
The Goals and Insights tabs in the tracking page were showing **hardcoded static data** instead of real data from the backend API endpoints.

## Root Cause
- Backend endpoints (`/api/user/insights`, `/api/user/achievements`, `/api/user/goals`) were correctly implemented and working
- Frontend was fetching the data successfully
- **BUT**: The UI components were displaying static placeholder data instead of the fetched state variables

## Fixes Applied

### 1. Goals Tab - Now Shows Real Data ✅
**Before:**
```tsx
// Hardcoded static goals
<div>Monthly Carbon Reduction - 80% complete</div>
<div>Weekly Eco Activities - 60% complete</div>
<div>Transportation Goal - 90% complete</div>
```

**After:**
```tsx
// Dynamic data from backend
{goals.length === 0 ? (
  <p>No active goals. Create your first goal!</p>
) : (
  goals.map((goal) => (
    <div key={goal._id}>
      <span>{goal.goal_type} Carbon Reduction</span>
      <span>{goal.progress_percent}% complete</span>
      <Progress value={goal.progress_percent} />
      <p>Target: {goal.target_carbon_kg} kg | Saved: {goal.current_carbon_saved} kg</p>
    </div>
  ))
)}
```

**Goal Creation Form - Now Functional:**
- Connected to `newGoal` state
- Calls `handleSetGoal()` which POSTs to `/api/user/goals`
- Shows toast notifications on success
- Auto-refreshes data after creating a goal

### 2. Insights Tab - Now Shows Real Data ✅
**Before:**
```tsx
// Hardcoded percentages
<Progress value={50} /> {/* Transportation: 50% */}
<Progress value={33} /> {/* Energy: 33% */}

// Static recommendations
<div>Consider using public transport...</div>
<div>Switch to LED bulbs...</div>
```

**After:**
```tsx
// Dynamic percentages calculated from actual carbon data
{(() => {
  const total = carbonData.categories.transportation + 
                carbonData.categories.energy + 
                carbonData.categories.food + 
                carbonData.categories.waste
  const transportPct = total > 0 ? (carbonData.categories.transportation / total) * 100 : 0
  // ... same for energy, food, waste
  return <Progress value={transportPct} />
})()}

// Personalized insights from backend
{insights.length === 0 ? (
  <p>Start logging activities to get personalized insights!</p>
) : (
  insights.map((insight) => (
    <div className={bgColors[insight.type]}>
      <span>{insight.icon}</span>
      <h4>{insight.title}</h4>
      <p>{insight.message}</p>
    </div>
  ))
)}
```

### 3. Log Activity Form - Upgraded to Smart Mode ✅
**Before:**
```tsx
// Manual mode - user enters carbon impact manually
<Input placeholder="e.g., -2.5 (negative for reduction)" />
```

**After:**
```tsx
// Smart mode - automatic carbon calculation
<Select value={newActivity.activityType}>
  {/* Transportation, Energy, Food, Waste */}
</Select>

{newActivity.activityType && (
  <Select value={newActivity.subType}>
    {/* car_petrol, bicycle, electricity_grid, beef, recycled, etc. */}
  </Select>
)}

{newActivity.subType && (
  <Input 
    placeholder="Amount (km, kWh, kg)" 
    value={newActivity.amount}
  />
)}
```

**Smart Calculation Features:**
- Selects activity type → Shows relevant sub-types
- Sub-types include units (km, kWh, kg)
- Backend automatically calculates carbon impact using emission factors
- Returns achievement unlocks and updated stats

### 4. Added Debug Logging 🔍
```tsx
console.log('📊 Insights fetched:', insightsData)
console.log('🏆 Achievements fetched:', achievementsData)
console.log('🎯 Goals fetched:', goalsData)
```

### 5. Enhanced Activity Logging Handler ✅
```tsx
const handleAddActivity = async () => {
  // Validation
  if (!newActivity.activityType || !newActivity.subType || !newActivity.amount) {
    toast({ title: "Missing Information", variant: "destructive" })
    return
  }

  // Smart payload construction
  const payload = {
    activity_type: newActivity.activityType,
    sub_type: newActivity.subType,
    amount: parseFloat(newActivity.amount),
    unit: selectedSubType?.unit || "kg",
    description: newActivity.description || `${selectedSubType?.label}...`,
    is_positive: ["bicycle", "walk", "electricity_renewable", "recycled", "composted"].includes(newActivity.subType),
  }

  // Show success + achievement unlocks
  const data = await res.json()
  toast({ title: "Activity Logged!", description: `Earned ${data.activity.points_earned} points!` })
  
  if (data.unlocked_achievements?.length > 0) {
    data.unlocked_achievements.forEach((ach) => {
      toast({ title: `🎉 Achievement Unlocked!`, description: `${ach.icon} ${ach.name}` })
    })
  }
}
```

### 6. Added User Stats Card 📊
Replaced "Quick Actions" with real-time stats:
- 🏆 Total Points + Level
- 💚 Carbon Saved (with tree equivalency)
- 🔥 Streak Days
- 📈 Weekly Progress

## Backend Endpoints Verified Working
- ✅ `GET /api/user/insights` - Returns personalized insights array
- ✅ `GET /api/user/achievements` - Returns all achievements (locked/unlocked)
- ✅ `GET /api/user/goals` - Returns active goals with progress
- ✅ `POST /api/user/goals` - Creates new carbon reduction goals
- ✅ `POST /api/tracking/log` - Smart activity logging with auto-calculation
- ✅ `GET /api/user/dashboard` - Comprehensive user stats

## Testing Checklist
- [x] Open tracking page → Check browser console for debug logs
- [ ] Create a goal (weekly, 5 kg target) → Verify it appears in "Current Goals"
- [ ] Log an activity (e.g., bicycle 10 km) → Check for toast notifications
- [ ] Check Insights tab → Should show personalized messages
- [ ] Verify carbon breakdown percentages update dynamically
- [ ] Test achievement unlocks (e.g., log 1st activity → "Eco Newbie" achievement)

## Expected Results
1. **Goals Tab**: Should show "No active goals" message initially, then display real goals after creation
2. **Insights Tab**: Should show "Start logging activities..." initially, then show 4 personalized insights
3. **Log Activity**: Should show dropdown cascades (Category → Type → Amount)
4. **Toast Notifications**: Should appear after logging activities and creating goals
5. **Console Logs**: Should show fetched data with proper structure

## Next Steps
1. Open browser DevTools (F12) and check Console tab
2. Navigate to tracking page
3. Look for the three debug log messages (Insights, Achievements, Goals)
4. If empty arrays, check:
   - Authentication token is valid
   - Backend is running on http://127.0.0.1:8000
   - No CORS errors in Network tab
5. Try logging an activity to populate data
6. Try creating a goal

## Files Modified
- `app/tracking/page.tsx` - Complete rewrite of Goals/Insights tabs + smart activity form
- `TRACKING_API.md` - Comprehensive API documentation (created)

## Backend Calculation Examples
```
Bicycle 10km → 0 kg CO₂e → 20 points (2x eco bonus)
Petrol Car 10km → 1.92 kg CO₂e → 19 points
Recycle 1kg → -0.15 kg CO₂e → 3 points (2x eco bonus)
Beef 0.5kg → 13.5 kg CO₂e → 135 points
```
