import * as Icons from 'lucide-react';

export default function DynamicIcon({ name, ...props }) {
  const Icon = Icons[name] || Icons.QrCode;
  return <Icon {...props} />;
}
