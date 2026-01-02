import React, { useState, useEffect } from 'react';
import { X, Mail, Send, AlertCircle } from 'lucide-react';

interface EmailComposeModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    clientEmail: string | null;
    leadProduct: string;
}

const DEFAULT_EMAIL_TEMPLATE = `Dear Sir,
 
Greetings from Crystal Group (Cold Chain Containers) !!
 
I hope this email finds you well, Thanks for your valued enquiry given on our website for Cafe Container and 40ft Reefer Used Container.

I will share with you details soon.

We're Excited To Share Our Brochure – Your One-Stop Guide To Crystal Group's Cold Chain Solutions! 
Crystal Group Offers: 🚚❄️

Reefer & Super Freezer Containers 🥶
Blast Freezers & Cold Rooms ❄️
Reefer Trucks & ISO Tanks 🚛
Scalable Cold Storage 📦
Customised Containers & Dry Storage 🏭
Freight Forwarding 🌍
Trusted Since 1962 By FMCG, Pharma, Dairy & More. 

Let's Keep Your Products Fresh And Safe! 

Looking Forward To Your Feedback. 💬

Attachment: Please click the below links for Company Brief & Profile 👇

Company Profile: https://linktr.ee/crystallogisticcoolchain?lt_utm_source=lt_share_link#484303228

Company Brief: https://linktr.ee/crystallogisticcoolchain#484299689




Thanks & Regards,`;

export const EmailComposeModal: React.FC<EmailComposeModalProps> = ({
    isOpen,
    onClose,
    clientName,
    clientEmail,
    leadProduct
}) => {
    const [userEmail, setUserEmail] = useState('');
    const [toEmail, setToEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState(DEFAULT_EMAIL_TEMPLATE);

    // Load persisted user email on mount
    useEffect(() => {
        const savedUserEmail = localStorage.getItem('user_email');
        if (savedUserEmail) {
            setUserEmail(savedUserEmail);
        }
    }, []);

    // Update client email and subject when modal opens
    useEffect(() => {
        if (isOpen) {
            setToEmail(clientEmail || '');
            setSubject(`Crystal Group - Cold Chain Solutions for ${clientName} | ${leadProduct}`);
        }
    }, [isOpen, clientEmail, clientName, leadProduct]);

    // Save user email to localStorage whenever it changes
    const handleUserEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const email = e.target.value;
        setUserEmail(email);
        if (email) {
            localStorage.setItem('user_email', email);
        }
    };

    // Handle opening in Gmail compose
    const handleOpenInEmailClient = () => {
        if (!toEmail) {
            alert('Please enter a client email address');
            return;
        }

        // Create Gmail compose URL with pre-filled fields
        const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        // Open Gmail in a new tab
        window.open(gmailComposeUrl, '_blank');

        // Close modal after opening Gmail
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-3xl bg-card shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border p-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Compose Email</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* User Email */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Your Email Address *
                        </label>
                        <input
                            type="email"
                            value={userEmail}
                            onChange={handleUserEmailChange}
                            placeholder="your.email@crystalgroup.com"
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            This will be saved for future emails
                        </p>
                    </div>

                    {/* Client Email */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            To: {clientName} *
                        </label>
                        <input
                            type="email"
                            value={toEmail}
                            onChange={(e) => setToEmail(e.target.value)}
                            placeholder="client@example.com"
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            required
                        />
                        {!clientEmail && (
                            <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-amber-900">Email Address Missing</p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        This lead doesn't have a valid email address. Please add an email before sending.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Subject *
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject"
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Message Body */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Message Body *
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={16}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            You can edit the message template as needed
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border p-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        This will open Gmail compose in a new tab
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleOpenInEmailClient}
                            disabled={!toEmail || !userEmail}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Open in Email Client
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

