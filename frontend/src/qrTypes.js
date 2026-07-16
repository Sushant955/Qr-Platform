export const QR_TYPES = [
  {
    key: 'url', label: 'Website', icon: 'Globe', supportsDynamic: true,
    fields: [{ name: 'url', label: 'Website URL', placeholder: 'https://example.com', type: 'url', required: true }],
  },
  {
    key: 'text', label: 'Plain Text', icon: 'Type', supportsDynamic: false,
    fields: [{ name: 'text', label: 'Text content', type: 'textarea', required: true }],
  },
  {
    key: 'wifi', label: 'Wi-Fi', icon: 'Wifi', supportsDynamic: false,
    fields: [
      { name: 'ssid', label: 'Network name (SSID)', required: true },
      { name: 'password', label: 'Password' },
      { name: 'encryption', label: 'Encryption', type: 'select', options: ['WPA', 'WEP', 'nopass'], default: 'WPA' },
    ],
  },
  {
    key: 'vcard', label: 'Digital Business Card', icon: 'IdCard', supportsDynamic: true,
    fields: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'title', label: 'Job title' },
      { name: 'org', label: 'Company' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'website', label: 'Website', type: 'url' },
      { name: 'address', label: 'Address' },
    ],
  },
  {
    key: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', supportsDynamic: true,
    fields: [
      { name: 'phone', label: 'Phone (with country code)', placeholder: '911234567890', required: true },
      { name: 'message', label: 'Pre-filled message' },
    ],
  },
  {
    key: 'phone', label: 'Phone Call', icon: 'Phone', supportsDynamic: true,
    fields: [{ name: 'phone', label: 'Phone number', required: true }],
  },
  {
    key: 'email', label: 'Email', icon: 'Mail', supportsDynamic: true,
    fields: [
      { name: 'to', label: 'Recipient email', type: 'email', required: true },
      { name: 'subject', label: 'Subject' },
      { name: 'body', label: 'Message body', type: 'textarea' },
    ],
  },
  {
    key: 'sms', label: 'SMS', icon: 'MessageSquare', supportsDynamic: true,
    fields: [
      { name: 'phone', label: 'Phone number', required: true },
      { name: 'message', label: 'Message' },
    ],
  },
  {
    key: 'geo', label: 'Google Maps', icon: 'MapPin', supportsDynamic: true,
    fields: [{ name: 'query', label: 'Address or place name', placeholder: 'MITS, Madanapalli', required: true }],
  },
  {
    key: 'upi', label: 'UPI Payment', icon: 'IndianRupee', supportsDynamic: false,
    fields: [
      { name: 'payeeVpa', label: 'UPI ID (VPA)', placeholder: 'name@upi', required: true },
      { name: 'payeeName', label: 'Payee name', required: true },
      { name: 'amount', label: 'Amount (optional)' },
      { name: 'note', label: 'Note' },
    ],
  },
  {
    key: 'file', label: 'File / PDF', icon: 'FileText', supportsDynamic: true,
    fields: [{ name: 'fileUrl', label: 'File', type: 'file', required: true }],
  },
  {
    key: 'image', label: 'Image', icon: 'Image', supportsDynamic: true,
    fields: [{ name: 'fileUrl', label: 'Image', type: 'file', required: true }],
  },
  {
    key: 'video', label: 'Video', icon: 'Video', supportsDynamic: true,
    fields: [{ name: 'fileUrl', label: 'Video', type: 'file', required: true }],
  },
  {
    key: 'multilink', label: 'Multi-Link', icon: 'Link', supportsDynamic: true, alwaysDynamic: true,
    fields: [],
  },
];

export function getQrType(key) {
  return QR_TYPES.find((t) => t.key === key) || QR_TYPES[0];
}
