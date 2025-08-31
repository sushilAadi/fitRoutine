# Mentor Detail Page Design

## Overview
The mentor detail page provides a comprehensive interface for users to browse and enroll with fitness instructors/coaches. It features a card-based carousel design with detailed mentor profiles and enrollment management.

## File Structure
```
mentors/
├── page.jsx                    # Main mentors listing page
└── README.md                   # This documentation
```

## Components Breakdown

### Main Page (`page.jsx`)
- **Component**: `Coaches` (main component)
- **Purpose**: Displays a list of approved mentors in a carousel format
- **Key Features**:
  - Fetches mentors from Firebase Firestore
  - Filters out mentors with "pending" status
  - Responsive design with sticky header
  - Loading states and error handling

### Related Components

#### MentorContent (`/components/Card/MentorContent.jsx`)
- **Purpose**: Main content container for mentor details
- **Features**:
  - Enrollment status management
  - Payment integration
  - Dynamic pricing options (hourly, monthly, quarterly, half-yearly, yearly)
  - User role-based access control

#### MentorProfile (`/components/Card/MentorProfile.jsx`)
- **Purpose**: Displays mentor's profile image and basic info
- **Features**:
  - Hero image with overlay gradient
  - Star rating based on experience years
  - Navigation back button
  - Responsive image handling

#### MentorDetail (`/components/Card/MentorDetail.jsx`)
- **Purpose**: Shows detailed mentor information in grid format
- **Features**:
  - Languages spoken
  - Qualifications
  - Training locations
  - Certification images carousel
  - 2x4 responsive grid layout

#### AppleCardsCarouselDemo (`/components/Card/AppleCardsCarouselDemo.jsx`)
- **Purpose**: Card carousel wrapper component
- **Features**:
  - Smooth horizontal scrolling
  - Card-based layout
  - Dynamic title support

## Design Patterns

### Color Scheme
- **Primary Background**: `bg-tprimary` (dark theme)
- **Card Background**: `bg-gray-800` (dark gray cards)
- **Text Colors**: White primary text, `text-gray-400` for labels
- **Accent Colors**: 
  - Green for active enrollments
  - Yellow for pending enrollments
  - Blue for paid pending
  - Red for blocked enrollments

### Layout Structure
```
┌─────────────────────────────────────┐
│ Sticky Header                       │
│ "Choose your Instructor"            │
├─────────────────────────────────────┤
│ Scrollable Carousel Area            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Mentor  │ │ Mentor  │ │ Mentor  ││
│ │ Card 1  │ │ Card 2  │ │ Card 3  ││
│ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

### Card Detail Layout
```
┌─────────────────────────────────────┐
│ Profile Image (Hero)                │
│ ┌─────────────────────────────────┐ │
│ │ Name & Rating (Overlay)         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Details Grid (2x2 on mobile, 4x1 desktop)
│ ┌──────────┐ ┌──────────┐          │
│ │Languages │ │Qualific. │          │
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │Locations │ │ Certifs  │          │
│ └──────────┘ └──────────┘          │
├─────────────────────────────────────┤
│ Enrollment Section                  │
│ (Dynamic based on user status)      │
└─────────────────────────────────────┘
```

## Data Model

### Mentor Object Structure
```javascript
{
  id: "string",                    // Firestore document ID
  name: "string",                  // Mentor name
  profileImage: "string",          // Profile image URL
  userIdCl: "string",             // Clerk user ID
  status: "approved|pending",      // Approval status
  experience_years: "number",      // Years of experience
  languages: [                    // Languages spoken
    { label: "string", value: "string" }
  ],
  qualifications: [               // Professional qualifications
    { label: "string", value: "string" }
  ],
  trainingLocations: [            // Available training locations
    { label: "string", value: "string" }
  ],
  certificationImages: ["string"], // Array of certification image URLs
  hourly_rate: "number",          // Pricing options
  monthly_rate: "number",
  quarterly_rate: "number",
  half_yearly_rate: "number",
  yearly_rate: "number",
  availabilityDays: [             // Available days
    { label: "string", value: "string" }
  ],
  availabilityHours: [            // Available time slots
    { label: "string", value: "string" }
  ]
}
```

## Enrollment States

### User Enrollment Status
1. **No Enrollment**: Shows enrollment form
2. **Pending Request**: Shows yellow status with cancel option
3. **Paid Pending**: Shows blue status waiting for mentor approval
4. **Active with Same Mentor**: Shows green confirmation
5. **Active with Different Mentor**: Shows red blocking message

### Security Features
- **SecureComponent**: Wraps entire page for authentication
- **Role-based Access**: Different UI based on user role
- **Enrollment Validation**: Prevents multiple active enrollments
- **Firebase Security**: Uses Firestore security rules

## Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: Uses Tailwind's responsive prefixes
- **Scrolling**: No-scrollbar class for clean mobile experience
- **Grid Layout**: Adapts from 2 columns on mobile to 4 on desktop

## State Management
- **Global Context**: Uses React Context for user data
- **Local State**: Component-level state for UI interactions
- **Loading States**: Proper loading indicators throughout
- **Error Handling**: Toast notifications for user feedback

## Performance Considerations
- **Lazy Loading**: Images load as needed
- **Efficient Queries**: Firestore queries optimized with filters
- **Minimal Re-renders**: Proper useEffect dependencies
- **Carousel Optimization**: Smooth scrolling with minimal DOM manipulation