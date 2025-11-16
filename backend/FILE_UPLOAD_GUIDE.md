# File Upload System - Complete Guide

## ✅ What's Been Implemented

Complete file upload system with:
- ✅ File upload endpoint
- ✅ File download endpoint
- ✅ File deletion endpoint
- ✅ File metadata storage
- ✅ Entity-based file organization
- ✅ Security & validation
- ✅ Activity logging

## 📦 Components

### 1. Database Table
```sql
uploaded_files
├── id (UUID)
├── entity_type (patient, appointment, lab_test, etc.)
├── entity_id (related entity ID)
├── file_name (stored filename)
├── original_name (original filename)
├── file_path (full path)
├── file_size (bytes)
├── mime_type (file type)
├── description (optional)
├── uploaded_by (user ID)
└── created_at, updated_at
```

### 2. Controller (`src/controllers/uploadController.js`)
- Upload file
- Get files by entity
- Get single file
- Download file
- Delete file
- Get all files (admin)

### 3. Middleware (`src/middleware/upload.js`)
- Multer configuration
- File type validation
- File size limits
- Error handling

### 4. Routes (`src/routes/upload.js`)
- POST `/api/upload` - Upload file
- GET `/api/upload/entity/:type/:id` - Get files by entity
- GET `/api/upload/:id` - Get file metadata
- GET `/api/upload/:id/download` - Download file
- DELETE `/api/upload/:id` - Delete file
- GET `/api/upload` - Get all files (admin)

## 🚀 Setup

### 1. Create Database Table
```bash
mysql -u root -p hospital_db < backend/database/add-upload-table.sql
```

### 2. Create Upload Directory
```bash
mkdir backend/uploads
```

### 3. Configure Environment
```env
# In backend/.env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

### 4. Start Server
```bash
cd backend
npm run dev
```

## 📡 API Endpoints

### Upload File
```bash
POST /api/upload
Content-Type: multipart/form-data

# Form data:
- file: [file]
- entity_type: "patient" | "appointment" | "lab_test" | "prescription" | etc.
- entity_id: "uuid-of-entity"
- description: "Optional description"

# Response:
{
  "message": "File uploaded successfully",
  "fileId": "uuid",
  "file": {
    "id": "uuid",
    "name": "original-filename.pdf",
    "size": 1024,
    "type": "application/pdf"
  }
}
```

### Get Files by Entity
```bash
GET /api/upload/entity/:entity_type/:entity_id

# Example:
GET /api/upload/entity/patient/123e4567-e89b-12d3-a456-426614174000

# Response:
{
  "files": [
    {
      "id": "uuid",
      "entity_type": "patient",
      "entity_id": "uuid",
      "file_name": "stored-name.pdf",
      "original_name": "Medical Report.pdf",
      "file_size": 1024,
      "mime_type": "application/pdf",
      "description": "Lab results",
      "uploaded_by_name": "Dr. Smith",
      "created_at": "2025-11-15T10:00:00Z"
    }
  ]
}
```

### Download File
```bash
GET /api/upload/:id/download

# Example:
GET /api/upload/123e4567-e89b-12d3-a456-426614174000/download

# Response: File stream with headers
Content-Type: application/pdf
Content-Disposition: attachment; filename="Medical Report.pdf"
```

### Delete File
```bash
DELETE /api/upload/:id

# Response:
{
  "message": "File deleted successfully"
}
```

## 💻 Frontend Integration

### Upload File (React)
```typescript
import api from '@/lib/api';

const uploadFile = async (file: File, entityType: string, entityId: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entity_type', entityType);
  formData.append('entity_id', entityId);
  formData.append('description', 'Optional description');

  try {
    const { data } = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });
    
    console.log('File uploaded:', data.fileId);
    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

### Get Files
```typescript
const getFiles = async (entityType: string, entityId: string) => {
  try {
    const { data } = await api.get(`/upload/entity/${entityType}/${entityId}`);
    return data.files;
  } catch (error) {
    console.error('Get files error:', error);
    throw error;
  }
};
```

### Download File
```typescript
const downloadFile = async (fileId: string, fileName: string) => {
  try {
    const response = await api.get(`/upload/${fileId}/download`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};
```

### Delete File
```typescript
const deleteFile = async (fileId: string) => {
  try {
    await api.delete(`/upload/${fileId}`);
    console.log('File deleted');
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};
```

## 🎨 React Component Example

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export function FileUpload({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);

    try {
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Refresh file list
      await loadFiles();
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const loadFiles = async () => {
    const { data } = await api.get(`/upload/entity/${entityType}/${entityId}`);
    setFiles(data.files);
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    const response = await api.get(`/upload/${fileId}/download`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <Input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
      />
      
      <div className="mt-4">
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-2 border rounded">
            <span>{file.original_name}</span>
            <Button onClick={() => handleDownload(file.id, file.original_name)}>
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🔒 Security Features

### File Type Validation
Allowed types:
- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Text: TXT, CSV

### File Size Limit
- Default: 5MB
- Configurable via `MAX_FILE_SIZE` env variable

### Access Control
- All endpoints require authentication
- Files are associated with users
- Activity logging for all operations

### Storage Security
- Files stored outside web root
- Unique filenames prevent collisions
- Original filenames preserved in database

## 📊 Use Cases

### Patient Files
```typescript
// Upload patient medical record
uploadFile(file, 'patient', patientId);

// Get all patient files
getFiles('patient', patientId);
```

### Lab Results
```typescript
// Upload lab result PDF
uploadFile(file, 'lab_test', labTestId);

// Download lab result
downloadFile(fileId, 'Lab Result.pdf');
```

### Prescriptions
```typescript
// Upload prescription image
uploadFile(file, 'prescription', prescriptionId);
```

### Appointments
```typescript
// Upload appointment-related documents
uploadFile(file, 'appointment', appointmentId);
```

## 🧪 Testing

### Test Upload
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "entity_type=patient" \
  -F "entity_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "description=Medical report"
```

### Test Get Files
```bash
curl http://localhost:3000/api/upload/entity/patient/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer $TOKEN"
```

### Test Download
```bash
curl http://localhost:3000/api/upload/file-id/download \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded-file.pdf
```

## 🐛 Troubleshooting

### Upload fails with "No file uploaded"
- Ensure `Content-Type: multipart/form-data` header
- Check file input name is 'file'
- Verify file is selected

### "File too large" error
- Check file size < 5MB
- Increase `MAX_FILE_SIZE` in .env if needed

### "Invalid file type" error
- Check file type is in allowed list
- Update `fileFilter` in upload middleware if needed

### Download fails
- Verify file exists on disk
- Check file permissions
- Ensure upload directory is accessible

## 📈 Monitoring

All file operations are logged in `activity_logs`:
- `file.uploaded` - File upload
- `file.downloaded` - File download
- `file.deleted` - File deletion

Query logs:
```sql
SELECT * FROM activity_logs 
WHERE action LIKE 'file.%' 
ORDER BY created_at DESC;
```

## 🚀 Production Considerations

### Storage
- Use cloud storage (AWS S3, Google Cloud Storage) for production
- Implement file cleanup for deleted entities
- Set up backup strategy

### Performance
- Implement CDN for file delivery
- Add caching headers
- Consider streaming for large files

### Security
- Scan uploaded files for viruses
- Implement rate limiting
- Add file encryption for sensitive data

---

**Status**: ✅ Complete & Ready  
**Endpoints**: 6 endpoints  
**Features**: Upload, Download, Delete, List  
**Last Updated**: November 15, 2025
