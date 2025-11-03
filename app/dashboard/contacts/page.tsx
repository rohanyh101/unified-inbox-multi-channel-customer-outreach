"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, Plus, Edit, MessageSquare, Eye, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ContactProfileModal from "@/components/ContactProfileModal";
import MessageSchedulerModal from "@/components/MessageSchedulerModal";

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
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);

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
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.phone && !formData.email) {
      toast.error("Either phone or email is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success("Contact added successfully!");
        setFormData({ name: "", phone: "", email: "" });
        setShowAddForm(false);
        fetchContacts();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add contact");
      }
    } catch (error) {
      toast.error("Failed to add contact");
    } finally {
      setLoading(false);
    }
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
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowSchedulerModal(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule
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

      {/* Message Scheduler Modal */}
      <MessageSchedulerModal
        open={showSchedulerModal}
        onOpenChange={(open) => {
          setShowSchedulerModal(open);
          if (!open) setSelectedContact(null);
        }}
        contacts={contacts}
        selectedContactId={selectedContact?.id}
        onScheduled={() => {
          toast.success("Message scheduled successfully!")
        }}
      />
    </div>
  );
}
