import React, { useState } from 'react';
import { X, Save, Building2, User, Phone, Mail, MapPin, Package, AlertCircle } from 'lucide-react';
import { createLead, checkDuplicate } from '../../lib/api';

interface AddLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        client_company: '',
        client_person: '',
        client_number: '',
        client_email: '',
        product: '',
        location: '',
        lead_source: 'Direct',
        lead_owner: '',
        remarks: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear warnings on change
        if (duplicateWarning && (name === 'client_number' || name === 'client_company')) {
            setDuplicateWarning(null);
        }
    };

    const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if ((name === 'client_number' || name === 'client_company') && value.length > 3) {
            try {
                const check = await checkDuplicate(
                    name === 'client_number' ? value : undefined,
                    name === 'client_company' ? value : undefined
                );

                if (check.data.isDuplicate) {
                    setDuplicateWarning(
                        `Potential duplicate: ${check.data.existingLeads?.[0]?.client_company || 'Unknown'} (${check.data.existingLeads?.[0]?.lead_id})`
                    );
                }
            } catch (err) {
                // Ignore silent duplicate check errors
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await createLead(formData);

            if (result.success) {
                onSuccess();
                onClose();
                // Reset form
                setFormData({
                    client_company: '',
                    client_person: '',
                    client_number: '',
                    client_email: '',
                    product: '',
                    location: '',
                    lead_source: 'Direct',
                    lead_owner: '',
                    remarks: ''
                });
            } else if (result.duplicate) {
                setDuplicateWarning('This lead already exists. Please check the duplicate warning.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create lead');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-primary/5 border-b border-border p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Add New Lead</h2>
                        <p className="text-sm text-muted-foreground mt-1">Enter lead details manually</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {duplicateWarning && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-800">
                            <AlertCircle className="w-4 h-4" />
                            {duplicateWarning}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company & Contact */}
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-foreground mb-1 block">Company Name *</span>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        name="client_company"
                                        required
                                        value={formData.client_company}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Acme Corp"
                                    />
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-foreground mb-1 block">Contact Person</span>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        name="client_person"
                                        value={formData.client_person}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </label>
                        </div>

                        {/* Phone & Email */}
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-foreground mb-1 block">Phone Number *</span>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        name="client_number"
                                        required
                                        value={formData.client_number}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-foreground mb-1 block">Email Address</span>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="email"
                                        name="client_email"
                                        value={formData.client_email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="john@acme.com"
                                    />
                                </div>
                            </label>
                        </div>

                        {/* Product & Location */}
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-foreground mb-1 block">Product Interest</span>
                                <div className="relative">
                                    <Package className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        name="product"
                                        value={formData.product}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Industrial Pump"
                                    />
                                </div>
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-foreground mb-1 block">Location / City</span>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Mumbai, MH"
                                    />
                                </div>
                            </label>
                        </div>

                        {/* Owner & Source */}
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-sm font-medium text-foreground mb-1 block">Assigned Owner</span>
                                <select
                                    name="lead_owner"
                                    value={formData.lead_owner}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="">Select Owner</option>
                                    <option value="Agent Smith">Agent Smith</option>
                                    <option value="Agent Jones">Agent Jones</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="text-sm font-medium text-foreground mb-1 block">Source</span>
                                <select
                                    name="lead_source"
                                    value={formData.lead_source}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    <option value="Direct Call">Direct Call</option>
                                    <option value="Website">Website</option>
                                    <option value="IndiaMart">IndiaMart</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-sm font-medium text-foreground mb-1 block">Remarks</span>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none h-20 resize-none"
                            placeholder="Initial call notes..."
                        />
                    </label>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create Lead
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
