# 📋 HHA System Todos & Investigation Report

This file documents the investigation and resolutions for the UI/UX, responsive layout, and backend payload issues reported on June 28, 2026.

---

## 1. ⚠️ Damaged (التالف) Database & Stock Errors

### ❌ Issue A: Database Not-Null Constraint Violation
* **Error**: `فشل في تسجيل التالف: null value in column "variant_id_1" of relation "damaged_records" violates not-null constraint`
* **Investigation**: When submitting a damaged plastic roll, the code searched the selected roll in `lookups.rolls` (populated by `v_rolls` view). However, `v_rolls` does not include `width_id` or `type_id` properties. They came back `undefined`, violating the database constraint.
* **Resolution**: Fixed in [Damaged.jsx](file:///home/zet8/HHA/hha-sys/src/components/storage/Damaged.jsx). The code now dynamically looks up the correct `width_id` and `type_id` using the fetched `lookups.widths` and `lookups.types` collections by matching `width` and `type_name` values.
* **Status**: **✅ RESOLVED**

### ❌ Issue B: Incorrect Available Stock Indicators
* **Error**: `📦 الرصيد الحالي المتوفر في المخزن` was returning `0` or showing incorrect values for pipes, liquids, and inks.
* **Investigation**: Similar to rolls, the database views `v_pipes`, `v_liquids`, and `v_inks` do not return raw database reference keys (such as `length_id`, `type_id`, `company_id`, or `color_id`). Thus, `.find()` matching on these ID keys failed and defaulted stock to `0`.
* **Resolution**: Updated [Damaged.jsx](file:///home/zet8/HHA/hha-sys/src/components/storage/Damaged.jsx) stock resolution logic to resolve lookups by matching labels and names (e.g. comparing type names and length values) instead of raw IDs.
* **Status**: **✅ RESOLVED**

---

## 2. 🎨 UI/UX & Theme Refinements

### ❌ Issue C: Form Modal UI is Still Dark
* **Investigation**: `.form-modal` styles and their corresponding sections had hardcoded dark background values (e.g., `rgba(17, 24, 39, 0.97)` and `rgba(30, 41, 59, 0.4)`).
* **Resolution**: Updated [App.css](file:///home/zet8/HHA/hha-sys/src/App.css) modal classes (`.form-modal`, `.form-modal-header`, `.form-modal-footer`, and `.form-card-section`) to use light-theme CSS variables (`var(--bg-card)`, `var(--bg-elevated)`, `var(--border)`).
* **Status**: **✅ RESOLVED**

### ❌ Issue D: Toggle Slider Invisible When Off
* **Investigation**: The slider background used `rgba(255, 255, 255, 0.12)`, which renders as pure white overlay and is invisible on a white background.
* **Resolution**: Updated `.toggle-slider` in [App.css](file:///home/zet8/HHA/hha-sys/src/App.css) to use a light-gray color (`#cbd5e1`) when turned off.
* **Status**: **✅ RESOLVED**

### ❌ Issue E: Dark Gradient in `.prepared-canvas`
* **Investigation**: The canvas backdrop used a gradient descending into dark charcoal `#0d111766`.
* **Resolution**: Refactored `.prepared-canvas` in [App.css](file:///home/zet8/HHA/hha-sys/src/App.css) to fade from very light brand blue (`rgba(65, 94, 177, 0.04)`) to soft slate (`rgba(241, 245, 249, 0.5)`).
* **Status**: **✅ RESOLVED**

---

## 3. 📱 Responsive Layout & Table Clipping

### ❌ Issue F: Actions/Buttons Cut Off in Orders Table
* **Error**: The "▼ عرض" and print buttons were hidden or inaccessible on medium/small screen sizes.
* **Investigation**: `.orders-table-wrapper` was styled with `overflow: hidden;`. Any columns exceeding the viewport width were clipped.
* **Resolution**: Changed the style in [App.css](file:///home/zet8/HHA/hha-sys/src/App.css) to `overflow-x: auto;`. The table now features smooth horizontal swipe-scrolling on compact/mobile layouts.
* **Status**: **✅ RESOLVED**

---

## 4. 🏷️ Branding & Header Cleanups

### ❌ Issue G: Topbar Background Should Be White
* **Resolution**: Changed `.app-topbar` background in [App.css](file:///home/zet8/HHA/hha-sys/src/App.css) from semi-transparent black to `#FFFFFF`.
* **Status**: **✅ RESOLVED**

### ❌ Issue H: Remove "topbar-title" and "sidebar-brand-name"
* **Resolution**: Removed the text tags `<span className="topbar-title">` from [App.jsx](file:///home/zet8/HHA/hha-sys/src/App.jsx) and `<span className="sidebar-brand-name">` from [Sidebar.jsx](file:///home/zet8/HHA/hha-sys/src/components/common/Sidebar.jsx).
* **Status**: **✅ RESOLVED**

### ❌ Issue I: App Logo in Topbar Needs to Be Bigger
* **Resolution**: Enlarged the logo size inside [App.jsx](file:///home/zet8/HHA/hha-sys/src/App.jsx) from `32px` to `44px` height and width.
* **Status**: **✅ RESOLVED**
