# Lecture-Based Attendance System Setup

## Overview
This system implements an 8-lecture attendance tracking system with the following schedule:

- **Lecture 1**: 9:15 - 10:10
- **Lecture 2**: 10:10 - 11:05
- **Lecture 3**: 11:05 - 12:00
- **Lecture 4**: 12:00 - 12:55
- **Lecture 5**: 12:55 - 1:50 (Lunch)
- **Lecture 6**: 1:50 - 2:45
- **Lecture 7**: 2:45 - 3:40
- **Lecture 8**: 3:40 - 4:35

## Database Setup

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the SQL file: `supabase-add-lecture-system.sql`

This will:
- Add `lecture_number` column to the lectures table
- Create/update the `create_lecture_with_attendance` RPC function
- Create `get_student_lecture_stats` function for lecture-wise statistics
- Create `get_student_lecture_attendance` function for daily lecture view
- Add necessary indexes for performance

## Features

### For Teachers (Mark Attendance Page)
- Select from 8 predefined lecture slots
- Each slot automatically sets the correct time
- Mark attendance for all students in a section
- Lecture 5 is marked as lunch period

### For Teachers (Attendance Table Page)
- View comprehensive attendance table for all 8 lectures
- Separate tabs for Section A and Section B
- Date selector to view any day's attendance
- Visual indicators:
  - Green checkmark for present
  - Red X for absent
  - Gray dash for not marked
  - Subject name shown under each status
- Statistics for each section:
  - Total students
  - Average attendance percentage
  - Total present/absent counts
- Sticky columns for easy scrolling (Roll No, Name, and Totals)
- Each student row shows:
  - All 8 lecture statuses
  - Total present/absent count
  - Overall percentage with color coding (green ≥75%, red <75%)

### For Students (Attendance Page)
- View overall attendance percentage
- See lecture-wise attendance progress (8 separate progress bars)
- Each lecture shows:
  - Attendance percentage for that specific lecture slot
  - Number of times present vs total lectures held
  - Visual progress bar
- View detailed attendance history with lecture numbers and subjects

## Usage

### Teacher Workflow - Mark Attendance
1. Navigate to "Mark Attendance"
2. Select the class section (A or B)
3. Enter the subject name
4. Select the date
5. Choose the lecture slot (1-8)
6. Mark students as present/absent
7. Save attendance

### Teacher Workflow - View Attendance Table
1. Navigate to "Attendance Table"
2. Select the date you want to view
3. Switch between Section A and Section B tabs
4. View the complete attendance grid showing:
   - All students in rows
   - All 8 lectures in columns
   - Present/Absent status for each lecture
   - Subject names for each marked lecture
   - Total present/absent counts per student
   - Attendance percentage per student
5. Use the statistics cards to see section-wide metrics

### Student View
1. Navigate to "Attendance"
2. View overall statistics at the top
3. Scroll to see lecture-wise progress (8 lectures)
4. Check detailed history below

## Notes
- The system automatically calculates lecture times based on the selected lecture number
- Lecture 5 is designated as the lunch period
- Each lecture is 55 minutes long
- Students can track their attendance for each specific lecture slot throughout the semester
