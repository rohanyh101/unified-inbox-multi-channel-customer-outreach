import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Upload,
  Image as ImageIcon,
  File,
  X,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
}

interface MediaAttachmentProps {
  attachments: MediaAttachment[];
  onAttachmentsChange: (attachments: MediaAttachment[]) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
  showPreview?: boolean;
}

const MediaAttachmentComponent: React.FC<MediaAttachmentProps> = ({
  attachments,
  onAttachmentsChange,
  maxFileSize = 10, // 10MB default
  allowedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'],
  maxFiles = 5,
  showPreview = true
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validation
    if (attachments.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = fileArray.filter(file => {
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max ${maxFileSize}MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const newAttachments: MediaAttachment[] = [];

      for (const file of validFiles) {
        // Create preview for images
        let preview: string | undefined;
        if (file.type.startsWith('image/')) {
          preview = await createImagePreview(file);
        }

        // In a real app, you'd upload to a service like AWS S3, Cloudinary, etc.
        // For now, we'll create a local URL
        const url = URL.createObjectURL(file);

        newAttachments.push({
          id: `temp-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          preview
        });
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
      toast.success(`${newAttachments.length} file(s) attached`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing files');
    } finally {
      setUploading(false);
    }
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    const updatedAttachments = attachments.filter(att => att.id !== id);
    onAttachmentsChange(updatedAttachments);
    toast.success('Attachment removed');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || attachments.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Attach Media'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <span className="text-sm text-gray-500">
          {attachments.length}/{maxFiles} files • Max {maxFileSize}MB each
        </span>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
          <div className="grid grid-cols-1 gap-2">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Preview or Icon */}
                    <div className="flex-shrink-0">
                      {showPreview && attachment.preview ? (
                        <img
                          src={attachment.preview}
                          alt={attachment.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                          {getFileIcon(attachment.type)}
                        </div>
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)} • {attachment.type}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {attachment.preview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.preview, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaAttachmentComponent;
