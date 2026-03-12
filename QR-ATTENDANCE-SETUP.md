# Quick Setup Guide - QR & Geo-Enabled Attendance

## Prerequisites
- ✅ Existing College ERP system running
- ✅ Supabase database configured
- ✅ Node.js and npm installed
- ✅ HTTPS enabled (required for geolocation)

## Installation Steps

### Step 1: Install Dependencies
```bash
npm install qrcode @types/qrcode
```

### Step 2: Database Setup
1. Open Supabase SQL Editor
2. Copy entire content from `supabase-qr-geo-attendance.sql`
3. Paste into SQL Editor
4. Click **RUN**
5. Verify success message: "SUCCESS! QR & Geo-enabled attendance system created."

### Step 3: Verify Installation
Check that these tables were created:
- `attendance_sessions`
- `attendance_logs`

Check that these functions were created:
- `calculate_distance()`
- `create_qr_attendance_session()`
- `mark_qr_attendance()`
- `get_teacher_active_session()`
- `deactivate_session()`

### Step 4: Test the System

#### For Teachers:
1. Login as teacher
2. Navigate to **QR Attendance** in menu
3. Click "Get Current Location"
4. Fill form and click "Generate QR Code"
5. Verify QR code displays with session code

#### For Students:
1. Login as student
2. Navigate to **QR Scanner** in menu
3. Allow location access
4. Enter teacher's session code
5. Click "Mark Attendance"
6. Verify success message

### Step 5: View Logs
1. Login as teacher
2. Navigate to **Attendance Logs**
3. Verify attendance attempts are logged with location data

## File Structure

```
app/
├── api/
│   ├── qr-session/
│   │   ├── create/route.ts       # Create QR session
│   │   ├── active/route.ts       # Get active session
│   │   └── deactivate/route.ts   # End session
│   └── qr-attendance/
│       └── mark/route.ts         # Mark attendance
├── teacher/
│   ├── qr-attendance/page.tsx    # Teacher QR interface
│   └── attendance-logs/page.tsx  # View logs
└── student/
    └── qr-scanner/page.tsx       # Student scanner

components/
├── teacher-nav.tsx               # Updated with QR links
└── student-nav.tsx               # Updated with scanner link

supabase-qr-geo-attendance.sql    # Database schema
QR-GEO-ATTENDANCE-GUIDE.md        # Complete documentation
```

## Quick Test Checklist

- [ ] Database tables created
- [ ] Database functions working
- [ ] Teacher can get location
- [ ] Teacher can create QR session
- [ ] QR code displays correctly
- [ ] Student can access scanner
- [ ] Student location detected
- [ ] Attendance marks successfully
- [ ] Logs show attendance data
- [ ] Location verification works
- [ ] Session expires correctly

## Common Issues

### Issue: Location not detected
**Fix**: Ensure HTTPS is enabled. Geolocation API requires secure context.

### Issue: "Invalid or expired session"
**Fix**: Check session duration. Default is 15 minutes.

### Issue: "Location verification failed"
**Fix**: 
- Verify teacher set location correctly
- Check radius setting (default 100m)
- Ensure student is in classroom
- Try refreshing student location

### Issue: QR code not generating
**Fix**: 
- Check if qrcode package is installed
- Verify API endpoint is accessible
- Check browser console for errors

## Configuration

### Adjust Geo-Fence Radius
In `app/teacher/qr-attendance/page.tsx`:
```typescript
const [radiusMeters, setRadiusMeters] = useState(100) // Change default
```

### Adjust Session Duration
In `app/teacher/qr-attendance/page.tsx`:
```typescript
const [durationMinutes, setDurationMinutes] = useState(15) // Change default
```

### Customize Lecture Schedule
In both teacher and student files:
```typescript
const lectureSchedule = [
  { number: 1, time: "09:15", label: "Lecture 1 (9:15 - 10:10)" },
  // Add or modify as needed
]
```

## Testing Scenarios

### Scenario 1: Normal Attendance
1. Teacher creates session in classroom
2. Student scans within 5 minutes
3. Student is within 100m radius
4. ✅ Attendance marked successfully

### Scenario 2: Late Arrival
1. Teacher creates session at 9:15 AM
2. Student scans at 9:25 AM (within 15 min)
3. Student is within radius
4. ✅ Attendance marked successfully

### Scenario 3: Session Expired
1. Teacher creates session at 9:15 AM
2. Student scans at 9:35 AM (after 15 min)
3. ❌ "Invalid or expired session"

### Scenario 4: Wrong Location
1. Teacher creates session in Room A
2. Student scans from Room B (200m away)
3. Radius set to 100m
4. ❌ "Location verification failed. Distance: 200m"

### Scenario 5: Duplicate Attempt
1. Student marks attendance successfully
2. Student tries to mark again
3. ❌ "Attendance already marked for this lecture"

### Scenario 6: Wrong Section
1. Teacher creates session for Section A
2. Student from Section B tries to scan
3. ❌ "This session is not for your section"

## Production Deployment

### Environment Variables
Ensure these are set:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### HTTPS Requirement
- Geolocation API requires HTTPS
- Use SSL certificate in production
- Test on localhost (allowed without HTTPS)

### Performance Optimization
- Enable database indexes (already in SQL script)
- Set up connection pooling
- Monitor API response times
- Cache active sessions

### Security Checklist
- [ ] RLS policies enabled
- [ ] API routes authenticated
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] Logs monitored for anomalies
- [ ] Data retention policy defined

## Support & Maintenance

### Regular Tasks
- Review attendance logs weekly
- Monitor rejection patterns
- Update lecture schedules as needed
- Adjust radius based on feedback
- Archive old sessions monthly

### Monitoring
- Track session creation rate
- Monitor successful vs failed scans
- Check location accuracy
- Review device compatibility
- Analyze peak usage times

## Next Steps

1. ✅ Complete installation
2. ✅ Test with sample data
3. ✅ Train teachers on QR generation
4. ✅ Train students on scanner usage
5. ✅ Run pilot with one class
6. ✅ Gather feedback
7. ✅ Adjust settings as needed
8. ✅ Roll out to all classes

## Resources

- Full Documentation: `QR-GEO-ATTENDANCE-GUIDE.md`
- Database Schema: `supabase-qr-geo-attendance.sql`
- API Documentation: See guide for endpoint details

## Success Criteria

System is working correctly when:
- ✅ Teachers can create sessions in < 30 seconds
- ✅ Students can mark attendance in < 10 seconds
- ✅ 95%+ location verification success rate
- ✅ Zero duplicate attendance entries
- ✅ Complete audit trail in logs
- ✅ Sessions expire automatically
- ✅ No proxy attendance possible

---

**Ready to go!** Start with Step 1 and follow through. The system will be operational in under 10 minutes.
