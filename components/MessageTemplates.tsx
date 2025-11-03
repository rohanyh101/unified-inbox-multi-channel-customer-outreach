import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Plus,
  Edit3,
  Trash2,
  Search,
  Clock,
  MessageSquare,
  Copy,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  createdAt: string;
  usageCount: number;
}

interface MessageTemplatesProps {
  onTemplateSelect: (template: MessageTemplate) => void;
  onTemplateInsert?: (content: string) => void;
  showInsertButton?: boolean;
}

const MessageTemplates: React.FC<MessageTemplatesProps> = ({
  onTemplateSelect,
  onTemplateInsert,
  showInsertButton = false
}) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'general'
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates when search or category changes
  useEffect(() => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/message-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      // Load default templates if API fails
      setTemplates(getDefaultTemplates());
    }
  };

  const getDefaultTemplates = (): MessageTemplate[] => [
    {
      id: '1',
      name: 'Welcome Message',
      content: 'Hi {{name}}, welcome to our service! We\'re excited to have you on board. If you have any questions, feel free to reach out.',
      category: 'welcome',
      variables: ['name'],
      createdAt: new Date().toISOString(),
      usageCount: 15
    },
    {
      id: '2',
      name: 'Follow-up',
      content: 'Hi {{name}}, just following up on our conversation from {{date}}. Do you have any updates or questions?',
      category: 'follow-up',
      variables: ['name', 'date'],
      createdAt: new Date().toISOString(),
      usageCount: 8
    },
    {
      id: '3',
      name: 'Appointment Reminder',
      content: 'Hi {{name}}, this is a friendly reminder about your appointment on {{date}} at {{time}}. Please let us know if you need to reschedule.',
      category: 'appointment',
      variables: ['name', 'date', 'time'],
      createdAt: new Date().toISOString(),
      usageCount: 25
    },
    {
      id: '4',
      name: 'Thank You',
      content: 'Thank you {{name}} for choosing our service! We appreciate your business and look forward to serving you again.',
      category: 'general',
      variables: ['name'],
      createdAt: new Date().toISOString(),
      usageCount: 12
    }
  ];

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2).trim()) : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const variables = extractVariables(formData.content);
    const templateData = {
      ...formData,
      variables,
      id: editingTemplate?.id || Date.now().toString(),
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
      usageCount: editingTemplate?.usageCount || 0
    };

    try {
      if (editingTemplate) {
        // Update existing template
        const updatedTemplates = templates.map(t =>
          t.id === editingTemplate.id ? templateData : t
        );
        setTemplates(updatedTemplates);
        toast.success('Template updated successfully');
      } else {
        // Create new template
        setTemplates([...templates, templateData]);
        toast.success('Template created successfully');
      }

      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error saving template');
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
      toast.success('Template deleted');
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    // Increment usage count
    const updatedTemplates = templates.map(t =>
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    setTemplates(updatedTemplates);

    onTemplateSelect(template);
    toast.success('Template selected');
  };

  const handleInsertTemplate = (template: MessageTemplate) => {
    if (onTemplateInsert) {
      onTemplateInsert(template.content);
      toast.success('Template inserted');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', content: '', category: 'general' });
    setEditingTemplate(null);
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Template copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy template');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Message Templates</h3>
        </div>
        
        <Button 
          size="sm" 
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
              <DialogDescription>
                Create reusable message templates with variables like {'{{name}}'} or {'{{date}}'}.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Message"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Input
                    id="template-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., welcome, follow-up"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-content">Message Content</Label>
                <Textarea
                  id="template-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Hi {{name}}, thank you for..."
                  rows={4}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use {'{{variable}}'} for dynamic content. Variables found: {extractVariables(formData.content).join(', ') || 'None'}
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-3">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No templates found</p>
              {searchQuery && (
                <p className="text-sm">Try a different search term</p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                    
                    {template.variables.length > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-xs text-gray-500">Variables:</span>
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {'{{'}{variable}{'}}'}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Used {template.usageCount} times
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                  >
                    Use Template
                  </Button>
                  
                  {showInsertButton && onTemplateInsert && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInsertTemplate(template)}
                    >
                      Insert
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(template.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageTemplates;
