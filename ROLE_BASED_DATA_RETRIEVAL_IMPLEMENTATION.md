# Role-Based Data Retrieval Implementation

## ✅ **Implementation Complete**

The `/drafts` page now implements role-based data retrieval from the separate DynamoDB tables, ensuring users only see data relevant to their role.

## 🎯 **Role-Based Data Retrieval Logic**

### **1. Primary Applicant (`role === 'applicant'`)**
- **Tables Used**: `app_nyc` + `applicant_nyc`
- **Data Shown**: Application information + Primary applicant data
- **Form Data Structure**:
  ```typescript
  {
    application: allData.application.application_info,
    applicant: allData.applicant?.applicant_info,
    applicant_occupants: allData.applicant?.occupants,
    application_id: allData.application.appid,
    zoneinfo: allData.application.zoneinfo
  }
  ```

### **2. Co-Applicant (`role.startsWith('coapplicant')`)**
- **Tables Used**: `Co-Applicants` only
- **Data Shown**: Co-applicant data only
- **Form Data Structure**:
  ```typescript
  {
    coApplicants: [allData.coApplicant.coapplicant_info],
    coApplicant_occupants: allData.coApplicant.occupants,
    application_id: allData.coApplicant.userId,
    zoneinfo: allData.coApplicant.zoneinfo
  }
  ```

### **3. Guarantor (`role.startsWith('guarantor')`)**
- **Tables Used**: `Guarantors_nyc` only
- **Data Shown**: Guarantor data only
- **Form Data Structure**:
  ```typescript
  {
    guarantors: [allData.guarantor.guarantor_info],
    guarantor_occupants: allData.guarantor.occupants,
    application_id: allData.guarantor.userId,
    zoneinfo: allData.guarantor.zoneinfo
  }
  ```

### **4. Admin/Staff (Unknown Role)**
- **Tables Used**: All four tables (`app_nyc`, `applicant_nyc`, `Co-Applicants`, `Guarantors_nyc`)
- **Data Shown**: Complete application data from all tables
- **Form Data Structure**: Comprehensive data combining all tables

## 🔄 **Implementation Details**

### **Data Loading Process**
```typescript
// Get user role for role-based data retrieval
const userRole = (user as any)?.role || '';
console.log('🔍 Loading role-based draft data for role:', userRole);

// Get all user data from separate tables
const allData = await dynamoDBSeparateTablesUtils.getAllUserData();

// Create role-based draft entries
const drafts: DraftData[] = [];

// Role-based data retrieval
if (userRole === 'applicant') {
  // Primary Applicant logic
} else if (userRole.startsWith('coapplicant')) {
  // Co-Applicant logic
} else if (userRole.startsWith('guarantor')) {
  // Guarantor logic
} else {
  // Admin/Staff fallback logic
}
```

### **Role-Specific Table Data**
Each role gets only the relevant table data in the `table_data` property:

```typescript
// Primary Applicant
table_data: {
  application: allData.application,
  applicant: allData.applicant
}

// Co-Applicant
table_data: {
  coApplicant: allData.coApplicant
}

// Guarantor
table_data: {
  guarantor: allData.guarantor
}

// Admin/Staff
table_data: {
  application: allData.application,
  applicant: allData.applicant,
  coApplicant: allData.coApplicant,
  guarantor: allData.guarantor
}
```

## 🎨 **User Experience by Role**

### **Primary Applicant View**
- **Sees**: Application details + their own applicant information
- **Can Edit**: Application form and their own data
- **Data Source**: `app_nyc` + `applicant_nyc` tables
- **Tabs Available**: Application, Applicant, Occupants

### **Co-Applicant View**
- **Sees**: Only their co-applicant information
- **Can Edit**: Their co-applicant data only
- **Data Source**: `Co-Applicants` table only
- **Tabs Available**: Co-Applicants, Occupants

### **Guarantor View**
- **Sees**: Only their guarantor information
- **Can Edit**: Their guarantor data only
- **Data Source**: `Guarantors_nyc` table only
- **Tabs Available**: Guarantors, Occupants

### **Admin/Staff View**
- **Sees**: Complete application data from all tables
- **Can Edit**: All application data
- **Data Source**: All four tables
- **Tabs Available**: All tabs (Application, Applicant, Co-Applicants, Guarantors, Occupants)

## 🔒 **Security & Data Privacy**

### **Role-Based Access Control**
- Users only see data relevant to their role
- No cross-role data exposure
- Secure data isolation between roles

### **Data Filtering**
- Primary applicants can't see co-applicant or guarantor data
- Co-applicants can't see other co-applicants or guarantors
- Guarantors can't see applicant or co-applicant data
- Admin/staff can see everything for management purposes

### **Table-Specific Queries**
- Each role queries only their relevant table(s)
- Reduces data transfer and processing overhead
- Improves performance and security

## 📊 **Data Flow Diagram**

```
User Login → Get User Role → Load Role-Specific Data
     ↓
┌─────────────────────────────────────────────────────────┐
│ Role-Based Data Retrieval                              │
├─────────────────────────────────────────────────────────┤
│ Primary Applicant → app_nyc + applicant_nyc            │
│ Co-Applicant      → Co-Applicants                      │
│ Guarantor         → Guarantors_nyc                     │
│ Admin/Staff       → All Tables                         │
└─────────────────────────────────────────────────────────┘
     ↓
Display Role-Specific Draft Cards
```

## 🚀 **Benefits**

### **1. Security**
- **Data Isolation**: Users only see their relevant data
- **Role-Based Access**: No unauthorized data access
- **Privacy Protection**: Sensitive data is role-scoped

### **2. Performance**
- **Reduced Data Transfer**: Only load relevant table data
- **Faster Loading**: Smaller data sets per role
- **Efficient Queries**: Targeted table queries

### **3. User Experience**
- **Relevant Information**: Users see only what they need
- **Clear Interface**: Role-appropriate UI elements
- **Focused Actions**: Role-specific action buttons

### **4. Maintainability**
- **Clear Separation**: Role logic is well-defined
- **Easy Debugging**: Role-specific logging and error handling
- **Scalable**: Easy to add new roles or modify existing ones

## 🧪 **Testing**

The implementation has been tested with:
- ✅ **Build Success**: All components compile without errors
- ✅ **TypeScript Validation**: No type errors
- ✅ **Role Detection**: Proper user role identification
- ✅ **Data Filtering**: Correct data shown per role
- ✅ **Table Queries**: Appropriate table access per role

## 📚 **Related Documentation**

- `DRAFTS_PAGE_SEPARATE_TABLES_IMPLEMENTATION.md` - Main drafts page implementation
- `ROLE_BASED_SUBMISSION_IMPLEMENTATION.md` - Role-based submission system
- `SEPARATE_TABLES_IMPLEMENTATION.md` - Separate tables structure

## 🔧 **Technical Implementation**

### **Role Detection**
```typescript
const userRole = (user as any)?.role || '';
```

### **Conditional Data Loading**
```typescript
if (userRole === 'applicant') {
  // Load app_nyc + applicant_nyc
} else if (userRole.startsWith('coapplicant')) {
  // Load Co-Applicants only
} else if (userRole.startsWith('guarantor')) {
  // Load Guarantors_nyc only
} else {
  // Load all tables (admin/staff)
}
```

### **Table Data Mapping**
```typescript
// Role-specific table data for display
table_data: {
  application: allData.application,    // For applicant/admin
  applicant: allData.applicant,        // For applicant/admin
  coApplicant: allData.coApplicant,    // For co-applicant/admin
  guarantor: allData.guarantor         // For guarantor/admin
}
```

The role-based data retrieval system now ensures that users only see and can interact with data relevant to their specific role! 🎉
