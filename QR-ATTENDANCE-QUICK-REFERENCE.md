# QR Attendance - Quick Reference Card

## 👨‍🏫 For Teachers

### Generate QR Code (3 Steps)
1. **Get Location** → Click "Get Current Location" button
2. **Fill Form** → Subject, Section, Lecture, Radius (100m), Duration (15min)
3. **Generate** → Click "Generate QR Code"

### Display to Students
- Show QR code on projector/screen
- Display session code prominently (e.g., "ABC12345")
- Keep session active for 10-15 minutes

### Monitor Attendance
- **Green Number** = Successful scans
- **Gray Number** = Total attempts
- **Timer** = Time remaining
- Click "End Session" when done

### View Logs
Navigate to **Attendance Logs** to see:
- Who scanned when
- Location verification status
- Distance from classroom
- Rejection reasons

---

## 👨‍🎓 For Students

### Mark Attendance (3 Steps)
1. **Enable Location** → Allow browser to access your location
2. **Enter Code** → Type 8-character code from teacher's screen
3. **Submit** → Click "Mark Attendance"

### Success Messages
- ✅ **Green** = "Attendance marked successfully"
- ❌ **Red** = See reason below

### Common Errors
| Error | Meaning | Solution |
|-------|---------|----------|
| Invalid or expired session | Session ended | Ask teacher to create new session |
| Location verification failed | Too far from classroom | Move closer (within 100m) |
| Already marked | You already marked attendance | No action needed |
| Wrong section | Not your class | Check session code |

### Tips
- ✅ Arrive on time
- ✅ Enable location before class
- ✅ Be in classroom (within 100m)
- ✅ Enter code carefully
- ✅ Mark once only

---

## 🔧 Quick Settings

### Default Configuration
```
Radius: 100 meters
Duration: 15 minutes
Lecture Slots: 8 (9:15 AM - 4:35 PM)
Session Code: 8 characters
```

### Adjust Radius
- **Small Room**: 50m
- **Classroom**: 100m
- **Large Hall**: 200m
- **Outdoor**: 300-500m

### Adjust Duration
- **Quick**: 5-10 minutes
- **Normal**: 15 minutes
- **Large Class**: 20-30 minutes

---

## 🚨 Troubleshooting

### Location Not Working
1. Check browser permissions
2. Enable device location services
3. Use HTTPS website
4. Try different browser
5. Restart device

### QR Code Not Generating
1. Check internet connection
2. Verify you're logged in as teacher
3. Ensure all form fields filled
4. Refresh page and try again

### Attendance Not Marking
1. Verify session is active (check timer)
2. Confirm you're in correct section
3. Check if already marked
4. Ensure within radius (100m)
5. Refresh location

---

## 📱 Browser Requirements

### Required
- ✅ HTTPS enabled
- ✅ Location services ON
- ✅ JavaScript enabled
- ✅ Modern browser (Chrome, Firefox, Safari, Edge)

### Permissions Needed
- 📍 Location access (GPS)
- 🌐 Internet connection

---

## 📊 Understanding the System

### How Location Verification Works
```
1. Teacher sets classroom location (GPS coordinates)
2. System creates geo-fence (circular boundary)
3. Student scans QR code
4. System gets student's GPS location
5. Calculates distance between student and classroom
6. If distance ≤ radius → ✅ Success
7. If distance > radius → ❌ Rejected
```

### What Gets Logged
- ✅ Timestamp
- ✅ Student identity
- ✅ GPS coordinates
- ✅ Distance from classroom
- ✅ Device information
- ✅ Success/failure status

---

## ⏱️ Lecture Schedule

| Lecture | Time | Duration |
|---------|------|----------|
| 1 | 9:15 - 10:10 | 55 min |
| 2 | 10:10 - 11:05 | 55 min |
| 3 | 11:05 - 12:00 | 55 min |
| 4 | 12:00 - 12:55 | 55 min |
| 5 | 12:55 - 1:50 | 55 min (Lunch) |
| 6 | 1:50 - 2:45 | 55 min |
| 7 | 2:45 - 3:40 | 55 min |
| 8 | 3:40 - 4:35 | 55 min |

---

## 🎯 Best Practices

### Teachers
- ✅ Set location while in classroom
- ✅ Test before first use
- ✅ Display code clearly
- ✅ Allow 10-15 minutes for scanning
- ✅ Monitor statistics
- ✅ End session after class

### Students
- ✅ Enable location before class
- ✅ Arrive on time
- ✅ Be in classroom
- ✅ Mark attendance once
- ✅ Report issues immediately

### Administrators
- ✅ Train users properly
- ✅ Monitor logs regularly
- ✅ Adjust settings as needed
- ✅ Review rejection patterns
- ✅ Maintain backup system

---

## 📞 Need Help?

### Documentation
- **Setup**: `QR-ATTENDANCE-SETUP.md`
- **Complete Guide**: `QR-GEO-ATTENDANCE-GUIDE.md`
- **Overview**: `QR-ATTENDANCE-README.md`

### Common Questions

**Q: How accurate is location verification?**
A: Within 5-10 meters using GPS. Works best outdoors.

**Q: Can I mark attendance from home?**
A: No. You must be within the geo-fence radius (typically 100m).

**Q: What if GPS signal is weak?**
A: Move near window or outdoors for better signal.

**Q: Can I mark attendance twice?**
A: No. System prevents duplicate entries.

**Q: How long is session valid?**
A: Default 15 minutes, configurable by teacher.

**Q: What if I'm late?**
A: Mark attendance if session is still active.

---

## 🔐 Privacy & Security

### What We Collect
- GPS coordinates (only during attendance)
- Device information (browser, platform)
- IP address
- Timestamp

### What We Don't Collect
- Continuous location tracking
- Personal browsing data
- Contacts or photos
- Background location

### Your Rights
- Location used only for attendance
- Data stored securely
- Access your own logs
- Request data deletion

---

## ✅ Quick Checklist

### Before First Use
- [ ] Database setup complete
- [ ] Dependencies installed
- [ ] HTTPS enabled
- [ ] Location permissions granted
- [ ] Users trained

### Every Class (Teacher)
- [ ] In classroom
- [ ] Location obtained
- [ ] Form filled correctly
- [ ] QR code displayed
- [ ] Session monitored
- [ ] Session ended

### Every Class (Student)
- [ ] Location enabled
- [ ] In classroom
- [ ] Code entered correctly
- [ ] Attendance confirmed
- [ ] Success message received

---

## 📈 Success Indicators

System working correctly when:
- ✅ 95%+ successful scans
- ✅ < 30 sec to create session
- ✅ < 10 sec to mark attendance
- ✅ Zero duplicates
- ✅ Complete logs
- ✅ Auto expiration working

---

## 🎓 Training Time

- **Teachers**: 15 minutes
- **Students**: 10 minutes
- **Administrators**: 30 minutes

---

**Print this card for quick reference!**

For detailed information, see the complete documentation files.
