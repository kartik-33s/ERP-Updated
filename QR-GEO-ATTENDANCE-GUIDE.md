# QR & Geo-Enabled Attendance System - Complete Guide

## Overview

This system enhances the College ERP with QR code-based attendance tracking combined with GPS location verification to prevent proxy attendance. Teachers generate unique QR codes for each class session, and students scan them while their location is verified against the classroom boundary.

## Features

### 🎯 Core Features
- **QR Code Generation**: Teachers generate unique 8-character session codes
- **Geo-Fencing**: Location verification within configurable radius (default 100m)
- **Real-time Validation**: Instant attendance marking with location checks
- **Detailed Logging**: Complete audit trail with timestamps, locations, and device info
- **Session Management**: Time-limited sessions with automatic expiration
- **Security**: Prevents proxy attendance through GPS verification

### 🔒 Security Features
- Location verification using Haversine formula for accurate distance calculation
- Device fingerprinting (user agent, platform, screen resolution)
- IP address logging
- Session expiration (configurable, default 15 minutes)
- Section-based access control
- Duplicate attendance prevention

## Database Setup

### Step 1: Run the SQL Script

Copy and paste the entire content of `supabase-qr-geo-attendance.sql` into your Supabase SQL Editor and click "RUN".

This creates:
- `attendance_sessions` table - Stores QR session data
- `attendance_logs` table - Detailed attendance attempt logs
- Helper functions for distance calculation and attendance marking
- Row Level Security (RLS) policies

### Key Tables

#### attendance_sessions
```sql
- id: UUID (Primary Key)
- lecture_id: UUID (Foreign Key to lectures)
- teacher_id: UUID (Foreign Key to profiles)
- session_code: TEXT (Unique 8-character code)
- subject, section, lecture_date, lecture_time, lecture_number
- latitude, longitude, radius_meters (Geo-fencing data)
- starts_at, expires_at (Session timing)
- is_active: BOOLEAN
```

#### attendance_logs
```sql
- id: UUID (Primary Key)
- session_id: UUID (Foreign Key to attendance_sessions)
- student_id: UUID (Foreign Key to profiles)
- attendance_id: UUID (Foreign Key to attendance)
- student_latitude, student_longitude (Student's location)
- distance_meters (Calculated distance from classroom)
- location_verified: BOOLEAN
- device_info: JSONB (Device fingerprint)
- ip_address, user_agent
- status: TEXT (present/late/rejected)
- rejection_reason: TEXT
- marked_at: TIMESTAMPTZ
```

## API Endpoints

### 1. Create QR Session
**POST** `/api/qr-session/create`

```json
{
  "subject": "Data Structures",
  "section": "A",
  "lectureDate": "2024-03-15",
  "lectureTime": "09:15",
  "lectureNumber": 1,
  "latitude": 12.9716,
  "longitude": 77.5946,
  "radiusMeters": 100,
  "durationMinutes": 15
}
```

Response:
```json
{
  "success": true,
  "session": {
    "session_id": "uuid",
    "session_code": "ABC12345",
    "lecture_id": "uuid"
  }
}
```

### 2. Get Active Session
**GET** `/api/qr-session/active`

Response:
```json
{
  "success": true,
  "session": {
    "session_id": "uuid",
    "session_code": "ABC12345",
    "subject": "Data Structures",
    "section": "A",
    "lecture_number": 1,
    "starts_at": "2024-03-15T09:15:00Z",
    "expires_at": "2024-03-15T09:30:00Z",
    "total_scans": 45,
    "successful_scans": 42
  }
}
```

### 3. Deactivate Session
**POST** `/api/qr-session/deactivate`

```json
{
  "sessionId": "uuid"
}
```

### 4. Mark Attendance
**POST** `/api/qr-attendance/mark`

```json
{
  "sessionCode": "ABC12345",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "deviceInfo": {
    "userAgent": "...",
    "platform": "...",
    "language": "en-US",
    "screenResolution": "1920x1080"
  }
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "attendanceId": "uuid",
  "logId": "uuid"
}
```

Response (Failure):
```json
{
  "success": false,
  "message": "Location verification failed. Distance: 150.5m (Required: <100m)",
  "attendanceId": null,
  "logId": "uuid"
}
```

## Teacher Workflow

### 1. Generate QR Code

1. Navigate to **Teacher → QR Attendance**
2. Click "Get Current Location" to set classroom location
3. Fill in the form:
   - Select Section (A or B)
   - Enter Subject name
   - Select Date
   - Choose Lecture Slot (1-8)
   - Set Radius (default 100m)
   - Set Duration (default 15 minutes)
4. Click "Generate QR Code"

### 2. Display QR Code

- Large QR code is displayed on screen
- Session code shown prominently (e.g., "ABC12345")
- Real-time statistics:
  - Time remaining
  - Total scans
  - Successful scans
- Students can scan QR or manually enter code

### 3. Monitor Attendance

- Live updates every 5 seconds
- See successful vs total scan attempts
- Session automatically expires after duration
- Can manually end session anytime

### 4. View Logs

Navigate to **Teacher → Attendance Logs** to see:
- All attendance attempts
- Student details
- Location data and distance
- Verification status
- Rejection reasons
- Device information

## Student Workflow

### 1. Enable Location

1. Navigate to **Student → QR Scanner**
2. Browser will request location permission
3. Allow location access
4. Location coordinates displayed

### 2. Mark Attendance

**Option A: Manual Entry**
1. Get session code from teacher's screen
2. Enter 8-character code
3. Click "Mark Attendance"

**Option B: QR Scan** (Future Enhancement)
1. Click scan button
2. Point camera at QR code
3. Automatic submission

### 3. Verification

System checks:
- ✅ Session is active and not expired
- ✅ Student belongs to correct section
- ✅ Student hasn't already marked attendance
- ✅ Student is within geo-fence radius
- ✅ Location accuracy is acceptable

### 4. Result

**Success**: Green notification "Attendance marked successfully"

**Failure**: Red notification with reason:
- "Invalid or expired session"
- "This session is not for your section"
- "Attendance already marked for this lecture"
- "Location verification failed. Distance: Xm (Required: <Ym)"

## Configuration

### Adjustable Parameters

#### Geo-Fence Radius
```typescript
// Default: 100 meters
// Range: 10-500 meters
radiusMeters: 100
```

Recommendations:
- Small classroom: 50m
- Large hall: 100m
- Outdoor venue: 200m
- Campus-wide: 500m

#### Session Duration
```typescript
// Default: 15 minutes
// Range: 5-60 minutes
durationMinutes: 15
```

Recommendations:
- Quick attendance: 5-10 minutes
- Normal class: 15 minutes
- Large class: 20-30 minutes

#### Lecture Schedule
```typescript
const lectureSchedule = [
  { number: 1, time: "09:15", label: "Lecture 1 (9:15 - 10:10)" },
  { number: 2, time: "10:10", label: "Lecture 2 (10:10 - 11:05)" },
  // ... customize as needed
]
```

## Database Functions

### calculate_distance()
Calculates distance between two GPS coordinates using Haversine formula.

```sql
SELECT calculate_distance(12.9716, 77.5946, 12.9720, 77.5950);
-- Returns distance in meters
```

### create_qr_attendance_session()
Creates a new QR session with lecture and geo-fence data.

### mark_qr_attendance()
Validates and marks attendance with location verification.

### get_teacher_active_session()
Retrieves teacher's current active session with statistics.

### deactivate_session()
Manually ends an active session.

## Security Considerations

### Location Spoofing Prevention
- Cross-reference with IP geolocation
- Monitor for impossible travel speeds
- Flag suspicious patterns in logs
- Require high GPS accuracy

### Session Security
- Unique random codes per session
- Time-limited validity
- One-time attendance per lecture
- Section-based access control

### Data Privacy
- Store only necessary location data
- Implement data retention policies
- Comply with privacy regulations
- Secure API endpoints with authentication

## Troubleshooting

### Location Not Working

**Problem**: "Location access required" error

**Solutions**:
1. Check browser permissions
2. Enable location services on device
3. Use HTTPS (required for geolocation API)
4. Try different browser
5. Check device GPS settings

### Attendance Rejected

**Problem**: "Location verification failed"

**Causes**:
- Student too far from classroom
- GPS accuracy issues
- Wrong classroom location set by teacher
- Indoor GPS signal problems

**Solutions**:
- Move closer to classroom
- Wait for better GPS signal
- Teacher should verify location setting
- Increase radius temporarily for indoor venues

### Session Expired

**Problem**: "Invalid or expired session"

**Solutions**:
- Teacher creates new session
- Increase session duration
- Students mark attendance promptly

## Best Practices

### For Teachers
1. Set location while in the actual classroom
2. Test QR code before class starts
3. Display code prominently on projector
4. Allow 10-15 minutes for attendance
5. Monitor scan statistics
6. Review logs for anomalies
7. End session after class

### For Students
1. Enable location before class
2. Arrive on time
3. Ensure good GPS signal
4. Mark attendance once only
5. Report issues immediately

### For Administrators
1. Regular audit of attendance logs
2. Monitor rejection patterns
3. Adjust radius based on venue
4. Train teachers and students
5. Backup with manual attendance
6. Review security logs

## Future Enhancements

- [ ] Camera-based QR scanning
- [ ] Offline mode with sync
- [ ] Biometric verification
- [ ] Face recognition integration
- [ ] Analytics dashboard
- [ ] Automated reports
- [ ] Mobile app
- [ ] Bluetooth beacon support
- [ ] Multi-factor authentication
- [ ] Parent notifications

## Support

For issues or questions:
1. Check this documentation
2. Review attendance logs
3. Test with different devices
4. Contact system administrator

## License

Part of College ERP Attendance System
