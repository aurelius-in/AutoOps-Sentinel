import React from 'react';

type CardProps = { title: string; value: string };

const Card: React.FC<CardProps> = ({ title, value }) => (
  <div style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, minWidth: 160 }}>
    <div style={{ color: '#666' }}>{title}</div>
    <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
  </div>
);

const StatusCards: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Card title="CPU" value="OK" />
      <Card title="Errors" value="OK" />
      <Card title="Latency" value="OK" />
      <Card title="Cost Avoided" value="$0" />
    </div>
  );
};

export default StatusCards;


