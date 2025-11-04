"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, Plus, Edit, MessageSquare, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ContactProfileModal from "@/components/ContactProfileModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  socialHandles?: any;
  createdAt: string;
  updatedAt: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  
  // Modal state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        // The API returns { contacts: [], pagination: {} }
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setContacts([]);
    }
  };

  const addContact = async () => {
    // Validate name
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Validate phone is required
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    // Validate email is required
    if (!formData.email.trim()) {
      toast.error("Email address is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate phone format
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    setLoading(true);
    try {
      // Prepare payload - only send non-empty strings
      const payload: any = {
        name: formData.name.trim()
      };
      
      if (formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }
      
      if (formData.email.trim()) {
        payload.email = formData.email.trim();
      }

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Contact added successfully!");
        setFormData({ name: "", phone: "", email: "" });
        setShowAddForm(false);
        fetchContacts();
      } else {
        const errorData = await response.json();
        if (errorData.error && Array.isArray(errorData.error)) {
          // Handle Zod validation errors
          const errorMessages = errorData.error.map((err: any) => err.message).join(", ");
          toast.error(`Validation error: ${errorMessages}`);
        } else {
          toast.error(errorData.message || "Failed to add contact");
        }
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error("Failed to add contact");
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async () => {
    if (!contactToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`${contactToDelete.name} has been deleted`);
        setShowDeleteDialog(false);
        setContactToDelete(null);
        fetchContacts();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete contact");
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error("Failed to delete contact");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteDialog(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Contact Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Contact name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addContact} disabled={loading}>
                  {loading ? "Adding..." : "Add Contact"}
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contact.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        Added {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowProfileModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/messages?contact=${contact.id}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteClick(contact)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {contacts.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first contact.</p>
            <div className="mt-6">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Contact Profile Modal */}
      <ContactProfileModal
        contact={selectedContact}
        open={showProfileModal}
        onOpenChange={(open) => {
          setShowProfileModal(open);
          if (!open) setSelectedContact(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{contactToDelete?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 mt-4">
            <strong>Warning:</strong> This will permanently delete the contact and all associated chat history. This action cannot be undone.
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setContactToDelete(null);
              }}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={deleteContact}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
