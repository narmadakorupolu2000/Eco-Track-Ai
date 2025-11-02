# Requirements Files Structure

This project uses multiple requirements files for better organization and clarity.

## 📋 Files Overview

### 1. `package.json` ✅ **COMMITTED**
- **Purpose:** Official npm dependencies for frontend
- **Used by:** Node.js, npm, pnpm, yarn
- **Installation:** `npm install`
- **Location:** Project root

### 2. `backend-requirements.txt` ✅ **COMMITTED**
- **Purpose:** Python dependencies for backend
- **Used by:** pip (Python package manager)
- **Installation:** `pip install -r backend-requirements.txt`
- **Location:** Project root

### 3. `frontend-requirements.txt` ✅ **COMMITTED**
- **Purpose:** Documentation/reference for frontend dependencies
- **Used by:** Developers (reference only)
- **Note:** Mirrors `package.json` in readable format
- **Location:** Project root

### 4. `requirements.txt` ✅ **COMMITTED**
- **Purpose:** Backward compatibility for old installations
- **Used by:** Legacy scripts, Docker, etc.
- **Installation:** `pip install -r requirements.txt`
- **Note:** Same as `backend-requirements.txt`
- **Location:** Project root

### 5. `all-requirements.txt` ❌ **NOT COMMITTED**
- **Purpose:** Combined reference for entire project
- **Used by:** Documentation, onboarding new developers
- **Note:** Listed in `.gitignore`, generated locally only
- **Location:** Project root

---

## 🎯 Which File to Use?

### For Frontend Development:
```bash
npm install                    # Uses package.json
```

### For Backend Development:
```bash
pip install -r backend-requirements.txt    # Recommended
# or
pip install -r requirements.txt            # Legacy/backward compatible
```

### For Documentation:
- **Frontend:** See `frontend-requirements.txt` or `package.json`
- **Backend:** See `backend-requirements.txt` or `requirements.txt`
- **Both:** See `all-requirements.txt` (if generated locally)

---

## 🔧 Maintenance

### Adding a New Frontend Dependency:
1. Install with npm: `npm install <package>`
2. Update `frontend-requirements.txt` manually (for documentation)
3. Update `all-requirements.txt` if needed (local only)

### Adding a New Backend Dependency:
1. Install with pip: `pip install <package>`
2. Update `backend-requirements.txt`: `pip freeze | grep <package> >> backend-requirements.txt`
3. Update `requirements.txt` (keep in sync)
4. Update `all-requirements.txt` if needed (local only)

### Generating `all-requirements.txt`:
```bash
# This file is not committed to git
# Generate locally for reference:
cat frontend-requirements.txt backend-requirements.txt > all-requirements.txt
```

---

## 📦 Deployment

### Netlify (Frontend):
- Automatically uses `package.json`
- No additional configuration needed

### Render (Backend):
- Uses `requirements.txt` by default
- Can be configured to use `backend-requirements.txt` in build settings

### Docker:
- Current `Dockerfile` uses `requirements.txt`
- Can be updated to use `backend-requirements.txt`

---

## 🚫 .gitignore Rules

```gitignore
# Commit these:
package.json ✅
backend-requirements.txt ✅
frontend-requirements.txt ✅
requirements.txt ✅

# Do NOT commit:
all-requirements.txt ❌
```

**Why?** The `all-requirements.txt` file is a local reference that combines both frontend and backend requirements. It can become outdated quickly and is not needed for deployment.

---

## 📚 Additional Resources

- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **API Documentation:** `docs/TRACKING_API.md`
- **Main README:** `README.md`
