# Visual Paradigm Class Diagram Creation Guide
## Edynx Mobile App

### Method 1: Manual Creation (Recommended)

#### Step 1: Create New Project
1. Open Visual Paradigm
2. File → New → Project
3. Select "Class Diagram" template
4. Name: "Edynx Mobile App"

#### Step 2: Create Packages
Create 4 main packages:
1. **User Management**
2. **Attendance System** 
3. **Face Recognition System**
4. **Chat System**

#### Step 3: Create Classes in Each Package

### 📦 User Management Package

#### Class: User
**Attributes:**
- +id: UUID {PK}
- +email: String {unique}
- +username: String
- +first_name: String
- +last_name: String
- +phone_number: String
- +role: String [student, parent, teacher, mentor, administration, superadmin]
- +is_active: Boolean
- +created_at: DateTime
- +updated_at: DateTime
- +profile_picture: ImageField
- +date_of_birth: Date
- +address: Text
- +student_id: String {unique}
- +level: Integer [1,2,3]
- +class_name: String
- +parent: FK(User)
- +teacher_id: String {unique}
- +subject_taught: String
- +department: String
- +mentor_id: String {unique}
- +rating: Decimal
- +admin_id: String {unique}
- +position: String
- +face_encoding: Text
- +face_image: ImageField

**Methods:**
- +get_full_name(): String
- +is_student(): Boolean
- +is_parent(): Boolean
- +is_teacher(): Boolean
- +is_mentor(): Boolean
- +is_administration(): Boolean
- +can_have_mentor(): Boolean

#### Class: UserProfile
**Attributes:**
- +user: OneToOne(User)
- +bio: Text
- +emergency_contact: String
- +emergency_contact_name: String
- +gpa: Decimal
- +academic_year: String
- +experience_years: Integer
- +qualifications: Text
- +specializations: Text
- +created_at: DateTime
- +updated_at: DateTime

#### Class: UserSession
**Attributes:**
- +user: FK(User)
- +session_key: String {unique}
- +device_info: Text
- +ip_address: GenericIPAddress
- +user_agent: Text
- +is_active: Boolean
- +created_at: DateTime
- +last_activity: DateTime

### 📦 Attendance System Package

#### Class: Class
**Attributes:**
- +id: UUID {PK}
- +name: String
- +level: Integer [1,2,3]
- +teacher: FK(User)
- +created_at: DateTime
- +updated_at: DateTime

#### Class: AttendanceSession
**Attributes:**
- +id: UUID {PK}
- +class_obj: FK(Class)
- +session_type: String [morning, afternoon, evening, custom]
- +date: Date
- +start_time: Time
- +end_time: Time
- +is_active: Boolean
- +created_by: FK(User)
- +created_at: DateTime
- +updated_at: DateTime

#### Class: Attendance
**Attributes:**
- +id: UUID {PK}
- +student: FK(User)
- +session: FK(AttendanceSession)
- +status: String [present, absent, late, excused, pending]
- +method: String [face_recognition, qr_code, peer_scan, manual, justification, location_verified, face_and_location]
- +timestamp: DateTime
- +location: String
- +location_data: JSONField
- +confidence_score: Decimal
- +verified_by: FK(User)
- +verified_at: DateTime
- +notes: Text

#### Class: AbsenceJustification
**Attributes:**
- +id: UUID {PK}
- +student: FK(User)
- +attendance: OneToOne(Attendance)
- +reason: Text
- +photo: ImageField
- +status: String [pending, approved, rejected]
- +reviewed_by: FK(User)
- +reviewed_at: DateTime
- +review_notes: Text
- +submitted_at: DateTime

### 📦 Face Recognition System Package

#### Class: FaceRegistration
**Attributes:**
- +id: UUID {PK}
- +user: OneToOne(User)
- +auth_method: String [camera, biometric]
- +device_type: String [mobile, web, desktop]
- +face_encoding: Text
- +biometric_id: String
- +confidence_score: Float
- +created_at: DateTime
- +updated_at: DateTime
- +last_authenticated: DateTime
- +registration_ip: GenericIPAddress
- +user_agent: Text

**Methods:**
- +get_face_encoding_array(): Array
- +set_face_encoding_array(encoding): void
- +is_biometric_registration(): Boolean
- +is_camera_registration(): Boolean

#### Class: FaceRecognitionAttempt
**Attributes:**
- +id: UUID {PK}
- +user: FK(User)
- +attempt_type: String [authentication, registration, update]
- +result: String [success, failed, no_face, multiple_faces, low_quality, no_match, error]
- +confidence_score: Float
- +ip_address: GenericIPAddress
- +user_agent: Text
- +device_info: Text
- +processing_time: Float
- +timestamp: DateTime
- +error_message: Text

### 📦 Chat System Package

#### Class: ChatRoom
**Attributes:**
- +student: FK(User)
- +mentor: FK(User)
- +created_at: DateTime
- +updated_at: DateTime
- +is_active: Boolean

**Methods:**
- +last_message(): Message

#### Class: Message
**Attributes:**
- +chat_room: FK(ChatRoom)
- +sender: FK(User)
- +content: Text
- +timestamp: DateTime
- +is_read: Boolean
- +message_type: String [text, image, file]
- +attachment: FileField

**Methods:**
- +mark_as_read(): void

#### Class: MentorAssignment
**Attributes:**
- +student: FK(User)
- +mentor: FK(User)
- +assigned_by: FK(User)
- +assigned_at: DateTime
- +is_active: Boolean
- +notes: Text

### Step 4: Create Relationships

#### One-to-One Relationships:
- User ←→ UserProfile (has)
- User ←→ FaceRegistration (has)
- Attendance ←→ AbsenceJustification (justified_by)

#### One-to-Many Relationships:
- User → UserSession (has)
- User → Class (teaches)
- Class → AttendanceSession (contains)
- AttendanceSession → Attendance (has)
- User → Attendance (marks)
- User → AbsenceJustification (submits)
- User → FaceRecognitionAttempt (attempts)
- ChatRoom → Message (contains)
- User → ChatRoom (participates_as_student)
- User → ChatRoom (participates_as_mentor)
- User → Message (sends)
- User → MentorAssignment (assigned_to)

#### Many-to-Many Relationships:
- User ←→ Class (enrolled_in/students)
- User ←→ User (mentors/mentees)

#### Self-Referencing Relationships:
- User → User (parent_of/children)

### Method 2: CSV Import
1. Use the provided `Edynx_Classes_Import.csv` file
2. In Visual Paradigm: Tools → Import → CSV
3. Map columns to class attributes
4. Manually add relationships after import

### Method 3: XMI Import
1. Try importing the `Edynx_Class_Diagram.xmi` file
2. File → Import → XMI
3. Select the XMI file and import

### Key Features Highlighted:
✅ **Multi-role User System**: Single User model supporting all 6 roles
✅ **Biometric Authentication**: Face ID/Touch ID + camera-based recognition  
✅ **Geolocation Attendance**: Location-verified attendance marking
✅ **Real-time Chat**: Mentor-student communication
✅ **Comprehensive Logging**: Full audit trails
✅ **Parent-Child Relationships**: Family connections
✅ **Mentor-Mentee System**: Level-based mentorship

### Notes:
- Use stereotypes like «entity» for model classes
- Add constraints in curly braces {PK}, {unique}
- Use different colors for each package
- Add notes to highlight key features like biometric support
