/**
 * Converts a QR "type" + structured data object into the raw string
 * that actually gets encoded into the QR image.
 *
 * For STATIC QR codes, this string is embedded directly.
 * For DYNAMIC QR codes, the QR image instead encodes a short redirect URL
 * (BASE_URL/r/:shortCode), and the server resolves that short code to
 * whichever of these strings is currently configured - allowing the
 * destination to change without regenerating the QR image.
 */

function buildEncodedString(type, data) {
  switch (type) {
    case 'url':
      return data.url;

    case 'text':
      return data.text;

    case 'wifi': {
      // WIFI:T:WPA;S:mynetwork;P:mypassword;H:false;;
      const { ssid, password = '', encryption = 'WPA', hidden = false } = data;
      return `WIFI:T:${encryption};S:${escapeWifi(ssid)};P:${escapeWifi(password)};H:${hidden ? 'true' : 'false'};;`;
    }

    case 'vcard': {
      // Digital business card
      const { name, org = '', title = '', phone = '', email = '', website = '', address = '' } = data;
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${name}`,
        `FN:${name}`,
        org && `ORG:${org}`,
        title && `TITLE:${title}`,
        phone && `TEL;TYPE=CELL:${phone}`,
        email && `EMAIL:${email}`,
        website && `URL:${website}`,
        address && `ADR:;;${address}`,
        'END:VCARD',
      ].filter(Boolean).join('\n');
    }

    case 'whatsapp': {
      const { phone, message = '' } = data;
      const cleanPhone = phone.replace(/[^\d]/g, '');
      return `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    }

    case 'phone':
      return `tel:${data.phone}`;

    case 'email': {
      const { to, subject = '', body = '' } = data;
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (body) params.set('body', body);
      const qs = params.toString();
      return `mailto:${to}${qs ? `?${qs}` : ''}`;
    }

    case 'sms': {
      const { phone, message = '' } = data;
      return `sms:${phone}${message ? `?body=${encodeURIComponent(message)}` : ''}`;
    }

    case 'geo': {
      // Google Maps location
      const { lat, lng, query } = data;
      if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    case 'upi': {
      const { payeeVpa, payeeName, amount = '', note = '' } = data;
      const params = new URLSearchParams({ pa: payeeVpa, pn: payeeName });
      if (amount) params.set('am', amount);
      if (note) params.set('tn', note);
      return `upi://pay?${params.toString()}`;
    }

    case 'file':
    case 'image':
    case 'video':
    case 'pdf':
      return data.fileUrl;

    case 'multilink':
      // Multi-link QR always resolves through the dynamic redirect landing page
      return data.landingPageNote || 'Multi-destination link';

    default:
      throw Object.assign(new Error(`Unsupported QR type: ${type}`), { status: 400 });
  }
}

function escapeWifi(str) {
  return String(str).replace(/([\\;,:"])/g, '\\$1');
}

module.exports = { buildEncodedString };
